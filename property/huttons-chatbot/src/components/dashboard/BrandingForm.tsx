"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BrandingSettings } from "@/types";

export function BrandingForm({ initial }: { initial: BrandingSettings }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [primary, setPrimary] = useState(initial.primary ?? "#1e3a5f");
  const [secondary, setSecondary] = useState(initial.secondary ?? "#e8eef7");
  const [accent, setAccent] = useState(initial.accent ?? "#2563eb");
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadLogo(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/branding/upload-logo", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setLogoUrl(data.url);
    else setError(data.error ?? "Upload failed");
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/branding/save-palette", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branding: { primary, secondary, accent, logo_url: logoUrl || undefined } }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Save failed"); return; }
    setMessage("Branding saved. Reload to see the updated colours.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Logo</Label>
        <div className="flex items-center gap-3">
          {logoUrl && <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain rounded border p-1" />}
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            {logoUrl ? "Replace logo" : "Upload logo"}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ColorField label="Primary" value={primary} onChange={setPrimary} />
        <ColorField label="Secondary" value={secondary} onChange={setSecondary} />
        <ColorField label="Accent" value={accent} onChange={setAccent} />
      </div>

      {/* Live preview */}
      <div className="rounded border p-4 space-y-2" style={{ backgroundColor: secondary }}>
        <div className="text-xs text-muted-foreground">Preview</div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded text-sm font-medium text-white" style={{ backgroundColor: primary }}>Primary</button>
          <button className="px-3 py-1.5 rounded text-sm font-medium border" style={{ color: accent, borderColor: accent }}>Accent</button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save branding"}</Button>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-10 cursor-pointer rounded border" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}
