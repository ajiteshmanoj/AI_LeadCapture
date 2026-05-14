import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationsManager } from "@/components/dashboard/LocationsManager";
import type { Location } from "@/types";

export default async function LocationsPage() {
  const org = await getCurrentOrgOrRedirect();
  const { data: locations } = await adminClient()
    .from("locations")
    .select("*")
    .eq("org_id", org.id)
    .order("name");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Centres</h1>
        <p className="text-sm text-muted-foreground">
          Branches/locations the centre runs. Classes and bookings link back here.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage centres</CardTitle>
          <CardDescription>
            The chatbot uses these to suggest convenient branches and to set
            the venue on calendar invites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationsManager
            initialLocations={(locations ?? []) as Location[]}
            orgId={org.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
