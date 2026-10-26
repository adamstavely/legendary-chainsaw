/*
 * The column layout shared by lineage-graph and playbook-canvas (src/elements/internal/layered-graph.ts).
 */
import { describe, expect, test } from "vitest";
import { crossings, layoutColumns } from "../../src/elements/internal/layered-graph";

const o = { nodeWidth: 100, nodeHeight: 40, columnGap: 50, rowGap: 10 };

describe("layoutColumns", () => {
  test("places columns left to right and centres short columns", () => {
    const { nodes, width, height } = layoutColumns([{ id: "a", column: 0 }, { id: "b", column: 1 }, { id: "c", column: 1 }], [], o);
    const at = Object.fromEntries(nodes.map((n) => [n.id, n]));
    expect(width).toBe(250);
    expect(height).toBe(90);
    expect(at.a.x).toBe(0);
    expect(at.b.x).toBe(150);
    expect(at.a.y).toBe(25);
  });

  test("orders a column by what feeds it, removing crossings", () => {
    const inputs = [
      { id: "q1", column: 0 }, { id: "q2", column: 0 },
      { id: "c2", column: 1 }, { id: "c1", column: 1 },
    ];
    const links = [{ from: "q1", to: "c1" }, { from: "q2", to: "c2" }];
    const { nodes, edges } = layoutColumns(inputs, links, o);
    expect(crossings(nodes, edges)).toBe(0);
    expect(nodes.find((n) => n.id === "c1")!.row).toBe(0);
  });

  test("edges run right edge to left edge and keep weak", () => {
    const { edges } = layoutColumns([{ id: "a", column: 0 }, { id: "b", column: 1 }], [{ from: "a", to: "b", weak: true }, { from: "a", to: "missing" }], o);
    expect(edges).toHaveLength(1);
    expect(edges[0].weak).toBe(true);
    expect(edges[0].path.startsWith("M100 ")).toBe(true);
  });
});
