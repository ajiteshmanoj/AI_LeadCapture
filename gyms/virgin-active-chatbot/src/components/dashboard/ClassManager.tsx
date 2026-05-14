"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClassRow, Location } from "@/types";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const EMPTY = {
  subject: "",
  level: "",
  day_of_week: "Monday",
  start_time: "16:00",
  end_time: "17:30",
  teacher_name: "",
  max_capacity: 8,
  current_enrollment: 0,
  monthly_fee: 0,
  registration_fee: 0,
  material_fee: 0,
  location_id: "" as string,
};

type ClassWithLoc = ClassRow & { location: { id: string; name: string } | null };

export function ClassManager({
  initialClasses,
  locations,
  orgId,
}: {
  initialClasses: ClassWithLoc[];
  locations: Location[];
  orgId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    setBusy(true);
    const payload = {
      ...form,
      location_id: form.location_id || null,
      org_id: orgId,
    };
    const { error } = await supabase.from("classes").insert(payload);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setForm(EMPTY);
    router.refresh();
  }

  async function toggle(c: ClassRow) {
    await supabase.from("classes").update({ is_active: !c.is_active }).eq("id", c.id);
    router.refresh();
  }

  async function remove(c: ClassRow) {
    if (!confirm(`Delete ${c.subject} (${c.level})?`)) return;
    await supabase.from("classes").delete().eq("id", c.id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Class Name">
          <Input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Hot Yoga"
          />
        </Field>
        <Field label="Fitness Level">
          <Input
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            placeholder="All levels"
          />
        </Field>
        <Field label="Day">
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.day_of_week}
            onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
          >
            {DAYS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Instructor">
          <Input
            value={form.teacher_name}
            onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
          />
        </Field>
        <Field label="Club">
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.location_id}
            onChange={(e) => setForm({ ...form, location_id: e.target.value })}
          >
            <option value="">— No club —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Start">
          <Input
            type="time"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
          />
        </Field>
        <Field label="End">
          <Input
            type="time"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
          />
        </Field>
        <Field label="Capacity">
          <Input
            type="number"
            value={form.max_capacity}
            onChange={(e) => setForm({ ...form, max_capacity: Number(e.target.value) })}
          />
        </Field>
        <Field label="Enrolled">
          <Input
            type="number"
            value={form.current_enrollment}
            onChange={(e) => setForm({ ...form, current_enrollment: Number(e.target.value) })}
          />
        </Field>
        <Field label="Monthly Fee ($)">
          <Input
            type="number"
            step="0.01"
            value={form.monthly_fee}
            onChange={(e) => setForm({ ...form, monthly_fee: Number(e.target.value) })}
          />
        </Field>
        <Field label="Joining Fee ($)">
          <Input
            type="number"
            step="0.01"
            value={form.registration_fee}
            onChange={(e) => setForm({ ...form, registration_fee: Number(e.target.value) })}
          />
        </Field>
        <Field label="Material fee ($)">
          <Input
            type="number"
            step="0.01"
            value={form.material_fee}
            onChange={(e) => setForm({ ...form, material_fee: Number(e.target.value) })}
          />
        </Field>
        <div className="flex items-end">
          <Button onClick={add} disabled={busy} className="w-full">
            {busy ? "Adding…" : "Add class"}
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Class Name</th>
              <th className="px-3 py-2 font-medium">Fitness Level</th>
              <th className="px-3 py-2 font-medium">Club</th>
              <th className="px-3 py-2 font-medium">Day</th>
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Instructor</th>
              <th className="px-3 py-2 font-medium">Seats</th>
              <th className="px-3 py-2 font-medium">Fee</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {initialClasses.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="px-3 py-2">{c.subject}</td>
                <td className="px-3 py-2">{c.level}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.location?.name ?? "—"}</td>
                <td className="px-3 py-2">{c.day_of_week}</td>
                <td className="px-3 py-2">{c.start_time.slice(0,5)}–{c.end_time.slice(0,5)}</td>
                <td className="px-3 py-2">{c.teacher_name ?? "—"}</td>
                <td className="px-3 py-2">{c.current_enrollment}/{c.max_capacity}</td>
                <td className="px-3 py-2">${c.monthly_fee}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => toggle(c)}
                    className={`text-xs px-2 py-0.5 rounded ${c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}
                  >
                    {c.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => remove(c)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {initialClasses.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                  No classes yet — add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
