"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ClassStep() {
  const router = useRouter();

  async function next() {
    await fetch("/api/onboarding/complete-step", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "class" }),
    });
    router.push("/onboarding/widget");
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Add your first consultation type</h2>
        <p className="text-sm text-muted-foreground">
          Consultation types power the appointment booking flow — the chatbot reads slot availability and schedules directly from here. You can add more any time from the Consultation Types page in your dashboard.
        </p>
      </div>
      <p className="text-sm text-muted-foreground rounded border bg-muted/30 p-4">
        Head to <strong>Dashboard → Consultation Types</strong> after setup to add your appointment types. The booking flow needs at least one active consultation type to work.
      </p>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => router.push("/onboarding/document")}>← Back</Button>
        <Button onClick={next} className="flex-1">Continue →</Button>
      </div>
    </div>
  );
}
