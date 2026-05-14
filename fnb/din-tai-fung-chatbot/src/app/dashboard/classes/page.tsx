import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassManager } from "@/components/dashboard/ClassManager";
import type { ClassRow, Location } from "@/types";

type ClassWithLoc = ClassRow & { location: { id: string; name: string } | null };

export default async function ClassesPage() {
  const org = await getCurrentOrgOrRedirect();
  const sb = adminClient();
  const [{ data: classes }, { data: locations }] = await Promise.all([
    sb
      .from("classes")
      .select("*, location:locations(id, name)")
      .eq("org_id", org.id)
      .order("subject")
      .order("level"),
    sb
      .from("locations")
      .select("*")
      .eq("org_id", org.id)
      .eq("is_active", true)
      .order("name"),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Classes</h1>
        <p className="text-sm text-muted-foreground">Subjects, levels, schedules and fees the bot uses.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage classes</CardTitle>
          <CardDescription>The chatbot reads from this list to answer schedule and fee questions.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClassManager
            initialClasses={(classes ?? []) as unknown as ClassWithLoc[]}
            locations={(locations ?? []) as Location[]}
            orgId={org.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
