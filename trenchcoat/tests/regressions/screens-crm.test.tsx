/* screens/crm: Phase 5 review – data-table's controlled `rows`, timers that outlived the screen, a controllable tab */
import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { CrmScreen } from "@screens/crm";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const openTab = (label: string) => fireEvent.click(screen.getByRole("button", { name: label }));

describe("crm screen", () => {
  test("the table gets its sample rows as a starting value, not as rows nobody can change", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<CrmScreen />);
    expect(warn.mock.calls.flat().join(" ")).not.toMatch(/set without its change handler/);
    expect(screen.getAllByText("Notion").length).toBeGreaterThan(0);
  });

  test("copy and check timers are cleared when the screen goes away", () => {
    const view = render(<CrmScreen defaultTab="Pixel integration" />);
    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check connection" }));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("copying again keeps “Copied” for the full time", () => {
    render(<CrmScreen defaultTab="Pixel integration" />);
    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole("button", { name: /Copied/ }));
    // The first copy's timer would have reset it at 1600 ms
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByRole("button", { name: /Copied/ })).toBeTruthy();
    act(() => vi.advanceTimersByTime(800));
    expect(screen.getByRole("button", { name: /^Copy$/ })).toBeTruthy();
  });

  test("tab: uncontrolled switches and reports, controlled asks", () => {
    const onTabChange = vi.fn();
    const { rerender } = render(<CrmScreen onTabChange={onTabChange} />);
    openTab("Sales docs");
    expect(onTabChange).toHaveBeenLastCalledWith("Sales docs");
    expect(screen.getByRole("button", { name: "Sales docs" }).getAttribute("aria-current")).toBe("page");

    rerender(<CrmScreen tab="Team strategy" onTabChange={onTabChange} />);
    openTab("Company CRM");
    expect(onTabChange).toHaveBeenLastCalledWith("Company CRM");
    expect(screen.getByRole("button", { name: "Team strategy" }).getAttribute("aria-current")).toBe("page");
  });
});

/* WCAG + design pass: no reach-ins into data-table, the check keeps focus, status regions mounted from the start */
describe("crm screen – accessibility and composition", () => {
  test("the screen styles never reach into the Data Table's internal classes", () => {
    render(<CrmScreen />);
    const css = readFileSync("screens/crm.tsx", "utf8").split("const css =")[1];
    expect(css).not.toMatch(/\.ui-dt\b|\.ui-dt__/);
  });

  test("Check connection stays focused and announced while it runs", () => {
    render(<CrmScreen defaultTab="Pixel integration" />);
    const status = screen.getAllByRole("status").find((n) => n.textContent?.includes("Waiting for the first event"))!;
    const button = screen.getByRole("button", { name: "Check connection" });
    button.focus();
    fireEvent.click(button);
    // aria-disabled, not disabled – focus doesn't drop to <body>
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(document.activeElement).toBe(button);
    expect(status.textContent).toMatch(/Checking/);
    act(() => vi.advanceTimersByTime(1400));
    expect(status.textContent).toMatch(/Pixel is live/);
    expect(document.activeElement).toBe(button);
  });

  test("copying is announced by a status region that was there from the start", () => {
    render(<CrmScreen defaultTab="Pixel integration" />);
    const region = screen.getAllByRole("status").find((n) => n.textContent === "")!;
    expect(region).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    expect(region.textContent).toBe("Snippet copied");
  });

  test("the snippet can be scrolled with the keyboard", () => {
    render(<CrmScreen defaultTab="Pixel integration" />);
    expect(screen.getByLabelText("Tracking snippet").tabIndex).toBe(0);
  });
});
