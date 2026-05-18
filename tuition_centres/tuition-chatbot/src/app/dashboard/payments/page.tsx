import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

type ReminderStatus = "pending" | "reminded" | "paid" | "overdue" | "escalated";

const STATUS_CONFIG: Record<ReminderStatus, { label: string; style: string; Icon: React.ElementType }> = {
  pending:   { label: "Pending",    style: "bg-muted text-muted-foreground",  Icon: Clock },
  reminded:  { label: "Reminded",   style: "bg-blue-100 text-blue-700",       Icon: Clock },
  paid:      { label: "Paid",       style: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  overdue:   { label: "Overdue",    style: "bg-amber-100 text-amber-700",     Icon: AlertTriangle },
  escalated: { label: "Escalated",  style: "bg-rose-100 text-rose-700",       Icon: AlertTriangle },
};

export default async function PaymentsPage() {
  const org = await getCurrentOrgOrRedirect();

  const { data: orgRow } = await adminClient()
    .from("organisations")
    .select("paynow_uen, paynow_phone, billing_day, org_name")
    .eq("id", org.id)
    .single();

  const { data: reminders } = await adminClient()
    .from("payment_reminders")
    .select(`
      id, month_for, amount, status, reminder_count, last_reminded_at, paid_at,
      students(student_name, parent_name)
    `)
    .eq("org_id", org.id)
    .order("month_for", { ascending: false })
    .limit(50);

  const hasPayNow = Boolean(orgRow?.paynow_uen || orgRow?.paynow_phone);
  const proxyLabel = orgRow?.paynow_uen
    ? `UEN: ${orgRow.paynow_uen}`
    : orgRow?.paynow_phone
    ? `Phone: ${orgRow.paynow_phone}`
    : "Not configured";

  const demoQRSrc = hasPayNow ? `/api/paynow/${org.id}/qr.png` : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Monthly fee reminders + PayNow QR. Configure your PayNow proxy in Settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">PayNow proxy</CardTitle>
            <CardDescription>{proxyLabel}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Billing day:{" "}
            <span className="font-medium text-foreground">{orgRow?.billing_day ?? 1}</span>{" "}
            of each month
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Demo QR</CardTitle>
            <CardDescription>
              {hasPayNow
                ? "Same QR the bot attaches to every payment reminder, with the month's amount pre-filled at send time."
                : "Add a PayNow UEN or phone in Settings to enable QR generation."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {demoQRSrc ? (
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={demoQRSrc}
                  alt="PayNow QR"
                  width={200}
                  height={200}
                  className="rounded border bg-white p-2"
                />
                <div className="text-sm text-muted-foreground">
                  Any SG bank app → scan → pay.
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No PayNow proxy yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reminder activity</CardTitle>
          <CardDescription>
            {reminders?.length ? `${reminders.length} most recent` : "No reminders yet — they kick in on the billing day."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminders && reminders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Month</th>
                    <th className="py-2 pr-4">Student</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Reminders</th>
                    <th className="py-2 pr-4">Last sent</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map((r) => {
                    const status = (r.status as ReminderStatus) ?? "pending";
                    const cfg = STATUS_CONFIG[status];
                    const student = r.students as unknown as { student_name?: string } | null;
                    return (
                      <tr key={r.id} className="border-t">
                        <td className="py-2 pr-4 font-mono">{r.month_for}</td>
                        <td className="py-2 pr-4">{student?.student_name ?? "—"}</td>
                        <td className="py-2 pr-4">${r.amount}</td>
                        <td className="py-2 pr-4">
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${cfg.style}`}>
                            <cfg.Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-2 pr-4">{r.reminder_count}</td>
                        <td className="py-2 pr-4">
                          {r.last_reminded_at
                            ? new Date(r.last_reminded_at).toLocaleString("en-SG")
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
