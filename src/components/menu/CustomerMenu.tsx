import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimationControls, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { PillGroup, Tag } from "@/components/plated/primitives";
import { supabase } from "@/integrations/supabase/client";
import { addLine, cartCount, cartTotal, setQty, toOrderItems, type CartLine } from "@/lib/menu/cart";
import { openState } from "@/lib/menu/hours";
import { localClock, pickActiveMenu } from "@/lib/menu/schedule";
import { themeStyle } from "@/lib/menu/theme";
import { formatPrice, type PublicDish, type PublicMenuData } from "@/lib/menu/types";
import { sized } from "@/lib/unsplash";
import { cn } from "@/lib/utils";
import { CartSheet } from "./CartSheet";
import { DishImage } from "./DishImage";
import { DishSheet } from "./DishSheet";
import { logEvent, logScanOnce } from "./events";
import { OrderStatusSheet, useOrderStatus, type StoredOrder } from "./OrderStatus";

const STICKY_H = 56;
const COOLDOWN_MS = 60_000;

function useClock(tz: string, initialIso: string) {
  const [now, setNow] = useState(() => new Date(initialIso));
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => localClock(now, tz), [now, tz]);
}

export function CustomerMenu({ data, table }: { data: PublicMenuData; table: string | undefined }) {
  const r = data.restaurant;
  const cur = r.currency;
  const branchId = data.branch.id;
  const clock = useClock(data.branch.timezone, data.generatedAt);
  const hours = openState(data.branch.opening_hours, clock);

  // --- time-based menus ---
  const schedules = useMemo(() => data.menus.flatMap((m) => m.schedules.map((s) => ({ ...s, menu_id: m.id }))), [data.menus]);
  const activeMenuId = useMemo(() => pickActiveMenu(data.menus.map((m, i) => ({ id: m.id, sort: i })), schedules, clock) ?? data.menus[0]?.id ?? "", [data.menus, schedules, clock]);
  const [viewMenuId, setViewMenuId] = useState<string | null>(null);
  const shownMenuId = viewMenuId ?? activeMenuId;
  const activeMenu = data.menus.find((m) => m.id === activeMenuId);
  const shownMenu = data.menus.find((m) => m.id === shownMenuId) ?? data.menus[0];
  const peeking = shownMenuId !== activeMenuId;
  const activeUntil = activeMenu?.schedules.find((s) => s.weekdays.includes(clock.weekday) && clock.time >= s.start_time && clock.time < s.end_time)?.end_time;

  // --- live sold-out ---
  const [live, setLive] = useState<Record<string, { is_sold_out: boolean; is_special: boolean }>>({});
  useEffect(() => {
    const ids = new Set(data.menus.flatMap((m) => m.categories.flatMap((c) => c.dishes.map((d) => d.id))));
    const ch = supabase.channel(`dishes-${r.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "dishes" }, (p) => {
        const row = p.new as { id: string; is_sold_out: boolean; is_special: boolean };
        if (ids.has(row.id)) setLive((s) => ({ ...s, [row.id]: { is_sold_out: row.is_sold_out, is_special: row.is_special } }));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [data.menus, r.id]);
  const isOut = useCallback((d: PublicDish) => live[d.id]?.is_sold_out ?? d.is_sold_out, [live]);
  const isSpecial = useCallback((d: PublicDish) => live[d.id]?.is_special ?? d.is_special, [live]);

  // --- filters ---
  const [veg, setVeg] = useState(false);
  const [spicy, setSpicy] = useState(false);
  const cats = useMemo(() => (shownMenu?.categories ?? [])
    .map((c) => ({ ...c, dishes: c.dishes.filter((d) => (!veg || d.is_veg) && (!spicy || d.is_spicy)) }))
    .filter((c) => c.dishes.length), [shownMenu, veg, spicy]);
  const emptyCopy = veg && spicy ? "Nothing veg and spicy here. Try one at a time." : spicy ? "Nothing spicy here. Brave choice, though." : veg ? "No veg dishes on this one. Sorry." : "This menu is empty for now.";

  // --- table + ordering ---
  const [tableLabel, setTableLabel] = useState<string | null>(null);
  const [tableChecked, setTableChecked] = useState(!table);
  useEffect(() => {
    if (!table) return;
    supabase.rpc("get_table_label", { p_branch_id: branchId, p_table: table }).then(({ data: label }) => {
      setTableLabel(label ?? null); setTableChecked(true);
    });
  }, [table, branchId]);
  const ordersOn = r.plan === "pro" || r.plan === "business";
  const canOrder = !!tableLabel && ordersOn && !peeking;
  const blockedReason = !table ? "Scan the code on your table to order." : !tableChecked ? "Finding your table…"
    : !tableLabel ? "We couldn't find that table. Ask the staff?" : !ordersOn ? "Order with the staff — they'll sort you out."
    : peeking ? `This is the ${shownMenu?.name} menu. Ordering's from ${activeMenu?.name} right now.` : "Sold out, sorry.";

  // --- events ---
  useEffect(() => { logScanOnce(branchId); }, [branchId]);

  // --- cart ---
  const [lines, setLines] = useState<CartLine[]>([]);
  const cartKey = `plated:cart:${r.slug}`;
  useEffect(() => { try { const s = sessionStorage.getItem(cartKey); if (s) setLines(JSON.parse(s)); } catch { /* ignore */ } }, [cartKey]);
  useEffect(() => { try { sessionStorage.setItem(cartKey, JSON.stringify(lines)); } catch { /* ignore */ } }, [lines, cartKey]);
  const bounce = useAnimationControls();
  const [openDish, setOpenDish] = useState<PublicDish | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  const openSheet = (d: PublicDish) => { setOpenDish(d); logEvent(branchId, "dish_view", d.id); };
  const add = (d: PublicDish, addonIds: string[], qty: number, note: string) => {
    setLines((ls) => addLine(ls, { dishId: d.id, name: d.name, basePrice: d.price, addons: d.addons.filter((a) => addonIds.includes(a.id)), qty, note }));
    logEvent(branchId, "add_to_cart", d.id);
    setOpenDish(null);
    setTimeout(() => bounce.start({ scale: [1, 1.08, 0.97, 1], transition: { duration: 0.45 } }), 60);
  };

  // --- placed order ---
  const orderKey = `plated:order:${r.slug}`;
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  useEffect(() => { try { const s = localStorage.getItem(orderKey); if (s) setOrder(JSON.parse(s)); } catch { /* ignore */ } }, [orderKey]);
  const { info, missing } = useOrderStatus(order);
  useEffect(() => { if (missing) { setOrder(null); try { localStorage.removeItem(orderKey); } catch { /* ignore */ } } }, [missing, orderKey]);

  const place = async (note: string) => {
    if (!table) return;
    setPlacing(true); setPlaceError(null);
    const { data: res, error } = await supabase.rpc("place_order", {
      p_branch_id: branchId, p_table: table, p_items: toOrderItems(lines), p_payment_method: "counter", ...(note ? { p_note: note } : {}),
    });
    setPlacing(false);
    const row = res?.[0];
    if (error || !row) return setPlaceError(error?.message ?? "That didn't go through. Try again?");
    const stored = { id: row.order_id, token: row.tracking_token };
    setOrder(stored);
    try { localStorage.setItem(orderKey, JSON.stringify(stored)); } catch { /* ignore */ }
    setLines([]); setCartOpen(false); setStatusOpen(true);
  };
  const newOrder = () => { setOrder(null); setStatusOpen(false); try { localStorage.removeItem(orderKey); } catch { /* ignore */ } };

  // --- service requests ---
  const [cooldown, setCooldown] = useState<Record<string, number>>({});
  const [, tick] = useState(0);
  useEffect(() => { try { setCooldown(JSON.parse(localStorage.getItem(`plated:svc:${r.slug}`) ?? "{}")); } catch { /* ignore */ } }, [r.slug]);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 5000); return () => clearInterval(t); }, []);
  const callService = async (type: "waiter" | "bill") => {
    if (!table) return;
    const until = Date.now() + COOLDOWN_MS;
    const next = { ...cooldown, [type]: until };
    setCooldown(next);
    try { localStorage.setItem(`plated:svc:${r.slug}`, JSON.stringify(next)); } catch { /* ignore */ }
    const { error } = await supabase.rpc("request_service", { p_branch_id: branchId, p_table: table, p_type: type });
    if (error && !error.message.includes("on its way")) { toast("Couldn't reach the staff. Give them a wave?"); setCooldown((c) => ({ ...c, [type]: 0 })); return; }
    toast(type === "waiter" ? "Someone's on their way." : "The bill's coming over.");
  };
  const cooling = (t: string) => (cooldown[t] ?? 0) > Date.now();

  // --- scroll spy + pill row auto-scroll ---
  const sections = useRef<Record<string, HTMLElement | null>>({});
  const pillRow = useRef<HTMLDivElement>(null);
  const [activeCat, setActiveCat] = useState(cats[0]?.id ?? "");
  const lock = useRef(0);
  useEffect(() => { setActiveCat(cats[0]?.id ?? ""); }, [cats]);
  useEffect(() => {
    const onScroll = () => {
      if (Date.now() < lock.current) return;
      let id = cats[0]?.id ?? "";
      for (const c of cats) { const el = sections.current[c.id]; if (el && el.getBoundingClientRect().top <= STICKY_H + 24) id = c.id; }
      setActiveCat(id);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [cats]);
  useEffect(() => {
    const row = pillRow.current;
    const btn = row?.querySelector<HTMLElement>(`[data-pill="${activeCat}"]`);
    if (row && btn) row.scrollTo({ left: btn.offsetLeft - row.clientWidth / 2 + btn.clientWidth / 2, behavior: "smooth" });
  }, [activeCat]);
  const jump = (id: string) => {
    setActiveCat(id);
    const el = sections.current[id];
    if (!el) return;
    lock.current = Date.now() + 700;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - STICKY_H - 8, behavior: "smooth" });
  };

  const theme = data.theme;
  const dark = theme?.mode === "dark";
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);
  const cover = theme?.cover_url ?? r.cover_url;
  const logo = theme?.logo_url ?? r.logo_url;
  const initials = r.name.split(/\s|&/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("&");
  const count = cartCount(lines);
  const firstDishId = cats[0]?.dishes[0]?.id;

  return (
    <div style={themeStyle(theme)} className={cn("min-h-dvh bg-background text-foreground", dark && "dark")}>
      <div className="relative mx-auto min-h-dvh max-w-md pb-40 sm:border-x sm:border-hairline">
        {/* Cover */}
        <header>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-mist">
            {cover && <img src={sized(cover, 900, 675)} srcSet={cover.includes("unsplash") ? `${sized(cover, 600, 450)} 600w, ${sized(cover, 900, 675)} 900w` : undefined} sizes="(max-width: 448px) 100vw, 448px"
              alt={`Inside ${r.name}`} fetchPriority="high" className="h-full w-full object-cover" />}
          </div>
          <div className="px-5">
            <div className="relative -mt-9">
              {logo ? <img src={sized(logo, 144, 144)} alt={`${r.name} logo`} className="h-[72px] w-[72px] rounded-full border-4 border-background object-cover" />
                : <div className="grid h-[72px] w-[72px] place-items-center rounded-full border-4 border-background bg-marigold font-display text-xl text-accent-foreground">{initials}</div>}
            </div>
            <h1 className="mt-3 text-[2.6rem] leading-[0.95]">{r.name}</h1>
            {r.description && <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">{r.description}</p>}
            <p className="mt-4 flex items-center gap-2 text-sm">
              <span className={cn("h-1.5 w-1.5 rounded-full", hours.open ? "bg-teal" : "bg-marigold")} />
              {hours.label}
              <span className="text-muted-foreground">· {data.branch.name}</span>
            </p>
          </div>
        </header>

        {/* Menu label + switcher + table note */}
        <div className="mt-6 border-t border-hairline px-5 pt-4 text-xs">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <p className="text-muted-foreground">
              <span className="text-foreground">{activeMenu?.name}</span>{activeUntil ? `, until ${activeUntil}` : ""}
            </p>
            {data.menus.length > 1 && (
              <div className="flex gap-3">
                {data.menus.map((m) => (
                  <button key={m.id} onClick={() => { setViewMenuId(m.id === activeMenuId ? null : m.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={cn("underline-offset-4", m.id === shownMenuId ? "text-foreground underline decoration-marigold" : "text-muted-foreground hover:text-foreground")}>
                    {m.id === activeMenuId ? "Now" : `Peek: ${m.name}`}
                  </button>
                ))}
              </div>
            )}
          </div>
          {peeking && <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-muted-foreground">You're peeking at {shownMenu?.name}{shownMenu?.schedules[0] ? ` (${shownMenu.schedules[0].start_time}–${shownMenu.schedules[0].end_time})` : ""}. Look, don't order.</p>}
          {!table && <p className="mt-3 text-muted-foreground">Just browsing? Scan the code on your table to order.</p>}
          {table && tableChecked && tableLabel && ordersOn && !peeking && <p className="mt-3 text-muted-foreground">Table {tableLabel}. Hungry? Start here.</p>}
          {table && tableChecked && !tableLabel && <p className="mt-3 text-alert">We couldn't find that table. Ask the staff?</p>}
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-2 px-5">
          {([["Veg", veg, setVeg], ["Spicy", spicy, setSpicy]] as const).map(([label, on, set]) => (
            <button key={label} aria-pressed={on} onClick={() => set(!on)}
              className={cn("rounded-full border px-3.5 py-1 text-xs transition-colors",
                on ? (label === "Veg" ? "border-teal bg-teal-ink text-paper" : "border-alert bg-alert text-paper") : "border-hairline text-muted-foreground hover:text-foreground")}>
              {label}
            </button>
          ))}
        </div>

        {/* Sticky category pills */}
        {cats.length > 0 && <nav className="sticky top-0 z-20 mt-3 border-b border-hairline bg-background/95 backdrop-blur-sm" style={{ height: STICKY_H }}>
          <div ref={pillRow} className="no-scrollbar flex h-full items-center overflow-x-auto px-3">
            {cats.length > 0 && (
              <PillGroup id="menu-pill" className="[&>button]:shrink-0" value={activeCat} onChange={jump}
                items={cats.map((c) => ({ value: c.id, label: c.name }))} />
            )}
          </div>
        </nav>}
        <PillDataAttrs row={pillRow} ids={cats.map((c) => c.id)} />

        {/* Dishes */}
        {cats.length === 0 ? (
          <div className="px-5 py-20">
            <p className="font-display text-3xl leading-tight">{emptyCopy}</p>
            {(veg || spicy) && <button onClick={() => { setVeg(false); setSpicy(false); }} className="mt-4 text-sm underline underline-offset-4">Show everything</button>}
          </div>
        ) : cats.map((c) => (
          <section key={c.id} ref={(el) => { sections.current[c.id] = el; }} className="px-5 pt-8" aria-labelledby={`cat-${c.id}`}>
            <h2 id={`cat-${c.id}`} className="eyebrow mb-4 font-sans">{c.name}</h2>
            <div className="space-y-9">
              {c.dishes.map((d) => {
                const out = isOut(d);
                return (
                  <button key={d.id} onClick={() => openSheet(d)} className="block w-full text-left" aria-label={`${d.name}, ${formatPrice(d.price, cur)}${out ? ", sold out" : ""}`}>
                    <div className="relative">
                      <DishImage url={d.photo_url} alt="" w={540} ratio={0.66} sizes="(max-width: 448px) 90vw, 408px" eager={d.id === firstDishId} dim={out} className="rounded-lg" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {out && <Tag kind="soldout">Sold out</Tag>}
                        {isSpecial(d) && !out && <Tag kind="soldout" className="border-marigold bg-marigold text-accent-foreground">Today's special</Tag>}
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-4">
                      <h3 className={cn("text-[1.45rem] leading-tight", out && "text-muted-foreground")}>{d.name}</h3>
                      <span className="shrink-0 text-[15px] tabular-nums">{formatPrice(d.price, cur)}</span>
                    </div>
                    {d.short_description && <p className="mt-1 text-sm leading-snug text-muted-foreground">{d.short_description}</p>}
                    {(d.is_veg || d.is_spicy) && (
                      <div className="mt-2 flex gap-1.5">
                        {d.is_veg && <Tag kind="veg">veg</Tag>}
                        {d.is_spicy && <Tag kind="spicy">spicy</Tag>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        <p className="px-5 pt-14 text-center text-[11px] text-muted-foreground">Menu by Plated</p>
      </div>

      {/* Floating actions */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {tableLabel && (
          <div className="pointer-events-auto mb-3 flex justify-end gap-2">
            <ServiceButton label="Call waiter" busyLabel="On their way" cooling={cooling("waiter")} onClick={() => callService("waiter")} />
            <ServiceButton label="Ask for the bill" busyLabel="Bill's coming" cooling={cooling("bill")} onClick={() => callService("bill")} />
          </div>
        )}
        <AnimatePresence>
          {order && !statusOpen && count === 0 && (
            <motion.button key="order" initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ type: "spring", stiffness: 400, damping: 32 }}
              onClick={() => setStatusOpen(true)} className="pointer-events-auto flex w-full items-center justify-between rounded-lg border border-ink bg-background px-4 py-3.5 text-sm">
              <span>Your order · <span className="capitalize">{info?.status ?? "…"}</span></span><span className="underline underline-offset-4">Track</span>
            </motion.button>
          )}
          {canOrder && count > 0 && (
            <motion.div key="cart" initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ type: "spring", stiffness: 400, damping: 32 }} className="pointer-events-auto">
              <motion.button animate={bounce} onClick={() => setCartOpen(true)} className="flex w-full items-center justify-between rounded-lg bg-ink px-4 py-3.5 text-sm text-paper">
                <span className="flex items-center gap-2.5"><span className="grid h-6 min-w-6 place-items-center rounded-full bg-marigold px-1.5 text-xs font-semibold text-accent-foreground tabular-nums">{count}</span>item{count > 1 ? "s" : ""} · <span className="tabular-nums">{formatPrice(cartTotal(lines), cur)}</span></span>
                <span className="underline underline-offset-4">View order</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DishSheet dish={openDish ? { ...openDish, is_special: isSpecial(openDish) } : openDish} currency={cur} canOrder={canOrder && !!openDish && !isOut(openDish)}
        blockedReason={openDish && isOut(openDish) ? "Sold out for today. Sorry!" : blockedReason}
        onClose={() => setOpenDish(null)} onAdd={add} />
      {tableLabel && (
        <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} lines={lines} currency={cur} tableLabel={tableLabel}
          onQty={(k, q) => setLines((ls) => setQty(ls, k, q))}
          onNote={(k, n) => setLines((ls) => ls.map((l) => (l.key === k ? { ...l, note: n } : l)))}
          onPlace={(n) => place(n)} placing={placing} error={placeError} />
      )}
      {order && <OrderStatusSheet open={statusOpen} onClose={() => setStatusOpen(false)} order={order} info={info} currency={cur} onNewOrder={newOrder} />}
    </div>
  );
}

/** Tag pill buttons with their category id so the row can scroll the active one into view. */
function PillDataAttrs({ row, ids }: { row: React.RefObject<HTMLDivElement | null>; ids: string[] }) {
  useEffect(() => {
    row.current?.querySelectorAll("button").forEach((b, i) => { if (ids[i]) b.setAttribute("data-pill", ids[i]!); });
  });
  return null;
}

function ServiceButton({ label, busyLabel, cooling, onClick }: { label: string; busyLabel: string; cooling: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={cooling}
      className={cn("rounded-full border border-hairline bg-background/95 px-3.5 py-2 text-xs backdrop-blur-sm transition-colors",
        cooling ? "text-muted-foreground" : "text-foreground hover:border-ink")}>
      {cooling ? busyLabel : label}
    </button>
  );
}
