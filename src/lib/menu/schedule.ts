export type Schedule = { menu_id: string; weekdays: number[]; start_time: string; end_time: string };

/** Weekday (0=Sun) and "HH:MM" for a given instant in an IANA timezone. */
export function localClock(now: Date, timeZone: string): { weekday: number; time: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { weekday, time: `${get("hour")}:${get("minute")}` };
}

/**
 * Pick the menu to show diners. A menu matches when today's weekday is in its
 * schedule and the local time is within [start, end). Overnight ranges (end < start)
 * wrap past midnight. Menus without schedules are "always on" fallbacks.
 * If nothing matches, the first menu (by sort) is shown.
 */
export function pickActiveMenu(
  menus: { id: string; sort: number }[],
  schedules: Schedule[],
  clock: { weekday: number; time: string },
): string | null {
  const sorted = [...menus].sort((a, b) => a.sort - b.sort);
  const t = clock.time;
  for (const m of sorted) {
    const own = schedules.filter((s) => s.menu_id === m.id);
    const hit = own.some((s) => {
      const start = s.start_time.slice(0, 5);
      const end = s.end_time.slice(0, 5);
      if (start <= end) return s.weekdays.includes(clock.weekday) && t >= start && t < end;
      // overnight: belongs to the day it started on
      if (t >= start) return s.weekdays.includes(clock.weekday);
      return t < end && s.weekdays.includes((clock.weekday + 6) % 7);
    });
    if (hit) return m.id;
  }
  const unscheduled = sorted.find((m) => !schedules.some((s) => s.menu_id === m.id));
  return unscheduled?.id ?? sorted[0]?.id ?? null;
}
