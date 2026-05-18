// Vercel Cron: runs daily at 9am SGT (1am UTC).
// Checks for enrolled students whose payment is due and sends reminders.
// Step 1 (day 1): first reminder with PayNow details.
// Step 2 (day 5): gentle follow-up.
// Step 3 (day 10): escalate to admin, no parent message.

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendChannelReply } from "@/lib/chat/channels";
import { notifyAdmin } from "@/lib/notifications/admin";
import type { Channel } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidChannel(c: unknown): c is Channel {
  return c === "web" || c === "whatsapp" || c === "telegram";
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = adminClient();
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  // Process day 10 escalations.
  const { data: overdue } = await sb
    .from("payment_reminders")
    .select("id, org_id, student_id, month_for, amount")
    .eq("status", "reminded")
    .eq("reminder_count", 2)
    .lt("last_reminded_at", new Date(Date.now() - 5 * 86400 * 1000).toISOString());

  for (const reminder of overdue ?? []) {
    const { data: student } = await sb
      .from("students")
      .select("student_name, parent_name")
      .eq("id", reminder.student_id)
      .single();

    const name = student?.student_name ?? "a student";
    await notifyAdmin(
      reminder.org_id,
      `⚠️ *Payment overdue* — ${name}'s ${reminder.month_for} fee of $${reminder.amount} is 10+ days overdue. Please follow up directly.`,
    );

    await sb
      .from("payment_reminders")
      .update({ status: "escalated" })
      .eq("id", reminder.id);
  }

  // Process pending/first reminders for current month.
  const { data: pending } = await sb
    .from("payment_reminders")
    .select(`
      id, org_id, student_id, amount, reminder_count, month_for,
      students(student_name, parent_name, telegram_chat_id, whatsapp_chat_id),
      organisations(twilio_account_sid, paynow_uen, paynow_phone, billing_day)
    `)
    .eq("month_for", currentMonth)
    .in("status", ["pending", "reminded"])
    .lt("reminder_count", 2);

  let sent = 0;

  for (const reminder of pending ?? []) {
    const student = (reminder as unknown as {
      students?: { student_name: string; parent_name: string | null; telegram_chat_id: string | null; whatsapp_chat_id: string | null };
    }).students;
    const org = (reminder as unknown as {
      organisations?: { twilio_account_sid: string | null; paynow_uen: string | null; paynow_phone: string | null; billing_day: number | null };
    }).organisations;

    const studentName = student?.student_name ?? "your child";
    const paynow = org?.paynow_uen ? `PayNow UEN: ${org.paynow_uen}` : org?.paynow_phone ? `PayNow phone: ${org.paynow_phone}` : "PayNow (ask the centre for details)";

    // Generate a scan-and-pay QR for this exact amount + month reference,
    // hosted as a public PNG endpoint. Twilio + Telegram fetch the URL when
    // sending the message. Skip QR when the org has no PayNow proxy configured.
    const hasPayNow = Boolean(org?.paynow_uen || org?.paynow_phone);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    const qrUrl = hasPayNow && appUrl
      ? `${appUrl}/api/paynow/${reminder.org_id}/qr.png?amount=${reminder.amount}&ref=${encodeURIComponent(reminder.month_for)}`
      : undefined;

    const isFirstReminder = reminder.reminder_count === 0;
    const text = isFirstReminder
      ? `Hi! ${studentName}'s tuition fee of $${reminder.amount} for ${reminder.month_for} is now due. You can pay via:\n• ${paynow}${qrUrl ? "\n• Scan the PayNow QR (attached) — amount pre-filled" : ""}\n\nReply *PAID* once done and we'll update your records! 🙏`
      : `Friendly reminder — ${studentName}'s ${reminder.month_for} fee of $${reminder.amount} is still outstanding. Please arrange at your convenience. Any questions? Just reply here!`;

    // Determine best channel: prefer WhatsApp, then Telegram, then skip.
    let channel: Channel = "web";
    let channelUserId: string | null = null;

    if (student?.whatsapp_chat_id && org?.twilio_account_sid) {
      channel = "whatsapp";
      const num = student.whatsapp_chat_id;
      channelUserId = num.startsWith("whatsapp:") ? num : `whatsapp:${num}`;
    } else if (student?.telegram_chat_id) {
      channel = "telegram";
      channelUserId = student.telegram_chat_id;
    }

    if (channel !== "web" && channelUserId) {
      const outcome = await sendChannelReply(reminder.org_id, channel, channelUserId, text, {
        mediaUrl: isFirstReminder ? qrUrl : undefined,
      });
      if (outcome.ok) {
        await sb
          .from("payment_reminders")
          .update({
            status: "reminded",
            reminder_count: reminder.reminder_count + 1,
            last_reminded_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);
        sent++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent, escalated: (overdue ?? []).length });
}
