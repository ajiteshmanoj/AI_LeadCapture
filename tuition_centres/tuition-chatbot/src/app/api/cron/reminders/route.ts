// Vercel Cron: runs daily at 10:00 UTC (6pm SGT).
// Sends a 24-hour-before reminder for every confirmed booking happening
// tomorrow (Asia/Singapore). Covers trial bookings, makeup bookings, and any
// future enrolment-booking rows that follow the same shape.
//
// Idempotent: lesson_reminder_log unique-constrained on (booking_id, lesson_date)
// — a second run on the same day is a no-op.

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendChannelReply } from "@/lib/chat/channels";
import type { Channel } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tomorrow in Asia/Singapore as a YYYY-MM-DD string.
function tomorrowSGT(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const sgtNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" }),
  );
  sgtNow.setDate(sgtNow.getDate() + 1);
  return fmt.format(sgtNow);
}

function pickChannel(
  whatsappChatId: string | null,
  telegramChatId: string | null,
  twilioReady: boolean,
): { channel: Channel; channelUserId: string | null } {
  if (whatsappChatId && twilioReady) {
    const num = whatsappChatId.startsWith("whatsapp:")
      ? whatsappChatId
      : `whatsapp:${whatsappChatId}`;
    return { channel: "whatsapp", channelUserId: num };
  }
  if (telegramChatId) {
    return { channel: "telegram", channelUserId: telegramChatId };
  }
  return { channel: "web", channelUserId: null };
}

type ReminderBooking = {
  id: string;
  org_id: string;
  class_id: string | null;
  student_id: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  classes: { subject: string; level: string; teacher_name: string | null } | null;
  students: {
    student_name: string;
    parent_name: string | null;
    telegram_chat_id: string | null;
    whatsapp_chat_id: string | null;
  } | null;
  locations: { name: string | null; address: string | null } | null;
  organisations: {
    org_name: string | null;
    twilio_account_sid: string | null;
    twilio_auth_token: string | null;
    twilio_whatsapp_from: string | null;
  } | null;
};

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = adminClient();
  const lessonDate = tomorrowSGT();

  const { data: bookings, error } = await sb
    .from("bookings")
    .select(`
      id, org_id, class_id, student_id, booking_date, start_time, end_time,
      classes ( subject, level, teacher_name ),
      students ( student_name, parent_name, telegram_chat_id, whatsapp_chat_id ),
      locations ( name, address ),
      organisations ( org_name, twilio_account_sid, twilio_auth_token, twilio_whatsapp_from )
    `)
    .eq("booking_date", lessonDate)
    .eq("status", "confirmed");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (bookings ?? []) as unknown as ReminderBooking[];
  let sent = 0;
  let skipped = 0;
  const skipReasons: Record<string, number> = {};
  const bump = (k: string) => {
    skipReasons[k] = (skipReasons[k] ?? 0) + 1;
  };

  for (const b of rows) {
    if (!b.students || !b.classes || !b.student_id) {
      skipped++;
      bump("missing_student_or_class");
      continue;
    }

    // Idempotency: skip if we already logged a reminder for this booking+date.
    const { data: existing } = await sb
      .from("lesson_reminder_log")
      .select("id")
      .eq("booking_id", b.id)
      .eq("lesson_date", lessonDate)
      .maybeSingle();
    if (existing) {
      skipped++;
      bump("already_sent");
      continue;
    }

    const twilioReady = Boolean(
      b.organisations?.twilio_account_sid &&
        b.organisations?.twilio_auth_token &&
        b.organisations?.twilio_whatsapp_from,
    );
    const { channel, channelUserId } = pickChannel(
      b.students.whatsapp_chat_id,
      b.students.telegram_chat_id,
      twilioReady,
    );

    if (channel === "web" || !channelUserId) {
      skipped++;
      bump("no_reachable_channel");
      continue;
    }

    const child = b.students.student_name;
    const subj = `${b.classes.subject} (${b.classes.level})`;
    const time = `${b.start_time.slice(0, 5)}-${b.end_time.slice(0, 5)}`;
    const venue = b.locations?.name
      ? b.locations.address
        ? `${b.locations.name}, ${b.locations.address}`
        : b.locations.name
      : (b.organisations?.org_name ?? "the centre");

    const text =
      `Reminder: ${child} has ${subj} tomorrow, ${time} at ${venue}. ` +
      `Reply SKIP if ${child} can't make it and we'll note the absence.`;

    const outcome = await sendChannelReply(b.org_id, channel, channelUserId, text);
    if (!outcome.ok) {
      skipped++;
      bump(`send_failed:${outcome.reason ?? "unknown"}`);
      continue;
    }

    await sb.from("lesson_reminder_log").insert({
      org_id: b.org_id,
      booking_id: b.id,
      student_id: b.student_id,
      class_id: b.class_id,
      lesson_date: lessonDate,
      channel,
    });

    await sb
      .from("attendance")
      .upsert(
        {
          org_id: b.org_id,
          class_id: b.class_id!,
          student_id: b.student_id,
          booking_id: b.id,
          lesson_date: lessonDate,
          status: "expected",
          marked_by: "system",
          marked_at: new Date().toISOString(),
        },
        { onConflict: "class_id,student_id,lesson_date" },
      );

    sent++;
  }

  return NextResponse.json({
    ok: true,
    lesson_date: lessonDate,
    bookings_found: rows.length,
    sent,
    skipped,
    skip_reasons: skipReasons,
  });
}
