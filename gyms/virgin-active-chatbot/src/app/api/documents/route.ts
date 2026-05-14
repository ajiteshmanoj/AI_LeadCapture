import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { chunkText } from "@/lib/embeddings/chunker";
import { embedMany } from "@/lib/embeddings/generate";

export const runtime = "nodejs";
export const maxDuration = 60;

async function extractText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".pdf")) {
    // Lazy import keeps cold-start light for non-PDF uploads.
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text ?? "";
  }
  if (lower.endsWith(".csv") || lower.endsWith(".txt") || lower.endsWith(".md")) {
    return buffer.toString("utf8");
  }
  // Best-effort plain text fallback.
  return buffer.toString("utf8");
}

async function getCallerOrg(request: NextRequest): Promise<string | null> {
  // Allow either a logged-in dashboard user (resolved via Supabase Auth) or
  // an explicit X-Org-Id when called server-to-server in tests.
  const headerOrg = request.headers.get("x-org-id");
  if (headerOrg) return headerOrg;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await adminClient()
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  return data?.org_id ?? null;
}

export async function POST(request: NextRequest) {
  const orgId = await getCallerOrg(request);
  if (!orgId) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }
  const file = formData.get("file");
  const manualText = formData.get("text");
  const filename = (formData.get("filename") as string | null) ?? null;

  let content = "";
  let storedName = filename ?? "manual_entry.txt";
  let fileType = "manual_entry";

  if (file instanceof File) {
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }
    content = await extractText(file);
    storedName = file.name;
    fileType = file.name.split(".").pop()?.toLowerCase() ?? "txt";
  } else if (typeof manualText === "string") {
    content = manualText;
  } else {
    return NextResponse.json({ error: "No file or text provided" }, { status: 400 });
  }

  content = content.trim();
  if (!content) {
    return NextResponse.json({ error: "No extractable text" }, { status: 400 });
  }

  const sb = adminClient();
  const { data: doc, error: docErr } = await sb
    .from("documents")
    .insert({
      org_id: orgId,
      filename: storedName,
      file_type: fileType,
      content,
    })
    .select("id")
    .single();
  if (docErr || !doc) {
    return NextResponse.json(
      { error: docErr?.message ?? "Failed to save document" },
      { status: 500 },
    );
  }

  const chunks = chunkText(content);
  if (chunks.length === 0) {
    return NextResponse.json({ document_id: doc.id, chunks: 0 });
  }

  const embeddings = await embedMany(chunks);
  const rows = chunks.map((text, i) => ({
    document_id: doc.id,
    org_id: orgId,
    chunk_text: text,
    chunk_index: i,
    embedding: embeddings[i],
  }));

  const { error: chunkErr } = await sb.from("document_chunks").insert(rows);
  if (chunkErr) {
    return NextResponse.json(
      { error: `Document saved but chunking failed: ${chunkErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ document_id: doc.id, chunks: chunks.length });
}

export async function GET(request: NextRequest) {
  const orgId = await getCallerOrg(request);
  if (!orgId) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const { data, error } = await adminClient()
    .from("documents")
    .select("id, filename, file_type, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data });
}

export async function DELETE(request: NextRequest) {
  const orgId = await getCallerOrg(request);
  if (!orgId) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await adminClient()
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
