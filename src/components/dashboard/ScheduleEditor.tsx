import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/plated/primitives";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, type Menu } from "@/lib/dashboard/menu-data";
import { DAY_NAMES, dayRanges, scheduleWarnings, type Slot } from "@/lib/dashboard/schedule-check";
import { cn } from "@/lib/utils";

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const SWATCH = ["bg-terracotta", "bg-olive", "bg-ink/70", "bg-sand-deep", "bg-olive-soft", "bg-terracotta/50"];
const timeCls = "h-9 rounded-md border border-input bg-card px-2 text-sm tabular-nums focus:border-ink focus:outline-none";
type DraftSlot = Slot & { key: string };

export function ScheduleEditor({ menus, menu, onSaved }: { menus: Menu[]; menu: Menu; onSaved: () => void }) {
  const toDraft = () => menu.menu_schedules.map((s) => ({ key: s.id, weekdays: [...s.weekdays].sort(), start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) }));
  const [slots, setSlots] = useState<DraftSlot[]>(toDraft);
  const [busy, setBusy] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setSlots(toDraft()); }, [menu.id, menu.menu_schedules]);

  const all = useMemo(() => menus.map((m) => ({
    id: m.id, name: m.name,
    schedules: m.id === menu.id ? slots : m.menu_schedules.map((s) => ({ weekdays: s.weekdays, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) })),
  })), [menus, menu.id, slots]);
  const days = useMemo(() => dayRanges(all), [all]);
  const warnings = useMemo(() => scheduleWarnings(all), [all]);
  const colour = (id: string) => SWATCH[Math.max(0, menus.findIndex((m) => m.id === id)) % SWATCH.length];
  const dirty = JSON.stringify(slots.map(({ key: _k, ...s }) => s)) !== JSON.stringify(toDraft().map(({ key: _k, ...s }) => s));

  const patch = (key: string, p: Partial<Slot>) => setSlots((xs) => xs.map((s) => (s.key === key ? { ...s, ...p } : s)));
  const save = async () => {
    if (slots.some((s) => !s.weekdays.length)) { toast.error("Pick at least one day for each time slot."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("menu_schedules").delete().eq("menu_id", menu.id);
      if (error) throw error;
      if (slots.length) {
        const { error: e2 } = await supabase.from("menu_schedules").insert(slots.map((s) => ({ menu_id: menu.id, weekdays: s.weekdays, start_time: s.start_time, end_time: s.end_time })));
        if (e2) throw e2;
      }
      toast.success("Schedule saved."); onSaved();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      {/* week timeline */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {menus.map((m) => <span key={m.id} className="inline-flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", colour(m.id))} />{m.name}</span>)}
      </div>
      <div className="mt-3 select-none" aria-label="Week timeline">
        <div className="ml-10 flex justify-between text-[10px] text-muted-foreground tabular-nums">{["00", "06", "12", "18", "24"].map((h) => <span key={h}>{h}</span>)}</div>
        {ORDER.map((d) => (
          <div key={d} className="flex items-center gap-2 py-[3px]">
            <span className="w-8 text-xs text-muted-foreground">{DAY_NAMES[d]}</span>
            <div className="relative h-4 flex-1 rounded-sm bg-sand/60">
              {[25, 50, 75].map((p) => <span key={p} className="absolute inset-y-0 w-px bg-hairline" style={{ left: `${p}%` }} />)}
              {days[d]!.map((r, i) => {
                const ov = (o: { start: number; end: number }) => o.start < r.end && r.start < o.end;
                const overlaps = days[d]!.some((o, j) => j !== i && ov(o));
                const lane = days[d]!.slice(0, i).some(ov) ? 1 : 0;
                return (
                  <span key={i} title={r.name}
                    className={cn("absolute rounded-sm", colour(r.menuId), r.menuId === menu.id ? "opacity-100" : "opacity-60")}
                    style={{ left: `${(r.start / 1440) * 100}%`, width: `${((r.end - r.start) / 1440) * 100}%`, top: overlaps && lane ? "50%" : 0, bottom: overlaps && !lane ? "50%" : 0 }} />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {warnings.length > 0 && (
        <ul className="mt-4 space-y-1 border-l-2 border-terracotta pl-3 text-sm text-terracotta">
          {warnings.slice(0, 6).map((w) => <li key={w}>{w}</li>)}
          {warnings.length > 6 && <li>…and {warnings.length - 6} more.</li>}
        </ul>
      )}

      {/* slots for this menu */}
      <div className="mt-6">
        <p className="text-sm">When is <span className="font-display text-base">{menu.name}</span> on?</p>
        {slots.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No times set, so it shows whenever nothing else is scheduled.</p>}
        <div className="mt-2 divide-y divide-hairline border-y border-hairline empty:border-0">
          {slots.map((s) => (
            <div key={s.key} className="flex flex-wrap items-center gap-3 py-3">
              <div className="flex gap-1">
                {ORDER.map((d) => {
                  const on = s.weekdays.includes(d);
                  return (
                    <button key={d} type="button" aria-pressed={on} aria-label={DAY_NAMES[d]}
                      onClick={() => patch(s.key, { weekdays: on ? s.weekdays.filter((x) => x !== d) : [...s.weekdays, d].sort() })}
                      className={cn("h-8 w-8 rounded-full border text-[11px]", on ? "border-ink bg-ink text-paper" : "border-hairline text-muted-foreground")}>
                      {DAY_NAMES[d]!.slice(0, 2)}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <input type="time" aria-label="Starts" value={s.start_time} onChange={(e) => patch(s.key, { start_time: e.target.value })} className={timeCls} />
                <span className="text-muted-foreground">–</span>
                <input type="time" aria-label="Ends" value={s.end_time} onChange={(e) => patch(s.key, { end_time: e.target.value })} className={timeCls} />
              </div>
              <button type="button" onClick={() => setSlots((xs) => xs.filter((x) => x.key !== s.key))} className="ml-auto text-sm text-muted-foreground hover:text-terracotta">Remove</button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => setSlots((xs) => [...xs, { key: crypto.randomUUID(), weekdays: [1, 2, 3, 4, 5], start_time: "12:00", end_time: "15:00" }])} className="text-sm underline decoration-ink/30 underline-offset-4">Add a time slot</button>
          {dirty && <Button size="sm" variant="accent" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save schedule"}</Button>}
        </div>
      </div>
    </div>
  );
}
