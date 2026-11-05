export type Hours = Record<string, { open: string; close: string } | null | undefined>;
const KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** "22:00" -> "10pm", "11:30" -> "11:30am" */
export function friendlyTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 && h < 24 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""}${suffix}`;
}

/** Open/closed state for a branch at a local clock (weekday 0=Sun, "HH:MM"). */
export function openState(hours: Hours, clock: { weekday: number; time: string }): { open: boolean; label: string } {
  const today = hours[KEYS[clock.weekday]];
  if (today) {
    if (clock.time >= today.open && clock.time < today.close) return { open: true, label: `Open till ${friendlyTime(today.close)}` };
    if (clock.time < today.open) return { open: false, label: `Opens at ${friendlyTime(today.open)}` };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (clock.weekday + i) % 7;
    const h = hours[KEYS[d]];
    if (h) {
      const day = i === 1 ? "tomorrow" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];
      return { open: false, label: `Closed · opens ${day} ${friendlyTime(h.open)}` };
    }
  }
  return { open: false, label: "Closed" };
}
