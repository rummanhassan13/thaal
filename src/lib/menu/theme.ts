import type { CSSProperties } from "react";

export const FONT_PAIRINGS: Record<string, { label: string; display: string; sans: string; href: string | null }> = {
  fraunces_inter_tight: { label: "Fraunces + Inter Tight", display: "Fraunces", sans: "Inter Tight", href: null },
  instrument_serif_inter: { label: "Instrument Serif + Inter", display: "Instrument Serif", sans: "Inter",
    href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap" },
  dm_serif_dm_sans: { label: "DM Serif Display + DM Sans", display: "DM Serif Display", sans: "DM Sans",
    href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" },
  playfair_work_sans: { label: "Playfair Display + Work Sans", display: "Playfair Display", sans: "Work Sans",
    href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=Work+Sans:wght@400;500;600&display=swap" },
};

/** Readable text colour on top of a hex accent. */
export function onAccent(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return lum > 0.45 ? "oklch(0.215 0.006 70)" : "oklch(0.985 0.006 80)";
}

export function themeStyle(theme: { accent: string; font_pairing: string } | null): CSSProperties {
  if (!theme) return {};
  const f = FONT_PAIRINGS[theme.font_pairing] ?? FONT_PAIRINGS.fraunces_inter_tight!;
  const accent = /^#[0-9a-f]{6}$/i.test(theme.accent) ? theme.accent : "#C8553D";
  return {
    "--terracotta": accent, "--accent": accent, "--ring": accent, "--accent-foreground": onAccent(accent),
    "--theme-font-display": `"${f.display}"`, "--theme-font-sans": `"${f.sans}"`,
  } as CSSProperties;
}
