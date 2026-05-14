// Admin notification dispatch.
//
// The centre owner links their personal Telegram chat to the org once via the
// /linkadmin command. After that, anything noteworthy in the system (new
// trial booking, waitlist entry, escalation) pings them in Telegram.
//
// Soft-fails on every error: a notification problem must never break the
// booking flow. Logged for ops visibility.

import { adminClient } from "@/lib/supabase/admin";
import { sendMessage as telegramSend } from "@/lib/integrations/telegram";

export interface NotifyResult {
  ok: boolean;
  reason?: string;
}

export async function notifyAdmin(
  orgId: string,
  text: string,
): Promise<NotifyResult> {
  const { data: org } = await adminClient()
    .from("organisations")
    .select("admin_telegram_chat_id, telegram_bot_token")
    .eq("id", orgId)
    .single();

  if (!org?.admin_telegram_chat_id) {
    return { ok: false, reason: "Admin not linked" };
  }
  if (!org.telegram_bot_token) {
    return { ok: false, reason: "Telegram bot not connected" };
  }

  const res = await telegramSend(
    org.telegram_bot_token,
    org.admin_telegram_chat_id,
    text,
  );
  if (!res.ok) {
    console.warn("[notifyAdmin] send failed", { orgId, reason: res.reason });
    return { ok: false, reason: res.reason };
  }
  return { ok: true };
}

// Pretty-prints booking details for an admin ping.
export function formatBookingNotification(args: {
  studentName: string;
  parentName: string | null;
  parentPhone: string;
  parentEmail: string | null;
  subject: string;
  level: string;
  centreName: string | null;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string;
}): string {
  const parent = [args.parentName, args.parentPhone].filter(Boolean).join(" / ");
  const venue = args.centreName ?? "(no centre)";
  const time = `${args.startTime.slice(0, 5)}–${args.endTime.slice(0, 5)}`;
  return [
    "🍽️ *New reservation confirmed*",
    `${args.studentName} — ${args.subject} @ ${venue}`,
    `${args.bookingDate} ${time}`,
    `Guest: ${parent}${args.parentEmail ? ` / ${args.parentEmail}` : ""}`,
  ].join("\n");
}

export function formatWaitlistNotification(args: {
  studentName: string;
  parentName: string | null;
  parentPhone: string;
  subject: string;
  level: string;
  position: number;
}): string {
  const parent = [args.parentName, args.parentPhone].filter(Boolean).join(" / ");
  return [
    "📝 *New waitlist entry*",
    `${args.studentName} — ${args.subject} (${args.level})`,
    `Position #${args.position}`,
    `Parent: ${parent}`,
  ].join("\n");
}
