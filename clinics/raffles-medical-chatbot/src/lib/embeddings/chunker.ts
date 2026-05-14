// Token-aware-ish chunker. We approximate ~4 chars/token, default 500-token
// chunks with ~100-token overlap. Boundary preference: paragraph > sentence > word.

const CHARS_PER_TOKEN = 4;

export interface ChunkOptions {
  chunkTokens?: number;
  overlapTokens?: number;
}

export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const chunkSize = (opts.chunkTokens ?? 500) * CHARS_PER_TOKEN;
  const overlap = (opts.overlapTokens ?? 100) * CHARS_PER_TOKEN;
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return [];
  if (cleaned.length <= chunkSize) return [cleaned];

  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < cleaned.length) {
    const end = Math.min(cursor + chunkSize, cleaned.length);
    let slice = cleaned.slice(cursor, end);

    // If we cut mid-text, prefer to end at a sensible boundary.
    if (end < cleaned.length) {
      const lastPara = slice.lastIndexOf("\n\n");
      const lastSentence = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! "),
      );
      const boundary =
        lastPara > chunkSize * 0.5
          ? lastPara
          : lastSentence > chunkSize * 0.5
            ? lastSentence + 1
            : -1;
      if (boundary > 0) slice = slice.slice(0, boundary);
    }

    const trimmed = slice.trim();
    if (trimmed) chunks.push(trimmed);
    if (end >= cleaned.length) break;
    cursor += slice.length - overlap;
    if (cursor < 0) cursor = 0;
  }
  return chunks;
}
