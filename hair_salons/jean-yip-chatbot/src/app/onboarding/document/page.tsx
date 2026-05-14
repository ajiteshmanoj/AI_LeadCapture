"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DocumentUploader } from "@/components/dashboard/DocumentUploader";

export default function DocumentStep() {
  const router = useRouter();

  async function next() {
    await fetch("/api/onboarding/complete-step", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "document" }),
    });
    router.push("/onboarding/class");
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Upload your first document</h2>
        <p className="text-sm text-muted-foreground">
          Upload a PDF with your fee schedule, class info or centre policies. The chatbot will use it to answer parent questions.
        </p>
      </div>
      <DocumentUploader />
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => router.push("/onboarding/branding")}>← Back</Button>
        <Button variant="outline" onClick={next} className="flex-1">Skip for now</Button>
        <Button onClick={next} className="flex-1">Continue →</Button>
      </div>
    </div>
  );
}
