import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button, PillGroup, Toggle, buttonVariants } from "@/components/plated/primitives";
import { useBranch } from "@/components/dashboard/BranchContext";
import { DishForm } from "@/components/dashboard/DishForm";
import { ScheduleEditor } from "@/components/dashboard/ScheduleEditor";
import { SortableItem, SortableList } from "@/components/dashboard/Sortable";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, menuTreeKey, menuTreeQuery, saveOrder, type Category, type Dish, type Menu } from "@/lib/dashboard/menu-data";
import { canAddMenu } from "@/lib/plan";
import { formatPrice } from "@/lib/menu/types";
import { sized } from "@/lib/unsplash";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/menu")({
  head: () => ({ meta: [{ title: "Menu editor — Plated" }, { name: "description", content: "Menus, categories, dishes and schedules." }] }),
  component: MenuEditor,
});

/** Text that saves itself when you click away or press Enter. */
function InlineText({ value, onSave, className, label }: { value: string; onSave: (v: string) => void; className?: string; label: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => { const t = v.trim(); if (!t) return setV(value); if (t !== value) onSave(t); };
  return (
    <input aria-label={label} value={v} onChange={(e) => setV(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setV(value); (e.target as HTMLInputElement).blur(); } }}
      className={cn("min-w-0 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 hover:border-hairline focus:border-ink focus:outline-none", className)} />
  );
}

function MenuEditor() {
  const { restaurant } = Route.useRouteContext();
  const { branch } = useBranch();
  const branchId = branch?.id ?? "";
  const qc = useQueryClient();
  const { data: menus = [], isLoading } = useQuery({ ...menuTreeQuery(branchId), enabled: !!branchId });
  const [menuId, setMenuId] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [upsell, setUpsell] = useState(false);
  const [form, setForm] = useState<{ dish: Dish | null; categoryId: string; nextSort: number } | null>(null);
  const [newCat, setNewCat] = useState("");
  const menu = menus.find((m) => m.id === menuId) ?? menus[0] ?? null;

  const key = menuTreeKey(branchId);
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const patch = (fn: (ms: Menu[]) => Menu[]) => {
    const prev = qc.getQueryData<Menu[]>(key);
    if (prev) qc.setQueryData(key, fn(prev));
    return () => qc.setQueryData(key, prev);
  };
  const run = async (undo: () => void, p: PromiseLike<{ error: unknown }>, ok?: string) => {
    const { error } = await p;
    if (error) { undo(); toast.error(errMsg(error)); return false; }
    if (ok) toast.success(ok);
    return true;
  };
  const mapCats = (fn: (c: Category) => Category) => (ms: Menu[]) => ms.map((m) => ({ ...m, categories: m.categories.map(fn) }));
  const mapDish = (id: string, p: Partial<Dish>) => mapCats((c) => ({ ...c, dishes: c.dishes.map((d) => (d.id === id ? { ...d, ...p } : d)) }));

  // dishes
  const setDish = (d: Dish, p: Partial<Dish>, ok?: string) => run(patch(mapDish(d.id, p)), supabase.from("dishes").update(p).eq("id", d.id), ok);
  const deleteDish = async (d: Dish) => {
    if (!confirm(`Remove ${d.name} from the menu?`)) return;
    const undo = patch(mapCats((c) => ({ ...c, dishes: c.dishes.filter((x) => x.id !== d.id) })));
    await run(undo, supabase.from("dishes").delete().eq("id", d.id), `${d.name} removed.`);
  };
  const reorderDishes = (cat: Category, next: Dish[]) => {
    const undo = patch(mapCats((c) => (c.id === cat.id ? { ...c, dishes: next } : c)));
    saveOrder("dishes", next.map((d) => d.id)).catch((e) => { undo(); toast.error(errMsg(e)); });
  };

  // categories
  const reorderCats = (next: Category[]) => {
    if (!menu) return;
    const undo = patch((ms) => ms.map((m) => (m.id === menu.id ? { ...m, categories: next } : m)));
    saveOrder("categories", next.map((c) => c.id)).catch((e) => { undo(); toast.error(errMsg(e)); });
  };
  const renameCat = (c: Category, name: string) => run(patch(mapCats((x) => (x.id === c.id ? { ...x, name } : x))), supabase.from("categories").update({ name }).eq("id", c.id));
  const addCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menu || !newCat.trim()) return;
    const { error } = await supabase.from("categories").insert({ menu_id: menu.id, name: newCat.trim(), sort: menu.categories.length });
    if (error) return toast.error(errMsg(error));
    setNewCat(""); refresh();
  };
  const deleteCat = async (c: Category) => {
    if (!confirm(c.dishes.length ? `Delete ${c.name} and its ${c.dishes.length} dish${c.dishes.length > 1 ? "es" : ""}?` : `Delete ${c.name}?`)) return;
    const undo = patch((ms) => ms.map((m) => ({ ...m, categories: m.categories.filter((x) => x.id !== c.id) })));
    await run(undo, supabase.from("categories").delete().eq("id", c.id), `${c.name} deleted.`);
  };

  // menus
  const addMenu = async () => {
    if (!canAddMenu(restaurant.plan, menus.length)) return setUpsell(true);
    const { data, error } = await supabase.from("menus").insert({ branch_id: branchId, name: "New menu", sort: menus.length }).select("id").single();
    if (error) return toast.error(errMsg(error));
    await refresh(); setMenuId(data.id); setShowSchedule(true);
  };
  const setMenu = (m: Menu, p: Partial<Pick<Menu, "name" | "active">>, ok?: string) =>
    run(patch((ms) => ms.map((x) => (x.id === m.id ? { ...x, ...p } : x))), supabase.from("menus").update(p).eq("id", m.id), ok);
  const deleteMenu = async (m: Menu) => {
    if (menus.length <= 1) return toast.error("Keep at least one menu. Rename this one instead?");
    if (!confirm(`Delete the ${m.name} menu and everything in it?`)) return;
    const undo = patch((ms) => ms.filter((x) => x.id !== m.id));
    if (await run(undo, supabase.from("menus").delete().eq("id", m.id), `${m.name} deleted.`)) setMenuId(null);
  };

  if (!branch || isLoading) return <p className="text-muted-foreground">Fetching your menu…</p>;

  return (
    <div className="max-w-4xl">
      <p className="eyebrow">Menu · {branch.name}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-5xl leading-none md:text-6xl">What's cooking.</h1>
        <Link to="/m/$slug" params={{ slug: restaurant.slug }} target="_blank" className={buttonVariants({ variant: "link" })}>Preview as a diner ↗</Link>
      </div>

      {/* menus */}
      <div className="mt-10 flex flex-wrap items-center gap-3 border-b border-hairline pb-4">
        <div className="-mx-1 flex max-w-full overflow-x-auto px-1">
          <PillGroup id="menu-tabs" items={menus.map((m) => ({ value: m.id, label: m.name }))} value={menu?.id ?? ""} onChange={(v) => { setMenuId(v); setShowSchedule(false); }} />
        </div>
        <button onClick={addMenu} className="text-sm text-muted-foreground underline decoration-ink/20 underline-offset-4 hover:text-foreground">+ New menu</button>
      </div>
      {upsell && (
        <div className="mt-4 grid gap-3 rounded-lg border border-terracotta/40 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <p className="text-sm"><span className="font-display text-lg">Breakfast and dinner menus?</span><br /><span className="text-muted-foreground">The Free plan has one menu. Pro adds as many as you like, switching by time of day.</span></p>
          <div className="flex items-center gap-4"><Link to="/" hash="pricing" className={buttonVariants({ variant: "accent", size: "sm" })}>See Pro</Link><button onClick={() => setUpsell(false)} className="text-sm text-muted-foreground">Not now</button></div>
        </div>
      )}

      {menu && (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-hairline py-4 text-sm">
            <InlineText label="Menu name" value={menu.name} onSave={(name) => setMenu(menu, { name })} className="-ml-1.5 font-display text-2xl" />
            <span className="flex items-center gap-2 text-muted-foreground">Shown to diners <Toggle checked={menu.active} onChange={(v) => setMenu(menu, { active: v }, v ? "Menu visible." : "Menu hidden from diners.")} label="Shown to diners" /></span>
            <button onClick={() => setShowSchedule((s) => !s)} className={cn("underline decoration-ink/20 underline-offset-4", showSchedule ? "text-foreground" : "text-muted-foreground")}>
              {menu.menu_schedules.length ? `Schedule (${menu.menu_schedules.length})` : "Set times"}
            </button>
            <button onClick={() => deleteMenu(menu)} className="ml-auto text-muted-foreground hover:text-terracotta">Delete menu</button>
          </div>
          {showSchedule && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden border-b border-hairline">
              <div className="py-6"><ScheduleEditor menus={menus} menu={menu} onSaved={refresh} /></div>
            </motion.div>
          )}

          {/* categories + dishes */}
          <div className="mt-8 space-y-10">
            {menu.categories.length === 0 && <p className="text-muted-foreground">An empty menu. Start with a category, like "Breakfast" or "Small plates".</p>}
            <SortableList items={menu.categories} onReorder={reorderCats}>
              {menu.categories.map((c) => (
                <SortableItem key={c.id} id={c.id} className="mb-10">
                  {(handle) => (
                    <section>
                      <div className="flex items-center gap-2 border-b border-ink/80 pb-2">
                        {handle}
                        <InlineText label="Category name" value={c.name} onSave={(n) => renameCat(c, n)} className="flex-1 font-display text-2xl md:text-3xl" />
                        <button onClick={() => setForm({ dish: null, categoryId: c.id, nextSort: c.dishes.length })} className="shrink-0 text-sm underline decoration-ink/30 underline-offset-4 hover:decoration-terracotta">Add dish</button>
                        <button onClick={() => deleteCat(c)} aria-label={`Delete ${c.name}`} className="shrink-0 px-1 text-muted-foreground hover:text-terracotta">×</button>
                      </div>
                      {c.dishes.length === 0 && <p className="py-4 text-sm text-muted-foreground">No dishes yet.</p>}
                      <SortableList items={c.dishes} onReorder={(next) => reorderDishes(c, next)}>
                        {c.dishes.map((d) => (
                          <SortableItem key={d.id} id={d.id}>
                            {(dh) => (
                              <DishRow dish={d} handle={dh} currency={restaurant.currency}
                                onOpen={() => setForm({ dish: d, categoryId: c.id, nextSort: 0 })}
                                onPrice={(price) => setDish(d, { price })}
                                onSoldOut={(v) => setDish(d, { is_sold_out: v }, v ? `${d.name} marked sold out.` : `${d.name} is back.`)}
                                onSpecial={(v) => setDish(d, { is_special: v })}
                                onDelete={() => deleteDish(d)} />
                            )}
                          </SortableItem>
                        ))}
                      </SortableList>
                    </section>
                  )}
                </SortableItem>
              ))}
            </SortableList>
            <form onSubmit={addCat} className="flex items-center gap-3">
              <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category, e.g. Small plates" aria-label="New category"
                className="h-11 flex-1 rounded-lg border border-input bg-card px-3.5 text-sm focus:border-ink focus:outline-none" />
              <Button type="submit" variant="outline" disabled={!newCat.trim()}>Add category</Button>
            </form>
          </div>
        </>
      )}

      <DishForm open={!!form} dish={form?.dish ?? null} categoryId={form?.categoryId ?? ""} nextSort={form?.nextSort ?? 0}
        restaurantId={restaurant.id} currency={restaurant.currency} onClose={() => setForm(null)} onSaved={refresh} />
    </div>
  );
}

function DishRow({ dish: d, handle, currency, onOpen, onPrice, onSoldOut, onSpecial, onDelete }: {
  dish: Dish; handle: React.ReactNode; currency: string; onOpen: () => void; onPrice: (p: number) => void;
  onSoldOut: (v: boolean) => void; onSpecial: (v: boolean) => void; onDelete: () => void;
}) {
  const [price, setPrice] = useState(String(d.price));
  useEffect(() => setPrice(String(d.price)), [d.price]);
  const commitPrice = () => { const n = Number(price); if (!Number.isFinite(n) || n < 0 || price === "") return setPrice(String(d.price)); if (n !== d.price) onPrice(n); };
  return (
    <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 gap-y-2 border-b border-hairline py-3 md:grid-cols-[auto_auto_1fr_auto_auto_auto_auto]">
      {handle}
      <button onClick={onOpen} className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-sand" aria-label={`Edit ${d.name}`}>
        {d.photo_url && <img src={sized(d.photo_url, 160, 120)} alt="" loading="lazy" className={cn("h-full w-full object-cover", d.is_sold_out && "grayscale")} />}
      </button>
      <button onClick={onOpen} className="min-w-0 text-left">
        <p className={cn("truncate font-display text-lg leading-tight", d.is_sold_out && "text-muted-foreground")}>{d.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[d.is_veg && "Veg", d.is_spicy && "Spicy", d.dish_addons.length && `${d.dish_addons.length} add-on${d.dish_addons.length > 1 ? "s" : ""}`, !d.photo_url && "No photo"].filter(Boolean).join(" · ") || d.short_description || "Tap to add details"}
        </p>
      </button>
      <label className="flex h-9 w-20 items-center justify-self-end rounded-md border border-transparent px-1.5 hover:border-hairline focus-within:border-ink">
        <span className="sr-only">Price of {d.name}</span>
        <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} onBlur={commitPrice}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="w-full bg-transparent text-right text-sm tabular-nums focus:outline-none" title={formatPrice(d.price, currency)} />
      </label>
      <div className="col-span-4 flex items-center justify-end gap-5 pl-9 md:col-span-1 md:contents">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">Sold out <Toggle checked={d.is_sold_out} onChange={onSoldOut} label={`${d.name} sold out`} /></span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">Special <Toggle checked={d.is_special} onChange={onSpecial} label={`${d.name} today's special`} /></span>
        <button onClick={onDelete} aria-label={`Delete ${d.name}`} className="px-1 text-muted-foreground hover:text-terracotta">×</button>
      </div>
    </div>
  );
}
