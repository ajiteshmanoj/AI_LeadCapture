import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { autoOnPrimary } from "@/lib/branding/contrast";

export const runtime = "nodejs";

interface PaletteBody {
  branding?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    logo_url?: string;
    on_primary?: string;
  };
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const { data: membership } = await adminClient()
    .from("org_members").select("org_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  const body = (await req.json()) as PaletteBody;
  const incoming = body.branding ?? {};

  const { data: org } = await adminClient().from("organisations").select("settings").eq("id", membership.org_id).single();
  const settings = (org?.settings ?? {}) as Record<string, unknown>;
  const existing = (settings.branding ?? {}) as Record<string, string>;

  const updated = { ...existing, ...incoming };

  // Auto-derive on_primary for accessibility.
  if (updated.primary) {
    updated.on_primary = autoOnPrimary(updated.primary);
  }

  // Mirror primary to legacy primary_color field so the widget still works.
  const newSettings = {
    ...settings,
    branding: updated,
    ...(updated.primary ? { primary_color: updated.primary } : {}),
  };

  const { error } = await adminClient()
    .from("organisations")
    .update({ settings: newSettings })
    .eq("id", membership.org_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
