import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PillGroup, Toggle } from "@/components/plated/primitives";
import { useBranch } from "@/components/dashboard/BranchContext";
import { ServiceFeed, Ticket, useLiveOps, useNow } from "@/components/dashboard/LiveOps";
import { BOARD, nextStatus, unlockChime, type Order } from "@/lib/dashboard/orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  head: () => ({ meta: [
    { title: "Live orders — Plated" }, { name: "description", content: "Your kitchen board: new, preparing and served orders in real time." },
    { property: "og:title", content: "Live orders — Plated" }, { property: "og:description", content: "Your kitchen board in real time." },
  ] }),
  component: OrdersPage,
});

type Tab = "new" | "preparing" | "served" | "requests";

function OrdersPage() {
  const { restaurant } = Route.useRouteContext();
  const { branch } = useBranch();
  const branchId = branch?.id ?? "";
  const [chime, setChime] = useState(false);
  const [kitchen, setKitchen] = useState(false);
  const [tab, setTab] = useState<Tab>("new");
  const now = useNow();
  const { orders, loading, requests, fresh, updateOrder, resolveRequest } = useLiveOps(branchId, { chime });

  useEffect(() => { setChime(localStorage.getItem("plated.chime") === "1"); }, []);
  const toggleChime = (v: boolean) => { if (v) unlockChime(); setChime(v); localStorage.setItem("plated.chime", v ? "1" : "0"); };

  useEffect(() => {
    if (!kitchen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setKitchen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [kitchen]);

  const openKitchen = () => {
    setKitchen(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const closeKitchen = () => {
    setKitchen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };

  const col = (s: Order["status"]) => {
    const list = orders.filter((o) => o.status === s);
    return s === "served" ? list.reverse().slice(0, 20) : list;
  };
  const openReq = requests.filter((r) => r.status === "open").length;
  const actions = (o: Order) => ({
    onAdvance: () => { const n = nextStatus(o.status); if (n) updateOrder.mutate({ id: o.id, patch: { status: n } }); },
    onCancel: () => updateOrder.mutate({ id: o.id, patch: { status: "cancelled" } }),
    onPaid: () => updateOrder.mutate({ id: o.id, patch: { payment_status: "paid" } }),
  });

  const column = (s: Order["status"], big = false) => (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {col(s).map((o) => (
          <Ticket key={o.id} order={o} currency={restaurant.currency} now={now} fresh={fresh.has(o.id)} big={big} {...actions(o)} />
        ))}
      </AnimatePresence>
      {!loading && col(s).length === 0 && (
        <p className="py-6 text-sm text-muted-foreground">
          {s === "new" ? "Nothing new. Kettle on?" : s === "preparing" ? "Nothing on the pass." : "Nothing served yet today."}
        </p>
      )}
    </div>
  );

  const controls = (
    <div className="flex items-center gap-5 text-sm">
      <label className="flex items-center gap-2 text-muted-foreground">
        <Toggle checked={chime} onChange={toggleChime} label="Soft chime for new orders" />
        <span>Chime</span>
      </label>
      {!kitchen && <button type="button" onClick={openKitchen} className="underline underline-offset-4 hover:text-highlight">Kitchen mode</button>}
    </div>
  );

  if (kitchen) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-background">
        <header className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <p className="font-display text-3xl">{branch?.name ?? restaurant.name} <span className="text-muted-foreground">· Kitchen</span></p>
          <div className="flex items-center gap-6">{controls}
            <button type="button" onClick={closeKitchen} className="rounded-md border border-hairline px-4 py-2 text-sm">Exit</button>
          </div>
        </header>
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_1fr_340px] divide-x divide-hairline max-lg:grid-cols-2">
          {(["new", "preparing"] as const).map((s) => (
            <section key={s} className="min-h-0 overflow-y-auto p-5">
              <h2 className="mb-4 font-display text-2xl">{s === "new" ? "New" : "Preparing"} <span className="text-muted-foreground">{col(s).length}</span></h2>
              {column(s, true)}
            </section>
          ))}
          <section className="min-h-0 overflow-y-auto p-5 max-lg:col-span-2 max-lg:border-t max-lg:border-hairline">
            <h2 className="mb-4 font-display text-2xl">Tables <span className={cn(openReq ? "text-highlight" : "text-muted-foreground")}>{openReq}</span></h2>
            <ServiceFeed requests={requests} now={now} fresh={fresh} onDone={(id) => resolveRequest.mutate(id)} big />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Orders{branch ? ` · ${branch.name}` : ""}</p>
          <h1 className="mt-3 text-5xl md:text-6xl">On the pass.</h1>
        </div>
        {controls}
      </div>

      {/* Mobile: tabs */}
      <div className="mt-8 lg:hidden">
        <div className="-mx-5 overflow-x-auto px-5">
          <PillGroup<Tab> id="orders-tab" size="sm" value={tab} onChange={setTab} items={[
            ...BOARD.map((b) => ({ value: b.status as Tab, label: `${b.label} ${col(b.status).length}` })),
            { value: "requests", label: `Tables ${openReq}` },
          ]} />
        </div>
        <div className="mt-5">
          {tab === "requests"
            ? <ServiceFeed requests={requests} now={now} fresh={fresh} onDone={(id) => resolveRequest.mutate(id)} />
            : column(tab)}
        </div>
      </div>

      {/* Desktop: board + feed */}
      <div className="mt-10 hidden gap-6 lg:grid lg:grid-cols-[1fr_1fr_1fr_280px]">
        {BOARD.map((b) => (
          <section key={b.status}>
            <h2 className="mb-4 flex items-baseline gap-2 border-b border-hairline pb-3 text-2xl">
              {b.label} <span className="font-sans text-sm text-muted-foreground">{col(b.status).length}</span>
            </h2>
            {column(b.status)}
          </section>
        ))}
        <section className="border-l border-hairline pl-6">
          <h2 className="mb-4 flex items-baseline gap-2 border-b border-hairline pb-3 text-2xl">
            Tables <span className={cn("font-sans text-sm", openReq ? "text-highlight" : "text-muted-foreground")}>{openReq} waiting</span>
          </h2>
          <ServiceFeed requests={requests} now={now} fresh={fresh} onDone={(id) => resolveRequest.mutate(id)} />
        </section>
      </div>
    </div>
  );
}
