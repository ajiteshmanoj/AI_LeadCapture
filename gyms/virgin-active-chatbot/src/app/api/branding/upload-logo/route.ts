import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const { data: membership } = await adminClient()
    .from("org_members").select("org_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  let formData: FormData;
  try { formData = await req.formData(); } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file field required" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPEG, WebP or SVG allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 2 MB)" }, { status: 400 });
  }

  const ext = file.type.split("/")[1].replace("svg+xml", "svg");
  const path = `${membership.org_id}/logo.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadErr } = await adminClient().storage
    .from("org-logos")
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = adminClient().storage.from("org-logos").getPublicUrl(path);

  // Persist to settings.branding.logo_url
  const { data: org } = await adminClient().from("organisations").select("settings").eq("id", membership.org_id).single();
  const settings = (org?.settings ?? {}) as Record<string, unknown>;
  const branding = (settings.branding ?? {}) as Record<string, string>;
  await adminClient().from("organisations").update({
    settings: { ...settings, branding: { ...branding, logo_url: publicUrl } },
  }).eq("id", membership.org_id);

  return NextResponse.json({ ok: true, url: publicUrl });
}
