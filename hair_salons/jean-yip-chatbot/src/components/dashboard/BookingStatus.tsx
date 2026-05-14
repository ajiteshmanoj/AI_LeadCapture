"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type Status = "confirmed" | "completed" | "no_show" | "cancelled";

const OPTIONS: { value: Status; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" },
  { value: "cancelled", label: "Cancelled" },
];

export function BookingStatus({
  id,
  initial,
}: {
  id: string;
  initial: Status;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initial);
  const [busy, setBusy] = useState(false);

  async function update(next: Status) {
    if (next === status) return;
    if (next === "cancelled" && !confirm("Cancel this booking? Calendar event will be removed.")) return;
    setBusy(true);
    const prev = status;
    setStatus(next);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) {
        setStatus(prev);
        const j = await res.json().catch(() => ({}));
        alert(`Update failed: ${j.error ?? res.statusText}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      className={cn(
        "h-8 rounded-md border bg-background px-2 text-xs capitalize disabled:opacity-50",
        status === "completed" && "border-emerald-300 text-emerald-700",
        status === "no_show" && "border-amber-300 text-amber-700",
        status === "cancelled" && "border-red-300 text-red-700",
      )}
      disabled={busy}
      value={status}
      onChange={(e) => update(e.target.value as Status)}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
