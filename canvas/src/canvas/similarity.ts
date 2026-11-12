// Sorting pieces by how they look. scripts/similarity.mjs embeds every thumbnail with CLIP and uses the helpers here
// to group and place them; it writes the result to src/data/similarity.json, which the Similar layout reads. All of
// it is deterministic – a fixed seed, no Math.random – so the same thumbnails always give the same map.
import { CARD, GAP, type Layout, type Rect, type Section } from "./geometry";

/** What the similarity script writes */
export type SimilarityData = {
  /** The model the embeddings came from */
  model: string;
  /** A short hash of each light thumbnail, to tell when the data is stale */
  thumbs: Record<string, string>;
  /** Groups of look-alike pieces, each a block of cards placed near the groups it most resembles */
  clusters: { label: string; columns: number; x: number; y: number; ids: string[] }[];
  /** Each piece's closest look-alikes, nearest first, with their cosine similarity */
  neighbours: Record<string, [id: string, similarity: number][]>;
  /** Pairs that look almost the same: candidates to merge or tell apart */
  duplicates: [a: string, b: string, similarity: number][];
};

/** The space above a group's cards for its label, as in the Grid layout */
export const TITLE = 56;

/** A seeded random number generator (mulberry32): the same seed gives the same sequence */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const dot = (a: ArrayLike<number>, b: ArrayLike<number>) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

export function normalise(v: ArrayLike<number>): number[] {
  const n = Math.sqrt(dot(v, v)) || 1;
  return Array.from(v, (x) => x / n);
}

const distance = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0);

/**
 * k-means (squared Euclidean), seeded with k-means++. Returns each point's group; groups are numbered in order of
 * their first member, so the numbering doesn't depend on the seeding
 */
export function kmeans(points: readonly (readonly number[])[], k: number, random: () => number, iterations = 100): number[] {
  const n = points.length;
  k = Math.min(k, n);
  const centres: (readonly number[])[] = [points[Math.floor(random() * n)]];
  while (centres.length < k) {
    const d = points.map((p) => Math.min(...centres.map((c) => distance(p, c))));
    let r = random() * d.reduce((a, b) => a + b, 0);
    let i = 0;
    while (i < n - 1 && (r -= d[i]) > 0) i++;
    centres.push(points[i]);
  }
  let assigned = new Array<number>(n).fill(-1);
  for (let round = 0; round < iterations; round++) {
    const next = points.map((p) => {
      let best = 0;
      for (let c = 1; c < k; c++) if (distance(p, centres[c]) < distance(p, centres[best])) best = c;
      return best;
    });
    if (next.every((c, i) => c === assigned[i])) break;
    assigned = next;
    for (let c = 0; c < k; c++) {
      const members = points.filter((_, i) => assigned[i] === c);
      if (members.length) centres[c] = members[0].map((_, d) => members.reduce((s, m) => s + m[d], 0) / members.length);
    }
  }
  const order = new Map<number, number>();
  return assigned.map((c) => (order.has(c) ? order.get(c)! : (order.set(c, order.size), order.size - 1)));
}

/** A group's block: a few columns wide, like the Grid layout's sections */
export function blockSize(count: number): { columns: number; width: number; height: number } {
  const columns = Math.min(count, Math.max(2, Math.ceil(Math.sqrt(count * 1.2))));
  const rows = Math.ceil(count / columns);
  return { columns, width: columns * CARD.width + (columns - 1) * GAP, height: TITLE + rows * CARD.height + (rows - 1) * GAP };
}

/** Orders a group's members to read like the 2-D map: top to bottom in rows of `columns`, each row left to right */
export function orderWithin<T>(members: readonly T[], at: (m: T) => readonly [number, number], columns: number): T[] {
  const byY = [...members].sort((a, b) => at(a)[1] - at(b)[1]);
  const out: T[] = [];
  for (let i = 0; i < byY.length; i += columns) out.push(...byY.slice(i, i + columns).sort((a, b) => at(a)[0] - at(b)[0]));
  return out;
}

/**
 * Places blocks near their target centres (a 2-D map of the groups, any scale), then pushes overlapping blocks apart
 * until every pair is at least `margin` apart. Returns each block's top-left corner, with the whole set starting at 0, 0
 */
export function placeBlocks(
  blocks: readonly { width: number; height: number; centre: readonly [number, number] }[],
  margin = GAP * 4,
): { x: number; y: number }[] {
  if (!blocks.length) return [];
  // Spread the map so it covers about the blocks' own area, landscape
  const xs = blocks.map((b) => b.centre[0]);
  const ys = blocks.map((b) => b.centre[1]);
  const span = (v: number[]) => Math.max(...v) - Math.min(...v) || 1;
  const area = blocks.reduce((s, b) => s + (b.width + margin) * (b.height + margin), 0);
  const height = Math.sqrt(area / 1.6);
  const width = height * 1.6;
  const rects = blocks.map((b) => ({
    x: ((b.centre[0] - Math.min(...xs)) / span(xs)) * width - b.width / 2,
    y: ((b.centre[1] - Math.min(...ys)) / span(ys)) * height - b.height / 2,
    width: b.width,
    height: b.height,
  }));
  for (let pass = 0; pass < 2000; pass++) {
    let moved = false;
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) + margin;
        const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) + margin;
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        // Apart along the axis that needs the shorter push, each block half the way
        if (ox / width < oy / height) {
          const s = a.x + a.width / 2 <= b.x + b.width / 2 ? 1 : -1;
          a.x -= (s * ox) / 2;
          b.x += (s * ox) / 2;
        } else {
          const s = a.y + a.height / 2 <= b.y + b.height / 2 ? 1 : -1;
          a.y -= (s * oy) / 2;
          b.y += (s * oy) / 2;
        }
      }
    if (!moved) break;
  }
  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  return rects.map((r) => ({ x: Math.round(r.x - minX), y: Math.round(r.y - minY) }));
}

/**
 * Similar: each group a block of cards where the script placed it. Only `ids` are shown; a filtered-out piece leaves
 * its place empty, so the map keeps its shape. Pieces the script hasn't seen (no thumbnail yet) go in a last block
 * under the map
 */
export function similarLayout(data: Pick<SimilarityData, "clusters">, ids: readonly string[]): Layout {
  const show = new Set(ids);
  const cards = new Map<string, Rect>();
  const sections: Section[] = [];
  for (const cluster of data.clusters) {
    const shown = cluster.ids.filter((id) => show.has(id));
    if (!shown.length) continue;
    const { width, height } = blockSize(cluster.ids.length);
    sections.push({ label: cluster.label, rect: { x: cluster.x, y: cluster.y, width, height }, ids: shown });
    cluster.ids.forEach((id, i) => {
      if (show.has(id))
        cards.set(id, {
          x: cluster.x + (i % cluster.columns) * (CARD.width + GAP),
          y: cluster.y + TITLE + Math.floor(i / cluster.columns) * (CARD.height + GAP),
          width: CARD.width,
          height: CARD.height,
        });
    });
  }
  const rest = ids.filter((id) => !cards.has(id));
  if (rest.length) {
    const bottom = Math.max(0, ...sections.map((s) => s.rect.y + s.rect.height)) + GAP * 4;
    const { columns, width, height } = blockSize(rest.length);
    sections.push({ label: "Not compared yet", rect: { x: 0, y: bottom, width, height }, ids: rest });
    rest.forEach((id, i) =>
      cards.set(id, {
        x: (i % columns) * (CARD.width + GAP),
        y: bottom + TITLE + Math.floor(i / columns) * (CARD.height + GAP),
        width: CARD.width,
        height: CARD.height,
      }),
    );
  }
  return { cards, sections };
}
