/* agent-ledger: Redo brought a change back without the undone change it builds on – audit theme 10 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/agent-ledger";
import * as clean from "@components/agent-ledger-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const entries = [
  { id: "a", action: "Created product", system: "Stripe", at: 1000 },
  { id: "b", action: "Set price", system: "Stripe", at: 2000, dependsOn: ["a"] },
  { id: "c", action: "Announced price", system: "Slack", at: 3000, dependsOn: ["b"] },
  { id: "x", action: "Added coupon", system: "Stripe", at: 4000, dependsOn: ["a"] },
];

for (const [style, ui] of styles) {
  describe(`agent-ledger ${style}`, () => {
    test("redoing a change also redoes the undone changes it builds on, not their other dependents", () => {
      const onRedo = vi.fn();
      const { container } = render(<ui.AgentLedger entries={entries} now={5000} defaultUndone={["a", "b", "c", "x"]} onRedo={onRedo} />);
      fireEvent.click(screen.getByRole("button", { name: "Redo: Set price" }));
      expect(onRedo).toHaveBeenCalledTimes(1);
      expect([...onRedo.mock.calls[0][0]].sort()).toEqual(["a", "b", "c"]);
      const undone = [...container.querySelectorAll("li[data-undone]")].map((li) => li.textContent);
      expect(undone).toHaveLength(1);
      expect(undone[0]).toContain("Added coupon");
    });
  });
}

/* Phase 3: undone reports every change; undo and redo may be async and roll back on failure */
for (const [style, ui] of styles) {
  describe(`agent-ledger ${style} – contract`, () => {
    test("uncontrolled undo reports the new undone list", () => {
      const onUndoneChange = vi.fn();
      render(<ui.AgentLedger entries={entries} now={5000} onUndoneChange={onUndoneChange} />);
      fireEvent.click(screen.getByRole("button", { name: /^Undo: Announced price/ }));
      expect(onUndoneChange).toHaveBeenCalledWith(["c"]);
    });

    test("controlled undone only reports", () => {
      const onUndoneChange = vi.fn();
      const { container } = render(<ui.AgentLedger entries={entries} now={5000} undone={[]} onUndoneChange={onUndoneChange} />);
      fireEvent.click(screen.getByRole("button", { name: /^Undo: Announced price/ }));
      expect(onUndoneChange).toHaveBeenCalledWith(["c"]);
      expect(container.querySelectorAll("li[data-undone]")).toHaveLength(0);
    });

    test("an undo that fails goes back and says so", async () => {
      let fail: (e: Error) => void = () => {};
      const onUndo = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
      const { container } = render(<ui.AgentLedger entries={entries} now={5000} onUndo={onUndo} />);
      fireEvent.click(screen.getByRole("button", { name: /^Undo: Announced price/ }));
      expect(container.querySelectorAll("li[data-undone]")).toHaveLength(1);
      expect(container.querySelector("li[data-pending]")).toBeTruthy();
      await act(async () => fail(new Error("offline")));
      expect(container.querySelectorAll("li[data-undone]")).toHaveLength(0);
      expect(screen.getByRole("alert").textContent).toMatch(/Couldn't undo/);
    });
  });
}

/* WCAG + design pass: cascades announced, focus kept while an undo is on its way, no aria-label on a plain span */
for (const [style, ui] of styles) {
  describe(`agent-ledger ${style} – a11y`, () => {
    test("a status line is there from mount and says what an undo or redo took with it (4.1.3)", () => {
      const { container } = render(<ui.AgentLedger entries={entries} now={5000} />);
      const status = container.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("");
      fireEvent.click(screen.getByRole("button", { name: /^Undo: Set price/ }));
      expect(container.querySelector('[role="status"]')).toBe(status);
      expect(status.textContent).toBe("Undone: Set price, and 1 change with it");
      fireEvent.click(screen.getByRole("button", { name: "Redo: Set price" }));
      expect(status.textContent).toBe("Redone: Set price, and 1 change with it");
    });

    test("an irreversible change in the chain is named in the announcement", () => {
      const chain = [
        { id: "a", action: "Set price", system: "Stripe", at: 1000 },
        { id: "m", action: "Sent email", system: "Mail", at: 2000, dependsOn: ["a"], reversible: false },
      ];
      const { container } = render(<ui.AgentLedger entries={chain} now={5000} />);
      fireEvent.click(screen.getByRole("button", { name: /^Undo: Set price/ }));
      expect(container.querySelector('[role="status"]')!.textContent).toBe("Undone: Set price. 1 can't be undone");
    });

    test("Undo becomes Redo on the same, still focused button; a pending one stays focusable (2.4.3)", async () => {
      let done: () => void = () => {};
      const onUndo = vi.fn(() => new Promise<void>((r) => (done = r)));
      render(<ui.AgentLedger entries={entries} now={5000} onUndo={onUndo} />);
      const button = screen.getByRole("button", { name: /^Undo: Announced price/ });
      button.focus();
      fireEvent.click(button);
      const redo = screen.getByRole("button", { name: "Redo: Announced price" });
      expect(redo).toBe(button);
      expect(document.activeElement).toBe(button);
      expect(button.hasAttribute("disabled")).toBe(false);
      expect(button.getAttribute("aria-disabled")).toBe("true");
      fireEvent.click(button);
      expect(screen.queryByRole("button", { name: /^Undo: Announced price/ })).toBeNull();
      await act(async () => done());
      expect(button.hasAttribute("aria-disabled")).toBe(false);
    });

    test("before → after reads 'to' as text, with no aria-label on the arrow span; clipped text has a title", () => {
      const { container } = render(<ui.AgentLedger entries={[{ id: "p", action: "Changed price", target: "Pro plan", system: "Stripe", at: 1000, change: ["$29", "$34"] }]} now={5000} agent="Launch agent" />);
      expect(container.querySelector("span[aria-label]")).toBeNull();
      expect(container.querySelector('[class$="__change"]')!.textContent).toBe("$29→ to $34");
      expect(container.querySelector('[class$="__target"]')!.getAttribute("title")).toBe("Pro plan");
      expect(container.querySelector('[class$="__agent"]')!.getAttribute("title")).toBe("Launch agent");
    });

    test("a removed entry hands focus on to another row's action, not <body>", async () => {
      const { rerender } = render(<ui.AgentLedger entries={entries} now={5000} />);
      screen.getByRole("button", { name: /^Undo: Added coupon/ }).focus();
      rerender(<ui.AgentLedger entries={entries.filter((e) => e.id !== "x")} now={5000} />);
      await act(async () => {});
      expect(document.activeElement?.className).toMatch(/__act/);
    });
  });
}
