/* thinking-state: the timeline keys on the steps' content (H3) – steps appended while it runs, or after it finished, continue it */
import { Profiler } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/thinking-state";
import * as clean from "@components/thinking-state-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const advance = async (ms: number, step = 100) => {
  for (let t = 0; t < ms; t += step) {
    await act(async () => {
      vi.advanceTimersByTime(step);
    });
  }
};

const A = { kind: "step" as const, label: "Reading the brief" };
const B = { kind: "step" as const, label: "Drafting the plan" };
const C = { kind: "step" as const, label: "Checking the numbers" };

for (const [style, ui] of styles) {
  describe(`thinking-state ${style}`, () => {
    test("an appended step continues the timeline instead of restarting it", async () => {
      const onDone = vi.fn();
      const { rerender } = render(<ui.ThinkingState stepMs={400} onDone={onDone} steps={[A, B]} />);
      await advance(1200);
      expect(screen.getByText(B.label)).toBeTruthy();

      // Streaming: the parent passes a longer array – what was shown stays shown
      rerender(<ui.ThinkingState stepMs={400} onDone={onDone} steps={[A, B, C]} />);
      expect(screen.getByText(A.label)).toBeTruthy();
      expect(screen.getByText(B.label)).toBeTruthy();
      expect(screen.queryByText(C.label)).toBeNull();

      await advance(1500);
      expect(screen.getByText(C.label)).toBeTruthy();
      expect(onDone).toHaveBeenCalled();
      expect(screen.getByText(/^Worked for/)).toBeTruthy();
    });

    test("a different list starts over", async () => {
      const { rerender } = render(<ui.ThinkingState stepMs={400} steps={[A, B]} />);
      await advance(1200);
      rerender(<ui.ThinkingState stepMs={400} steps={[C, B]} />);
      // Clean shows the first step from the start; neither shows the second one yet
      expect(screen.queryByText(B.label)).toBeNull();
    });

    // Phase 3: progress and done can come from the parent (stream events) instead of the timeline
    test("controlled progress shows exactly that many steps and the timeline leaves them alone", async () => {
      const { rerender, container } = render(<ui.ThinkingState steps={[A, B, C]} progress={1} />);
      await advance(5000);
      expect(screen.getByText(A.label)).toBeTruthy();
      expect(screen.queryByText(B.label)).toBeNull();
      expect(container.querySelector(".ui-think")!.hasAttribute("data-done")).toBe(false);
      rerender(<ui.ThinkingState steps={[A, B, C]} progress={3} />);
      expect(screen.getByText(C.label)).toBeTruthy();
    });

    test("controlled done finishes when the parent says so and reports the seconds", async () => {
      const onDone = vi.fn();
      const { rerender, container } = render(<ui.ThinkingState steps={[A, B]} stepMs={100} done={false} onDone={onDone} />);
      await advance(3000);
      expect(onDone).not.toHaveBeenCalled();
      expect(screen.getByText(B.label)).toBeTruthy();
      rerender(<ui.ThinkingState steps={[A, B]} stepMs={100} done onDone={onDone} />);
      expect(onDone).toHaveBeenCalledWith(3);
      expect(container.querySelector(".ui-think__title")!.textContent).toBe("Worked for 3s");
    });

    test("the timeline reports each step it reveals", async () => {
      const onProgressChange = vi.fn();
      render(<ui.ThinkingState steps={[A, B]} stepMs={400} onProgressChange={onProgressChange} />);
      await advance(2000);
      expect(onProgressChange).toHaveBeenLastCalledWith(2);
    });

    test("startedAt (epoch ms) sets where the header's timer counts from", async () => {
      vi.setSystemTime(1_000_000);
      const { container } = render(<ui.ThinkingState steps={[A]} progress={1} startedAt={1_000_000 - 65_000} />);
      await advance(300);
      expect(container.querySelector(".ui-think__time")!.textContent).toBe("1m 05s");
    });

    test("open is controllable", () => {
      const onOpenChange = vi.fn();
      const { container } = render(<ui.ThinkingState steps={[A]} open={false} onOpenChange={onOpenChange} />);
      const head = container.querySelector(".ui-think__head")!;
      expect(head.getAttribute("aria-expanded")).toBe("false");
      act(() => (head as HTMLButtonElement).click());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(head.getAttribute("aria-expanded")).toBe("false");
    });
  });
}

/* Phase 4 – the header's timer ticks in the DOM; the panel commits only when a step appears or it finishes */
for (const [style, ui] of styles) {
  const { ThinkingState } = ui;
  test(`thinking-state (${style}): the live timer doesn't re-render`, async () => {
    let commits = 0;
    const { container } = render(
      <Profiler id="t" onRender={() => commits++}>
        <ThinkingState steps={[A]} progress={1} />
      </Profiler>,
    );
    await advance(100);
    const before = commits;
    await advance(3000, 250);
    expect(container.querySelector('[class*="__time"]')!.textContent).toBe("3s");
    expect(commits).toBe(before);
  });
}

/* WCAG fix pass: folded steps stayed focusable (S6), the whole list was live and the header's name held a ticking
   timer (S7), `loop` restarted forever (2.2.2) and the source tooltip couldn't be dismissed (1.4.13) */
for (const [style, ui] of styles) {
  describe(`thinking-state ${style} – folding, announcing, looping`, () => {
    const SEARCH = { kind: "search" as const, label: "Searched the web", sources: [{ label: "Docs", href: "https://example.com/docs" }] };

    test("folded steps are inert; the header controls them", () => {
      const { container, rerender } = render(<ui.ThinkingState steps={[SEARCH]} progress={1} open={false} />);
      const head = container.querySelector<HTMLButtonElement>("button[aria-expanded]")!;
      const body = document.getElementById(head.getAttribute("aria-controls")!)!;
      expect(body.hasAttribute("inert")).toBe(true);
      rerender(<ui.ThinkingState steps={[SEARCH]} progress={1} open />);
      expect(body.hasAttribute("inert")).toBe(false);
    });

    test("only the outcome is announced, from a region that's there from the start; the timer isn't in the name", async () => {
      const { container } = render(<ui.ThinkingState steps={[A]} stepMs={300} doneLabel="Done" />);
      const region = container.querySelector('[role="status"]')!;
      expect(region.textContent).toBe("");
      expect(container.querySelector("ol")!.hasAttribute("aria-live")).toBe(false);
      expect(container.querySelector('[class*="__time"]')!.getAttribute("aria-hidden")).toBe("true");
      await advance(2000);
      expect(container.querySelector('[role="status"]')!.textContent).toMatch(/^Done\. Worked for \d+s$/);
    });

    test("loop stops by itself after a few runs", async () => {
      const onDone = vi.fn();
      render(<ui.ThinkingState steps={[A]} stepMs={200} loop onDone={onDone} />);
      await advance(30_000, 250);
      expect(onDone).toHaveBeenCalledTimes(3);
    });

    test("loop stays put once focus is inside", async () => {
      const onDone = vi.fn();
      const { container } = render(<ui.ThinkingState steps={[A]} stepMs={200} loop onDone={onDone} />);
      act(() => container.querySelector<HTMLButtonElement>("button")!.focus());
      await advance(15_000, 250);
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    test("Escape hides a source's tooltip without moving focus", () => {
      const { container } = render(<ui.ThinkingState steps={[SEARCH]} progress={1} />);
      const chip = container.querySelector<HTMLAnchorElement>("a")!;
      act(() => chip.focus());
      expect(chip.hasAttribute("data-tip-off")).toBe(false);
      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });
      expect(chip.hasAttribute("data-tip-off")).toBe(true);
      expect(document.activeElement).toBe(chip);
    });
  });
}
