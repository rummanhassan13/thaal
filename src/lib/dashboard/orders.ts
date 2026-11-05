import { supabase } from "@/integrations/supabase/client";

export type OrderStatus = "new" | "preparing" | "served" | "cancelled";
export type OrderItem = { id: string; name: string; qty: number; unit_price: number; note: string | null; addons: { name: string }[] };
export type Order = {
  id: string; table_label: string | null; status: OrderStatus; payment_method: "online" | "counter";
  payment_status: "unpaid" | "paid"; total: number; customer_note: string | null; created_at: string; order_items: OrderItem[];
};
export type ServiceRequest = { id: string; type: "waiter" | "bill"; status: "open" | "done"; created_at: string; tables: { label: string } | null };

export const BOARD: { status: Exclude<OrderStatus, "cancelled">; label: string }[] = [
  { status: "new", label: "New" }, { status: "preparing", label: "Preparing" }, { status: "served", label: "Served" },
];

/** New → Preparing → Served. Served and cancelled are final. */
export function nextStatus(s: OrderStatus): OrderStatus | null {
  return s === "new" ? "preparing" : s === "preparing" ? "served" : null;
}
export const advanceLabel = (s: OrderStatus) => (s === "new" ? "Start preparing" : s === "preparing" ? "Mark served" : null);

/** Only counter orders are settled by staff; online payments are confirmed by the payment provider. */
export const canMarkPaid = (o: Pick<Order, "payment_method" | "payment_status" | "status">) =>
  o.payment_method === "counter" && o.payment_status === "unpaid" && o.status !== "cancelled";

export function timeAgo(iso: string, now = Date.now()) {
  const m = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h ${m % 60} min` : `${Math.floor(h / 24)} d`;
}

export const ordersKey = (branchId: string) => ["live-orders", branchId] as const;
export const requestsKey = (branchId: string) => ["service-requests", branchId] as const;

export async function fetchLiveOrders(branchId: string): Promise<Order[]> {
  const since = new Date(Date.now() - 12 * 3600_000).toISOString();
  const { data, error } = await supabase.from("orders")
    .select("id, table_label, status, payment_method, payment_status, total, customer_note, created_at, order_items(id, name, qty, unit_price, note, addons)")
    .eq("branch_id", branchId).neq("status", "cancelled")
    .or(`status.in.(new,preparing),created_at.gte.${since}`)
    .order("created_at", { ascending: true }).limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as Order[];
}

export async function fetchRequests(branchId: string): Promise<ServiceRequest[]> {
  const since = new Date(Date.now() - 6 * 3600_000).toISOString();
  const { data, error } = await supabase.from("service_requests")
    .select("id, type, status, created_at, tables(label)")
    .eq("branch_id", branchId).or(`status.eq.open,created_at.gte.${since}`)
    .order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as ServiceRequest[];
}

/** Soft two-note chime via Web Audio. The context is created on a user gesture (the toggle) to satisfy autoplay rules. */
let ctx: AudioContext | null = null;
export function unlockChime() {
  if (typeof window === "undefined") return;
  ctx ??= new AudioContext();
  void ctx.resume();
}
export function playChime() {
  if (!ctx || ctx.state !== "running") return;
  const t = ctx.currentTime;
  [659.25, 880].forEach((f, i) => {
    const o = ctx!.createOscillator(); const g = ctx!.createGain();
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0, t + i * 0.18);
    g.gain.linearRampToValueAtTime(0.12, t + i * 0.18 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.6);
    o.connect(g).connect(ctx!.destination); o.start(t + i * 0.18); o.stop(t + i * 0.18 + 0.65);
  });
}
