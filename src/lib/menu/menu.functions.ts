import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { buildPublicMenu, pickTheme } from "./build";
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

/** Public, read-only: menu data for a published restaurant (RLS limits anon to published rows).
 * With a table token, the table's own branch is shown; otherwise the first branch. */
export const getPublicMenu = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string; table?: string | undefined }) =>
    z.object({ slug: z.string().min(1).max(80), table: z.string().max(64).optional() }).parse(input))
  .handler(async ({ data }): Promise<PublicMenuData | null> => {
    const sb = publicClient();
    const { data: r } = await sb.from("restaurants")
      .select("id, name, slug, description, logo_url, cover_url, currency, plan")
      .eq("slug", data.slug).maybeSingle();
    if (!r) return null;
    let branchId: string | null = null;
    if (data.table) {
      const { data: t } = await sb.rpc("resolve_table", { _token: data.table });
      const hit = (t ?? []).find((x) => x.restaurant_slug === r.slug);
      if (hit) branchId = hit.branch_id;
    }
    const q = sb.from("branches").select("id, name, address, timezone, opening_hours").eq("restaurant_id", r.id);
    const { data: branch } = branchId ? await q.eq("id", branchId).maybeSingle() : await q.order("sort").limit(1).maybeSingle();
    if (!branch) return null;

    const [{ data: themes }, { data: menus }] = await Promise.all([
      sb.from("themes").select("accent, font_pairing, mode, logo_url, cover_url, branch_id").eq("restaurant_id", r.id),
      sb.from("menus").select("id, name, sort, active, menu_schedules(menu_id, weekdays, start_time, end_time), categories(id, name, sort, dishes(id, name, short_description, description, price, photo_url, is_veg, is_spicy, spice_level, ingredients, allergens, is_sold_out, is_special, sort, dish_addons(id, name, price, sort)))")
        .eq("branch_id", branch.id).eq("active", true).order("sort"),
    ]);
    return buildPublicMenu(r, branch, pickTheme(themes ?? [], branch.id), menus ?? []);
  });
