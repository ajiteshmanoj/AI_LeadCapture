"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, CheckCircle2 } from "lucide-react";

export function InviteForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [signupUrl, setSignupUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function deriveSlug(n: string) {
    return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function generate() {
    setBusy(true);
    setError(null);
    setSignupUrl(null);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centre_name: name, slug, admin_email: email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      setSignupUrl(data.signup_url);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!signupUrl) return;
    await navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 bg-white border rounded-lg p-6">
      <div className="space-y-2">
        <Label>Centre name</Label>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slug || slug === deriveSlug(name)) setSlug(deriveSlug(e.target.value));
          }}
          placeholder="Zenith Education Studio"
        />
      </div>
      <div className="space-y-2">
        <Label>Slug (URL-safe, unique)</Label>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          placeholder="zenith"
        />
      </div>
      <div className="space-y-2">
        <Label>Admin email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@zenith.edu.sg"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={generate} disabled={busy || !name || !slug || !email} className="w-full">
        {busy ? "Generating…" : "Generate invite link"}
      </Button>

      {signupUrl && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-4 space-y-2">
          <div className="text-sm font-medium text-emerald-800">Signup URL — send this to the centre</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border rounded px-2 py-1.5 break-all">
              {signupUrl}
            </code>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-emerald-700">Expires in 7 days. Single use.</p>
        </div>
      )}
    </div>
  );
}
