import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OverviewPage() {
  const org = await getCurrentOrgOrRedirect();
  const sb = adminClient();

  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const [{ count: conversations }, { count: messages }, { count: bookings }, { count: classes }] =
    await Promise.all([
      sb.from("conversations").select("id", { head: true, count: "exact" }).eq("org_id", org.id).gte("started_at", since),
      sb.from("messages").select("id", { head: true, count: "exact" }).gte("created_at", since),
      sb.from("bookings").select("id", { head: true, count: "exact" }).eq("org_id", org.id).gte("created_at", since),
      sb.from("classes").select("id", { head: true, count: "exact" }).eq("org_id", org.id).eq("is_active", true),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-muted-foreground">Last 7 days at a glance.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Conversations" value={conversations ?? 0} />
        <StatCard label="Messages" value={messages ?? 0} />
        <StatCard label="Bookings" value={bookings ?? 0} />
        <StatCard label="Active classes" value={classes ?? 0} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Embed snippet</CardTitle>
          <CardDescription>Paste this on the centre website to enable the chat widget.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="rounded bg-muted p-3 text-xs overflow-x-auto">{`<script src="${process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com"}/widget.js"
  data-org-id="${org.id}"
  data-color="${org.settings?.primary_color ?? "#2563eb"}"
  data-bot-name="${org.settings?.bot_name ?? "Assistant"}"
  data-welcome="${org.settings?.welcome_message ?? "Hi! How can I help?"}"
  defer></script>`}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
