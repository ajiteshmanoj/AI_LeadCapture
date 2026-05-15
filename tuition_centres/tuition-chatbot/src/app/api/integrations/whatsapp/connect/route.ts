import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { adminClient } from "@/lib/supabase/admin";
import twilio from "twilio";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await adminClient()
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();
  if (!member) return NextResponse.json({ error: "Not a member of any org" }, { status: 403 });

  const body = await req.json() as { account_sid?: string; auth_token?: string; from_number?: string };
  const { account_sid, auth_token, from_number } = body;

  if (!account_sid || !auth_token || !from_number) {
    return NextResponse.json({ error: "account_sid, auth_token, and from_number are required" }, { status: 400 });
  }

  // Validate credentials by fetching the account.
  try {
    const client = twilio(account_sid, auth_token);
    await client.api.accounts(account_sid).fetch();
  } catch {
    return NextResponse.json({ error: "Invalid Twilio credentials" }, { status: 400 });
  }

  const normalizedFrom = from_number.startsWith("whatsapp:") ? from_number : `whatsapp:${from_number}`;

  const { error } = await adminClient()
    .from("organisations")
    .update({
      twilio_account_sid: account_sid,
      twilio_auth_token: auth_token,
      twilio_whatsapp_from: normalizedFrom,
    })
    .eq("id", member.org_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: org } = await adminClient()
    .from("organisations")
    .select("slug")
    .eq("id", member.org_id)
    .single();

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp/${org?.slug}`;

  return NextResponse.json({ ok: true, webhook_url: webhookUrl });
}
