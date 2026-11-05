import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Button, Divider, Input, Toggle } from "@/components/plated/primitives";
import { ChipInput } from "./ChipInput";
import { ImagePicker } from "./ImagePicker";
import { SortableItem, SortableList } from "./Sortable";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, type Dish } from "@/lib/dashboard/menu-data";
import { cn } from "@/lib/utils";

export const COMMON_ALLERGENS = ["gluten", "dairy", "egg", "nuts", "peanuts", "soy", "fish", "shellfish", "sesame", "celery", "mustard", "sulphites", "lupin", "molluscs"];

type AddonDraft = { id: string; name: string; price: string };
type Draft = Omit<Dish, "id" | "sort" | "dish_addons" | "price"> & { id?: string; price: string; addons: AddonDraft[] };

const blank = (category_id: string): Draft => ({
  category_id, name: "", short_description: "", description: "", price: "", photo_url: null, is_veg: false, is_spicy: false,
  spice_level: 0, ingredients: [], allergens: [], is_sold_out: false, is_special: false, addons: [],
});
const fromDish = (d: Dish): Draft => ({
  ...d, price: String(d.price), short_description: d.short_description ?? "", description: d.description ?? "",
  addons: d.dish_addons.map((a) => ({ id: a.id, name: a.name, price: String(a.price) })),
});

export function DishForm({ open, dish, categoryId, nextSort, restaurantId, currency, onClose, onSaved }: {
  open: boolean; dish: Dish | null; categoryId: string; nextSort: number; restaurantId: string; currency: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(() => (dish ? fromDish(dish) : blank(categoryId)));
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setD(dish ? fromDish(dish) : blank(categoryId)); }, [open, dish, categoryId]);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const symbol = new Intl.NumberFormat("en-GB", { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency")?.value ?? "";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(d.price);
    if (!d.name.trim()) { toast.error("Every dish needs a name."); return; }
    if (!Number.isFinite(price) || price < 0 || d.price.trim() === "") { toast.error("Add a price (0 is fine for free things)."); return; }
    const addons = d.addons.filter((a) => a.name.trim());
    if (addons.some((a) => !Number.isFinite(Number(a.price || 0)) || Number(a.price || 0) < 0)) { toast.error("Check the add-on prices."); return; }
    setBusy(true);
    const row = {
      category_id: d.category_id, name: d.name.trim(), short_description: d.short_description?.trim() || null, description: d.description?.trim() || null,
      price, photo_url: d.photo_url, is_veg: d.is_veg, is_spicy: d.is_spicy, spice_level: d.is_spicy ? Math.max(1, d.spice_level) : 0,
      ingredients: d.ingredients, allergens: d.allergens, is_sold_out: d.is_sold_out, is_special: d.is_special,
    };
    try {
      let id = d.id;
      if (id) {
        const { error } = await supabase.from("dishes").update(row).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("dishes").insert({ ...row, sort: nextSort }).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      const { error: delErr } = await supabase.from("dish_addons").delete().eq("dish_id", id);
      if (delErr) throw delErr;
      if (addons.length) {
        const { error } = await supabase.from("dish_addons").insert(addons.map((a, i) => ({ dish_id: id!, name: a.name.trim(), price: Number(a.price || 0), sort: i })));
        if (error) throw error;
      }
      toast.success(d.id ? "Dish saved." : `${row.name} is on the menu.`);
      onSaved(); onClose();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.form
            onSubmit={save} role="dialog" aria-label={dish ? `Edit ${dish.name}` : "New dish"}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-background sm:border-l sm:border-hairline"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }}
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-hairline px-5">
              <p className="font-display text-xl">{dish ? dish.name : "New dish"}</p>
              <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
              <ImagePicker label="Photo (cropped to 4:3)" value={d.photo_url} onChange={(v) => set("photo_url", v)} restaurantId={restaurantId} kind="dish" aspect={4 / 3} previewClassName="h-36 w-48" />
              <Input label="Name" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Shakshuka" autoFocus={!dish} />
              <Input label="Short description" value={d.short_description ?? ""} onChange={(e) => set("short_description", e.target.value)} maxLength={120} placeholder="Baked eggs, spiced tomato, sourdough" />
              <label className="block">
                <span className="mb-1.5 block text-xs text-muted-foreground">Longer description (shown when a diner taps the dish)</span>
                <textarea rows={3} value={d.description ?? ""} onChange={(e) => set("description", e.target.value)} maxLength={800}
                  className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm focus:border-ink focus:outline-none" />
              </label>
              <label className="block max-w-[10rem]">
                <span className="mb-1.5 block text-xs text-muted-foreground">Price</span>
                <div className="flex h-11 items-center rounded-lg border border-input bg-card px-3 focus-within:border-ink">
                  <span className="text-sm text-muted-foreground">{symbol}</span>
                  <input inputMode="decimal" aria-label="Price" value={d.price} onChange={(e) => set("price", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="9.50" className="ml-1 w-full bg-transparent text-sm tabular-nums focus:outline-none" />
                </div>
              </label>

              <Divider />
              <div className="grid gap-4 sm:grid-cols-2">
                <Row label="Vegetarian"><Toggle checked={d.is_veg} onChange={(v) => set("is_veg", v)} label="Vegetarian" /></Row>
                <Row label="Spicy"><Toggle checked={d.is_spicy} onChange={(v) => setD((x) => ({ ...x, is_spicy: v, spice_level: v ? Math.max(1, x.spice_level) : 0 }))} label="Spicy" /></Row>
                <Row label="Sold out"><Toggle checked={d.is_sold_out} onChange={(v) => set("is_sold_out", v)} label="Sold out" /></Row>
                <Row label="Today's special"><Toggle checked={d.is_special} onChange={(v) => set("is_special", v)} label="Today's special" /></Row>
              </div>
              {d.is_spicy && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Heat</span>
                  {[1, 2, 3].map((n) => (
                    <button key={n} type="button" onClick={() => set("spice_level", n)} aria-pressed={d.spice_level === n}
                      className={cn("rounded-full border px-3 py-1 text-xs", d.spice_level === n ? "border-terracotta bg-terracotta text-accent-foreground" : "border-hairline text-muted-foreground")}>
                      {["Mild", "Medium", "Hot"][n - 1]}
                    </button>
                  ))}
                </div>
              )}

              <Divider />
              <ChipInput label="Ingredients" value={d.ingredients} onChange={(v) => set("ingredients", v)} placeholder="Type and press Enter" />
              <ChipInput label="Allergens" value={d.allergens} onChange={(v) => set("allergens", v)} placeholder="Tap below or type your own" quickPicks={COMMON_ALLERGENS} />

              <Divider />
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Add-ons</span>
                  <button type="button" onClick={() => set("addons", [...d.addons, { id: crypto.randomUUID(), name: "", price: "" }])} className="text-sm underline decoration-ink/30 underline-offset-4">Add an add-on</button>
                </div>
                {d.addons.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Extra egg, oat milk, that kind of thing.</p>}
                <div className="mt-2">
                  <SortableList items={d.addons} onReorder={(next) => set("addons", next)}>
                    {d.addons.map((a) => (
                      <SortableItem key={a.id} id={a.id}>
                        {(handle) => (
                          <div className="flex items-center gap-2 border-b border-hairline py-2">
                            {handle}
                            <input aria-label="Add-on name" value={a.name} placeholder="Extra egg"
                              onChange={(e) => set("addons", d.addons.map((x) => (x.id === a.id ? { ...x, name: e.target.value } : x)))}
                              className="h-9 flex-1 rounded-md border border-input bg-card px-2.5 text-sm focus:border-ink focus:outline-none" />
                            <div className="flex h-9 w-24 items-center rounded-md border border-input bg-card px-2 focus-within:border-ink">
                              <span className="whitespace-nowrap text-xs text-muted-foreground">+{symbol}</span>
                              <input aria-label="Add-on price" inputMode="decimal" value={a.price} placeholder="0"
                                onChange={(e) => set("addons", d.addons.map((x) => (x.id === a.id ? { ...x, price: e.target.value.replace(/[^0-9.]/g, "") } : x)))}
                                className="ml-1 w-full bg-transparent text-sm tabular-nums focus:outline-none" />
                            </div>
                            <button type="button" aria-label="Remove add-on" onClick={() => set("addons", d.addons.filter((x) => x.id !== a.id))} className="px-1 text-muted-foreground hover:text-terracotta">×</button>
                          </div>
                        )}
                      </SortableItem>
                    ))}
                  </SortableList>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 border-t border-hairline px-5 py-4">
              <Button type="submit" variant="accent" disabled={busy}>{busy ? "Saving…" : dish ? "Save dish" : "Add dish"}</Button>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </motion.form>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 sm:justify-start"><span className="text-sm sm:w-32">{label}</span>{children}</div>;
}
