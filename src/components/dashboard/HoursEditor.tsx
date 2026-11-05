import type { Hours } from "@/lib/menu/hours";
import { Toggle } from "@/components/plated/primitives";

const DAYS = [["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]] as const;
const timeCls = "h-9 rounded-md border border-input bg-card px-2 text-sm tabular-nums focus:border-ink focus:outline-none";

export function HoursEditor({ value, onChange }: { value: Hours; onChange: (h: Hours) => void }) {
  const set = (k: string, v: { open: string; close: string } | null) => onChange({ ...value, [k]: v });
  const copyToAll = (k: string) => { const src = value[k]; if (!src) return; onChange(Object.fromEntries(DAYS.map(([d]) => [d, { ...src }]))); };
  return (
    <div className="divide-y divide-hairline border-y border-hairline">
      {DAYS.map(([k, label]) => {
        const h = value[k];
        return (
          <div key={k} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <span className="w-24 text-sm">{label}</span>
            <Toggle checked={!!h} onChange={(on) => set(k, on ? { open: "09:00", close: "17:00" } : null)} label={`Open on ${label}`} />
            {h ? (
              <div className="flex items-center gap-2">
                <input type="time" aria-label={`${label} opens`} value={h.open} onChange={(e) => set(k, { ...h, open: e.target.value })} className={timeCls} />
                <span className="text-muted-foreground">–</span>
                <input type="time" aria-label={`${label} closes`} value={h.close} onChange={(e) => set(k, { ...h, close: e.target.value })} className={timeCls} />
                {k === "mon" && <button type="button" onClick={() => copyToAll(k)} className="ml-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Copy to all</button>}
              </div>
            ) : <span className="text-sm text-muted-foreground">Closed</span>}
          </div>
        );
      })}
    </div>
  );
}
