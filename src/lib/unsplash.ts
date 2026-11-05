export const img = (id: string, w: number, h?: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}&fit=crop` : ""}&q=75&auto=format`;

/** Size a stored photo URL. Unsplash URLs get resize params; others are returned as-is. */
export function sized(url: string | null | undefined, w: number, h?: number) {
  if (!url) return "";
  if (url.includes("images.unsplash.com")) {
    const base = url.split("?")[0];
    return `${base}?w=${w}${h ? `&h=${h}&fit=crop` : ""}&q=75&auto=format`;
  }
  // Our uploads ship with a 400px thumbnail next to the full image.
  if (w <= 400 && url.includes("/menu-media/") && url.endsWith(".webp") && !url.endsWith("_thumb.webp")) return url.replace(/\.webp$/, "_thumb.webp");
  return url;
}
export function srcSet(url: string | null | undefined, widths: number[], ratio?: number) {
  if (!url || !url.includes("images.unsplash.com")) return undefined;
  return widths.map((w) => `${sized(url, w, ratio ? Math.round(w * ratio) : undefined)} ${w}w`).join(", ");
}
