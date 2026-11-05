import { describe, expect, it } from "vitest";
import { canAddBranch, canAddMenu, planFeatures } from "./plan";

describe("plan gating", () => {
  it("free plan allows only one menu", () => {
    expect(canAddMenu("free", 0)).toBe(true);
    expect(canAddMenu("free", 1)).toBe(false);
  });
  it("pro allows many menus but a single branch", () => {
    expect(canAddMenu("pro", 5)).toBe(true);
    expect(canAddBranch("pro", 1)).toBe(false);
  });
  it("more than one branch needs Business", () => {
    expect(canAddBranch("free", 1)).toBe(false);
    expect(canAddBranch("business", 1)).toBe(true);
  });
  it("unknown plans fall back to free", () => {
    expect(planFeatures("gold").maxMenusPerBranch).toBe(1);
  });
});
