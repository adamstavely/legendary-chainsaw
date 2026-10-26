/* otp-input: the error flow's clearing timers wiped the code during a later verification – audit theme 10 */
import { Profiler } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/otp-input";
import * as clean from "@components/otp-input-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const advance = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

for (const [style, ui] of styles) {
  describe(`otp-input ${style}`, () => {
    test("an error still clears the code a moment later", async () => {
      const onChange = vi.fn();
      const { container, rerender } = render(<ui.OtpInput defaultValue="123456" onChange={onChange} />);
      rerender(<ui.OtpInput defaultValue="123456" onChange={onChange} status="error" />);
      await advance(1200);
      expect(container.querySelector("input")!.value).toBe("");
      expect(onChange).toHaveBeenLastCalledWith("");
    });

    test("error → verifying within a second keeps the code", async () => {
      const onChange = vi.fn();
      const { container, rerender } = render(<ui.OtpInput defaultValue="123456" onChange={onChange} />);
      rerender(<ui.OtpInput defaultValue="123456" onChange={onChange} status="error" />);
      await advance(300);
      rerender(<ui.OtpInput defaultValue="123456" onChange={onChange} status="verifying" />);
      await advance(1200);
      expect(container.querySelector("input")!.value).toBe("123456");
      expect(onChange).not.toHaveBeenCalled();
    });
  });
}

/* Phase 3 – one API contract: IME composition, form integration, status from onComplete's promise */
for (const [style, ui] of styles) {
  describe(`otp-input ${style} – contract`, () => {
    test("an IME composing doesn't overwrite the code; its full-width digits count once it's done", () => {
      const onChange = vi.fn();
      const { container } = render(<ui.OtpInput onChange={onChange} />);
      const input = container.querySelector("input")!;
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: "１２" } });
      expect(input.value).toBe("１２");
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.change(input, { target: { value: "１２３" } });
      fireEvent.compositionEnd(input);
      expect(onChange).toHaveBeenLastCalledWith("123");
      expect(input.value).toBe("123");
    });

    test("name and required take part in native forms", () => {
      const { container } = render(
        <form>
          <ui.OtpInput name="code" required defaultValue="4821" length={4} />
        </form>,
      );
      const form = container.querySelector("form")!;
      expect(new FormData(form).get("code")).toBe("4821");
      expect(container.querySelector("input")!.required).toBe(true);
    });

    test("without a status prop, the promise from onComplete drives verifying → error → idle", async () => {
      let reject!: () => void;
      let signal!: AbortSignal;
      const onComplete = vi.fn((_code: string, o: { signal: AbortSignal }) => ((signal = o.signal), new Promise((_, r) => (reject = () => r(new Error("no"))))));
      const { container, unmount } = render(<ui.OtpInput length={4} onComplete={onComplete} />);
      const root = container.firstElementChild!;
      fireEvent.change(container.querySelector("input")!, { target: { value: "1234" } });
      expect(onComplete).toHaveBeenCalledWith("1234", expect.anything());
      expect(root.getAttribute("data-status")).toBe("verifying");
      await act(async () => reject());
      expect(root.getAttribute("data-status")).toBe("error");
      await advance(1200);
      expect(container.querySelector("input")!.value).toBe("");
      fireEvent.change(container.querySelector("input")!, { target: { value: "5" } });
      expect(root.getAttribute("data-status")).toBe("idle");
      // A check still running when the field unmounts is aborted
      fireEvent.change(container.querySelector("input")!, { target: { value: "5678" } });
      expect(signal.aborted).toBe(false);
      unmount();
      expect(signal.aborted).toBe(true);
    });
  });
}

/* Phase 4: the resend countdown is written into its text – React renders only when it starts and ends */
for (const [style, ui] of styles) {
  describe(`otp-input ${style} – countdown`, () => {
    test("counts down without a commit per second, then offers Resend code and starts over", async () => {
      const count = { commits: 0 };
      const onResend = vi.fn();
      const view = render(
        <Profiler id="otp" onRender={() => count.commits++}>
          <ui.OtpInput onResend={onResend} resendIn={5} />
        </Profiler>,
      );
      const time = () => view.container.querySelector(".ui-otp__time")?.textContent;
      expect(time()).toBe("0:05");
      count.commits = 0;
      for (let s = 1; s <= 3; s++) await advance(1000);
      expect(time()).toBe("0:02");
      expect(count.commits).toBe(0);
      await advance(2000);
      const button = view.getByRole("button", { name: "Resend code" });
      fireEvent.click(button);
      expect(onResend).toHaveBeenCalledTimes(1);
      expect(time()).toBe("0:05");
      await advance(1000);
      expect(time()).toBe("0:04");
      view.unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });
}

/* WCAG + design pass */
for (const [style, ui] of styles) {
  describe(`otp-input ${style} – WCAG`, () => {
    const css = () => [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");

    test("labelledBy names the field by a visible label, plus the digit count (2.5.3, 3.3.2)", () => {
      const { container } = render(
        <>
          <h2 id="title">Check your phone</h2>
          <ui.OtpInput labelledBy="title" />
        </>,
      );
      const input = container.querySelector("input")!;
      expect(input.hasAttribute("aria-label")).toBe(false);
      const ids = input.getAttribute("aria-labelledby")!.split(" ");
      expect(ids[0]).toBe("title");
      expect(document.getElementById(ids[1])!.textContent).toBe("6 digits");
    });

    test("a second identical error is announced again (4.1.3)", async () => {
      const { container, rerender } = render(<ui.OtpInput defaultValue="123456" />);
      const live = container.querySelector("[aria-live]")!;
      rerender(<ui.OtpInput defaultValue="123456" status="error" />);
      const first = live.textContent;
      // Retyped and checked again without a "Verifying" step in between: the same text would be no change
      rerender(<ui.OtpInput defaultValue="123456" status="idle" />);
      rerender(<ui.OtpInput defaultValue="123456" status="error" />);
      expect(live.textContent!.trim()).toBe(first!.trim());
      expect(live.textContent).not.toBe(first);
      await advance(1200);
    });

    test("focus stays visible while verifying, boxes have a ≥3:1 field edge, one breakpoint for both looks (2.4.7, 1.4.11)", () => {
      render(<ui.OtpInput />);
      expect(css()).toMatch(/\[data-status="verifying"\][^{]*\.ui-otp__slots:has\(\.ui-otp__input:focus-visible\)\s*\{\s*outline:/);
      expect(css()).toMatch(/\.ui-otp__box \{[^}]*box-shadow: var\(--tc-field-shadow/);
      expect(css()).not.toContain("max-width: 340px");
      // The caret stops blinking after a few cycles (2.2.2)
      expect(css()).not.toMatch(/ui-otp-blink[^;]*infinite/);
    });
  });
}
