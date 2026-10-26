/* screens/evals: Phase 5 review – the run's toast read through a ref, a controllable version */
import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { EvalsScreen } from "@screens/evals";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const chip = () => document.querySelector(".ui-ev__chip--btn")!;

describe("evals screen", () => {
  test("a run walks every case once and ends with its toast", () => {
    render(<EvalsScreen />);
    fireEvent.click(screen.getByRole("button", { name: /Run eval/ }));
    expect(screen.getByText(/Running 1 of 25/)).toBeTruthy();
    // One case per timer, each scheduled after the last one renders
    for (let t = 0; t < 12_000 && !screen.queryByText("Last run just now"); t += 100) act(() => vi.advanceTimersByTime(100));
    expect(document.querySelector(".ui-as-toast")?.textContent).toMatch(/Eval finished · \d+% of 25 cases passed/);
    expect(screen.getByText("Last run just now")).toBeTruthy();
  });

  test("a running eval leaves no timer behind on unmount", () => {
    const view = render(<EvalsScreen />);
    fireEvent.click(screen.getByRole("button", { name: /Run eval/ }));
    act(() => vi.advanceTimersByTime(1000));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("version: picking one reports it; controlled stays until the parent changes it", () => {
    const onVersionChange = vi.fn();
    const { rerender } = render(<EvalsScreen version="v12" onVersionChange={onVersionChange} />);
    fireEvent.click(chip());
    fireEvent.click(screen.getByRole("menuitemradio", { name: /v10/ }));
    expect(onVersionChange).toHaveBeenCalledWith("v10");
    expect(chip().firstChild?.textContent).toBe("v12");
    rerender(<EvalsScreen version="v10" onVersionChange={onVersionChange} />);
    expect(chip().firstChild?.textContent).toBe("v10");
  });

  test("an unknown version shows the current one instead of “undefined%”", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<EvalsScreen version="v99" />);
    expect(chip().firstChild?.textContent).toBe("v12");
    expect(document.body.textContent).not.toMatch(/undefined|NaN/);
  });
});

/* WCAG + design pass: KPI Chart and Inline Diff used as they are; the selected case has a non-colour cue */
describe("evals screen – accessibility and composition", () => {
  test("the screen styles never reach into the KPI Chart's or the Inline Diff's internal classes", () => {
    render(<EvalsScreen />);
    const css = readFileSync("screens/evals.tsx", "utf8").split("const css =")[1];
    expect(css).not.toMatch(/\.ui-kpi|\.ui-df/);
    // Score text isn't faded below contrast with opacity
    expect(css).not.toMatch(/\.ui-ev__pill > span \{[^}]*opacity/);
    // The selected row carries a bar in the selected colour, not only a tint
    expect(css).toMatch(/aria-selected="true"\] td:first-child \{ box-shadow: inset 3px 0 0 var\(--tc-border-selected/);
  });

  test("Enter selects a case from the keyboard", () => {
    render(<EvalsScreen />);
    const row = document.querySelector<HTMLElement>('tr[data-i="0"]')!;
    row.focus();
    fireEvent.keyDown(row, { key: "Enter" });
    expect(row.getAttribute("aria-selected")).toBe("true");
    expect(document.querySelector('tr[data-i="9"]')?.getAttribute("aria-selected")).toBe("false");
  });
});
