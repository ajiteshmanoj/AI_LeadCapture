// Realtime subscription for the embedded widget.
//
// Subscribes to Postgres INSERTs on the `messages` table for a single
// conversation. When a receptionist takes over from the dashboard, their
// reply is persisted with role='admin' — the widget receives the row over
// WebSocket and renders it without polling.
//
// Uses @supabase/realtime-js directly (no full supabase-js client) to keep
// the widget bundle small. Supabase URL + anon key are baked in at build
// time via esbuild's `define`. Both are public (the anon key is shipped to
// every browser anyway); RLS + migration 009's publication allowlist protect
// the data.

import { RealtimeClient } from "@supabase/realtime-js";

declare const __SUPABASE_REALTIME_URL__: string;
declare const __SUPABASE_ANON_KEY__: string;

export interface IncomingMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface RealtimeHandle {
  close: () => void;
}

export function subscribeToConversation(
  conversationId: string,
  onMessage: (msg: IncomingMessage) => void,
): RealtimeHandle | null {
  if (!__SUPABASE_REALTIME_URL__ || !__SUPABASE_ANON_KEY__) {
    // Build-time env wasn't injected — happens in dev when vars aren't set.
    return null;
  }

  const client = new RealtimeClient(__SUPABASE_REALTIME_URL__, {
    params: { apikey: __SUPABASE_ANON_KEY__ },
  });

  const channel = client.channel(`widget:conv:${conversationId}`, {
    config: { broadcast: { self: false }, presence: { key: "" } },
  });

  channel.on<IncomingMessage>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "postgres_changes" as any,
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (payload: any) => {
      const row = payload?.new as IncomingMessage | undefined;
      if (row && row.role && row.content) {
        onMessage(row);
      }
    },
  );

  channel.subscribe();

  return {
    close() {
      try {
        channel.unsubscribe();
        client.disconnect();
      } catch {
        // best-effort
      }
    },
  };
}
