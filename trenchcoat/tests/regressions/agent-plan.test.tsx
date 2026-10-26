/* agent-plan: Phase 3 contract – controllable steps, async run/retry, pure clock, IME-safe Enter */
import { Profiler } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/agent-plan";
import * as clean from "@components/agent-plan-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const steps = [
  { id: "a", title: "Search the docs" },
  { id: "b", title: "Write the answer" },
];
const names = (c: HTMLElement) => [...c.querySelectorAll(".ui-pl__name")].map((el) => el.textContent);

for (const [style, ui] of styles) {
  describe(`agent-plan ${style}`, () => {
    test("uncontrolled steps change and report; controlled ones only report", () => {
      const onChange = vi.fn();
      const { container, rerender } = render(<ui.AgentPlan defaultSteps={steps} onChange={onChange} />);
      fireEvent.click(screen.getByRole("button", { name: /Remove step 2/ }));
      // Removal collapses the row first; without layout (jsdom) it may drop at once or after a timer
      expect(onChange.mock.calls.length + (container.querySelector("[data-removing]") ? 1 : 0)).toBeGreaterThan(0);

      const onControlled = vi.fn();
      rerender(<ui.AgentPlan key="c" steps={steps} onChange={onControlled} />);
      const input = screen.getByPlaceholderText("Add step");
      fireEvent.change(input, { target: { value: "Check sources" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onControlled).toHaveBeenCalledWith([...steps, expect.objectContaining({ title: "Check sources" })]);
      expect(names(container)).toEqual(["Search the docs", "Write the answer"]);
    });

    test("Enter while composing (IME) does not add a step", () => {
      const onChange = vi.fn();
      render(<ui.AgentPlan defaultSteps={steps} onChange={onChange} />);
      const input = screen.getByPlaceholderText("Add step");
      fireEvent.change(input, { target: { value: "かな" } });
      fireEvent.keyDown(input, { key: "Enter", isComposing: true });
      expect(onChange).not.toHaveBeenCalled();
    });

    test("an async run waits, and a rejection says so", async () => {
      let fail: (e: Error) => void = () => {};
      const onRun = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
      render(<ui.AgentPlan defaultSteps={steps} onRun={onRun} />);
      const run = screen.getByRole("button", { name: /Run plan/ });
      fireEvent.click(run);
      expect(run).toHaveProperty("disabled", true);
      await act(async () => fail(new Error("offline")));
      expect(run).toHaveProperty("disabled", false);
      expect(screen.getByRole("alert").textContent).toMatch(/try again/);
    });

    test("an async retry waits and recovers", async () => {
      let fail: (e: Error) => void = () => {};
      const onRetry = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
      const { container } = render(<ui.AgentPlan steps={[{ id: "a", title: "Search", status: "failed" }]} status="running" onRetry={onRetry} />);
      const retry = screen.getByRole("button", { name: /Retry from here/ });
      fireEvent.click(retry);
      expect(retry).toHaveProperty("disabled", true);
      await act(async () => fail(new Error("offline")));
      expect(retry).toHaveProperty("disabled", false);
      expect(container.querySelector(".ui-pl__error")?.textContent).toMatch(/Couldn't retry/);
    });

    test("the live timer reads the clock after mount, not during render", () => {
      vi.useFakeTimers({ now: 1_000_000 });
      try {
        const { container } = render(<ui.AgentPlan steps={[{ id: "a", title: "Search", status: "active" }]} status="running" />);
        act(() => {
          vi.advanceTimersByTime(2100);
        });
        expect(container.querySelector(".ui-pl__time")?.textContent).toMatch(/2/);
      } finally {
        vi.useRealTimers();
      }
    });

    test("the live timers tick without re-rendering the plan (Phase 4)", () => {
      vi.useFakeTimers({ now: 1_000_000 });
      try {
        let commits = 0;
        const running = [
          { id: "a", title: "Search", status: "done" as const, duration: 1200 },
          { id: "b", title: "Write", status: "active" as const },
        ];
        const { container } = render(
          <Profiler id="plan" onRender={() => commits++}>
            <ui.AgentPlan steps={running} status="running" />
          </Profiler>,
        );
        const before = commits;
        act(() => {
          vi.advanceTimersByTime(3000);
        });
        expect(commits - before).toBe(0);
        expect(container.querySelector(".ui-pl__step[data-step=active] .ui-pl__time")?.textContent).toMatch(/^3\.0s$/);
        expect(container.querySelector(".ui-pl__elapsed")?.textContent).toMatch(/3s/);
      } finally {
        vi.useRealTimers();
      }
    });

    test("a step that finishes shows how long it took, measured live (Phase 4)", () => {
      vi.useFakeTimers({ now: 1_000_000 });
      try {
        const step = (status: "active" | "done") => [{ id: "a", title: "Search", status }];
        const { container, rerender } = render(<ui.AgentPlan steps={step("active")} status="running" />);
        act(() => {
          vi.advanceTimersByTime(2000);
        });
        rerender(<ui.AgentPlan steps={step("done")} status="running" />);
        expect(container.querySelector(".ui-pl__time--done")?.textContent).toMatch(/2\.0s/);
      } finally {
        vi.useRealTimers();
      }
    });
    /* WCAG + design pass */
    test("Move up / Move down buttons reorder with a single pointer (2.5.7)", () => {
      const onChange = vi.fn();
      const { container } = render(<ui.AgentPlan defaultSteps={steps} onChange={onChange} />);
      expect(screen.queryByRole("button", { name: /Move step 1 up/ })).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Move step 1 down: Search the docs" }));
      expect(names(container)).toEqual(["Write the answer", "Search the docs"]);
      expect(onChange).toHaveBeenLastCalledWith([steps[1], steps[0]]);
    });

    test("Run plan swaps the footer: focus moves to the run status, not <body> (2.4.3)", async () => {
      const { container, rerender } = render(<ui.AgentPlan steps={steps} onRun={() => {}} />);
      const run = screen.getByRole("button", { name: /Run plan/ });
      run.focus();
      rerender(<ui.AgentPlan steps={[{ ...steps[0], status: "active" }, steps[1]]} status="running" onRun={() => {}} />);
      await act(async () => {});
      expect(document.activeElement).toBe(container.querySelector(".ui-pl__foot .ui-pl__status"));
    });

    test("styles: primary is flat ink on the action tokens, the add field shows a focus ring, the shimmer is composited", () => {
      render(<ui.AgentPlan defaultSteps={steps} />);
      const sheet = [...document.querySelectorAll("style")].map((x) => x.textContent).join("\n");
      expect(sheet).toMatch(/\.ui-pl__btn--primary\s*{[^}]*background: var\(--tc-action-primary-bg/);
      expect(sheet).toMatch(/\.ui-pl__add:focus-within\s*{\s*outline: var\(--tc-focus-outline/);
      expect(sheet).not.toMatch(/background-position/);
    });
  });
}
