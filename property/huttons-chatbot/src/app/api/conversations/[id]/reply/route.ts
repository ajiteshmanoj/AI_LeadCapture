import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendChannelReply } from "@/lib/chat/channels";
import type { Channel } from "@/types";

export const runtime = "nodejs";

interface ReplyBody {
  text?: string;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const { data: membership } = await adminClient()
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership?.org_id) {
    return NextResponse.json({ error: "No org for user" }, { status: 403 });
  }

  let body: ReplyBody;
  try {
    body = (await req.json()) as ReplyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = body.text?.trim();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const { data: conv } = await adminClient()
    .from("conversations")
    .select("id, channel, channel_user_id, org_id")
    .eq("id", params.id)
    .eq("org_id", membership.org_id)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Send via the same channel abstraction the bot uses for outbound. Web
  // conversations have no outbound channel — the parent reads the reply when
  // they refresh / the widget polls (Phase 3 widget polling polish: TODO).
  const sent = await sendChannelReply(
    conv.org_id,
    conv.channel as Channel,
    conv.channel_user_id,
    text,
  );
  if (!sent.ok && conv.channel !== "web") {
    return NextResponse.json(
      { error: `Failed to send: ${sent.reason}` },
      { status: 502 },
    );
  }

  // Persist as an admin-role message so the dashboard can style it differently
  // from bot ('assistant') replies.
  const { error: msgErr } = await adminClient().from("messages").insert({
    conversation_id: params.id,
    role: "admin",
    content: text,
    metadata: { sent_by_user_id: user.id, channel_external_id: sent.externalMessageId },
  });
  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  await adminClient()
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", params.id);

  return NextResponse.json({ ok: true });
}
