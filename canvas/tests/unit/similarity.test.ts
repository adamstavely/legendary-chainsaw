import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CARD, intersects, type Rect } from "../../src/canvas/geometry";
import { blockSize, kmeans, orderWithin, placeBlocks, seeded, similarLayout } from "../../src/canvas/similarity";
import { SIMILARITY, lookAlikesOf } from "../../src/data/lookalikes";
import { PIECES } from "../../src/data/pieces";

describe("seeded", () => {
  it("gives the same sequence for the same seed", () => {
    const a = seeded(7);
    const b = seeded(7);
    const run = (r: () => number) => Array.from({ length: 5 }, r);
    expect(run(a)).toEqual(run(b));
    expect(run(seeded(8))).not.toEqual(run(seeded(7)));
  });
});

describe("kmeans", () => {
  it("separates two clear groups, numbered by first member", () => {
    const points = [
      [0, 0],
      [10, 10],
      [0.2, 0.1],
      [10.1, 9.9],
      [0.1, 0.3],
    ];
    expect(kmeans(points, 2, seeded(1))).toEqual([0, 1, 0, 1, 0]);
    expect(kmeans(points, 2, seeded(99))).toEqual([0, 1, 0, 1, 0]);
  });
});

describe("orderWithin", () => {
  it("reads like the map: rows top to bottom, each left to right", () => {
    const at: Record<string, [number, number]> = { a: [5, 0], b: [1, 1], c: [9, 9], d: [0, 8] };
    expect(orderWithin(["a", "b", "c", "d"], (m) => at[m], 2)).toEqual(["b", "a", "d", "c"]);
  });
});

describe("placeBlocks", () => {
  it("keeps every block clear of the others and starts at 0, 0", () => {
    const blocks = Array.from({ length: 12 }, (_, i) => ({ ...blockSize(5 + i), centre: [i % 3, i % 2] as const }));
    const corners = placeBlocks(blocks, 100);
    expect(Math.min(...corners.map((c) => c.x))).toBe(0);
    expect(Math.min(...corners.map((c) => c.y))).toBe(0);
    const rects = corners.map((c, i) => ({ x: c.x - 49, y: c.y - 49, width: blocks[i].width + 98, height: blocks[i].height + 98 }));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) expect(intersects(rects[i], rects[j])).toBe(false);
  });
});

describe("similarLayout", () => {
  const data = { clusters: [{ label: "Like A", columns: 2, x: 0, y: 0, ids: ["a", "b", "c"] }] };

  it("places each group's cards in its block", () => {
    const { cards, sections } = similarLayout(data, ["a", "b", "c"]);
    expect(sections.map((s) => s.label)).toEqual(["Like A"]);
    expect(cards.get("b")!.x).toBe(CARD.width + 32);
    expect(cards.get("c")!.y).toBeGreaterThan(cards.get("a")!.y);
  });

  it("leaves a filtered-out piece's place empty, and puts unseen pieces in their own block below", () => {
    const { cards, sections } = similarLayout(data, ["c", "new"]);
    expect([...cards.keys()]).toEqual(["c", "new"]);
    expect(cards.get("c")!.y).toBeGreaterThan(0);
    expect(sections.map((s) => s.label)).toEqual(["Like A", "Not compared yet"]);
    expect(sections[1].rect.y).toBeGreaterThan(sections[0].rect.y + sections[0].rect.height);
  });
});

// src/data/similarity.json is written by npm run similarity; it has to keep up with the thumbnails
describe("the similarity data", () => {
  const thumb = (library: string, slug: string) => fileURLToPath(new URL(`../../../trenchcoat/app/src/thumbs/${library}/${slug}.light.webp`, import.meta.url));
  const pieces = PIECES.filter((p) => existsSync(thumb(p.library, p.slug)));

  it("matches every thumbnail (run npm run similarity if not)", () => {
    const stale = pieces.filter(
      (p) =>
        SIMILARITY.thumbs[p.id] !==
        createHash("sha1")
          .update(readFileSync(thumb(p.library, p.slug)))
          .digest("hex")
          .slice(0, 12),
    );
    expect(stale.map((p) => p.id)).toEqual([]);
    expect(Object.keys(SIMILARITY.thumbs).sort()).toEqual(pieces.map((p) => p.id).sort());
  });

  it("puts every piece in exactly one group, with no two groups overlapping", () => {
    const ids = SIMILARITY.clusters.flatMap((c) => c.ids);
    expect(ids.sort()).toEqual(pieces.map((p) => p.id).sort());
    const { sections } = similarLayout(SIMILARITY, ids);
    const rects: Rect[] = sections.map((s) => s.rect);
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) expect(intersects(rects[i], rects[j])).toBe(false);
  });

  it("lists look-alikes both ways", () => {
    for (const [a, b] of SIMILARITY.duplicates) {
      expect(lookAlikesOf(a).map((x) => x.id)).toContain(b);
      expect(lookAlikesOf(b).map((x) => x.id)).toContain(a);
    }
  });
});
