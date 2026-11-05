import { describe, expect, it } from "vitest";
import { buildPublicMenu } from "./build";

const r = (plan: string) => ({ id: "r", name: "R", slug: "r", description: null, logo_url: null, cover_url: null, currency: "GBP", plan });
const branch = { id: "b", name: "B", address: null, timezone: "Europe/London", opening_hours: {} };
const menus = [0, 1].map((i) => ({ id: `m${i}`, name: `M${i}`, sort: i, active: true, menu_schedules: [], categories: [] }));
const theme = { accent: "#123456", font_pairing: "dm_serif_dm_sans", mode: "dark", logo_url: "logo", cover_url: null };

describe("downgraded restaurants", () => {
  it("free shows only the first menu and the default look, keeping the logo", () => {
    const m = buildPublicMenu(r("free"), branch, theme, menus);
    expect(m.menus.map((x) => x.id)).toEqual(["m0"]);
    expect(m.theme).toMatchObject({ accent: "#C8553D", mode: "light", logo_url: "logo" });
  });
  it("pro keeps every menu and its custom theme", () => {
    const m = buildPublicMenu(r("pro"), branch, theme, menus);
    expect(m.menus).toHaveLength(2);
    expect(m.theme?.accent).toBe("#123456");
  });
});
