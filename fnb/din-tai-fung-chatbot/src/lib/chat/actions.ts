import { adminClient } from "@/lib/supabase/admin";
import { createTrialBookingEvent } from "@/lib/integrations/google-calendar";
import {
  notifyAdmin,
  formatBookingNotification,
  formatWaitlistNotification,
} from "@/lib/notifications/admin";

const BOOK_TABLE_RE = /\[BOOK_TABLE\]\s*(\{[\s\S]*?\})/;
const WAIT_RE = /\[ADD_TO_WAITLIST\]\s*(\{[\s\S]*?\})/;
const PAY_RE = /\[SEND_PAYMENT_LINK\]\s*(\{[\s\S]*?\})/;
const CATERING_ENQUIRY_RE = /\[SEND_CATERING_ENQUIRY\]\s*(\{[\s\S]*?\})/;
const CHECK_AVAILABILITY_RE = /\[CHECK_AVAILABILITY\]\s*(\{[\s\S]*?\})/;

export interface BookActionPayload {
  class_id: string;
  guest_name: string;
  contact_phone: string;
  contact_email?: string;
  pax: number;
  occasion?: string;
  dietary_requirements?: string[];
  special_requests?: string;
  preferred_date?: string;
  preferred_time?: string;
}

export interface WaitlistActionPayload {
  class_id: string;
  guest_name: string;
  contact_phone: string;
  contact_email?: string;
  pax?: number;
}

export interface PaymentActionPayload {
  type: "registration" | "monthly" | "material" | "deposit";
  class_id?: string;
}

export interface CateringEnquiryPayload {
  guest_name: string;
  contact_phone: string;
  contact_email?: string;
  pax: number;
  occasion?: string;
  preferred_date?: string;
  notes?: string;
}

export interface CheckAvailabilityPayload {
  class_id?: string;
  preferred_date?: string;
  pax?: number;
}

export interface ParsedActions {
  cleanReply: string;
  bookTable: BookActionPayload | null;
  waitlist: WaitlistActionPayload | null;
  paymentLink: PaymentActionPayload | null;
  cateringEnquiry: CateringEnquiryPayload | null;
  checkAvailability: CheckAvailabilityPayload | null;
}

export function parseActions(reply: string): ParsedActions {
  let cleaned = reply;
  let bookTable: BookActionPayload | null = null;
  let waitlist: WaitlistActionPayload | null = null;
  let paymentLink: PaymentActionPayload | null = null;
  let cateringEnquiry: CateringEnquiryPayload | null = null;
  let checkAvailability: CheckAvailabilityPayload | null = null;

  const bookMatch = reply.match(BOOK_TABLE_RE);
  if (bookMatch) {
    try {
      bookTable = JSON.parse(bookMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse BOOK_TABLE", e);
    }
    cleaned = cleaned.replace(BOOK_TABLE_RE, "").trim();
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

  const cateringMatch = reply.match(CATERING_ENQUIRY_RE);
  if (cateringMatch) {
    try {
      cateringEnquiry = JSON.parse(cateringMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse SEND_CATERING_ENQUIRY", e);
    }
    cleaned = cleaned.replace(CATERING_ENQUIRY_RE, "").trim();
  }

  const availMatch = reply.match(CHECK_AVAILABILITY_RE);
  if (availMatch) {
    try {
      checkAvailability = JSON.parse(availMatch[1]);
    } catch (e) {
      console.error("[actions] failed to parse CHECK_AVAILABILITY", e);
    }
    cleaned = cleaned.replace(CHECK_AVAILABILITY_RE, "").trim();
  }

  return { cleanReply: cleaned, bookTable, waitlist, paymentLink, cateringEnquiry, checkAvailability };
}

export async function executeBookTable(
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
      "id, subject, level, day_of_week, start_time, end_time, max_capacity, current_enrollment, is_active, org_id, location_id, location:locations(id, name, address)",
    )
    .eq("id", payload.class_id)
    .eq("org_id", orgId)
    .single();
  if (clsErr || !cls) return { ok: false, error: "Reservation slot not found" };
  if (!cls.is_active) return { ok: false, error: "Reservation slot is inactive" };
  if (cls.current_enrollment >= cls.max_capacity)
    return { ok: false, error: "Reservation slot is full" };

  const classLocation =
    (cls as unknown as { location?: { name: string; address: string | null } | null })
      .location ?? null;

  const outletName = classLocation?.name ?? "our outlet";
  const pax = payload.pax ?? 1;
  const occasion = payload.occasion ?? null;

  // Create guest record (maps to students table)
  const { data: guest, error: guestErr } = await sb
    .from("students")
    .insert({
      org_id: orgId,
      student_name: payload.guest_name,
      parent_name: null,
      parent_phone: payload.contact_phone,
      parent_email: payload.contact_email ?? null,
      level: `${pax} pax`,
      status: "trial",
      // F&B fields
      pax,
      dietary_requirements: payload.dietary_requirements ?? null,
      occasion: occasion,
    })
    .select("id")
    .single();
  if (guestErr || !guest) {
    return { ok: false, error: guestErr?.message ?? "Failed to create guest record" };
  }

  // Resolve booking date
  const bookingDate = payload.preferred_date ?? nextDateForDay(cls.day_of_week);

  // Try to create a calendar event
  let centreAddress = classLocation?.address ?? null;
  if (!centreAddress) {
    const { data: orgRow } = await sb
      .from("organisations")
      .select("address")
      .eq("id", orgId)
      .single();
    centreAddress = orgRow?.address ?? null;
  }

  const calendarSummary = `Reservation: ${pax} pax — ${occasion ?? "Dining"} @ ${outletName}`;

  const calendarResult = await createTrialBookingEvent({
    orgId,
    studentName: payload.guest_name,
    parentName: null,
    parentPhone: payload.contact_phone,
    parentEmail: payload.contact_email ?? null,
    subject: calendarSummary,
    level: `${pax} pax`,
    teacherName: null,
    bookingDate,
    startTime: payload.preferred_time ?? cls.start_time,
    endTime: cls.end_time,
    centreAddress,
  });

  const calendarEventId = calendarResult.ok ? calendarResult.eventId : null;
  const invitedAttendee = calendarResult.ok ? calendarResult.invitedAttendee : false;
  const calendarError =
    !calendarResult.ok && calendarResult.reason !== "Calendar not connected"
      ? calendarResult.reason
      : undefined;

  // Persist booking
  const { data: booking, error: bookErr } = await sb
    .from("bookings")
    .insert({
      org_id: orgId,
      student_id: guest.id,
      class_id: cls.id,
      location_id: cls.location_id ?? null,
      booking_type: "reservation",
      booking_date: bookingDate,
      start_time: payload.preferred_time ?? cls.start_time,
      end_time: cls.end_time,
      status: "confirmed",
      google_calendar_event_id: calendarEventId,
      confirmed_pax: pax,
      special_requests: payload.special_requests ?? null,
    })
    .select("id")
    .single();
  if (bookErr || !booking) {
    return { ok: false, error: bookErr?.message ?? "Failed to create booking" };
  }

  await sb
    .from("conversations")
    .update({ student_id: guest.id })
    .eq("id", conversationId);

  notifyAdmin(
    orgId,
    formatBookingNotification({
      studentName: payload.guest_name,
      parentName: null,
      parentPhone: payload.contact_phone,
      parentEmail: payload.contact_email ?? null,
      subject: `${pax} pax — ${occasion ?? "Dining"}`,
      level: outletName,
      centreName: outletName,
      bookingDate,
      startTime: payload.preferred_time ?? cls.start_time,
      endTime: cls.end_time,
    }),
  ).catch((err) => console.warn("[notifyAdmin reservation]", err));

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
  if (!cls) return { ok: false, error: "Reservation slot not found" };
  if (!cls.is_active) return { ok: false, error: "Reservation slot is inactive" };

  const { data: guest, error: guestErr } = await sb
    .from("students")
    .insert({
      org_id: orgId,
      student_name: payload.guest_name,
      parent_name: null,
      parent_phone: payload.contact_phone,
      parent_email: payload.contact_email ?? null,
      level: payload.pax ? `${payload.pax} pax` : cls.level,
      status: "lead",
    })
    .select("id")
    .single();
  if (guestErr || !guest) {
    return { ok: false, error: guestErr?.message ?? "Failed to create guest record" };
  }

  const { count } = await sb
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .eq("class_id", cls.id)
    .eq("status", "waiting");
  const position = (count ?? 0) + 1;

  const { error: wlErr } = await sb.from("waitlist").insert({
    org_id: orgId,
    student_id: guest.id,
    class_id: cls.id,
    position,
    status: "waiting",
  });
  if (wlErr) return { ok: false, error: wlErr.message };

  await sb
    .from("conversations")
    .update({ student_id: guest.id })
    .eq("id", conversationId);

  notifyAdmin(
    orgId,
    formatWaitlistNotification({
      studentName: payload.guest_name,
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
