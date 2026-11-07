/*
 * <tc-small-multiples> in real browsers: the rows split into a panel per facet value in each sort order, bare charts
 * from the spec, a shared value axis (and none), columns fitted to the width or fixed, one legend with every series in
 * every panel, linked pointing, problems shown instead of the grid, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/small-multiples";
import type { SmallMultiplesCheck, TcSmallMultiples } from "../../src/elements/small-multiples";
import type { ChartSpec } from "../../src/elements/internal/chart/spec";
import { SmallMultiples } from "../../src/elements/react/small-multiples";
import { key } from "./chart-kit";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04"];
const LABS: Record<string, number[]> = { Imaging: [96, 102, 88, 110], Genomics: [182, 196, 210, 188], Climate: [12, 14, 11, 15] };
const ROWS = Object.entries(LABS).flatMap(([lab, v]) => MONTHS.map((month, k) => ({ lab, month, samples: v[k] })));
const LINE: ChartSpec = { type: "line", title: "Samples by lab", data: ROWS, encoding: { x: "month", y: "samples" }, options: { still: true } };

async function make(o: { spec?: ChartSpec | null; facet?: string; look?: "standard" | "clean"; width?: number } = {}) {
  const wrap = await fixture<HTMLElement>(
    html`<div style=${`width: ${o.width ?? 760}px`}><tc-small-multiples look=${o.look ?? "standard"} facet=${o.facet ?? "lab"} .spec=${o.spec === undefined ? LINE : o.spec}></tc-small-multiples></div>`,
  );
  return wrap.querySelector<TcSmallMultiples>("tc-small-multiples")!;
}
/** The panels' charts, once every one has drawn */
async function panels(el: TcSmallMultiples, tag = "tc-line-chart", n = 3) {
  await expect.poll(() => el.querySelectorAll(`${tag} .tc-chart__svg`).length, { timeout: 5000 }).toBe(n);
  await settle();
  return [...el.querySelectorAll<HTMLElement & Record<string, unknown>>(tag)];
}
const names = (el: Element) => [...el.querySelectorAll(".ui-sml__name")].map((n) => n.textContent);
const yTicks = (chart: Element) => [...chart.querySelectorAll('.tc-chart__tick[text-anchor="end"]')].map((t) => t.textContent);
const cols = (el: Element) => getComputedStyle(el.querySelector(".ui-sml__grid")!).gridTemplateColumns.split(" ").length;

describe("tc-small-multiples", () => {
  for (const look of ["standard", "clean"] as const)
    test(`${look}: one card with the heading, a list of panels, each a bare chart named by its facet value`, async () => {
      const el = await make({ look });
      const charts = await panels(el);
      expect(el.dataset.ui).toBe("sml");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Samples by lab");
      const list = el.querySelector("ul.ui-sml__grid")!;
      expect(list.getAttribute("aria-label")).toBe("3 charts, one per lab");
      expect(list.querySelectorAll(":scope > li")).toHaveLength(3);
      expect(charts.every((c) => c.bare && c.look === look)).toBe(true);
      expect(charts.map((c) => c.querySelector(".tc-chart__plot")!.getAttribute("aria-label"))).toEqual(["Imaging", "Genomics", "Climate"]);
      // Each panel's own rows only
      expect((charts[1].data as { lab: string }[]).every((r) => r.lab === "Genomics")).toBe(true);
      // Each plot is a tab stop of its own
      expect(el.querySelectorAll('.tc-chart__plot[tabindex="0"]')).toHaveLength(3);
    });

  test("sort: the data's order, by name, or the largest total first", async () => {
    const el = await make();
    await panels(el);
    expect(names(el)).toEqual(["Imaging", "Genomics", "Climate"]);
    el.sort = "alpha";
    await settle();
    await expect.poll(() => names(el)).toEqual(["Climate", "Genomics", "Imaging"]);
    el.sort = "value";
    await settle();
    await expect.poll(() => names(el)).toEqual(["Genomics", "Imaging", "Climate"]);
    // The charts move with their panels
    const charts = await panels(el);
    expect(charts[0].querySelector(".tc-chart__plot")!.getAttribute("aria-label")).toBe("Genomics");
  });

  test("shared y: every panel the same value axis; none lets each fit its own", async () => {
    const el = await make();
    let charts = await panels(el);
    expect(charts[0].yDomain).toEqual(charts[2].yDomain);
    expect(yTicks(charts[0])).toEqual(yTicks(charts[2]));
    el.shared = "none";
    await settle();
    await expect.poll(() => charts[2].yDomain).toBeUndefined();
    charts = await panels(el);
    expect(yTicks(charts[0])).not.toEqual(yTicks(charts[2]));
  });

  test("bars share a scale too (yDomain on Bar Chart), counting stacked totals", async () => {
    const rows = ROWS.flatMap((r) => [
      { ...r, kind: "Routine" },
      { ...r, kind: "Urgent", samples: Math.round(r.samples / 2) },
    ]);
    const el = await make({ spec: { type: "bar", data: rows, encoding: { x: "month", y: "samples", series: "kind" }, options: { still: true, layout: "stacked" } } });
    const charts = await panels(el, "tc-bar-chart");
    const dom = charts[0].yDomain as [number, number];
    expect(charts.every((c) => (c.yDomain as number[])[1] === dom[1])).toBe(true);
    // Genomics' tallest stack is 210 + 105
    expect(dom[0]).toBe(0);
    expect(dom[1]).toBeGreaterThanOrEqual(315);
  });

  test("columns fit the width, or are fixed but never under 160px a panel", async () => {
    const el = await make({ width: 760 });
    await panels(el);
    await expect.poll(() => cols(el)).toBe(3);
    el.parentElement!.style.width = "420px";
    await expect.poll(() => cols(el)).toBe(1);
    el.columns = 2;
    await expect.poll(() => cols(el)).toBe(2);
    el.parentElement!.style.width = "300px";
    await expect.poll(() => cols(el)).toBe(1);
  });

  test("series: one legend, every series in every panel in one order, each in its own ink", async () => {
    const rows = [
      { lab: "A", month: "2026-01", kind: "Routine", n: 4 },
      { lab: "A", month: "2026-01", kind: "Urgent", n: 2 },
      { lab: "B", month: "2026-01", kind: "Urgent", n: 3 },
      { lab: "B", month: "2026-02", kind: "Urgent", n: 5 },
    ];
    const el = await make({ spec: { type: "line", data: rows, encoding: { x: "month", y: "n", series: "kind" }, options: { still: true } } });
    const charts = await panels(el, "tc-line-chart", 2);
    expect([...el.querySelectorAll(".tc-head .tc-chart__key")].map((k) => k.textContent)).toEqual(["Routine", "Urgent"]);
    // B has no Routine row: it gets an empty one first, so Urgent keeps the second ink
    expect((charts[1].data as { kind: string }[])[0].kind).toBe("Routine");
    expect(charts[1].colorMode).toBe("categorical");
    expect([...charts[1].querySelectorAll<SVGPathElement>(".tc-xy__line")].map((l) => l.style.stroke)).toContain("var(--tc-plot-ink-2)");
  });

  test("pointing at an x in one panel shows it in every other, without their tooltips", async () => {
    const el = await make();
    const charts = await panels(el);
    const plot = charts[0].querySelector<HTMLElement>(".tc-chart__plot")!;
    plot.focus();
    key(plot, "ArrowRight");
    key(plot, "ArrowRight");
    await settle();
    expect(charts.map((c) => c.active)).toEqual([1, 1, 1]);
    expect(charts.map((c) => c.querySelectorAll(".tc-xy__cursor").length)).toEqual([1, 1, 1]);
    expect(charts.map((c) => c.querySelectorAll(".tc-chart__tip").length)).toEqual([1, 0, 0]);
    key(plot, "Escape");
    await settle();
    expect(charts.map((c) => c.active)).toEqual([null, null, null]);
  });

  test("what's wrong is shown instead of the grid, and reported", async () => {
    const checks: SmallMultiplesCheck[] = [];
    const el = await make({ facet: "site" });
    el.addEventListener("tc-spec-check", (e) => checks.push((e as CustomEvent<SmallMultiplesCheck>).detail));
    await expect.poll(() => el.querySelector(".ui-sml__problem")).not.toBeNull();
    expect(el.querySelector(".ui-sml__problem")!.getAttribute("role")).toBe("alert");
    expect(el.querySelector(".ui-sml__problem")!.textContent).toMatch(/No field "site" in the data/);
    expect(el.querySelector(".ui-sml__grid")).toBeNull();
    el.spec = { ...LINE, encoding: { x: "month", y: "count" } };
    await expect.poll(() => el.querySelector(".ui-sml__problem")?.textContent).toMatch(/No field "count"/);
    expect(checks.at(-1)!.valid).toBe(false);
    el.facet = "lab";
    el.spec = LINE;
    await panels(el);
    expect(el.querySelector(".ui-sml__problem")).toBeNull();
    expect(checks.at(-1)!.valid).toBe(true);
  });

  test("type, data, encoding and options work without a spec; a pie per group", async () => {
    const el = await make({ spec: null });
    el.type = "donut";
    el.data = ROWS.filter((r) => r.month === "2026-01");
    el.facet = "month";
    el.encoding = { label: "lab", value: "samples" };
    await settle();
    const charts = await panels(el, "tc-donut-chart", 1);
    expect(charts[0].querySelector(".tc-chart__plot")!.getAttribute("aria-label")).toBe("2026-01");
    // No value range to share: nothing set
    expect(charts[0].yDomain).toBeUndefined();
  });

  test("React wrapper: props reach the element; the check comes back", async () => {
    const host = document.createElement("div");
    host.style.width = "700px";
    document.body.append(host);
    const root = createRoot(host);
    const checks: boolean[] = [];
    await act(async () => root.render(React.createElement(SmallMultiples, { title: "Labs", spec: LINE, facet: "lab", sort: "alpha", onSpecCheck: (c) => checks.push(c.valid) })));
    const el = host.querySelector<TcSmallMultiples>("tc-small-multiples")!;
    expect(el.heading).toBe("Labs");
    expect(el.sort).toBe("alpha");
    await panels(el);
    expect(checks).toContain(true);
    expect(names(el)[0]).toBe("Climate");
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: both looks, both themes", async () => {
    for (const look of ["standard", "clean"] as const)
      for (const scheme of ["light", "dark"]) {
        const el = await make({ look });
        await panels(el);
        el.parentElement!.style.colorScheme = scheme;
        await finish(el.parentElement!);
        const r = await axe.run(el.parentElement!);
        expect(r.violations.flatMap((v) => v.nodes.map((n) => `${look} ${scheme} ${v.id} ${n.html.slice(0, 80)}`))).toEqual([]);
        cleanup();
      }
  });
});
