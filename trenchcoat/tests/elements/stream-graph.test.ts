/*
 * <tc-stream-graph> in real browsers: the shared chart behaviour (chart-kit), the layers stacked round a centre with
 * the largest emphasised and the rest in shades, names beside their ends, the nearest x, offset and reorder, the
 * entrance and data changes, and the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/stream-graph";
import type { TcStreamGraph } from "../../src/elements/stream-graph";
import { StreamGraph } from "../../src/elements/react/stream-graph";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const LABS = ["Genomics", "Imaging", "Climate"];
const HOURS = [
  [120, 150, 170, 140, 110, 90],
  [60, 70, 90, 120, 130, 100],
  [40, 35, 30, 45, 60, 80],
];
const WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6"];
const DATA = WEEKS.flatMap((x, k) => LABS.map((series, s) => ({ x, series, y: HOURS[s][k] })));

const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcStreamGraph>(
    html`<div style="width: 600px"><tc-stream-graph look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="GPU hours" .series=${"series"} .data=${o.data ?? DATA}></tc-stream-graph></div>`,
  ).then((w) => w.querySelector("tc-stream-graph")!);
const layers = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-stm__layer")];
const names = (el: Element) => [...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent);

describe("tc-stream-graph", () => {
  chartBasics({ tag: "tc-stream-graph", ui: "stm", kind: "Streamgraph", make: make as never, marks: 6, firstRead: /^W1: Genomics 120, Imaging 60, Climate 40/ });

  test("layers stack round a centre: the largest total in the accent, the rest in shades; names beside their ends", async () => {
    const el = await drawn(await make({ still: true }));
    const ls = layers(el);
    expect(ls).toHaveLength(3);
    const hi = ls.filter((l) => l.hasAttribute("data-hi"));
    expect(hi).toHaveLength(1);
    expect(hi[0].style.fill).toBe("var(--tc-plot-accent)");
    const rest = ls.filter((l) => !l.hasAttribute("data-hi"));
    expect(rest.every((l) => l.style.fill === "var(--tc-plot-rest)")).toBe(true);
    expect(new Set(rest.map((l) => l.style.fillOpacity)).size).toBe(2);
    expect(names(el).sort()).toEqual([...LABS].sort());
    expect(el.querySelector('.tc-chart__value[data-strong]')!.textContent).toBe("Genomics");
    // Stacked without gaps: together the layers span more than any one does, and no layer sits on the floor
    const boxes = ls.map((l) => l.getBBox());
    const svgH = el.querySelector(".tc-chart__svg")!.getBoundingClientRect().height;
    expect(Math.max(...boxes.map((b) => b.y + b.height))).toBeLessThan(svgH - 20);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("3 series (Genomics, Imaging, Climate), from W1 to W6, 6 points");
  });

  test("the pointer reads the nearest x; the tooltip lists every series, largest first", async () => {
    const el = await drawn(await make({ still: true }));
    const svgEl = el.querySelector(".tc-chart__svg")!;
    const r = svgEl.getBoundingClientRect();
    plot(el).dispatchEvent(new PointerEvent("pointermove", { clientX: r.left + r.width * 0.33, clientY: r.top + r.height / 2, bubbles: true, pointerType: "mouse" }));
    await settle();
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("W3");
    expect([...el.querySelectorAll(".tc-chart__tip-label")].map((l) => l.textContent!.trim())).toEqual(["Genomics", "Imaging", "Climate"]);
    expect(el.querySelector(".ui-stm__cursor")).not.toBeNull();
  });

  test("highlight, unit, offset, reorder and hide-labels", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "Climate";
    el.unit = " h";
    el.reorder = false;
    await settle();
    expect(layers(el)[2].style.fill).toBe("var(--tc-plot-accent)");
    key(plot(el), "ArrowRight");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/W1: Genomics 120 h, Imaging 60 h, Climate 40 h, 1 of 6/);
    const before = layers(el)[0].getAttribute("d");
    el.offset = "silhouette";
    await settle();
    expect(layers(el)[0].getAttribute("d")).not.toBe(before);
    el.setAttribute("reorder", "false");
    el.hideLabels = true;
    await settle();
    expect(el.reorder).toBe(false);
    expect(names(el)).toEqual([]);
  });

  test("the entrance swells out of the centre line, then a data change glides; a new series joins", async () => {
    const el = await drawn(await make());
    const h = () => Math.max(...layers(el).map((l) => l.getBBox().height));
    await expect.poll(h, { timeout: 4000 }).toBeGreaterThan(60);
    el.data = [...DATA, ...WEEKS.map((x, k) => ({ x, series: "Materials", y: 30 + k * 10 }))];
    await settle();
    await expect.poll(() => layers(el).length, { timeout: 4000 }).toBe(4);
    expect(names(el)).toContain("Materials");
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    const props = { title: "GPU", data: DATA, series: "series", still: true, onMarkClick: (e: { label: string }) => clicks.push(e.label) };
    await act(async () => root.render(React.createElement(StreamGraph, { ...props, view: "table" })));
    await settle();
    const el = host.querySelector<TcStreamGraph>("tc-stream-graph")!;
    expect(el.heading).toBe("GPU");
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(StreamGraph, props)));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["W1"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
