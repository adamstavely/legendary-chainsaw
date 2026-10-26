/* billing-schedule: onChange from the handlers (H2 follow-ups), useId for the duration label, prorated phase total, month-end clamping */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/billing-schedule";
import * as clean from "@components/billing-schedule-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const pickDuration = (label: string, nth = 0) => {
  fireEvent.click(screen.getAllByRole("button", { name: /^Duration / })[nth]);
  fireEvent.click(screen.getByRole("option", { name: label }));
};

for (const [style, ui] of styles) {
  describe(`billing-schedule ${style}`, () => {
    test("onChange: not on mount, once per change, with the whole schedule", () => {
      const onChange = vi.fn();
      const { rerender } = render(<ui.BillingSchedule defaultStart="2026-03-01" onChange={onChange} />);
      // A new callback identity on every render isn't a change
      rerender(<ui.BillingSchedule defaultStart="2026-03-01" onChange={(s) => onChange(s)} />);
      expect(onChange).not.toHaveBeenCalled();

      fireEvent.change(screen.getByRole("textbox", { name: "Phase name" }), { target: { value: "Pilot" } });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.lastCall![0]).toMatchObject({ phase: "Pilot", start: "2026-03-01", duration: "milestone" });

      pickDuration("3 months");
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.lastCall![0]).toMatchObject({ phase: "Pilot", duration: "3m" });

      // Picking the duration that's already set changes nothing
      pickDuration("3 months");
      expect(onChange).toHaveBeenCalledTimes(2);

      fireEvent.click(screen.getByRole("button", { name: "Add discount" }));
      expect(onChange).toHaveBeenCalledTimes(3);
      expect(onChange.mock.lastCall![0].lines.map((l: { kind: string }) => l.kind)).toEqual(["product", "discount"]);

      // Focusing and leaving a price without editing it isn't a change either
      const price = screen.getByRole("textbox", { name: "Set-up fee price" });
      fireEvent.focus(price);
      fireEvent.blur(price);
      expect(onChange).toHaveBeenCalledTimes(3);
    });

    test("two schedules on a page label their own duration menus", () => {
      render(
        <>
          <ui.BillingSchedule />
          <ui.BillingSchedule />
        </>,
      );
      // Named by the label and the value: "Duration Milestone"
      const buttons = screen.getAllByRole("button", { name: "Duration Milestone" });
      expect(buttons).toHaveLength(2);
      const ids = buttons.map((b) => b.getAttribute("aria-labelledby")!.split(" ")[0]);
      expect(ids[0]).not.toEqual(ids[1]);
      for (const id of ids) expect(document.getElementById(id!)?.textContent).toBe("Duration");
    });

    test("a phase starting on Jan 31 ends within February", () => {
      const { container } = render(<ui.BillingSchedule defaultStart="2026-01-31" />);
      pickDuration("1 month");
      expect(container.querySelector('[class$="__end"]')?.textContent).toBe("27 Feb 2026");
      pickDuration("3 months");
      expect(container.querySelector('[class$="__end"]')?.textContent).toBe("29 Apr 2026");
      pickDuration("12 months");
      expect(container.querySelector('[class$="__end"]')?.textContent).toBe("30 Jan 2027");
    });

    test("the phase total prorates recurring products over the phase length", () => {
      const product = (repeat: standard.Repeat, price: number) => ({ id: repeat, kind: "product" as const, name: repeat, repeat, price, timing: "advance" as const });
      const { container } = render(
        <ui.BillingSchedule defaultLines={[product("yearly", 1200), product("quarterly", 300), product("monthly", 100), product("once", 50)]} />,
      );
      const total = () => container.querySelector('[class*="__totals"] > span:last-child b')?.textContent;
      // A milestone counts one billing period of each product
      expect(total()).toBe("$1,650.00");
      // 3 months: a quarter of the yearly price, one quarter, three months, the one-off
      pickDuration("3 months");
      expect(total()).toBe("$950.00");
      // 1 month: a twelfth of the year, a third of the quarter – not a full year of the yearly product
      pickDuration("1 month");
      expect(total()).toBe("$350.00");
      pickDuration("12 months");
      expect(total()).toBe("$3,650.00");
    });
  });
}

/* Phase 3: one API contract */
for (const [style, ui] of styles) {
  describe(`billing-schedule ${style} contract`, () => {
    test("controlled fields show their props and report edits without applying them", () => {
      const onPhaseChange = vi.fn();
      const onDurationChange = vi.fn();
      const onLinesChange = vi.fn();
      render(<ui.BillingSchedule phase="Pilot" onPhaseChange={onPhaseChange} duration="3m" onDurationChange={onDurationChange} lines={[]} onLinesChange={onLinesChange} />);
      const input = screen.getByRole("textbox", { name: "Phase name" }) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Rollout" } });
      expect(onPhaseChange).toHaveBeenCalledWith("Rollout");
      expect(input.value).toBe("Pilot");
      pickDuration("6 months");
      expect(onDurationChange).toHaveBeenCalledWith("6m");
      expect(screen.getByRole("button", { name: /^Duration / }).textContent).toBe("3 months");
      fireEvent.click(screen.getByRole("button", { name: "Add discount" }));
      expect(onLinesChange.mock.lastCall![0].map((l: { kind: string }) => l.kind)).toEqual(["discount"]);
      expect(screen.queryByText("Discount")).toBeNull();
    });

    test("uncontrolled fields start from their defaults and report changes", () => {
      const onPhaseChange = vi.fn();
      render(<ui.BillingSchedule defaultPhase="Pilot" defaultDuration="6m" onPhaseChange={onPhaseChange} />);
      const input = screen.getByRole("textbox", { name: "Phase name" }) as HTMLInputElement;
      expect(input.value).toBe("Pilot");
      expect(screen.getByRole("button", { name: /^Duration / }).textContent).toBe("6 months");
      fireEvent.change(input, { target: { value: "Rollout" } });
      expect(input.value).toBe("Rollout");
      expect(onPhaseChange).toHaveBeenCalledWith("Rollout");
    });

    test("name submits the schedule as JSON; disabled disables every control", () => {
      const { container, rerender } = render(<ui.BillingSchedule name="schedule" defaultPhase="Pilot" />);
      const hidden = container.querySelector<HTMLInputElement>('input[type="hidden"][name="schedule"]')!;
      expect(JSON.parse(hidden.value)).toMatchObject({ phase: "Pilot", duration: "milestone", start: "2026-01-01" });
      rerender(<ui.BillingSchedule name="schedule" defaultPhase="Pilot" disabled />);
      const controls = container.querySelectorAll<HTMLInputElement>("input, select, button");
      expect([...controls].every((c) => c.disabled)).toBe(true);
    });

    test("Enter while composing (IME) doesn't commit a price", () => {
      const onLinesChange = vi.fn();
      render(<ui.BillingSchedule onLinesChange={onLinesChange} />);
      const price = screen.getByRole("textbox", { name: "Set-up fee price" }) as HTMLInputElement;
      price.focus();
      fireEvent.focus(price);
      fireEvent.change(price, { target: { value: "12" } });
      fireEvent.keyDown(price, { key: "Enter", isComposing: true });
      expect(document.activeElement).toBe(price);
      fireEvent.keyDown(price, { key: "Enter" });
      expect(onLinesChange).toHaveBeenCalledTimes(1);
    });
  });
}

/* WCAG fix pass: Duration/Add product were listboxes without the keyboard pattern (Add product holds actions – a menu),
   the Duration button's name hid its value, Remove / Add discount dropped focus, number fields stripped and clamped
   input silently (3.3.1), and the "Repeats" selects vanished below 520 px (1.4.10) */
for (const [style, ui] of styles) {
  describe(`billing-schedule ${style} – keyboard, focus, errors`, () => {
    test("Duration: a listbox – focus moves in on the chosen option, arrows move, Escape returns to the button", () => {
      render(<ui.BillingSchedule defaultDuration="3m" />);
      const trigger = screen.getByRole("button", { name: "Duration 3 months" });
      act(() => trigger.focus());
      fireEvent.click(trigger);
      expect(document.activeElement).toBe(screen.getByRole("option", { name: "3 months" }));
      fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
      expect(document.activeElement).toBe(screen.getByRole("option", { name: "6 months" }));
      fireEvent.keyDown(document.activeElement!, { key: "End" });
      expect(document.activeElement).toBe(screen.getByRole("option", { name: "12 months" }));
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("listbox")).toBeNull();
      expect(document.activeElement).toBe(trigger);
      // ArrowDown on the button opens it on the first option; picking returns focus to the button
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
      expect(document.activeElement).toBe(screen.getByRole("option", { name: "Milestone" }));
      fireEvent.click(screen.getByRole("option", { name: "1 month" }));
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Duration 1 month" }));
    });

    test("Add product: a menu of actions; picking one adds it and returns focus to the button", () => {
      const onLinesChange = vi.fn();
      render(<ui.BillingSchedule onLinesChange={onLinesChange} />);
      const add = screen.getByRole("button", { name: "Add product" });
      expect(add.getAttribute("aria-haspopup")).toBe("menu");
      act(() => add.focus());
      fireEvent.keyDown(add, { key: "ArrowUp" });
      const items = screen.getAllByRole("menuitem");
      expect(document.activeElement).toBe(items.at(-1));
      fireEvent.keyDown(document.activeElement!, { key: "Home" });
      expect(document.activeElement).toBe(items[0]);
      fireEvent.click(items[1]);
      expect(screen.queryByRole("menu")).toBeNull();
      expect(document.activeElement).toBe(add);
      expect(onLinesChange.mock.lastCall![0].map((l: { name: string }) => l.name)).toContain("Platform licence");
    });

    test("Remove moves focus to the next line's Remove, the last line's to Add product", () => {
      render(
        <ui.BillingSchedule
          defaultLines={[
            { id: "a", kind: "product", name: "A", repeat: "once", price: 1, timing: "advance" },
            { id: "b", kind: "product", name: "B", repeat: "once", price: 1, timing: "advance" },
          ]}
        />,
      );
      const removeA = screen.getByRole("button", { name: "Remove A" });
      act(() => removeA.focus());
      fireEvent.click(removeA);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove B" }));
      fireEvent.click(screen.getByRole("button", { name: "Remove B" }));
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add product" }));
    });

    test("Add discount moves focus into the new line (the button gets disabled)", () => {
      render(<ui.BillingSchedule />);
      const add = screen.getByRole("button", { name: "Add discount" });
      act(() => add.focus());
      fireEvent.click(add);
      expect((add as HTMLButtonElement).disabled).toBe(true);
      expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Discount percent" }));
    });

    test("number fields say what they couldn't take instead of dropping it", () => {
      const onLinesChange = vi.fn();
      render(<ui.BillingSchedule onLinesChange={onLinesChange} defaultLines={[{ id: "d", kind: "discount", name: "Discount", percent: 10 }]} />);
      const field = screen.getByRole("textbox", { name: "Discount percent" }) as HTMLInputElement;
      fireEvent.focus(field);
      fireEvent.change(field, { target: { value: "1x" } });
      expect(field.value).toBe("1x");
      expect(field.getAttribute("aria-invalid")).toBe("true");
      expect(document.getElementById(field.getAttribute("aria-describedby")!)!.textContent).toBe("Numbers only");
      fireEvent.blur(field);
      expect(onLinesChange).not.toHaveBeenCalled();
      expect(field.value).toBe("10");
      // Over the maximum: capped, and it says so
      fireEvent.focus(field);
      fireEvent.change(field, { target: { value: "150" } });
      fireEvent.blur(field);
      expect(onLinesChange.mock.lastCall![0][0].percent).toBe(100);
      expect(document.getElementById(field.getAttribute("aria-describedby")!)!.textContent).toBe("Capped at 100%");
    });

    test("the Repeats select is never hidden by the stylesheet", () => {
      render(<ui.BillingSchedule />);
      const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("");
      expect(css).not.toMatch(/__row > :nth-child\(2\) \{ display: none/);
      expect(screen.getByRole("combobox", { name: "Set-up fee repeats" })).toBeTruthy();
    });
  });
}
