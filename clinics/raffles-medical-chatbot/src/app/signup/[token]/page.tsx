import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { SignupForm } from "@/components/auth/SignupForm";

export default async function SignupPage({ params }: { params: { token: string } }) {
  const { data: org } = await adminClient()
    .from("organisations")
    .select("id, name, invite_email, invite_expires_at, invite_accepted_at")
    .eq("invite_token", params.token)
    .maybeSingle();

  if (!org) notFound();

  const expired =
    org.invite_expires_at && new Date(org.invite_expires_at) < new Date();
  const used = !!org.invite_accepted_at;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">{org.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up your admin account</p>
        </div>

        {expired || used ? (
          <div className="bg-white border rounded-lg p-6 text-sm text-destructive text-center">
            {used
              ? "This invite has already been used. If you need access, contact us."
              : "This invite has expired. Ask for a new link."}
          </div>
        ) : (
          <SignupForm token={params.token} email={org.invite_email ?? ""} />
        )}
      </div>
    </div>
  );
}
