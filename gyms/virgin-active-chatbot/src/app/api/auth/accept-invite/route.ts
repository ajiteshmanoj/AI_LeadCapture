import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const ipAttempts = new Map<string, { count: number; resetAt: number }>();

interface Body {
  token?: string;
  password?: string;
}

function getIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    ipAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const ip = getIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many attempts — try again in a minute." }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, password } = body;
  if (!token?.trim() || !password) {
    return NextResponse.json({ error: "token and password required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const sb = adminClient();

  const { data: org } = await sb
    .from("organisations")
    .select("id, invite_email, invite_expires_at, invite_accepted_at")
    .eq("invite_token", token.trim())
    .maybeSingle();

  if (!org) return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
  if (org.invite_accepted_at) return NextResponse.json({ error: "This invite has already been used." }, { status: 400 });
  if (org.invite_expires_at && new Date(org.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite has expired. Ask for a new one." }, { status: 400 });
  }

  // Create the Supabase auth user via service-role (bypasses email confirmation).
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email: org.invite_email!,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message ?? "Failed to create account" }, { status: 500 });
  }

  // Link to the org as admin.
  const { error: memberErr } = await sb.from("org_members").insert({
    org_id: org.id,
    user_id: created.user.id,
    role: "admin",
  });
  if (memberErr) {
    await sb.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  // Mark invite consumed.
  await sb.from("organisations").update({
    invite_accepted_at: new Date().toISOString(),
  }).eq("id", org.id);

  // Sign the user in so they're immediately logged in.
  const supabase = createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: org.invite_email!,
    password,
  });
  if (signInErr) {
    return NextResponse.json({ error: "Account created but sign-in failed — try /login" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
