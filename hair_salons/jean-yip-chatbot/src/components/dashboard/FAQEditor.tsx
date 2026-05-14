"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FAQ } from "@/types";

const CATEGORIES = ["fees", "schedule", "policy", "location", "general"];

export function FAQEditor({ initial, orgId }: { initial: FAQ[]; orgId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState(CATEGORIES[4]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!question.trim() || !answer.trim()) {
      setError("Question and answer are both required.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("faqs").insert({
      org_id: orgId,
      question,
      answer,
      category,
      sort_order: initial.length,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setQuestion("");
    setAnswer("");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    await supabase.from("faqs").delete().eq("id", id);
    router.refresh();
  }

  async function toggle(faq: FAQ) {
    await supabase.from("faqs").update({ is_active: !faq.is_active }).eq("id", faq.id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label>Question</Label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What time do classes start?"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Answer</Label>
          <Textarea
            rows={3}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Classes start at 4pm on weekdays."
          />
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label>Category</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Button onClick={add} disabled={busy}>
            {busy ? "Adding…" : "Add FAQ"}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="space-y-3">
        {initial.map((f) => (
          <div key={f.id} className="rounded-md border p-3 space-y-2">
            <div className="flex justify-between items-start gap-3">
              <div className="font-medium text-sm">{f.question}</div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] uppercase tracking-wide bg-muted px-2 py-0.5 rounded">
                  {f.category ?? "general"}
                </span>
                <button
                  onClick={() => toggle(f)}
                  className={`text-xs px-2 py-0.5 rounded ${f.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}
                >
                  {f.is_active ? "On" : "Off"}
                </button>
                <button onClick={() => remove(f.id)} className="text-xs text-destructive hover:underline">
                  Delete
                </button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{f.answer}</div>
          </div>
        ))}
        {initial.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No FAQs yet — add one above.</p>
        )}
      </div>
    </div>
  );
}
