import { describe, expect, it } from "vitest";
import { scheduleWarnings } from "./schedule-check";

const m = (id: string, start: string, end: string, weekdays = [1]) => ({ id, name: id, schedules: [{ weekdays, start_time: start, end_time: end }] });

describe("scheduleWarnings", () => {
  it("flags two menus running at the same time", () => {
    expect(scheduleWarnings([m("Breakfast", "07:00", "12:00"), m("Lunch", "11:30", "15:00")]))
      .toEqual(["Mon: Breakfast and Lunch overlap 11:30–12:00."]);
  });
  it("flags a gap between menus on the same day", () => {
    expect(scheduleWarnings([m("Breakfast", "07:00", "11:00"), m("Lunch", "12:00", "15:00")]))
      .toEqual(["Mon: nothing scheduled 11:00–12:00."]);
  });
  it("back-to-back menus are fine", () => {
    expect(scheduleWarnings([m("Breakfast", "07:00", "11:30"), m("Lunch", "11:30", "15:00")])).toEqual([]);
  });
  it("different days never clash", () => {
    expect(scheduleWarnings([m("A", "07:00", "12:00", [1]), m("B", "08:00", "12:00", [2])])).toEqual([]);
  });
  it("overnight menus spill into the next morning", () => {
    expect(scheduleWarnings([m("Late", "22:00", "02:00", [1]), m("Early", "01:00", "05:00", [2])]))
      .toEqual(["Tue: Late and Early overlap 01:00–02:00."]);
  });
});
