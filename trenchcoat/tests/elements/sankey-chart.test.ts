/*
 * <tc-sankey-chart> in real browsers: the shared chart behaviour (chart-kit), the columns and the emphasised node with
 * its flows, highlight and what pointing at a node does, node width and hidden labels, the entrance and a data change,
 * and the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/sankey-chart";
import type { TcSankeyChart } from "../../src/elements/sankey-chart";
import { SankeyChart } from "../../src/elements/react/sankey-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const FLOWS = [
  { source: "Federal", target: "Genomics", value: 6 },
  { source: "Federal", target: "Imaging", value: 3 },
  { source: "Foundation", target: "Imaging", value: 2 },
  { source: "Genomics", target: "Staff", value: 4 },
  { source: "Genomics", target: "Compute", value: 2 },
  { source: "Imaging", target: "Staff", value: 3 },
  { source: "Imaging", target: "Compute", value: 2 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcSankeyChart>(
    html`<div style="width: 640px"><tc-sankey-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Grant funding" .data=${o.data ?? FLOWS}></tc-sankey-chart></div>`,
  ).then((w) => w.querySelector("tc-sankey-chart")!);
const nodes = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-snk__node")];
const flows = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-snk__flow")];
const ACCENT = "var(--tc-plot-accent)";

describe("tc-sankey-chart", () => {
  chartBasics({ tag: "tc-sankey-chart", ui: "snk", kind: "Sankey diagram", make: make as never, marks: 13, firstRead: /^Federal: 9, 1 of 13/ });

  test("columns by step; the largest last node and its flows take the accent; names beside, values under", async () => {
    const el = await drawn(await make({ still: true }));
    const ns = nodes(el);
    expect(ns).toHaveLength(6);
    expect(flows(el)).toHaveLength(7);
    const x = ns.map((n) => Math.round(n.getBBox().x));
    // Federal, Genomics, Imaging, Foundation, Staff, Compute: sources left, the middle column, spending right
    expect(x[0]).toBe(x[3]);
    expect(x[1]).toBe(x[2]);
    expect(x[4]).toBe(x[5]);
    expect(x[0]).toBeLessThan(x[1]);
    expect(x[1]).toBeLessThan(x[4]);
    expect(ns.map((n) => n.style.fill === ACCENT)).toEqual([false, false, false, false, true, false]);
    expect(flows(el).filter((p) => p.style.fill === ACCENT)).toHaveLength(2);
    // The middle column's names sit on a backing over the flows
    expect(el.querySelectorAll(".ui-snk__backing")).toHaveLength(2);
    expect([...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent)).toContain("Staff");
    expect(el.querySelector(".tc-chart__value[data-strong]")!.textContent).toBe("Staff");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("6 nodes, 7 flows. Largest flows: Federal → Genomics 6, Genomics → Staff 4, Federal → Imaging 3");
  });

  test("highlight picks a node; pointing at it lights its flows and its tooltip counts them", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "Federal";
    await settle();
    expect(nodes(el)[0].style.fill).toBe(ACCENT);
    expect(flows(el).filter((p) => p.style.fill === ACCENT)).toHaveLength(2);
    key(plot(el), "ArrowRight");
    await settle();
    const op = flows(el).map((p) => Number(p.getAttribute("opacity")));
    expect(op.filter((o) => o === 0.75)).toHaveLength(2);
    expect(op.filter((o) => o === 0.12)).toHaveLength(5);
    expect([...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Total 9", "Out 2 flows"]);
  });

  test("the keyboard reaches the flows after the nodes; node width and hidden labels", async () => {
    const el = await drawn(await make({ still: true }));
    key(plot(el), "End");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Imaging → Compute: 2, 13 of 13");
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("Imaging → Compute");
    expect(el.querySelector(".ui-snk__flow[data-focus]")).not.toBeNull();
    el.nodeWidth = 20;
    el.hideLabels = true;
    await settle();
    expect(Math.round(nodes(el)[0].getBBox().width)).toBe(20);
    expect(el.querySelectorAll(".tc-chart__value, .tc-chart__tick")).toHaveLength(0);
  });

  test("the entrance opens the nodes and draws the flows; a data change glides", async () => {
    const el = await drawn(await make());
    const h = () => nodes(el)[0].getBBox().height;
    await expect.poll(() => flows(el).length, { timeout: 4000 }).toBe(7);
    await expect.poll(h, { timeout: 4000 }).toBeGreaterThan(100);
    const before = h();
    el.data = FLOWS.map((d) => (d.source === "Federal" ? { ...d, value: d.value / 3 } : d));
    await settle();
    await expect.poll(h, { timeout: 4000 }).toBeLessThan(before * 0.7);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "640px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(SankeyChart, { title: "Funding", data: FLOWS, still: true, nodePadding: 20, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcSankeyChart>("tc-sankey-chart")!;
    expect(el.heading).toBe("Funding");
    expect(el.nodePadding).toBe(20);
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(SankeyChart, { title: "Funding", data: FLOWS, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Federal"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
