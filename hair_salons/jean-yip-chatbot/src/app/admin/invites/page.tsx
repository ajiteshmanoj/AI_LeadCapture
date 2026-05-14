import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { InviteForm } from "@/components/admin/InviteForm";

export default async function AdminInvitesPage() {
  if (!(await isSuperAdmin())) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Generate invite</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Creates an org row and returns a one-time signup URL to send to the centre.
          </p>
        </div>
        <InviteForm />
      </div>
    </div>
  );
}
