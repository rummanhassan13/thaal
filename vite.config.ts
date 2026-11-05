// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null, // src/lib/pwa.ts is the only registrar (guards preview/dev)
        devOptions: { enabled: false },
        manifest: false, // static public/manifest.webmanifest
        filename: "sw.js",
        workbox: {
          globPatterns: ["**/*.{js,css,woff2,png,svg,ico,webmanifest}", "offline.html"],
          navigateFallback: null, // SSR app: no index.html shell
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // HTML: always try the network; fall back to the branded offline page.
              urlPattern: ({ request, url }) => request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: { cacheName: "pages", networkTimeoutSeconds: 4, expiration: { maxEntries: 30 }, precacheFallback: { fallbackURL: "offline.html" } },
            },
            {
              urlPattern: ({ url }) => url.hostname === "images.unsplash.com",
              handler: "StaleWhileRevalidate",
              options: { cacheName: "menu-images", expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } },
            },
            {
              // Public menu photos only. Auth, REST, RPC and realtime are never matched, so they always hit the network.
              urlPattern: ({ url, request }) => request.method === "GET" && url.pathname.startsWith("/storage/v1/object/public/"),
              handler: "StaleWhileRevalidate",
              options: { cacheName: "menu-media", expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } },
            },
            {
              urlPattern: ({ url }) => url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com",
              handler: "StaleWhileRevalidate",
              options: { cacheName: "fonts", expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } },
            },
          ],
        },
      }),
    ],
  },
});
