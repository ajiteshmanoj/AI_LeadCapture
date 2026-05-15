// Channel abstraction.
//
// Every reply the system sends to a parent goes through `sendChannelReply`,
// regardless of whether it's an in-flow chatbot reply (web/whatsapp/telegram)
// or a scheduled outbound message (lead nurture, lesson reminders, broadcasts).
// The web channel is a no-op here — the API route returns the reply over HTTP
// directly and there's no outbound API call to make.

import { adminClient } from "@/lib/supabase/admin";
import { sendMessage as telegramSend } from "@/lib/integrations/telegram";
import { sendMessage as whatsappSend } from "@/lib/integrations/whatsapp";
import type { Channel } from "@/types";

export interface SendOutcome {
  ok: boolean;
  reason?: string;
  externalMessageId?: string;
}

export async function sendChannelReply(
  orgId: string,
  channel: Channel,
  channelUserId: string | null,
  text: string,
): Promise<SendOutcome> {
  if (channel === "web") {
    return { ok: true };
  }

  if (!channelUserId) {
    return { ok: false, reason: "channel_user_id required for non-web channels" };
  }

  const { data: org } = await adminClient()
    .from("organisations")
    .select("telegram_bot_token, twilio_account_sid, twilio_auth_token, twilio_whatsapp_from")
    .eq("id", orgId)
    .single();

  if (channel === "telegram") {
    if (!org?.telegram_bot_token) {
      return { ok: false, reason: "Telegram bot not connected for this org" };
    }
    const res = await telegramSend(org.telegram_bot_token, channelUserId, text);
    return res.ok
      ? { ok: true, externalMessageId: String(res.messageId) }
      : { ok: false, reason: res.reason };
  }

  if (channel === "whatsapp") {
    if (!org?.twilio_account_sid || !org.twilio_auth_token || !org.twilio_whatsapp_from) {
      return { ok: false, reason: "WhatsApp not connected for this org" };
    }
    const res = await whatsappSend(
      org.twilio_account_sid,
      org.twilio_auth_token,
      org.twilio_whatsapp_from,
      channelUserId,
      text,
    );
    return res.ok
      ? { ok: true, externalMessageId: res.sid }
      : { ok: false, reason: res.reason };
  }

  return { ok: false, reason: `Unknown channel: ${channel as string}` };
}
