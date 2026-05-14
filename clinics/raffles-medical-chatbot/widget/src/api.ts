export interface SendMessageInput {
  apiUrl: string;
  orgId: string;
  conversationId: string | null;
  message: string;
}

export interface SendMessageResponse {
  conversation_id: string;
  reply: string;
  intent: string;
  error?: string;
}

export async function sendMessage(
  input: SendMessageInput,
): Promise<SendMessageResponse> {
  const res = await fetch(`${input.apiUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      org_id: input.orgId,
      conversation_id: input.conversationId ?? undefined,
      channel: "web",
      message: input.message,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Chat request failed (${res.status})`);
  }
  return (await res.json()) as SendMessageResponse;
}
