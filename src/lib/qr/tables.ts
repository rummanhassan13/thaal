/**
 * Turn "1-20, Patio, 30-32" into table labels. Ranges are inclusive and capped at
 * 200 tables per entry; existing labels (case-insensitive) are skipped.
 */
export function parseTableLabels(input: string, existing: string[] = []): string[] {
  const seen = new Set(existing.map((s) => s.trim().toLowerCase()));
  const out: string[] = [];
  const push = (s: string) => { const k = s.toLowerCase(); if (s && !seen.has(k)) { seen.add(k); out.push(s); } };
  for (const raw of input.split(",")) {
    const part = raw.trim();
    const m = part.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (m) {
      let [a, b] = [Number(m[1]), Number(m[2])];
      if (a > b) [a, b] = [b, a];
      for (let i = a; i <= Math.min(b, a + 199); i++) push(String(i));
    } else push(part.slice(0, 40));
  }
  return out;
}

export const newQrToken = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");

export const tableUrl = (origin: string, slug: string, token: string) => `${origin}/m/${slug}?table=${token}`;
export const menuUrl = (origin: string, slug: string) => `${origin}/m/${slug}`;
