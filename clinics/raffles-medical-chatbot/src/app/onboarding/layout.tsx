import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { redirect } from "next/navigation";

const STEPS = [
  { key: "centre", label: "Clinic details" },
  { key: "branding", label: "Branding" },
  { key: "document", label: "Documents" },
  { key: "class", label: "Consultations" },
  { key: "widget", label: "Get started" },
];

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await getCurrentOrgOrRedirect();
  if (org.is_onboarded) redirect("/dashboard");

  const currentStep = org.onboarding_step ?? "centre";
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Welcome to {org.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Let&apos;s get your clinic set up — takes about 5 minutes.
          </p>
        </div>

        {/* Step progress bar */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`h-2 w-full rounded-full ${
                    i <= currentIdx ? "bg-primary" : "bg-muted"
                  }`}
                />
                <span
                  className={`text-[10px] ${
                    i === currentIdx
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border rounded-lg p-6">{children}</div>
      </div>
    </div>
  );
}
