"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2 } from "lucide-react";

export default function WidgetStep() {
  const router = useRouter();
  const supabase = createClient();
  const [orgId, setOrgId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("org_members").select("org_id").eq("user_id", user.id).limit(1).maybeSingle()
        .then(({ data }) => { if (data?.org_id) setOrgId(data.org_id); });
    });
  }, [supabase]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://your-domain.com";
  const snippet = `<script src="${appUrl}/widget.js" data-org-id="${orgId}" async></script>`;

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function finish() {
    await fetch("/api/onboarding/complete-step", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "widget" }),
    });
    router.push("/dashboard");
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">You&apos;re almost there!</h2>
        <p className="text-sm text-muted-foreground">
          Paste this snippet into your website&apos;s HTML, just before <code>&lt;/body&gt;</code>. That&apos;s it — the chatbot appears on your site.
        </p>
      </div>

      <div className="rounded border bg-muted p-4 space-y-2">
        <code className="text-xs break-all">{snippet}</code>
        <Button variant="outline" size="sm" onClick={copy} className="mt-2">
          {copied ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />Copied</> : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy snippet</>}
        </Button>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => router.push("/onboarding/class")}>← Back</Button>
        <Button onClick={finish} className="flex-1">Go to dashboard →</Button>
      </div>
    </div>
  );
}
