"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CentreStep() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function next() {
    if (!name.trim()) { setError("Salon name is required."); return; }
    setBusy(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: membership } = await supabase
      .from("org_members").select("org_id").eq("user_id", user.id).limit(1).maybeSingle();
    if (!membership?.org_id) { setBusy(false); return; }

    await supabase.from("organisations").update({ name: name.trim(), address: address.trim() || null, phone: phone.trim() || null, email: email.trim() || null }).eq("id", membership.org_id);

    const res = await fetch("/api/onboarding/complete-step", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "centre" }),
    });
    if (!res.ok) { setError("Failed to save."); setBusy(false); return; }
    router.push("/onboarding/branding");
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Salon details</h2>
        <p className="text-sm text-muted-foreground">Used by the chatbot to answer client questions.</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <Field label="Salon name *"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Yip @ Jurong Point" /></Field>
        <Field label="Address"><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="1 Jurong West Central 2, #B1-01 Jurong Point" /></Field>
        <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+65 6789 0001" /></Field>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="enquiries@jeanyip.com.sg" /></Field>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={next} disabled={busy} className="w-full">{busy ? "Saving…" : "Continue →"}</Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
