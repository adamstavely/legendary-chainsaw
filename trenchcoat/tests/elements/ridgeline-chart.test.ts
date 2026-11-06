/*
 * <tc-ridgeline-chart> in real browsers: the shared chart behaviour (chart-kit), one ridge per group with its median,
 * the highest median emphasised, highlight by name, sorting by median, overlap, the pointer picking the ridge under
 * it, the entrance and data changes, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/ridgeline-chart";
import type { TcRidgelineChart } from "../../src/elements/ridgeline-chart";
import { RidgelineChart } from "../../src/elements/react/ridgeline-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

// Sample hold times in hours, by instrument
const RAW: Record<string, number[]> = {
  Sequencer: [4, 5, 5, 6, 6, 6, 7, 8, 9],
  Microscope: [8, 9, 10, 10, 11, 12, 12, 13],
  Spectrometer: [2, 2, 3, 3, 3, 4, 5],
  Cryostat: [5, 6, 7, 7, 8, 8, 9, 10],
};
const DATA = Object.entries(RAW).flatMap(([group, vs]) => vs.map((value) => ({ group, value })));

const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcRidgelineChart>(
    html`<div style="width: 600px"><tc-ridgeline-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Hold time" .data=${o.data ?? DATA}></tc-ridgeline-chart></div>`,
  ).then((w) => w.querySelector("tc-ridgeline-chart")!);
const ridges = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-rdl__ridge")];
const names = (el: Element) => [...el.querySelectorAll(".tc-sr-only tbody th")].map((t) => t.textContent);

describe("tc-ridgeline-chart", () => {
  chartBasics({ tag: "tc-ridgeline-chart", ui: "rdl", kind: "Ridgeline chart", make: make as never, marks: 4, firstRead: /^Sequencer: median 6 \(9 values\)/ });

  test("a ridge and a median tick per group; the highest median takes the accent", async () => {
    const el = await drawn(await make({ still: true }));
    expect(ridges(el).map((r) => r.style.fill)).toEqual(["var(--tc-plot-rest)", "var(--tc-plot-accent)", "var(--tc-plot-rest)", "var(--tc-plot-rest)"]);
    expect(el.querySelectorAll(".ui-rdl__median").length).toBe(4);
    expect(el.querySelector(".tc-chart__tick[data-strong]")!.textContent).toBe("Microscope");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("4 groups: Sequencer median 6, Microscope median 10.5, Spectrometer median 3, Cryostat median 7.5");
    // Each ridge's baseline is lower than the one before
    const bases = [...el.querySelectorAll(".ui-rdl__ridge + .ui-rdl__line + line")].map((l) => Number(l.getAttribute("y1")));
    expect(bases).toHaveLength(4);
    expect(bases.every((b, i) => !i || b > bases[i - 1])).toBe(true);
  });

  test("highlight picks a group by name; sort orders from the lowest median", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "Cryostat";
    el.sort = "median";
    await settle();
    expect(names(el)).toEqual(["Spectrometer", "Sequencer", "Cryostat", "Microscope"]);
    expect(ridges(el).find((r) => r.style.fill === "var(--tc-plot-accent)")).toBe(ridges(el)[3]);
    key(plot(el), "ArrowRight");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^Spectrometer: median 3/);
  });

  test("overlap sets how tall the ridges rise; the pointer picks the ridge under it", async () => {
    const el = await drawn(await make({ still: true }));
    const tall = ridges(el)[1].getBBox().height;
    el.overlap = 0.8;
    await settle();
    expect(ridges(el)[1].getBBox().height).toBeLessThan(tall * 0.75);
    // Over Microscope's peak: its median, just above its baseline
    const svgEl = el.querySelector("svg.tc-chart__svg")!;
    const r = svgEl.getBoundingClientRect();
    const line = el.querySelectorAll(".ui-rdl__median")[1];
    const x = Number(line.getAttribute("x1"));
    const y = Number(line.getAttribute("y2")) - 3;
    const scale = r.width / Number(svgEl.getAttribute("viewBox")!.split(" ")[2]);
    plot(el).dispatchEvent(new PointerEvent("pointermove", { clientX: r.left + x * scale, clientY: r.top + y * scale, bubbles: true, pointerType: "mouse" }));
    await settle();
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("Microscope");
  });

  test("the entrance raises the ridges from their baselines, then a data change reshapes them", async () => {
    const el = await drawn(await make());
    const h = () => ridges(el)[2].getBBox().height;
    await expect.poll(h, { timeout: 4000 }).toBeGreaterThan(30);
    await expect.poll(() => (el as unknown as { motion: { animating: boolean } }).motion.animating, { timeout: 4000 }).toBe(false);
    const before = h();
    // Spectrometer spreads out: its ridge flattens
    el.data = DATA.map((d) => (d.group === "Spectrometer" ? { ...d, value: d.value * 3 - 4 } : d));
    await settle();
    await expect.poll(h, { timeout: 4000 }).toBeLessThan(before * 0.7);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(RidgelineChart, { title: "Hold", data: DATA, still: true, sort: "median", view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcRidgelineChart>("tc-ridgeline-chart")!;
    expect(el.heading).toBe("Hold");
    expect(el.sort).toBe("median");
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(RidgelineChart, { title: "Hold", data: DATA, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Sequencer"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
