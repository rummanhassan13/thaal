import { supabase } from "@/integrations/supabase/client";

type EventType = "scan" | "dish_view" | "add_to_cart";

/** Fire-and-forget analytics; never blocks or breaks the menu. */
export function logEvent(branchId: string, type: EventType, dishId?: string) {
  if (disabled) return;
  void supabase.from("menu_events").insert({ branch_id: branchId, type, dish_id: dishId ?? null }).then(() => undefined, () => undefined);
}

export function logScanOnce(branchId: string) {
  try {
    const key = `plated:scan:${branchId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch { /* storage blocked: still log */ }
  logEvent(branchId, "scan");
}

let disabled = false;
/** Live previews in the dashboard must not count as real visits. */
export function disableEvents() { disabled = true; }
