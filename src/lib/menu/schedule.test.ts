import { describe, expect, it } from "vitest";
import { localClock, pickActiveMenu } from "./schedule";

const menus = [{ id: "breakfast", sort: 0 }, { id: "allday", sort: 1 }];
const schedules = [
  { menu_id: "breakfast", weekdays: [0, 1, 2, 3, 4, 5, 6], start_time: "07:00:00", end_time: "11:30:00" },
  { menu_id: "allday", weekdays: [0, 1, 2, 3, 4, 5, 6], start_time: "11:30:00", end_time: "23:00:00" },
];

describe("pickActiveMenu", () => {
  it("shows Breakfast at 07:00", () => {
    expect(pickActiveMenu(menus, schedules, { weekday: 2, time: "07:00" })).toBe("breakfast");
  });
  it("switches to All day at exactly 11:30", () => {
    expect(pickActiveMenu(menus, schedules, { weekday: 2, time: "11:30" })).toBe("allday");
  });
  it("falls back to the first menu outside all schedules", () => {
    expect(pickActiveMenu(menus, schedules, { weekday: 2, time: "03:00" })).toBe("breakfast");
  });
  it("respects weekdays", () => {
    const weekendBrunch = [{ menu_id: "breakfast", weekdays: [0, 6], start_time: "09:00", end_time: "14:00" }];
    expect(pickActiveMenu(menus, weekendBrunch, { weekday: 3, time: "10:00" })).toBe("allday");
  });
  it("handles overnight ranges after midnight", () => {
    const late = [{ menu_id: "allday", weekdays: [5], start_time: "22:00", end_time: "02:00" }];
    expect(pickActiveMenu(menus, late, { weekday: 6, time: "01:00" })).toBe("allday");
  });
});

describe("localClock", () => {
  it("uses the branch timezone", () => {
    // 2026-11-05 09:00 UTC = 09:00 London (GMT), 18:00 Tokyo
    const d = new Date("2026-11-05T09:00:00Z");
    expect(localClock(d, "Europe/London")).toEqual({ weekday: 4, time: "09:00" });
    expect(localClock(d, "Asia/Tokyo")).toEqual({ weekday: 4, time: "18:00" });
  });
});
