/*
 * <tc-metrics-dashboard> in real browsers – the block's behaviour, as an element.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import "../../src/elements/metrics-dashboard";
import { aggregate, formatMetric, niceMax, sampleDays, type TcMetricsDashboard } from "../../src/elements/metrics-dashboard";
import { MetricsDashboard } from "../../src/elements/react/metrics-dashboard";
import { MetricsDashboard as Block } from "../../blocks/metrics-dashboard";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

// A fixed last day, so the sample data – and every figure – is the same on every run
const NOW = new Date(2026, 9, 27, 12).getTime();
const key = async (target: Element, k: string) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await settle();
};
const tabs = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-md__kpi")];
const plot = (el: Element) => el.querySelector<HTMLElement>(".ui-md__plot")!;
const seg = (el: Element, cls: string) => el.querySelector(`.${cls}`)!;
const option = (el: Element, cls: string, label: string) =>
  [...seg(el, cls).querySelectorAll<HTMLElement>(".ui-seg__opt")].find((o) => (o.querySelector(".ui-seg__text") ?? o.querySelector(".ui-seg__label"))?.textContent === label || o.getAttribute("aria-label") === label)!;

async function dashboard(attrs = html``) {
  const el = await fixture<TcMetricsDashboard>(html`<tc-metrics-dashboard .now=${NOW}>${attrs}</tc-metrics-dashboard>`);
  await finish(el);
  return el;
}

describe("tc-metrics-dashboard", () => {
  test("the host is the root: a tray in Standard, one card in Clean", async () => {
    for (const look of ["standard", "clean"] as const) {
      const el = await fixture<TcMetricsDashboard>(html`<tc-metrics-dashboard look=${look} .now=${NOW} heading="Revenue desk" site="Acme"></tc-metrics-dashboard>`);
      expect(el.dataset.ui).toBe("md");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(":scope > .ui-md__bar .ui-md__title")!.textContent).toBe("Revenue desk");
      expect(el.querySelector(".ui-md__site")!.textContent).toBe("Acme · Last 30 days");
      expect(el.querySelector(":scope > .ui-md__kpis[role='tablist']")).not.toBeNull();
      expect(el.querySelector(":scope > .ui-md__card > .ui-md__chart[role='tabpanel']")).not.toBeNull();
      const bg = getComputedStyle(el).backgroundColor;
      const card = getComputedStyle(el.querySelector(".ui-md__card")!).backgroundColor;
      // Standard: a gray tray around a white card. Clean: the host is the white card
      if (look === "standard") expect(bg).not.toBe(card);
      else expect(card).toBe("rgba(0, 0, 0, 0)");
      cleanup();
    }
  });

  test("the maths: aggregates, axis maximum and formats", () => {
    const days = sampleDays(NOW);
    expect(days).toHaveLength(180);
    expect(new Date(days[179].date).getDate()).toBe(27);
    const last30 = days.slice(-30);
    const revenue = aggregate(last30, "revenue");
    const orders = aggregate(last30, "orders");
    expect(aggregate(last30, "aov")).toBeCloseTo(revenue / orders, 6);
    expect(aggregate([], "aov")).toBe(0);
    expect(aggregate([], "refunds")).toBe(0);
    expect(niceMax(13500)).toBe(20000);
    expect(niceMax(0)).toBe(4);
    expect(formatMetric("revenue", 1234.4)).toBe("$1,234");
    expect(formatMetric("aov", 61.234)).toBe("$61.23");
    expect(formatMetric("refunds", 2.06)).toBe("2.1%");
    expect(formatMetric("orders", 4454.2)).toBe("4,454");
  });

  test("four KPI tabs: the chosen one labels the chart; each shows its value and change", async () => {
    const el = await dashboard();
    const t = tabs(el);
    expect(t.map((b) => b.querySelector(".ui-md__kpi-label")!.textContent)).toEqual(["Revenue", "Orders", "Avg. order", "Refund rate"]);
    expect(t.map((b) => b.getAttribute("aria-selected"))).toEqual(["true", "false", "false", "false"]);
    // One tab stop
    expect(t.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1]);
    const panel = el.querySelector(".ui-md__chart")!;
    expect(panel.getAttribute("aria-labelledby")).toBe(t[0].id);
    const current = sampleDays(NOW).slice(-30);
    expect(t[0].querySelector(".ui-md__kpi-value")!.textContent).toBe(formatMetric("revenue", aggregate(current, "revenue")));
    // The change says which way in words, not only by colour
    expect(t[0].querySelector(".ui-md__delta .ui-md__sr")!.textContent).toMatch(/(up|down) versus the previous period/);
    expect(t[3].querySelector(".ui-md__delta")!.textContent).toContain("pts");
  });

  test("arrow keys, Home and End move between the KPIs and pick the metric", async () => {
    const el = await dashboard();
    const seen: string[] = [];
    el.addEventListener("tc-metric-change", (e) => seen.push((e as CustomEvent).detail.metric));
    tabs(el)[0].focus();
    await key(tabs(el)[0], "ArrowRight");
    expect(el.metric).toBe("orders");
    await expect.poll(() => document.activeElement).toBe(tabs(el)[1]);
    await key(tabs(el)[1], "End");
    expect(el.metric).toBe("refunds");
    await key(tabs(el)[3], "ArrowRight");
    expect(el.metric).toBe("revenue");
    await key(tabs(el)[0], "ArrowLeft");
    expect(el.metric).toBe("refunds");
    expect(seen).toEqual(["orders", "refunds", "revenue", "refunds"]);
    expect(el.querySelector(".ui-md__legend")!.textContent).toBe("Refund rate");
  });

  test("controlled: preventDefault keeps metric, range, chart and comparison", async () => {
    const el = await dashboard();
    for (const name of ["tc-metric-change", "tc-range-change", "tc-chart-change", "tc-compare-change"]) el.addEventListener(name, (e) => e.preventDefault());
    tabs(el)[2].click();
    option(el, "ui-md__range", "Week").click();
    option(el, "ui-md__kind", "Bar chart").click();
    el.querySelector<HTMLInputElement>(".ui-md__compare input")!.click();
    await settle();
    expect(el.metric).toBe("revenue");
    expect(el.range).toBe("30d");
    expect(el.chart).toBe("line");
    expect(el.compare).toBe(false);
    expect(el.querySelector<HTMLInputElement>(".ui-md__compare input")!.checked).toBe(false);
    expect(tabs(el)[0].getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector(".ui-md__line")).not.toBeNull();
  });

  test("the period switch: week is daily, quarter is weekly buckets", async () => {
    const el = await dashboard();
    const seen: string[] = [];
    el.addEventListener("tc-range-change", (e) => seen.push((e as CustomEvent).detail.range));
    option(el, "ui-md__range", "Week").click();
    await settle();
    expect(el.range).toBe("7d");
    expect(el.querySelector(".ui-md__site")!.textContent).toContain("Last 7 days");
    expect(el.querySelectorAll(".ui-md__dots span")).toHaveLength(7);
    option(el, "ui-md__range", "Quarter").click();
    await settle();
    expect(el.querySelectorAll(".ui-md__dots span")).toHaveLength(13);
    expect(seen).toEqual(["7d", "90d"]);
  });

  test("bars and the comparison: ghost bars and a dashed previous line", async () => {
    const el = await dashboard();
    el.querySelector<HTMLInputElement>(".ui-md__compare input")!.click();
    await settle();
    expect(el.compare).toBe(true);
    expect(el.querySelector(".ui-md__prev")).not.toBeNull();
    option(el, "ui-md__kind", "Bar chart").click();
    await settle();
    expect(el.chart).toBe("bars");
    expect(el.querySelectorAll(".ui-md__bar-slot")).toHaveLength(30);
    expect(el.querySelectorAll(".ui-md__col--prev")).toHaveLength(30);
    expect(el.querySelector(".ui-md__line")).toBeNull();
  });

  test("the chart is read point by point with the arrow keys and announced; Esc hides the tooltip", async () => {
    const el = await dashboard();
    const p = plot(el);
    p.focus();
    await key(p, "End");
    expect(el.querySelector(".ui-md__tip")).not.toBeNull();
    const status = el.querySelector(".ui-md__chart-head ~ .ui-md__plot-wrap [role='status']")!;
    expect(status.textContent).toMatch(/^Oct 27: Revenue \$[\d,]+$/);
    await key(p, "ArrowLeft");
    expect(status.textContent).toMatch(/^Oct 26: /);
    await key(p, "Home");
    expect(status.textContent).toMatch(/^Sep 28: /);
    // The tooltip sits right of points in the first half, left in the second
    expect(el.querySelector(".ui-md__tip")!.getAttribute("data-side")).toBe("right");
    await key(p, "Escape");
    expect(el.querySelector(".ui-md__tip")).toBeNull();
    // Changing the metric drops the highlighted point
    await key(p, "End");
    tabs(el)[1].click();
    await settle();
    expect(el.querySelector(".ui-md__tip")).toBeNull();
  });

  test("the pointer highlights the nearest point", async () => {
    const el = await dashboard();
    const p = plot(el);
    const r = p.getBoundingClientRect();
    p.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", clientX: r.right - 1, clientY: r.top + 10, bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-md__tip-date")!.textContent).toBe("Oct 27");
    // Pointer reads aren't announced
    expect(el.querySelector(".ui-md__plot-wrap [role='status']")!.textContent).toBe("");
    p.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse", bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-md__tip")).toBeNull();
  });

  test("Export: fires tc-export, waits for a returned promise, says Exported or Export failed", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const el = await dashboard();
      const exported: unknown[] = [];
      el.addEventListener("tc-export", (e) => exported.push((e as CustomEvent).detail));
      let resolve!: () => void;
      el.onExport = () => new Promise<void>((r) => (resolve = r));
      const button = el.querySelector(".ui-md__export")!;
      button.querySelector("button")!.click();
      await settle();
      expect(exported).toEqual([{ range: "30d", metric: "revenue" }]);
      expect(button.getAttribute("label")).toBe("Exporting…");
      expect(button.hasAttribute("loading")).toBe(true);
      resolve();
      await expect.poll(() => button.getAttribute("label")).toBe("Exported");
      expect(el.querySelector(".ui-md__actions [role='status']")!.textContent).toBe("Exported");
      vi.advanceTimersByTime(1600);
      await settle();
      expect(button.getAttribute("label")).toBe("Export");
      el.onExport = () => Promise.reject(new Error("nope"));
      button.querySelector("button")!.click();
      await expect.poll(() => button.getAttribute("label")).toBe("Export failed");
    } finally {
      vi.useRealTimers();
    }
  });

  test("lists: top products and channels share the period's revenue", async () => {
    const el = await dashboard();
    const lists = el.querySelectorAll(".ui-md__list");
    expect(lists).toHaveLength(2);
    expect([...lists[0].querySelectorAll(".ui-md__row-name")].map((n) => n.textContent)).toEqual(["Linen overshirt", "Everyday tote", "Merino crew", "Canvas sneaker", "Wool beanie"]);
    const total = aggregate(sampleDays(NOW).slice(-30), "revenue");
    expect(lists[1].querySelector(".ui-md__row-value")!.textContent).toBe(`$${Math.round(total * 0.46).toLocaleString("en-US")}`);
    // The first row's bar is the full width; the rest are relative to it
    expect((lists[0].querySelector(".ui-md__row-bar") as HTMLElement).style.width).toBe("100%");
  });

  test("figures count to the new values and end exactly on them", async () => {
    const el = await dashboard();
    option(el, "ui-md__range", "Week").click();
    const target = formatMetric("revenue", aggregate(sampleDays(NOW).slice(-7), "revenue"));
    await expect.poll(() => tabs(el)[0].querySelector(".ui-md__kpi-value")!.textContent, { timeout: 3000 }).toBe(target);
  });

  test("moved in the page mid-count: the figures still end on their values", async () => {
    const el = await dashboard();
    option(el, "ui-md__range", "Quarter").click();
    await settle();
    const other = document.createElement("div");
    document.body.append(other);
    other.append(el);
    await settle();
    const target = formatMetric("orders", aggregate(sampleDays(NOW).slice(-90), "orders"));
    await expect.poll(() => tabs(el)[1].querySelector(".ui-md__kpi-value")!.textContent, { timeout: 3000 }).toBe(target);
  });

  test("narrow: two KPI columns, one list column, the short compare label", async () => {
    const wrap = await fixture(html`<div style="width: 375px"><tc-metrics-dashboard .now=${NOW}></tc-metrics-dashboard></div>`);
    const el = wrap.querySelector<TcMetricsDashboard>("tc-metrics-dashboard")!;
    await finish(el);
    const cols = getComputedStyle(el.querySelector(".ui-md__kpis")!).gridTemplateColumns.split(" ");
    expect(cols).toHaveLength(2);
    expect(getComputedStyle(el.querySelector(".ui-md__lists")!).gridTemplateColumns.split(" ")).toHaveLength(1);
    expect(getComputedStyle(el.querySelector(".ui-md__compare-long")!).display).toBe("none");
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React: uncontrolled survives parent re-renders; controlled stays until the parent changes it", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const onMetricChange = vi.fn();
    await act(async () => root.render(React.createElement(MetricsDashboard, { now: NOW, title: "Shop", onMetricChange })));
    await settle();
    const el = host.querySelector<TcMetricsDashboard>("tc-metrics-dashboard")!;
    expect(el.heading).toBe("Shop");
    await act(async () => tabs(el)[1].click());
    await settle();
    expect(onMetricChange).toHaveBeenCalledWith("orders");
    await act(async () => root.render(React.createElement(MetricsDashboard, { now: NOW, title: "Shop again", onMetricChange })));
    await settle();
    expect(el.metric).toBe("orders");

    const onRangeChange = vi.fn();
    await act(async () => root.render(React.createElement(MetricsDashboard, { now: NOW, range: "7d", onRangeChange })));
    await settle();
    await act(async () => option(el, "ui-md__range", "Quarter").click());
    await settle();
    expect(onRangeChange).toHaveBeenCalledWith("90d");
    expect(el.range).toBe("7d");
    await act(async () => root.render(React.createElement(MetricsDashboard, { now: NOW, range: "90d", onRangeChange })));
    await settle();
    expect(el.range).toBe("90d");
    act(() => root.unmount());
  });

  test("the block file renders the element with the block's props", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const onExport = vi.fn();
    await act(async () => root.render(React.createElement(Block, { now: NOW, title: "Sales", site: "Northwind Store", defaultMetric: "aov", onExport })));
    await settle();
    const el = host.querySelector<TcMetricsDashboard>("tc-metrics-dashboard")!;
    expect(el.metric).toBe("aov");
    el.querySelector<HTMLElement>(".ui-md__export button")!.click();
    expect(onExport).toHaveBeenCalledWith("30d", "aov");
    act(() => root.unmount());
  });

  test("axe: no violations in both looks and both themes", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-metrics-dashboard .now=${NOW}></tc-metrics-dashboard>
        <tc-metrics-dashboard look="clean" .now=${NOW} compare chart="bars"></tc-metrics-dashboard>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
