import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Divider, PillGroup, SectionHeading, Tag, Toggle } from "@/components/thaal/primitives";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/TruckArt";

type Status = "new" | "cooking" | "ready";
const ORDERS: { id: number; table: number; items: string; mins: number; status: Status }[] = [
  { id: 41, table: 7, items: "2× Flat white, Ricotta hotcakes", mins: 1, status: "new" },
  { id: 40, table: 3, items: "Eggs on rye, Iced yuzu soda", mins: 6, status: "cooking" },
  { id: 39, table: 12, items: "Green grain bowl, Market salad", mins: 9, status: "cooking" },
  { id: 38, table: 5, items: "Lemon & rye loaf (to go)", mins: 14, status: "ready" },
];

const ACCENTS = [
  { k: "marigold", cls: "bg-marigold", text: "text-highlight" },
  { k: "teal", cls: "bg-teal", text: "text-teal-ink" },
  { k: "ink", cls: "bg-ink", text: "text-foreground" },
] as const;

export function OwnerSide() {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [accent, setAccent] = useState<(typeof ACCENTS)[number]>(ACCENTS[0]);
  const [serif, setSerif] = useState(true);
  const [photos, setPhotos] = useState(true);
  const shown = ORDERS.filter((o) => filter === "all" || o.status === filter);

  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-36">
      <div className="grid gap-10 md:grid-cols-12">
        <Reveal className="md:col-span-5"><SectionHeading eyebrow="For owners and kitchen staff" title={<>See every order as it <em>happens.</em></>}>
          New orders pop up on any phone, tablet or laptop in your kitchen. Waiter calls and bill requests show up too, so no table gets forgotten.
        </SectionHeading></Reveal>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-12">
        {/* Kitchen view */}
        <Reveal className="rounded-xl border border-hairline bg-card p-5 md:col-span-7 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-marigold opacity-60" /><span className="relative h-2 w-2 rounded-full bg-marigold" /></span>
              Live orders
            </div>
            <PillGroup id="orders-pill" size="sm" value={filter} onChange={setFilter}
              items={[{ value: "all", label: "All" }, { value: "new", label: "New" }, { value: "cooking", label: "Cooking" }, { value: "ready", label: "Ready" }]} />
          </div>
          <Divider className="my-4" />
          <ul className="min-h-[260px]">
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((o) => (
                <motion.li key={o.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 border-b border-hairline py-4 last:border-0">
                  <div><p className="font-display text-3xl leading-none">{o.table}</p><p className="eyebrow mt-1">Table</p></div>
                  <div className="min-w-0"><p className="truncate text-sm">{o.items}</p><p className="text-xs text-muted-foreground">#{o.id} · {o.mins} min ago</p></div>
                  <Tag kind={o.status === "new" ? "spicy" : o.status === "ready" ? "veg" : "neutral"}>{o.status}</Tag>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        {/* Theme customiser */}
        <Reveal delay={0.1} className="grid gap-5 rounded-xl border border-hairline bg-secondary/60 p-5 md:col-span-5 md:p-7">
          <p className="text-sm">Make it yours</p>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Accent</span>
              <div className="flex gap-2">{ACCENTS.map((a) => (
                <button key={a.k} aria-label={a.k} onClick={() => setAccent(a)} className={cn("h-7 w-7 rounded-full ring-offset-2 ring-offset-secondary transition", a.cls, accent.k === a.k && "ring-1 ring-ink")} />
              ))}</div>
            </div>
            <Divider />
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Serif headings</span><Toggle checked={serif} onChange={setSerif} label="Serif headings" /></div>
            <Divider />
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Show dish photos</span><Toggle checked={photos} onChange={setPhotos} label="Dish photos" /></div>
          </div>
          <div className="rounded-lg bg-background p-4">
            <div className="flex items-baseline justify-between">
              <p className={cn("text-lg", serif ? "font-display" : "font-sans font-medium")}>Brioche French toast</p>
              <span className={cn("text-sm", accent.text)}>£12.50</span>
            </div>
            <AnimatePresence initial={false}>
              {photos && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=500&h=220&fit=crop&q=70&auto=format" alt="" loading="lazy" className="mt-3 aspect-[5/2] w-full rounded-md object-cover" />
                </motion.div>
              )}
            </AnimatePresence>
            <div className={cn("mt-3 inline-block rounded-md px-3 py-1.5 text-xs text-paper", accent.cls)}>Add to order</div>
          </div>
        </div>
      </div>
    </section>
  );
}
