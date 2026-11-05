import type { CSSProperties } from "react";

export const FONT_PAIRINGS: Record<string, { label: string; display: string; sans: string; href: string | null }> = {
  bricolage_figtree: { label: "Bricolage Grotesque + Figtree", display: "Bricolage Grotesque", sans: "Figtree", href: null },
  young_serif_onest: { label: "Young Serif + Onest", display: "Young Serif", sans: "Onest",
    href: "https://fonts.googleapis.com/css2?family=Young+Serif&family=Onest:wght@400;500;600&display=swap" },
  gloock_manrope: { label: "Gloock + Manrope", display: "Gloock", sans: "Manrope",
    href: "https://fonts.googleapis.com/css2?family=Gloock&family=Manrope:wght@400;500;600&display=swap" },
  gabarito_instrument_sans: { label: "Gabarito + Instrument Sans", display: "Gabarito", sans: "Instrument Sans",
    href: "https://fonts.googleapis.com/css2?family=Gabarito:wght@500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap" },
};

/** Readable text colour on top of a hex accent. */
export function onAccent(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return lum > 0.45 ? "#1E2A5A" : "#F6F5F1";
}

export function themeStyle(theme: { accent: string; font_pairing: string } | null): CSSProperties {
  if (!theme) return {};
  const f = FONT_PAIRINGS[theme.font_pairing] ?? FONT_PAIRINGS["bricolage_figtree"]!;
  const accent = /^#[0-9a-f]{6}$/i.test(theme.accent) ? theme.accent : "#1E2A5A";
  return {
    "--marigold": accent, "--accent": accent, "--ring": accent, "--accent-foreground": onAccent(accent),
    "--theme-font-display": `"${f.display}"`, "--theme-font-sans": `"${f.sans}"`,
  } as CSSProperties;
}
