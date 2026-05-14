import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "./server";
import { adminClient } from "./admin";
import type { Organisation } from "@/types";

export async function getCurrentOrgOrRedirect(): Promise<Organisation> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await adminClient()
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.org_id) {
    redirect("/dashboard/no-org");
  }

  const { data: org } = await adminClient()
    .from("organisations")
    .select("*")
    .eq("id", membership.org_id)
    .single();

  if (!org) redirect("/dashboard/no-org");

  // Redirect to onboarding wizard if the centre hasn't completed setup yet.
  // Skip this redirect when we're already on an /onboarding route so the
  // wizard itself can call this function without looping.
  if (!org.is_onboarded) {
    const headersList = headers();
    const pathname = headersList.get("x-pathname") ?? "";
    if (!pathname.startsWith("/onboarding")) {
      redirect(`/onboarding/${org.onboarding_step ?? "centre"}`);
    }
  }

  return org as Organisation;
}
