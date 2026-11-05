import { describe, expect, it } from "vitest";
import { isPreviewHost } from "./pwa-guard";
describe("service worker preview guard", () => {
  it("refuses Lovable preview hosts", () => {
    expect(isPreviewHost("id-preview--b9d21854.lovable.app")).toBe(true);
    expect(isPreviewHost("preview--thaal.lovable.app")).toBe(true);
    expect(isPreviewHost("project--abc-dev.lovable.app")).toBe(true);
    expect(isPreviewHost("abc.lovableproject.com")).toBe(true);
  });
  it("allows published and custom domains", () => {
    expect(isPreviewHost("thaal.lovable.app")).toBe(false);
    expect(isPreviewHost("preview-v2--shop.example.com")).toBe(false);
  });
});
