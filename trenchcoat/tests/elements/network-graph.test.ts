/*
 * <tc-network-graph> in real browsers: the force layout on its own (the same graph twice, no overlaps, linked nodes
 * closer, the quadtree path), then the shared chart behaviour (chart-kit), nodes read from link rows, the same picture
 * from two renders, groups in their own inks with a legend, a node's neighbourhood lit, names on chips, dragging a node
 * to pin it and double-clicking to let it go, the canvas past the threshold, a changed graph gliding, and the React
 * wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { forceLayout } from "../../src/elements/internal/chart/force";
import "../../src/elements/network-graph";
import type { NetworkNode, TcNetworkGraph } from "../../src/elements/network-graph";
import { NetworkGraph } from "../../src/elements/react/network-graph";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const PAPERS = [
  { source: "Ines", target: "Ravi", value: 3 },
  { source: "Ines", target: "Sofia", value: 1 },
  { source: "Ines", target: "Tomas", value: 2 },
  { source: "Ravi", target: "Sofia", value: 1 },
  { source: "Tomas", target: "Leah", value: 1 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcNetworkGraph>(
    html`<div style="width: 560px"><tc-network-graph look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Co-authors" .data=${o.data ?? PAPERS}></tc-network-graph></div>`,
  ).then((w) => w.querySelector("tc-network-graph")!);
const circles = (el: Element) => [...el.querySelectorAll<SVGCircleElement>(".ui-nwg__node")];
const links = (el: Element) => [...el.querySelectorAll<SVGLineElement>(".ui-nwg__link")];
const num = (c: Element, a: string) => Number(c.getAttribute(a));
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent!.trim();

/** Two groups of four, every pair inside each linked, and one link between them */
function twoCliques() {
  const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ls: { source: number; target: number }[] = [];
  for (const base of [0, 4]) for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) ls.push({ source: base + i, target: base + j });
  ls.push({ source: 3, target: 4 });
  return { nodes: ids.map((id) => ({ id, r: 6 })), links: ls };
}

describe("force layout", () => {
  test("the same graph gives the same positions, inside the box, with no two circles overlapping", () => {
    const nodes = Array.from({ length: 60 }, (_, i) => ({ id: `n${i}`, r: 4 + (i % 5) }));
    const ls = Array.from({ length: 80 }, (_, k) => ({ source: (k * 7) % 60, target: (k * 13 + 5) % 60, value: 1 + (k % 3) }));
    const a = forceLayout(nodes, ls, { width: 500, height: 360 });
    const b = forceLayout(nodes, ls, { width: 500, height: 360 });
    expect([...a.x]).toEqual([...b.x]);
    expect([...a.y]).toEqual([...b.y]);
    for (let i = 0; i < 60; i++) {
      expect(a.x[i] - nodes[i].r).toBeGreaterThanOrEqual(-0.5);
      expect(a.x[i] + nodes[i].r).toBeLessThanOrEqual(500.5);
      expect(a.y[i] - nodes[i].r).toBeGreaterThanOrEqual(-0.5);
      expect(a.y[i] + nodes[i].r).toBeLessThanOrEqual(360.5);
      for (let j = i + 1; j < 60; j++) expect(Math.hypot(a.x[i] - a.x[j], a.y[i] - a.y[j])).toBeGreaterThan(nodes[i].r + nodes[j].r - 0.5);
    }
  });

  test("linked nodes end up closer than unlinked ones; a pinned node stays put", () => {
    const { nodes, links: ls } = twoCliques();
    const p = forceLayout(nodes, ls, { width: 400, height: 300 });
    const linked = new Set(ls.map((l) => `${l.source}-${l.target}`));
    const near: number[] = [];
    const far: number[] = [];
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) (linked.has(`${i}-${j}`) ? near : far).push(Math.hypot(p.x[i] - p.x[j], p.y[i] - p.y[j]));
    const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
    expect(mean(near)).toBeLessThan(mean(far) * 0.75);
    const pinned = forceLayout(nodes.map((d, i) => (i === 0 ? { ...d, fx: 30, fy: 40 } : d)), ls, { width: 400, height: 300 });
    expect([pinned.x[0], pinned.y[0]]).toEqual([30, 40]);
  });

  test("a big graph goes through the quadtree and still lands in the box, starting from an earlier layout", () => {
    const nodes = Array.from({ length: 420 }, (_, i) => ({ id: `n${i}`, r: 2.5 }));
    const ls = Array.from({ length: 419 }, (_, i) => ({ source: i, target: i + 1 }));
    const a = forceLayout(nodes, ls, { width: 600, height: 400 });
    expect([...a.x, ...a.y].every(Number.isFinite)).toBe(true);
    expect(Math.min(...a.x)).toBeGreaterThan(0);
    expect(Math.max(...a.x)).toBeLessThan(600);
    const prev = new Map(nodes.map((d, i) => [d.id, [a.x[i] / 600, a.y[i] / 400] as const]));
    const b = forceLayout(nodes, ls, { width: 600, height: 400, previous: prev });
    // Warm-started, it moves little
    let moved = 0;
    for (let i = 0; i < 420; i++) moved += Math.hypot(a.x[i] - b.x[i], a.y[i] - b.y[i]);
    expect(moved / 420).toBeLessThan(40);
  });
});

describe("tc-network-graph", () => {
  chartBasics({ tag: "tc-network-graph", ui: "nwg", kind: "Network graph", make: make as never, marks: 5, firstRead: /^Ines: 3 links: Ravi, Sofia, Tomas, 1 of 5/ });

  test("nodes come from the link rows, most-linked first; the most-linked takes the accent; named on chips", async () => {
    const el = await drawn(await make({ still: true }));
    expect(circles(el)).toHaveLength(5);
    expect(links(el)).toHaveLength(5);
    expect(circles(el).filter((c) => c.style.fill === "var(--tc-plot-accent)")).toHaveLength(1);
    expect(circles(el)[0].style.fill).toBe("var(--tc-plot-accent)");
    // Every name fits at this width, each on a chip of the card's colour
    expect([...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent).sort()).toEqual(["Ines", "Leah", "Ravi", "Sofia", "Tomas"]);
    expect(el.querySelectorAll(".ui-nwg__chip")).toHaveLength(5);
    // Stronger links are wider
    const widths = links(el).map((l) => num(l, "stroke-width"));
    expect(Math.max(...widths)).toBeGreaterThan(Math.min(...widths));
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("5 nodes and 5 links. Most linked: Ines, 3 links.");
  });

  test("the same graph draws the same picture in two charts", async () => {
    const a = await drawn(await make({ still: true }));
    const b = await drawn(await make({ still: true }));
    const at = (el: Element) => circles(el).map((c) => `${c.getAttribute("cx")},${c.getAttribute("cy")}`);
    expect(at(a)).toEqual(at(b));
  });

  test("groups take the chart inks, named in a legend; the tooltip gives group, links and neighbours", async () => {
    const el = await drawn(await make({ still: true }));
    const nodes: NetworkNode[] = [
      { id: "Ines", group: "Genomics" },
      { id: "Ravi", group: "Genomics" },
      { id: "Sofia", group: "Imaging" },
      { id: "Tomas", group: "Imaging" },
      { id: "Leah", label: "Leah M.", group: "Climate" },
    ];
    el.nodes = nodes;
    await settle();
    expect([...el.querySelectorAll(".tc-chart__legend li")].map((l) => l.textContent!.trim())).toEqual(["Genomics", "Imaging", "Climate"]);
    expect(circles(el).map((c) => c.style.fill)).toEqual(["var(--tc-plot-ink-1)", "var(--tc-plot-ink-1)", "var(--tc-plot-ink-2)", "var(--tc-plot-ink-2)", "var(--tc-plot-ink-3)"]);
    key(plot(el), "End");
    await settle();
    expect(status(el)).toBe("Leah M. Climate: 1 link: Tomas, 5 of 5");
    const rows = [...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim());
    expect(rows).toEqual(["Group Climate", "Links 1", "Linked to Tomas"]);
    // The table: node, group, links
    expect(el.querySelector(".tc-sr-only tbody tr")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Ines · Genomics 3 links: Ravi, Sofia, Tomas");
  });

  test("a node's neighbourhood is lit and the rest quieted, names included", async () => {
    const el = await drawn(await make({ still: true }));
    plot(el).focus();
    key(plot(el), "ArrowRight");
    await settle();
    // Ines: linked to Ravi, Sofia and Tomas, not Leah
    expect(circles(el).filter((c) => c.hasAttribute("data-quiet"))).toHaveLength(1);
    expect(links(el).filter((l) => l.hasAttribute("data-hot"))).toHaveLength(3);
    expect(links(el).filter((l) => l.hasAttribute("data-quiet"))).toHaveLength(2);
    const leah = [...el.querySelectorAll(".tc-chart__tick, .tc-chart__value")].find((t) => t.textContent === "Leah")!;
    expect(leah.classList.contains("tc-chart__tick")).toBe(true);
    expect(el.querySelector(".tc-chart__focus")).not.toBeNull();
  });

  test("drag-nodes: a dragged node is pinned where it's dropped; double-click lets it go", async () => {
    const el = await drawn(await make({ still: true }));
    el.dragNodes = true;
    await settle();
    const svgEl = el.querySelector(".tc-chart__svg")!;
    const box = svgEl.getBoundingClientRect();
    const sx = box.width / el.querySelector<SVGSVGElement>(".tc-chart__svg")!.viewBox.baseVal.width;
    const leah = () => circles(el)[4];
    const [x0, y0] = [num(leah(), "cx"), num(leah(), "cy")];
    const p = plot(el);
    const fire = (type: string, x: number, y: number) =>
      p.dispatchEvent(new PointerEvent(type, { clientX: box.left + x * sx, clientY: box.top + y * sx, pointerId: 1, pointerType: "mouse", button: 0, bubbles: true }));
    const [tx, ty] = [x0 < 280 ? x0 + 60 : x0 - 60, y0 < 150 ? y0 + 40 : y0 - 40];
    fire("pointerdown", x0, y0);
    fire("pointermove", (x0 + tx) / 2, (y0 + ty) / 2);
    fire("pointermove", tx, ty);
    await settle();
    expect(num(leah(), "cx")).toBeCloseTo(tx, 0);
    fire("pointerup", tx, ty);
    await settle();
    expect(el.pins.has("Leah")).toBe(true);
    expect(leah().hasAttribute("data-pinned")).toBe(true);
    expect(num(leah(), "cx")).toBeCloseTo(tx, 0);
    expect(num(leah(), "cy")).toBeCloseTo(ty, 0);
    expect(el.querySelector(".tc-sr-only tbody tr:last-child")!.textContent).toContain("pinned");
    leah().parentElement!.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await settle();
    expect(el.pins.size).toBe(0);
    expect(leah().hasAttribute("data-pinned")).toBe(false);
  });

  test("past the threshold the links are painted on a canvas; the active node's stay in the drawing", async () => {
    const el = await drawn(await make({ still: true }));
    el.canvasThreshold = 3;
    await settle();
    expect(el.querySelector("canvas.tc-chart__canvas")).not.toBeNull();
    expect(links(el)).toHaveLength(0);
    expect(circles(el)).toHaveLength(5);
    key(plot(el), "ArrowRight");
    await settle();
    expect(links(el)).toHaveLength(3);
  });

  test("a changed graph starts from the last layout: the nodes already there stay near where they were", async () => {
    const el = await drawn(await make({ still: true }));
    const before = circles(el).map((c) => [num(c, "cx"), num(c, "cy")]);
    el.data = [...PAPERS, { source: "Leah", target: "Omar", value: 2 }, { source: "Omar", target: "Ravi", value: 1 }];
    await settle();
    expect(circles(el)).toHaveLength(6);
    // The marks keep their first-seen order: the five from before, then Omar
    const after = circles(el).slice(0, 5).map((c) => [num(c, "cx"), num(c, "cy")]);
    const moved = after.reduce((s, [x, y], k) => s + Math.hypot(x - before[k][0], y - before[k][1]), 0) / 5;
    expect(moved).toBeLessThan(90);
    expect(el.querySelectorAll(".tc-sr-only tbody tr")).toHaveLength(6);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "560px";
    const root = createRoot(host);
    const clicks: string[] = [];
    const nodes = [{ id: "Ines", group: "Genomics" }, { id: "Ravi", group: "Imaging" }];
    const ls = [{ source: "Ines", target: "Ravi", value: 2 }];
    await act(async () => root.render(React.createElement(NetworkGraph, { title: "Co-authors", nodes, links: ls, dragNodes: true, maxLabels: 4, still: true, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcNetworkGraph>("tc-network-graph")!;
    expect(el.heading).toBe("Co-authors");
    expect(el.dragNodes).toBe(true);
    expect(el.maxLabels).toBe(4);
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(NetworkGraph, { title: "Co-authors", nodes, links: ls, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Ines"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
