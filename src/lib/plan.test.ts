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

describe("design + QR gating", () => {
  it("free gets the default theme and no per-table QR codes", () => {
    expect(planFeatures("free").themes).toBe(false);
    expect(planFeatures("free").tableQr).toBe(false);
  });
  it("pro and business unlock themes and branded table QR codes", () => {
    for (const p of ["pro", "business"]) {
      expect(planFeatures(p).themes).toBe(true);
      expect(planFeatures(p).tableQr).toBe(true);
    }
  });
});

import { PLANS, planInfo } from "./plan";
describe("plan prices", () => {
  it("Free £0, Pro £19/month, Business £49/month", () => {
    expect(PLANS.map((p) => [p.id, p.price])).toEqual([["free", 0], ["pro", 19], ["business", 49]]);
    expect(planInfo("pro").period).toBe("per month");
  });
  it("unknown plan falls back to Free", () => expect(planInfo("gold").id).toBe("free"));
});
