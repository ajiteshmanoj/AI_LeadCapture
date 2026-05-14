import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

/**
 * Pipeline page — replaces the tuition "Waitlist" concept.
 * For the property vertical, pipeline = leads who have been qualified but
 * haven't yet confirmed a viewing (bookings with status = 'pending').
 *
 * NOTE: The waitlist table is NOT used for property.
 * Pipeline is tracked via bookings.status = 'pending'.
 * The sidebar nav label is "Pipeline" (href /dashboard/waitlist).
 */
export default async function PipelinePage() {
  const org = await getCurrentOrgOrRedirect();
  const sb = adminClient();

  // Fetch confirmed/pending viewings as the "pipeline"
  const { data: rows } = await sb
    .from("bookings")
    .select(
      "id, booking_date, start_time, status, booking_type, lead_qualified, agent_name, students(student_name, parent_phone, lead_score, citizenship_status, budget_min, budget_max), classes(subject, level, property_type), location:locations(name)",
    )
    .eq("org_id", org.id)
    .eq("booking_type", "viewing")
    .in("status", ["confirmed", "pending"])
    .order("booking_date", { ascending: true })
    .limit(100);

  type PipelineRow = {
    id: string;
    booking_date: string;
    start_time: string;
    status: string;
    booking_type: string;
    lead_qualified: boolean | null;
    agent_name: string | null;
    students: {
      student_name: string;
      parent_phone: string;
      lead_score: string | null;
      citizenship_status: string | null;
      budget_min: number | null;
      budget_max: number | null;
    } | null;
    classes: { subject: string; level: string; property_type: string | null } | null;
    location: { name: string } | null;
  };

  const pipeline = (rows ?? []) as unknown as PipelineRow[];

  const leadScoreBadge = (score: string | null) => {
    if (score === "hot") return "bg-red-100 text-red-700";
    if (score === "warm") return "bg-orange-100 text-orange-700";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Qualified leads with confirmed or pending viewing appointments. Hot leads = ready to transact within 3 months.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Pipeline is tracked via viewing bookings. To manage all bookings, go to{" "}
          <Link href="/dashboard/bookings" className="underline hover:text-foreground">Viewings</Link>.
        </p>
      </div>

      {pipeline.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No pipeline leads yet</CardTitle>
            <CardDescription>
              Qualified leads with viewing bookings will appear here. The chatbot qualifies leads before booking viewings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pipeline entries are automatically created when the chatbot books a viewing and qualifies the lead (collects budget, citizenship status, property preferences).
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Lead</th>
                  <th className="px-4 py-2 font-medium">Score</th>
                  <th className="px-4 py-2 font-medium">Property</th>
                  <th className="px-4 py-2 font-medium">Budget</th>
                  <th className="px-4 py-2 font-medium">Citizenship</th>
                  <th className="px-4 py-2 font-medium">Viewing Date</th>
                  <th className="px-4 py-2 font-medium">Agent</th>
                  <th className="px-4 py-2 font-medium">Office</th>
                  <th className="px-4 py-2 font-medium">Qualified</th>
                </tr>
              </thead>
              <tbody>
                {pipeline.map((row) => {
                  const budgetStr = row.students?.budget_min && row.students?.budget_max
                    ? `$${(row.students.budget_min / 1000000).toFixed(1)}M – $${(row.students.budget_max / 1000000).toFixed(1)}M`
                    : row.classes?.level ?? "—";
                  return (
                    <tr key={row.id} className="border-b last:border-0 align-top">
                      <td className="px-4 py-2">
                        <div className="font-medium">{row.students?.student_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{row.students?.parent_phone ?? ""}</div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${leadScoreBadge(row.students?.lead_score ?? null)}`}>
                          {row.students?.lead_score ?? "cold"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div>{row.classes?.subject ?? "—"}</div>
                        {row.classes?.property_type && (
                          <div className="text-xs text-muted-foreground">{row.classes.property_type}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{budgetStr}</td>
                      <td className="px-4 py-2">{row.students?.citizenship_status ?? "—"}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{row.booking_date}</td>
                      <td className="px-4 py-2">{row.agent_name ?? "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.location?.name ?? "—"}</td>
                      <td className="px-4 py-2">
                        {row.lead_qualified ? (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">Yes</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
