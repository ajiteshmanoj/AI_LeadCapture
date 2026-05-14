import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FAQEditor } from "@/components/dashboard/FAQEditor";

export default async function FAQsPage() {
  const org = await getCurrentOrgOrRedirect();
  const { data: faqs } = await adminClient()
    .from("faqs")
    .select("*")
    .eq("org_id", org.id)
    .order("sort_order");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">FAQs</h1>
      <Card>
        <CardHeader>
          <CardTitle>Curated answers</CardTitle>
          <CardDescription>
            Use FAQs for short, frequent answers. The bot prefers these over freeform document context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FAQEditor initial={faqs ?? []} orgId={org.id} />
        </CardContent>
      </Card>
    </div>
  );
}
