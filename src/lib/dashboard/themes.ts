import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RawTheme } from "@/lib/menu/build";

export type ThemeRow = RawTheme & { id: string };
export const DEFAULT_THEME = { accent: "#1E2A5A", font_pairing: "bricolage_figtree", mode: "light", logo_url: null, cover_url: null } as const;

export const themesKey = (restaurantId: string) => ["themes", restaurantId] as const;
export const themesQuery = (restaurantId: string) => queryOptions({
  queryKey: themesKey(restaurantId),
  queryFn: async (): Promise<ThemeRow[]> => {
    const { data, error } = await supabase.from("themes").select("id, accent, font_pairing, mode, logo_url, cover_url, branch_id").eq("restaurant_id", restaurantId);
    if (error) throw error;
    return data ?? [];
  },
});

export const ACCENT_SWATCHES = [
  { name: "Indigo", hex: "#1E2A5A" }, { name: "Marigold", hex: "#F2A900" }, { name: "Truck pink", hex: "#E4447A" },
  { name: "Teal", hex: "#1C8C8C" }, { name: "Bottle green", hex: "#1F5B3F" }, { name: "Chilli red", hex: "#C62D2D" },
  { name: "Plum", hex: "#6B2D5C" }, { name: "Charcoal", hex: "#2B2B2E" },
];
