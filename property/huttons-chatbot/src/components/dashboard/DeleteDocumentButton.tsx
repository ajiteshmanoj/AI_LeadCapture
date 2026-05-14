"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteDocumentButton({
  id,
  filename,
}: {
  id: string;
  filename: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`Delete "${filename}"? Indexed chunks will be removed too.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Delete failed: ${j.error ?? res.statusText}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={busy}
      className="text-destructive hover:text-destructive/80 disabled:opacity-50"
      title="Delete document"
      aria-label="Delete document"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
