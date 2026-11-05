import { describe, expect, it } from "vitest";
import { canMarkPaid, nextStatus, timeAgo } from "./orders";

describe("order flow", () => {
  it("advances new → preparing → served and stops", () => {
    expect(nextStatus("new")).toBe("preparing");
    expect(nextStatus("preparing")).toBe("served");
    expect(nextStatus("served")).toBeNull();
    expect(nextStatus("cancelled")).toBeNull();
  });
  it("only counter, unpaid, live orders can be marked paid", () => {
    expect(canMarkPaid({ payment_method: "counter", payment_status: "unpaid", status: "new" })).toBe(true);
    expect(canMarkPaid({ payment_method: "online", payment_status: "unpaid", status: "new" })).toBe(false);
    expect(canMarkPaid({ payment_method: "counter", payment_status: "paid", status: "served" })).toBe(false);
    expect(canMarkPaid({ payment_method: "counter", payment_status: "unpaid", status: "cancelled" })).toBe(false);
  });
  it("shows minutes since placed", () => {
    const now = Date.parse("2026-11-05T12:00:00Z");
    expect(timeAgo("2026-11-05T11:56:00Z", now)).toBe("4 min");
    expect(timeAgo("2026-11-05T11:59:40Z", now)).toBe("just now");
  });
});
