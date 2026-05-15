import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle, PauseCircle, MessageCircle, Send, Globe } from "lucide-react";

type NurtureStatus = "active" | "enrolled" | "closed" | "paused";

const STATUS_CONFIG: Record<NurtureStatus, { label: string; style: string; Icon: React.ElementType }> = {
  active: { label: "Following up", style: "bg-blue-100 text-blue-700", Icon: Clock },
  enrolled: { label: "Enrolled", style: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  closed: { label: "Closed", style: "bg-muted text-muted-foreground", Icon: XCircle },
  paused: { label: "Paused", style: "bg-amber-100 text-amber-700", Icon: PauseCircle },
};

const CHANNEL_ICON: Record<string, React.ElementType> = {
  web: Globe,
  telegram: Send,
  whatsapp: MessageCircle,
};

const STEP_LABELS = ["Pending", "T+24h sent", "T+3d sent", "T+7d sent (final)"];

export default async function LeadNurturePage() {
  const org = await getCurrentOrgOrRedirect();

  const { data: entries } = await adminClient()
    .from("lead_nurture")
    .select(`
      id, step, channel, status, next_followup_at, created_at,
      students(student_name, parent_name),
      bookings(booking_date, classes(subject, level))
    `)
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const active = (entries ?? []).filter((e) => e.status === "active");
  const enrolled = (entries ?? []).filter((e) => e.status === "enrolled");
  const closed = (entries ?? []).filter((e) => e.status === "closed" || e.status === "paused");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lead Nurture</h1>
        <p className="text-sm text-muted-foreground">
          Automated follow-up sequences after trial classes. Each trial triggers 3 messages over 7 days.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{active.length}</div>
          <div className="text-xs text-blue-600 mt-0.5">Active sequences</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-700">{enrolled.length}</div>
          <div className="text-xs text-emerald-600 mt-0.5">Converted to enrolled</div>
        </div>
        <div className="bg-muted border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-muted-foreground">{closed.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Closed / no response</div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Student</th>
              <th className="px-4 py-2 font-medium">Trial class</th>
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 font-medium">Progress</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Next follow-up</th>
            </tr>
          </thead>
          <tbody>
            {(entries ?? []).map((entry) => {
              const student = (entry as unknown as { students?: { student_name: string; parent_name: string | null } }).students;
              const booking = (entry as unknown as { bookings?: { booking_date: string; classes?: { subject: string; level: string } } }).bookings;
              const status = (entry.status as NurtureStatus) ?? "active";
              const { label, style, Icon } = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
              const ChannelIcon = CHANNEL_ICON[entry.channel as string] ?? Globe;

              return (
                <tr key={entry.id} className="border-b last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-2">
                    <div className="font-medium">{student?.student_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{student?.parent_name ?? ""}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div>{booking?.classes?.subject ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {booking?.booking_date
                        ? new Date(booking.booking_date).toLocaleDateString()
                        : ""}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                      <ChannelIcon className="h-3.5 w-3.5" />
                      {entry.channel}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((s) => (
                        <div
                          key={s}
                          className={`h-2 w-6 rounded-full ${
                            (entry.step ?? 0) >= s ? "bg-blue-500" : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {STEP_LABELS[entry.step ?? 0]}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
                      <Icon className="h-3 w-3" />
                      {label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">
                    {entry.next_followup_at
                      ? new Date(entry.next_followup_at).toLocaleString()
                      : status === "active" && (entry.step ?? 0) === 0
                        ? "Scheduled"
                        : "—"}
                  </td>
                </tr>
              );
            })}
            {(entries ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No lead nurture sequences yet. They&apos;re created automatically when a trial booking is marked as completed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
