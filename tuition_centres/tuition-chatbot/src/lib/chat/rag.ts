import { adminClient } from "@/lib/supabase/admin";
import { embed } from "@/lib/embeddings/generate";
import type { ClassRow, FAQ, Location } from "@/types";

export interface RetrievedChunk {
  chunk_text: string;
  similarity: number;
}

export type ClassWithLocation = ClassRow & {
  location: Pick<Location, "id" | "name" | "address" | "mrt_nearest"> | null;
};

export async function retrieveChunks(
  orgId: string,
  query: string,
  k = 8,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embed(query);
  const { data, error } = await adminClient().rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_org_id: orgId,
    match_count: k,
    similarity_threshold: 0.3,
  });
  if (error) {
    console.error("[rag] match_document_chunks error", error);
    return [];
  }
  return (data ?? []).map((r: { chunk_text: string; similarity: number }) => ({
    chunk_text: r.chunk_text,
    similarity: r.similarity,
  }));
}

export async function loadActiveClasses(
  orgId: string,
): Promise<ClassWithLocation[]> {
  const { data, error } = await adminClient()
    .from("classes")
    .select("*, location:locations(id, name, address, mrt_nearest)")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("subject")
    .order("level")
    .order("day_of_week");
  if (error) {
    console.error("[rag] loadActiveClasses error", error);
    return [];
  }
  return (data ?? []) as unknown as ClassWithLocation[];
}

export async function loadActiveLocations(orgId: string): Promise<Location[]> {
  const { data, error } = await adminClient()
    .from("locations")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name");
  if (error) {
    console.error("[rag] loadActiveLocations error", error);
    return [];
  }
  return (data ?? []) as Location[];
}

export async function loadFaqs(orgId: string): Promise<FAQ[]> {
  const { data, error } = await adminClient()
    .from("faqs")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    console.error("[rag] loadFaqs error", error);
    return [];
  }
  return (data ?? []) as FAQ[];
}

export function findRelevantFaqs(faqs: FAQ[], query: string, max = 3): FAQ[] {
  const q = query.toLowerCase();
  const tokens = q.split(/\W+/).filter((t) => t.length > 2);
  const scored = faqs.map((f) => {
    const text = `${f.question} ${f.answer}`.toLowerCase();
    const score = tokens.reduce((acc, t) => acc + (text.includes(t) ? 1 : 0), 0);
    return { faq: f, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.faq);
}
