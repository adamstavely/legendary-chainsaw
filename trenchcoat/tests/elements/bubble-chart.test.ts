/*
 * <tc-bubble-chart> in real browsers: the shared chart behaviour (chart-kit), circles placed by x and y and sized by
 * area with the largest emphasised and named, a scatter plot without `size`, the pointer picking the circle on top,
 * the canvas past the threshold (painted, no SVG circles, keyboard and tooltip still reach the points), a data change
 * and the React wrapper; and grouped points – their inks, the legend that isolates, hides and shows groups, the
 * controlled `groups` – and the stat tiles.
 */
import axe from "axe-core";
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/bubble-chart";
import type { TcBubbleChart } from "../../src/elements/bubble-chart";
import { BubbleChart } from "../../src/elements/react/bubble-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, finish, fixture, settle } from "./helpers";

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

  test("trend: a least-squares line across the points' x range with its r², a confidence band, and a smooth LOESS curve", async () => {
    const el = await drawn(await make({ still: true, data: many(14) }));
    expect(el.querySelector(".ui-bbl__trend")).toBeNull();
    el.size = undefined;
    el.trend = "linear";
    await settle();
    const line = el.querySelector<SVGPathElement>(".ui-bbl__trend")!;
    expect(line).not.toBeNull();
    // It spans the points: from the leftmost circle's x to the rightmost
    const xs = circles(el).map((c) => num(c, "cx"));
    const d = line.getAttribute("d")!;
    const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    expect(nums[0]).toBeCloseTo(Math.min(...xs), 0);
    expect(nums[nums.length - 2]).toBeCloseTo(Math.max(...xs), 0);
    // papers ≈ 0.6 × staff + noise: rising, so the right end is higher on screen (smaller y)
    expect(nums[nums.length - 1]).toBeLessThan(nums[1]);
    const r2 = [...el.querySelectorAll(".tc-chart__value")].find((t) => t.textContent!.startsWith("r²"));
    expect(r2?.textContent).toMatch(/^r² 0\.\d\d$/);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toMatch(/Linear trend, r² 0\.\d\d\.$/);
    expect(el.querySelector(".ui-bbl__band")).toBeNull();
    el.trendBand = true;
    await settle();
    expect(el.querySelector(".ui-bbl__band")!.getAttribute("d")).toMatch(/Z$/);
    el.trend = "smooth";
    await settle();
    expect(el.querySelector(".ui-bbl__trend")).not.toBeNull();
    // The band is for a linear fit only; a smooth trend has no r²
    expect(el.querySelector(".ui-bbl__band")).toBeNull();
    expect([...el.querySelectorAll(".tc-chart__value")].some((t) => t.textContent!.startsWith("r²"))).toBe(false);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toMatch(/Smooth trend\.$/);
  });

  test("trend: no line with fewer than three points, or when every x is the same", async () => {
    const el = await drawn(await make({ still: true, data: LABS.slice(0, 2) }));
    el.trend = "linear";
    await settle();
    expect(el.querySelector(".ui-bbl__trend")).toBeNull();
    el.data = LABS.map((l) => ({ ...l, staff: 10 }));
    await settle();
    expect(el.querySelector(".ui-bbl__trend")).toBeNull();
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

const TEAMS = [
  { label: "R1", team: "Fraud", hours: 12, findings: 9 },
  { label: "R2", team: "Audit", hours: 20, findings: 6 },
  { label: "R3", team: "Fraud", hours: 7, findings: 4 },
  { label: "R4", team: "Compliance", hours: 15, findings: 11 },
  { label: "R5", team: "Audit", hours: 30, findings: 8 },
];
const STATS = [
  { label: "Reviews", value: 48 },
  { label: "Findings", value: 212, change: 8.5 },
  { label: "Per hour", value: "0.61", change: -2 },
];
const grouped = (o: { look?: "standard" | "clean"; still?: boolean; data?: Record<string, unknown>[]; canvas?: boolean } = {}) =>
  fixture<TcBubbleChart>(
    html`<div style="width: 600px"><tc-bubble-chart look=${o.look ?? "standard"} ?still=${o.still} heading="Review hours and findings" canvas-threshold=${o.canvas ? 2 : 1500}
      .data=${o.data ?? TEAMS} .x=${"hours"} .y=${"findings"} .group=${"team"} .stats=${STATS}></tc-bubble-chart></div>`,
  ).then((w) => w.querySelector("tc-bubble-chart")!);
const keys = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-bbl__key")];
const fills = (el: Element) => [...el.querySelectorAll<SVGCircleElement>(".ui-bbl__dot")].map((c) => c.style.fill);

describe("tc-bubble-chart: groups and stat tiles", () => {
  test("each group takes the next categorical ink; nothing is emphasised; the legend has a toggle per group", async () => {
    const el = await drawn(await grouped({ still: true }));
    expect(new Set(fills(el))).toEqual(new Set(["var(--tc-plot-ink-1)", "var(--tc-plot-ink-2)", "var(--tc-plot-ink-3)"]));
    const bar = el.querySelector(".ui-bbl__legend")!;
    expect(bar.getAttribute("role")).toBe("toolbar");
    expect(bar.getAttribute("aria-label")).toBe("Groups");
    expect(keys(el).map((b) => [b.textContent!.trim(), b.getAttribute("aria-pressed"), b.tabIndex])).toEqual([
      ["Fraud", "true", 0],
      ["Audit", "true", -1],
      ["Compliance", "true", -1],
    ]);
    expect(el.querySelector(".tc-chart__value[data-strong]")).toBeNull();
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toMatch(/^5 points\. 3 groups\. /);
    // The table names each point's group
    expect([...el.querySelectorAll(".tc-sr-only table th[scope=row]")].map((t) => t.textContent)).toContain("R1 · Fraud");
    // The tooltip names it too
    key(plot(el), "ArrowRight");
    await settle();
    expect([...el.querySelectorAll(".tc-chart__tip-label")].map((l) => l.textContent)).toContain("Group");
  });

  test("pointing at or focusing a legend button isolates its group: the others turn to the muted ink", async () => {
    const el = await drawn(await grouped({ still: true }));
    keys(el)[1].dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    const muted = fills(el).filter((f) => f === "var(--tc-bbl-muted)").length;
    expect(muted).toBe(3);
    expect(fills(el).filter((f) => f === "var(--tc-plot-ink-2)")).toHaveLength(2);
    expect(keys(el)[1].hasAttribute("data-isolated")).toBe(true);
    keys(el)[1].dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(fills(el)).not.toContain("var(--tc-bbl-muted)");
    keys(el)[0].focus();
    await settle();
    expect(fills(el).filter((f) => f === "var(--tc-bbl-muted)")).toHaveLength(3);
    keys(el)[0].blur();
    await settle();
    expect(fills(el)).not.toContain("var(--tc-bbl-muted)");
  });

  test("the legend's arrows move its one tab stop; Enter hides and shows a group, keeping the axes; the last group stays", async () => {
    const el = await drawn(await grouped({ still: true }));
    const changes: string[][] = [];
    el.addEventListener("tc-groups-change", (e) => changes.push((e as CustomEvent).detail.groups));
    const ticks = () => [...el.querySelectorAll(".tc-chart__tick")].map((t) => t.textContent).join(",");
    const before = ticks();
    keys(el)[0].focus();
    keys(el)[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    await settle();
    await expect.poll(() => document.activeElement).toBe(keys(el)[1]);
    expect(keys(el).map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
    keys(el)[1].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
    await settle();
    await expect.poll(() => document.activeElement).toBe(keys(el)[2]);
    // A button's Enter is its click
    keys(el)[1].click();
    await settle();
    expect(changes).toEqual([["Fraud", "Compliance"]]);
    expect(el.groups).toEqual(["Fraud", "Compliance"]);
    expect(keys(el)[1].getAttribute("aria-pressed")).toBe("false");
    expect(el.querySelectorAll(".ui-bbl__dot")).toHaveLength(3);
    expect(ticks()).toBe(before);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toContain("showing Fraud, Compliance");
    keys(el)[0].click();
    await settle();
    keys(el)[2].click();
    await settle();
    // Compliance is the only one left: it can't be hidden
    expect(el.groups).toEqual(["Compliance"]);
    expect(changes).toHaveLength(2);
    keys(el)[1].click();
    await settle();
    expect(el.groups).toEqual(["Audit", "Compliance"]);
  });

  test("a prevented tc-groups-change keeps the groups; set from outside, groups is followed", async () => {
    const el = await drawn(await grouped({ still: true }));
    el.addEventListener("tc-groups-change", (e) => e.preventDefault());
    keys(el)[0].click();
    await settle();
    expect(el.groups).toBeUndefined();
    expect(el.querySelectorAll(".ui-bbl__dot")).toHaveLength(5);
    el.groups = ["Audit"];
    await settle();
    expect(el.querySelectorAll(".ui-bbl__dot")).toHaveLength(2);
    expect(keys(el).map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
  });

  test("grouped on a canvas: painted, and the isolated group repaints it", async () => {
    const el = await drawn(await grouped({ still: true, canvas: true }));
    const cv = () => el.querySelector("canvas")!;
    await expect.poll(() => cv()?.getAttribute("data-painted") ?? "").not.toBe("");
    const first = cv().getAttribute("data-painted");
    keys(el)[0].dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    await expect.poll(() => cv().getAttribute("data-painted")).not.toBe(first);
  });

  test("stat tiles: a description list under the chart, numbers in the chart's format, a signed change with its tone", async () => {
    const el = await drawn(await grouped({ still: true }));
    const dl = el.querySelector(".ui-bbl__stats")!;
    expect(dl.tagName).toBe("DL");
    expect(dl.previousElementSibling!.classList.contains("tc-chart__card")).toBe(true);
    expect([...el.querySelectorAll(".ui-bbl__stat-label")].map((d) => d.textContent)).toEqual(["Reviews", "Findings", "Per hour"]);
    expect([...el.querySelectorAll(".ui-bbl__stat-value")].map((d) => d.textContent!.replace(/\s+/g, " ").trim())).toEqual(["48", "212 +8.5%", "0.61 −2%"]);
    expect([...el.querySelectorAll(".ui-bbl__stat-change")].map((c) => c.getAttribute("data-dir"))).toEqual(["up", "down"]);
    el.stats = [];
    await settle();
    expect(el.querySelector(".ui-bbl__stats")).toBeNull();
  });

  test("narrow: the stat tiles wrap", async () => {
    const el = await drawn(await grouped({ still: true }));
    el.parentElement!.style.width = "300px";
    await settle();
    const tops = [...el.querySelectorAll(".ui-bbl__stat")].map((t) => Math.round(t.getBoundingClientRect().top));
    expect(new Set(tops).size).toBeGreaterThan(1);
  });

  test("React wrapper: groups uncontrolled survive re-renders; controlled ones stay until the parent changes them", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const seen: string[][] = [];
    const base = { title: "Reviews", data: TEAMS, x: "hours", y: "findings", group: "team", still: true, stats: STATS };
    await act(async () => root.render(React.createElement(BubbleChart, { ...base, onGroupsChange: (g: string[]) => seen.push(g) })));
    await settle();
    const el = host.querySelector<TcBubbleChart>("tc-bubble-chart")!;
    await drawn(el);
    keys(el)[0].click();
    await settle();
    expect(seen).toEqual([["Audit", "Compliance"]]);
    await act(async () => root.render(React.createElement(BubbleChart, { ...base, description: "Again", onGroupsChange: (g: string[]) => seen.push(g) })));
    await settle();
    expect(el.groups).toEqual(["Audit", "Compliance"]);
    // Controlled: the click is reported, the element keeps the parent's groups
    await act(async () => root.render(React.createElement(BubbleChart, { ...base, groups: ["Fraud", "Audit"], onGroupsChange: (g: string[]) => seen.push(g) })));
    await settle();
    keys(el)[0].click();
    await settle();
    expect(seen.at(-1)).toEqual(["Audit"]);
    expect(el.groups).toEqual(["Fraud", "Audit"]);
    await act(async () => root.render(React.createElement(BubbleChart, { ...base, groups: ["Audit"] })));
    await settle();
    expect(el.groups).toEqual(["Audit"]);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const look of ["standard", "clean"] as const)
    test(`axe: ${look}, light and dark, grouped with a group hidden, isolated and stat tiles`, async () => {
      for (const scheme of ["light", "dark"]) {
        const el = await drawn(await grouped({ look, still: true }));
        const wrap = el.parentElement!;
        wrap.style.colorScheme = scheme;
        keys(el)[2].click();
        await settle();
        keys(el)[0].focus();
        await finish(wrap);
        const r = await axe.run(wrap);
        expect(r.violations.flatMap((v) => v.nodes.map((n) => `${scheme} ${v.id} ${n.html.slice(0, 90)}`))).toEqual([]);
        wrap.remove();
      }
    });
});
