import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const VALID_STATUSES = ["active", "escalated", "closed"] as const;
type Status = (typeof VALID_STATUSES)[number];

interface PatchBody {
  status?: Status;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const { data: membership } = await adminClient()
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership?.org_id) {
    return NextResponse.json({ error: "No org for user" }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of ${VALID_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const { data, error } = await adminClient()
    .from("conversations")
    .update({ status, last_message_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("org_id", membership.org_id)
    .select("id, status")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Drop a system message into the thread so admin + parent both have a
  // visible audit trail of who took over and when.
  const noteByStatus: Record<Status, string> = {
    escalated: "(Admin took over the conversation.)",
    active: "(Admin handed the conversation back to the bot.)",
    closed: "(Admin marked this conversation as resolved.)",
  };
  await adminClient().from("messages").insert({
    conversation_id: params.id,
    role: "system",
    content: noteByStatus[status],
  });

  return NextResponse.json({ ok: true, status: data.status });
}
