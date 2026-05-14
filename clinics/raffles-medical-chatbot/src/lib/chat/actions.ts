import { adminClient } from "@/lib/supabase/admin";
import { createTrialBookingEvent } from "@/lib/integrations/google-calendar";
import {
  notifyAdmin,
  formatBookingNotification,
  formatWaitlistNotification,
} from "@/lib/notifications/admin";

const BOOK_APPOINTMENT_RE = /\[BOOK_APPOINTMENT\]\s*(\{[\s\S]*?\})/;
const WAIT_RE = /\[ADD_TO_WAITLIST\]\s*(\{[\s\S]*?\})/;
const PAY_RE = /\[SEND_PAYMENT_LINK\]\s*(\{[\s\S]*?\})/;
const CLINIC_FORM_RE = /\[SEND_CLINIC_FORM\]\s*(\{[\s\S]*?\})/;
const ESCALATE_NURSE_RE = /\[ESCALATE_TO_NURSE\]\s*(\{[\s\S]*?\})/;

export interface BookActionPayload {
  class_id: string;
  patient_name: string;
  contact_phone: string;
  contact_email?: string;
  nric_last4?: string;
  consultation_type?: string;
  preferred_date?: string;
}

export interface WaitlistActionPayload {
  class_id: string;
  patient_name: string;
  contact_phone: string;
  contact_email?: string;
}

export interface PaymentActionPayload {
  type: "registration" | "monthly" | "material" | "deposit";
  class_id?: string;
}

export interface ClinicFormPayload {
  patient_name: string;
  contact_email: string;
}

export interface EscalateNursePayload {
  reason?: string;
}

export interface ParsedActions {
  cleanReply: string;
  bookAppointment: BookActionPayload | null;
  waitlist: WaitlistActionPayload | null;
  paymentLink: PaymentActionPayload | null;
  clinicForm: ClinicFormPayload | null;
  escalateNurse: EscalateNursePayload | null;
}

export function parseActions(reply: string): ParsedActions {
  let cleaned = reply;
  let bookAppointment: BookActionPayload | null = null;
  let waitlist: WaitlistActionPayload | null = null;
  let paymentLink: PaymentActionPayload | null = null;
  let clinicForm: ClinicFormPayload | null = null;
  let escalateNurse: EscalateNursePayload | null = null;

  const bookMatch = reply.match(BOOK_APPOINTMENT_RE);
  if (bookMatch) {
    try {
      bookAppointment = JSON.parse(bookMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse BOOK_APPOINTMENT", e);
    }
    cleaned = cleaned.replace(BOOK_APPOINTMENT_RE, "").trim();
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

  const formMatch = reply.match(CLINIC_FORM_RE);
  if (formMatch) {
    try {
      clinicForm = JSON.parse(formMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse SEND_CLINIC_FORM", e);
    }
    cleaned = cleaned.replace(CLINIC_FORM_RE, "").trim();
  }

  const escalateMatch = reply.match(ESCALATE_NURSE_RE);
  if (escalateMatch) {
    try {
      escalateNurse = JSON.parse(escalateMatch[1]);
    } catch (e) {
      // payload is optional for escalation
      escalateNurse = {};
    }
    cleaned = cleaned.replace(ESCALATE_NURSE_RE, "").trim();
  }

  return { cleanReply: cleaned, bookAppointment, waitlist, paymentLink, clinicForm, escalateNurse };
}

export async function executeBookAppointment(
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

  // NRIC validation — reject full NRIC if accidentally submitted
  if (payload.nric_last4 && /^[STFGM]\d{7}[A-Z]$/i.test(payload.nric_last4)) {
    return { ok: false, error: "Full NRIC submitted — only the last 4 characters are accepted for privacy." };
  }

  const { data: cls, error: clsErr } = await sb
    .from("classes")
    .select(
      "id, subject, level, day_of_week, start_time, end_time, max_capacity, current_enrollment, is_active, teacher_name, org_id, location_id, location:locations(id, name, address), consultation_type",
    )
    .eq("id", payload.class_id)
    .eq("org_id", orgId)
    .single();
  if (clsErr || !cls) return { ok: false, error: "Appointment type not found" };
  if (!cls.is_active) return { ok: false, error: "Appointment type is inactive" };
  if (cls.current_enrollment >= cls.max_capacity)
    return { ok: false, error: "No slots available" };

  const classLocation =
    (cls as unknown as { location?: { name: string; address: string | null } | null })
      .location ?? null;
  const consultationType =
    payload.consultation_type ??
    (cls as unknown as { consultation_type?: string | null }).consultation_type ??
    cls.subject ??
    "GP";
  const patientName = payload.patient_name;

  const { data: patient, error: patientErr } = await sb
    .from("students")
    .insert({
      org_id: orgId,
      student_name: patientName,
      parent_name: null,
      parent_phone: payload.contact_phone,
      parent_email: payload.contact_email ?? null,
      level: cls.level,
      status: "trial",
      nric_last4: payload.nric_last4 ?? null,
    })
    .select("id")
    .single();
  if (patientErr || !patient) {
    return { ok: false, error: patientErr?.message ?? "Failed to create patient record" };
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
    studentName: patientName,
    parentName: null,
    parentPhone: payload.contact_phone,
    parentEmail: payload.contact_email ?? null,
    subject: consultationType,
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

  const { data: booking, error: bookErr } = await sb
    .from("bookings")
    .insert({
      org_id: orgId,
      student_id: patient.id,
      class_id: cls.id,
      location_id: cls.location_id ?? null,
      booking_type: "consultation",
      appointment_type: consultationType,
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
    .update({ student_id: patient.id })
    .eq("id", conversationId);

  notifyAdmin(
    orgId,
    formatBookingNotification({
      studentName: patientName,
      parentName: null,
      parentPhone: payload.contact_phone,
      parentEmail: payload.contact_email ?? null,
      subject: consultationType,
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
  if (!cls) return { ok: false, error: "Appointment type not found" };
  if (!cls.is_active) return { ok: false, error: "Appointment type is inactive" };

  const { data: patient, error: patientErr } = await sb
    .from("students")
    .insert({
      org_id: orgId,
      student_name: payload.patient_name,
      parent_name: null,
      parent_phone: payload.contact_phone,
      parent_email: payload.contact_email ?? null,
      level: cls.level,
      status: "lead",
    })
    .select("id")
    .single();
  if (patientErr || !patient) {
    return { ok: false, error: patientErr?.message ?? "Failed to create patient record" };
  }

  const { count } = await sb
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .eq("class_id", cls.id)
    .eq("status", "waiting");
  const position = (count ?? 0) + 1;

  const { error: wlErr } = await sb.from("waitlist").insert({
    org_id: orgId,
    student_id: patient.id,
    class_id: cls.id,
    position,
    status: "waiting",
  });
  if (wlErr) return { ok: false, error: wlErr.message };

  await sb
    .from("conversations")
    .update({ student_id: patient.id })
    .eq("id", conversationId);

  notifyAdmin(
    orgId,
    formatWaitlistNotification({
      studentName: payload.patient_name,
      parentName: null,
      parentPhone: payload.contact_phone,
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
