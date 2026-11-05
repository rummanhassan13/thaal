import { describe, expect, it } from "vitest";
import { slugify } from "./restaurant";

describe("slugify", () => {
  it("turns & into and", () => expect(slugify("Lemon & Rye")).toBe("lemon-and-rye"));
  it("strips accents and punctuation", () => expect(slugify("  Café Ñoño!! ")).toBe("cafe-nono"));
});
