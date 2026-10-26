/*
 * Phase 3 thinking-loader: the clock was read during render (Date.now() in a state initialiser and in the render
 * that turned done on). Now it's read in effects only; `startedAt` (epoch ms) can set the start, and the phase
 * follows the controllable contract (phase / defaultPhase / onPhaseChange).
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/thinking-loader";
import * as clean from "@components/thinking-loader-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers({ now: 1_000_000 }));
afterEach(() => vi.useRealTimers());

const label = (c: HTMLElement) => c.querySelector(".ui-tl__label:not(.ui-tl__label--out)")!.textContent;

for (const [style, ui] of styles) {
  const { ThinkingLoader } = ui;

  describe(`thinking-loader (${style})`, () => {
    test("the done label counts the seconds since mount, and the first paint of done already shows it", () => {
      const { container, rerender } = render(<ThinkingLoader />);
      act(() => {
        vi.advanceTimersByTime(6000);
      });
      rerender(<ThinkingLoader done />);
      expect(label(container)).toBe("Thought for 6s");
      // Only one swap: the phase label rolls out, no intermediate done label
      expect(container.querySelector(".ui-tl__label--out")!.textContent).not.toMatch(/Thought/);
    });

    test("startedAt (epoch ms) sets where the count starts", () => {
      const { container } = render(<ThinkingLoader done startedAt={1_000_000 - 12_000} />);
      expect(label(container)).toBe("Thought for 12s");
    });

    test("restarting work starts the clock and the phases over", () => {
      const { container, rerender } = render(<ThinkingLoader done />);
      rerender(<ThinkingLoader />);
      expect(label(container)).toBe("Thinking");
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      rerender(<ThinkingLoader done />);
      expect(label(container)).toBe("Thought for 3s");
    });

    test("the timer reports each phase; defaultPhase sets where it starts", () => {
      const onPhaseChange = vi.fn();
      const { container } = render(<ThinkingLoader defaultPhase={1} interval={1000} onPhaseChange={onPhaseChange} />);
      expect(label(container)).toBe("Searching the web");
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onPhaseChange).toHaveBeenCalledWith(2);
      expect(label(container)).toBe("Reading sources");
    });

    test("a controlled phase doesn't advance on the timer", () => {
      const onPhaseChange = vi.fn();
      const { container } = render(<ThinkingLoader phase={0} interval={1000} onPhaseChange={onPhaseChange} />);
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(label(container)).toBe("Thinking");
      expect(onPhaseChange).not.toHaveBeenCalled();
    });
    /* WCAG + design pass */
    test("loop starts over at most twice, then holds the last phase (2.2.2)", () => {
      const { container } = render(<ThinkingLoader phases={["A", "B"]} interval={100} loop />);
      const seen: string[] = [];
      for (let i = 0; i < 12; i++) {
        act(() => vi.advanceTimersByTime(100));
        seen.push(label(container)!);
      }
      expect(seen.join("")).toBe("BABABBBBBBBB");
    });

    test("only the first phase and the done label are announced; the rolling label is aria-hidden (4.1.3)", () => {
      const { container, rerender } = render(<ThinkingLoader phases={["Thinking", "Searching"]} interval={100} />);
      const status = container.querySelector('[role="status"]')!;
      const sr = status.querySelector(".ui-tl__sr")!;
      expect(sr.textContent).toBe("Thinking");
      act(() => vi.advanceTimersByTime(100));
      expect(sr.textContent).toBe("Thinking");
      expect(status.querySelector(".ui-tl__text")!.getAttribute("aria-hidden")).toBe("true");
      rerender(<ThinkingLoader phases={["Thinking", "Searching"]} interval={100} done doneLabel="Done" />);
      expect(sr.textContent).toBe("Done");
    });

    test("styles: the sweep animates transform a few times and pauses off-screen; the text box is one line in lh", () => {
      render(<ThinkingLoader />);
      const sheet = [...document.querySelectorAll("style")].map((x) => x.textContent).join("\n");
      expect(sheet).not.toMatch(/background-position/);
      expect(sheet).toMatch(/animation: ui-tl-sweep [^;]* 3 both/);
      expect(sheet).toMatch(/\.ui-tl\[data-offscreen\][^{]*{ animation-play-state: paused/);
      expect(sheet).toMatch(/height: 1lh/);
    });
  });
}
