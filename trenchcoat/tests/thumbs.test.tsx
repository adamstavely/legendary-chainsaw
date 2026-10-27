/*
 * The overview pages' thumbnails (app/src/thumbs/, scripts/capture-thumbs.mjs): every gallery entry has one in
 * both themes, so a new component without a thumbnail is caught here – run `npm run capture:thumbs -- --missing`.
 * An entry that can't be captured still gets a tidy tile: its initials.
 */
import { describe, expect, test } from "vitest";
import { ENTRIES } from "../app/src/registry";
import { categorySlug, initials, thumbFor } from "../app/src/thumbs";

describe("thumbnails", () => {
  test("every gallery entry has a light and a dark thumbnail", () => {
    const missing = ENTRIES.flatMap((e) => (["light", "dark"] as const).filter((t) => !thumbFor(e, t)).map((t) => `${e.id} (${t})`));
    expect(missing, "run npm run capture:thumbs -- --missing").toEqual([]);
  });

  test("an entry without one falls back to initials", () => {
    expect(thumbFor({ library: "components", slug: "no-such-component" }, "light")).toBeUndefined();
    expect(initials("Agent Plan")).toBe("AP");
    expect(initials("Button")).toBe("Bu");
    expect(initials("Kpi-chart")).toBe("KC");
  });

  test("category routes are unique", () => {
    const slugs = [...new Set(ENTRIES.filter((e) => e.library === "components").map((e) => e.category))].map(categorySlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
