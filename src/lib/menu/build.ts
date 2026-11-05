import { localClock, pickActiveMenu } from "./schedule";
import type { PublicMenuData } from "./types";
import { planFeatures } from "@/lib/plan";

type RawAddon = { id: string; name: string; price: number | string; sort: number };
type RawDish = {
  id: string; name: string; short_description: string | null; description: string | null; price: number | string;
  photo_url: string | null; is_veg: boolean; is_spicy: boolean; spice_level: number; ingredients: string[]; allergens: string[];
  is_sold_out: boolean; is_special: boolean; sort: number; dish_addons?: RawAddon[] | null;
};
type RawMenu = {
  id: string; name: string; sort: number; active: boolean;
  menu_schedules?: { weekdays: number[]; start_time: string; end_time: string }[] | null;
  categories?: { id: string; name: string; sort: number; dishes?: RawDish[] | null }[] | null;
};
export type RawTheme = { accent: string; font_pairing: string; mode: string; logo_url: string | null; cover_url: string | null; branch_id: string | null };

const bySort = <T extends { sort: number }>(a: T[] | null | undefined) => [...(a ?? [])].sort((x, y) => x.sort - y.sort);

/** Branch theme wins, then the restaurant default (branch_id null). */
export const pickTheme = (themes: RawTheme[], branchId: string) =>
  themes.find((t) => t.branch_id === branchId) ?? themes.find((t) => !t.branch_id) ?? null;

/** Shape raw rows into the diner menu payload. Shared by the public loader and the dashboard live preview. */
export function buildPublicMenu(
  r: PublicMenuData["restaurant"],
  branch: { id: string; name: string; address: string | null; timezone: string; opening_hours: unknown },
  theme: Omit<RawTheme, "branch_id"> | null,
  menus: RawMenu[],
  now = new Date(),
): PublicMenuData {
  // Downgrades pause extras without deleting them: only the first N menus show, custom looks fall back to the default.
  const features = planFeatures(r.plan);
  const list = bySort(menus.filter((m) => m.active)).slice(0, features.maxMenusPerBranch);
  if (theme && !features.themes) theme = { ...theme, accent: "#1E2A5A", font_pairing: "bricolage_figtree", mode: "light" };
  const schedules = list.flatMap((m) => (m.menu_schedules ?? []).map((s) => ({ ...s, menu_id: m.id })));
  return {
    restaurant: r,
    branch: { ...branch, opening_hours: (branch.opening_hours ?? {}) as PublicMenuData["branch"]["opening_hours"] },
    theme: theme ? { accent: theme.accent, font_pairing: theme.font_pairing, mode: theme.mode, logo_url: theme.logo_url, cover_url: theme.cover_url } : null,
    generatedAt: now.toISOString(),
    activeMenuId: pickActiveMenu(list, schedules, localClock(now, branch.timezone)),
    menus: list.map((m) => ({
      id: m.id, name: m.name,
      schedules: (m.menu_schedules ?? []).map((x) => ({ weekdays: x.weekdays, start_time: x.start_time.slice(0, 5), end_time: x.end_time.slice(0, 5) })),
      categories: bySort(m.categories).map((c) => ({
        id: c.id, name: c.name,
        dishes: bySort(c.dishes).map((d) => ({
          id: d.id, name: d.name, short_description: d.short_description, description: d.description,
          price: Number(d.price), photo_url: d.photo_url, is_veg: d.is_veg, is_spicy: d.is_spicy, spice_level: d.spice_level,
          ingredients: d.ingredients, allergens: d.allergens, is_sold_out: d.is_sold_out, is_special: d.is_special,
          addons: bySort(d.dish_addons).map((a) => ({ id: a.id, name: a.name, price: Number(a.price) })),
        })),
      })),
    })),
  };
}
