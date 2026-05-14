import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WaitlistGroup } from "@/components/dashboard/WaitlistGroup";

export default async function WaitlistPage() {
  const org = await getCurrentOrgOrRedirect();
  const sb = adminClient();
  const { data: rows } = await sb
    .from("waitlist")
    .select(
      "id, position, status, notified_at, created_at, class_id, student_id, students(student_name, parent_name, parent_phone), classes(id, subject, level, day_of_week, start_time, max_capacity, current_enrollment)",
    )
    .eq("org_id", org.id)
    .order("position");

  type Joined = {
    id: string;
    position: number;
    status: "waiting" | "notified" | "enrolled" | "expired";
    notified_at: string | null;
    class_id: string;
    students: {
      student_name: string;
      parent_name: string | null;
      parent_phone: string;
    } | null;
    classes: {
      id: string;
      subject: string;
      level: string;
      day_of_week: string;
      start_time: string;
      max_capacity: number;
      current_enrollment: number;
    } | null;
  };

  const groups = new Map<string, { className: string; entries: Joined[] }>();
  for (const r of (rows ?? []) as unknown as Joined[]) {
    const key = r.class_id;
    const className = r.classes
      ? `${r.classes.subject} (${r.classes.level}) — ${r.classes.day_of_week} ${r.classes.start_time.slice(0, 5)}`
      : "Unknown class";
    if (!groups.has(key)) groups.set(key, { className, entries: [] });
    groups.get(key)!.entries.push(r);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Waitlist</h1>
        <p className="text-sm text-muted-foreground">
          Parents added when their preferred class was full. Use &ldquo;Open a slot&rdquo; to notify the next person.
        </p>
      </div>

      {groups.size === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nothing waiting</CardTitle>
            <CardDescription>
              Once a class fills up, new bookings will land here automatically.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        Array.from(groups.entries()).map(([classId, group]) => (
          <WaitlistGroup
            key={classId}
            classId={classId}
            className={group.className}
            entries={group.entries.map((e) => ({
              id: e.id,
              position: e.position,
              status: e.status,
              notified_at: e.notified_at,
              student_name: e.students?.student_name ?? "—",
              parent_name: e.students?.parent_name ?? null,
              parent_phone: e.students?.parent_phone ?? "—",
            }))}
          />
        ))
      )}
    </div>
  );
}
