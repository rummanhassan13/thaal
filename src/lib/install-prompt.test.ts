import { describe, expect, it } from "vitest";
import { dismissedRecently, isIosSafari } from "./install-prompt";
const day = 24 * 3600_000;
describe("install banner", () => {
  it("stays hidden for 14 days after dismissing", () => {
    const now = Date.now();
    expect(dismissedRecently(now - 13 * day, now)).toBe(true);
    expect(dismissedRecently(now - 15 * day, now)).toBe(false);
    expect(dismissedRecently(null, now)).toBe(false);
  });
  it("detects iOS Safari but not Chrome on iOS", () => {
    expect(isIosSafari("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1")).toBe(true);
    expect(isIosSafari("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120 Mobile/15E148 Safari/604.1")).toBe(false);
  });
});
