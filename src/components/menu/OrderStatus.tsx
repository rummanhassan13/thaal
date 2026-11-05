import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BottomSheet, Button, Divider } from "@/components/plated/primitives";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

export type StoredOrder = { id: string; token: string };
type Status = "new" | "preparing" | "served" | "cancelled";
type OrderInfo = { status: Status; total: number; table_label: string | null; items: { dish_id: string | null; name: string; qty: number }[] };

const STEPS: { key: Status; label: string; copy: string }[] = [
  { key: "new", label: "New", copy: "The kitchen has your order." },
  { key: "preparing", label: "Preparing", copy: "Pans on. Won't be long." },
  { key: "served", label: "Served", copy: "Enjoy. Tell us how it was?" },
];

/** Live order status via the private tracking token: broadcast doorbell + gentle polling fallback. */
export function useOrderStatus(order: StoredOrder | null) {
  const [info, setInfo] = useState<OrderInfo | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!order) { setInfo(null); return; }
    let alive = true;
    const load = async () => {
      const { data } = await supabase.rpc("get_order_status", { p_order_id: order.id, p_token: order.token });
      if (!alive) return;
      const row = data?.[0];
      if (!row) { setMissing(true); return; }
      setInfo({ status: row.status, total: Number(row.total), table_label: row.table_label, items: (row.items as OrderInfo["items"]) ?? [] });
    };
    void load();
    const ch = supabase.channel(`order-${order.token}`, { config: { private: false } })
      .on("broadcast", { event: "status" }, () => void load())
      .subscribe();
    const poll = setInterval(load, 20000);
    return () => { alive = false; clearInterval(poll); supabase.removeChannel(ch); };
  }, [order]);
  return { info, missing };
}

export function OrderStatusSheet({ open, onClose, order, info, currency, onNewOrder }: {
  open: boolean; onClose: () => void; order: StoredOrder; info: OrderInfo | null; currency: string; onNewOrder: () => void;
}) {
  const idx = info ? STEPS.findIndex((s) => s.key === info.status) : 0;
  return (
    <BottomSheet open={open} onClose={onClose} label="Your order status">
      <p className="eyebrow">Order {info?.table_label ? `· Table ${info.table_label}` : ""}</p>
      {info?.status === "cancelled" ? (
        <h2 className="mt-2 text-3xl">This one was cancelled.</h2>
      ) : (
        <h2 className="mt-2 text-3xl">{STEPS[Math.max(0, idx)]?.copy ?? "Sending…"}</h2>
      )}

      {info && info.status !== "cancelled" && (
        <ol className="mt-6 grid grid-cols-3 gap-2">
          {STEPS.map((s, i) => (
            <li key={s.key}>
              <div className="relative h-1 overflow-hidden rounded-full bg-mist">
                {i <= idx && <motion.div className="absolute inset-0 bg-marigold"
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ originX: 0 }} transition={{ type: "spring", stiffness: 160, damping: 24 }} />}
              </div>
              <p className={cn("mt-2 text-xs", i <= idx ? "text-foreground" : "text-muted-foreground")}>{s.label}</p>
            </li>
          ))}
        </ol>
      )}

      {info && (
        <>
          <ul className="mt-6 space-y-1 text-sm">
            {info.items.map((it, i) => <li key={i} className="flex justify-between"><span>{it.qty} × {it.name}</span></li>)}
          </ul>
          <div className="mt-3 flex justify-between border-t border-hairline pt-3 text-sm">
            <span className="text-muted-foreground">Total · pay at the counter</span><span className="tabular-nums">{formatPrice(info.total, currency)}</span>
          </div>
          {info.status !== "cancelled" && (
            <>
              <Divider className="my-6" />
              <p className="eyebrow mb-1">Rate your food</p>
              <p className="mb-3 text-xs text-muted-foreground">{info.status === "served" ? "Takes ten seconds. The kitchen reads every one." : "You can rate now, or once it lands."}</p>
              <div className="divide-y divide-hairline">
                {dedupe(info.items).map((it) => <ReviewRow key={it.dish_id} order={order} dishId={it.dish_id!} name={it.name} />)}
              </div>
            </>
          )}
        </>
      )}
      <div className="mt-8 flex items-center justify-between gap-4">
        <Button variant="link" onClick={onNewOrder}>Start a new order</Button>
        <Button variant="ink" onClick={onClose}>Back to the menu</Button>
      </div>
    </BottomSheet>
  );
}

function dedupe(items: OrderInfo["items"]) {
  const seen = new Set<string>();
  return items.filter((i) => i.dish_id && !seen.has(i.dish_id) && (seen.add(i.dish_id), true));
}

function ReviewRow({ order, dishId, name }: { order: StoredOrder; dishId: string; name: string }) {
  const key = `plated:review:${order.id}:${dishId}`;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { try { if (localStorage.getItem(key)) setDone(true); } catch { /* ignore */ } }, [key]);

  const send = async () => {
    setBusy(true); setErr(null);
    const args = { p_order_id: order.id, p_token: order.token, p_dish_id: dishId, p_rating: rating, ...(comment.trim() ? { p_comment: comment.trim() } : {}) };
    const { error } = await supabase.rpc("submit_review", args);
    setBusy(false);
    if (error) return setErr("Couldn't send that. Try again?");
    setDone(true);
    try { localStorage.setItem(key, "1"); } catch { /* ignore */ }
  };

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-base">{name}</span>
        {done ? <span className="text-xs text-teal-ink">Thanks!</span> : (
          <div className="flex" role="radiogroup" aria-label={`Rate ${name}`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} role="radio" aria-checked={rating === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setRating(i)}
                className={cn("px-0.5 text-xl transition-transform active:scale-90", i <= rating ? "text-highlight" : "text-mist-deep")}>★</button>
            ))}
          </div>
        )}
      </div>
      {!done && rating > 0 && (
        <div className="mt-2 flex gap-2">
          <input value={comment} onChange={(e) => setComment(e.target.value.slice(0, 300))} placeholder="Anything to add? (optional)"
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-card px-2.5 text-xs focus:border-ink focus:outline-none" />
          <Button size="sm" variant="ink" disabled={busy} onClick={send}>Send</Button>
        </div>
      )}
      {err && <p className="mt-1 text-xs text-alert">{err}</p>}
    </div>
  );
}
