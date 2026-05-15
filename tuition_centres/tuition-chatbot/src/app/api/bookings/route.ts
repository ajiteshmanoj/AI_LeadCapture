import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { deleteEvent } from "@/lib/integrations/google-calendar";

export const runtime = "nodejs";

const PatchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["confirmed", "completed", "no_show", "cancelled"]),
});

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

export async function PATCH(request: NextRequest) {
  const orgId = await getCallerOrg();
  if (!orgId) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { id, status } = parsed.data;
  const sb = adminClient();

  // If cancelling, also remove the calendar event (if any).
  if (status === "cancelled") {
    const { data: existing } = await sb
      .from("bookings")
      .select("google_calendar_event_id")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (existing?.google_calendar_event_id) {
      await deleteEvent(orgId, existing.google_calendar_event_id);
    }
  }

  const { error } = await sb
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // When a trial is marked completed, start the lead nurture sequence.
  if (status === "completed") {
    const { data: booking } = await sb
      .from("bookings")
      .select("student_id, booking_type, conversations(id, channel)")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();

    if (booking?.student_id && booking.booking_type === "trial") {
      const conv = Array.isArray(booking.conversations)
        ? booking.conversations[0]
        : (booking.conversations as { id: string; channel: string } | null);

      const { error: nurtureErr } = await sb.from("lead_nurture").upsert(
        {
          org_id: orgId,
          booking_id: id,
          student_id: booking.student_id,
          conversation_id: conv?.id ?? null,
          channel: conv?.channel ?? "web",
          step: 0,
          next_followup_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          status: "active",
        },
        { onConflict: "booking_id", ignoreDuplicates: true },
      );
      if (nurtureErr) console.error("[bookings] lead nurture insert failed", nurtureErr);
    }
  }

  return NextResponse.json({ ok: true });
}
