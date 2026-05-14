"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Location } from "@/types";

const EMPTY = {
  name: "",
  address: "",
  postal_code: "",
  mrt_nearest: "",
  phone: "",
  notes: "",
};

export function LocationsManager({
  initialLocations,
  orgId,
}: {
  initialLocations: Location[];
  orgId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    if (!form.name.trim()) {
      setError("Centre name is required.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("locations").insert({
      org_id: orgId,
      name: form.name.trim(),
      address: form.address.trim() || null,
      postal_code: form.postal_code.trim() || null,
      mrt_nearest: form.mrt_nearest.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setForm(EMPTY);
    router.refresh();
  }

  async function toggle(l: Location) {
    await supabase.from("locations").update({ is_active: !l.is_active }).eq("id", l.id);
    router.refresh();
  }

  async function remove(l: Location) {
    if (!confirm(`Delete ${l.name}? Classes linked to this centre will lose their centre tag.`)) return;
    await supabase.from("locations").delete().eq("id", l.id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Field label="Centre name">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tampines Hub"
          />
        </Field>
        <Field label="Address">
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="1 Tampines Walk, #04-12"
          />
        </Field>
        <Field label="Postal code">
          <Input
            value={form.postal_code}
            onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
            placeholder="528523"
          />
        </Field>
        <Field label="Nearest MRT">
          <Input
            value={form.mrt_nearest}
            onChange={(e) => setForm({ ...form, mrt_nearest: e.target.value })}
            placeholder="Tampines MRT"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+65 6789 0001"
          />
        </Field>
        <Field label="Notes (internal)">
          <Input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional"
          />
        </Field>
        <div className="flex items-end md:col-span-3">
          <Button onClick={add} disabled={busy}>
            {busy ? "Adding…" : "Add centre"}
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Centre</th>
              <th className="px-3 py-2 font-medium">Address</th>
              <th className="px-3 py-2 font-medium">MRT</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {initialLocations.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">{l.name}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {l.address ?? "—"}
                  {l.postal_code ? ` (${l.postal_code})` : ""}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{l.mrt_nearest ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{l.phone ?? "—"}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => toggle(l)}
                    className={`text-xs px-2 py-0.5 rounded ${l.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}
                  >
                    {l.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => remove(l)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {initialLocations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No centres yet — add one above.
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
