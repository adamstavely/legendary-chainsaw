/*
 * <tc-waffle-chart> in real browsers: the shared chart behaviour (chart-kit), the cells handed out by the largest
 * remainder, the emphasised category and its large share, a total above the sum, a data change, the React wrapper
 * and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/waffle-chart";
import { allocateCells, type TcWaffleChart } from "../../src/elements/waffle-chart";
import { WaffleChart } from "../../src/elements/react/waffle-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const COMPUTE = [
  { label: "Genomics", value: 42 },
  { label: "Climate", value: 27 },
  { label: "Imaging", value: 19 },
  { label: "Neuro", value: 12 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcWaffleChart>(
    html`<div style="width: 560px"><tc-waffle-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Compute hours" .data=${o.data ?? COMPUTE}></tc-waffle-chart></div>`,
  ).then((w) => w.querySelector("tc-waffle-chart")!);
const cells = (el: Element) => [...el.querySelectorAll<SVGRectElement>(".ui-wff__cell")];
const owners = (el: Element) => cells(el).map((c) => Number(c.getAttribute("data-k")));
const count = (xs: number[], k: number) => xs.filter((x) => x === k).length;

describe("tc-waffle-chart", () => {
  chartBasics({ tag: "tc-waffle-chart", ui: "wff", kind: "Waffle chart", make: make as never, marks: 4, firstRead: /^Genomics: 42 · 42%/ });

  test("allocateCells: the largest remainder makes the counts add up exactly; a larger total leaves cells over", () => {
    expect(allocateCells([1, 1, 1], 100)).toEqual([34, 33, 33]);
    expect(allocateCells([30, 20], 100, 100)).toEqual([30, 20]);
    expect(allocateCells([0, 0], 10)).toEqual([0, 0]);
    // A total below the sum counts as the sum
    expect(allocateCells([60, 60], 10, 50)).toEqual([5, 5]);
  });

  test("the cells in reading order, the first category in the accent, its share written large", async () => {
    const el = await drawn(await make({ still: true }));
    const k = owners(el);
    expect(k).toHaveLength(100);
    expect([0, 1, 2, 3].map((i) => count(k, i))).toEqual([42, 27, 19, 12]);
    expect(k.slice(40, 44)).toEqual([0, 0, 1, 1]);
    expect(cells(el)[0].style.fill).toBe("var(--tc-plot-accent)");
    expect(cells(el)[50].style.fill).toBe("var(--tc-plot-ink-2)");
    expect(el.querySelector(".ui-wff__figure")!.textContent).toBe("42%");
    expect(el.querySelector(".ui-wff__name")!.textContent).toBe("Genomics");
    expect([...el.querySelectorAll(".tc-chart__key")].map((li) => li.textContent!.trim())).toEqual(["Genomics", "Climate", "Imaging", "Neuro"]);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Out of 100 cells: Genomics 42, Climate 27, Imaging 19, Neuro 12");
  });

  test("highlight, total, columns and the summary's options", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "Imaging";
    el.total = 200;
    el.cells = 50;
    el.columns = 5;
    el.summaryLabel = "of the cluster";
    await settle();
    const k = owners(el);
    expect(k).toHaveLength(50);
    // 100 of 200 is half the cells; the rest stay empty
    expect(count(k, -1)).toBe(25);
    expect(el.querySelectorAll(".ui-wff__cell[data-empty]")).toHaveLength(25);
    expect(cells(el)[k.indexOf(2)].style.fill).toBe("var(--tc-plot-accent)");
    expect(el.querySelector(".ui-wff__figure")!.textContent).toBe("10%");
    expect(el.querySelector(".ui-wff__name")!.textContent).toBe("of the cluster");
    el.hideSummary = true;
    await settle();
    expect(el.querySelector(".ui-wff__figure")).toBeNull();
    el.hideSummary = false;
    el.highlight = "none";
    await settle();
    expect(el.querySelector(".ui-wff__figure")).toBeNull();
  });

  test("the keyboard rings the category's cells; a data change moves the cells and the share glides", async () => {
    const el = await drawn(await make());
    await expect.poll(() => el.querySelector(".ui-wff__figure")?.textContent, { timeout: 4000 }).toBe("42%");
    key(plot(el), "ArrowRight");
    key(plot(el), "ArrowRight");
    await settle();
    expect(el.querySelectorAll(".ui-wff__cell[data-focus]")).toHaveLength(27);
    el.data = COMPUTE.map((d, i) => ({ ...d, value: i === 0 ? 12 : d.value }));
    await settle();
    await expect.poll(() => el.querySelector(".ui-wff__figure")!.textContent, { timeout: 4000 }).toBe("17%");
    expect(count(owners(el), 0)).toBe(17);
  });

  test("React wrapper: props reach the element; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "560px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(WaffleChart, { title: "Compute", data: COMPUTE, still: true, cells: 50, onMarkClick: (e) => clicks.push(e.label) })));
    const el = host.querySelector<TcWaffleChart>("tc-waffle-chart")!;
    await drawn(el);
    expect(el.heading).toBe("Compute");
    expect(cells(el)).toHaveLength(50);
    cells(el)[49].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Neuro", "Genomics"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
