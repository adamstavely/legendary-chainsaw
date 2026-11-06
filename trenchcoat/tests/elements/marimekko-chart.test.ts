/*
 * <tc-marimekko-chart> in real browsers: the shared chart behaviour (chart-kit), column widths by share of the whole
 * and blocks stacked to 100%, the emphasised series and legend, rows that add up, a data change, the React wrapper
 * and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/marimekko-chart";
import type { TcMarimekkoChart } from "../../src/elements/marimekko-chart";
import { MarimekkoChart } from "../../src/elements/react/marimekko-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const SPEND = [
  { x: "Genomics", series: "Staff", value: 300 },
  { x: "Genomics", series: "Equipment", value: 300 },
  { x: "Imaging", series: "Staff", value: 100 },
  { x: "Imaging", series: "Equipment", value: 300 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcMarimekkoChart>(
    html`<div style="width: 600px"><tc-marimekko-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Spend by lab" .data=${o.data ?? SPEND}></tc-marimekko-chart></div>`,
  ).then((w) => w.querySelector("tc-marimekko-chart")!);
const blocks = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-mmk__block")];
const ticks = (el: Element) => [...el.querySelectorAll(".tc-chart__tick")].map((t) => t.textContent);

describe("tc-marimekko-chart", () => {
  chartBasics({ tag: "tc-marimekko-chart", ui: "mmk", kind: "Marimekko chart", make: make as never, marks: 4, firstRead: /^Genomics Staff: 50% · 300/ });

  test("columns as wide as their share, blocks stacked to 100%; the first series in the accent, in the legend", async () => {
    const el = await drawn(await make({ still: true }));
    const b = blocks(el).map((p) => p.getBBox());
    // Genomics is 600 of 1000, Imaging 400
    expect(b[0].width / b[2].width).toBeCloseTo(1.5, 1);
    expect(b[0].height).toBeCloseTo(b[1].height, 0);
    expect(b[3].height / b[2].height).toBeCloseTo(3, 1);
    expect(blocks(el).map((p) => p.style.fill)).toEqual(["var(--tc-plot-accent)", "var(--tc-plot-rest)", "var(--tc-plot-accent)", "var(--tc-plot-rest)"]);
    expect([...el.querySelectorAll(".tc-chart__key")].map((k) => k.textContent!.trim())).toEqual(["Staff", "Equipment"]);
    expect(ticks(el)).toEqual(["0%", "50%", "100%", "Genomics", "60%", "Imaging", "40%"]);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Columns: Genomics 60%, Imaging 40%. Series: Staff, Equipment");
  });

  test("highlight names a series; rows with the same column and series add up; the tooltip", async () => {
    const el = await drawn(await make({ still: true, data: [...SPEND, { x: "Imaging", series: "Staff", value: 200 }, { x: "Imaging", series: "Compute", value: 100 }] }));
    el.highlight = "Equipment";
    await settle();
    expect([...el.querySelectorAll(".tc-chart__key .tc-chart__swatch")].map((s) => (s as HTMLElement).style.background)).toEqual([
      "var(--tc-plot-ink-2)",
      "var(--tc-plot-accent)",
      "var(--tc-plot-ink-3)",
    ]);
    key(plot(el), "End");
    key(plot(el), "ArrowLeft");
    key(plot(el), "ArrowLeft");
    await settle();
    // Imaging Staff: 100 + 200 of 700
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("Imaging · Staff");
    expect([...el.querySelectorAll(".tc-chart__tip-value")].map((t) => t.textContent)).toEqual(["43%", "300", "54%"]);
  });

  test("the entrance raises the blocks once on screen; a data change glides the widths", async () => {
    const el = await drawn(await make());
    const w = () => blocks(el)[0].getBBox().width;
    const h = () => blocks(el)[1].getBBox().height;
    await expect.poll(h, { timeout: 4000 }).toBeGreaterThan(50);
    const before = w();
    el.data = SPEND.map((d) => (d.x === "Imaging" ? { ...d, value: d.value * 3 } : d));
    await settle();
    await expect.poll(w, { timeout: 4000 }).toBeLessThan(before * 0.7);
  });

  test("React wrapper: props reach the element; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(MarimekkoChart, { title: "Spend", data: SPEND, still: true, onMarkClick: (e) => clicks.push(`${e.label}/${e.series}`) })));
    const el = host.querySelector<TcMarimekkoChart>("tc-marimekko-chart")!;
    await drawn(el);
    expect(el.heading).toBe("Spend");
    key(plot(el), "ArrowRight");
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Genomics/Equipment"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
