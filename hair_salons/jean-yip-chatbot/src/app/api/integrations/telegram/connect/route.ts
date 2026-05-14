import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getMe, setWebhook } from "@/lib/integrations/telegram";

export const runtime = "nodejs";

interface ConnectBody {
  bot_token?: string;
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const { data: membership } = await adminClient()
    .from("org_members")
    .select("org_id, organisations(slug)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const orgId = membership?.org_id;
  const orgSlug = (membership as { organisations?: { slug: string } } | null)
    ?.organisations?.slug;
  if (!orgId || !orgSlug) {
    return NextResponse.json({ error: "No org for user" }, { status: 403 });
  }

  let body: ConnectBody;
  try {
    body = (await req.json()) as ConnectBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const botToken = body.bot_token?.trim();
  if (!botToken) {
    return NextResponse.json({ error: "bot_token required" }, { status: 400 });
  }

  // 1. Validate the token by asking Telegram who this bot is.
  const me = await getMe(botToken);
  if (!me) {
    return NextResponse.json(
      { error: "Telegram rejected this token. Double-check it from BotFather." },
      { status: 400 },
    );
  }

  // 2. Build the public webhook URL from NEXT_PUBLIC_APP_URL.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL not set on the server." },
      { status: 500 },
    );
  }
  if (appUrl.startsWith("http://localhost")) {
    return NextResponse.json(
      {
        error:
          "Telegram can't reach localhost. Expose your dev server with ngrok and set NEXT_PUBLIC_APP_URL to the ngrok URL before connecting.",
      },
      { status: 400 },
    );
  }
  const webhookUrl = `${appUrl}/api/webhooks/telegram/${orgSlug}`;

  // 3. Mint a fresh secret and register the webhook with Telegram.
  const secret = crypto.randomBytes(24).toString("hex");
  const setRes = await setWebhook(botToken, webhookUrl, secret);
  if (!setRes.ok) {
    return NextResponse.json(
      { error: `Telegram setWebhook failed: ${setRes.reason}` },
      { status: 502 },
    );
  }

  // 4. Persist token + secret + username on the org row.
  const { error: dbErr } = await adminClient()
    .from("organisations")
    .update({
      telegram_bot_token: botToken,
      telegram_webhook_secret: secret,
      telegram_bot_username: me.username,
    })
    .eq("id", orgId);
  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    bot: { id: me.id, username: me.username, first_name: me.first_name },
    webhook_url: webhookUrl,
  });
}
