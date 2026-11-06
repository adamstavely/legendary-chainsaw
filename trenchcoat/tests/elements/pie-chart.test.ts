/*
 * <tc-pie-chart> in real browsers: the shared chart behaviour (chart-kit), slices in the chart inks or emphasis,
 * shares written outside the circle, label modes, sort, the lifted slice, the sweep, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/pie-chart";
import type { TcPieChart } from "../../src/elements/pie-chart";
import { PieChart } from "../../src/elements/react/pie-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const FUNDING = [
  { label: "Federal grants", value: 50 },
  { label: "Foundations", value: 25 },
  { label: "Industry", value: 15 },
  { label: "Other", value: 10 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcPieChart>(
    html`<div style="width: 520px"><tc-pie-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Funding by source" .data=${o.data ?? FUNDING}></tc-pie-chart></div>`,
  ).then((w) => w.querySelector("tc-pie-chart")!);
const slices = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".tc-pie__slice")];
const labels = (el: Element) => [...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent);

describe("tc-pie-chart", () => {
  chartBasics({ tag: "tc-pie-chart", ui: "pie", kind: "Pie chart", make: make as never, marks: 4, firstRead: /^Federal grants: 50% · 50/ });

  test("each slice in the next ink, its share outside the circle; read as the total and the largest shares", async () => {
    const el = await drawn(await make({ still: true }));
    expect(slices(el).map((s) => s.style.fill.split(";")[0])).toEqual(["var(--tc-plot-ink-1)", "var(--tc-plot-ink-2)", "var(--tc-plot-ink-3)", "var(--tc-plot-ink-4)"]);
    expect(labels(el)).toEqual(["50%", "25%", "15%", "10%"]);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("4 items, total 100. Federal grants 50%, Foundations 25%, Industry 15%, Other 10%");
  });

  test("emphasis paints the largest; label modes; sort", async () => {
    const el = await drawn(await make({ still: true, data: [...FUNDING].reverse() }));
    el.colorMode = "emphasis";
    el.labelMode = "label";
    await settle();
    expect(slices(el).map((s) => s.style.fill.split(";")[0])).toEqual(["var(--tc-plot-rest)", "var(--tc-plot-rest)", "var(--tc-plot-rest)", "var(--tc-plot-accent)"]);
    expect(labels(el)).toEqual(["Other", "Industry", "Foundations", "Federal grants"]);
    el.sort = true;
    el.labelMode = "none";
    await settle();
    expect(labels(el)).toEqual([]);
    expect([...el.querySelectorAll(".tc-sr-only tbody th")].map((t) => t.textContent)).toEqual(["Federal grants", "Foundations", "Industry", "Other"]);
  });

  test("the active slice lifts out", async () => {
    const el = await drawn(await make({ still: true }));
    key(plot(el), "ArrowRight");
    await settle();
    // Firefox writes a zero offset as translate(0px)
    const still = /^translate\(0px(, 0px)?\)$/;
    expect(slices(el)[0].style.transform).not.toMatch(still);
    expect(slices(el)[1].style.transform).toMatch(still);
    expect(el.querySelector(".tc-chart__focus")).not.toBeNull();
  });

  test("React wrapper: props reach the element", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "520px";
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(PieChart, { title: "Funding", data: FUNDING, labelMode: "value", still: true })));
    const el = await drawn(host.querySelector<TcPieChart>("tc-pie-chart")!);
    expect(labels(el)).toEqual(["50", "25", "15", "10"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
