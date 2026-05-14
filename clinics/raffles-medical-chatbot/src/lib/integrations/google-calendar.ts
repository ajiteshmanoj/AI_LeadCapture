// Per-organisation Google Calendar integration.
//
// Each tuition centre admin completes their own OAuth consent. We store the
// resulting refresh token on the organisation row and use it to create
// calendar events when trial bookings happen via chat.

import { google, type calendar_v3 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { adminClient } from "@/lib/supabase/admin";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

const SGT_TIMEZONE = "Asia/Singapore";

export function oauth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Google Calendar env vars not set (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)",
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function buildAuthUrl(state: string): string {
  return oauth2Client().generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force refresh_token on every connect
    scope: SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = oauth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

async function clientForOrg(orgId: string): Promise<OAuth2Client | null> {
  const { data: org } = await adminClient()
    .from("organisations")
    .select("google_refresh_token, google_calendar_id")
    .eq("id", orgId)
    .single();
  if (!org?.google_refresh_token) return null;

  const client = oauth2Client();
  client.setCredentials({ refresh_token: org.google_refresh_token });
  return client;
}

export interface CreateBookingEventInput {
  orgId: string;
  studentName: string;
  parentName?: string | null;
  parentPhone: string;
  parentEmail?: string | null;
  subject: string;
  level: string;
  teacherName?: string | null;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm or HH:mm:ss
  endTime: string;
  centreAddress?: string | null;
}

export async function createTrialBookingEvent(
  input: CreateBookingEventInput,
): Promise<
  | { ok: true; eventId: string; invitedAttendee: boolean }
  | { ok: false; reason: string }
> {
  const client = await clientForOrg(input.orgId);
  if (!client) return { ok: false, reason: "Calendar not connected" };

  const { data: org } = await adminClient()
    .from("organisations")
    .select("google_calendar_id")
    .eq("id", input.orgId)
    .single();
  const calendarId = org?.google_calendar_id ?? "primary";

  const start = `${input.bookingDate}T${input.startTime.slice(0, 8).padEnd(8, ":00")}`;
  const end = `${input.bookingDate}T${input.endTime.slice(0, 8).padEnd(8, ":00")}`;

  const consultationType = input.subject;
  const summary = `Consultation: ${input.studentName} — ${consultationType}`;
  const descriptionLines = [
    `Patient: ${input.studentName}`,
    `Phone: ${input.parentPhone}`,
    input.parentEmail ? `Email: ${input.parentEmail}` : null,
    `Consultation: ${consultationType}`,
    input.teacherName ? `Doctor: ${input.teacherName}` : null,
    "",
    "(Auto-created from Raffles Medical chatbot booking)",
  ].filter(Boolean);

  const attendees: calendar_v3.Schema$EventAttendee[] = [];
  if (input.parentEmail) {
    attendees.push({
      email: input.parentEmail,
      displayName: input.parentName ?? input.studentName,
      responseStatus: "needsAction",
    });
  }

  const event: calendar_v3.Schema$Event = {
    summary,
    description: descriptionLines.join("\n"),
    location: input.centreAddress ?? undefined,
    start: { dateTime: start, timeZone: SGT_TIMEZONE },
    end: { dateTime: end, timeZone: SGT_TIMEZONE },
    attendees: attendees.length > 0 ? attendees : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 60 },
      ],
    },
  };

  const calendar = google.calendar({ version: "v3", auth: client });
  try {
    const res = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: attendees.length > 0 ? "all" : "none",
    });
    if (!res.data.id) return { ok: false, reason: "No event id returned" };
    return { ok: true, eventId: res.data.id, invitedAttendee: attendees.length > 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: message };
  }
}

export async function listAvailableCalendars(orgId: string) {
  const client = await clientForOrg(orgId);
  if (!client) return [];
  const calendar = google.calendar({ version: "v3", auth: client });
  const res = await calendar.calendarList.list();
  return (res.data.items ?? []).map((c) => ({
    id: c.id ?? "",
    summary: c.summary ?? "",
    primary: c.primary ?? false,
    accessRole: c.accessRole ?? "",
  }));
}

export async function deleteEvent(orgId: string, eventId: string) {
  const client = await clientForOrg(orgId);
  if (!client) return;
  const { data: org } = await adminClient()
    .from("organisations")
    .select("google_calendar_id")
    .eq("id", orgId)
    .single();
  const calendarId = org?.google_calendar_id ?? "primary";
  const calendar = google.calendar({ version: "v3", auth: client });
  try {
    await calendar.events.delete({ calendarId, eventId });
  } catch (err) {
    console.warn("[google-calendar] delete failed", err);
  }
}
