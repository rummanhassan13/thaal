import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { BottomSheet, Button, PillGroup, Tag } from "@/components/plated/primitives";
import { sized, srcSet } from "@/lib/unsplash";
import { formatPrice, todaysHours, type PublicDish, type PublicMenuData } from "@/lib/menu/types";
import { supabase } from "@/integrations/supabase/client";

/** Diner menu view. `inPhone` adds room for the mockup's status bar. `live` subscribes to sold-out changes. */
export function MenuView({ data, inPhone, live }: { data: PublicMenuData; inPhone?: boolean; live?: boolean }) {
  const [menuId, setMenuId] = useState(data.activeMenuId ?? data.menus[0]?.id ?? "");
  const [soldOut, setSoldOut] = useState<Record<string, boolean>>({});
  const menu = data.menus.find((m) => m.id === menuId) ?? data.menus[0];
  const cats = useMemo(() => (menu?.categories ?? []).filter((c) => c.dishes.length), [menu]);
  const cur = data.restaurant.currency;

  const scroller = useRef<HTMLDivElement>(null);
  const sections = useRef<Record<string, HTMLElement | null>>({});
  const [active, setActive] = useState(cats[0]?.id ?? "");
  const [cart, setCart] = useState(0);
  const [open, setOpen] = useState<PublicDish | null>(null);
  const cartCtl = useAnimationControls();
  const lock = useRef(false);
  const stickyTop = inPhone ? 32 : 0;

  useEffect(() => setActive(cats[0]?.id ?? ""), [cats]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      if (lock.current) return;
      const top = el.scrollTop + stickyTop + 90;
      let curId = cats[0]?.id ?? "";
      for (const c of cats) { const s = sections.current[c.id]; if (s && s.offsetTop <= top) curId = c.id; }
      setActive(curId);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [cats, stickyTop]);

  useEffect(() => {
    if (!live) return;
    const ids = new Set(data.menus.flatMap((m) => m.categories.flatMap((c) => c.dishes.map((d) => d.id))));
    const ch = supabase
      .channel(`dishes-${data.restaurant.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "dishes" }, (p) => {
        const row = p.new as { id: string; is_sold_out: boolean };
        if (ids.has(row.id)) setSoldOut((s) => ({ ...s, [row.id]: row.is_sold_out }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [live, data]);

  const isOut = (d: PublicDish) => soldOut[d.id] ?? d.is_sold_out;

  const jump = (id: string) => {
    setActive(id);
    const s = sections.current[id];
    if (!s || !scroller.current) return;
    lock.current = true;
    scroller.current.scrollTo({ top: s.offsetTop - stickyTop - 52, behavior: "smooth" });
    setTimeout(() => (lock.current = false), 600);
  };

  const add = () => {
    setCart((n) => n + 1);
    cartCtl.start({ scale: [1, 1.18, 0.96, 1], transition: { duration: 0.42 } });
  };

  const r = data.restaurant;
  const initials = r.name.split(/\s|&/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("&");

  return (
    <div className="relative h-full overflow-hidden bg-background text-foreground">
      <div ref={scroller} className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-24">
        <div className={`relative h-32 ${inPhone ? "mt-8" : "h-44"}`}>
          {r.cover_url && <img src={sized(r.cover_url, 800, 400)} alt={`Inside ${r.name}`} className="h-full w-full object-cover" />}
        </div>
        <div className="px-4">
          <div className="relative -mt-7 flex items-end gap-3">
            {r.logo_url ? (
              <img src={sized(r.logo_url, 120, 120)} alt="" className="h-14 w-14 rounded-full border-4 border-background object-cover" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-full border-4 border-background bg-marigold font-display text-lg text-accent-foreground">{initials}</div>
            )}
          </div>
          <h3 className="mt-2 text-2xl">{r.name}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{data.branch.name} · {todaysHours(data.branch.opening_hours, data.branch.timezone)}</p>
          {data.menus.length > 1 && (
            <div className="mt-3 flex gap-3 text-xs">
              {data.menus.map((m) => (
                <button key={m.id} onClick={() => setMenuId(m.id)} className={m.id === menuId ? "text-foreground underline decoration-marigold underline-offset-4" : "text-muted-foreground"}>
                  {m.name}{m.id === data.activeMenuId ? " · now" : ""}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sticky z-10 mt-4 border-b border-hairline bg-background/95 px-3 py-2.5 backdrop-blur-sm" style={{ top: stickyTop }}>
          <PillGroup id={`pill-${inPhone ? "phone" : "page"}`} size="sm" className="no-scrollbar overflow-x-auto" items={cats.map((c) => ({ value: c.id, label: c.name }))} value={active} onChange={jump} />
        </div>

        {cats.map((c) => (
          <section key={c.id} ref={(el) => { sections.current[c.id] = el; }} className="px-4 pt-5">
            <p className="eyebrow mb-3">{c.name}</p>
            <div className="space-y-5">
              {c.dishes.map((d) => {
                const out = isOut(d);
                return (
                  <button key={d.id} onClick={() => !out && setOpen(d)} className={`block w-full text-left ${out ? "cursor-not-allowed" : ""}`}>
                    <div className="relative overflow-hidden rounded-lg bg-secondary">
                      {d.photo_url && (
                        <img src={sized(d.photo_url, 520, 325)} srcSet={srcSet(d.photo_url, [360, 520, 800], 0.625)} sizes="(max-width: 480px) 92vw, 440px"
                          alt={d.name} loading="lazy" decoding="async" className={`aspect-[16/10] w-full object-cover ${out ? "opacity-60 grayscale" : ""}`} />
                      )}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {out && <Tag kind="soldout">Sold out</Tag>}
                        {d.is_special && !out && <Tag kind="soldout" className="border-marigold bg-marigold">Today's special</Tag>}
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between gap-3">
                      <h4 className="font-display text-[17px] leading-tight">{d.name}</h4>
                      <span className="text-sm tabular-nums">{formatPrice(d.price, cur)}</span>
                    </div>
                    {d.short_description && <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{d.short_description}</p>}
                    {(d.is_veg || d.is_spicy) && (
                      <div className="mt-1.5 flex gap-1">
                        {d.is_veg && <Tag kind="veg">veg</Tag>}
                        {d.is_spicy && <Tag kind="spicy">{"spicy" + (d.spice_level > 1 ? ` ×${d.spice_level}` : "")}</Tag>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        <p className="px-4 pt-8 text-center text-[10px] text-muted-foreground">Menu by Plated</p>
      </div>

      {cart > 0 && (
        <motion.div initial={{ y: 60 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="absolute inset-x-3 bottom-3 z-20">
          <motion.div animate={cartCtl} className="flex items-center justify-between rounded-lg bg-ink px-4 py-3 text-sm text-paper">
            <span>{cart} in your order</span><span className="underline underline-offset-4">View</span>
          </motion.div>
        </motion.div>
      )}

      <BottomSheet contained open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div>
            {open.photo_url && <img src={sized(open.photo_url, 640, 360)} alt={open.name} className="aspect-[16/9] w-full rounded-lg object-cover" />}
            <div className="mt-3 flex items-baseline justify-between">
              <h4 className="font-display text-xl">{open.name}</h4>
              <span className="text-sm">{formatPrice(open.price, cur)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{open.description ?? open.short_description}</p>
            {open.allergens.length > 0 && <p className="mt-2 text-[11px] text-muted-foreground">Contains: {open.allergens.join(", ")}</p>}
            {open.addons.length > 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">Add: {open.addons.map((a) => `${a.name} +${formatPrice(a.price, cur)}`).join(" · ")}</p>
            )}
            <Button variant="accent" className="mt-4 w-full" onClick={() => { add(); setOpen(null); }}>Add to order · {formatPrice(open.price, cur)}</Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[300px] rounded-[44px] bg-ink p-[10px] sm:w-[320px]">
      <div className="relative h-[620px] overflow-hidden rounded-[34px] sm:h-[660px]">
        <div className="absolute inset-x-0 top-0 z-30 h-8 bg-background" />
        <div className="absolute top-2 left-1/2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-ink" />
        {children}
      </div>
    </div>
  );
}
