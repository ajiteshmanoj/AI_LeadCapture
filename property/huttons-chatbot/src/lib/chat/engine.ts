import OpenAI from "openai";
import { adminClient } from "@/lib/supabase/admin";
import {
  retrieveChunks,
  loadActiveClasses,
  loadActiveListings,
  loadActiveLocations,
  loadFaqs,
  findRelevantFaqs,
} from "./rag";
import { buildSystemPrompt } from "./prompts";
import { classifyIntent, isEscalation, isOptOut } from "./intents";
import { parseActions, executeBookViewing, executeAddToWaitlist } from "./actions";
import { buildParentOptInLinks } from "@/lib/notifications/parent-link";
import { notifyAdmin } from "@/lib/notifications/admin";
import type {
  ChatRequest,
  ChatResponse,
  Conversation,
  Message,
  Organisation,
} from "@/types";

const CHAT_MODEL = "gpt-4o";
const HISTORY_LIMIT = 10;

let openaiClient: OpenAI | null = null;
function openai() {
  if (!openaiClient)
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
}

export async function handleChat(req: ChatRequest): Promise<ChatResponse> {
  const sb = adminClient();

  // 1. Load org
  const { data: orgRow, error: orgErr } = await sb
    .from("organisations")
    .select("*")
    .eq("id", req.org_id)
    .single();
  if (orgErr || !orgRow) throw new Error(`Organisation not found: ${req.org_id}`);
  const org = orgRow as Organisation;

  // 2. Resolve / create conversation
  const conversation = await resolveConversation(req);

  // 2a. Bot is paused for this conversation — admin has taken over (or it's
  //     already closed). Persist the parent's message so the admin sees it,
  //     send a brief static acknowledgement, and skip the LLM entirely.
  if (conversation.status === "escalated" || conversation.status === "closed") {
    const intent = classifyIntent(req.message);
    const ack =
      conversation.status === "escalated"
        ? "Thanks — a real person will get back to you shortly."
        : "This chat has been closed. If you need anything, please reach out to the centre directly.";
    await persistMessages(conversation.id, req.message, ack, intent, {
      paused_reason: conversation.status,
    });
    // Re-ping the admin so they're nudged about the new message.
    if (conversation.status === "escalated") {
      notifyAdmin(
        req.org_id,
        [
          "💬 *Parent replied during takeover*",
          `Channel: ${req.channel}`,
          `Message: ${req.message.slice(0, 240)}`,
          appUrlOrPlaceholder(`/dashboard/conversations/${conversation.id}`),
        ].join("\n"),
      ).catch((err) => console.warn("[notifyAdmin paused]", err));
    }
    return {
      conversation_id: conversation.id,
      reply: ack,
      intent,
    };
  }

  // 3. Handle PDPA opt-out
  if (isOptOut(req.message)) {
    await sb
      .from("conversations")
      .update({ status: "closed", last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);
    const optOutReply =
      "Got it — I've stopped this chat. Your details won't be used further. Reach out anytime if you need help. 😊";
    await persistMessages(conversation.id, req.message, optOutReply, "other");
    return {
      conversation_id: conversation.id,
      reply: optOutReply,
      intent: "other",
    };
  }

  // 4. Classify intent (heuristic, used for analytics + steering)
  const intent = classifyIntent(req.message);

  // 5. Retrieve context in parallel
  const [chunks, classes, listings, locations, faqs] = await Promise.all([
    retrieveChunks(req.org_id, req.message, 8),
    loadActiveClasses(req.org_id),
    loadActiveListings(req.org_id),
    loadActiveLocations(req.org_id),
    loadFaqs(req.org_id),
  ]);
  const matchedFaqs = findRelevantFaqs(faqs, req.message, 3);

  // 6. Load recent history
  const { data: historyRows } = await sb
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  const history = (historyRows ?? [])
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // 7. Build prompt + call OpenAI
  const systemPrompt = buildSystemPrompt({
    org,
    classes,
    listings,
    locations,
    faqs: matchedFaqs,
    chunks,
  });

  const start = Date.now();
  const completion = await openai().chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: req.message },
    ],
    temperature: 0.7,
    max_tokens: 600,
  });
  const latencyMs = Date.now() - start;

  const rawReply = completion.choices[0]?.message?.content?.trim() ?? "";
  const { cleanReply, bookViewing, qualifyLead, waitlist } = parseActions(rawReply);

  // 8. Execute side-effect actions
  let finalReply = cleanReply || rawReply;
  let booked = false;
  let waitlistPosition: number | null = null;
  if (bookViewing) {
    const result = await executeBookViewing(req.org_id, conversation.id, bookViewing, qualifyLead);
    if (!result.ok) {
      finalReply = `${finalReply}\n\n(Sorry, I had trouble saving that viewing — ${result.error}. Could you call us at ${org.phone ?? "the office"} so we can sort it out?)`;
    } else {
      booked = true;
      const followups: string[] = [];

      if (result.invitedAttendee && bookViewing.contact_email) {
        followups.push(
          `📧 Calendar invite sent to ${bookViewing.contact_email} — accept it to add the viewing to your calendar.`,
        );
      }

      // Web/SMS bookers have no messaging connection yet. Surface deep links
      // to opt into Telegram (and WhatsApp later, when wired) so they can
      // receive reminders and lead-nurture follow-ups.
      if (req.channel === "web" && result.bookingId) {
        const links = await buildParentOptInLinks(req.org_id, result.bookingId);
        for (const link of links) {
          followups.push(`💬 ${link.label} → ${link.url}`);
        }
      }

      if (followups.length > 0) {
        finalReply = `${finalReply}\n\n———\n${followups.join("\n")}`;
      }
    }
  }
  if (waitlist) {
    const result = await executeAddToWaitlist(req.org_id, conversation.id, waitlist);
    if (!result.ok) {
      finalReply = `${finalReply}\n\n(Sorry, I had trouble adding you to the waitlist — ${result.error}. Please call us at ${org.phone ?? "the centre"}.)`;
    } else {
      waitlistPosition = result.position ?? null;
    }
  }

  // 9. Persist messages
  await persistMessages(conversation.id, req.message, finalReply, intent, {
    latency_ms: latencyMs,
    tokens: completion.usage,
    booked,
    waitlist_position: waitlistPosition,
  });

  // 10. Escalation ping. Trigger when the message reads as a complaint or an
  //     explicit ask for a human. Fire-and-forget — never blocks the reply.
  if (intent === "complaint" || isEscalation(req.message)) {
    notifyAdmin(
      req.org_id,
      [
        "🚨 *Parent escalation*",
        `Channel: ${req.channel}`,
        `Message: ${req.message.slice(0, 240)}`,
        `Bot reply: ${finalReply.slice(0, 200)}`,
        `View thread: ${appUrlOrPlaceholder(`/dashboard/conversations/${conversation.id}`)}`,
      ].join("\n"),
    ).catch((err) => console.warn("[notifyAdmin escalation]", err));
  }

  return {
    conversation_id: conversation.id,
    reply: finalReply,
    intent,
  };
}

function appUrlOrPlaceholder(path: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return appUrl
    ? `${appUrl}${path}`
    : "(set NEXT_PUBLIC_APP_URL to enable links)";
}

async function resolveConversation(req: ChatRequest): Promise<Conversation> {
  const sb = adminClient();
  if (req.conversation_id) {
    const { data, error } = await sb
      .from("conversations")
      .select("*")
      .eq("id", req.conversation_id)
      .eq("org_id", req.org_id)
      .single();
    if (!error && data) return data as Conversation;
  }
  if (req.channel_user_id) {
    const { data } = await sb
      .from("conversations")
      .select("*")
      .eq("org_id", req.org_id)
      .eq("channel", req.channel)
      .eq("channel_user_id", req.channel_user_id)
      .eq("status", "active")
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data as Conversation;
  }
  const { data, error } = await sb
    .from("conversations")
    .insert({
      org_id: req.org_id,
      channel: req.channel,
      channel_user_id: req.channel_user_id ?? null,
      status: "active",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`Could not create conversation: ${error?.message}`);
  return data as Conversation;
}

async function persistMessages(
  conversationId: string,
  userMsg: string,
  assistantMsg: string,
  intent: Message["intent"],
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const sb = adminClient();
  await sb.from("messages").insert([
    {
      conversation_id: conversationId,
      role: "user",
      content: userMsg,
      intent,
    },
    {
      conversation_id: conversationId,
      role: "assistant",
      content: assistantMsg,
      intent,
      metadata,
    },
  ]);
  await sb
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}
