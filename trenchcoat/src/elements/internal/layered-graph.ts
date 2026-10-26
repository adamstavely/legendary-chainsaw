/*
 * Layout for graphs drawn in columns (remediation 5.0): lineage-graph's run → turn → query → chunk → claim →
 * artifact, playbook-canvas's phases. Pure – no DOM – so it's unit-tested and runs anywhere.
 *
 *   const { nodes, edges, width, height } = layoutColumns(
 *     [{ id: "run", column: 0 }, { id: "q1", column: 1 }, …],
 *     [{ from: "run", to: "q1" }, { from: "q1", to: "c3", weak: true }],
 *     { nodeWidth: 168, nodeHeight: 52, columnGap: 64, rowGap: 14 },
 *   );
 *
 * Within each column nodes are ordered by the average position of what feeds them (a barycentre pass, forward then
 * back), which removes most edge crossings in a layered graph. Edges are cubic curves from a node's right edge to
 * the next node's left edge; `weak` carries through for a dashed line.
 */

export type GraphNodeInput = { id: string; column: number };
export type GraphEdgeInput = { from: string; to: string; weak?: boolean };
export type GraphOptions = { nodeWidth: number; nodeHeight: number; columnGap: number; rowGap: number; padding?: number };
export type PlacedNode = { id: string; column: number; row: number; x: number; y: number; width: number; height: number };
export type PlacedEdge = { from: string; to: string; weak: boolean; path: string };

export function layoutColumns(inputs: GraphNodeInput[], links: GraphEdgeInput[], o: GraphOptions) {
  const pad = o.padding ?? 0;
  const columns = new Map<number, string[]>();
  for (const n of inputs) columns.set(n.column, [...(columns.get(n.column) ?? []), n.id]);
  const order = [...columns.keys()].sort((a, b) => a - b);
  const rowOf = new Map<string, number>();
  for (const c of order) columns.get(c)!.forEach((id, i) => rowOf.set(id, i));

  const into = new Map<string, string[]>();
  const outOf = new Map<string, string[]>();
  for (const e of links) {
    into.set(e.to, [...(into.get(e.to) ?? []), e.from]);
    outOf.set(e.from, [...(outOf.get(e.from) ?? []), e.to]);
  }
  /** Re-order a column by the mean row of its neighbours on one side; nodes without any keep their place */
  const sweep = (column: number, neighbours: Map<string, string[]>) => {
    const ids = columns.get(column)!;
    const score = (id: string) => {
      const near = (neighbours.get(id) ?? []).filter((n) => rowOf.has(n));
      return near.length ? near.reduce((sum, n) => sum + rowOf.get(n)!, 0) / near.length : rowOf.get(id)!;
    };
    const sorted = ids.map((id, i) => ({ id, s: score(id), i })).sort((a, b) => a.s - b.s || a.i - b.i).map((x) => x.id);
    columns.set(column, sorted);
    sorted.forEach((id, i) => rowOf.set(id, i));
  };
  for (const c of order.slice(1)) sweep(c, into);
  for (const c of order.slice(0, -1).reverse()) sweep(c, outOf);

  const tallest = Math.max(1, ...order.map((c) => columns.get(c)!.length));
  const height = pad * 2 + tallest * o.nodeHeight + (tallest - 1) * o.rowGap;
  const nodes = new Map<string, PlacedNode>();
  order.forEach((c, ci) => {
    const ids = columns.get(c)!;
    // Shorter columns are centred against the tallest one
    const top = pad + ((tallest - ids.length) * (o.nodeHeight + o.rowGap)) / 2;
    ids.forEach((id, row) => nodes.set(id, { id, column: c, row, x: pad + ci * (o.nodeWidth + o.columnGap), y: top + row * (o.nodeHeight + o.rowGap), width: o.nodeWidth, height: o.nodeHeight }));
  });
  const width = pad * 2 + order.length * o.nodeWidth + Math.max(0, order.length - 1) * o.columnGap;

  const edges: PlacedEdge[] = links
    .filter((e) => nodes.has(e.from) && nodes.has(e.to))
    .map((e) => {
      const a = nodes.get(e.from)!;
      const b = nodes.get(e.to)!;
      const x1 = a.x + a.width;
      const y1 = a.y + a.height / 2;
      const x2 = b.x;
      const y2 = b.y + b.height / 2;
      const bend = Math.max(16, (x2 - x1) / 2);
      return { from: e.from, to: e.to, weak: !!e.weak, path: `M${x1} ${y1} C${x1 + bend} ${y1} ${x2 - bend} ${y2} ${x2} ${y2}` };
    });
  return { nodes: [...nodes.values()], edges, width, height };
}

/** How many pairs of edges between the same two columns cross – for tests and for choosing between layouts */
export function crossings(nodes: PlacedNode[], edges: PlacedEdge[]) {
  const at = new Map(nodes.map((n) => [n.id, n]));
  let count = 0;
  for (let i = 0; i < edges.length; i++)
    for (let j = i + 1; j < edges.length; j++) {
      const [a1, a2, b1, b2] = [at.get(edges[i].from)!, at.get(edges[i].to)!, at.get(edges[j].from)!, at.get(edges[j].to)!];
      if (a1.column !== b1.column || a2.column !== b2.column) continue;
      if ((a1.row - b1.row) * (a2.row - b2.row) < 0) count++;
    }
  return count;
}
