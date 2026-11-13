/*
 * <tc-quality-trend> in real browsers: the band and the shift, the summary in words, the range switch (APG radio
 * group), the criterion toggles, the change pins (toolbar) and their tooltip, the table view, the wrapper, axe in both
 * looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/quality-trend";
import {
  qualityBand,
  qualityShift,
  type QualityChange,
  type QualityCriterion,
  type QualityDay,
  type QualityTrendChangeOpen,
  type QualityTrendRangeChange,
  type QualityTrendShownChange,
  type QualityTrendViewChange,
  type TcQualityTrend,
} from "../../src/elements/quality-trend";
import { QualityTrend } from "../../src/elements/react/quality-trend";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DAY = 86_400_000;
const END = Date.UTC(2026, 10, 10);
const CRITERIA: QualityCriterion[] = [
  { id: "a", label: "Correctness" },
  { id: "b", label: "Tone" },
];
/** Ten days: Correctness 4.4 until the change four days before the end, 3.8 from it; Tone flat at 4 */
const DAYS: QualityDay[] = Array.from({ length: 10 }, (_, i) => {
  const date = END - (9 - i) * DAY;
  return { date, scores: { a: { mean: date >= END - 4 * DAY ? 3.8 : 4.4, n: 100 }, b: { mean: 4, n: 100 } } };
});
const CHANGES: QualityChange[] = [
  { id: "m", at: END - 5 * DAY, label: "Model: Atlas 2 → Atlas 3", short: "Atlas 3", kind: "model" },
  { id: "v14", at: END - 4 * DAY, label: "Prompt v13 → v14", short: "v14", kind: "prompt", detail: "Shorter instructions" },
  { id: "old", at: END - 40 * DAY, label: "Old change", kind: "tool" },
];
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const mount = (extra = html``) => fixture<TcQualityTrend>(html`<div style="width: 720px">${extra}</div>`);

describe("tc-quality-trend", () => {
  test("qualityBand: z × spread / √n; qualityShift: means before and from a moment, weighted by chats", () => {
    expect(qualityBand({ mean: 4, n: 100 }, 1)).toBeCloseTo(0.196);
    expect(qualityBand({ mean: 4, n: 100, sd: 2 }, 1)).toBeCloseTo(0.392);
    expect(qualityBand({ mean: 4, n: 0 })).toBe(0);
    const s = qualityShift(
      [
        { date: 1, scores: { a: { mean: 4, n: 10 } } },
        { date: 2, scores: { a: { mean: 5, n: 30 } } },
        { date: 3, scores: { a: { mean: 3, n: 20 } } },
        { date: 4, scores: {} },
      ],
      "a",
      3,
    );
    expect(s).toEqual({ before: 4.75, after: 3, beforeN: 40, afterN: 20 });
    expect(qualityShift([], "a", 0)).toEqual({ before: null, after: null, beforeN: 0, afterN: 0 });
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the summary says what moved since the latest change; a line per criterion; pins in range only`, async () => {
      const wrap = await mount(html`<tc-quality-trend look=${look} locale="en-GB" range="7d" .criteria=${CRITERIA} .days=${DAYS} .changes=${CHANGES}></tc-quality-trend>`);
      const el = wrap.querySelector("tc-quality-trend")!;
      expect(el.dataset.ui).toBe("qtr");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Quality on live chats");
      expect(text(el.querySelector(".ui-qtr__summary"))).toBe("Correctness 4.4 → 3.8 since v14 on 6 Nov");
      expect(el.querySelectorAll(".ui-qtr__series")).toHaveLength(2);
      // Seven days: a line each (polyline) and a band each
      expect(el.querySelectorAll(".ui-qtr__line")).toHaveLength(2);
      expect(el.querySelectorAll(".ui-qtr__band")).toHaveLength(2);
      // Two changes in the last 7 days; the old one is out of range
      const pins = [...el.querySelectorAll<HTMLButtonElement>(".ui-qtr__pin")];
      expect(pins.map((p) => text(p.querySelector(".ui-qtr__sr")))).toEqual(["Model: Atlas 2 → Atlas 3, 5 Nov", "Prompt v13 → v14, 6 Nov. Shorter instructions"]);
      expect(pins.map((p) => p.tabIndex)).toEqual([0, -1]);
      expect(el.querySelector('[role="toolbar"]')!.getAttribute("aria-label")).toBe("Changes");
      // The range: a radio group, one tab stop
      const radios = [...el.querySelectorAll<HTMLElement>('[role="radio"]')];
      expect(radios.map((r) => r.getAttribute("aria-checked"))).toEqual(["true", "false", "false"]);
      expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
      expect(el.querySelector('[role="figure"]')!.getAttribute("aria-describedby")).toBe(el.querySelector(".ui-qtr__summary")!.id);
      // The legend: a toggle each, pressed while drawn
      expect([...el.querySelectorAll(".ui-qtr__crit")].map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "true"]);
    });
  }

  test("no change in range: the average; nothing moved: says so; no days: No scores yet", async () => {
    const wrap = await mount(html`
      <tc-quality-trend locale="en-GB" range="7d" .criteria=${CRITERIA} .days=${DAYS}></tc-quality-trend>
      <tc-quality-trend locale="en-GB" range="7d" .shown=${["b"]} .criteria=${CRITERIA} .days=${DAYS} .changes=${CHANGES}></tc-quality-trend>
      <tc-quality-trend .criteria=${CRITERIA} .days=${[]}></tc-quality-trend>
      <tc-quality-trend .shown=${[]} .criteria=${CRITERIA} .days=${DAYS}></tc-quality-trend>
    `);
    const [a, b, c, d] = [...wrap.querySelectorAll("tc-quality-trend")];
    expect(text(a.querySelector(".ui-qtr__summary"))).toMatch(/^Correctness averaged 4\.\d over the last 7 days$/);
    expect(text(b.querySelector(".ui-qtr__summary"))).toBe("No criterion moved by 0.1 or more since v14 on 6 Nov");
    expect(text(c.querySelector(".ui-qtr__summary"))).toBe("No scores yet");
    expect(text(c.querySelector(".ui-qtr__empty"))).toBe("No scores yet");
    expect(text(d.querySelector(".ui-qtr__summary"))).toBe("Pick a criterion to show");
  });

  test("range: arrows pick and fire tc-range-change; preventDefault keeps the range", async () => {
    const wrap = await mount(html`<tc-quality-trend range="7d" .criteria=${CRITERIA} .days=${DAYS}></tc-quality-trend>`);
    const el = wrap.querySelector("tc-quality-trend")!;
    const seen: string[] = [];
    el.addEventListener("tc-range-change", (e) => seen.push((e as CustomEvent<QualityTrendRangeChange>).detail.range));
    const group = el.querySelector<HTMLElement>('[role="radiogroup"]')!;
    group.querySelector<HTMLElement>('[aria-checked="true"]')!.focus();
    key(document.activeElement!, "ArrowRight");
    await settle();
    expect(el.range).toBe("30d");
    expect(document.activeElement!.textContent).toContain("30d");
    await expect.poll(() => text(el.querySelector('[role="status"]'))).toMatch(/^Last 30 days\./);
    key(document.activeElement!, "ArrowLeft");
    await settle();
    expect(el.range).toBe("7d");
    el.addEventListener("tc-range-change", (e) => e.preventDefault(), { once: true });
    el.querySelectorAll<HTMLElement>('[role="radio"]')[2].click();
    await settle();
    expect(el.range).toBe("7d");
    expect(seen).toEqual(["30d", "7d", "90d"]);
  });

  test("criteria: a toggle hides and shows a line, with tc-shown-change; preventDefault keeps it", async () => {
    const wrap = await mount(html`<tc-quality-trend .criteria=${CRITERIA} .days=${DAYS}></tc-quality-trend>`);
    const el = wrap.querySelector("tc-quality-trend")!;
    const seen: unknown[] = [];
    el.addEventListener("tc-shown-change", (e) => seen.push((e as CustomEvent<QualityTrendShownChange>).detail.shown));
    const toggles = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-qtr__crit")];
    toggles()[0].click();
    await settle();
    expect(el.shown).toEqual(["b"]);
    expect(el.querySelectorAll(".ui-qtr__series")).toHaveLength(1);
    expect(toggles()[0].getAttribute("aria-pressed")).toBe("false");
    expect(text(el.querySelector('[role="status"]'))).toBe("Correctness hidden");
    toggles()[0].click();
    await settle();
    expect(el.shown).toEqual(["a", "b"]);
    el.addEventListener("tc-shown-change", (e) => e.preventDefault(), { once: true });
    toggles()[1].click();
    await settle();
    expect(el.shown).toEqual(["a", "b"]);
    expect(seen).toEqual([["b"], ["a", "b"], ["a"]]);
  });

  test("pins: focus shows the tooltip, arrows move, Escape hides, Enter opens with tc-change-open", async () => {
    const wrap = await mount(html`<tc-quality-trend locale="en-GB" range="7d" .criteria=${CRITERIA} .days=${DAYS} .changes=${CHANGES}></tc-quality-trend>`);
    const el = wrap.querySelector("tc-quality-trend")!;
    const opened: string[] = [];
    el.addEventListener("tc-change-open", (e) => opened.push((e as CustomEvent<QualityTrendChangeOpen>).detail.id));
    const pins = [...el.querySelectorAll<HTMLButtonElement>(".ui-qtr__pin")];
    pins[0].focus();
    await settle();
    expect(text(el.querySelector(".ui-qtr__tip"))).toBe("Model · 5 Nov Model: Atlas 2 → Atlas 3");
    expect(el.querySelector(".ui-qtr__tip")!.getAttribute("aria-hidden")).toBe("true");
    key(pins[0], "ArrowRight");
    await settle();
    expect(document.activeElement).toBe(pins[1]);
    expect(text(el.querySelector(".ui-qtr__tip"))).toBe("Prompt · 6 Nov Prompt v13 → v14 Shorter instructions");
    expect(el.querySelector(".ui-qtr__rule[data-active]")).not.toBeNull();
    key(pins[1], "Escape");
    await settle();
    expect(el.querySelector(".ui-qtr__tip")).toBeNull();
    pins[1].click();
    await settle();
    expect(opened).toEqual(["v14"]);
    // Pins sit on their dates: the later change to the right of the earlier
    expect(parseFloat(pins[1].style.left)).toBeGreaterThan(parseFloat(pins[0].style.left));
  });

  test("Table swaps the chart for the days, newest first; tc-view-change; preventDefault keeps the chart", async () => {
    const wrap = await mount(html`<tc-quality-trend locale="en-GB" range="7d" .criteria=${CRITERIA} .days=${DAYS} .changes=${CHANGES}></tc-quality-trend>`);
    const el = wrap.querySelector("tc-quality-trend")!;
    const views: string[] = [];
    el.addEventListener("tc-view-change", (e) => views.push((e as CustomEvent<QualityTrendViewChange>).detail.view));
    const btn = el.querySelector<HTMLButtonElement>(".ui-qtr__view")!;
    btn.click();
    await settle();
    expect(el.view).toBe("table");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector(".ui-qtr__plot")).toBeNull();
    const rows = [...el.querySelectorAll("tbody tr")];
    expect(rows).toHaveLength(7);
    expect([...el.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual(["Day", "Correctness", "Tone", "Changes"]);
    expect([...rows[0].children].map((c) => text(c))).toEqual(["10 Nov", "3.8 · 100 chats", "4.0 · 100 chats", ""]);
    expect(text(rows[4])).toContain("Prompt v13 → v14");
    el.addEventListener("tc-view-change", (e) => e.preventDefault(), { once: true });
    btn.click();
    await settle();
    expect(el.view).toBe("table");
    expect(views).toEqual(["table", "chart"]);
  });

  test("the plot follows its width; CSS keeps to tokens and turns motion off", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 400px"><tc-quality-trend .criteria=${CRITERIA} .days=${DAYS}></tc-quality-trend></div>`);
    const el = wrap.querySelector("tc-quality-trend")!;
    await expect.poll(() => el.querySelector(".ui-qtr__svg")!.getAttribute("width")).toBe(String(el.querySelector<HTMLElement>(".ui-qtr__stage")!.clientWidth));
    wrap.style.width = "640px";
    await expect.poll(() => Number(el.querySelector(".ui-qtr__svg")!.getAttribute("width"))).toBeGreaterThan(560);
    const css = (customElements.get("tc-quality-trend") as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*transition: none !important/);
    expect(css).not.toMatch(/\.dark\b|data-tc-theme="dark"/);
  });

  test("React wrapper: uncontrolled range survives a parent re-render; title; onRangeChange, onShownChange, onChangeOpen", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(QualityTrend, {
        title: "Judge scores",
        criteria: CRITERIA,
        days: DAYS,
        changes: CHANGES,
        defaultRange: "7d",
        onRangeChange: (r) => seen.push(r),
        onShownChange: (s) => seen.push(s),
        onChangeOpen: (c) => seen.push(c.id),
        "data-n": n,
      } as React.ComponentProps<typeof QualityTrend>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-quality-trend")!;
    expect(el.heading).toBe("Judge scores");
    expect(el.range).toBe("7d");
    el.querySelectorAll<HTMLElement>('[role="radio"]')[1].click();
    el.querySelector<HTMLButtonElement>(".ui-qtr__crit")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.range).toBe("30d");
    expect(el.shown).toEqual(["b"]);
    el.querySelector<HTMLButtonElement>(".ui-qtr__pin")!.click();
    expect(seen).toEqual(["30d", ["b"], "m"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled view stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[] = [];
    await act(async () => root.render(React.createElement(QualityTrend, { criteria: CRITERIA, days: DAYS, view: "chart", onViewChange: (v) => asked.push(v) })));
    await settle();
    const el = host.querySelector("tc-quality-trend")!;
    el.querySelector<HTMLButtonElement>(".ui-qtr__view")!.click();
    await settle();
    expect(asked).toEqual(["table"]);
    expect(el.view).toBe("chart");
    await act(async () => root.render(React.createElement(QualityTrend, { criteria: CRITERIA, days: DAYS, view: "table" })));
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme – chart with a pin open, table, narrow, empty", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <div style="width: 720px"><tc-quality-trend range="7d" .criteria=${CRITERIA} .days=${DAYS} .changes=${CHANGES}></tc-quality-trend></div>
        <div style="width: 720px"><tc-quality-trend look="clean" view="table" .criteria=${CRITERIA} .days=${DAYS} .changes=${CHANGES}></tc-quality-trend></div>
        <div style="width: 320px"><tc-quality-trend look="clean" .criteria=${CRITERIA} .days=${DAYS} .changes=${CHANGES}></tc-quality-trend></div>
        <div style="width: 320px"><tc-quality-trend .criteria=${CRITERIA} .days=${[]}></tc-quality-trend></div>
      </div>`);
      wrap.querySelector<HTMLButtonElement>(".ui-qtr__pin")!.focus();
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
