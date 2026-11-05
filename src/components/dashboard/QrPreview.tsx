import { useEffect, useState } from "react";
import { qrBlob, type QrStyle } from "@/lib/qr/render";
import { cn } from "@/lib/utils";

/** Small on-screen QR, rendered client-side as SVG. */
export function QrPreview({ url, style, className }: { url: string; style: QrStyle; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true; let made: string | null = null;
    qrBlob(url, style, "svg", 600).then((b) => { if (!live) return; made = URL.createObjectURL(b); setSrc(made); }).catch(() => undefined);
    return () => { live = false; if (made) URL.revokeObjectURL(made); };
  }, [url, style.branded, style.accent, style.logo]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={cn("aspect-square overflow-hidden rounded-md bg-white", className)}>
      {src ? <img src={src} alt="QR code" className="h-full w-full" /> : <div className="h-full w-full animate-pulse bg-sand/60" />}
    </div>
  );
}
