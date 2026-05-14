import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { deleteWebhook } from "@/lib/integrations/telegram";

export const runtime = "nodejs";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

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

  // Best-effort: tell Telegram to drop the webhook. If the token is wrong or
  // the bot is already gone, we still clear our row so the org can re-connect.
  if (org?.telegram_bot_token) {
    await deleteWebhook(org.telegram_bot_token).catch(() => undefined);
  }

  const { error } = await adminClient()
    .from("organisations")
    .update({ telegram_bot_token: null, telegram_webhook_secret: null })
    .eq("id", membership.org_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
