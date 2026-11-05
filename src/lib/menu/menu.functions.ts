import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { localClock, pickActiveMenu } from "./schedule";
import type { PublicMenuData } from "./types";

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Public, read-only: menu data for a published restaurant (RLS limits anon to published rows). */
export const getPublicMenu = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data }): Promise<PublicMenuData | null> => {
    const sb = publicClient();
    const { data: r } = await sb.from("restaurants")
      .select("id, name, slug, description, logo_url, cover_url, currency, plan")
      .eq("slug", data.slug).maybeSingle();
    if (!r) return null;
    const { data: branch } = await sb.from("branches")
      .select("id, name, address, timezone, opening_hours").eq("restaurant_id", r.id).order("sort").limit(1).maybeSingle();
    if (!branch) return null;

    const [{ data: themes }, { data: menus }] = await Promise.all([
      sb.from("themes").select("accent, font_pairing, mode, branch_id").eq("restaurant_id", r.id),
      sb.from("menus").select("id, name, sort, active, menu_schedules(menu_id, weekdays, start_time, end_time), categories(id, name, sort, dishes(id, name, short_description, description, price, photo_url, is_veg, is_spicy, spice_level, ingredients, allergens, is_sold_out, is_special, sort, dish_addons(id, name, price, sort)))")
        .eq("branch_id", branch.id).eq("active", true).order("sort"),
    ]);

    const list = menus ?? [];
    const schedules = list.flatMap((m) => m.menu_schedules ?? []);
    const activeMenuId = pickActiveMenu(list, schedules, localClock(new Date(), branch.timezone));
    const theme = themes?.find((t) => t.branch_id === branch.id) ?? themes?.find((t) => !t.branch_id) ?? null;

    return {
      restaurant: r,
      branch: { ...branch, opening_hours: (branch.opening_hours ?? {}) as PublicMenuData["branch"]["opening_hours"] },
      theme: theme ? { accent: theme.accent, font_pairing: theme.font_pairing, mode: theme.mode } : null,
      activeMenuId,
      menus: list.map((m) => ({
        id: m.id, name: m.name,
        categories: [...(m.categories ?? [])].sort((a, b) => a.sort - b.sort).map((c) => ({
          id: c.id, name: c.name,
          dishes: [...(c.dishes ?? [])].sort((a, b) => a.sort - b.sort).map((d) => ({
            id: d.id, name: d.name, short_description: d.short_description, description: d.description,
            price: Number(d.price), photo_url: d.photo_url, is_veg: d.is_veg, is_spicy: d.is_spicy, spice_level: d.spice_level,
            ingredients: d.ingredients, allergens: d.allergens, is_sold_out: d.is_sold_out, is_special: d.is_special,
            addons: [...(d.dish_addons ?? [])].sort((a, b) => a.sort - b.sort).map((a) => ({ id: a.id, name: a.name, price: Number(a.price) })),
          })),
        })),
      })),
    };
  });
