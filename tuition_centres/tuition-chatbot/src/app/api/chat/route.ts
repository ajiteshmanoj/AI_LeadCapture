import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleChat, streamHandleChat } from "@/lib/chat/engine";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const ChatSchema = z.object({
  org_id: z.string().uuid(),
  conversation_id: z.string().uuid().optional(),
  channel: z.enum(["web", "whatsapp", "telegram"]),
  channel_user_id: z.string().max(100).optional(),
  message: z.string().min(1).max(2000),
  stream: z.boolean().optional(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: corsHeaders },
    );
  }
  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders },
    );
  }
  const data = parsed.data;

  const rateKey =
    data.conversation_id ??
    `${data.org_id}:${data.channel}:${data.channel_user_id ?? request.headers.get("x-forwarded-for") ?? "anon"}`;
  const rl = checkRateLimit(rateKey, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "Slow down — you've sent too many messages. Please wait a moment.",
      },
      { status: 429, headers: corsHeaders },
    );
  }

  // Streaming path — returns SSE so the widget can show tokens as they arrive.
  if (data.stream) {
    const sseHeaders = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        await streamHandleChat(data, controller).catch((err) => {
          console.error("[/api/chat stream] error", err);
          const errEvent = new TextEncoder().encode(
            `data: ${JSON.stringify({ t: "err", v: "Something went wrong. Please try again." })}\n\n`,
          );
          try {
            controller.enqueue(errEvent);
            controller.close();
          } catch {}
        });
      },
    });
    return new Response(readable, { headers: sseHeaders });
  }

  // Non-streaming path (Telegram webhook, backward compat).
  try {
    const result = await handleChat(data);
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (err) {
    console.error("[/api/chat] error", err);
    return NextResponse.json(
      {
        error:
          "Sorry, something went wrong on our end. Please try again in a moment.",
      },
      { status: 500, headers: corsHeaders },
    );
  }
}
