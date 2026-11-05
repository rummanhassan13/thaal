export type CartLine = {
  key: string; dishId: string; name: string; basePrice: number;
  addons: { id: string; name: string; price: number }[];
  qty: number; note: string;
};

export const lineKey = (dishId: string, addonIds: string[], note: string) =>
  [dishId, [...addonIds].sort().join("+"), note.trim().toLowerCase()].join("|");

export const unitPrice = (l: Pick<CartLine, "basePrice" | "addons">) =>
  Math.round((l.basePrice + l.addons.reduce((s, a) => s + a.price, 0)) * 100) / 100;

export const lineTotal = (l: CartLine) => Math.round(unitPrice(l) * l.qty * 100) / 100;
export const cartTotal = (lines: CartLine[]) => Math.round(lines.reduce((s, l) => s + lineTotal(l), 0) * 100) / 100;
export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.qty, 0);

/** Add a line, merging with an identical dish+addons+note line. Qty capped at 20. */
export function addLine(lines: CartLine[], line: Omit<CartLine, "key">): CartLine[] {
  const key = lineKey(line.dishId, line.addons.map((a) => a.id), line.note);
  const found = lines.find((l) => l.key === key);
  if (found) return lines.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + line.qty) } : l));
  return [...lines, { ...line, key, qty: Math.min(20, line.qty) }];
}

export function setQty(lines: CartLine[], key: string, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((l) => l.key !== key);
  return lines.map((l) => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l));
}

/** Payload for the place_order RPC — ids and quantities only; prices are recomputed server-side. */
export const toOrderItems = (lines: CartLine[]) =>
  lines.map((l) => ({ dish_id: l.dishId, qty: l.qty, addon_ids: l.addons.map((a) => a.id), note: l.note || undefined }));
