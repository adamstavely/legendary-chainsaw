/*
 * message-actions: "Copied" showed before (and regardless of whether) the clipboard write succeeded, and
 * Read aloud only animated when uncontrolled – nothing was read.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/message-actions";
import * as clean from "@components/message-actions-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const g = globalThis as Record<string, unknown>;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete g.SpeechSynthesisUtterance;
  delete (window as { speechSynthesis?: unknown }).speechSynthesis;
});

const advance = async (ms: number, step = 100) => {
  for (let t = 0; t < ms; t += step) {
    await act(async () => {
      vi.advanceTimersByTime(step);
    });
  }
};

const warnings = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([m]) => String(m).startsWith("MessageActions:"));

/** A minimal speechSynthesis that records what it was asked to say */
const installSpeech = () => {
  const said: { text: string; onend: (() => void) | null }[] = [];
  g.SpeechSynthesisUtterance = class {
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
  };
  (window as { speechSynthesis?: unknown }).speechSynthesis = {
    speak: (u: { text: string; onend: (() => void) | null }) => said.push(u),
    cancel: vi.fn(),
  };
  return said;
};

for (const [style, ui] of styles) {
  const { MessageActions } = ui;

  describe(`message-actions (${style})`, () => {
    // Runs first: the warning is once per page, so a later test would find it already spent
    test("simulated read aloud: silent with demo, otherwise one warning", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { unmount } = render(<MessageActions text="Hello there" demo />);
      fireEvent.click(screen.getByRole("button", { name: "Read aloud" }));
      expect(warnings(warn)).toHaveLength(0);
      unmount();

      render(
        <>
          <MessageActions text="Hello there" />
          <MessageActions text="Hello there" />
        </>,
      );
      for (const b of screen.getAllByRole("button", { name: "Read aloud" })) fireEvent.click(b);
      expect(warnings(warn)).toHaveLength(1);
    });

    test("uncontrolled Read aloud uses the browser's speech synthesis and stops with it", async () => {
      const said = installSpeech();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<MessageActions text="Hello there" speakDuration={500} />);
      fireEvent.click(screen.getByRole("button", { name: "Read aloud" }));
      expect(said.map((u) => u.text)).toEqual(["Hello there"]);
      // Not the estimated duration: it plays until the speech ends
      await advance(1000);
      expect(screen.getByRole("button", { name: "Stop reading" })).toBeTruthy();
      act(() => said[0].onend?.());
      expect(screen.getByRole("button", { name: "Read aloud" })).toBeTruthy();
      expect(warnings(warn)).toHaveLength(0);
    });

    test("Copied shows only after the clipboard write resolves", async () => {
      let resolve!: () => void;
      vi.spyOn(navigator.clipboard, "writeText").mockImplementation(() => new Promise<void>((r) => (resolve = r)));
      const onCopy = vi.fn();
      render(<MessageActions text="Hello there" onCopy={onCopy} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
      await advance(100);
      expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
      expect(onCopy).not.toHaveBeenCalled();
      await act(async () => resolve());
      expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
      expect(onCopy).toHaveBeenCalledWith("Hello there");
    });

    test("a failed clipboard write shows no Copied and doesn't call onCopy", async () => {
      vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
      const onCopy = vi.fn();
      render(<MessageActions text="Hello there" onCopy={onCopy} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
      await advance(100);
      expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
      expect(screen.getByRole("button", { name: "Couldn't copy" })).toBeTruthy();
      expect(onCopy).not.toHaveBeenCalled();
    });

    // Phase 3: one API contract
    test("feedback is controllable: a thumb is reported, not applied, while controlled", () => {
      const onFeedback = vi.fn();
      const { rerender } = render(<MessageActions text="Hi" feedback={null} onFeedback={onFeedback} />);
      fireEvent.click(screen.getByRole("button", { name: "Good response" }));
      expect(onFeedback).toHaveBeenCalledWith("up");
      expect(screen.getByRole("button", { name: "Good response" }).getAttribute("aria-pressed")).toBe("false");
      rerender(<MessageActions text="Hi" feedback="up" onFeedback={onFeedback} />);
      expect(screen.getByRole("button", { name: "Good response" }).getAttribute("aria-pressed")).toBe("true");
    });

    test("uncontrolled feedback starts at defaultFeedback", () => {
      render(<MessageActions text="Hi" defaultFeedback="down" />);
      expect(screen.getByRole("button", { name: "Bad response" }).getAttribute("aria-pressed")).toBe("true");
    });

    test("an async onRegenerate keeps the arrow busy until it settles, says so when it fails, and aborts on unmount", async () => {
      let fail!: (e: Error) => void;
      let signal!: AbortSignal;
      const onRegenerate = vi.fn((o: { signal: AbortSignal }) => {
        signal = o.signal;
        return new Promise((_, reject) => (fail = reject));
      });
      const { unmount } = render(<MessageActions text="Hi" onRegenerate={onRegenerate} />);
      const button = () => screen.getByRole("button", { name: "Regenerate response" });
      fireEvent.click(button());
      expect(button().getAttribute("aria-busy")).toBe("true");
      fireEvent.click(button()); // ignored while pending
      expect(onRegenerate).toHaveBeenCalledTimes(1);
      await act(async () => fail(new Error("rate limited")));
      expect(button().hasAttribute("aria-busy")).toBe(false);
      expect(button().parentElement!.querySelector(".ui-ma__tip")!.textContent).toContain("Couldn't regenerate");
      fireEvent.click(button());
      unmount();
      expect(signal.aborted).toBe(true);
    });

    test("an async feedback send shows Thanks only once it resolves, and can be retried after a rejection", async () => {
      const results = [Promise.reject(new Error("offline")), Promise.resolve()];
      results[0].catch(() => {});
      const onFeedback = vi.fn((_kind: unknown, reason?: string) => (reason ? results.shift() : undefined));
      render(<MessageActions text="Hi" onFeedback={onFeedback} />);
      fireEvent.click(screen.getByRole("button", { name: "Bad response" }));
      fireEvent.click(screen.getByRole("button", { name: "Too long" }));
      const sendButton = () => document.querySelector<HTMLButtonElement>(".ui-ma__send")!;
      await act(async () => {
        fireEvent.click(sendButton());
      });
      expect(sendButton().hasAttribute("data-sent")).toBe(false);
      await act(async () => {
        fireEvent.click(sendButton());
      });
      expect(sendButton().hasAttribute("data-sent")).toBe(true);
      expect(onFeedback).toHaveBeenCalledTimes(3);
    });

    test("DOM props and ref reach MessageText's root", () => {
      const ref = { current: null as HTMLDivElement | null };
      const { container } = render(
        <ui.MessageText version={1} ref={ref} id="msg" className="mine">
          Text
        </ui.MessageText>,
      );
      const root = container.querySelector<HTMLElement>(".ui-ma-text")!;
      expect(ref.current).toBe(root);
      expect(root.id).toBe("msg");
      expect(root.classList.contains("mine")).toBe(true);
    });
  });
}

/* WCAG + design pass: focus never drops to <body>, the feedback row waits for the user, tooltips close with Esc */
for (const [style, ui] of styles) {
  const { MessageActions } = ui;

  describe(`message-actions (${style}) – WCAG`, () => {
    const css = () => [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");

    test("the feedback row stays open while focus is inside it after sending, and closes once focus leaves (2.2.1)", async () => {
      render(<MessageActions text="Hi" />);
      fireEvent.click(screen.getByRole("button", { name: "Bad response" }));
      fireEvent.click(screen.getByRole("button", { name: "Too long" }));
      const send = document.querySelector<HTMLButtonElement>(".ui-ma__send")!;
      send.focus();
      fireEvent.click(send);
      await advance(3000);
      const fold = document.getElementById(screen.getByRole("button", { name: "Bad response" }).getAttribute("aria-controls")!)!;
      expect(fold.hasAttribute("data-open")).toBe(true);
      expect(fold.hasAttribute("inert")).toBe(false);
      act(() => screen.getByRole("button", { name: "Copy message" }).focus());
      fireEvent.blur(send, { relatedTarget: screen.getByRole("button", { name: "Copy message" }) });
      expect(fold.hasAttribute("data-open")).toBe(false);
    });

    test("sending from the Other field moves focus to Send instead of <body> (2.4.3)", async () => {
      render(<MessageActions text="Hi" />);
      fireEvent.click(screen.getByRole("button", { name: "Bad response" }));
      fireEvent.click(screen.getByRole("button", { name: "Other" }));
      const field = screen.getByRole("textbox", { name: "What went wrong, in your words" });
      act(() => field.focus());
      fireEvent.change(field, { target: { value: "Wrong API" } });
      await act(async () => {
        fireEvent.keyDown(field, { key: "Enter" });
      });
      expect(document.activeElement).toBe(document.querySelector(".ui-ma__send"));
    });

    test("stepping to the first version moves focus from the disabled ‹ to › (2.4.3)", async () => {
      render(<MessageActions text="Hi" versions={2} />);
      const prev = screen.getByRole("button", { name: "Previous version" });
      act(() => prev.focus());
      await act(async () => {
        fireEvent.click(prev);
      });
      expect(prev).toHaveProperty("disabled", true);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Next version" }));
    });

    test("Esc hides the tooltips without moving focus; the next focus brings them back (1.4.13)", () => {
      const { container } = render(<MessageActions text="Hi" />);
      const root = container.querySelector(".ui-ma")!;
      const copy = screen.getByRole("button", { name: "Copy message" });
      act(() => copy.focus());
      fireEvent.keyDown(copy, { key: "Escape" });
      expect(root.hasAttribute("data-hush")).toBe(true);
      expect(document.activeElement).toBe(copy);
      act(() => screen.getByRole("button", { name: "Regenerate response" }).focus());
      expect(root.hasAttribute("data-hush")).toBe(false);
      // Hoverable: the tips no longer pass the pointer through
      expect(css()).not.toMatch(/\.ui-ma__tip[^}]*pointer-events:\s*none/);
    });

    test("no faded bar, and the Other field has a focus style instead of a bare outline:none (1.4.3, 2.4.7)", () => {
      render(<MessageActions text="Hi" />);
      expect(css()).not.toMatch(/data-quiet\][^{]*\.ui-ma__bar\s*\{\s*opacity:\s*0\.6/);
      expect(css()).toMatch(/\.ui-ma__input:focus\s*\{\s*box-shadow:\s*var\(--tc-field-shadow-focus/);
    });

    test("version arrows are at least 24px wide (2.5.8)", () => {
      render(<MessageActions text="Hi" versions={2} />);
      expect(css()).toMatch(/\.ui-ma__step \{[^}]*width: 24px/);
    });
  });
}
