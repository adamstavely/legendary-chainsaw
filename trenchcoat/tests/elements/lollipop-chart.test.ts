/*
 * <tc-lollipop-chart> in real browsers: the shared chart behaviour (chart-kit), the order and emphasis, missing
 * values, the highlight and unit, upright stems, the entrance and a data change, and the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/lollipop-chart";
import type { TcLollipopChart } from "../../src/elements/lollipop-chart";
import { LollipopChart } from "../../src/elements/react/lollipop-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const LABS = [
  { label: "Imaging", value: 236 },
  { label: "Genomics", value: 412 },
  { label: "Climate", value: 291 },
  { label: "Neuro", value: 377 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcLollipopChart>(
    html`<div style="width: 600px"><tc-lollipop-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="GPU hours" .data=${o.data ?? LABS}></tc-lollipop-chart></div>`,
  ).then((w) => w.querySelector("tc-lollipop-chart")!);
const dots = (el: Element) => [...el.querySelectorAll<SVGCircleElement>(".ui-lpp__dot")];
const stems = (el: Element) => [...el.querySelectorAll<SVGLineElement>(".ui-lpp__stem")];
const values = (el: Element) => [...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent);

describe("tc-lollipop-chart", () => {
  chartBasics({ tag: "tc-lollipop-chart", ui: "lpp", kind: "Lollipop chart", make: make as never, marks: 4, firstRead: /^Genomics: 412/ });

  test("ordered from the largest; the largest takes the accent; values past the dots", async () => {
    const el = await drawn(await make({ still: true }));
    expect(values(el)).toEqual(["412", "377", "291", "236"]);
    expect(stems(el).map((s) => s.style.stroke)).toEqual(["var(--tc-plot-accent)", "var(--tc-plot-rest)", "var(--tc-plot-rest)", "var(--tc-plot-rest)"]);
    expect(dots(el)[0].style.fill).toBe("var(--tc-plot-accent)");
    expect(dots(el)[1].style.fill).toBe("var(--tc-plot-line-rest)");
    expect(el.querySelector(".tc-chart__value[data-strong]")!.textContent).toBe("412");
    // Lying down: the dots step down the plot, each stem shorter than the one above
    const xs = dots(el).map((d) => Number(d.getAttribute("cx")));
    const ys = dots(el).map((d) => Number(d.getAttribute("cy")));
    expect(xs).toEqual([...xs].sort((a, b) => b - a));
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Genomics 412, Neuro 377, Climate 291, Imaging 236");
  });

  test("sort=false keeps the data's order; a missing value is written as a dash; highlight and unit", async () => {
    const el = await drawn(await make({ still: true, data: [...LABS, { label: "Astro", value: null }] }));
    el.sort = false;
    el.highlight = "Climate";
    el.unit = " h";
    await settle();
    expect([...el.querySelectorAll(".tc-sr-only tbody th")].map((t) => t.textContent)).toEqual(["Imaging", "Genomics", "Climate", "Neuro", "Astro"]);
    expect(values(el).at(-1)).toBe("–");
    expect(stems(el)[2].style.stroke).toBe("var(--tc-plot-accent)");
    key(plot(el), "End");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/Astro: –, 5 of 5/);
    key(plot(el), "Home");
    await settle();
    expect(el.querySelector(".tc-chart__tip-value")!.textContent).toBe("236 h");
    // The sort attribute turns it off as "false"
    el.setAttribute("sort", "false");
    expect(el.sort).toBe(false);
  });

  test("upright: stems stand from the baseline, names below", async () => {
    const el = await drawn(await make({ still: true }));
    el.orientation = "vertical";
    await settle();
    const s = stems(el);
    expect(s.every((l) => l.getAttribute("x1") === l.getAttribute("x2"))).toBe(true);
    // The tallest stem first (the smallest y at its end)
    const ends = s.map((l) => Number(l.getAttribute("y2")));
    expect(ends).toEqual([...ends].sort((a, b) => a - b));
    expect([...el.querySelectorAll(".tc-chart__tick")].map((t) => t.textContent)).toEqual(expect.arrayContaining(["Genomics", "Imaging"]));
  });

  test("the entrance grows the stems once on screen; a data change reorders and glides", async () => {
    const el = await drawn(await make());
    const len = (label: string) => {
      const i = [...el.querySelectorAll(".tc-sr-only tbody th")].findIndex((t) => t.textContent === label);
      const l = stems(el)[i];
      return Math.abs(Number(l.getAttribute("x2")) - Number(l.getAttribute("x1")));
    };
    await expect.poll(() => len("Genomics"), { timeout: 4000 }).toBeGreaterThan(300);
    el.data = LABS.map((d) => ({ ...d, value: d.label === "Imaging" ? 500 : d.value }));
    await settle();
    expect([...el.querySelectorAll(".tc-sr-only tbody th")][0].textContent).toBe("Imaging");
    await expect.poll(() => len("Imaging"), { timeout: 4000 }).toBeGreaterThan(len("Genomics"));
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(LollipopChart, { title: "Labs", data: LABS, still: true, orientation: "vertical", view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcLollipopChart>("tc-lollipop-chart")!;
    expect(el.heading).toBe("Labs");
    expect(el.orientation).toBe("vertical");
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(LollipopChart, { title: "Labs", data: LABS, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Genomics"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
