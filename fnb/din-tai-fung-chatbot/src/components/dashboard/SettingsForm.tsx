"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Organisation } from "@/types";

export function SettingsForm({ org }: { org: Organisation }) {
  const router = useRouter();
  const supabase = createClient();
  const settings = org.settings ?? {};
  const [botName, setBotName] = useState(settings.bot_name ?? "Amy");
  const [welcome, setWelcome] = useState(settings.welcome_message ?? "Hi! How can I help?");
  const [color, setColor] = useState(settings.primary_color ?? "#2563eb");
  const [contactPerson, setContactPerson] = useState(settings.contact_person ?? "");
  const [phone, setPhone] = useState(org.phone ?? "");
  const [email, setEmail] = useState(org.email ?? "");
  const [address, setAddress] = useState(org.address ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    setError(null);
    const { error } = await supabase
      .from("organisations")
      .update({
        phone,
        email,
        address,
        settings: {
          ...settings,
          bot_name: botName,
          welcome_message: welcome,
          primary_color: color,
          contact_person: contactPerson,
        },
      })
      .eq("id", org.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Bot name" value={botName} onChange={setBotName} />
        <Field label="Primary colour (hex)" value={color} onChange={setColor} />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <Field label="Email" value={email} onChange={setEmail} />
        <Field label="Contact person (for escalations)" value={contactPerson} onChange={setContactPerson} />
        <Field label="Address" value={address} onChange={setAddress} />
      </div>
      <div className="space-y-2">
        <Label>Welcome message</Label>
        <Textarea rows={2} value={welcome} onChange={(e) => setWelcome(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
