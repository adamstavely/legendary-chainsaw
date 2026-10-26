/* agent-graph: Phase 3 contract – controllable selection, clock fallback, pure render */
import { act, fireEvent, render } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import * as standard from "@components/agent-graph";
import * as clean from "@components/agent-graph-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const nodes = [
  { id: "lead", name: "Lead", kind: "agent" as const, lead: true },
  { id: "search", name: "Search", kind: "tool" as const },
];
const openCard = (c: HTMLElement) => c.querySelector('[role="dialog"]')?.getAttribute("aria-label") ?? null;

// Nodes are drawn once the graph has a width
const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth")!;
beforeAll(() => Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => 640 }));
afterAll(() => Object.defineProperty(HTMLElement.prototype, "offsetWidth", width));

for (const [style, ui] of styles) {
  describe(`agent-graph ${style}`, () => {
    test("uncontrolled selection opens on click and reports both callbacks", () => {
      const onSelect = vi.fn();
      const onSelectedChange = vi.fn();
      const { container } = render(<ui.AgentGraph nodes={nodes} edges={[["lead", "search"]]} now={0} onSelect={onSelect} onSelectedChange={onSelectedChange} />);
      const button = container.querySelectorAll<HTMLButtonElement>(".ui-agg__node button")[0];
      fireEvent.click(button);
      expect(openCard(container)).toBe("Lead");
      expect(onSelectedChange).toHaveBeenCalledWith("lead");
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "lead" }));
    });

    test("controlled selection only reports", () => {
      const onSelectedChange = vi.fn();
      const { container } = render(<ui.AgentGraph nodes={nodes} edges={[["lead", "search"]]} now={0} selected={null} onSelectedChange={onSelectedChange} />);
      fireEvent.click(container.querySelectorAll<HTMLButtonElement>(".ui-agg__node button")[0]);
      expect(onSelectedChange).toHaveBeenCalledWith("lead");
      expect(openCard(container)).toBeNull();
    });

    test("a selected node that goes away closes its card once", () => {
      const onSelectedChange = vi.fn();
      const { container, rerender } = render(<ui.AgentGraph nodes={nodes} now={0} defaultSelected="search" onSelectedChange={onSelectedChange} />);
      expect(openCard(container)).toBe("Search");
      rerender(<ui.AgentGraph nodes={nodes.slice(0, 1)} now={0} defaultSelected="search" onSelectedChange={onSelectedChange} />);
      rerender(<ui.AgentGraph nodes={nodes.slice(0, 1)} now={0} defaultSelected="search" onSelectedChange={onSelectedChange} />);
      expect(onSelectedChange).toHaveBeenCalledTimes(1);
      expect(onSelectedChange).toHaveBeenCalledWith(null);
    });

    test("without `now` the clock starts at a stable value and fills in after mount", () => {
      vi.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
      try {
        const at = Date.now();
        const calls = [{ id: "c1", from: "lead", to: "search", at: at - 1000 }];
        const { container } = render(<ui.AgentGraph nodes={nodes} calls={calls} />);
        act(() => {
          vi.advanceTimersByTime(1100);
        });
        expect(container.textContent).toMatch(/1\s*\/\s*min|1 call/);
      } finally {
        vi.useRealTimers();
      }
    });
  });
}

/* WCAG + design pass: focus back from the card, a persistent alert line, a name from content, a pause control */
const team = [
  { id: "lead", name: "Lead", kind: "agent" as const, lead: true, icon: <svg /> },
  { id: "gh", name: "Git Hub", kind: "tool" as const },
  { id: "rev", name: "Reviewer", kind: "agent" as const, status: "waiting" as const, icon: <svg /> },
];
for (const [style, ui] of styles) {
  describe(`agent-graph ${style} – a11y`, () => {
    const nodeButton = (c: HTMLElement, name: RegExp) => [...c.querySelectorAll<HTMLButtonElement>("button[data-agg-node]")].find((b) => name.test(b.textContent ?? ""))!;

    test("node buttons are named by their content, not an aria-label that hides the initials (2.5.3)", () => {
      const { container } = render(<ui.AgentGraph nodes={team} now={0} />);
      const gh = nodeButton(container, /^Git Hub/);
      expect(gh.hasAttribute("aria-label")).toBe(false);
      expect(gh.textContent).toMatch(/^Git Hub, tool/);
      expect(gh.querySelector('[aria-hidden="true"]')?.textContent).toBe("GH");
    });

    test("Close and Escape put focus back on the node (2.4.3)", () => {
      const { container } = render(<ui.AgentGraph nodes={team} now={0} />);
      const lead = nodeButton(container, /^Lead/);
      lead.focus();
      fireEvent.click(lead);
      const close = container.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Close"]')!;
      close.focus();
      fireEvent.click(close);
      expect(openCard(container)).toBeNull();
      expect(document.activeElement).toBe(lead);

      fireEvent.click(lead);
      container.querySelector<HTMLButtonElement>('[role="dialog"] button')!.focus();
      fireEvent.keyDown(container.querySelector('[role="dialog"]')!, { key: "Escape" });
      expect(openCard(container)).toBeNull();
      expect(document.activeElement).toBe(lead);
    });

    test("a card opened from a chip in the bar hands focus back to that chip", () => {
      const { container } = render(<ui.AgentGraph nodes={team} now={0} />);
      const chip = container.querySelector<HTMLButtonElement>(".ui-agg__chip")!;
      chip.focus();
      fireEvent.click(chip);
      expect(openCard(container)).toBe("Reviewer");
      fireEvent.click(container.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Close"]')!);
      expect(document.activeElement).toBe(chip);
    });

    test("the alert line is there from mount and says who needs you (4.1.3)", () => {
      const calm = team.map((n) => ({ ...n, status: undefined }));
      const { container, rerender } = render(<ui.AgentGraph nodes={calm} now={0} />);
      const status = container.querySelector('header [role="status"]')!;
      expect(status.textContent).toBe("");
      expect(container.querySelector("[aria-live]")).toBeNull();
      rerender(<ui.AgentGraph nodes={team} now={0} />);
      expect(container.querySelector('header [role="status"]')).toBe(status);
      expect(status.textContent).toBe("Reviewer needs you");
    });

    test("Pause stops the motion and stays the same focused button (2.2.2)", () => {
      const onPausedChange = vi.fn();
      const { container } = render(<ui.AgentGraph nodes={team} now={0} onPausedChange={onPausedChange} />);
      const pause = container.querySelector<HTMLButtonElement>('button[aria-label="Pause motion"]')!;
      expect(pause.getAttribute("aria-pressed")).toBe("false");
      pause.focus();
      fireEvent.click(pause);
      expect(onPausedChange).toHaveBeenCalledWith(true);
      expect(pause.getAttribute("aria-pressed")).toBe("true");
      expect(container.firstElementChild!.hasAttribute("data-paused")).toBe(true);
      expect(document.activeElement).toBe(pause);
    });

    test("controlled paused only reports", () => {
      const onPausedChange = vi.fn();
      const { container } = render(<ui.AgentGraph nodes={team} now={0} paused={false} onPausedChange={onPausedChange} />);
      fireEvent.click(container.querySelector<HTMLButtonElement>('button[aria-label="Pause motion"]')!);
      expect(onPausedChange).toHaveBeenCalledWith(true);
      expect(container.querySelector('button[aria-label="Pause motion"]')!.getAttribute("aria-pressed")).toBe("false");
    });
  });
}
