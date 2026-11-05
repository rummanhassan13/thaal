import { describe, expect, it } from "vitest";
import { addLine, cartCount, cartTotal, setQty, toOrderItems } from "./cart";

const flat = { dishId: "d1", name: "Flat white", basePrice: 4, addons: [], qty: 1, note: "" };
const oat = { id: "a1", name: "Oat milk", price: 0.5 };

describe("cart", () => {
  it("merges identical lines and totals with add-ons", () => {
    let c = addLine([], flat);
    c = addLine(c, flat);
    c = addLine(c, { ...flat, addons: [oat] });
    expect(c).toHaveLength(2);
    expect(cartCount(c)).toBe(3);
    expect(cartTotal(c)).toBe(12.5);
  });
  it("keeps different notes as separate lines", () => {
    const c = addLine(addLine([], flat), { ...flat, note: "extra hot" });
    expect(c).toHaveLength(2);
  });
  it("caps quantity at 20 and removes at 0", () => {
    let c = addLine([], { ...flat, qty: 25 });
    expect(c[0].qty).toBe(20);
    c = setQty(c, c[0].key, 0);
    expect(c).toHaveLength(0);
  });
  it("never sends prices to the server", () => {
    const items = toOrderItems(addLine([], { ...flat, addons: [oat] }));
    expect(items[0]).toEqual({ dish_id: "d1", qty: 1, addon_ids: ["a1"], note: undefined });
    expect(JSON.stringify(items)).not.toContain("price");
  });
});
