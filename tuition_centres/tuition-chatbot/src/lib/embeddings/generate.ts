import OpenAI from "openai";

let client: OpenAI | null = null;
function openai() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

const EMBEDDING_MODEL = "text-embedding-3-small";

export async function embed(input: string): Promise<number[]> {
  const res = await openai().embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });
  return res.data[0].embedding;
}

export async function embedMany(inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];
  // OpenAI accepts arrays directly; batch up to 96 to keep payload sane.
  const out: number[][] = [];
  for (let i = 0; i < inputs.length; i += 96) {
    const batch = inputs.slice(i, i + 96);
    const res = await openai().embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    res.data
      .sort((a, b) => a.index - b.index)
      .forEach((d) => out.push(d.embedding));
  }
  return out;
}
