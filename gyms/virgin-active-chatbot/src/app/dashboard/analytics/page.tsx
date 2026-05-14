import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const org = await getCurrentOrgOrRedirect();
  const sb = adminClient();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();

  const [{ data: byChannel }, { data: byIntent }] = await Promise.all([
    sb.from("conversations")
      .select("channel")
      .eq("org_id", org.id)
      .gte("started_at", since),
    sb.from("messages")
      .select("intent, conversations!inner(org_id)")
      .eq("role", "user")
      .gte("created_at", since)
      .eq("conversations.org_id", org.id),
  ]);

  const channelCounts = countBy(byChannel ?? [], (r) => r.channel);
  const intentCounts = countBy((byIntent ?? []) as { intent: string | null }[], (r) => r.intent ?? "other");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Last 30 days.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Conversations by channel</CardTitle></CardHeader>
          <CardContent><BarList items={channelCounts} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top intents</CardTitle></CardHeader>
          <CardContent><BarList items={intentCounts} /></CardContent>
        </Card>
      </div>
    </div>
  );
}

function countBy<T>(rows: T[], key: (row: T) => string): { label: string; value: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function BarList({ items }: { items: { label: string; value: number }[] }) {
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  const max = Math.max(...items.map((i) => i.value));
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="capitalize">{i.label}</span>
            <span className="text-muted-foreground">{i.value}</span>
          </div>
          <div className="h-2 bg-muted rounded">
            <div
              className="h-2 bg-primary rounded"
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
