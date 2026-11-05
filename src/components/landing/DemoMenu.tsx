import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { BottomSheet, Button, PillGroup, Tag } from "@/components/plated/primitives";
import { img } from "@/lib/unsplash";

type Dish = { id: string; name: string; desc: string; price: number; photo: string; tags?: ("veg" | "spicy")[]; soldOut?: boolean };
type Cat = "breakfast" | "plates" | "bakery" | "drinks";

const MENU: { id: Cat; label: string; dishes: Dish[] }[] = [
  { id: "breakfast", label: "Breakfast", dishes: [
    { id: "a", name: "Brioche French toast", desc: "Burnt honey, crème fraîche, roasted plums.", price: 12.5, photo: "1484723091739-30a097e8f929", tags: ["veg"] },
    { id: "b", name: "Ricotta hotcakes", desc: "Blueberries, lemon curd, maple.", price: 13, photo: "1567620905732-2d1ec7ab7445", tags: ["veg"] },
    { id: "c", name: "Eggs on rye", desc: "Soft eggs, avocado, chilli crisp, house rye.", price: 11, photo: "1525351484163-7529414344d8", tags: ["spicy"] },
  ]},
  { id: "plates", label: "Plates", dishes: [
    { id: "d", name: "Green grain bowl", desc: "Farro, charred greens, tahini, pickled shallot.", price: 14, photo: "1512621776951-a57141f2eefd", tags: ["veg"] },
    { id: "e", name: "Nduja rigatoni", desc: "Slow tomato, nduja, pecorino. Gone by 1pm.", price: 16, photo: "1473093295043-cdd812d0e601", tags: ["spicy"], soldOut: true },
    { id: "f", name: "Market salad", desc: "Whatever looked best this morning.", price: 12, photo: "1540189549336-e6e99c3679fe", tags: ["veg"] },
  ]},
  { id: "bakery", label: "Bakery", dishes: [
    { id: "g", name: "Lemon & rye loaf", desc: "Our namesake. Sour, a little sweet.", price: 6, photo: "1509440159596-0249088772ff", tags: ["veg"] },
  ]},
  { id: "drinks", label: "Drinks", dishes: [
    { id: "h", name: "Flat white", desc: "Seasonal espresso, whole or oat.", price: 4, photo: "1495474472287-4d71bcdd2085" },
    { id: "i", name: "Iced yuzu soda", desc: "Yuzu, soda, a sprig of thyme.", price: 5, photo: "1556679343-c7306c1976bc", tags: ["veg"] },
  ]},
];

const fmt = (n: number) => `£${n.toFixed(2).replace(/\.00$/, "")}`;

export function DemoMenu() {
  const scroller = useRef<HTMLDivElement>(null);
  const sections = useRef<Record<string, HTMLElement | null>>({});
  const [active, setActive] = useState<Cat>("breakfast");
  const [cart, setCart] = useState(0);
  const [open, setOpen] = useState<Dish | null>(null);
  const cartCtl = useAnimationControls();
  const lock = useRef(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      if (lock.current) return;
      const top = el.scrollTop + 90;
      let cur: Cat = MENU[0].id;
      for (const c of MENU) { const s = sections.current[c.id]; if (s && s.offsetTop <= top) cur = c.id; }
      setActive(cur);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const jump = (c: Cat) => {
    setActive(c);
    const s = sections.current[c];
    if (!s || !scroller.current) return;
    lock.current = true;
    scroller.current.scrollTo({ top: s.offsetTop - 52, behavior: "smooth" });
    setTimeout(() => (lock.current = false), 600);
  };

  const add = () => {
    setCart((n) => n + 1);
    cartCtl.start({ scale: [1, 1.18, 0.96, 1], transition: { duration: 0.42 } });
  };

  return (
    <div className="relative h-full overflow-hidden bg-background text-foreground">
      <div ref={scroller} className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-24">
        <div className="relative h-36">
          <img src={img("1555396273-367ea4eb4db5", 600, 300)} alt="Inside Lemon & Rye" loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="px-4">
          <div className="-mt-7 flex items-end gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-full border-4 border-background bg-terracotta font-display text-lg text-accent-foreground">L&R</div>
          </div>
          <h3 className="mt-2 text-2xl">Lemon &amp; Rye</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Bakery &amp; kitchen · Open today 8:00–16:00</p>
        </div>

        <div className="sticky top-0 z-10 mt-4 border-b border-hairline bg-background/95 px-3 py-2.5 backdrop-blur-sm">
          <PillGroup id="demo-pill" size="sm" className="no-scrollbar overflow-x-auto" items={MENU.map((c) => ({ value: c.id, label: c.label }))} value={active} onChange={jump} />
        </div>

        {MENU.map((c) => (
          <section key={c.id} ref={(el) => { sections.current[c.id] = el; }} className="px-4 pt-5">
            <p className="eyebrow mb-3">{c.label}</p>
            <div className="space-y-5">
              {c.dishes.map((d) => (
                <button key={d.id} onClick={() => !d.soldOut && setOpen(d)} className={`block w-full text-left ${d.soldOut ? "cursor-not-allowed" : ""}`}>
                  <div className="relative overflow-hidden rounded-lg">
                    <img src={img(d.photo, 520, 320)} alt={d.name} loading="lazy" className={`aspect-[16/10] w-full object-cover ${d.soldOut ? "grayscale opacity-60" : ""}`} />
                    {d.soldOut && <Tag kind="soldout" className="absolute top-2 left-2">Sold out</Tag>}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-3">
                    <h4 className="font-display text-[17px] leading-tight">{d.name}</h4>
                    <span className="text-sm tabular-nums">{fmt(d.price)}</span>
                  </div>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{d.desc}</p>
                  {d.tags && <div className="mt-1.5 flex gap-1">{d.tags.map((t) => <Tag key={t} kind={t}>{t}</Tag>)}</div>}
                </button>
              ))}
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
            <img src={img(open.photo, 520, 300)} alt={open.name} className="aspect-[16/9] w-full rounded-lg object-cover" />
            <div className="mt-3 flex items-baseline justify-between">
              <h4 className="font-display text-xl">{open.name}</h4>
              <span className="text-sm">{fmt(open.price)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{open.desc}</p>
            <Button variant="accent" className="mt-4 w-full" onClick={() => { add(); setOpen(null); }}>Add to order · {fmt(open.price)}</Button>
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
        <div className="absolute top-2 left-1/2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-ink" />
        {children}
      </div>
    </div>
  );
}
