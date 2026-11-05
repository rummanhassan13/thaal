import { supabase } from "@/integrations/supabase/client";

const BUCKET = "menu-media";

async function resizeToWebp(file: Blob, maxSide: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process that image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't compress that image"))), "image/webp", quality),
  );
}

export type UploadKind = "logo" | "cover" | "dish";

/**
 * Compress (max 1600px, webp ~80%), make a 400px thumbnail, and upload both under
 * `<restaurantId>/<kind>/…` in the menu-media bucket. Storage policies only allow
 * members of that restaurant to write there.
 */
export async function uploadMenuImage(file: File, restaurantId: string, kind: UploadKind) {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image");
  const [full, thumb] = await Promise.all([resizeToWebp(file, 1600, 0.8), resizeToWebp(file, 400, 0.75)]);
  const id = crypto.randomUUID();
  const path = `${restaurantId}/${kind}/${id}.webp`;
  const thumbPath = `${restaurantId}/${kind}/${id}_thumb.webp`;
  const opts = { contentType: "image/webp", cacheControl: "31536000", upsert: false };
  const [a, b] = await Promise.all([
    supabase.storage.from(BUCKET).upload(path, full, opts),
    supabase.storage.from(BUCKET).upload(thumbPath, thumb, opts),
  ]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  return {
    url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    thumbUrl: supabase.storage.from(BUCKET).getPublicUrl(thumbPath).data.publicUrl,
    path,
  };
}
