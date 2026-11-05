import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  advanceLabel, canMarkPaid, fetchLiveOrders, fetchRequests, nextStatus, ordersKey, playChime, requestsKey, timeAgo,
  type Order, type OrderStatus, type ServiceRequest,
} from "@/lib/dashboard/orders";
import { formatPrice } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

export function useNow(ms = 20_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

/** Orders + service requests for a branch, kept live via realtime. Returns ids that arrived since mount (for highlight). */
export function useLiveOps(branchId: string, opts: { chime?: boolean } = {}) {
  const qc = useQueryClient();
  const chimeRef = useRef(opts.chime);
  chimeRef.current = opts.chime;
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const orders = useQuery({ queryKey: ordersKey(branchId), queryFn: () => fetchLiveOrders(branchId), enabled: !!branchId, refetchInterval: 60_000 });
  const requests = useQuery({ queryKey: requestsKey(branchId), queryFn: () => fetchRequests(branchId), enabled: !!branchId, refetchInterval: 60_000 });

  useEffect(() => {
    if (!branchId) return;
    const mark = (id: string) => {
      setFresh((s) => new Set(s).add(id));
      setTimeout(() => setFresh((s) => { const n = new Set(s); n.delete(id); return n; }), 6000);
      if (chimeRef.current) playChime();
    };
    const ch = supabase.channel(`ops-${branchId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `branch_id=eq.${branchId}` }, (p) => {
        if (p.eventType === "INSERT") mark((p.new as { id: string }).id);
        // order_items are written in the same transaction; a short delay lets them land before we refetch.
        setTimeout(() => qc.invalidateQueries({ queryKey: ordersKey(branchId) }), p.eventType === "INSERT" ? 400 : 0);
        qc.invalidateQueries({ queryKey: ["overview", branchId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `branch_id=eq.${branchId}` }, (p) => {
        if (p.eventType === "INSERT") mark((p.new as { id: string }).id);
        qc.invalidateQueries({ queryKey: requestsKey(branchId) });
        qc.invalidateQueries({ queryKey: ["overview", branchId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [branchId, qc]);

  const updateOrder = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<Order, "status" | "payment_status">> }) => {
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ordersKey(branchId) });
      const prev = qc.getQueryData<Order[]>(ordersKey(branchId));
      qc.setQueryData<Order[]>(ordersKey(branchId), (os) =>
        (os ?? []).map((o) => (o.id === id ? { ...o, ...patch } : o)).filter((o) => o.status !== "cancelled"));
      return { prev };
    },
    onError: (_e, _v, c) => { qc.setQueryData(ordersKey(branchId), c?.prev); toast.error("Couldn't update that order. Try again."); },
    onSettled: () => qc.invalidateQueries({ queryKey: ordersKey(branchId) }),
  });

  const resolveRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_requests").update({ status: "done" }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      const prev = qc.getQueryData<ServiceRequest[]>(requestsKey(branchId));
      qc.setQueryData<ServiceRequest[]>(requestsKey(branchId), (rs) => (rs ?? []).map((r) => (r.id === id ? { ...r, status: "done" } : r)));
      return { prev };
    },
    onError: (_e, _v, c) => { qc.setQueryData(requestsKey(branchId), c?.prev); toast.error("Couldn't clear that request."); },
    onSettled: () => qc.invalidateQueries({ queryKey: requestsKey(branchId) }),
  });

  return { orders: orders.data ?? [], loading: orders.isLoading, requests: requests.data ?? [], fresh, updateOrder, resolveRequest };
}

export function Ticket({ order, currency, now, fresh, big, onAdvance, onCancel, onPaid }: {
  order: Order; currency: string; now: number; fresh: boolean; big?: boolean;
  onAdvance: () => void; onCancel: () => void; onPaid: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const next = nextStatus(order.status);
  const mins = (now - new Date(order.created_at).getTime()) / 60000;
  const late = order.status !== "served" && mins >= 15;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className={cn("rounded-lg border bg-card transition-colors duration-1000", fresh ? "border-marigold bg-marigold/10" : "border-hairline", big ? "p-5" : "p-4")}
      aria-label={`Order for ${order.table_label ? `table ${order.table_label}` : "counter"}`}
    >
      <header className="flex items-baseline justify-between gap-3">
        <h3 className={cn("font-display leading-none", big ? "text-4xl" : "text-2xl")}>
          {order.table_label ? `Table ${order.table_label}` : "Counter"}
        </h3>
        <span className={cn("tabular-nums", big ? "text-base" : "text-xs", late ? "text-alert" : "text-muted-foreground")}>
          {timeAgo(order.created_at, now)}
        </span>
      </header>
      <ul className={cn("mt-3 space-y-2", big ? "text-xl" : "text-sm")}>
        {order.order_items.map((it) => (
          <li key={it.id}>
            <p><span className="font-medium tabular-nums">{it.qty}×</span> {it.name}</p>
            {it.addons?.length > 0 && <p className={cn("pl-6 text-muted-foreground", big ? "text-base" : "text-xs")}>+ {it.addons.map((a) => a.name).join(", ")}</p>}
            {it.note && <p className={cn("pl-6 italic text-highlight", big ? "text-base" : "text-xs")}>“{it.note}”</p>}
          </li>
        ))}
      </ul>
      {order.customer_note && (
        <p className={cn("mt-3 border-l-2 border-marigold pl-3", big ? "text-base" : "text-xs")}>{order.customer_note}</p>
      )}
      <div className={cn("mt-4 flex items-center justify-between border-t border-hairline pt-3", big ? "text-base" : "text-xs")}>
        <span className="font-medium tabular-nums">{formatPrice(Number(order.total), currency)}</span>
        <span className={cn(order.payment_status === "paid" ? "text-teal" : "text-muted-foreground")}>
          {order.payment_method === "counter" ? "Counter" : "Online"} · {order.payment_status === "paid" ? "Paid" : "Unpaid"}
        </span>
      </div>
      {next && (
        <button type="button" onClick={onAdvance}
          className={cn("mt-4 w-full rounded-md font-medium transition-transform active:scale-[0.98]",
            order.status === "new" ? "bg-marigold text-paper" : "bg-ink text-paper", big ? "h-16 text-xl" : "h-12 text-sm")}>
          {advanceLabel(order.status)}
        </button>
      )}
      <div className={cn("mt-2 flex items-center justify-between", big ? "text-sm" : "text-xs")}>
        {canMarkPaid(order) ? (
          <button type="button" onClick={onPaid} className="py-2 underline underline-offset-4 hover:text-highlight">Mark paid</button>
        ) : <span />}
        {order.status !== "served" && (confirm ? (
          <span className="flex gap-3">
            <button type="button" onClick={() => setConfirm(false)} className="py-2 text-muted-foreground">Keep</button>
            <button type="button" onClick={onCancel} className="py-2 font-medium text-alert">Yes, cancel</button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className="py-2 text-muted-foreground hover:text-foreground">Cancel order</button>
        ))}
      </div>
    </motion.article>
  );
}

export function ServiceFeed({ requests, now, fresh, onDone, big }: {
  requests: ServiceRequest[]; now: number; fresh: Set<string>; onDone: (id: string) => void; big?: boolean;
}) {
  const open = requests.filter((r) => r.status === "open");
  const done = requests.filter((r) => r.status === "done").slice(0, 6);
  return (
    <div>
      {open.length === 0 && <p className="py-4 text-sm text-muted-foreground">No one's waving. All good.</p>}
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {open.map((r) => (
            <motion.li key={r.id} layout initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
              className={cn("flex items-center gap-3 rounded-lg border-l-4 border-marigold p-3", fresh.has(r.id) ? "bg-marigold/20" : "bg-marigold/10")}>
              <div className="min-w-0 flex-1">
                <p className={cn("font-display leading-tight", big ? "text-2xl" : "text-lg")}>
                  {r.tables?.label ? `Table ${r.tables.label}` : "A table"}
                </p>
                <p className={cn("text-highlight", big ? "text-base" : "text-xs")}>
                  {r.type === "bill" ? "Wants the bill" : "Calling a waiter"} · {timeAgo(r.created_at, now)}
                </p>
              </div>
              <button type="button" onClick={() => onDone(r.id)}
                className={cn("shrink-0 rounded-md bg-ink px-4 font-medium text-paper active:scale-95", big ? "h-12 text-base" : "h-9 text-xs")}>Done</button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {done.length > 0 && (
        <>
          <p className="mt-6 text-xs text-muted-foreground">Recently handled</p>
          <ul className="mt-2">
            {done.map((r) => (
              <li key={r.id} className="flex justify-between border-t border-hairline py-2 text-xs text-muted-foreground">
                <span>{r.tables?.label ? `Table ${r.tables.label}` : "A table"} · {r.type === "bill" ? "Bill" : "Waiter"}</span>
                <span>{timeAgo(r.created_at, now)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export type { OrderStatus };
