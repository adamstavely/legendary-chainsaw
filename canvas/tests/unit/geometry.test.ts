import { describe, expect, it } from "vitest";
import {
  CARD,
  fit,
  freeLayout,
  gridLayout,
  intersects,
  nearestIn,
  reveal,
  visibleWorld,
  zoomAt,
  MAX_ZOOM,
  MIN_ZOOM,
  type Rect,
} from "../../src/canvas/geometry";

const screen = { width: 1000, height: 800 };
const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

describe("zoomAt", () => {
  it("keeps the world point under the anchor where it is", () => {
    const view = { x: 120, y: -40, zoom: 0.8 };
    const anchor = { x: 300, y: 200 };
    const before = { x: (anchor.x - view.x) / view.zoom, y: (anchor.y - view.y) / view.zoom };
    const next = zoomAt(view, 2, anchor);
    expect(next.zoom).toBe(2);
    expect((anchor.x - next.x) / next.zoom).toBeCloseTo(before.x);
    expect((anchor.y - next.y) / next.zoom).toBeCloseTo(before.y);
  });

  it("clamps the zoom", () => {
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, 100, { x: 0, y: 0 }).zoom).toBe(MAX_ZOOM);
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, 0, { x: 0, y: 0 }).zoom).toBe(MIN_ZOOM);
  });
});

describe("fit", () => {
  it("centres the rectangle inside the insets", () => {
    const rect = { x: 500, y: 200, width: 400, height: 100 };
    const inset = { top: 50, right: 20, bottom: 50, left: 20 };
    const view = fit(rect, screen, inset);
    const left = rect.x * view.zoom + view.x;
    const right = (rect.x + rect.width) * view.zoom + view.x;
    const top = rect.y * view.zoom + view.y;
    const bottom = (rect.y + rect.height) * view.zoom + view.y;
    expect(left).toBeCloseTo(inset.left);
    expect(right).toBeCloseTo(screen.width - inset.right);
    expect((top + bottom) / 2).toBeCloseTo(screen.height / 2);
  });

  it("never zooms past the cap", () => {
    expect(fit({ x: 0, y: 0, width: 10, height: 10 }, screen, undefined, 1.5).zoom).toBe(1.5);
  });
});

describe("reveal", () => {
  const inset = { top: 24, right: 24, bottom: 24, left: 24 };

  it("leaves the view alone when the card is already clear of the edges", () => {
    const view = { x: 0, y: 0, zoom: 1 };
    expect(reveal(view, { x: 100, y: 100, width: 320, height: 240 }, screen, inset)).toBe(view);
  });

  it("pans the least it takes to show the card", () => {
    const view = { x: 0, y: 0, zoom: 1 };
    const next = reveal(view, { x: 900, y: 700, width: 320, height: 240 }, screen, inset);
    expect(next.zoom).toBe(1);
    expect(900 + next.x + 320).toBe(screen.width - inset.right);
    expect(700 + next.y + 240).toBe(screen.height - inset.bottom);
  });

  it("zooms out to fit a card bigger than the screen", () => {
    const next = reveal({ x: 0, y: 0, zoom: 5 }, { x: 0, y: 0, width: 320, height: 240 }, screen, inset);
    expect(next.zoom).toBeLessThan(5);
  });
});

describe("gridLayout", () => {
  const layout = gridLayout([
    { label: "A", ids: ids("a", 7) },
    { label: "Empty", ids: [] },
    { label: "B", ids: ids("b", 30) },
    { label: "C", ids: ids("c", 1) },
  ]);

  it("places every card once, at card size, with none overlapping", () => {
    const rects = [...layout.cards.values()];
    expect(rects).toHaveLength(38);
    for (const r of rects) expect([r.width, r.height]).toEqual([CARD.width, CARD.height]);
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) expect(intersects(rects[i], rects[j])).toBe(false);
  });

  it("keeps the sections in order, skips empty ones, and puts each section's cards inside it", () => {
    expect(layout.sections.map((s) => s.label)).toEqual(["A", "B", "C"]);
    for (const section of layout.sections) {
      const prefix = section.label.toLowerCase();
      for (const [id, r] of layout.cards)
        if (id.startsWith(prefix))
          expect(
            r.x >= section.rect.x &&
              r.y >= section.rect.y &&
              r.x + r.width <= section.rect.x + section.rect.width &&
              r.y + r.height <= section.rect.y + section.rect.height,
          ).toBe(true);
    }
  });

  it("wraps sections onto a new shelf when a row gets too wide", () => {
    const narrow = gridLayout(
      [
        { label: "A", ids: ids("a", 4) },
        { label: "B", ids: ids("b", 4) },
      ],
      1000,
    );
    expect(narrow.sections[1].rect.x).toBe(0);
    expect(narrow.sections[1].rect.y).toBeGreaterThan(narrow.sections[0].rect.y + narrow.sections[0].rect.height);
  });
});

describe("freeLayout", () => {
  it("moves only the cards the viewer moved, and drops the sections", () => {
    const base = gridLayout([{ label: "A", ids: ["one", "two"] }]);
    const free = freeLayout(base, { two: { x: 5000, y: 10 } });
    expect(free.cards.get("one")).toEqual(base.cards.get("one"));
    expect(free.cards.get("two")).toMatchObject({ x: 5000, y: 10, width: CARD.width });
    expect(free.sections).toEqual([]);
  });
});

describe("nearestIn", () => {
  const cards = new Map<string, Rect>([
    ["centre", { x: 0, y: 0, width: 10, height: 10 }],
    ["right-near-off-axis", { x: 40, y: 30, width: 10, height: 10 }],
    ["right-straight", { x: 60, y: 0, width: 10, height: 10 }],
    ["below", { x: 0, y: 50, width: 10, height: 10 }],
    ["far-left", { x: -500, y: 0, width: 10, height: 10 }],
  ]);
  const from = cards.get("centre")!;

  it("prefers the card straight ahead over a closer one off to the side", () => {
    expect(nearestIn(from, "right", cards, "centre")).toBe("right-straight");
  });

  it("finds cards in each direction, and null when there are none", () => {
    expect(nearestIn(from, "down", cards, "centre")).toBe("below");
    expect(nearestIn(from, "left", cards, "centre")).toBe("far-left");
    expect(nearestIn(from, "up", cards, "centre")).toBeNull();
  });
});

describe("visibleWorld", () => {
  it("is the screen in world units", () => {
    expect(visibleWorld({ x: -200, y: 100, zoom: 2 }, screen)).toEqual({ x: 100, y: -50, width: 500, height: 400 });
  });
});
