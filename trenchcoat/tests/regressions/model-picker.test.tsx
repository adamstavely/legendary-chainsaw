/*
 * Phase 3 model-picker: one rule for every value (useControllable), option ids no longer built from model ids,
 * and DOM props / ref on the root.
 * WCAG pass: trigger and options had aria-labels that didn't match their visible text (2.5.3); the live region
 * repeated name/latency/price on every arrow press (4.1.3); the keyboard-active option had no ≥ 3:1 indicator
 * (2.4.7 – it now carries data-keyed and the focus ring).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/model-picker";
import * as clean from "@components/model-picker-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const models = [
  { id: "gpt 4/o \"mini\"", name: "Mini" },
  { id: "deep", name: "Deep" },
];


const rich = [
  { id: "fast", name: "Swift", description: "Quick answers", speed: 5, quality: 2, cost: 1, latencyMs: 400, pricePerM: 2 },
  { id: "deep", name: "Deep", description: "Hard problems", speed: 2, quality: 5, cost: 4, latencyMs: 2000, pricePerM: 15 },
];

for (const [style, ui] of styles) {
  const { ModelPicker } = ui;

  describe(`model-picker (${style})`, () => {
    test("option ids don't contain model ids", () => {
      const { container } = render(<ModelPicker models={models} defaultOpen />);
      const ids = [...container.querySelectorAll('[role="option"]')].map((o) => o.id);
      expect(ids).toHaveLength(2);
      for (const id of ids) expect(id).not.toMatch(/mini|deep/i);
      expect(new Set(ids).size).toBe(2);
    });

    test("passing onChange alone doesn't freeze the picker", () => {
      const onChange = vi.fn();
      const { container } = render(<ModelPicker models={models} defaultOpen onChange={onChange} />);
      fireEvent.click(container.querySelectorAll<HTMLElement>('[role="option"]')[1]);
      expect(onChange).toHaveBeenCalledWith("deep");
      expect(container.querySelector(".ui-mdp__trigger")!.textContent).toContain("Deep");
    });

    test("controlled value: a pick is reported, not applied", () => {
      const onChange = vi.fn();
      const { container } = render(<ModelPicker models={models} value={models[0].id} defaultOpen onChange={onChange} />);
      fireEvent.click(container.querySelectorAll<HTMLElement>('[role="option"]')[1]);
      expect(onChange).toHaveBeenCalledWith("deep");
      expect(container.querySelector(".ui-mdp__trigger")!.textContent).toContain("Mini");
    });

    test("an empty models list renders", () => {
      render(<ModelPicker models={[]} />);
      expect(screen.getByRole("button", { name: /Model: Choose a model/ })).toBeTruthy();
    });

    test("the consumer's onKeyDown runs along with Escape handling", () => {
      const onKeyDown = vi.fn();
      const onOpenChange = vi.fn();
      const { container } = render(<ModelPicker models={models} defaultOpen onKeyDown={onKeyDown} onOpenChange={onOpenChange} />);
      fireEvent.keyDown(container.querySelector(".ui-mdp")!, { key: "Escape" });
      expect(onKeyDown).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    test("trigger and options are named by their visible text (no mismatching aria-label)", () => {
      render(<ModelPicker models={rich} defaultValue="deep" defaultThinking defaultOpen />);
      const trigger = screen.getByRole("button", { name: /^Model: Deep\s*, extended thinking$/ });
      expect(trigger.hasAttribute("aria-label")).toBe(false);
      const options = screen.getAllByRole("option");
      for (const o of options) expect(o.hasAttribute("aria-label")).toBe(false);
      // The bars and the tray's numbers are in the name as words
      expect(options).toHaveLength(2);
      expect(
        screen.getByRole("option", {
          name: /^Swift\s*Quick answers\s*\. Speed 5, quality 2, cost 1 of 5, about 1\.0s to the first token, \$2 per million tokens$/,
        }),
      ).toBe(options[0]);
    });

    test("the status region is mounted from the start and only says the final choice", () => {
      render(<ModelPicker models={rich} defaultOpen />);
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      const list = screen.getByRole("listbox");
      list.focus();
      fireEvent.keyDown(list, { key: "ArrowDown" });
      fireEvent.keyDown(list, { key: "ArrowUp" });
      fireEvent.keyDown(list, { key: "ArrowDown" });
      expect(status.textContent).toBe("");
      fireEvent.keyDown(list, { key: "Enter" });
      expect(status.textContent).toBe("Deep selected");
      expect(screen.getAllByRole("status")).toHaveLength(1);
    });

    test("arrows mark the active option for the focus ring; Enter picks and focus returns to the trigger", () => {
      const { container } = render(<ModelPicker models={rich} defaultOpen />);
      const list = screen.getByRole("listbox");
      list.focus();
      expect(list.hasAttribute("data-keyed")).toBe(false);
      fireEvent.keyDown(list, { key: "ArrowDown" });
      expect(list.hasAttribute("data-keyed")).toBe(true);
      const active = container.querySelector('[role="option"][data-active]')!;
      expect(list.getAttribute("aria-activedescendant")).toBe(active.id);
      expect(active.textContent).toContain("Deep");
      fireEvent.keyDown(list, { key: "Enter" });
      expect(document.activeElement).toBe(container.querySelector(".ui-mdp__trigger"));
      expect(screen.getByRole("dialog", { hidden: true }).hasAttribute("inert")).toBe(true);
    });

    test("Esc closes the menu and returns focus to the trigger", () => {
      const { container } = render(<ModelPicker models={rich} defaultOpen />);
      const list = screen.getByRole("listbox");
      list.focus();
      fireEvent.keyDown(list, { key: "Escape" });
      expect(document.activeElement).toBe(container.querySelector(".ui-mdp__trigger"));
      expect(container.querySelector(".ui-mdp__trigger")!.getAttribute("aria-expanded")).toBe("false");
    });

    test("effort: radiogroup with arrows and roving tabindex, inert while thinking is off", async () => {
      const { container } = render(<ModelPicker models={rich} defaultOpen defaultThinking />);
      const medium = screen.getByRole("radio", { name: "Medium" });
      expect(medium.tabIndex).toBe(0);
      medium.focus();
      fireEvent.keyDown(medium, { key: "ArrowRight" });
      const high = screen.getByRole("radio", { name: "High" });
      expect(high.getAttribute("aria-checked")).toBe("true");
      expect(document.activeElement).toBe(high);
      await act(async () => fireEvent.click(screen.getByRole("switch", { name: /Extended thinking/ })));
      expect(container.querySelector(".ui-mdp__fold")!.hasAttribute("inert")).toBe(true);
    });
  });
}
