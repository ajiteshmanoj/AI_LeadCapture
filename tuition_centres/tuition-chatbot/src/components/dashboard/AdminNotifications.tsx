"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Copy } from "lucide-react";

interface Props {
  botConnected: boolean;
  adminLinked: boolean;
}

export function AdminNotifications({ botConnected, adminLinked }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    setCode(null);
    try {
      const res = await fetch("/api/integrations/telegram/admin-link", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate code");
        return;
      }
      setCode(data.code);
    } finally {
      setBusy(false);
    }
  }

  async function unlink() {
    if (!confirm("Unlink admin notifications? You'll stop receiving Telegram alerts.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/telegram/admin-link", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to unlink");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function copyCommand() {
    if (!code) return;
    await navigator.clipboard.writeText(`/linkadmin ${code}`);
  }

  if (!botConnected) {
    return (
      <p className="text-sm text-muted-foreground">
        Connect your Telegram bot first (above) — once that's done, you can link
        your personal Telegram account to receive booking and waitlist alerts.
      </p>
    );
  }

  if (adminLinked) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
            <CheckCircle2 className="h-3 w-3" /> Linked
          </span>
          <span className="text-muted-foreground">
            You'll be pinged on every new trial booking, waitlist entry and escalation.
          </span>
        </div>
        <Button variant="outline" onClick={unlink} disabled={busy}>
          {busy ? "Unlinking…" : "Unlink admin"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Get a Telegram ping the moment something happens — new bookings,
        waitlist entries, parent escalations. One-time setup, takes 30 seconds.
      </p>

      {!code ? (
        <Button onClick={generate} disabled={busy}>
          {busy ? "Generating…" : "Generate linking code"}
        </Button>
      ) : (
        <div className="space-y-3 rounded border border-emerald-200 bg-emerald-50 p-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-emerald-700 font-medium">
              Step 1 — copy this command
            </div>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white border rounded font-mono text-sm">
                /linkadmin {code}
              </code>
              <Button variant="outline" size="sm" onClick={copyCommand}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy
              </Button>
            </div>
          </div>
          <div className="text-sm text-emerald-900">
            <strong>Step 2</strong> — open Telegram, find your centre's bot,
            paste the command and send. The code expires in 10 minutes.
          </div>
        </div>
      )}
    </div>
  );
}
