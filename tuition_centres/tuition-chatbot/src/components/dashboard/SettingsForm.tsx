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
  const [paynowUen, setPaynowUen] = useState(org.paynow_uen ?? "");
  const [paynowPhone, setPaynowPhone] = useState(org.paynow_phone ?? "");
  const [billingDay, setBillingDay] = useState(String(org.billing_day ?? 1));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    setError(null);
    const billingDayNum = Number(billingDay);
    const validBillingDay = Number.isFinite(billingDayNum) && billingDayNum >= 1 && billingDayNum <= 28
      ? billingDayNum
      : 1;
    const { error } = await supabase
      .from("organisations")
      .update({
        phone,
        email,
        address,
        paynow_uen: paynowUen.trim() || null,
        paynow_phone: paynowPhone.trim() || null,
        billing_day: validBillingDay,
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
      <div className="pt-2 border-t space-y-1">
        <Label className="text-sm font-semibold">PayNow (for fee reminders)</Label>
        <p className="text-xs text-muted-foreground">
          Set either UEN <em>or</em> phone — UEN is used first if both are set. Powers the QR attached to monthly payment reminders.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="PayNow UEN" value={paynowUen} onChange={setPaynowUen} />
        <Field label="PayNow phone (+65…)" value={paynowPhone} onChange={setPaynowPhone} />
        <Field label="Billing day (1-28)" value={billingDay} onChange={setBillingDay} />
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
