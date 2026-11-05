export type Slot = { weekdays: number[]; start_time: string; end_time: string };
export type ScheduledMenu = { id: string; name: string; schedules: Slot[] };
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toMin = (t: string) => { const [h = 0, m = 0] = t.slice(0, 5).split(":").map(Number); return h * 60 + m; };
const fmt = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Per weekday, the [start,end) minute ranges of each menu (overnight ranges spill into the next day). */
export function dayRanges(menus: ScheduledMenu[]) {
  const days: { menuId: string; name: string; start: number; end: number }[][] = Array.from({ length: 7 }, () => []);
  for (const m of menus) for (const s of m.schedules) {
    const a = toMin(s.start_time), b = toMin(s.end_time);
    for (const d of s.weekdays) {
      if (a < b) days[d]!.push({ menuId: m.id, name: m.name, start: a, end: b });
      else if (a > b) {
        days[d]!.push({ menuId: m.id, name: m.name, start: a, end: 1440 });
        days[(d + 1) % 7]!.push({ menuId: m.id, name: m.name, start: 0, end: b });
      }
    }
  }
  return days;
}

/**
 * Human warnings for overlapping schedules (two menus at once) and gaps between
 * scheduled menus within a day (diners would fall back to the default menu).
 */
export function scheduleWarnings(menus: ScheduledMenu[]): string[] {
  const out: string[] = [];
  const invalid = menus.flatMap((m) => m.schedules.filter((s) => s.start_time.slice(0, 5) === s.end_time.slice(0, 5)).map(() => m.name));
  for (const n of new Set(invalid)) out.push(`${n} starts and ends at the same time, so it never shows.`);
  dayRanges(menus).forEach((ranges, d) => {
    const r = [...ranges].sort((x, y) => x.start - y.start);
    for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
      const a = r[i]!, b = r[j]!;
      if (a.menuId !== b.menuId && b.start < a.end) {
        out.push(`${DAY_NAMES[d]}: ${a.name} and ${b.name} overlap ${fmt(b.start)}–${fmt(Math.min(a.end, b.end))}.`);
      }
    }
    let reach = r[0]?.end ?? 0;
    for (let i = 1; i < r.length; i++) {
      const cur = r[i]!;
      if (cur.start > reach) out.push(`${DAY_NAMES[d]}: nothing scheduled ${fmt(reach)}–${fmt(cur.start)}.`);
      reach = Math.max(reach, cur.end);
    }
  });
  return out;
}
