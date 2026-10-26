/*
 * Phase 3 smart-recommendation: empty options crashed, the chosen alternative survived a new set of options, and
 * acceptance couldn't be owned or awaited. Now value / accepted / open follow the controllable contract, a new set
 * of options starts over, and onAccept / onUndo may be async.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/smart-recommendation";
import * as clean from "@components/smart-recommendation-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const options = [
  { id: "inc", label: "Incremental sync", reason: "Only changed rows move.", signal: 3 as const },
  { id: "full", label: "Full sync", reason: "Copies everything again.", signal: 1 as const },
];
const other = [
  { id: "cache", label: "Cache", reason: "Keep a warm cache.", signal: 2 as const },
  { id: "full", label: "Full sync", reason: "Copies everything again.", signal: 1 as const },
];
const reason = (c: HTMLElement) => c.querySelector(".ui-sr__reason")!.textContent;

for (const [style, ui] of styles) {
  const { SmartRecommendation } = ui;

  describe(`smart-recommendation (${style})`, () => {
    test("an empty options list renders instead of crashing", () => {
      const { container } = render(<SmartRecommendation options={[]} />);
      expect(reason(container)).toMatch(/No recommendation/);
      expect(screen.queryByRole("button", { name: /Accept/ })).toBeNull();
    });

    test("picking an alternative is reported, and a new set of options goes back to the recommendation", () => {
      const onValueChange = vi.fn();
      const { container, rerender } = render(<SmartRecommendation options={options} onValueChange={onValueChange} />);
      fireEvent.click(screen.getByRole("button", { name: /Alternatives/ }));
      fireEvent.click(screen.getByRole("menuitemradio", { name: /Full sync/ }));
      expect(onValueChange).toHaveBeenCalledWith("full");
      expect(reason(container)).toBe("Copies everything again.");
      rerender(<SmartRecommendation options={other} onValueChange={onValueChange} />);
      expect(reason(container)).toBe("Keep a warm cache.");
    });

    test("a new set of options clears an uncontrolled acceptance", () => {
      const { container, rerender } = render(<SmartRecommendation options={options} />);
      fireEvent.click(screen.getByRole("button", { name: /Accept incremental sync/ }));
      expect(container.querySelector(".ui-sr")!.hasAttribute("data-accepted")).toBe(true);
      rerender(<SmartRecommendation options={other} />);
      expect(container.querySelector(".ui-sr")!.hasAttribute("data-accepted")).toBe(false);
    });

    test("an async onAccept stays pending, counts only once it resolves, and reports a rejection", async () => {
      const calls: { resolve: () => void; reject: (e: Error) => void }[] = [];
      const onAccept = vi.fn(() => new Promise<void>((resolve, reject) => calls.push({ resolve, reject })));
      const { container } = render(<SmartRecommendation options={options} onAccept={onAccept} />);
      const accept = () => screen.getByRole("button", { name: /Accept incremental sync/ });
      fireEvent.click(accept());
      expect(accept().getAttribute("aria-busy")).toBe("true");
      fireEvent.click(accept());
      expect(onAccept).toHaveBeenCalledTimes(1);
      await act(async () => calls[0].reject(new Error("offline")));
      expect(screen.getByRole("alert").textContent).toMatch(/Couldn't accept it/);
      expect(container.querySelector(".ui-sr")!.hasAttribute("data-accepted")).toBe(false);
      fireEvent.click(accept());
      await act(async () => calls[1].resolve());
      expect(container.querySelector(".ui-sr")!.hasAttribute("data-accepted")).toBe(true);
    });

    test("controlled accepted: Accept is reported through onAccept, not applied", () => {
      const onAccept = vi.fn();
      const { container } = render(<SmartRecommendation options={options} accepted={null} onAccept={onAccept} />);
      fireEvent.click(screen.getByRole("button", { name: /Accept incremental sync/ }));
      expect(onAccept).toHaveBeenCalledWith(options[0]);
      expect(container.querySelector(".ui-sr")!.hasAttribute("data-accepted")).toBe(false);
    });
  });
}

/* WCAG + design pass (f3): Alternatives is a real menu (focus moves in, arrows, Esc and a pick return focus to the
 * trigger), the chosen option has a check, and Accept ⇄ Undo keep focus on the action that is there now */
for (const [style, ui] of styles) {
  describe(`smart-recommendation ${style} – a11y`, () => {
    test("menu: focus moves in, arrows move, Esc returns focus to the trigger", () => {
      render(<ui.SmartRecommendation options={options} />);
      const trigger = screen.getByRole("button", { name: /Alternatives/ });
      trigger.focus();
      fireEvent.click(trigger);
      const [inc, full] = screen.getAllByRole("menuitemradio");
      expect(document.activeElement).toBe(inc);
      expect(inc.querySelector(".ui-sr__check")).toBeTruthy();
      fireEvent.keyDown(inc, { key: "ArrowDown" });
      expect(document.activeElement).toBe(full);
      fireEvent.keyDown(full, { key: "Escape" });
      expect(screen.queryByRole("menu")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    test("picking an option closes the menu and returns focus to the trigger", () => {
      render(<ui.SmartRecommendation options={options} />);
      fireEvent.click(screen.getByRole("button", { name: /Alternatives/ }));
      const full = screen.getByRole("menuitemradio", { name: /Full sync/ });
      full.focus();
      fireEvent.click(full);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: /Alternatives/ }));
    });

    test("Accept moves focus to Undo, Undo back to Accept (2.4.3)", async () => {
      render(<ui.SmartRecommendation options={options} />);
      const accept = screen.getByRole("button", { name: /Accept incremental sync/ });
      accept.focus();
      await act(async () => {
        fireEvent.click(accept);
      });
      const undo = screen.getByRole("button", { name: /Undo/ });
      expect(document.activeElement).toBe(undo);
      await act(async () => {
        fireEvent.click(undo);
      });
      expect(document.activeElement).toBe(screen.getByRole("button", { name: /Accept incremental sync/ }));
    });
  });
}
