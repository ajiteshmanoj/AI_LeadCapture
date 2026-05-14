"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

interface Props {
  connected: boolean;
  calendarId: string;
  successFlag: boolean;
  errorFlag?: string;
}

export function CalendarConnection({
  connected,
  calendarId,
  successFlag,
  errorFlag,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function disconnect() {
    if (!confirm("Disconnect Google Calendar? Future bookings will not appear on your calendar.")) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      return;
    }
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!membership?.org_id) {
      setBusy(false);
      return;
    }
    await supabase
      .from("organisations")
      .update({ google_refresh_token: null })
      .eq("id", membership.org_id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {successFlag && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3">
          <CheckCircle2 className="h-4 w-4" /> Calendar connected.
        </div>
      )}
      {errorFlag && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          <AlertCircle className="h-4 w-4" /> Failed to connect: {decodeURIComponent(errorFlag)}
        </div>
      )}

      {connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
              <CheckCircle2 className="h-3 w-3" /> Connected
            </span>
            <span className="text-muted-foreground">
              Calendar: <code className="text-xs">{calendarId}</code>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            New trial bookings made via chat will be added to this calendar with
            student name, parent contact, subject and level.
          </p>
          <Button variant="outline" onClick={disconnect} disabled={busy}>
            {busy ? "Disconnecting…" : "Disconnect"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Calendar is not connected yet. Click below to authorise — you&apos;ll be redirected to Google to grant access.
          </p>
          <a
            href="/api/auth/google/start"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Connect Google Calendar
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
