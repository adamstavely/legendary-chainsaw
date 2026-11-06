/*
 * <tc-donut-chart> in real browsers: the shared chart behaviour (chart-kit), the total in the middle with its label,
 * the highlighted value or the page's number there, the legend beside or under it, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/donut-chart";
import type { TcDonutChart } from "../../src/elements/donut-chart";
import { DonutChart } from "../../src/elements/react/donut-chart";
import { chartBasics, drawn } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const FINDINGS = [
  { label: "Critical", value: 3 },
  { label: "High", value: 9 },
  { label: "Medium", value: 17 },
  { label: "Low", value: 21 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[]; width?: number } = {}) =>
  fixture<TcDonutChart>(
    html`<div style=${`width: ${o.width ?? 520}px`}><tc-donut-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Open findings" center-label="Findings" .data=${o.data ?? FINDINGS}></tc-donut-chart></div>`,
  ).then((w) => w.querySelector("tc-donut-chart")!);
const total = (el: Element) => el.querySelector(".tc-pie__total")!.textContent;
const swatches = (el: Element) => [...el.querySelectorAll<SVGRectElement>(".tc-pie__swatch")];

describe("tc-donut-chart", () => {
  chartBasics({ tag: "tc-donut-chart", ui: "dnt", kind: "Donut chart", make: make as never, marks: 4, firstRead: /^Critical: 6% · 3/ });

  test("the total in the middle with its label; a legend of every slice and its share", async () => {
    const el = await drawn(await make({ still: true }));
    expect(total(el)).toBe("50");
    expect([...el.querySelectorAll(".tc-chart__tick")].map((t) => t.textContent)).toContain("Findings");
    expect(swatches(el)).toHaveLength(4);
    expect([...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent)).toEqual(["Critical", "6%", "High", "18%", "Medium", "34%", "Low", "42%"]);
  });

  test("the middle: the highlighted value, a number of the page's, or nothing", async () => {
    const el = await drawn(await make({ still: true }));
    el.centerValue = "highlight";
    await settle();
    expect(total(el)).toBe("21");
    el.centerValue = 7;
    await settle();
    expect(total(el)).toBe("7");
    el.centerValue = null;
    await settle();
    expect(el.querySelector(".tc-pie__total")).toBeNull();
  });

  test("the legend sits beside when there's room, under when narrow, or not at all", async () => {
    const wide = await drawn(await make({ still: true }));
    const wideBox = swatches(wide)[0].getBBox();
    const narrow = await drawn(await make({ still: true, width: 260 }));
    const narrowBoxes = swatches(narrow).map((s) => s.getBBox());
    // Beside: one column to the right of centre. Under: two columns below the ring
    expect(wideBox.x).toBeGreaterThan(wide.querySelector(".tc-chart__svg")!.clientWidth / 2);
    expect(narrowBoxes[1].x).toBeGreaterThan(narrowBoxes[0].x);
    expect(narrowBoxes[2].y).toBeGreaterThan(narrowBoxes[0].y);
    narrow.legend = "none";
    await settle();
    expect(swatches(narrow)).toHaveLength(0);
  });

  test("the total counts up with the sweep", async () => {
    const el = await drawn(await make());
    await expect.poll(() => total(el), { timeout: 4000 }).toBe("50");
  });

  test("React wrapper: props reach the element", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "520px";
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(DonutChart, { title: "Findings", data: FINDINGS, centerLabel: "Open", innerRadius: 0.5, still: true })));
    const el = await drawn(host.querySelector<TcDonutChart>("tc-donut-chart")!);
    expect(el.innerRadius).toBe(0.5);
    expect(el.centerLabel).toBe("Open");
    await act(async () => root.unmount());
    host.remove();
  });
});
