import { useEffect, useState } from "react";
import { BottomSheet, Button, Divider, Tag } from "@/components/thaal/primitives";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, type PublicDish } from "@/lib/menu/types";
import { cn } from "@/lib/utils";
import { DishImage } from "./DishImage";

type Reviews = { avg: number | null; count: number; recent: { rating: number; comment: string }[] };

export function SpiceMarks({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Spice level ${level} of 3`}>
      {[1, 2, 3].map((i) => <span key={i} className={cn("h-2.5 w-1 rounded-full", i <= level ? "bg-marigold" : "bg-mist-deep")} />)}
    </span>
  );
}

export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  return (
    <span className={cn("tracking-[0.15em]", size === "lg" ? "text-xl" : "text-xs")} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= Math.round(value) ? "text-highlight" : "text-mist-deep"}>★</span>)}
    </span>
  );
}

export function DishSheet({ dish, currency, canOrder, blockedReason, onClose, onAdd }: {
  dish: PublicDish | null; currency: string; canOrder: boolean; blockedReason: string | null;
  onClose: () => void;
  onAdd: (d: PublicDish, addonIds: string[], qty: number, note: string) => void;
}) {
  const [addons, setAddons] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [reviews, setReviews] = useState<Reviews | null>(null);

  useEffect(() => {
    if (!dish) return;
    setAddons([]); setQty(1); setNote(""); setReviews(null);
    let alive = true;
    supabase.rpc("get_dish_reviews", { p_dish_id: dish.id }).then(({ data }) => {
      const row = data?.[0];
      if (alive && row) setReviews({ avg: row.avg_rating, count: row.review_count, recent: (row.recent as Reviews["recent"]) ?? [] });
    });
    return () => { alive = false; };
  }, [dish]);

  const unit = dish ? dish.price + dish.addons.filter((a) => addons.includes(a.id)).reduce((s, a) => s + a.price, 0) : 0;
  const total = unit * qty;

  return (
    <BottomSheet open={!!dish} onClose={onClose} label={dish?.name}>
      {dish && (
        <div>
          <DishImage url={dish.photo_url} alt={dish.name} w={800} ratio={0.62} sizes="(max-width: 448px) 100vw, 448px" eager
            className="-mx-5 rounded-none" />
          <div className="mt-5 flex items-start justify-between gap-4">
            <h2 className="text-3xl leading-tight">{dish.name}</h2>
            <span className="pt-1.5 text-base tabular-nums">{formatPrice(dish.price, currency)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {dish.is_special && <Tag kind="spicy" className="border-marigold bg-marigold text-accent-foreground">Today's special</Tag>}
            {dish.is_veg && <Tag kind="veg">veg</Tag>}
            {dish.is_spicy && <span className="flex items-center gap-1.5"><Tag kind="spicy">spicy</Tag><SpiceMarks level={Math.max(1, dish.spice_level)} /></span>}
            {reviews?.avg != null && reviews.count > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Stars value={reviews.avg} /> {reviews.avg} · {reviews.count}</span>
            )}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{dish.description ?? dish.short_description}</p>

          {(dish.ingredients.length > 0 || dish.allergens.length > 0) && (
            <dl className="mt-5 space-y-2 text-sm">
              {dish.ingredients.length > 0 && <div className="grid grid-cols-[6.5rem_1fr] gap-2"><dt className="text-muted-foreground">In it</dt><dd>{dish.ingredients.join(", ")}</dd></div>}
              {dish.allergens.length > 0 && <div className="grid grid-cols-[6.5rem_1fr] gap-2"><dt className="text-muted-foreground">Allergens</dt><dd>{dish.allergens.join(", ")}</dd></div>}
            </dl>
          )}

          {canOrder && dish.addons.length > 0 && (
            <>
              <Divider className="my-5" />
              <p className="eyebrow mb-3">Make it yours</p>
              <div className="space-y-1">
                {dish.addons.map((a) => {
                  const on = addons.includes(a.id);
                  return (
                    <label key={a.id} className="flex cursor-pointer items-center justify-between rounded-lg py-2 text-sm">
                      <span className="flex items-center gap-3">
                        <input type="checkbox" checked={on} onChange={() => setAddons((x) => (on ? x.filter((i) => i !== a.id) : [...x, a.id]))}
                          className="h-4 w-4 rounded accent-[var(--marigold)]" />
                        {a.name}
                      </span>
                      <span className="tabular-nums text-muted-foreground">+{formatPrice(a.price, currency)}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {canOrder && (
            <>
              <Divider className="my-5" />
              <label className="block">
                <span className="eyebrow mb-2 block">A note for the kitchen</span>
                <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} placeholder="No onions, please"
                  className="h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm placeholder:text-muted-foreground/70 focus:border-ink focus:outline-none" />
              </label>
            </>
          )}

          {reviews && reviews.recent.length > 0 && (
            <>
              <Divider className="my-5" />
              <p className="eyebrow mb-3">What people said</p>
              <ul className="space-y-3">
                {reviews.recent.map((r, i) => (
                  <li key={i} className="text-sm"><Stars value={r.rating} /><p className="mt-0.5 text-muted-foreground">“{r.comment}”</p></li>
                ))}
              </ul>
            </>
          )}

          <div className="sticky bottom-0 -mx-5 mt-6 border-t border-hairline bg-background px-5 pt-4 pb-1">
            {canOrder ? (
              <div className="flex items-center gap-3">
                <div className="flex h-12 items-center rounded-lg border border-hairline">
                  <button aria-label="One less" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-full w-11 text-lg">−</button>
                  <span className="w-6 text-center tabular-nums">{qty}</span>
                  <button aria-label="One more" onClick={() => setQty((q) => Math.min(20, q + 1))} className="h-full w-11 text-lg">+</button>
                </div>
                <Button variant="accent" size="lg" className="flex-1" onClick={() => onAdd(dish, addons, qty, note.trim())}>
                  Add · {formatPrice(total, currency)}
                </Button>
              </div>
            ) : (
              <p className="py-2 text-center text-sm text-muted-foreground">{blockedReason}</p>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
