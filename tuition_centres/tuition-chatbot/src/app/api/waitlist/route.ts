import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const NotifySchema = z.object({
  action: z.literal("notify_first"),
  class_id: z.string().uuid(),
});

const StatusSchema = z.object({
  action: z.literal("set_status"),
  id: z.string().uuid(),
  status: z.enum(["waiting", "notified", "enrolled", "expired"]),
});

const Body = z.union([NotifySchema, StatusSchema]);

async function getCallerOrg(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await adminClient()
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  return data?.org_id ?? null;
}

export async function POST(request: NextRequest) {
  const orgId = await getCallerOrg();
  if (!orgId) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const sb = adminClient();
  const data = parsed.data;

  if (data.action === "notify_first") {
    const { data: first } = await sb
      .from("waitlist")
      .select("id, student_id, position")
      .eq("class_id", data.class_id)
      .eq("org_id", orgId)
      .eq("status", "waiting")
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!first) {
      return NextResponse.json({ ok: false, error: "No one on waitlist" }, { status: 404 });
    }
    const { error } = await sb
      .from("waitlist")
      .update({ status: "notified", notified_at: new Date().toISOString() })
      .eq("id", first.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // TODO Phase 3: send WhatsApp/Telegram notification to the parent.
    return NextResponse.json({ ok: true, waitlist_id: first.id });
  }

  if (data.action === "set_status") {
    const { error } = await sb
      .from("waitlist")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("org_id", orgId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
