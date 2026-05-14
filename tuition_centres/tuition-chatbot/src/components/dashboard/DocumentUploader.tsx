"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function DocumentUploader() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    setError(null);
    setMessage(null);
    if (!file && !text.trim()) {
      setError("Choose a file or paste some text first.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      if (file) fd.append("file", file);
      else {
        fd.append("text", text);
        if (filename) fd.append("filename", filename);
      }
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setMessage(`Uploaded — ${json.chunks} chunks indexed.`);
      setFile(null);
      setText("");
      setFilename("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">File (PDF, TXT, CSV, MD — max 10MB)</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.txt,.csv,.md"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="text-xs text-muted-foreground">— or paste text below —</div>
      <div className="space-y-2">
        <Label htmlFor="filename">Title (optional)</Label>
        <Input
          id="filename"
          placeholder="e.g. fee schedule 2026"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="text">Text content</Label>
        <Textarea
          id="text"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste centre policies, FAQ answers, fee schedules…"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      <Button onClick={upload} disabled={busy}>
        {busy ? "Uploading…" : "Upload & index"}
      </Button>
    </div>
  );
}
