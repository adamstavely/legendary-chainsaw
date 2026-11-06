/*
 * <tc-segmented-bar> in real browsers: the shared chart behaviour (chart-kit), parts sized by share and ordered from
 * the largest with the largest emphasised, the list of names, values and shares, sort, the thin variant, the
 * categorical inks, the entrance and a data change, and the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/segmented-bar";
import type { TcSegmentedBar } from "../../src/elements/segmented-bar";
import { SegmentedBar } from "../../src/elements/react/segmented-bar";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const COMPUTE = [
  { label: "Imaging", value: 150 },
  { label: "Genomics", value: 500 },
  { label: "Climate", value: 250 },
  { label: "Neuro", value: 100 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcSegmentedBar>(
    html`<div style="width: 600px"><tc-segmented-bar look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Compute by lab" .data=${o.data ?? COMPUTE}></tc-segmented-bar></div>`,
  ).then((w) => w.querySelector("tc-segmented-bar")!);
const parts = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-sgb__part")];
const widths = (el: Element) => parts(el).map((p) => Math.round(p.getBBox().width));
const names = (el: Element) => [...el.querySelectorAll(".tc-chart__tick:not([text-anchor='end'])")].map((t) => t.textContent);

describe("tc-segmented-bar", () => {
  chartBasics({ tag: "tc-segmented-bar", ui: "sgb", kind: "Segmented bar", make: make as never, marks: 4, firstRead: /^Genomics: 500 \(50%\)/ });

  test("parts sized by share, from the largest; the largest in the accent, the rest in quiet shades; the list below", async () => {
    const el = await drawn(await make({ still: true }));
    const w = widths(el);
    // 50%, 25%, 15%, 10% of the width less three 2px gaps
    expect(w[0]).toBeGreaterThan(w[1] * 1.9);
    expect(w[0]).toBeLessThan(w[1] * 2.1);
    expect(Math.abs(w.reduce((a, b) => a + b, 0) + 6 - Number(el.querySelector(".tc-chart__svg")!.getAttribute("viewBox")!.split(" ")[2]))).toBeLessThan(2);
    const fills = parts(el).map((p) => p.style.fill);
    expect(fills[0]).toBe("var(--tc-plot-accent)");
    expect(fills[3]).toBe("var(--tc-plot-rest)");
    expect(fills[1]).toContain("color-mix");
    expect(new Set(fills).size).toBe(4);
    expect(names(el)).toEqual(["Genomics", "Climate", "Imaging", "Neuro"]);
    expect([...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent)).toEqual(["500", "250", "150", "100"]);
    expect([...el.querySelectorAll(".tc-chart__tick[text-anchor='end']")].map((t) => t.textContent)).toEqual(["50%", "25%", "15%", "10%"]);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Total 1,000. Genomics 50%, Climate 25%, Imaging 15%, Neuro 10%");
  });

  test("sort=false keeps the data's order; highlight and categorical inks", async () => {
    const el = await drawn(await make({ still: true }));
    el.setAttribute("sort", "false");
    el.highlight = "Neuro";
    await settle();
    expect(names(el)).toEqual(["Imaging", "Genomics", "Climate", "Neuro"]);
    expect(parts(el)[3].style.fill).toBe("var(--tc-plot-accent)");
    el.colorMode = "categorical";
    await settle();
    // The inks in the data's order (parts stay in the DOM in the order first seen: Genomics, Climate, Imaging, Neuro)
    expect(parts(el)[2].style.fill).toBe("var(--tc-plot-ink-1)");
    expect(parts(el).map((p) => p.style.fill).sort()).toEqual(["var(--tc-plot-ink-1)", "var(--tc-plot-ink-2)", "var(--tc-plot-ink-3)", "var(--tc-plot-ink-4)"]);
  });

  test("the thin variant without the list is a slim bar alone", async () => {
    const el = await drawn(await make({ still: true }));
    el.variant = "thin";
    el.setAttribute("list", "false");
    await settle();
    expect(parts(el)[0].getBBox().height).toBe(8);
    expect(el.querySelectorAll(".tc-chart__tick")).toHaveLength(0);
    expect(Number(el.querySelector(".tc-chart__svg")!.getAttribute("height"))).toBe(12);
  });

  test("parts grow once on screen; a data change glides", async () => {
    const el = await drawn(await make());
    await expect.poll(() => widths(el)[0], { timeout: 4000 }).toBeGreaterThan(250);
    el.data = COMPUTE.map((d) => (d.label === "Genomics" ? { ...d, value: 100 } : d));
    await settle();
    await expect.poll(() => Math.round(parts(el)[0].getBBox().width), { timeout: 4000 }).toBeLessThan(100);
    // Climate is the largest now
    key(plot(el), "ArrowRight");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^Climate: 250 \(42%\)/);
  });

  test("React wrapper: props reach the element; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(SegmentedBar, { title: "Compute", data: COMPUTE, variant: "thin", still: true, onMarkClick: (e) => clicks.push(e.label) })));
    const el = await drawn(host.querySelector<TcSegmentedBar>("tc-segmented-bar")!);
    expect(el.heading).toBe("Compute");
    expect(el.variant).toBe("thin");
    parts(el)[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(clicks).toEqual(["Climate"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
