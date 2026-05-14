import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const CODE_TTL_MIN = 10;

// POST → mint a fresh linking code for the caller's org. Returns the code +
// the bot username so the UI can render the exact /linkadmin command.
export async function POST() {
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

  const { data: org } = await adminClient()
    .from("organisations")
    .select("telegram_bot_token")
    .eq("id", membership.org_id)
    .single();
  if (!org?.telegram_bot_token) {
    return NextResponse.json(
      { error: "Connect your Telegram bot first." },
      { status: 400 },
    );
  }

  // 6-digit human-friendly code (still has 1-in-1M random per 10-min window).
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString();

  const { error } = await adminClient()
    .from("organisations")
    .update({
      admin_link_code: code,
      admin_link_code_expires_at: expiresAt,
    })
    .eq("id", membership.org_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    code,
    expires_in_seconds: CODE_TTL_MIN * 60,
  });
}

// DELETE → unlink admin (clears chat id + any pending code).
export async function DELETE() {
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

  const { error } = await adminClient()
    .from("organisations")
    .update({
      admin_telegram_chat_id: null,
      admin_link_code: null,
      admin_link_code_expires_at: null,
    })
    .eq("id", membership.org_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
