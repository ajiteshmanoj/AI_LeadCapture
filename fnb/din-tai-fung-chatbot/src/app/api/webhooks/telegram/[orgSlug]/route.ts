import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { adminClient } from "@/lib/supabase/admin";
import { handleChat } from "@/lib/chat/engine";
import { sendChannelReply } from "@/lib/chat/channels";
import type { TelegramUpdate } from "@/lib/integrations/telegram";
import { TELEGRAM_PAYLOAD_RE } from "@/lib/notifications/parent-link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LINK_ADMIN_RE = /^\/linkadmin(?:@\w+)?\s+(\S+)/i;
const START_RE = /^\/start(?:@\w+)?(?:\s+(\S+))?/i;

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string } },
) {
  const orgSlug = params.orgSlug;

  // 1. Resolve org by slug.
  const { data: org } = await adminClient()
    .from("organisations")
    .select("id, slug, telegram_bot_token, telegram_webhook_secret")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Unknown org" }, { status: 404 });
  }

  // 2. Validate the secret Telegram echoes back. If our row has no secret yet
  //    (token never installed) reject — don't allow accidental open webhooks.
  const presentedSecret = req.headers.get("x-telegram-bot-api-secret-token");
  if (!org.telegram_webhook_secret || presentedSecret !== org.telegram_webhook_secret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  // 3. Parse the update. Always return 200 OK to Telegram even when there's
  //    nothing to do — Telegram will retry forever on non-2xx, which would
  //    spam us with stale updates after a transient issue.
  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!message?.text || !message.chat?.id) {
    // Non-text messages (stickers, photos, joins) — acknowledge and ignore.
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);

  // 4. Intercept admin-linking command before the chat engine sees it.
  const linkMatch = message.text.match(LINK_ADMIN_RE);
  if (linkMatch) {
    const code = linkMatch[1];
    const reply = await tryLinkAdmin(org.id, chatId, code);
    await sendChannelReply(org.id, "telegram", chatId, reply);
    return NextResponse.json({ ok: true });
  }

  // 5. Intercept `/start <payload>` deep-links from web booking confirmations.
  //    A bare `/start` (no payload) just falls through to the chat engine,
  //    which gives a normal greeting.
  const startMatch = message.text.match(START_RE);
  if (startMatch && startMatch[1]) {
    const payload = startMatch[1];
    const bookingMatch = payload.match(TELEGRAM_PAYLOAD_RE);
    if (bookingMatch) {
      const reply = await linkParentToBooking(org.id, chatId, bookingMatch[1]);
      await sendChannelReply(org.id, "telegram", chatId, reply);
      return NextResponse.json({ ok: true });
    }
  }

  // 6. Run the chat engine in the background so we can return 200 immediately.
  //    Telegram retries any webhook that doesn't respond within 60 seconds,
  //    which causes duplicate messages if the LLM call is slow. waitUntil
  //    keeps the serverless function alive until the work finishes without
  //    blocking the HTTP response.
  waitUntil(
    handleChat({
      org_id: org.id,
      channel: "telegram",
      channel_user_id: chatId,
      message: message.text,
    })
      .then((reply) => sendChannelReply(org.id, "telegram", chatId, reply.reply))
      .then((sent) => {
        if (!sent.ok) console.error("[telegram webhook] send failed", sent.reason);
      })
      .catch(async (err) => {
        console.error("[telegram webhook] handleChat error", err);
        await sendChannelReply(
          org.id,
          "telegram",
          chatId,
          "Sorry, something went wrong on our end. Please try again in a moment, or call the centre directly.",
        ).catch(() => undefined);
      }),
  );

  return NextResponse.json({ ok: true });
}

async function linkParentToBooking(
  orgId: string,
  chatId: string,
  bookingId: string,
): Promise<string> {
  const sb = adminClient();
  const { data: booking } = await sb
    .from("bookings")
    .select("id, student_id, students(student_name)")
    .eq("id", bookingId)
    .eq("org_id", orgId)
    .single();

  if (!booking?.student_id) {
    return "Hmm, I couldn't find that booking. If you just booked on the website, give it a moment and try the link again.";
  }

  const { error } = await sb
    .from("students")
    .update({ telegram_chat_id: chatId })
    .eq("id", booking.student_id);
  if (error) {
    return `Sorry, couldn't link your chat: ${error.message}`;
  }

  const studentName =
    (booking as unknown as { students?: { student_name: string } }).students
      ?.student_name ?? "your child";
  return `✅ You're linked. I'll send reminders and updates here for ${studentName}'s trial. Feel free to ask anything in the meantime!`;
}

async function tryLinkAdmin(
  orgId: string,
  chatId: string,
  code: string,
): Promise<string> {
  const sb = adminClient();
  const { data: row } = await sb
    .from("organisations")
    .select("admin_link_code, admin_link_code_expires_at")
    .eq("id", orgId)
    .single();

  if (!row?.admin_link_code) {
    return "No active linking code for this centre. Generate one in the dashboard first.";
  }
  if (row.admin_link_code !== code) {
    return "That code didn't match. Double-check the dashboard, or generate a fresh one.";
  }
  if (
    row.admin_link_code_expires_at &&
    new Date(row.admin_link_code_expires_at) < new Date()
  ) {
    return "That code has expired. Generate a new one in the dashboard.";
  }

  const { error } = await sb
    .from("organisations")
    .update({
      admin_telegram_chat_id: chatId,
      admin_link_code: null,
      admin_link_code_expires_at: null,
    })
    .eq("id", orgId);
  if (error) {
    return `Sorry, couldn't save the link: ${error.message}`;
  }

  return "✅ You're linked. You'll get a ping here whenever a new trial booking, waitlist entry or escalation comes in.";
}
