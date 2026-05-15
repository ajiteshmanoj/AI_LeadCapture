import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { adminClient } from "@/lib/supabase/admin";
import { handleChat } from "@/lib/chat/engine";
import { sendChannelReply } from "@/lib/chat/channels";
import { validateWebhookSignature, parseWhatsAppFrom } from "@/lib/integrations/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string } },
) {
  const orgSlug = params.orgSlug;

  // Parse URL-encoded Twilio body before consuming the stream.
  const rawText = await req.text();
  const body = Object.fromEntries(new URLSearchParams(rawText)) as Record<string, string>;

  const { data: org } = await adminClient()
    .from("organisations")
    .select("id, twilio_account_sid, twilio_auth_token, twilio_whatsapp_from")
    .eq("slug", orgSlug)
    .single();

  if (!org?.twilio_auth_token) {
    return NextResponse.json({ error: "Unknown org or WhatsApp not connected" }, { status: 404 });
  }

  // Validate Twilio signature.
  const signature = req.headers.get("x-twilio-signature") ?? "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp/${orgSlug}`;
  if (!validateWebhookSignature(org.twilio_auth_token, url, body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const incomingText: string = body.Body ?? "";
  const from: string = body.From ?? "";
  const phoneNumber = parseWhatsAppFrom(from);

  // Non-text messages (images, voice, etc.) — acknowledge and skip.
  if (!incomingText.trim() || !phoneNumber) {
    return new Response("<?xml version='1.0'?><Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Run chat engine in background so Twilio gets a fast 200 response.
  // Replies are sent via the Twilio REST API (not TwiML response body) so
  // waitUntil is the right pattern here.
  waitUntil(
    handleChat({
      org_id: org.id,
      channel: "whatsapp",
      channel_user_id: from, // keep "whatsapp:+65..." prefix for outbound consistency
      message: incomingText,
    })
      .then((reply) => sendChannelReply(org.id, "whatsapp", from, reply.reply))
      .then((sent) => {
        if (!sent.ok) console.error("[whatsapp webhook] send failed", sent.reason);
      })
      .catch(async (err) => {
        console.error("[whatsapp webhook] handleChat error", err);
        await sendChannelReply(
          org.id,
          "whatsapp",
          from,
          "Sorry, something went wrong on our end. Please try again in a moment, or call the centre directly.",
        ).catch(() => undefined);
      }),
  );

  // Return empty TwiML — actual reply is sent via REST API inside waitUntil.
  return new Response("<?xml version='1.0'?><Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}
