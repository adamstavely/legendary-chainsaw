/*
 * <tc-venn-diagram> in real browsers: the shared chart behaviour (chart-kit), the lens geometry, circles sized by
 * their sets and pairs overlapping by about their shared size, each region's own count on a chip, the region lit from
 * the keyboard, two sets, more than three, the entrance, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/venn-diagram";
import { distanceFor, lensArea, type TcVennDiagram } from "../../src/elements/venn-diagram";
import { VennDiagram } from "../../src/elements/react/venn-diagram";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

// Researchers by lab: Genomics only 43, Imaging only 30, Proteomics only 21; two labs only 10, 7 and 4; all three 4
const DATA = [
  { sets: ["Genomics"], size: 64 },
  { sets: ["Imaging"], size: 48 },
  { sets: ["Proteomics"], size: 36 },
  { sets: ["Genomics", "Imaging"], size: 14 },
  { sets: ["Proteomics", "Genomics"], size: 11 },
  { sets: ["Imaging", "Proteomics"], size: 8 },
  { sets: ["Genomics", "Imaging", "Proteomics"], size: 4 },
];

const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcVennDiagram>(
    html`<div style="width: 600px"><tc-venn-diagram look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Researchers by lab" .data=${o.data ?? DATA}></tc-venn-diagram></div>`,
  ).then((w) => w.querySelector("tc-venn-diagram")!);
const circles = (el: Element) =>
  [...el.querySelectorAll<SVGCircleElement>(".ui-vnn__circle")].map((c) => ({ x: Number(c.getAttribute("cx")), y: Number(c.getAttribute("cy")), r: Number(c.getAttribute("r")) }));
const chips = (el: Element) => [...el.querySelectorAll(".ui-vnn__chip text")].map((t) => t.textContent);
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent!.trim();
const tipRows = (el: Element) => [...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim());

describe("lens geometry", () => {
  test("the lens is all of the smaller circle when inside, nothing when apart, and shrinks with distance", () => {
    expect(lensArea(2, 1, 0.5)).toBeCloseTo(Math.PI, 6);
    expect(lensArea(1, 1, 2.5)).toBe(0);
    expect(lensArea(1, 1, 0.5)).toBeGreaterThan(lensArea(1, 1, 1));
    // Two unit circles a radius apart share 2π/3 − √3/2
    expect(lensArea(1, 1, 1)).toBeCloseTo((2 * Math.PI) / 3 - Math.sqrt(3) / 2, 6);
  });

  test("distanceFor finds the distance for an overlap, and parts circles that share nothing", () => {
    const d = distanceFor(3, 2, 4);
    expect(lensArea(3, 2, d)).toBeCloseTo(4, 4);
    expect(distanceFor(3, 2, 0)).toBeGreaterThan(5);
    expect(distanceFor(3, 2, 100)).toBe(1);
  });
});

describe("tc-venn-diagram", () => {
  chartBasics({ tag: "tc-venn-diagram", ui: "vnn", kind: "Venn diagram", make: make as never, marks: 7, firstRead: /^Genomics only: 43 \(36%\)/ });

  test("circles sized by their sets; each pair overlaps by about what it shares", async () => {
    const el = await drawn(await make({ still: true }));
    const [g, i, p] = circles(el);
    const area = (c: { r: number }) => Math.PI * c.r * c.r;
    expect(area(i) / area(g)).toBeCloseTo(48 / 64, 3);
    expect(area(p) / area(g)).toBeCloseTo(36 / 64, 3);
    const lens = (a: typeof g, b: typeof g) => lensArea(a.r, b.r, Math.hypot(a.x - b.x, a.y - b.y));
    expect(lens(g, i) / area(g)).toBeCloseTo(14 / 64, 2);
    // The third circle meets both of its pairs when circles allow it; within a few points of the union here
    expect(Math.abs(lens(g, p) / area(g) - 11 / 64)).toBeLessThan(0.03);
    expect(Math.abs(lens(i, p) / area(g) - 8 / 64)).toBeLessThan(0.03);
    // Inside the plot, names included
    const svgBox = el.querySelector("svg")!.getBBox();
    expect(svgBox.x).toBeGreaterThanOrEqual(-1);
    expect(svgBox.x + svgBox.width).toBeLessThanOrEqual(el.querySelector(".tc-chart__plot")!.clientWidth + 1);
  });

  test("each region's own count on a chip; the summary names them; the keyboard lights a region", async () => {
    const el = await drawn(await make({ still: true }));
    expect(chips(el)).toEqual(["43", "30", "21", "10", "7", "4", "4"]);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe(
      "119 in 3 sets. Genomics only 43, Imaging only 30, Proteomics only 21, Genomics and Imaging only 10, Genomics and Proteomics only 7, Imaging and Proteomics only 4, Genomics, Imaging and Proteomics 4",
    );
    expect(el.querySelectorAll(".ui-vnn__region[data-active]").length).toBe(0);
    key(plot(el), "End");
    await settle();
    expect(status(el)).toMatch(/^Genomics, Imaging and Proteomics: 4 \(3%\), 7 of 7/);
    expect(el.querySelectorAll(".ui-vnn__region[data-active]").length).toBe(1);
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("Genomics, Imaging and Proteomics");
    expect(tipRows(el)).toEqual(["Count 4", "Share of everyone 3%"]);
    // The lit region is clipped to all three circles
    let depth = 0;
    for (let n: Element | null = el.querySelector(".ui-vnn__region[data-active]"); n && n.tagName.toLowerCase() !== "svg"; n = n.parentElement) if (n.hasAttribute("clip-path")) depth++;
    expect(depth).toBe(3);
  });

  test("the pointer over a region makes it the active one", async () => {
    const el = await drawn(await make({ still: true }));
    const regions = [...el.querySelectorAll(".ui-vnn__region")];
    regions[0].closest(".tc-chart__mark")!.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    await settle();
    expect(regions[0].hasAttribute("data-active")).toBe(true);
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("Genomics only");
  });

  test("two sets: two circles and three regions; the shared one isn't called 'only'", async () => {
    const el = await drawn(await make({ still: true, data: [{ sets: ["Wet lab"], size: 92 }, { sets: ["Computational"], size: 58 }, { sets: ["Wet lab", "Computational"], size: 21 }] }));
    expect(circles(el)).toHaveLength(2);
    expect(chips(el)).toEqual(["71", "37", "21"]);
    key(plot(el), "End");
    await settle();
    expect(status(el)).toMatch(/^Wet lab and Computational: 21/);
  });

  test("more than three sets: the three largest drawn, a note under them, every row in the table", async () => {
    const el = await drawn(await make({ still: true, data: [...DATA, { sets: ["Metabolomics"], size: 22 }, { sets: ["Genomics", "Metabolomics"], size: 6 }] }));
    expect(circles(el)).toHaveLength(3);
    expect(el.querySelector(".ui-vnn__note")!.textContent).toBe("Showing the 3 largest of 4 sets");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toContain("Showing the 3 largest of 4 sets");
    const rows = [...el.querySelectorAll(".tc-sr-only table tbody th")].map((t) => t.textContent);
    expect(rows.slice(-2)).toEqual(["Metabolomics", "Genomics and Metabolomics"]);
    key(plot(el), "End");
    await settle();
    // A row that isn't drawn is read, without a tooltip
    expect(status(el)).toMatch(/^Genomics and Metabolomics: 6, 9 of 9/);
    expect(el.querySelector(".tc-chart__tip")).toBeNull();
  });

  test("narrow: the drawing scales down and the names stay inside the card", async () => {
    const w = await fixture<HTMLDivElement>(html`<div style="width: 260px"><tc-venn-diagram heading="Labs" still .data=${DATA}></tc-venn-diagram></div>`);
    const el = await drawn(w.querySelector<TcVennDiagram>("tc-venn-diagram")!);
    const width = el.querySelector(".tc-chart__plot")!.clientWidth;
    for (const t of el.querySelectorAll<SVGTextElement>("svg > g:last-child text")) {
      const b = t.getBBox();
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(width + 0.5);
    }
  });

  test("the circles grow from their centres, then a data change glides", async () => {
    const el = await drawn(await make());
    await expect.poll(() => circles(el)[0]?.r ?? 0, { timeout: 4000 }).toBeGreaterThan(30);
    await expect.poll(() => (el as unknown as { motion: { animating: boolean } }).motion.animating, { timeout: 4000 }).toBe(false);
    const before = circles(el)[2].r;
    el.data = DATA.map((d) => (d.sets.length === 1 && d.sets[0] === "Proteomics" ? { ...d, size: 9 } : d));
    await settle();
    await expect.poll(() => circles(el)[2].r, { timeout: 4000 }).toBeLessThan(before * 0.7);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(VennDiagram, { title: "Labs", data: DATA, still: true, vennLabels: { only: "Just {set}" }, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcVennDiagram>("tc-venn-diagram")!;
    expect(el.heading).toBe("Labs");
    expect(el.view).toBe("table");
    expect(el.querySelector(".tc-chart__scroll tbody th")!.textContent).toBe("Just Genomics");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(VennDiagram, { title: "Labs", data: DATA, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Genomics only"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
