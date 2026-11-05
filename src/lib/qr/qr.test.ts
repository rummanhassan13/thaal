import { describe, expect, it } from "vitest";
import { parseTableLabels, tableUrl } from "./tables";
import { accentWarning, qrModuleColour } from "./colour";

describe("bulk table labels", () => {
  it("expands 1-20 into twenty tables", () => {
    const l = parseTableLabels("1-20");
    expect(l).toHaveLength(20);
    expect(l[0]).toBe("1");
    expect(l[19]).toBe("20");
  });
  it("mixes ranges and names and skips existing tables", () => {
    expect(parseTableLabels("1-3, Patio, patio", ["2"])).toEqual(["1", "3", "Patio"]);
  });
});

describe("QR links", () => {
  it("use the table token, not the table number", () => {
    expect(tableUrl("https://x.app", "lemon-and-rye", "abc123")).toBe("https://x.app/m/lemon-and-rye?table=abc123");
  });
});

describe("colours", () => {
  it("keeps a strong accent for QR modules but swaps a pale accent for ink", () => {
    expect(qrModuleColour("#1C8C8C")).toBe("#1C8C8C");
    expect(qrModuleColour("#F3E9C6")).toBe("#1E2A5A");
  });
  it("warns about pale accents only", () => {
    expect(accentWarning("#1E2A5A")).toBeNull();
    expect(accentWarning("#F3E9C6")).not.toBeNull();
  });
});
