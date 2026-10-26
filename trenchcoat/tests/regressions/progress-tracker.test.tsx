/* progress-tracker: onChange is reported from the click, not from inside a state updater (once, even under StrictMode).
 * Phase 3: steps/done/autoPlay were read only at mount – `done` is controllable, new step flags win, and autoPlay
 * follows its prop. */
import { StrictMode, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/progress-tracker";
import * as clean from "@components/progress-tracker-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

afterEach(() => vi.restoreAllMocks());

const steps = [
  { id: "a", label: "Connect your inbox", done: true },
  { id: "b", label: "Invite a teammate" },
];

for (const [style, ui] of styles) {
  describe(`progress-tracker ${style}`, () => {
    test("a toggle calls onChange once, and a parent can set state in it", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const onChange = vi.fn();
      function Parent() {
        const [count, setCount] = useState(0);
        return (
          <>
            <output>{count}</output>
            <ui.ProgressTracker
              steps={steps}
              onChange={(s) => {
                onChange(s);
                setCount(s.filter((x) => x.done).length);
              }}
            />
          </>
        );
      }
      render(
        <StrictMode>
          <Parent />
        </StrictMode>,
      );
      fireEvent.click(screen.getByRole("checkbox", { name: "Invite a teammate" }));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.lastCall![0].map((s: { done: boolean }) => s.done)).toEqual([true, true]);
      expect(screen.getByRole("status").textContent).toBe("2");
      fireEvent.click(screen.getByRole("checkbox", { name: "Connect your inbox" }));
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.lastCall![0].map((s: { done: boolean }) => s.done)).toEqual([false, true]);
      expect(error).not.toHaveBeenCalled();
    });

    test("controlled done: clicks are reported, not applied", () => {
      const onDoneChange = vi.fn();
      const { rerender } = render(<ui.ProgressTracker steps={steps} done={[]} onDoneChange={onDoneChange} />);
      fireEvent.click(screen.getByRole("checkbox", { name: "Invite a teammate" }));
      expect(onDoneChange).toHaveBeenCalledWith(["b"]);
      expect(screen.getByRole("checkbox", { name: "Invite a teammate" }).getAttribute("aria-checked")).toBe("false");
      rerender(<ui.ProgressTracker steps={steps} done={["b"]} onDoneChange={onDoneChange} />);
      expect(screen.getByRole("checkbox", { name: "Invite a teammate" }).getAttribute("aria-checked")).toBe("true");
      expect(screen.getByRole("checkbox", { name: "Connect your inbox" }).getAttribute("aria-checked")).toBe("false");
    });

    test("uncontrolled: steps added later render, and changed step flags win over local ticks", () => {
      const { rerender } = render(<ui.ProgressTracker steps={steps} />);
      fireEvent.click(screen.getByRole("checkbox", { name: "Invite a teammate" }));
      rerender(<ui.ProgressTracker steps={[...steps, { id: "c", label: "Ship it" }]} />);
      expect(screen.getByRole("checkbox", { name: "Invite a teammate" }).getAttribute("aria-checked")).toBe("true");
      expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe("2 of 3 done");
      rerender(<ui.ProgressTracker steps={[{ ...steps[0], done: false }, steps[1], { id: "c", label: "Ship it", done: true }]} />);
      expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe("1 of 3 done");
      expect(screen.getByRole("checkbox", { name: "Ship it" }).getAttribute("aria-checked")).toBe("true");
    });

    test("autoPlay switched on after mount starts playing", () => {
      vi.useFakeTimers();
      try {
        const { rerender } = render(<ui.ProgressTracker steps={steps} interval={100} />);
        act(() => vi.advanceTimersByTime(500));
        expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
        rerender(<ui.ProgressTracker steps={steps} interval={100} autoPlay />);
        act(() => vi.advanceTimersByTime(150));
        expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("2");
      } finally {
        vi.useRealTimers();
      }
    });

    const three = [
      { id: "a", label: "One" },
      { id: "b", label: "Two" },
      { id: "c", label: "Three" },
    ];
    const now = () => screen.getByRole("progressbar").getAttribute("aria-valuenow");

    test("WCAG 2.2.2: autoPlay has one Pause / Play button that stops and restarts it and keeps focus", () => {
      vi.useFakeTimers();
      try {
        render(<ui.ProgressTracker steps={three} interval={100} autoPlay />);
        act(() => vi.advanceTimersByTime(150));
        expect(now()).toBe("1");
        const pause = screen.getByRole("button", { name: "Pause auto-play" });
        act(() => pause.focus());
        fireEvent.pointerDown(pause);
        fireEvent.click(pause);
        act(() => vi.advanceTimersByTime(1000));
        expect(now()).toBe("1");
        const play = screen.getByRole("button", { name: "Play auto-play" });
        expect(play).toBe(pause);
        expect(document.activeElement).toBe(play);
        fireEvent.pointerDown(play);
        fireEvent.click(play);
        act(() => vi.advanceTimersByTime(150));
        expect(now()).toBe("2");
      } finally {
        vi.useRealTimers();
      }
    });

    test("no Pause button without autoPlay", () => {
      render(<ui.ProgressTracker steps={three} />);
      expect(screen.queryByRole("button", { name: /auto-play/ })).toBeNull();
    });

    test("reduced motion: autoPlay doesn't tick on its own", () => {
      vi.useFakeTimers();
      const mm = vi.spyOn(window, "matchMedia").mockImplementation(
        (q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
      );
      try {
        render(<ui.ProgressTracker steps={three} interval={100} autoPlay />);
        act(() => vi.advanceTimersByTime(1000));
        expect(now()).toBe("0");
        expect(screen.getByRole("button", { name: "Play auto-play" })).toBeTruthy();
      } finally {
        mm.mockRestore();
        vi.useRealTimers();
      }
    });

    test("1.4.10 / 1.4.11 / performance: labels wrap, the unchecked ring is a control edge, the shine uses transform", () => {
      render(<ui.ProgressTracker steps={three} />);
      const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("");
      expect(css).not.toMatch(/\.ui-progress__label \{[^}]*nowrap/);
      expect(css).toMatch(/ui-progress__check \{[^}]*--tc-border-control/);
      expect(css).not.toMatch(/background-position/);
    });
  });
}
