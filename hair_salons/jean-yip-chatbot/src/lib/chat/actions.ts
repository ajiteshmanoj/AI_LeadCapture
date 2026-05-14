import { adminClient } from "@/lib/supabase/admin";
import { createTrialBookingEvent } from "@/lib/integrations/google-calendar";
import {
  notifyAdmin,
  formatBookingNotification,
  formatWaitlistNotification,
} from "@/lib/notifications/admin";

const BOOK_APPOINTMENT_RE = /\[BOOK_APPOINTMENT\]\s*(\{[\s\S]*?\})/;
const COLLECT_DEPOSIT_RE = /\[COLLECT_DEPOSIT\]\s*(\{[\s\S]*?\})/;
const RESCHEDULE_RE = /\[RESCHEDULE\]\s*(\{[\s\S]*?\})/;
// Legacy trial flow — kept so existing tuition-centre data isn't broken.
const BOOK_RE = /\[BOOK_TRIAL\]\s*(\{[\s\S]*?\})/;
const WAIT_RE = /\[ADD_TO_WAITLIST\]\s*(\{[\s\S]*?\})/;
const PAY_RE = /\[SEND_PAYMENT_LINK\]\s*(\{[\s\S]*?\})/;

export interface BookAppointmentPayload {
  class_id: string;
  client_name: string;
  contact_phone: string;
  contact_email?: string;
  service_requested: string;
  preferred_stylist?: string;
  hair_length_category?: string;
  preferred_date?: string;
  preferred_time?: string;
}

export interface CollectDepositPayload {
  booking_id: string;
  amount: number;
}

export interface ReschedulePayload {
  booking_id: string;
  new_date?: string;
  new_time?: string;
}

// Legacy tuition payload shapes kept for backward compatibility.
export interface BookActionPayload {
  class_id: string;
  student_name: string;
  parent_name?: string;
  parent_phone: string;
  parent_email?: string;
  level?: string;
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
  bookAppointment: BookAppointmentPayload | null;
  collectDeposit: CollectDepositPayload | null;
  reschedule: ReschedulePayload | null;
  // Legacy fields
  bookTrial: BookActionPayload | null;
  waitlist: WaitlistActionPayload | null;
  paymentLink: PaymentActionPayload | null;
}

export function parseActions(reply: string): ParsedActions {
  let cleaned = reply;
  let bookAppointment: BookAppointmentPayload | null = null;
  let collectDeposit: CollectDepositPayload | null = null;
  let reschedule: ReschedulePayload | null = null;
  let bookTrial: BookActionPayload | null = null;
  let waitlist: WaitlistActionPayload | null = null;
  let paymentLink: PaymentActionPayload | null = null;

  const apptMatch = reply.match(BOOK_APPOINTMENT_RE);
  if (apptMatch) {
    try {
      bookAppointment = JSON.parse(apptMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse BOOK_APPOINTMENT", e);
    }
    cleaned = cleaned.replace(BOOK_APPOINTMENT_RE, "").trim();
  }

  const depositMatch = reply.match(COLLECT_DEPOSIT_RE);
  if (depositMatch) {
    try {
      collectDeposit = JSON.parse(depositMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse COLLECT_DEPOSIT", e);
    }
    cleaned = cleaned.replace(COLLECT_DEPOSIT_RE, "").trim();
  }

  const rescheduleMatch = reply.match(RESCHEDULE_RE);
  if (rescheduleMatch) {
    try {
      reschedule = JSON.parse(rescheduleMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse RESCHEDULE", e);
    }
    cleaned = cleaned.replace(RESCHEDULE_RE, "").trim();
  }

  const bookMatch = reply.match(BOOK_RE);
  if (bookMatch) {
    try {
      bookTrial = JSON.parse(bookMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse BOOK_TRIAL", e);
    }
    cleaned = cleaned.replace(BOOK_RE, "").trim();
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

  return { cleanReply: cleaned, bookAppointment, collectDeposit, reschedule, bookTrial, waitlist, paymentLink };
}

export async function executeBookAppointment(
  orgId: string,
  conversationId: string,
  payload: BookAppointmentPayload,
): Promise<{
  ok: boolean;
  bookingId?: string;
  calendarEventId?: string;
  calendarError?: string;
  invitedAttendee?: boolean;
  depositRequired?: boolean;
  depositAmount?: number;
  error?: string;
}> {
  const sb = adminClient();

  const { data: cls, error: clsErr } = await sb
    .from("classes")
    .select(
      "id, subject, level, day_of_week, start_time, end_time, max_capacity, current_enrollment, is_active, teacher_name, org_id, location_id, requires_deposit, deposit_amount, service_duration_minutes, location:locations(id, name, address)",
    )
    .eq("id", payload.class_id)
    .eq("org_id", orgId)
    .single();
  if (clsErr || !cls) return { ok: false, error: "Service not found" };
  if (!cls.is_active) return { ok: false, error: "Service is not currently available" };
  if (cls.current_enrollment >= cls.max_capacity)
    return { ok: false, error: "No availability for this service slot" };

  const classLocation =
    (cls as unknown as { location?: { name: string; address: string | null } | null })
      .location ?? null;

  const { data: student, error: studentErr } = await sb
    .from("students")
    .insert({
      org_id: orgId,
      student_name: payload.client_name,
      parent_name: null,
      parent_phone: payload.contact_phone,
      parent_email: payload.contact_email ?? null,
      preferred_stylist: payload.preferred_stylist ?? null,
      status: "trial",
    })
    .select("id")
    .single();
  if (studentErr || !student) {
    return { ok: false, error: studentErr?.message ?? "Failed to create client record" };
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

  const calendarTitle = `Appointment: ${payload.client_name} — ${payload.service_requested || cls.subject}`;

  const calendarResult = await createTrialBookingEvent({
    orgId,
    studentName: payload.client_name,
    parentName: null,
    parentPhone: payload.contact_phone,
    parentEmail: payload.contact_email ?? null,
    subject: calendarTitle,
    level: cls.level,
    teacherName: payload.preferred_stylist ?? cls.teacher_name ?? null,
    bookingDate,
    startTime: cls.start_time,
    endTime: cls.end_time,
    centreAddress,
  });

  const calendarEventId = calendarResult.ok ? calendarResult.eventId : null;
  const invitedAttendee = calendarResult.ok ? calendarResult.invitedAttendee : false;
  const calendarError =
    !calendarResult.ok && calendarResult.reason !== "Calendar not connected"
      ? calendarResult.reason
      : undefined;

  // Determine deposit requirement from the class record.
  const requiresDeposit = !!(cls as unknown as { requires_deposit?: boolean }).requires_deposit;
  const depositAmount = (cls as unknown as { deposit_amount?: number }).deposit_amount ?? 0;

  const { data: booking, error: bookErr } = await sb
    .from("bookings")
    .insert({
      org_id: orgId,
      student_id: student.id,
      class_id: cls.id,
      location_id: cls.location_id ?? null,
      booking_type: "appointment",
      booking_date: bookingDate,
      start_time: payload.preferred_time ? `${payload.preferred_time}:00` : cls.start_time,
      end_time: cls.end_time,
      status: "confirmed",
      google_calendar_event_id: calendarEventId,
      stylist_requested: payload.preferred_stylist ?? null,
      deposit_collected: requiresDeposit ? false : null,
      deposit_amount_collected: null,
    })
    .select("id")
    .single();
  if (bookErr || !booking) {
    return { ok: false, error: bookErr?.message ?? "Failed to create appointment" };
  }

  await sb
    .from("conversations")
    .update({ student_id: student.id })
    .eq("id", conversationId);

  // Admin notification — flag deposit if pending.
  const notifHeader = requiresDeposit
    ? "✂️ *New appointment — deposit pending*"
    : "✂️ *New appointment booked*";

  notifyAdmin(
    orgId,
    formatBookingNotification({
      studentName: payload.client_name,
      parentName: null,
      parentPhone: payload.contact_phone,
      parentEmail: payload.contact_email ?? null,
      subject: `${cls.subject} (${cls.level})`,
      level: payload.preferred_stylist ? `Stylist: ${payload.preferred_stylist}` : cls.level,
      centreName: classLocation?.name ?? null,
      bookingDate,
      startTime: cls.start_time,
      endTime: cls.end_time,
      notifHeader,
    }),
  ).catch((err) => console.warn("[notifyAdmin appointment]", err));

  return {
    ok: true,
    bookingId: booking.id,
    calendarEventId: calendarEventId ?? undefined,
    invitedAttendee,
    calendarError,
    depositRequired: requiresDeposit,
    depositAmount,
  };
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
      student_name: payload.student_name,
      parent_name: payload.parent_name ?? null,
      parent_phone: payload.parent_phone,
      parent_email: payload.parent_email ?? null,
      level: payload.level ?? cls.level,
      status: "trial",
    })
    .select("id")
    .single();
  if (studentErr || !student) {
    return { ok: false, error: studentErr?.message ?? "Failed to create student" };
  }

  const bookingDate = nextDateForDay(cls.day_of_week);

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
    studentName: payload.student_name,
    parentName: payload.parent_name ?? null,
    parentPhone: payload.parent_phone,
    parentEmail: payload.parent_email ?? null,
    subject: cls.subject,
    level: cls.level,
    teacherName: cls.teacher_name ?? null,
    bookingDate,
    startTime: cls.start_time,
    endTime: cls.end_time,
    centreAddress,
  });

  const calendarEventId = calendarResult.ok ? calendarResult.eventId : null;
  const invitedAttendee = calendarResult.ok ? calendarResult.invitedAttendee : false;
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
      booking_type: "trial",
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
      studentName: payload.student_name,
      parentName: payload.parent_name ?? null,
      parentPhone: payload.parent_phone,
      parentEmail: payload.parent_email ?? null,
      subject: cls.subject,
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
    return { ok: false, error: studentErr?.message ?? "Failed to create student" };
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
