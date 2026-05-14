"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, AlertTriangle, RotateCcw, CheckCircle2 } from "lucide-react";
import type { Message } from "@/types";

type ConvStatus = "active" | "escalated" | "closed";

interface Props {
  conversationId: string;
  initialMessages: Message[];
  initialStatus: ConvStatus;
  channel: string;
  startedAt: string;
}

export function ConversationView({
  conversationId,
  initialMessages,
  initialStatus,
  channel,
  startedAt,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [status, setStatus] = useState<ConvStatus>(initialStatus);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Realtime: append new messages as they land. Realtime payload doesn't
  // honour our app-level Message shape, so we re-fetch the row by id.
  useEffect(() => {
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newId = (payload.new as { id?: string }).id;
          if (!newId) return;
          const { data } = await supabase
            .from("messages")
            .select("*")
            .eq("id", newId)
            .single();
          if (data) {
            setMessages((prev) =>
              prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message],
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const next = (payload.new as { status?: ConvStatus }).status;
          if (next) setStatus(next);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  // Auto-scroll on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function setStatusOn(server: ConvStatus) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: server }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update status");
        return;
      }
      setStatus(server);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!draft.trim()) return;
    setBusy(true);
    setError(null);
    const text = draft;
    setDraft("");
    try {
      const res = await fetch(`/api/conversations/${conversationId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send");
        setDraft(text); // restore so admin can retry
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Conversation</h1>
          <p className="text-sm text-muted-foreground">
            Channel: <span className="capitalize">{channel}</span> · Started{" "}
            {new Date(startedAt).toLocaleString()}
          </p>
        </div>
        <StatusControls
          status={status}
          busy={busy}
          onTakeOver={() => setStatusOn("escalated")}
          onHandBack={() => setStatusOn("active")}
          onResolve={() => setStatusOn("closed")}
        />
      </div>

      {status === "escalated" && (
        <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
          <AlertTriangle className="h-4 w-4" />
          <span>You've taken over this conversation. The bot will not auto-reply.</span>
        </div>
      )}
      {status === "closed" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded p-3">
          <CheckCircle2 className="h-4 w-4" /> This conversation is closed.
        </div>
      )}

      <Card className="p-4">
        <div ref={scrollRef} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          )}
        </div>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {status === "escalated" ? (
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            placeholder="Type a reply (⌘/Ctrl+Enter to send)"
            rows={2}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button onClick={send} disabled={busy || !draft.trim()}>
            <Send className="h-4 w-4 mr-1" /> Send
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Click <strong>Take over</strong> to pause the bot and reply directly.
        </p>
      )}
    </div>
  );
}

function StatusControls({
  status,
  busy,
  onTakeOver,
  onHandBack,
  onResolve,
}: {
  status: ConvStatus;
  busy: boolean;
  onTakeOver: () => void;
  onHandBack: () => void;
  onResolve: () => void;
}) {
  return (
    <div className="flex gap-2">
      {status !== "escalated" && status !== "closed" && (
        <Button variant="outline" onClick={onTakeOver} disabled={busy}>
          <AlertTriangle className="h-4 w-4 mr-1" /> Take over
        </Button>
      )}
      {status === "escalated" && (
        <Button variant="outline" onClick={onHandBack} disabled={busy}>
          <RotateCcw className="h-4 w-4 mr-1" /> Hand back to bot
        </Button>
      )}
      {status !== "closed" && (
        <Button variant="outline" onClick={onResolve} disabled={busy}>
          <CheckCircle2 className="h-4 w-4 mr-1" /> Mark resolved
        </Button>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const m = message;

  if (m.role === "system") {
    return (
      <div className="flex justify-center">
        <div className="text-xs italic text-muted-foreground bg-muted/40 px-3 py-1 rounded-full">
          {m.content}
        </div>
      </div>
    );
  }

  const isParent = m.role === "user";
  const isAdmin = m.role === "admin";

  const align = isParent ? "justify-end" : "justify-start";
  const bubble = isParent
    ? "bg-primary text-primary-foreground"
    : isAdmin
      ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
      : "bg-muted";

  const author = isParent ? null : isAdmin ? "Admin" : "Bot";

  return (
    <div className={`flex ${align}`}>
      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${bubble}`}>
        {author && (
          <div className="text-[10px] font-medium uppercase tracking-wide opacity-70 mb-0.5">
            {author}
          </div>
        )}
        <div>{m.content}</div>
        <div className="text-[10px] mt-1 opacity-70">
          {new Date(m.created_at).toLocaleTimeString()}
          {m.intent ? ` · ${m.intent}` : ""}
        </div>
      </div>
    </div>
  );
}
