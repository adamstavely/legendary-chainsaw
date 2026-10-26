/*
 * blocks/metrics-dashboard: every figure counted up through React state (a commit per frame for 14 numbers on each
 * range change); the sample data read the clock during render (hydration mismatch); the Export confirmation timer
 * outlived an unmount.
 */
import { Profiler } from "react";
import { renderToString } from "react-dom/server";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { MetricsDashboard } from "@blocks/metrics-dashboard";

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: false, media: q }) as MediaQueryList);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const revenue = (c: HTMLElement) => c.querySelector(".ui-md__kpi .ui-md__kpi-value")!.textContent!;

describe("blocks/metrics-dashboard", () => {
  test("figures count to a new range without a React commit per frame", async () => {
    let commits = 0;
    const { container } = render(
      <Profiler id="md" onRender={() => commits++}>
        <MetricsDashboard />
      </Profiler>,
    );
    const month = revenue(container);
    fireEvent.click(screen.getByRole("radio", { name: "Week" }));
    const before = commits;
    expect(revenue(container)).toBe(month);
    await act(async () => vi.advanceTimersByTime(48));
    const mid = revenue(container);
    expect(mid).not.toBe(month);
    for (let t = 0; t < 800; t += 16) await act(async () => vi.advanceTimersByTime(16));
    expect(revenue(container)).not.toBe(mid);
    expect(commits - before).toBe(0);
  });

  test("the server renders without reading the clock; `now` pins the data", () => {
    const at = (iso: string) => {
      vi.setSystemTime(new Date(iso));
      return renderToString(<MetricsDashboard />);
    };
    expect(at("2026-03-01T12:00:00Z")).toBe(at("2026-10-24T12:00:00Z"));
    const pinned = renderToString(<MetricsDashboard now={Date.UTC(2026, 9, 24, 12)} />);
    // 30 days ending Oct 24: the axis starts at Sep 25
    expect(pinned).toContain("Sep 25");
  });

  test("unmounting right after Export leaves no timer behind", () => {
    const view = render(<MetricsDashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(screen.getByRole("button", { name: "Exported" })).toBeTruthy();
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

/* WCAG + design pass: the KPI tabs have the tabs pattern, chart points are announced in one narrow region, Esc hides
   the tooltip, Compare is a switch */
describe("blocks/metrics-dashboard – keyboard and announcements", () => {
  test("KPI tabs: one tab stop, arrows / Home / End pick the metric and move focus; the chart is their tabpanel", () => {
    render(<MetricsDashboard />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1, -1]);
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(tabs[1], { key: "End" });
    expect(document.activeElement).toBe(tabs[3]);
    fireEvent.keyDown(tabs[3], { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabs[0]);
    const panel = document.getElementById(tabs[0].getAttribute("aria-controls")!)!;
    expect(panel.getAttribute("role")).toBe("tabpanel");
    expect(panel.getAttribute("aria-labelledby")).toBe(tabs[0].id);
  });

  test("arrow keys on the chart announce the point in a status region present from mount; Esc hides the tooltip", () => {
    const { container } = render(<MetricsDashboard now={Date.UTC(2026, 9, 24, 12)} defaultRange="7d" />);
    const status = container.querySelector(".ui-md__plot-wrap > [role='status']")!;
    expect(status.textContent).toBe("");
    const plot = screen.getByRole("img");
    plot.focus();
    fireEvent.keyDown(plot, { key: "Home" });
    expect(status.textContent).toMatch(/^Oct 18: Revenue \$/);
    expect(container.querySelector(".ui-md__tip")).toBeTruthy();
    expect(container.querySelector(".ui-md__tip")!.getAttribute("role")).toBeNull();
    fireEvent.keyDown(plot, { key: "Escape" });
    expect(container.querySelector(".ui-md__tip")).toBeNull();
    expect(document.activeElement).toBe(plot);
  });

  test("Compare is a switch; the period and chart type are radio groups", () => {
    render(<MetricsDashboard />);
    expect(screen.getByRole("switch", { name: /Compare/ })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "Period" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Bar chart" })).toBeTruthy();
  });
});
