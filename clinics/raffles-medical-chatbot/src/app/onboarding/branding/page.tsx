"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BrandingStep() {
  const router = useRouter();
  const [primary, setPrimary] = useState("#1e3a5f");
  const [secondary, setSecondary] = useState("#e8eef7");
  const [accent, setAccent] = useState("#2563eb");
  const [logo, setLogo] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function next() {
    setBusy(true);
    setError(null);
    try {
      let logoUrl: string | null = null;
      if (logo) {
        const fd = new FormData();
        fd.append("file", logo);
        const res = await fetch("/api/branding/upload-logo", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          logoUrl = data.url;
        }
      }

      const branding: Record<string, string> = { primary, secondary, accent };
      if (logoUrl) branding.logo_url = logoUrl;

      await fetch("/api/branding/save-palette", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branding }),
      });

      const res = await fetch("/api/onboarding/complete-step", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "branding" }),
      });
      if (!res.ok) { setError("Failed to save."); return; }
      router.push("/onboarding/document");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Branding</h2>
        <p className="text-sm text-muted-foreground">Your dashboard and widget will reflect these colours.</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Logo (optional)</Label>
        <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
          className="block text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:text-xs file:bg-muted file:text-foreground" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ColorField label="Primary" value={primary} onChange={setPrimary} />
        <ColorField label="Secondary" value={secondary} onChange={setSecondary} />
        <ColorField label="Accent" value={accent} onChange={setAccent} />
      </div>

      {/* Live preview swatch */}
      <div className="rounded border p-4 space-y-2" style={{ backgroundColor: secondary }}>
        <div className="text-xs text-muted-foreground">Preview</div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded text-sm font-medium text-white" style={{ backgroundColor: primary }}>Primary button</button>
          <button className="px-3 py-1.5 rounded text-sm font-medium border" style={{ color: accent, borderColor: accent }}>Accent button</button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/onboarding/centre")} disabled={busy}>← Back</Button>
        <Button onClick={next} disabled={busy} className="flex-1">{busy ? "Saving…" : "Continue →"}</Button>
      </div>
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
