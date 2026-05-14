import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const runtime = "nodejs";

interface InviteBody {
  centre_name?: string;
  slug?: string;
  admin_email?: string;
}

export async function POST(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: InviteBody;
  try {
    body = (await req.json()) as InviteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { centre_name, slug, admin_email } = body;
  if (!centre_name?.trim() || !slug?.trim() || !admin_email?.trim()) {
    return NextResponse.json(
      { error: "centre_name, slug and admin_email are required" },
      { status: 400 },
    );
  }

  // Check slug uniqueness.
  const { data: existing } = await adminClient()
    .from("organisations")
    .select("id")
    .eq("slug", slug.trim())
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const { data: crypto } = await adminClient().rpc("gen_invite_token");
  // Fallback if RPC not available — generate in JS.
  const token = (crypto as string | null) ?? generateToken();

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: org, error } = await adminClient()
    .from("organisations")
    .insert({
      name: centre_name.trim(),
      slug: slug.trim(),
      invite_token: token,
      invite_email: admin_email.trim(),
      invite_expires_at: expiresAt,
      is_onboarded: false,
    })
    .select("id, slug")
    .single();

  if (error || !org) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const signupUrl = `${appUrl}/signup/${token}`;

  return NextResponse.json({ ok: true, signup_url: signupUrl, org_id: org.id });
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
