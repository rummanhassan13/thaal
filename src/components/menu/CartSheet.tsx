import { useState } from "react";
import { BottomSheet, Button, Divider } from "@/components/plated/primitives";
import { cartTotal, lineTotal, type CartLine } from "@/lib/menu/cart";
import { formatPrice } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

export function CartSheet({ open, onClose, lines, currency, tableLabel, onQty, onNote, onPlace, placing, error }: {
  open: boolean; onClose: () => void; lines: CartLine[]; currency: string; tableLabel: string;
  onQty: (key: string, qty: number) => void; onNote: (key: string, note: string) => void;
  onPlace: (note: string, method: "counter") => void; placing: boolean; error: string | null;
}) {
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const total = cartTotal(lines);

  return (
    <BottomSheet open={open} onClose={onClose} label="Your order">
      <div className="flex items-baseline justify-between">
        <h2 className="text-3xl">Your order</h2>
        <span className="text-xs text-muted-foreground">Table {tableLabel}</span>
      </div>

      {lines.length === 0 ? (
        <p className="py-10 text-sm text-muted-foreground">Nothing here yet. Hungry? Start with the menu.</p>
      ) : (
        <>
          <ul className="mt-5">
            {lines.map((l) => (
              <li key={l.key} className="border-t border-hairline py-4 first:border-t-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg leading-tight">{l.name}</p>
                    {l.addons.length > 0 && <p className="text-xs text-muted-foreground">+ {l.addons.map((a) => a.name).join(", ")}</p>}
                    {editing === l.key ? (
                      <input autoFocus defaultValue={l.note} placeholder="No onions, please" maxLength={200}
                        onBlur={(e) => { onNote(l.key, e.target.value.trim()); setEditing(null); }}
                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                        className="mt-1.5 h-9 w-full rounded-md border border-input bg-card px-2.5 text-xs focus:border-ink focus:outline-none" />
                    ) : (
                      <button onClick={() => setEditing(l.key)} className="mt-1 text-xs text-muted-foreground underline-offset-4 hover:underline">
                        {l.note ? `“${l.note}”` : "Add a note"}
                      </button>
                    )}
                  </div>
                  <span className="text-sm tabular-nums">{formatPrice(lineTotal(l), currency)}</span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <div className="flex h-9 items-center rounded-md border border-hairline">
                    <button aria-label={`One less ${l.name}`} onClick={() => onQty(l.key, l.qty - 1)} className="h-full w-9">−</button>
                    <span className="w-5 text-center tabular-nums">{l.qty}</span>
                    <button aria-label={`One more ${l.name}`} onClick={() => onQty(l.key, l.qty + 1)} className="h-full w-9">+</button>
                  </div>
                  <button onClick={() => onQty(l.key, 0)} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
                </div>
              </li>
            ))}
          </ul>

          <Divider className="my-4" />
          <label className="block">
            <span className="eyebrow mb-2 block">Anything else?</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} rows={2} placeholder="It's a birthday, we're in a rush, etc."
              className="w-full resize-none rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/70 focus:border-ink focus:outline-none" />
          </label>

          <p className="eyebrow mt-6 mb-2">How to pay</p>
          <div className="grid gap-2">
            <div className="flex items-center justify-between rounded-lg border border-ink px-4 py-3 text-sm">
              <span>Pay at the counter</span><span className="h-3 w-3 rounded-full border-4 border-marigold" />
            </div>
            <div aria-disabled className="flex items-center justify-between rounded-lg border border-hairline px-4 py-3 text-sm text-muted-foreground">
              <span>Pay online</span><span className="text-[11px] uppercase tracking-wider">Coming soon</span>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-alert">{error}</p>}
          <div className="sticky bottom-0 -mx-5 mt-6 border-t border-hairline bg-background px-5 pt-4">
            <div className="mb-3 flex justify-between text-sm"><span className="text-muted-foreground">Total</span><span className="tabular-nums">{formatPrice(total, currency)}</span></div>
            <Button variant="accent" size="lg" className={cn("w-full")} disabled={placing} onClick={() => onPlace(note.trim(), "counter")}>
              {placing ? "Sending to the kitchen…" : `Place order · ${formatPrice(total, currency)}`}
            </Button>
          </div>
        </>
      )}
    </BottomSheet>
  );
}
