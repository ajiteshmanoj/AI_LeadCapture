"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "waiting" | "notified" | "enrolled" | "expired";

export interface WaitlistEntry {
  id: string;
  position: number;
  status: Status;
  notified_at: string | null;
  student_name: string;
  parent_name: string | null;
  parent_phone: string;
}

const STATUS_STYLES: Record<Status, string> = {
  waiting: "bg-amber-100 text-amber-700",
  notified: "bg-sky-100 text-sky-700",
  enrolled: "bg-emerald-100 text-emerald-700",
  expired: "bg-muted text-muted-foreground",
};

export function WaitlistGroup({
  classId,
  className,
  entries,
}: {
  classId: string;
  className: string;
  entries: WaitlistEntry[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function openSlot() {
    if (!confirm(`Notify the first person on the waitlist for ${className}?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "notify_first", class_id: classId }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(`Failed: ${j.error ?? res.statusText}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: Status) {
    setBusy(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_status", id, status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Failed: ${j.error ?? res.statusText}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const waitingCount = entries.filter((e) => e.status === "waiting").length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{className}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {waitingCount} waiting · {entries.length} total
          </p>
        </div>
        <Button onClick={openSlot} disabled={busy || waitingCount === 0} size="sm">
          Open a slot &amp; notify
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-t border-b bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium w-10">#</th>
              <th className="px-4 py-2 font-medium">Student</th>
              <th className="px-4 py-2 font-medium">Parent</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b last:border-0">
                <td className="px-4 py-2 text-muted-foreground">{e.position}</td>
                <td className="px-4 py-2 font-medium">{e.student_name}</td>
                <td className="px-4 py-2">
                  <div>{e.parent_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{e.parent_phone}</div>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[e.status]}`}>
                    {e.status}
                  </span>
                  {e.notified_at && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      notified {new Date(e.notified_at).toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  {e.status === "waiting" && (
                    <button
                      onClick={() => setStatus(e.id, "expired")}
                      className="text-xs text-muted-foreground hover:underline"
                      disabled={busy}
                    >
                      Expire
                    </button>
                  )}
                  {e.status === "notified" && (
                    <>
                      <button
                        onClick={() => setStatus(e.id, "enrolled")}
                        className="text-xs text-emerald-700 hover:underline"
                        disabled={busy}
                      >
                        Mark enrolled
                      </button>
                      <button
                        onClick={() => setStatus(e.id, "expired")}
                        className="text-xs text-muted-foreground hover:underline"
                        disabled={busy}
                      >
                        Expire
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
