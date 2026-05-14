// Parent opt-in deep links — channel-agnostic helper.
//
// After a web (or future SMS) booking, the parent has no messaging-channel
// connection to the bot. We surface deep links so they can opt in with one tap.
//
// - Telegram: https://t.me/<bot_username>?start=<payload> — hands `/start <payload>`
//   to the webhook, which captures the sender's chat_id.
// - WhatsApp (future): https://wa.me/<centre_number>?text=<prefilled> — when the
//   parent sends, the webhook parses the prefilled token and links them.
//
// We always return all viable channels; the caller decides which to show.

import { adminClient } from "@/lib/supabase/admin";
import { getMe } from "@/lib/integrations/telegram";

export interface ParentOptInLink {
  channel: "telegram" | "whatsapp";
  url: string;
  label: string;
}

const TELEGRAM_PAYLOAD_PREFIX = "b_"; // "b" for booking
export const TELEGRAM_PAYLOAD_RE = /^b_([0-9a-f-]{36})$/i;

export function buildTelegramStartPayload(bookingId: string): string {
  return `${TELEGRAM_PAYLOAD_PREFIX}${bookingId}`;
}

export async function buildParentOptInLinks(
  orgId: string,
  bookingId: string,
): Promise<ParentOptInLink[]> {
  const { data: org } = await adminClient()
    .from("organisations")
    .select("telegram_bot_token, telegram_bot_username, whatsapp_number")
    .eq("id", orgId)
    .single();

  const links: ParentOptInLink[] = [];

  if (org?.telegram_bot_token) {
    let username = org.telegram_bot_username;
    // Lazy backfill: existing orgs connected before username was tracked.
    if (!username) {
      const me = await getMe(org.telegram_bot_token);
      if (me?.username) {
        username = me.username;
        await adminClient()
          .from("organisations")
          .update({ telegram_bot_username: username })
          .eq("id", orgId);
      }
    }
    if (username) {
      const payload = buildTelegramStartPayload(bookingId);
      links.push({
        channel: "telegram",
        url: `https://t.me/${username}?start=${payload}`,
        label: "Get reminders & updates on Telegram",
      });
    }
  }

  // WhatsApp branch — wired but inert until centre adds a WhatsApp number AND
  // the WhatsApp inbound webhook is implemented (Phase 3 part 3).
  if (org?.whatsapp_number) {
    const number = org.whatsapp_number.replace(/[^0-9]/g, "");
    const text = encodeURIComponent(
      `Hi! Booking ref: ${bookingId.slice(0, 8)} — please link me for updates.`,
    );
    links.push({
      channel: "whatsapp",
      url: `https://wa.me/${number}?text=${text}`,
      label: "Get reminders & updates on WhatsApp",
    });
  }

  return links;
}
