/*
 * <tc-beeswarm-chart> in real browsers: the shared chart behaviour (chart-kit), the swarm's layout (no two dots
 * overlap), the group with the highest median emphasised with its median marked, one row without groups, the canvas
 * past the threshold (painted, no SVG dots, keyboard and pointer still reach the points), a data change and the React
 * wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/beeswarm-chart";
import type { TcBeeswarmChart } from "../../src/elements/beeswarm-chart";
import { BeeswarmChart } from "../../src/elements/react/beeswarm-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const TIMES: Record<string, number[]> = {
  Genomics: [4.2, 5.1, 6.0, 5.5],
  Imaging: [8.1, 7.4, 9.0, 8.7],
  Proteomics: [3.0, 3.6, 2.8, 4.1],
};
const ASSAYS = Object.entries(TIMES).flatMap(([lab, vs]) => vs.map((v) => ({ lab, hours: v })));
const ROWS = ASSAYS.map((d, i) => ({ ...d, label: `S${i + 1}` }));

/** n deterministic points, spread round 50 */
function many(n: number) {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, (_, i) => ({ value: 50 + (rnd() + rnd() + rnd() - 1.5) * 30, label: `R${i + 1}` }));
}

const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcBeeswarmChart>(
    html`<div style="width: 600px"><tc-beeswarm-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Assay turnaround" unit=" h"
      .data=${o.data ?? ROWS} .value=${"hours"} .group=${"lab"}></tc-beeswarm-chart></div>`,
  ).then((w) => w.querySelector("tc-beeswarm-chart")!);
const dots = (el: Element) => [...el.querySelectorAll<SVGCircleElement>(".ui-bsw__dot")];
const num = (c: Element, a: string) => Number(c.getAttribute(a));

describe("tc-beeswarm-chart", () => {
  chartBasics({ tag: "tc-beeswarm-chart", ui: "bsw", kind: "Beeswarm", make: make as never, marks: 12, firstRead: /^S1 Genomics: 4\.2 h/ });

  test("the swarm: a row per group, no two dots overlapping, the highest median's group in the accent with its median", async () => {
    const el = await drawn(await make({ still: true }));
    const ds = dots(el);
    expect(ds).toHaveLength(12);
    // Imaging has the highest median: its four dots take the accent
    expect(ds.map((d) => d.style.fill === "var(--tc-plot-accent)")).toEqual(ASSAYS.map((a) => a.lab === "Imaging"));
    for (let a = 0; a < ds.length; a++)
      for (let b = a + 1; b < ds.length; b++) {
        const gap = Math.hypot(num(ds[a], "cx") - num(ds[b], "cx"), num(ds[a], "cy") - num(ds[b], "cy"));
        expect(gap).toBeGreaterThanOrEqual(num(ds[a], "r") * 2 - 0.01);
      }
    // Rows top to bottom in first-seen order
    const rowY = (lab: string) => num(ds[ASSAYS.findIndex((a) => a.lab === lab)], "cy");
    expect(rowY("Genomics")).toBeLessThan(rowY("Imaging"));
    expect(rowY("Imaging")).toBeLessThan(rowY("Proteomics"));
    expect([...el.querySelectorAll(".ui-bsw__median .tc-chart__value")].map((t) => t.textContent)).toEqual(["Median 5.3 h", "Median 8.4 h", "Median 3.3 h"]);
    expect(el.querySelector(".tc-chart__tick[data-strong]")!.textContent).toBe("Imaging");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe(
      "12 points, 3 groups (Genomics median 5.3 h, Imaging median 8.4 h, Proteomics median 3.3 h)",
    );
  });

  test("highlight picks a group; hide-median drops the medians; without groups one row with the highest point emphasised", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "Proteomics";
    el.hideMedian = true;
    await settle();
    expect(dots(el).map((d) => d.style.fill === "var(--tc-plot-accent)")).toEqual(ASSAYS.map((a) => a.lab === "Proteomics"));
    expect(el.querySelector(".ui-bsw__median")).toBeNull();
    el.highlight = undefined;
    el.group = undefined;
    await settle();
    const ds = dots(el);
    expect(ds.filter((d) => d.style.fill === "var(--tc-plot-accent)").map((d) => ds.indexOf(d))).toEqual([6]);
    expect(el.querySelectorAll(".ui-bsw__divider").length).toBe(0);
    key(plot(el), "ArrowRight");
    await settle();
    expect([...el.querySelectorAll(".tc-chart__tip-label")].map((t) => t.textContent)).toEqual(["Value"]);
  });

  test("past the threshold the dots are painted on a canvas; the keyboard, tooltip and pointer still reach them", async () => {
    const el = await drawn(await make({ still: true, data: many(2500) }));
    el.group = undefined;
    el.value = undefined;
    await settle();
    const cv = el.querySelector<HTMLCanvasElement>(".tc-chart__canvas")!;
    expect(cv).not.toBeNull();
    expect(cv.width).toBeGreaterThan(0);
    expect(cv.getBoundingClientRect().height).toBeGreaterThan(100);
    expect(dots(el)).toHaveLength(0);
    // Something was painted
    const px = cv.getContext("2d")!.getImageData(0, 0, cv.width, cv.height).data;
    let inked = 0;
    for (let i = 3; i < px.length; i += 4) if (px[i] > 0) inked++;
    expect(inked).toBeGreaterThan(1000);
    const p = plot(el);
    key(p, "ArrowRight");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^R1: [\d.]+ h, 1 of 2500$/);
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("R1");
    expect(el.querySelector("circle.tc-chart__focus")).not.toBeNull();
    key(p, "Escape");
    await settle();
    // The pointer finds the nearest dot
    const bee = (el as unknown as { bees: { x: number; y: number }[] }).bees[42];
    const r = el.querySelector(".tc-chart__svg")!.getBoundingClientRect();
    const scale = r.width / el.querySelector<SVGSVGElement>(".tc-chart__svg")!.viewBox.baseVal.width;
    p.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: r.left + bee.x * scale, clientY: r.top + bee.y * scale, pointerType: "mouse" }));
    await settle();
    expect(el.querySelector(".tc-chart__tip")).not.toBeNull();
    const tipped = el.querySelector(".tc-chart__tip-title")!.textContent!;
    const hit = (el as unknown as { bees: { x: number; y: number }[] }).bees[Number(tipped.slice(1)) - 1];
    expect(Math.hypot(hit.x - bee.x, hit.y - bee.y)).toBeLessThan(12);
    // Below the threshold again: SVG dots, no canvas
    el.canvasThreshold = 5000;
    await settle();
    expect(el.querySelector(".tc-chart__canvas")).toBeNull();
    expect(dots(el)).toHaveLength(2500);
  });

  test("the entrance grows the dots, then a data change moves them", async () => {
    const el = await drawn(await make());
    const r0 = () => num(dots(el)[0], "r");
    await expect.poll(r0, { timeout: 4000 }).toBeGreaterThan(2);
    const x0 = num(dots(el)[0], "cx");
    el.data = ROWS.map((d, i) => ({ ...d, hours: i === 0 ? 8.8 : d.hours }));
    await settle();
    await expect.poll(() => num(dots(el)[0], "cx"), { timeout: 4000 }).toBeGreaterThan(x0 + 100);
  });

  test("React wrapper: props reach the element; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(BeeswarmChart, { title: "Turnaround", data: ROWS, value: "hours", group: "lab", hideMedian: true, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcBeeswarmChart>("tc-beeswarm-chart")!;
    await drawn(el);
    expect(el.heading).toBe("Turnaround");
    expect(el.hideMedian).toBe(true);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["S1"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
