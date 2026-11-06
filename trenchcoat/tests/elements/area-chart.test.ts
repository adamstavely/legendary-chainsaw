/*
 * <tc-area-chart> in real browsers: the shared chart behaviour (chart-kit), stacked by default for several series,
 * percent and overlapping stacks, categorical inks, one series' accent, the tooltip's shares, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/area-chart";
import type { TcAreaChart } from "../../src/elements/area-chart";
import { AreaChart } from "../../src/elements/react/area-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const ROWS = [
  { month: "2026-01", hot: 100, warm: 300, archive: 600 },
  { month: "2026-02", hot: 120, warm: 330, archive: 650 },
  { month: "2026-03", hot: 150, warm: 350, archive: 700 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcAreaChart>(
    html`<div style="width: 640px"><tc-area-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Storage by tier" unit=" TB" .x=${"month"} .y=${["hot", "warm", "archive"]} .data=${o.data ?? ROWS}></tc-area-chart></div>`,
  ).then((w) => w.querySelector("tc-area-chart")!);
const areas = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".tc-xy__area")];

describe("tc-area-chart", () => {
  chartBasics({ tag: "tc-area-chart", ui: "arc", kind: "Area chart", make: make as never, marks: 3, firstRead: /^Jan.*: hot 100 TB, warm 300 TB, archive 600 TB/ });

  test("several series stack by default, each in its own ink, named at their ends", async () => {
    const el = await drawn(await make({ still: true }));
    expect(areas(el)).toHaveLength(3);
    expect(areas(el).every((a) => a.hasAttribute("data-stacked"))).toBe(true);
    expect(areas(el).map((a) => a.style.fill).sort()).toEqual(["var(--tc-plot-ink-1)", "var(--tc-plot-ink-2)", "var(--tc-plot-ink-3)"]);
    expect([...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent)).toEqual(["hot", "warm", "archive"]);
  });

  test("percent stacking: the tooltip gives each layer's share; none overlaps", async () => {
    const el = await drawn(await make({ still: true }));
    el.stack = "percent";
    await settle();
    key(plot(el), "ArrowRight");
    await settle();
    expect([...el.querySelectorAll(".tc-chart__tip-value")].map((t) => t.textContent)).toEqual(["60% · 600 TB", "30% · 300 TB", "10% · 100 TB"]);
    el.stack = "none";
    await settle();
    expect(areas(el).some((a) => a.hasAttribute("data-stacked"))).toBe(false);
  });

  test("one series takes the accent", async () => {
    const el = await drawn(await make({ still: true }));
    el.y = ["hot"];
    await settle();
    expect(areas(el).map((a) => a.style.fill)).toEqual(["var(--tc-plot-accent)"]);
  });

  test("React wrapper: props reach the element", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(AreaChart, { title: "Storage", data: ROWS, x: "month", y: ["hot", "warm"], stack: "percent", still: true })));
    const el = await drawn(host.querySelector<TcAreaChart>("tc-area-chart")!);
    expect(el.stack).toBe("percent");
    expect(areas(el)).toHaveLength(2);
    await act(async () => root.unmount());
    host.remove();
  });
});
