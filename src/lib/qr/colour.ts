const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);
export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}
export const PAPER = "#FAF7F2";
export const INK = "#1C1A17";

/** QR modules need strong contrast on white to scan reliably; fall back to ink when the accent is too pale. */
export const qrModuleColour = (accent: string) => (isHex(accent) && contrast(accent, "#FFFFFF") >= 3 ? accent : INK);

/** Friendly warning for accents that are hard to read on the light menu background. */
export function accentWarning(accent: string): string | null {
  if (!isHex(accent)) return "That isn't a full hex colour, like #C8553D.";
  const c = contrast(accent, PAPER);
  if (c < 3) return "This colour is quite pale on the cream background, so labels and buttons may be hard to read.";
  return null;
}
