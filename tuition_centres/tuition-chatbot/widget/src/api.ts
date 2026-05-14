export interface SendMessageInput {
  apiUrl: string;
  orgId: string;
  conversationId: string | null;
  message: string;
}

export interface StreamCallbacks {
  onToken: (text: string) => void;
  onDone: (conversationId: string, followup?: string) => void;
  onError: (message: string) => void;
}

// Streaming send — opens an SSE connection and calls callbacks as events arrive.
// Tokens appear in the widget in real time; the final `onDone` carries the
// conversation_id and any booking confirmation text.
export async function sendMessageStream(
  input: SendMessageInput,
  callbacks: StreamCallbacks,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${input.apiUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org_id: input.orgId,
        conversation_id: input.conversationId ?? undefined,
        channel: "web",
        message: input.message,
        stream: true,
      }),
    });
  } catch {
    callbacks.onError("Connection failed. Please check your internet and try again.");
    return;
  }

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    callbacks.onError(err.error ?? `Request failed (${res.status})`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      // SSE events are separated by double newlines.
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";

      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        try {
          const ev = JSON.parse(part.slice(6)) as {
            t: string;
            v?: string;
            cid?: string;
            fu?: string;
          };
          if (ev.t === "tok" && ev.v) {
            callbacks.onToken(ev.v);
          } else if (ev.t === "end") {
            callbacks.onDone(ev.cid ?? "", ev.fu);
          } else if (ev.t === "err") {
            callbacks.onError(ev.v ?? "Something went wrong.");
          }
        } catch {}
      }
    }
  } catch {
    callbacks.onError("Connection dropped. Please try again.");
  }
}
