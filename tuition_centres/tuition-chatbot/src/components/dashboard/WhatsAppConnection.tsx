"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  connected: boolean;
  webhookUrl?: string;
}

export function WhatsAppConnection({ connected, webhookUrl }: Props) {
  const router = useRouter();
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/integrations/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_sid: accountSid,
          auth_token: authToken,
          from_number: fromNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Connect failed");
        return;
      }
      setSuccess(`Connected! Set your Twilio webhook URL to: ${data.webhook_url}`);
      setAccountSid("");
      setAuthToken("");
      setFromNumber("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!confirm("Disconnect WhatsApp? Parents messaging via WhatsApp will no longer get a reply.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/whatsapp/disconnect", { method: "POST" });
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
              Parents messaging your WhatsApp number will get instant AI replies.
            </span>
          </div>
          {webhookUrl && (
            <p className="text-xs text-muted-foreground">
              Webhook URL: <code className="bg-muted px-1 py-0.5 rounded text-xs">{webhookUrl}</code>
            </p>
          )}
          <Button variant="outline" onClick={disconnect} disabled={busy}>
            {busy ? "Disconnecting…" : "Disconnect WhatsApp"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Create a <strong>Twilio account</strong> at twilio.com and set up WhatsApp Business.</li>
            <li>Get your <strong>Account SID</strong> and <strong>Auth Token</strong> from the Twilio Console.</li>
            <li>Enter the <strong>WhatsApp From number</strong> (e.g. +14155238886 or your approved number).</li>
            <li>After connecting, set the Twilio webhook URL to the URL shown here.</li>
          </ol>

          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor="wa-account-sid">Twilio Account SID</Label>
              <Input
                id="wa-account-sid"
                autoComplete="off"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wa-auth-token">Twilio Auth Token</Label>
              <Input
                id="wa-auth-token"
                type="password"
                autoComplete="off"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="your auth token"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wa-from">WhatsApp From number</Label>
              <Input
                id="wa-from"
                autoComplete="off"
                value={fromNumber}
                onChange={(e) => setFromNumber(e.target.value)}
                placeholder="+14155238886"
              />
            </div>
          </div>

          <Button onClick={connect} disabled={busy || !accountSid || !authToken || !fromNumber}>
            {busy ? "Connecting…" : "Connect WhatsApp"}
          </Button>
        </div>
      )}
    </div>
  );
}
