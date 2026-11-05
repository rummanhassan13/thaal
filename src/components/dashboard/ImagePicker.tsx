import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/thaal/primitives";
import { uploadMenuImage, type UploadKind } from "@/lib/image-upload";
import { cn } from "@/lib/utils";

async function cropToFile(src: string, area: Area, name: string): Promise<File> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  canvas.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Crop failed"))), "image/jpeg", 0.92));
  return new File([blob], name, { type: "image/jpeg" });
}

/** Preview + upload (compressed via uploadMenuImage). Pass `aspect` to crop before uploading. */
export function ImagePicker({ value, onChange, restaurantId, kind, aspect, label, className, previewClassName }: {
  value: string | null; onChange: (url: string | null) => void; restaurantId: string; kind: UploadKind;
  aspect?: number; label: string; className?: string; previewClassName?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const onCropComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const upload = async (file: File) => {
    setBusy(true); setError(null);
    try { onChange((await uploadMenuImage(file, restaurantId, kind)).url); }
    catch (e) { setError(e instanceof Error ? e.message : "Upload failed. Try again?"); }
    finally { setBusy(false); }
  };

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("That file isn't an image");
    if (aspect) { setCropSrc(URL.createObjectURL(file)); setZoom(1); setCrop({ x: 0, y: 0 }); }
    else void upload(file);
  };

  const confirmCrop = async () => {
    if (!cropSrc || !area) return;
    const file = await cropToFile(cropSrc, area, "photo.jpg");
    URL.revokeObjectURL(cropSrc); setCropSrc(null);
    await upload(file);
  };

  return (
    <div className={className}>
      <span className="mb-1.5 block text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button" onClick={() => input.current?.click()}
          className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-mist-deep bg-mist/50 text-xs text-muted-foreground", previewClassName ?? "h-24 w-32")}
        >
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span>Add photo</span>}
          {busy && <span className="absolute inset-0 grid place-items-center bg-background/70 text-xs text-foreground">Uploading…</span>}
        </button>
        <div className="flex flex-col items-start gap-1 text-sm">
          <button type="button" onClick={() => input.current?.click()} className="underline decoration-ink/30 underline-offset-4 hover:decoration-marigold">{value ? "Replace" : "Upload"}</button>
          {value && <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-foreground">Remove</button>}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-alert">{error}</p>}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />

      <AnimatePresence>
        {cropSrc && (
          <motion.div className="fixed inset-0 z-[70] flex flex-col bg-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative flex-1"><Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} /></div>
            <div className="flex items-center gap-4 bg-background px-5 py-4">
              <input aria-label="Zoom" type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-marigold" />
              <Button type="button" variant="ghost" onClick={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null); }}>Cancel</Button>
              <Button type="button" variant="accent" onClick={confirmCrop}>Use photo</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
