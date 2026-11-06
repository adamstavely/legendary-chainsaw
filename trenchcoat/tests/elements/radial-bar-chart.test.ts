/*
 * <tc-radial-bar-chart> in real browsers: the shared chart behaviour (chart-kit), the rings filled towards max with
 * the largest emphasised, names where they start, a full circle's centre value, highlight and format, the entrance
 * and data changes, and the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/radial-bar-chart";
import type { TcRadialBarChart } from "../../src/elements/radial-bar-chart";
import { RadialBarChart } from "../../src/elements/react/radial-bar-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const LABS = [
  { label: "Genomics", value: 82 },
  { label: "Imaging", value: 64 },
  { label: "Proteomics", value: 91 },
  { label: "Neuro", value: 47 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcRadialBarChart>(
    html`<div style="width: 600px"><tc-radial-bar-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Grant milestones" .data=${o.data ?? LABS}></tc-radial-bar-chart></div>`,
  ).then((w) => w.querySelector("tc-radial-bar-chart")!);
const bars = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-rbr__bar")];
const values = (el: Element) => [...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent);

describe("tc-radial-bar-chart", () => {
  chartBasics({ tag: "tc-radial-bar-chart", ui: "rbr", kind: "Radial bar chart", make: make as never, marks: 4, firstRead: /^Genomics: 82%/ });

  test("rings fill towards max, outermost first; the largest in the accent; each named with its value", async () => {
    const el = await drawn(await make({ still: true }));
    const b = bars(el);
    expect(b.map((p) => p.style.stroke)).toEqual(["var(--tc-plot-rest)", "var(--tc-plot-rest)", "var(--tc-plot-accent)", "var(--tc-plot-rest)"]);
    expect(el.querySelectorAll(".ui-rbr__track")).toHaveLength(4);
    // Each ring's length over its track's: its share of 270° at its radius
    const tracks = [...el.querySelectorAll<SVGPathElement>(".ui-rbr__track")];
    tracks.forEach((t, i) => expect(b[i].getTotalLength() / t.getTotalLength()).toBeCloseTo(LABS[i].value / 100, 1));
    // Outermost first: the first track is the longest
    expect(tracks[0].getTotalLength()).toBeGreaterThan(tracks[1].getTotalLength());
    expect(values(el)).toEqual(["Genomics 82%", "Imaging 64%", "Proteomics 91%", "Neuro 47%"]);
    expect(el.querySelector(".tc-chart__value[data-strong]")!.textContent).toBe("Proteomics 91%");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Genomics 82%, Imaging 64%, Proteomics 91%, Neuro 47%");
  });

  test("max, format, highlight and the tooltip's share of the target", async () => {
    const el = await drawn(await make({ still: true }));
    el.max = 200;
    el.format = "integer";
    el.unit = " runs";
    el.highlight = "Imaging";
    await settle();
    expect(bars(el)[1].style.stroke).toBe("var(--tc-plot-accent)");
    key(plot(el), "ArrowRight");
    await settle();
    expect([...el.querySelectorAll(".tc-chart__tip-value")].map((v) => v.textContent)).toEqual(["82 runs", "41%"]);
    expect(el.querySelector(".ui-rbr__focus")).not.toBeNull();
    const t = el.querySelector<SVGPathElement>(".ui-rbr__track")!;
    expect(bars(el)[0].getTotalLength() / t.getTotalLength()).toBeCloseTo(0.41, 1);
  });

  test("a full circle writes the emphasised value in the middle instead of naming the rings", async () => {
    const el = await drawn(await make({ still: true, data: LABS.slice(0, 2) }));
    el.sweep = 360;
    await settle();
    expect(values(el)).toEqual(["82%"]);
    expect(el.querySelector(".ui-rbr__centre")).not.toBeNull();
    el.hideLabels = true;
    await settle();
    expect(values(el)).toEqual([]);
    expect(bars(el)[0].getTotalLength()).toBeGreaterThan(0);
  });

  test("the entrance sweeps round from the start, then a data change glides and a removed ring leaves", async () => {
    const el = await drawn(await make());
    const len = () => bars(el)[0]?.getTotalLength() ?? 0;
    await expect.poll(len, { timeout: 4000 }).toBeGreaterThan(300);
    const full = len();
    el.data = [{ label: "Genomics", value: 20 }, ...LABS.slice(1, 3)];
    await settle();
    await expect.poll(len, { timeout: 4000 }).toBeLessThan(full / 2);
    await expect.poll(() => el.querySelectorAll(".ui-rbr__track").length, { timeout: 4000 }).toBe(3);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    const props = { title: "Labs", data: LABS, still: true, sweep: 180, onMarkClick: (e: { label: string }) => clicks.push(e.label) };
    await act(async () => root.render(React.createElement(RadialBarChart, { ...props, view: "table" })));
    await settle();
    const el = host.querySelector<TcRadialBarChart>("tc-radial-bar-chart")!;
    expect(el.heading).toBe("Labs");
    expect(el.sweep).toBe(180);
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(RadialBarChart, props)));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Genomics"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
