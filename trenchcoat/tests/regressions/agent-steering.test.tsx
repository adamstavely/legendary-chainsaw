/* agent-steering: Phase 3 contract – no clock/navigator reads in render, controllable draft, async sends */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/agent-steering";
import * as clean from "@components/agent-steering-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const steps = [{ id: "s1", title: "Read schema", status: "active" as const }];

for (const [style, ui] of styles) {
  describe(`agent-steering ${style}`, () => {
    test("uncontrolled draft starts at defaultDraft and reports changes", () => {
      const onDraftChange = vi.fn();
      render(<ui.AgentSteering title="Run" steps={steps} queue={[]} defaultDraft="hello" onDraftChange={onDraftChange} />);
      const field = screen.getByRole<HTMLTextAreaElement>("textbox");
      expect(field.value).toBe("hello");
      fireEvent.change(field, { target: { value: "hello there" } });
      expect(field.value).toBe("hello there");
      expect(onDraftChange).toHaveBeenCalledWith("hello there");
    });

    test("a queued note that fails comes back to the field", async () => {
      let fail: (e: Error) => void = () => {};
      const onQueue = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
      render(<ui.AgentSteering title="Run" steps={steps} queue={[]} onQueue={onQueue} />);
      const field = screen.getByRole<HTMLTextAreaElement>("textbox");
      fireEvent.change(field, { target: { value: "Use the replica" } });
      fireEvent.keyDown(field, { key: "Enter" });
      expect(field.value).toBe("");
      expect(screen.getByRole("button", { name: "Queue for the next step" })).toHaveProperty("disabled", true);
      await act(async () => fail(new Error("offline")));
      expect(field.value).toBe("Use the replica");
      expect(screen.getByRole("alert").textContent).toMatch(/try again/);
    });

    test("the modifier hint is read after mount, and the clock ticks from mount", () => {
      vi.useFakeTimers({ now: 1_000_000 });
      try {
        const { container } = render(<ui.AgentSteering title="Run" steps={steps} queue={[]} onInterrupt={() => {}} />);
        expect(container.textContent).toMatch(/Ctrl|⌘/);
        act(() => {
          vi.advanceTimersByTime(2050);
        });
        expect(container.textContent).toMatch(/Running · 2s/);
        expect(container.textContent).toMatch(/2\.0s/);
      } finally {
        vi.useRealTimers();
      }
    });

    describe("WCAG pass", () => {
      const queue = [
        { id: "n1", text: "Use the replica" },
        { id: "n2", text: "Skip the audit table" },
        { id: "n3", text: "Batch by 500" },
      ];
      const status = (c: HTMLElement) => c.querySelector('[role="status"]')!;

      test("Pause and Resume are one button – focus stays on it", () => {
        const props = { title: "Run", steps, queue: [], onPause: () => {}, onResume: () => {} };
        const { rerender } = render(<ui.AgentSteering {...props} status="running" />);
        const btn = screen.getByRole("button", { name: "Pause the run" });
        btn.focus();
        rerender(<ui.AgentSteering {...props} status="paused" />);
        expect(screen.getByRole("button", { name: "Resume the run" })).toBe(btn);
        expect(document.activeElement).toBe(btn);
      });

      test("queued notes have unique names, and removing one moves focus to the next note's same button", async () => {
        const props = { title: "Run", steps, onRemove: () => {}, onInterrupt: () => {} };
        const { rerender } = render(<ui.AgentSteering {...props} queue={queue} />);
        expect(screen.getByRole("button", { name: "Apply now: “Skip the audit table”" })).toBeTruthy();
        screen.getByRole("button", { name: "Remove “Skip the audit table”" }).focus();
        rerender(<ui.AgentSteering {...props} queue={[queue[0], queue[2]]} />);
        await act(async () => {});
        expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove “Batch by 500”" }));
        // The last note goes: focus moves to the field, never <body>
        screen.getByRole("button", { name: "Apply now: “Batch by 500”" }).focus();
        rerender(<ui.AgentSteering {...props} queue={[queue[0]]} />);
        await act(async () => {});
        expect(document.activeElement).toBe(screen.getByRole("button", { name: "Apply now: “Use the replica”" }));
        rerender(<ui.AgentSteering {...props} queue={[]} />);
        await act(async () => {});
        expect(document.activeElement).toBe(screen.getByRole("textbox"));
      });

      test("each step says its state in words; the status region is there from mount", () => {
        const { container } = render(
          <ui.AgentSteering
            title="Run"
            queue={[]}
            steps={[
              { id: "a", title: "Read schema", status: "done" },
              { id: "b", title: "Write migration", status: "active" },
              { id: "c", title: "Run tests" },
            ]}
          />,
        );
        const items = [...container.querySelectorAll(".ui-st__step")].map((li) => li.querySelector(".ui-st__sr")!.textContent);
        expect(items).toEqual(["Done: ", "In progress: ", "To do: "]);
        expect(status(container)).not.toBeNull();
        expect(status(container).textContent).toBe("");
        // The shimmer copy is hidden from assistive tech
        expect(container.querySelector(".ui-st__shine")!.getAttribute("aria-hidden")).toBe("true");
      });
    });
  });
}
