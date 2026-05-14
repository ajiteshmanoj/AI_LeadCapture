import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card } from "@/components/ui/card";
import { Globe, Send, MessageCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

type Status = "active" | "escalated" | "closed";

export default async function ConversationsPage() {
  const org = await getCurrentOrgOrRedirect();
  const { data: convs } = await adminClient()
    .from("conversations")
    .select("id, channel, status, started_at, last_message_at, channel_user_id")
    .eq("org_id", org.id)
    .order("status", { ascending: true }) // 'active' < 'closed' < 'escalated' alphabetically — re-sort below
    .order("last_message_at", { ascending: false })
    .limit(200);

  // Pin escalated to the top, then sort by recency.
  const sorted = [...(convs ?? [])].sort((a, b) => {
    const rank = (s: string) =>
      s === "escalated" ? 0 : s === "active" ? 1 : 2;
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });

  const escalatedCount = sorted.filter((c) => c.status === "escalated").length;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Conversations</h1>
          <p className="text-sm text-muted-foreground">
            All patient chats from web + Telegram in one place. Escalated conversations are pinned to the top.
          </p>
        </div>
        {escalatedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-sm font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            {escalatedCount} need{escalatedCount === 1 ? "s" : ""} attention
          </span>
        )}
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Started</th>
              <th className="px-4 py-2 font-medium">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr
                key={c.id}
                className={`border-b last:border-0 hover:bg-accent/30 ${
                  c.status === "escalated" ? "bg-amber-50/60" : ""
                }`}
              >
                <td className="px-4 py-2">
                  <ChannelBadge channel={c.channel} />
                </td>
                <td className="px-4 py-2">{c.channel_user_id ?? "(anonymous)"}</td>
                <td className="px-4 py-2">
                  <StatusPill status={c.status as Status} />
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(c.started_at).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/conversations/${c.id}`}
                    className="text-primary hover:underline"
                  >
                    {new Date(c.last_message_at).toLocaleString()}
                  </Link>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No conversations yet. Once patients start chatting, they&apos;ll show up here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const Icon =
    channel === "web" ? Globe : channel === "telegram" ? Send : MessageCircle;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="capitalize">{channel}</span>
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  const styles =
    status === "escalated"
      ? "bg-amber-100 text-amber-800"
      : status === "closed"
        ? "bg-muted text-muted-foreground"
        : "bg-emerald-100 text-emerald-700";
  const Icon =
    status === "escalated"
      ? AlertTriangle
      : status === "closed"
        ? CheckCircle2
        : Globe;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      <Icon className="h-3 w-3" />
      <span className="capitalize">{status}</span>
    </span>
  );
}
