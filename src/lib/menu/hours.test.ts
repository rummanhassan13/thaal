import { describe, expect, it } from "vitest";
import { friendlyTime, openState } from "./hours";

const hours = { mon: { open: "07:00", close: "22:00" }, tue: { open: "07:00", close: "22:00" }, sun: null };

describe("openState", () => {
  it("says open till 10pm during hours", () => expect(openState(hours, { weekday: 1, time: "12:00" })).toEqual({ open: true, label: "Open till 10pm" }));
  it("says opens at 7am before opening", () => expect(openState(hours, { weekday: 1, time: "06:30" }).label).toBe("Opens at 7am"));
  it("points to tomorrow after closing", () => expect(openState(hours, { weekday: 1, time: "22:00" }).label).toBe("Closed · opens tomorrow 7am"));
  it("skips closed days", () => expect(openState(hours, { weekday: 0, time: "12:00" }).label).toBe("Closed · opens tomorrow 7am"));
  it("formats times", () => { expect(friendlyTime("11:30")).toBe("11:30am"); expect(friendlyTime("12:00")).toBe("12pm"); });
});
