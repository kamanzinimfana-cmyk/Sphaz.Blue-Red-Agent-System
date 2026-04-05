export async function getEmbedding(text: string): Promise<number[]> {
  // Placeholder for real embedding logic
  // In a real app, use @google/genai or similar
  return Array(768).fill(0).map(() => Math.random());
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotProduct / (mA * mB);
}
