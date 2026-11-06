/*
 * <tc-slope-chart> in real browsers: the shared chart behaviour (chart-kit), a long table's first and last periods,
 * a wide table's fields and the side headings, emphasis and labels, the tooltip's change, the entrance and a data
 * change, and the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/slope-chart";
import type { TcSlopeChart } from "../../src/elements/slope-chart";
import { SlopeChart } from "../../src/elements/react/slope-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const UPTIME = [
  { label: "NovaSeq", x: "Q1", value: 91 },
  { label: "Cryo-EM", x: "Q1", value: 78 },
  { label: "Mass spec", x: "Q1", value: 86 },
  { label: "NovaSeq", x: "Q2", value: 50 },
  { label: "NovaSeq", x: "Q4", value: 96 },
  { label: "Cryo-EM", x: "Q4", value: 88 },
  { label: "Mass spec", x: "Q4", value: 81 },
];
const WIDE = [
  { label: "Genomics", y2024: 31, y2025: 38 },
  { label: "Imaging", y2024: 27, y2025: 22 },
  { label: "Proteomics", y2024: 19, y2025: 29 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcSlopeChart>(
    html`<div style="width: 600px"><tc-slope-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Uptime" .data=${o.data ?? UPTIME}></tc-slope-chart></div>`,
  ).then((w) => w.querySelector("tc-slope-chart")!);
const lines = (el: Element) => [...el.querySelectorAll<SVGLineElement>(".ui-slc__line")];
const periods = (el: Element) => [...el.querySelectorAll(".ui-slc__period")].map((t) => t.textContent);

describe("tc-slope-chart", () => {
  chartBasics({ tag: "tc-slope-chart", ui: "slc", kind: "Slope chart", make: make as never, marks: 3, firstRead: /^NovaSeq: Q1 91 → Q4 96/ });

  test("a long table: the first and last periods, the biggest rise emphasised and drawn last, names and values both sides", async () => {
    const el = await drawn(await make({ still: true }));
    expect(periods(el)).toEqual(["Q1", "Q4"]);
    // Cryo-EM rose most (+10): accent, thicker, on top
    const ls = lines(el);
    expect(ls.at(-1)!.style.stroke).toBe("var(--tc-plot-accent)");
    expect(ls.at(-1)!.hasAttribute("data-hi")).toBe(true);
    expect(ls.filter((l) => l.hasAttribute("data-hi"))).toHaveLength(1);
    const texts = [...el.querySelectorAll(".tc-chart__svg .tc-chart__tick:not(.ui-slc__period)")].map((t) => t.textContent);
    expect(texts).toEqual(["NovaSeq 91", "96 NovaSeq", "Cryo-EM 78", "88 Cryo-EM", "Mass spec 86", "81 Mass spec"]);
    // A fall slopes down to the right (a larger y)
    const ms = ls.find((l, i) => i === 1)!;
    expect(Number(ms.getAttribute("y2"))).toBeGreaterThan(Number(ms.getAttribute("y1")));
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Q1 to Q4: NovaSeq 91 to 96, Cryo-EM 78 to 88, Mass spec 86 to 81");
  });

  test("a wide table with start and end; side headings and the tooltip's change", async () => {
    const el = await drawn(await make({ still: true, data: WIDE }));
    el.start = "y2024";
    el.end = "y2025";
    el.unit = "%";
    await settle();
    expect(periods(el)).toEqual(["y2024", "y2025"]);
    el.startLabel = "2024";
    el.endLabel = "2025";
    await settle();
    expect(periods(el)).toEqual(["2024", "2025"]);
    key(plot(el), "ArrowRight");
    key(plot(el), "ArrowRight");
    await settle();
    const tip = [...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim());
    expect(tip).toEqual(["2024 27%", "2025 22%", "Change −5%"]);
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/Imaging: 2024 27% → 2025 22%, 2 of 3/);
  });

  test("hide-labels leaves the sides unwritten; highlight picks another", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "NovaSeq";
    el.hideLabels = true;
    await settle();
    expect(el.querySelectorAll(".tc-chart__svg .tc-chart__tick:not(.ui-slc__period)")).toHaveLength(0);
    // Lines keep the order they were first drawn in: NovaSeq's is the first
    expect(lines(el).map((l) => l.hasAttribute("data-hi"))).toEqual([true, false, false]);
    expect(lines(el)[0].style.stroke).toBe("var(--tc-plot-accent)");
  });

  test("the entrance draws the lines once on screen; a data change glides the ends", async () => {
    const el = await drawn(await make());
    await expect.poll(() => lines(el).every((l) => !l.hasAttribute("stroke-dasharray")), { timeout: 4000 }).toBe(true);
    const ms = () => lines(el).find((_, i) => i === 1)!;
    const y0 = Number(ms().getAttribute("y2"));
    el.data = UPTIME.map((d) => (d.label === "Mass spec" && d.x === "Q4" ? { ...d, value: 70 } : d));
    await settle();
    await expect.poll(() => Number(ms().getAttribute("y2")), { timeout: 4000 }).toBeGreaterThan(y0 + 20);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(SlopeChart, { title: "Grants", data: WIDE, start: "y2024", end: "y2025", still: true, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcSlopeChart>("tc-slope-chart")!;
    expect(el.heading).toBe("Grants");
    expect(el.start).toBe("y2024");
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(SlopeChart, { title: "Grants", data: WIDE, start: "y2024", end: "y2025", still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Genomics"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
