import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CustomerMenu } from "@/components/menu/CustomerMenu";
import { disableEvents } from "@/components/menu/events";
import { FONT_PAIRINGS } from "@/lib/menu/theme";
import type { PublicMenuData } from "@/lib/menu/types";

/** Dashboard live preview: the parent window posts unsaved menu + theme data; nothing is fetched or logged. */
export const Route = createFileRoute("/preview")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Menu preview — Thaal" }, { name: "description", content: "Live preview of your menu." }, { name: "robots", content: "noindex" }],
    links: Object.values(FONT_PAIRINGS).flatMap((f) => (f.href ? [{ rel: "stylesheet", href: f.href }] : [])),
  }),
  component: Preview,
});

function Preview() {
  const [data, setData] = useState<PublicMenuData | null>(null);
  useEffect(() => {
    disableEvents();
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "plated-preview") return;
      setData(e.data.payload as PublicMenuData);
    };
    window.addEventListener("message", onMsg);
    window.parent?.postMessage({ type: "plated-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  if (!data) return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Warming up the preview…</div>;
  return <CustomerMenu data={data} table={undefined} />;
}
