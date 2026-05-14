"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  connected: boolean;
}

export function TelegramConnection({ connected }: Props) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/integrations/telegram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Connect failed");
        return;
      }
      setSuccess(`Connected to @${data.bot.username}. Webhook live at ${data.webhook_url}`);
      setToken("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!confirm("Disconnect Telegram bot? Parents messaging it will no longer get a reply.")) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/integrations/telegram/disconnect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Disconnect failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="break-all">{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
              <CheckCircle2 className="h-3 w-3" /> Connected
            </span>
            <span className="text-muted-foreground">
              Parents messaging your Telegram bot will be answered by the chatbot automatically.
            </span>
          </div>
          <Button variant="outline" onClick={disconnect} disabled={busy}>
            {busy ? "Disconnecting…" : "Disconnect Telegram bot"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Open Telegram, message <strong>@BotFather</strong>.</li>
            <li>Send <code>/newbot</code>, give it a name and a username ending in <code>bot</code>.</li>
            <li>BotFather replies with an HTTP API token — paste it below.</li>
          </ol>
          <div className="space-y-2">
            <Label htmlFor="bot-token">Bot HTTP API token</Label>
            <Input
              id="bot-token"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="123456:ABC-DEF..."
            />
          </div>
          <Button onClick={connect} disabled={busy || !token}>
            {busy ? "Connecting…" : "Connect Telegram bot"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Telegram needs a publicly reachable URL. For local dev, expose your
            server with ngrok and set <code>NEXT_PUBLIC_APP_URL</code> to the
            ngrok URL before connecting.
          </p>
        </div>
      )}
    </div>
  );
}
