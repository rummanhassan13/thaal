import { useState } from "react";
import { cn } from "@/lib/utils";
import { sized, srcSet } from "@/lib/unsplash";

/** Photo on a sand placeholder that fades in once loaded. */
export function DishImage({ url, alt, w, ratio, sizes, eager, className, dim }: {
  url: string | null; alt: string; w: number; ratio: number; sizes: string; eager?: boolean; className?: string; dim?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-sand", className)} style={{ aspectRatio: `${1 / ratio}` }}>
      {url && (
        <img
          src={sized(url, w, Math.round(w * ratio))}
          srcSet={srcSet(url, [360, 540, 800, 1080], ratio)}
          sizes={sizes}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          {...(eager ? { fetchPriority: "high" as const } : {})}
          onLoad={() => setLoaded(true)}
          ref={(el) => { if (el?.complete && el.naturalWidth) setLoaded(true); }}
          className={cn("absolute inset-0 h-full w-full object-cover transition-[opacity,filter] duration-500",
            loaded ? "opacity-100" : "opacity-0", dim && "opacity-55 grayscale")}
        />
      )}
    </div>
  );
}
