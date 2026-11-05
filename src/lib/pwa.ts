/** The only service-worker registrar. Never registers in dev, iframes or Lovable preview hosts; unregisters stale ones there. */
import { isPreviewHost } from "./pwa-guard";

function refused() {
  if (!import.meta.env.PROD) return true;
  try { if (window.self !== window.top) return true; } catch { return true; }
  if (isPreviewHost(window.location.hostname)) return true;
  return new URLSearchParams(window.location.search).get("sw") === "off";
}

async function unregisterAppSW() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.filter((r) => r.active?.scriptURL.endsWith("/sw.js") || r.installing?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()));
}

export async function setupServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (refused()) { await unregisterAppSW().catch(() => {}); return; }
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}
