/* breakdown-chart: numeric slice dimensions summed to 0 (strict compare against the String() values) – audit theme 10 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/breakdown-chart";
import * as clean from "@components/breakdown-chart-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const records = [
  { year: 2025, team: "Core", points: 3 },
  { year: 2025, team: "Growth", points: 5 },
  { year: 2026, team: "Core", points: 8 },
];
const dimensions = [
  { key: "year", label: "Year", values: ["2025", "2026"] },
  { key: "team", label: "Team", values: ["Core", "Growth"] },
];
const measures = [{ key: "points", label: "Points", unit: "points", field: "points" }];

for (const [style, ui] of styles) {
  describe(`breakdown-chart ${style}`, () => {
    for (const segment of ["team", "none"]) {
      test(`a numeric slice dimension adds up (segment: ${segment})`, () => {
        const { container } = render(<ui.BreakdownChart records={records} dimensions={dimensions} measures={measures} defaultSegment={segment} />);
        expect(container.querySelector("[class$='__total'] strong")?.textContent).toBe("16");
      });
    }
  });
}

/* Phase 3: measure, slice, segment and hidden are controllable; empty measures or dimensions don't crash */
for (const [style, ui] of styles) {
  describe(`breakdown-chart ${style} contract`, () => {
    test("controlled hidden reports toggles without applying them", () => {
      const onHiddenChange = vi.fn();
      render(<ui.BreakdownChart records={records} dimensions={dimensions} measures={measures} hidden={[]} onHiddenChange={onHiddenChange} />);
      const chip = screen.getByRole("button", { name: "Core", pressed: true });
      fireEvent.click(chip);
      expect(onHiddenChange).toHaveBeenCalledWith(["Core"]);
      expect(chip.getAttribute("aria-pressed")).toBe("true");
    });

    test("picking another segment clears hidden values and reports both", () => {
      const onSegmentChange = vi.fn();
      const onHiddenChange = vi.fn();
      render(
        <ui.BreakdownChart records={records} dimensions={dimensions} measures={measures} defaultHidden={["Core"]} onSegmentChange={onSegmentChange} onHiddenChange={onHiddenChange} />,
      );
      expect(screen.getByRole("button", { name: "Core", pressed: false })).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: /^Segment / }));
      fireEvent.click(screen.getByRole("option", { name: "None" }));
      expect(onSegmentChange).toHaveBeenCalledWith("none");
      expect(onHiddenChange).toHaveBeenCalledWith([]);
    });

    test("uncontrolled measure follows the picker and reports it", () => {
      const onMeasureChange = vi.fn();
      const twoMeasures = [...measures, { key: "count", label: "Tasks", unit: "tasks" }];
      const { container } = render(<ui.BreakdownChart records={records} dimensions={dimensions} measures={twoMeasures} onMeasureChange={onMeasureChange} />);
      fireEvent.click(screen.getByRole("button", { name: /^Measure / }));
      fireEvent.click(screen.getByRole("option", { name: "Tasks" }));
      expect(onMeasureChange).toHaveBeenCalledWith("count");
      expect(container.querySelector("[class$='__total'] strong")?.textContent).toBe("3");
    });

    test("empty measures and dimensions render an empty chart", () => {
      expect(() => render(<ui.BreakdownChart records={records} dimensions={[]} measures={[]} />)).not.toThrow();
      expect(() => render(<ui.BreakdownChart records={[]} dimensions={dimensions} measures={[]} />)).not.toThrow();
    });

    // WCAG fix pass: Select listbox focus (2.4.3, 2.1.1), name contains the value (2.5.3), hover breakdown
    // (1.4.13, 4.1.3), keyboard-scrollable table (2.1.1)
    test("Select: picking or Esc returns focus to the button; arrows move; Tab closes", () => {
      const twoMeasures = [...measures, { key: "count", label: "Tasks", unit: "tasks" }];
      const onMeasureChange = vi.fn();
      render(<ui.BreakdownChart records={records} dimensions={dimensions} measures={twoMeasures} onMeasureChange={onMeasureChange} />);
      const button = screen.getByRole("button", { name: "Measure Points" });
      fireEvent.click(button);
      expect(document.activeElement).toBe(screen.getByRole("option", { name: "Points" }));
      fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
      expect(document.activeElement).toBe(screen.getByRole("option", { name: "Tasks" }));
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
      expect(screen.queryByRole("listbox")).toBeNull();
      expect(document.activeElement).toBe(button);
      fireEvent.keyDown(button, { key: "ArrowDown" });
      expect(screen.getByRole("listbox")).toBeTruthy();
      fireEvent.click(screen.getByRole("option", { name: "Tasks" }));
      expect(onMeasureChange).toHaveBeenCalledWith("count");
      expect(screen.queryByRole("listbox")).toBeNull();
      expect(document.activeElement).toBe(button);
      fireEvent.click(button);
      fireEvent.keyDown(document.activeElement!, { key: "Tab" });
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    test("the hover breakdown opens on focus, isn't a live region, and Esc closes it without moving focus", () => {
      const { container } = render(<ui.BreakdownChart records={records} dimensions={dimensions} measures={measures} defaultSegment="team" />);
      const bar = container.querySelector<HTMLButtonElement>(".ui-bc__col")!;
      act(() => bar.focus());
      const tip = container.querySelector<HTMLElement>(".ui-bc__tooltip")!;
      expect(tip).toBeTruthy();
      expect(tip.getAttribute("role")).toBeNull();
      expect(tip.closest("[aria-live]")).toBeNull();
      expect(bar.getAttribute("aria-describedby")).toBe(tip.id);
      fireEvent.keyDown(document, { key: "Escape" });
      expect(container.querySelector(".ui-bc__tooltip")).toBeNull();
      expect(document.activeElement).toBe(bar);
    });

    test("the table is a named, focusable region only when it scrolls sideways", () => {
      const proto = HTMLElement.prototype;
      const sw = Object.getOwnPropertyDescriptor(proto, "scrollWidth");
      const cw = Object.getOwnPropertyDescriptor(proto, "clientWidth");
      Object.defineProperty(proto, "scrollWidth", { configurable: true, get() { return this.classList?.contains("ui-bc__table-wrap") ? 600 : 0; } });
      Object.defineProperty(proto, "clientWidth", { configurable: true, get() { return this.classList?.contains("ui-bc__table-wrap") ? 300 : 0; } });
      try {
        const { container } = render(<ui.BreakdownChart records={records} dimensions={dimensions} measures={measures} title="Points" />);
        const wrap = container.querySelector<HTMLElement>(".ui-bc__table-wrap")!;
        expect(wrap.tabIndex).toBe(0);
        expect(screen.getByRole("region", { name: "Points table" })).toBe(wrap);
      } finally {
        if (sw) Object.defineProperty(proto, "scrollWidth", sw);
        else delete (proto as unknown as Record<string, unknown>).scrollWidth;
        if (cw) Object.defineProperty(proto, "clientWidth", cw);
        else delete (proto as unknown as Record<string, unknown>).clientWidth;
      }
      const { container } = render(<ui.BreakdownChart records={records} dimensions={dimensions} measures={measures} />);
      expect(container.querySelector(".ui-bc__table-wrap")!.hasAttribute("tabindex")).toBe(false);
    });

    test("an off legend chip keeps readable text and says so by its state", () => {
      render(<ui.BreakdownChart records={records} dimensions={dimensions} measures={measures} defaultSegment="team" defaultHidden={["Core"]} />);
      expect(screen.getByRole("button", { name: "Core", pressed: false })).toBeTruthy();
    });
  });
}
