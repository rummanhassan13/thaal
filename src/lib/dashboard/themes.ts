import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RawTheme } from "@/lib/menu/build";

export type ThemeRow = RawTheme & { id: string };
export const DEFAULT_THEME = { accent: "#C8553D", font_pairing: "bricolage_figtree", mode: "light", logo_url: null, cover_url: null } as const;

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
  { name: "Terracotta", hex: "#C8553D" }, { name: "Clay", hex: "#9C4A2F" }, { name: "Mustard", hex: "#B8862B" },
  { name: "Olive", hex: "#6B6B47" }, { name: "Forest", hex: "#2F5D46" }, { name: "Plum", hex: "#6E3A5A" },
  { name: "Cocoa", hex: "#6B4A3A" }, { name: "Ink", hex: "#1C1A17" },
];
