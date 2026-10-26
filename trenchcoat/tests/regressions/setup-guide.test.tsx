/* setup-guide: groups/done were read once, panel ids were built from group ids, and the fold-away timer could set
 * state after unmount (Phase 3) */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/setup-guide";
import * as clean from "@components/setup-guide-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const groups = [
  { id: "basics one", title: "Basics", tasks: [{ id: "a", label: "First", done: true }, { id: "b", label: "Second" }] },
  { id: "launch", title: "Launch", tasks: [{ id: "c", label: "Third" }] },
];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// Tasks are checkboxes (they were aria-pressed toggle buttons before the WCAG pass)
const isPressed = (name: string) => screen.getByRole("checkbox", { name }).getAttribute("aria-checked") === "true";

for (const [style, ui] of styles) {
  describe(`setup-guide ${style}`, () => {
    test("controlled done: a tick is reported (also through the deprecated onChange), not applied", () => {
      const onDoneChange = vi.fn();
      const onChange = vi.fn();
      const { rerender } = render(<ui.SetupGuide groups={groups} done={["a"]} onDoneChange={onDoneChange} onChange={onChange} />);
      fireEvent.click(screen.getByRole("checkbox", { name: "Second" }));
      expect(onDoneChange).toHaveBeenCalledWith(["a", "b"]);
      expect(onChange).toHaveBeenCalledWith(["a", "b"]);
      expect(isPressed("Second")).toBe(false);
      rerender(<ui.SetupGuide groups={groups} done={["a", "b"]} />);
      expect(isPressed("Second")).toBe(true);
    });

    test("uncontrolled: changed task flags and added groups are followed", () => {
      const { rerender } = render(<ui.SetupGuide groups={groups} />);
      expect(isPressed("First")).toBe(true);
      const next = [{ ...groups[0], tasks: [{ id: "a", label: "First" }, groups[0].tasks[1]] }, groups[1], { id: "x", title: "Extra", tasks: [{ id: "d", label: "Fourth" }] }];
      rerender(<ui.SetupGuide groups={next} />);
      expect(isPressed("First")).toBe(false);
      expect(screen.getByRole("button", { name: "Extra" })).toBeTruthy();
    });

    test("panel ids come from useId, not from group ids", () => {
      const { container } = render(<ui.SetupGuide groups={groups} />);
      const ids = [...container.querySelectorAll(".ui-sg__panel")].map((p) => p.id);
      expect(ids.every((id) => id && !id.includes("basics") && !id.includes("launch"))).toBe(true);
      const head = screen.getByRole("button", { name: "Basics" });
      expect(container.querySelector(`[id="${head.getAttribute("aria-controls")}"]`)).toBeTruthy();
    });

    test("finishing a group folds it and reports the newly open group; unmounting cancels the timer", () => {
      const onOpenGroupChange = vi.fn();
      const { unmount } = render(<ui.SetupGuide groups={groups} onOpenGroupChange={onOpenGroupChange} />);
      fireEvent.click(screen.getByRole("checkbox", { name: "Second" }));
      act(() => vi.advanceTimersByTime(500));
      expect(onOpenGroupChange).toHaveBeenCalledWith("launch");
      expect(screen.getByRole("button", { name: "Launch" }).getAttribute("aria-expanded")).toBe("true");
      fireEvent.click(screen.getByRole("checkbox", { name: "Third" }));
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });
}

/* WCAG + design pass (f3): minimized content is inert, a group folding away hands focus to its header, tasks are
 * checkboxes, a finished group says so in words and a locked task gives its reason */
for (const [style, ui] of styles) {
  describe(`setup-guide ${style} – a11y`, () => {
    test("minimize makes the body inert (S6) and the toggle controls it", () => {
      const { container } = render(<ui.SetupGuide groups={groups} />);
      const body = container.querySelector(".ui-sg__body")!;
      const toggle = screen.getByRole("button", { name: "Minimize setup guide" });
      expect(toggle.getAttribute("aria-controls")).toBe(body.id);
      expect(body.hasAttribute("inert")).toBe(false);
      fireEvent.click(toggle);
      expect(body.hasAttribute("inert")).toBe(true);
    });

    test("ticking the last task of a group: focus moves to the group's header before it folds (2.4.3)", () => {
      render(<ui.SetupGuide groups={groups} />);
      const second = screen.getByRole("checkbox", { name: "Second" });
      second.focus();
      fireEvent.click(second);
      act(() => vi.advanceTimersByTime(500));
      expect(document.activeElement).toBe(screen.getByRole("button", { name: /^Basics.*done$/ }));
    });

    test("a locked task names why", () => {
      render(<ui.SetupGuide groups={[{ id: "g", title: "Basics", tasks: [{ id: "a", label: "First" }, { id: "b", label: "Second" }] }]} />);
      const locked = screen.getByRole("checkbox", { name: "Second – finish the task before it first" });
      expect(locked).toHaveProperty("disabled", true);
    });
  });
}
