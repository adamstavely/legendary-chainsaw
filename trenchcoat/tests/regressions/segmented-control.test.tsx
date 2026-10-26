/* segmented-control: options added after mount are measured, the value submits with a form, uncontrolled reports
 * changes, and IME composition doesn't move the selection (Phase 3) */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/segmented-control";
import * as clean from "@components/segmented-control-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

let observed: Element[] = [];
beforeEach(() => {
  observed = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe(el: Element) {
        observed.push(el);
      }
      disconnect() {}
      unobserve() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

for (const [style, ui] of styles) {
  describe(`segmented-control ${style}`, () => {
    test("an option swapped in after mount (same count) is observed", () => {
      const { rerender } = render(<ui.SegmentedControl aria-label="Pick" options={options} />);
      rerender(<ui.SegmentedControl aria-label="Pick" options={[options[0], { value: "c", label: "Gamma" }]} />);
      const gamma = screen.getByRole("radio", { name: "Gamma" });
      expect(observed).toContain(gamma);
    });

    test("name renders a hidden input with the current value; disabled leaves it out of the form", () => {
      const { container, rerender } = render(
        <form>
          <ui.SegmentedControl aria-label="Pick" name="plan" options={options} defaultValue="b" />
        </form>,
      );
      const form = container.querySelector("form")!;
      expect(new FormData(form).get("plan")).toBe("b");
      fireEvent.click(screen.getByRole("radio", { name: "Alpha" }));
      expect(new FormData(form).get("plan")).toBe("a");
      rerender(
        <form>
          <ui.SegmentedControl aria-label="Pick" name="plan" options={options} defaultValue="b" disabled />
        </form>,
      );
      expect(new FormData(form).get("plan")).toBeNull();
    });

    test("uncontrolled with onChange still moves, and keys during IME composition are ignored", () => {
      const onChange = vi.fn();
      render(<ui.SegmentedControl aria-label="Pick" options={options} onChange={onChange} />);
      const group = screen.getByRole("radiogroup");
      fireEvent.keyDown(group, { key: "ArrowRight", isComposing: true });
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.keyDown(group, { key: "ArrowRight" });
      expect(onChange).toHaveBeenCalledWith("b");
      expect(screen.getByRole("radio", { name: "Beta" }).getAttribute("aria-checked")).toBe("true");
    });
  });
}

/* WCAG + design pass (f3) */
for (const [style, ui] of styles) {
  describe(`segmented-control ${style} – a11y`, () => {
    test("a mouse press picks on release, not on press (2.5.2)", () => {
      const onChange = vi.fn();
      render(<ui.SegmentedControl aria-label="Pick" options={options} defaultValue="b" onChange={onChange} />);
      const track = screen.getByRole("radiogroup");
      const [alpha] = screen.getAllByRole("radio");
      alpha.getBoundingClientRect = () => ({ left: 0, right: 50, top: 0, bottom: 30, width: 50, height: 30, x: 0, y: 0, toJSON() {} }) as DOMRect;
      fireEvent.pointerDown(track, { button: 0, pointerId: 1, pointerType: "mouse", clientX: 10, clientY: 10 });
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.pointerUp(track, { button: 0, pointerId: 1, pointerType: "mouse", clientX: 10, clientY: 10 });
      expect(onChange).toHaveBeenCalledWith("a");
    });

    test("radiogroup keeps one tab stop and arrow keys move focus with the selection", () => {
      render(<ui.SegmentedControl aria-label="Pick" options={options} defaultValue="a" />);
      const [alpha, beta] = screen.getAllByRole("radio");
      expect(alpha.tabIndex).toBe(0);
      expect(beta.tabIndex).toBe(-1);
      alpha.focus();
      fireEvent.keyDown(alpha, { key: "ArrowRight" });
      expect(document.activeElement).toBe(beta);
      expect(beta.getAttribute("aria-checked")).toBe("true");
    });
  });
}
