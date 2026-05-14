import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const STEPS = ["centre", "branding", "document", "class", "widget"] as const;
type Step = (typeof STEPS)[number];

interface Body {
  step?: Step;
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const { data: membership } = await adminClient()
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  let body: Body;
  try { body = (await req.json()) as Body; } catch { body = {}; }

  const step = body.step;
  if (!step || !STEPS.includes(step)) {
    return NextResponse.json({ error: `step must be one of ${STEPS.join(", ")}` }, { status: 400 });
  }

  const idx = STEPS.indexOf(step);
  const isLast = idx === STEPS.length - 1;
  const nextStep = isLast ? null : STEPS[idx + 1];

  const { error } = await adminClient()
    .from("organisations")
    .update({
      onboarding_step: nextStep ?? step,
      ...(isLast ? { is_onboarded: true } : {}),
    })
    .eq("id", membership.org_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, next_step: nextStep, completed: isLast });
}
