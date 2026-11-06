/*
 * <tc-bubble-chart> in real browsers: the shared chart behaviour (chart-kit), circles placed by x and y and sized by
 * area with the largest emphasised and named, a scatter plot without `size`, the pointer picking the circle on top,
 * the canvas past the threshold (painted, no SVG circles, keyboard and tooltip still reach the points), a data change
 * and the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/bubble-chart";
import type { TcBubbleChart } from "../../src/elements/bubble-chart";
import { BubbleChart } from "../../src/elements/react/bubble-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const LABS = [
  { label: "Genomics", staff: 24, papers: 41, budget: 3.2 },
  { label: "Imaging", staff: 12, papers: 18, budget: 1.4 },
  { label: "Proteomics", staff: 16, papers: 27, budget: 2.1 },
  { label: "Field ecology", staff: 9, papers: 14, budget: 0.8 },
  { label: "Neuro", staff: 20, papers: 33, budget: 4.5 },
  { label: "Climate", staff: 14, papers: 22, budget: 1.9 },
];

/** n deterministic points */
function many(n: number) {
  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, (_, i) => {
    const x = rnd() * 100;
    return { label: `P${i + 1}`, staff: x, papers: x * 0.6 + rnd() * 40, budget: rnd() * 10 };
  });
}

const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcBubbleChart>(
    html`<div style="width: 600px"><tc-bubble-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Labs by size and output"
      .data=${o.data ?? LABS} .x=${"staff"} .y=${"papers"} .size=${"budget"}></tc-bubble-chart></div>`,
  ).then((w) => w.querySelector("tc-bubble-chart")!);
const circles = (el: Element) => [...el.querySelectorAll<SVGCircleElement>(".ui-bbl__dot")];
const num = (c: Element, a: string) => Number(c.getAttribute(a));
/** The circle drawn for a lab, by its position in LABS (drawn in a different order) */
const byLab = (el: Element, k: number) => {
  const ev = el as unknown as { dots: { x: number; y: number }[] };
  const d = ev.dots[k];
  return circles(el).find((c) => Math.abs(num(c, "cx") - d.x) < 0.01 && Math.abs(num(c, "cy") - d.y) < 0.01)!;
};

describe("tc-bubble-chart", () => {
  chartBasics({ tag: "tc-bubble-chart", ui: "bbl", kind: "Bubble chart", make: make as never, marks: 6, firstRead: /^Genomics: x 24, y 41, size 3\.2/ });

  test("circles by x and y, sized by area; the largest in the accent, drawn on top and named", async () => {
    const el = await drawn(await make({ still: true }));
    const cs = circles(el);
    expect(cs).toHaveLength(6);
    const r = LABS.map((_, k) => num(byLab(el, k), "r"));
    // Neuro (4.5) is the largest, Field ecology (0.8) the smallest; area follows the value
    expect(Math.max(...r)).toBe(r[4]);
    expect(Math.min(...r)).toBe(r[3]);
    expect(byLab(el, 4).style.fill).toBe("var(--tc-plot-accent)");
    expect(cs.filter((c) => c.style.fill === "var(--tc-plot-accent)")).toHaveLength(1);
    expect(cs.at(-1)).toBe(byLab(el, 4));
    // More staff further right, more papers further up
    expect(num(byLab(el, 0), "cx")).toBeGreaterThan(num(byLab(el, 3), "cx"));
    expect(num(byLab(el, 0), "cy")).toBeLessThan(num(byLab(el, 3), "cy"));
    const names = [...el.querySelectorAll(".tc-chart__value")];
    expect(names[0].textContent).toBe("Neuro");
    expect(names[0].hasAttribute("data-strong")).toBe(true);
    expect(names.length).toBeGreaterThan(2);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("6 points. x from 9 to 24, y from 14 to 41.");
  });

  test("without size it's a scatter plot: even dots, none emphasised; axis names and max-labels", async () => {
    const el = await drawn(await make({ still: true }));
    el.size = undefined;
    el.heading = "";
    el.xLabel = "Staff";
    el.yLabel = "Papers";
    el.maxLabels = 1;
    await settle();
    expect(el.querySelector(".tc-head")!.textContent).toContain("Scatter plot");
    expect(new Set(circles(el).map((c) => num(c, "r")))).toEqual(new Set([4]));
    expect(circles(el).some((c) => c.style.fill === "var(--tc-plot-accent)")).toBe(false);
    expect(el.querySelectorAll(".tc-chart__value")).toHaveLength(1);
    expect([...el.querySelectorAll(".tc-chart__tick")].map((t) => t.textContent)).toEqual(expect.arrayContaining(["Staff", "Papers"]));
    key(plot(el), "ArrowRight");
    await settle();
    expect([...el.querySelectorAll(".tc-chart__tip-label")].map((t) => t.textContent)).toEqual(["Staff", "Papers"]);
    el.hideLabels = true;
    await settle();
    expect(el.querySelectorAll(".tc-chart__value")).toHaveLength(0);
  });

  test("the pointer picks the circle under it, the others fading", async () => {
    const el = await drawn(await make({ still: true }));
    const svgEl = el.querySelector<SVGSVGElement>(".tc-chart__svg")!;
    const box = svgEl.getBoundingClientRect();
    const scale = box.width / svgEl.viewBox.baseVal.width;
    const target = byLab(el, 2);
    plot(el).dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: box.left + num(target, "cx") * scale, clientY: box.top + num(target, "cy") * scale, pointerType: "mouse" }));
    await settle();
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("Proteomics");
    expect(target.hasAttribute("data-active")).toBe(true);
    expect(byLab(el, 0).getAttribute("opacity")).toBe("0.55");
    // Far from every circle: nothing
    plot(el).dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: box.right - 2, clientY: box.bottom - 30, pointerType: "mouse" }));
    await settle();
    expect(el.querySelector(".tc-chart__tip")).toBeNull();
  });

  test("past the threshold the circles are painted on a canvas; the keyboard and tooltip still reach them", async () => {
    const el = await drawn(await make({ still: true, data: many(2000) }));
    const cv = el.querySelector<HTMLCanvasElement>(".tc-chart__canvas")!;
    expect(cv).not.toBeNull();
    expect(cv.width).toBeGreaterThan(0);
    expect(cv.getBoundingClientRect().height).toBeGreaterThan(100);
    expect(circles(el)).toHaveLength(0);
    const px = cv.getContext("2d")!.getImageData(0, 0, cv.width, cv.height).data;
    let inked = 0;
    for (let i = 3; i < px.length; i += 4) if (px[i] > 0) inked++;
    expect(inked).toBeGreaterThan(1000);
    // The table's names are made as they're read
    expect(el.querySelectorAll(".tc-sr-only tbody tr").length).toBeLessThan(100);
    key(plot(el), "End");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^P2000: x [\d.]+, y [\d.]+, size [\d.]+, 2000 of 2000$/);
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("P2000");
    expect(el.querySelector("circle.tc-chart__focus")).not.toBeNull();
    // Hover doesn't repaint the canvas
    const painted = cv.getAttribute("data-painted");
    key(plot(el), "ArrowLeft");
    await settle();
    expect(cv.getAttribute("data-painted")).toBe(painted);
  });

  test("the entrance grows the circles, then a data change glides them", async () => {
    const el = await drawn(await make());
    await expect.poll(() => num(byLab(el, 4), "r"), { timeout: 4000 }).toBeGreaterThan(10);
    // Drawn largest first: Field ecology, the smallest, just under Neuro, the emphasised one
    const field = () => circles(el)[4];
    expect(field()).toBe(byLab(el, 3));
    const y0 = num(field(), "cy");
    el.data = LABS.map((d, k) => (k === 3 ? { ...d, papers: 40 } : d));
    await settle();
    await expect.poll(() => num(field(), "cy"), { timeout: 4000 }).toBeLessThan(y0 - 50);
  });

  test("React wrapper: props reach the element; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () =>
      root.render(React.createElement(BubbleChart, { title: "Labs", data: LABS, x: "staff", y: "papers", size: "budget", xLabel: "Staff", still: true, onMarkClick: (e) => clicks.push(e.label) })),
    );
    await settle();
    const el = host.querySelector<TcBubbleChart>("tc-bubble-chart")!;
    await drawn(el);
    expect(el.heading).toBe("Labs");
    expect(el.xLabel).toBe("Staff");
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Genomics"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
