import { adminClient } from "@/lib/supabase/admin";
import { createTrialBookingEvent } from "@/lib/integrations/google-calendar";
import {
  notifyAdmin,
  formatBookingNotification,
  formatWaitlistNotification,
} from "@/lib/notifications/admin";

const BOOK_VIEWING_RE = /\[BOOK_VIEWING\]\s*(\{[\s\S]*?\})/;
const QUALIFY_LEAD_RE = /\[QUALIFY_LEAD\]\s*(\{[\s\S]*?\})/;
const ALERT_AGENT_RE = /\[ALERT_AGENT\]\s*(\{[\s\S]*?\})/;
const WAIT_RE = /\[ADD_TO_WAITLIST\]\s*(\{[\s\S]*?\})/;
const PAY_RE = /\[SEND_PAYMENT_LINK\]\s*(\{[\s\S]*?\})/;

interface BookViewingPayload {
  class_id: string;
  lead_name: string;
  contact_phone: string;
  contact_email?: string;
  budget_range?: string;
  citizenship_status?: 'SC' | 'PR' | 'Foreigner';
  lead_score?: 'hot' | 'warm' | 'cold';
  preferred_date?: string;
  preferred_time?: string;
}

interface QualifyLeadPayload {
  lead_name: string;
  lead_score: 'hot' | 'warm' | 'cold';
  budget_min?: number;
  budget_max?: number;
  citizenship_status?: 'SC' | 'PR' | 'Foreigner';
  preferred_property_type?: string[];
  preferred_district?: string[];
}

interface AlertAgentPayload {
  lead_name: string;
  contact_phone: string;
  budget?: string;
  property_interest?: string;
  urgency?: string;
}

export interface WaitlistActionPayload {
  class_id: string;
  student_name: string;
  parent_name?: string;
  parent_phone: string;
  parent_email?: string;
  level?: string;
}

export interface PaymentActionPayload {
  type: "registration" | "monthly" | "material" | "deposit";
  class_id?: string;
}

export interface ParsedActions {
  cleanReply: string;
  bookViewing: BookViewingPayload | null;
  qualifyLead: QualifyLeadPayload | null;
  alertAgent: AlertAgentPayload | null;
  waitlist: WaitlistActionPayload | null;
  paymentLink: PaymentActionPayload | null;
}

export function parseActions(reply: string): ParsedActions {
  let cleaned = reply;
  let bookViewing: BookViewingPayload | null = null;
  let qualifyLead: QualifyLeadPayload | null = null;
  let alertAgent: AlertAgentPayload | null = null;
  let waitlist: WaitlistActionPayload | null = null;
  let paymentLink: PaymentActionPayload | null = null;

  const bookMatch = reply.match(BOOK_VIEWING_RE);
  if (bookMatch) {
    try {
      bookViewing = JSON.parse(bookMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse BOOK_VIEWING", e);
    }
    cleaned = cleaned.replace(BOOK_VIEWING_RE, "").trim();
  }

  const qualifyMatch = reply.match(QUALIFY_LEAD_RE);
  if (qualifyMatch) {
    try {
      qualifyLead = JSON.parse(qualifyMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse QUALIFY_LEAD", e);
    }
    cleaned = cleaned.replace(QUALIFY_LEAD_RE, "").trim();
  }

  const alertMatch = reply.match(ALERT_AGENT_RE);
  if (alertMatch) {
    try {
      alertAgent = JSON.parse(alertMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse ALERT_AGENT", e);
    }
    cleaned = cleaned.replace(ALERT_AGENT_RE, "").trim();
  }

  const waitMatch = reply.match(WAIT_RE);
  if (waitMatch) {
    try {
      waitlist = JSON.parse(waitMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse ADD_TO_WAITLIST", e);
    }
    cleaned = cleaned.replace(WAIT_RE, "").trim();
  }

  const payMatch = reply.match(PAY_RE);
  if (payMatch) {
    try {
      paymentLink = JSON.parse(payMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse SEND_PAYMENT_LINK", e);
    }
    cleaned = cleaned.replace(PAY_RE, "").trim();
  }

  return { cleanReply: cleaned, bookViewing, qualifyLead, alertAgent, waitlist, paymentLink };
}

export async function executeBookViewing(
  orgId: string,
  conversationId: string,
  payload: BookViewingPayload,
  qualifyPayload?: QualifyLeadPayload | null,
): Promise<{
  ok: boolean;
  bookingId?: string;
  calendarEventId?: string;
  calendarError?: string;
  invitedAttendee?: boolean;
  error?: string;
}> {
  const sb = adminClient();

  const { data: cls, error: clsErr } = await sb
    .from("classes")
    .select(
      "id, subject, level, day_of_week, start_time, end_time, max_capacity, current_enrollment, is_active, teacher_name, org_id, location_id, property_type, asking_price, location:locations(id, name, address)",
    )
    .eq("id", payload.class_id)
    .eq("org_id", orgId)
    .single();
  if (clsErr || !cls) return { ok: false, error: "Listing not found" };
  if (!cls.is_active) return { ok: false, error: "Listing is inactive" };
  if (cls.current_enrollment >= cls.max_capacity)
    return { ok: false, error: "No viewing slots available" };

  const classLocation =
    (cls as unknown as { location?: { name: string; address: string | null } | null })
      .location ?? null;

  const leadName = payload.lead_name;
  const propertyTitle = cls.subject;

  // Build student record with lead qualification data
  const studentInsert: Record<string, unknown> = {
    org_id: orgId,
    student_name: leadName,
    parent_name: null,
    parent_phone: payload.contact_phone,
    parent_email: payload.contact_email ?? null,
    level: cls.level,
    status: "lead",
    lead_score: payload.lead_score ?? qualifyPayload?.lead_score ?? 'cold',
    citizenship_status: payload.citizenship_status ?? qualifyPayload?.citizenship_status ?? null,
    budget_min: qualifyPayload?.budget_min ?? null,
    budget_max: qualifyPayload?.budget_max ?? null,
    preferred_property_type: qualifyPayload?.preferred_property_type ?? null,
    preferred_district: qualifyPayload?.preferred_district ?? null,
    assigned_agent: cls.teacher_name ?? null,
  };

  const { data: student, error: studentErr } = await sb
    .from("students")
    .insert(studentInsert)
    .select("id")
    .single();
  if (studentErr || !student) {
    return { ok: false, error: studentErr?.message ?? "Failed to create lead" };
  }

  const bookingDate = payload.preferred_date ?? nextDateForDay(cls.day_of_week);

  let centreAddress = classLocation?.address ?? null;
  if (!centreAddress) {
    const { data: orgRow } = await sb
      .from("organisations")
      .select("address")
      .eq("id", orgId)
      .single();
    centreAddress = orgRow?.address ?? null;
  }

  const calendarResult = await createTrialBookingEvent({
    orgId,
    studentName: leadName,
    parentName: null,
    parentPhone: payload.contact_phone,
    parentEmail: payload.contact_email ?? null,
    subject: `Viewing: ${leadName} — ${propertyTitle}`,
    level: cls.level,
    teacherName: cls.teacher_name ?? null,
    bookingDate,
    startTime: cls.start_time,
    endTime: cls.end_time,
    centreAddress,
  });

  const calendarEventId =
    calendarResult.ok ? calendarResult.eventId : null;
  const invitedAttendee =
    calendarResult.ok ? calendarResult.invitedAttendee : false;
  const calendarError =
    !calendarResult.ok && calendarResult.reason !== "Calendar not connected"
      ? calendarResult.reason
      : undefined;

  const isLeadQualified = !!(qualifyPayload || payload.lead_score === 'hot' || payload.lead_score === 'warm');

  const { data: booking, error: bookErr } = await sb
    .from("bookings")
    .insert({
      org_id: orgId,
      student_id: student.id,
      class_id: cls.id,
      location_id: cls.location_id ?? null,
      booking_type: "viewing",
      booking_date: bookingDate,
      start_time: cls.start_time,
      end_time: cls.end_time,
      status: "confirmed",
      google_calendar_event_id: calendarEventId,
      agent_name: cls.teacher_name ?? null,
      viewing_address: centreAddress,
      lead_qualified: isLeadQualified,
    })
    .select("id")
    .single();
  if (bookErr || !booking) {
    return { ok: false, error: bookErr?.message ?? "Failed to create viewing" };
  }

  await sb
    .from("conversations")
    .update({ student_id: student.id })
    .eq("id", conversationId);

  const isHot = (payload.lead_score ?? qualifyPayload?.lead_score) === 'hot';
  const notifPrefix = isHot ? "🔥 HOT LEAD — " : "";

  notifyAdmin(
    orgId,
    `${notifPrefix}` + formatBookingNotification({
      studentName: leadName,
      parentName: null,
      parentPhone: payload.contact_phone,
      parentEmail: payload.contact_email ?? null,
      subject: propertyTitle,
      level: cls.level,
      centreName: classLocation?.name ?? null,
      bookingDate,
      startTime: cls.start_time,
      endTime: cls.end_time,
    }),
  ).catch((err) => console.warn("[notifyAdmin viewing]", err));

  return {
    ok: true,
    bookingId: booking.id,
    calendarEventId: calendarEventId ?? undefined,
    invitedAttendee,
    calendarError,
  };
}

export async function executeAddToWaitlist(
  orgId: string,
  conversationId: string,
  payload: WaitlistActionPayload,
): Promise<{ ok: boolean; position?: number; error?: string }> {
  const sb = adminClient();

  const { data: cls } = await sb
    .from("classes")
    .select("id, level, subject, is_active")
    .eq("id", payload.class_id)
    .eq("org_id", orgId)
    .single();
  if (!cls) return { ok: false, error: "Listing not found" };
  if (!cls.is_active) return { ok: false, error: "Listing is inactive" };

  const { data: student, error: studentErr } = await sb
    .from("students")
    .insert({
      org_id: orgId,
      student_name: payload.student_name,
      parent_name: payload.parent_name ?? null,
      parent_phone: payload.parent_phone,
      parent_email: payload.parent_email ?? null,
      level: payload.level ?? cls.level,
      status: "lead",
    })
    .select("id")
    .single();
  if (studentErr || !student) {
    return { ok: false, error: studentErr?.message ?? "Failed to create lead" };
  }

  const { count } = await sb
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .eq("class_id", cls.id)
    .eq("status", "waiting");
  const position = (count ?? 0) + 1;

  const { error: wlErr } = await sb.from("waitlist").insert({
    org_id: orgId,
    student_id: student.id,
    class_id: cls.id,
    position,
    status: "waiting",
  });
  if (wlErr) return { ok: false, error: wlErr.message };

  await sb
    .from("conversations")
    .update({ student_id: student.id })
    .eq("id", conversationId);

  notifyAdmin(
    orgId,
    formatWaitlistNotification({
      studentName: payload.student_name,
      parentName: payload.parent_name ?? null,
      parentPhone: payload.parent_phone,
      subject: cls.subject,
      level: cls.level,
      position,
    }),
  ).catch((err) => console.warn("[notifyAdmin waitlist]", err));

  return { ok: true, position };
}

function nextDateForDay(dayOfWeek: string): string {
  // Handle compound days like "Monday-Friday" — use next Monday
  const normalized = dayOfWeek.split(/[-–]/)[0].trim();
  const targetIdx = [
    "sunday","monday","tuesday","wednesday","thursday","friday","saturday",
  ].indexOf(normalized.toLowerCase());
  if (targetIdx < 0) return new Date().toISOString().slice(0, 10);
  const today = new Date();
  const currentIdx = today.getDay();
  let diff = targetIdx - currentIdx;
  if (diff <= 0) diff += 7;
  const target = new Date(today.getTime() + diff * 86400000);
  return target.toISOString().slice(0, 10);
}
