// Twilio WhatsApp Business API wrapper.
//
// Each org has its own Twilio Account SID / Auth Token (stored encrypted in
// the organisations row). The `from` number is the Twilio WhatsApp sandbox or
// business number: "whatsapp:+14155238886".

import twilio from "twilio";

export async function sendMessage(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string,
  opts: { mediaUrl?: string } = {},
): Promise<{ ok: true; sid: string } | { ok: false; reason: string }> {
  try {
    const client = twilio(accountSid, authToken);
    const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const fromFormatted = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
    const msg = await client.messages.create({
      from: fromFormatted,
      to: toFormatted,
      body,
      ...(opts.mediaUrl ? { mediaUrl: [opts.mediaUrl] } : {}),
    });
    return { ok: true, sid: msg.sid };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: message };
  }
}

// Validates an inbound Twilio webhook request.
// `rawBody` must be the raw URL-encoded string (before any JSON parsing).
export function validateWebhookSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string,
): boolean {
  try {
    return twilio.validateRequest(authToken, signature, url, params);
  } catch {
    return false;
  }
}

// Parse a WhatsApp "From" field to a normalized E.164 phone number.
// "whatsapp:+6591234567" → "+6591234567"
export function parseWhatsAppFrom(from: string): string {
  return from.replace(/^whatsapp:/i, "");
}
