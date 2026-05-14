import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { ConversationView } from "@/components/dashboard/ConversationView";
import type { Message } from "@/types";

export default async function ConversationViewPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await getCurrentOrgOrRedirect();
  const sb = adminClient();
  const { data: conv } = await sb
    .from("conversations")
    .select("*")
    .eq("id", params.id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!conv) notFound();

  const { data: messages } = await sb
    .from("messages")
    .select("*")
    .eq("conversation_id", params.id)
    .order("created_at");

  return (
    <ConversationView
      conversationId={conv.id}
      initialMessages={(messages ?? []) as Message[]}
      initialStatus={conv.status as "active" | "escalated" | "closed"}
      channel={conv.channel}
      startedAt={conv.started_at}
    />
  );
}
