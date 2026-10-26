/* screens/analytics: the period couldn't be controlled; scaled series were rebuilt on every render */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { AnalyticsScreen } from "@screens/analytics";

const period = (c: HTMLElement) => c.querySelector(".ui-as-rev__period")!.textContent;
const revenue = (c: HTMLElement) => c.querySelector(".ui-as-rev__stat strong")!.firstChild!.textContent;

describe("screens/analytics", () => {
  test("period is controlled when passed and reported when picked", () => {
    const onPeriodChange = vi.fn();
    const { container, rerender } = render(<AnalyticsScreen period="7d" onPeriodChange={onPeriodChange} />);
    expect(revenue(container)).toBe("$96,412");
    fireEvent.click(screen.getByRole("button", { name: /Last 7 days/ }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Last 30 days" }));
    expect(onPeriodChange).toHaveBeenCalledWith("30d");
    expect(period(container)).toBe("Last 7 days");
    rerender(<AnalyticsScreen period="30d" onPeriodChange={onPeriodChange} />);
    expect(period(container)).toBe("Last 30 days");
    expect(revenue(container)).toBe("$414,572");
  });

  test("defaultPeriod starts there and the screen keeps its own state", () => {
    const { container } = render(<AnalyticsScreen defaultPeriod="90d" />);
    expect(period(container)).toBe("Last 90 days");
    fireEvent.click(screen.getByRole("button", { name: /Last 90 days/ }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Last 7 days" }));
    expect(period(container)).toBe("Last 7 days");
  });

  test("no reach into other components' classes and no zoom (WCAG + design pass, s1)", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("screens/analytics.tsx", "utf8");
    expect(css).not.toMatch(/zoom\s*:/);
    expect(css).not.toMatch(/\.ui-(pl|df|ap|tc|um|kpi|think|dt|sg|fm|button)\b/);
  });

  test("the KPI charts fill their cards through the component's fill prop", () => {
    const { container } = render(<AnalyticsScreen />);
    const charts = container.querySelectorAll(".ui-as-rev__chart");
    expect(charts.length).toBeGreaterThan(0);
    charts.forEach((c) => expect(c.hasAttribute("data-fill")).toBe(true));
  });
});
