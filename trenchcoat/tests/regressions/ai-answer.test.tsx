/* ai-answer: typing re-rendered on every frame; an answer that started out empty never showed later text;
   "Copied" showed even when the clipboard was missing or refused (audit theme 1 and 6) */
import { Profiler, StrictMode, type ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/ai-answer";
import * as clean from "@components/ai-answer-clean";
import type { AIAnswerProps } from "@components/ai-answer";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const FRAME = 16;
const clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard")!;

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] }));
afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(navigator, "clipboard", clipboard);
});

const frames = async (ms: number) => {
  for (let t = 0; t < ms; t += FRAME) {
    await act(async () => {
      vi.advanceTimersByTime(FRAME);
    });
  }
};

const ANSWER = "Checkout fails for EU cards because the payment intent skips the 3DS step when the currency is not USD, so the bank declines it. Moving the check into the confirm call fixes it for every region.";
const words = (s: string) => s.replace(/\s+/g, " ").trim();

for (const [style, ui] of styles) {
  describe(`ai-answer ${style}`, () => {
    const mount = (props: AIAnswerProps) => {
      const count = { commits: 0 };
      const wrap = (p: AIAnswerProps): ReactNode => (
        <StrictMode>
          <Profiler id="answer" onRender={() => count.commits++}>
            <ui.AIAnswer {...p} />
          </Profiler>
        </StrictMode>
      );
      const view = render(wrap(props));
      // Words are rendered ahead of the typing and shown by it (data-on), so only those count
      const text = () =>
        words(Array.from(view.container.querySelectorAll('[class$="__answer"] [data-i][data-on]'), (el) => el.textContent).join(""));
      return { count, view, text, rerender: (p: AIAnswerProps) => view.rerender(wrap(p)) };
    };

    test("typing renders a few words at a time, not on every frame", async () => {
      const { count, text } = mount({ sources: [], answer: ANSWER });
      count.commits = 0;
      // 36 words at the default 38 a second
      await frames(1200);
      expect(text()).toBe(words(ANSWER));
      expect(count.commits).toBeLessThan(1200 / FRAME / 3);
    });

    test("Phase 4: typing one paragraph is written to the DOM – React commits for its start and end, not per batch", async () => {
      const { count, text } = mount({ sources: [], answer: ANSWER });
      count.commits = 0;
      await frames(400);
      const partway = text();
      expect(partway.length).toBeGreaterThan(0);
      expect(partway.length).toBeLessThan(words(ANSWER).length);
      expect(words(ANSWER).startsWith(partway)).toBe(true);
      await frames(800);
      expect(text()).toBe(words(ANSWER));
      expect(count.commits).toBeLessThanOrEqual(6);
    });

    test("an answer that starts out empty shows the text that comes later", async () => {
      const { text, rerender } = mount({ sources: [], answer: "" });
      await frames(500);
      rerender({ sources: [], answer: "Hello brave new world" });
      await frames(1000);
      expect(text()).toBe("Hello brave new world");
      // And again, streamed in pieces
      rerender({ sources: [], answer: "Hello brave new world, and more", streaming: true });
      await frames(300);
      rerender({ sources: [], answer: "Hello brave new world, and more to come", streaming: false });
      await frames(1000);
      expect(text()).toBe("Hello brave new world, and more to come");
    });

    const copy = async (writeText: (() => Promise<void>) | undefined) => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: writeText ? { writeText } : undefined });
      const onCopy = vi.fn();
      mount({ sources: [], answer: "Short answer", onCopy });
      await frames(1000);
      fireEvent.click(screen.getByRole("button", { name: "Copy answer" }));
      await frames(100);
      return { onCopy, copied: screen.queryByRole("button", { name: "Copied" }) !== null };
    };

    test("Copied only once the text is on the clipboard", async () => {
      const ok = await copy(() => Promise.resolve());
      expect(ok.copied).toBe(true);
      expect(ok.onCopy).toHaveBeenCalledWith(expect.stringContaining("Short answer"));
    });

    test("no Copied when the clipboard refuses", async () => {
      const refused = await copy(() => Promise.reject(new Error("NotAllowedError")));
      expect(refused.copied).toBe(false);
      expect(refused.onCopy).not.toHaveBeenCalled();
    });

    test("no Copied without a clipboard", async () => {
      const missing = await copy(undefined);
      expect(missing.copied).toBe(false);
      expect(missing.onCopy).not.toHaveBeenCalled();
    });

    /* Phase 3: feedback is controllable, a failed regenerate is shown */

    test("controlled feedback: a restored verdict survives mount; clicks are reported, not applied", async () => {
      const onFeedbackChange = vi.fn();
      mount({ sources: [], answer: "Short answer", feedback: { value: "up" }, onFeedbackChange });
      await frames(1000);
      expect(screen.getByRole("button", { name: "Good answer" }).getAttribute("aria-pressed")).toBe("true");
      expect(onFeedbackChange).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Bad answer" }));
      expect(onFeedbackChange).toHaveBeenCalledWith({ value: "down" });
      expect(screen.getByRole("button", { name: "Good answer" }).getAttribute("aria-pressed")).toBe("true");
    });

    test("uncontrolled feedback reports the reason, and a regenerated answer clears it", async () => {
      const onFeedbackChange = vi.fn();
      mount({ sources: [], answer: "Short answer", onFeedbackChange, onRegenerate: () => {} });
      await frames(1000);
      fireEvent.click(screen.getByRole("button", { name: "Bad answer" }));
      fireEvent.click(screen.getByRole("button", { name: "Too long" }));
      expect(onFeedbackChange).toHaveBeenLastCalledWith({ value: "down", reason: "Too long" });
      fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
      await frames(100);
      expect(onFeedbackChange).toHaveBeenLastCalledWith(null);
    });

    test("a rejected onRegenerate is shown, and Regenerate can be tried again", async () => {
      const onRegenerate = vi.fn((): Promise<unknown> => Promise.reject(new Error("Model overloaded")));
      mount({ sources: [], answer: "Short answer", onRegenerate });
      await frames(1000);
      fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
      await frames(1000);
      expect(screen.getByRole("alert").textContent).toBe("Couldn't regenerate: Model overloaded");
      onRegenerate.mockImplementation(() => Promise.resolve());
      fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
      await frames(1000);
      // The alert region stays mounted (so a later failure is announced); it's just empty again
      expect(screen.getByRole("alert").textContent).toBe("");
      expect(onRegenerate).toHaveBeenCalledTimes(2);
    });
  });
}

/* WCAG + design pass */
const SOURCES = [
  { title: "Remote work policy", name: "Notion", href: "https://example.com/a", snippet: "Up to 30 days." },
  { title: "Re: Lisbon", name: "Slack", href: "https://example.com/b" },
];

for (const [style, ui] of styles) {
  describe(`ai-answer ${style} – WCAG`, () => {
    const css = () => [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");

    test("the status region is there from mount and announces the result once done (4.1.3)", async () => {
      render(<ui.AIAnswer sources={[]} answer="Short answer" />);
      const region = screen.getByRole("status");
      expect(region.textContent).toBe("");
      await frames(1000);
      expect(screen.getByRole("status")).toBe(region);
      expect(region.textContent).toMatch(/^Answered in /);
    });

    test("a citation chip is named by what it shows, then the titles (2.5.3)", async () => {
      render(<ui.AIAnswer sources={SOURCES} answer="Yes, you can [1][2]." animate={false} />);
      await frames(100);
      const chip = document.querySelector<HTMLButtonElement>(".ui-ans__cite")!;
      expect(chip.hasAttribute("aria-label")).toBe(false);
      expect(chip.textContent!.startsWith("Notion+1")).toBe(true);
      expect(chip.textContent).toContain("Remote work policy; Re: Lisbon");
    });

    test("Esc closes the source preview without moving focus (1.4.13)", async () => {
      render(<ui.AIAnswer sources={SOURCES} answer="Yes [1]." animate={false} />);
      await frames(100);
      const chip = document.querySelector<HTMLButtonElement>(".ui-ans__cite")!;
      fireEvent.mouseEnter(chip);
      expect(screen.getByRole("tooltip")).toBeTruthy();
      act(() => screen.getByRole("button", { name: "Copy answer" }).focus());
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
      expect(screen.queryByRole("tooltip")).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Copy answer" }));
    });

    test("Stop gives way to the actions with focus on Copy, not <body> (2.4.3)", async () => {
      render(<ui.AIAnswer sources={[]} answer={ANSWER} />);
      await frames(100);
      const stop = screen.getByRole("button", { name: "Stop" });
      act(() => stop.focus());
      await act(async () => {
        fireEvent.click(stop);
      });
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Copy answer" }));
    });

    test("the folded reasons are inert; picking one sends focus back to Bad answer (2.4.3, S6)", async () => {
      const { container } = render(<ui.AIAnswer sources={[]} answer="Short answer" />);
      await frames(1000);
      const fold = container.querySelector(".ui-ans__reasons")!;
      expect(fold.hasAttribute("inert")).toBe(true);
      fireEvent.click(screen.getByRole("button", { name: "Bad answer" }));
      expect(fold.hasAttribute("inert")).toBe(false);
      const reason = screen.getByRole("button", { name: "Too long" });
      act(() => reason.focus());
      await act(async () => {
        fireEvent.click(reason);
      });
      expect(fold.hasAttribute("inert")).toBe(true);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Bad answer" }));
    });

    test("caught up while streaming, the writing loop stops instead of spinning every frame (perf)", async () => {
      const { rerender } = render(<ui.AIAnswer sources={[]} answer="Hello there" streaming />);
      await frames(1000);
      const raf = vi.spyOn(window, "requestAnimationFrame");
      await frames(500);
      expect(raf.mock.calls.length).toBeLessThan(3);
      raf.mockRestore();
      rerender(<ui.AIAnswer sources={[]} answer="Hello there, and more" streaming={false} />);
      await frames(1000);
      expect(screen.getByRole("status").textContent).toMatch(/^Answered in /);
    });

    test("the shine moves by transform, the mascot rests, the +N count isn't faded (perf, 2.2.2, 1.4.3)", () => {
      render(<ui.AIAnswer sources={[]} answer="Hi" />);
      expect(css()).not.toContain("background-position");
      expect(css()).not.toMatch(/ui-ans-(look|blink)[^;]*infinite/);
      expect(css()).not.toMatch(/\.ui-ans__more \{[^}]*opacity/);
    });
  });
}
