import { describe, expect, it } from "vitest";
import { graphLayout, heights, linkPath, orderRows, rowLabel } from "../../src/canvas/graph";
import { intersects } from "../../src/canvas/geometry";
import { compositionEdges } from "../../plugins/trenchcoat";
import { LINKS, compositionText, usedIn, usesOf } from "../../src/data/composition";
import { PIECES } from "../../src/data/pieces";

describe("compositionEdges", () => {
  it("links an element to the elements it renders or imports, never itself or an unknown one", () => {
    const edges = compositionEdges({
      pane: 'import "./button";\nimport "./internal/base";\nhtml`<tc-composer></tc-composer><tc-pane></tc-pane><tc-nowhere></tc-nowhere>`',
      composer: 'html`<tc-button label="Send"></tc-button>`',
      button: "",
    });
    expect(edges).toEqual([
      ["composer", "button"],
      ["pane", "button"],
      ["pane", "composer"],
    ]);
  });
});

describe("heights", () => {
  it("counts how deep a piece's parts go, and survives a cycle", () => {
    const h = heights(
      ["a", "b", "c", "x", "y"],
      [
        ["a", "b"],
        ["b", "c"],
        ["a", "c"],
        ["x", "y"],
        ["y", "x"],
      ],
    );
    expect([h.get("a"), h.get("b"), h.get("c")]).toEqual([2, 1, 0]);
    expect([...h.values()].every((n) => Number.isFinite(n) && n >= 0)).toBe(true);
  });
});

describe("orderRows", () => {
  it("lines parts up under the pieces that use them", () => {
    const rows = orderRows(
      [
        ["left", "right"],
        ["r-part", "l-part"],
      ],
      [
        ["left", "l-part"],
        ["right", "r-part"],
      ],
    );
    expect(rows[1]).toEqual(["l-part", "r-part"]);
  });
});

describe("graphLayout", () => {
  const ids = ["a", "b", "c", "d", "lonely"];
  const links = [
    ["a", "b"],
    ["b", "c"],
    ["d", "c"],
    ["a", "gone"],
  ] as const;
  const g = graphLayout(ids, links);

  it("puts builders above their parts, so every link points down, and the rest last", () => {
    expect(g.sections.map((s) => s.label)).toEqual([rowLabel(2), rowLabel(1), rowLabel(0), "Stands alone"]);
    expect(g.sections[1].ids).toEqual(expect.arrayContaining(["b", "d"]));
    for (const [a, b] of g.links) expect(g.cards.get(a)!.y).toBeLessThan(g.cards.get(b)!.y);
    expect(g.links).toHaveLength(3);
  });

  it("never overlaps cards", () => {
    const rects = [...g.cards.values()];
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) expect(intersects(rects[i], rects[j])).toBe(false);
  });

  it("draws a link from the bottom of the user to the top of the part", () => {
    const from = g.cards.get("a")!;
    const to = g.cards.get("b")!;
    const d = linkPath(from, to);
    expect(d.startsWith(`M ${from.x + from.width / 2} ${from.y + from.height}`)).toBe(true);
    expect(d.endsWith(`${to.x + to.width / 2} ${to.y}`)).toBe(true);
  });
});

describe("Trenchcoat's composition", () => {
  it("links real pieces, and says so in words", () => {
    expect(LINKS.length).toBeGreaterThan(50);
    const ids = new Set(PIECES.map((p) => p.id));
    expect(LINKS.every(([a, b]) => ids.has(a) && ids.has(b))).toBe(true);
    const pane = PIECES.find((p) => p.slug === "ai-side-pane")!.id;
    expect(usesOf(pane).length).toBeGreaterThan(2);
    expect(usedIn("button").length).toBeGreaterThan(5);
    expect(compositionText(pane)).toMatch(/^Built with .*Chat Composer.*\./);
  });
});
