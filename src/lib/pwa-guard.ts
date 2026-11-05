/** Hostnames where the service worker must never run (Lovable editor/previews). */
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const LOVABLE_PARENTS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];

export function isPreviewHost(hostname: string) {
  const h = hostname.toLowerCase();
  const label = h.split(".")[0] ?? "";
  if (LOVABLE_PARENTS.some((p) => h.endsWith(p)) && (PREVIEW_LABEL.test(label) || /^project--.+-dev$/.test(label))) return true;
  return ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"].some((d) => h === d || h.endsWith(`.${d}`));
}

