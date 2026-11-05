import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Addon = { id: string; name: string; price: number; sort: number };
export type Dish = {
  id: string; category_id: string; name: string; short_description: string | null; description: string | null;
  price: number; photo_url: string | null; is_veg: boolean; is_spicy: boolean; spice_level: number;
  ingredients: string[]; allergens: string[]; is_sold_out: boolean; is_special: boolean; sort: number; dish_addons: Addon[];
};
export type Category = { id: string; menu_id: string; name: string; sort: number; dishes: Dish[] };
export type MenuSchedule = { id: string; menu_id: string; weekdays: number[]; start_time: string; end_time: string };
export type Menu = { id: string; name: string; sort: number; active: boolean; menu_schedules: MenuSchedule[]; categories: Category[] };

export const menuTreeKey = (branchId: string) => ["menu-tree", branchId] as const;

const bySort = <T extends { sort: number }>(a: T[]) => [...a].sort((x, y) => x.sort - y.sort);

export const menuTreeQuery = (branchId: string) => queryOptions({
  queryKey: menuTreeKey(branchId),
  queryFn: async (): Promise<Menu[]> => {
    const { data, error } = await supabase.from("menus")
      .select("id, name, sort, active, menu_schedules(id, menu_id, weekdays, start_time, end_time), categories(id, menu_id, name, sort, dishes(id, category_id, name, short_description, description, price, photo_url, is_veg, is_spicy, spice_level, ingredients, allergens, is_sold_out, is_special, sort, dish_addons(id, name, price, sort)))")
      .eq("branch_id", branchId).order("sort").order("created_at");
    if (error) throw error;
    return (data ?? []).map((m) => ({
      ...m,
      menu_schedules: m.menu_schedules ?? [],
      categories: bySort(m.categories ?? []).map((c) => ({
        ...c,
        dishes: bySort(c.dishes ?? []).map((d) => ({ ...d, price: Number(d.price), dish_addons: bySort(d.dish_addons ?? []).map((a) => ({ ...a, price: Number(a.price) })) })),
      })),
    }));
  },
});

/** Persist a new order: each row's `sort` becomes its index. */
export async function saveOrder(table: "menus" | "categories" | "dishes", ids: string[]) {
  const results = await Promise.all(ids.map((id, i) => supabase.from(table).update({ sort: i }).eq("id", id)));
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e));
