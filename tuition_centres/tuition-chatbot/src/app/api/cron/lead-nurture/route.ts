// Vercel Cron: runs every hour.
// Finds active lead nurture entries whose next_followup_at has passed and sends
// the appropriate follow-up message via the original channel.

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendChannelReply } from "@/lib/chat/channels";
import type { Channel } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MESSAGES = [
  // step 1 — T+24 hours
  (studentName: string, subject: string) =>
    `Hi! Just checking in — how was ${studentName}'s ${subject} trial yesterday? We'd love to have them join the regular class. Would you like to enrol? 😊`,
  // step 2 — T+3 days
  (studentName: string, subject: string) =>
    `Hi! We still have a spot in the ${subject} class for ${studentName}. Just checking in — any questions we can answer? No pressure at all!`,
  // step 3 — T+7 days (final)
  (studentName: string, subject: string) =>
    `Hi — last check-in from us! We're running low on spots for ${subject}. We'd hate for ${studentName} to miss out if they enjoyed the trial. Feel free to reach out anytime — we're here to help!`,
];

const DELAYS_HOURS = [24, 72, 168]; // 1 day, 3 days, 7 days

function isValidChannel(c: unknown): c is Channel {
  return c === "web" || c === "whatsapp" || c === "telegram";
}

export async function GET(req: Request) {
  // Verify Vercel Cron secret to prevent unauthorised triggers.
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = adminClient();
  const now = new Date().toISOString();

  const { data: entries, error } = await sb
    .from("lead_nurture")
    .select(`
      id, org_id, step, channel, conversation_id,
      students(student_name, parent_name),
      bookings(classes(subject))
    `)
    .eq("status", "active")
    .lte("next_followup_at", now)
    .limit(100);

  if (error) {
    console.error("[lead-nurture cron] query error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const entry of entries ?? []) {
    const nextStep = entry.step + 1;
    if (nextStep > 3) {
      // All steps exhausted — close.
      await sb.from("lead_nurture").update({ status: "closed" }).eq("id", entry.id);
      continue;
    }

    const student = (entry as unknown as { students?: { student_name: string; parent_name: string | null } }).students;
    const booking = (entry as unknown as { bookings?: { classes?: { subject: string } } }).bookings;
    const studentName = student?.student_name ?? "your child";
    const subject = booking?.classes?.subject ?? "the";

    const text = MESSAGES[nextStep - 1](studentName, subject);
    const channel = isValidChannel(entry.channel) ? entry.channel : "web";

    let channelUserId: string | null = null;
    if (channel !== "web" && entry.conversation_id) {
      const { data: conv } = await sb
        .from("conversations")
        .select("channel_user_id")
        .eq("id", entry.conversation_id)
        .single();
      channelUserId = conv?.channel_user_id ?? null;
    }

    let sendOk = true;
    if (channel !== "web" && channelUserId) {
      const outcome = await sendChannelReply(entry.org_id, channel, channelUserId, text);
      sendOk = outcome.ok;
      if (!outcome.ok) {
        console.error("[lead-nurture cron] send failed", entry.id, outcome.reason);
        failed++;
      }
    }

    if (sendOk) {
      const nextFollowup =
        nextStep < 3
          ? new Date(Date.now() + DELAYS_HOURS[nextStep] * 3600 * 1000).toISOString()
          : null;

      await sb
        .from("lead_nurture")
        .update({
          step: nextStep,
          next_followup_at: nextFollowup,
          status: nextStep === 3 ? "closed" : "active",
        })
        .eq("id", entry.id);

      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: (entries ?? []).length });
}
