// The Graph layout: pieces joined by what they're built from. A piece that uses others sits above them, in rows by how
// deep its parts go – parts at the bottom, the pieces built from them above – so every link points down. Pieces that
// neither use nor are used by another come last, in a block of their own.
import { CARD, GAP, type Layout, type Rect, type Section } from "./geometry";
import { TITLE } from "./similarity";

/** [user, used]: the first piece is built with the second */
export type Link = readonly [string, string];

/** How far down a piece's parts go: 0 for a piece built from none, otherwise one more than its deepest part */
export function heights(nodes: Iterable<string>, links: readonly Link[]): Map<string, number> {
  const uses = new Map<string, string[]>();
  for (const [a, b] of links) uses.set(a, [...(uses.get(a) ?? []), b]);
  const out = new Map<string, number>();
  const visiting = new Set<string>();
  const height = (n: string): number => {
    if (out.has(n)) return out.get(n)!;
    // A cycle (A uses B uses A) would never end: the link back counts as nothing
    if (visiting.has(n)) return -1;
    visiting.add(n);
    const h = Math.max(-1, ...(uses.get(n) ?? []).map(height)) + 1;
    visiting.delete(n);
    out.set(n, h);
    return h;
  };
  for (const n of nodes) height(n);
  return out;
}

export const rowLabel = (height: number) =>
  height === 0 ? "Parts – used inside other pieces" : height === 1 ? "Built from parts" : `Built from parts, ${height} levels deep`;

/**
 * Orders each row so linked pieces line up: a few sweeps down and up, each placing a piece at the average position of
 * the pieces it's linked to in the row before (the barycentre heuristic). Pieces with no link there keep their place
 */
export function orderRows(rows: string[][], links: readonly Link[], sweeps = 4): string[][] {
  const neighbours = (n: string, row: readonly string[]) => {
    const inRow = new Set(row);
    return links.flatMap(([a, b]) => (a === n && inRow.has(b) ? [b] : b === n && inRow.has(a) ? [a] : []));
  };
  const out = rows.map((r) => [...r]);
  const sweep = (from: number, to: number) => {
    const at = new Map(out[from].map((n, i) => [n, i / Math.max(1, out[from].length - 1)]));
    const own = new Map(out[to].map((n, i) => [n, i / Math.max(1, out[to].length - 1)]));
    const key = (n: string) => {
      const ns = neighbours(n, out[from]);
      return ns.length ? ns.reduce((s, m) => s + at.get(m)!, 0) / ns.length : own.get(n)!;
    };
    const keys = new Map(out[to].map((n) => [n, key(n)]));
    out[to].sort((a, b) => keys.get(a)! - keys.get(b)!);
  };
  for (let s = 0; s < sweeps; s++) {
    for (let r = 1; r < out.length; r++) sweep(r - 1, r);
    for (let r = out.length - 2; r >= 0; r--) sweep(r + 1, r);
  }
  return out;
}

export type GraphLayout = Layout & { links: Link[] };

/**
 * Lays out `ids` (in the order given) with their links: the linked pieces in rows by height, deepest builders at the
 * top, each row centred and wrapped at `perLine` cards; then the pieces with no links, in a wider block so a long
 * tail of them doesn't stretch the map into a column
 */
export function graphLayout(ids: readonly string[], allLinks: readonly Link[], perLine = 12): GraphLayout {
  const show = new Set(ids);
  const seen = new Set<string>();
  const links = allLinks.filter(([a, b]) => show.has(a) && show.has(b) && a !== b && !seen.has(`${a}>${b}`) && seen.add(`${a}>${b}`));
  const linked = new Set(links.flat());
  const height = heights(
    ids.filter((id) => linked.has(id)),
    links,
  );
  const top = Math.max(-1, ...height.values());
  const rows = orderRows(
    Array.from({ length: top + 1 }, (_, i) => ids.filter((id) => height.get(id) === top - i)),
    links,
  );
  const alone = ids.filter((id) => !linked.has(id));
  const blocks = [
    ...rows.map((row, i) => ({ label: rowLabel(top - i), ids: row, columns: perLine })),
    { label: "Stands alone", ids: alone, columns: Math.max(perLine, Math.ceil(Math.sqrt(alone.length * 1.6))) },
  ].filter((b) => b.ids.length);

  const cards = new Map<string, Rect>();
  const sections: Section[] = [];
  const widthOf = (n: number, columns: number) => Math.min(n, columns) * (CARD.width + GAP) - GAP;
  const widest = Math.max(0, ...blocks.map((b) => widthOf(b.ids.length, b.columns)));
  let y = 0;
  for (const block of blocks) {
    const width = widthOf(block.ids.length, block.columns);
    const lines = Math.ceil(block.ids.length / block.columns);
    const x = (widest - width) / 2;
    const height = TITLE + lines * (CARD.height + GAP) - GAP;
    sections.push({ label: block.label, rect: { x, y, width, height }, ids: block.ids });
    block.ids.forEach((id, i) => {
      cards.set(id, {
        x: x + (i % block.columns) * (CARD.width + GAP),
        y: y + TITLE + Math.floor(i / block.columns) * (CARD.height + GAP),
        width: CARD.width,
        height: CARD.height,
      });
    });
    // A wide gap between rows leaves room for the links that cross it
    y += height + GAP * 6;
  }
  return { cards, sections, links };
}

/** A link drawn from the bottom of the piece that uses to the top of the part it uses */
export function linkPath(from: Rect, to: Rect): string {
  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height;
  const x2 = to.x + to.width / 2;
  const y2 = to.y;
  const bend = Math.max(40, (y2 - y1) / 2);
  return `M ${x1} ${y1} C ${x1} ${y1 + bend} ${x2} ${y2 - bend} ${x2} ${y2}`;
}
