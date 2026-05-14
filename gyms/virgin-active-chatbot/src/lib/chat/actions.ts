import { adminClient } from "@/lib/supabase/admin";
import { createTrialBookingEvent } from "@/lib/integrations/google-calendar";
import {
  notifyAdmin,
  formatBookingNotification,
  formatWaitlistNotification,
} from "@/lib/notifications/admin";

const BOOK_TRIAL_CLASS_RE = /\[BOOK_TRIAL_CLASS\]\s*(\{[\s\S]*?\})/;
const JOIN_WAITLIST_RE = /\[JOIN_WAITLIST\]\s*(\{[\s\S]*?\})/;
const ENQUIRE_MEMBERSHIP_RE = /\[ENQUIRE_MEMBERSHIP\]\s*(\{[\s\S]*?\})/;
// Keep backward-compatible alias for legacy [BOOK_TRIAL] tags
const BOOK_TRIAL_LEGACY_RE = /\[BOOK_TRIAL\]\s*(\{[\s\S]*?\})/;
// Keep backward-compatible alias for legacy [ADD_TO_WAITLIST] tags
const ADD_TO_WAITLIST_LEGACY_RE = /\[ADD_TO_WAITLIST\]\s*(\{[\s\S]*?\})/;
const PAY_RE = /\[SEND_PAYMENT_LINK\]\s*(\{[\s\S]*?\})/;

export interface BookActionPayload {
  class_id: string;
  member_name: string;
  contact_phone: string;
  contact_email?: string;
  fitness_level?: string;
  membership_interest?: string;
  preferred_date?: string;
  // Legacy field aliases (from tuition-chatbot era — kept for backward compat)
  student_name?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  level?: string;
}

export interface WaitlistActionPayload {
  class_id: string;
  member_name: string;
  contact_phone: string;
  contact_email?: string;
  fitness_level?: string;
  // Legacy field aliases
  student_name?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  level?: string;
}

export interface MembershipEnquiryPayload {
  tier?: string;
  member_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

export interface PaymentActionPayload {
  type: "registration" | "monthly" | "material" | "deposit";
  class_id?: string;
}

export interface ParsedActions {
  cleanReply: string;
  bookTrial: BookActionPayload | null;
  waitlist: WaitlistActionPayload | null;
  membershipEnquiry: MembershipEnquiryPayload | null;
  paymentLink: PaymentActionPayload | null;
}

export function parseActions(reply: string): ParsedActions {
  let cleaned = reply;
  let bookTrial: BookActionPayload | null = null;
  let waitlist: WaitlistActionPayload | null = null;
  let membershipEnquiry: MembershipEnquiryPayload | null = null;
  let paymentLink: PaymentActionPayload | null = null;

  // Try new gym action tag first, then legacy alias
  const bookMatch =
    reply.match(BOOK_TRIAL_CLASS_RE) ?? reply.match(BOOK_TRIAL_LEGACY_RE);
  if (bookMatch) {
    try {
      bookTrial = JSON.parse(bookMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse BOOK_TRIAL_CLASS", e);
    }
    cleaned = cleaned
      .replace(BOOK_TRIAL_CLASS_RE, "")
      .replace(BOOK_TRIAL_LEGACY_RE, "")
      .trim();
  }

  const waitMatch =
    reply.match(JOIN_WAITLIST_RE) ?? reply.match(ADD_TO_WAITLIST_LEGACY_RE);
  if (waitMatch) {
    try {
      waitlist = JSON.parse(waitMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse JOIN_WAITLIST", e);
    }
    cleaned = cleaned
      .replace(JOIN_WAITLIST_RE, "")
      .replace(ADD_TO_WAITLIST_LEGACY_RE, "")
      .trim();
  }

  const membershipMatch = reply.match(ENQUIRE_MEMBERSHIP_RE);
  if (membershipMatch) {
    try {
      membershipEnquiry = JSON.parse(membershipMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse ENQUIRE_MEMBERSHIP", e);
    }
    cleaned = cleaned.replace(ENQUIRE_MEMBERSHIP_RE, "").trim();
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

  return { cleanReply: cleaned, bookTrial, waitlist, membershipEnquiry, paymentLink };
}

/** Normalise payload — supports both new gym fields and legacy tuition fields. */
function normaliseMemberName(payload: BookActionPayload): string {
  return payload.member_name || payload.student_name || "Member";
}
function normalisePhone(payload: BookActionPayload | WaitlistActionPayload): string {
  return payload.contact_phone || payload.parent_phone || "";
}
function normaliseEmail(payload: BookActionPayload | WaitlistActionPayload): string | null {
  return payload.contact_email ?? payload.parent_email ?? null;
}

export async function executeBookTrial(
  orgId: string,
  conversationId: string,
  payload: BookActionPayload,
): Promise<{
  ok: boolean;
  bookingId?: string;
  calendarEventId?: string;
  calendarError?: string;
  invitedAttendee?: boolean;
  error?: string;
}> {
  const sb = adminClient();

  const memberName = normaliseMemberName(payload);
  const contactPhone = normalisePhone(payload);
  const contactEmail = normaliseEmail(payload);

  const { data: cls, error: clsErr } = await sb
    .from("classes")
    .select(
      "id, subject, level, day_of_week, start_time, end_time, max_capacity, current_enrollment, is_active, teacher_name, org_id, location_id, location:locations(id, name, address)",
    )
    .eq("id", payload.class_id)
    .eq("org_id", orgId)
    .single();
  if (clsErr || !cls) return { ok: false, error: "Class not found" };
  if (!cls.is_active) return { ok: false, error: "Class is inactive" };
  if (cls.current_enrollment >= cls.max_capacity)
    return { ok: false, error: "Class is full" };

  const classLocation =
    (cls as unknown as { location?: { name: string; address: string | null } | null })
      .location ?? null;

  const { data: student, error: studentErr } = await sb
    .from("students")
    .insert({
      org_id: orgId,
      student_name: memberName,
      parent_name: payload.parent_name ?? null,
      parent_phone: contactPhone,
      parent_email: contactEmail,
      level: payload.fitness_level ?? payload.level ?? cls.level,
      status: "trial",
    })
    .select("id")
    .single();
  if (studentErr || !student) {
    return { ok: false, error: studentErr?.message ?? "Failed to create member record" };
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

  const className = cls.subject;

  const calendarResult = await createTrialBookingEvent({
    orgId,
    studentName: memberName,
    parentName: payload.parent_name ?? null,
    parentPhone: contactPhone,
    parentEmail: contactEmail,
    subject: className,
    level: cls.level,
    teacherName: cls.teacher_name ?? null,
    bookingDate,
    startTime: cls.start_time,
    endTime: cls.end_time,
    centreAddress,
    // Pass calendar title override via description prefix
    calendarTitle: `Trial Class: ${memberName} — ${className}`,
  });

  const calendarEventId =
    calendarResult.ok ? calendarResult.eventId : null;
  const invitedAttendee =
    calendarResult.ok ? calendarResult.invitedAttendee : false;
  const calendarError =
    !calendarResult.ok && calendarResult.reason !== "Calendar not connected"
      ? calendarResult.reason
      : undefined;

  const { data: booking, error: bookErr } = await sb
    .from("bookings")
    .insert({
      org_id: orgId,
      student_id: student.id,
      class_id: cls.id,
      location_id: cls.location_id ?? null,
      booking_type: "trial_class",
      booking_date: bookingDate,
      start_time: cls.start_time,
      end_time: cls.end_time,
      status: "confirmed",
      google_calendar_event_id: calendarEventId,
    })
    .select("id")
    .single();
  if (bookErr || !booking) {
    return { ok: false, error: bookErr?.message ?? "Failed to create booking" };
  }

  await sb
    .from("conversations")
    .update({ student_id: student.id })
    .eq("id", conversationId);

  notifyAdmin(
    orgId,
    formatBookingNotification({
      studentName: memberName,
      parentName: payload.parent_name ?? null,
      parentPhone: contactPhone,
      parentEmail: contactEmail,
      subject: className,
      level: cls.level,
      centreName: classLocation?.name ?? null,
      bookingDate,
      startTime: cls.start_time,
      endTime: cls.end_time,
    }),
  ).catch((err) => console.warn("[notifyAdmin booking]", err));

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

  const memberName = payload.member_name || payload.student_name || "Member";
  const contactPhone = normalisePhone(payload);
  const contactEmail = normaliseEmail(payload);

  const { data: cls } = await sb
    .from("classes")
    .select("id, level, subject, is_active")
    .eq("id", payload.class_id)
    .eq("org_id", orgId)
    .single();
  if (!cls) return { ok: false, error: "Class not found" };
  if (!cls.is_active) return { ok: false, error: "Class is inactive" };

  const { data: student, error: studentErr } = await sb
    .from("students")
    .insert({
      org_id: orgId,
      student_name: memberName,
      parent_name: payload.parent_name ?? null,
      parent_phone: contactPhone,
      parent_email: contactEmail,
      level: payload.fitness_level ?? payload.level ?? cls.level,
      status: "lead",
    })
    .select("id")
    .single();
  if (studentErr || !student) {
    return { ok: false, error: studentErr?.message ?? "Failed to create member record" };
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
      studentName: memberName,
      parentName: payload.parent_name ?? null,
      parentPhone: contactPhone,
      subject: cls.subject,
      level: cls.level,
      position,
    }),
  ).catch((err) => console.warn("[notifyAdmin waitlist]", err));

  return { ok: true, position };
}

function nextDateForDay(dayOfWeek: string): string {
  const targetIdx = [
    "sunday","monday","tuesday","wednesday","thursday","friday","saturday",
  ].indexOf(dayOfWeek.toLowerCase());
  if (targetIdx < 0) return new Date().toISOString().slice(0, 10);
  const today = new Date();
  const currentIdx = today.getDay();
  let diff = targetIdx - currentIdx;
  if (diff <= 0) diff += 7;
  const target = new Date(today.getTime() + diff * 86400000);
  return target.toISOString().slice(0, 10);
}
