/*
 * illustrations/glow-keyboard: the typing demo kept typing in hidden tabs and off screen (only the floor paused);
 * Enter during IME composition sent the half-composed prompt; no className/DOM props/ref on the root.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GlowKeyboard } from "@illustrations/glow-keyboard";

let hidden = false;
beforeEach(() => {
  vi.useFakeTimers();
  hidden = false;
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
});
afterEach(() => {
  vi.useRealTimers();
  // @ts-expect-error – drop the own-property override, back to jsdom's getter
  delete document.visibilityState;
});
const advance = async (ms: number) => {
  for (let t = 0; t < ms; t += 16) await act(async () => vi.advanceTimersByTime(16));
};
const setHidden = async (h: boolean) => {
  hidden = h;
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
};

describe("illustrations/glow-keyboard", () => {
  test("the demo stops typing while the tab is hidden and carries on when it's back", async () => {
    const { container } = render(<GlowKeyboard prompts={["Find a quiet hike near Zermatt"]} />);
    const input = container.querySelector("input")!;
    await advance(3000);
    const typed = input.value;
    expect(typed.length).toBeGreaterThan(0);
    await setHidden(true);
    expect(container.querySelector(".ui-gk")!.hasAttribute("data-paused")).toBe(true);
    await advance(3000);
    // At most the keystroke already under way lands
    expect(input.value.length).toBeLessThanOrEqual(typed.length + 1);
    const held = input.value;
    await setHidden(false);
    await advance(2000);
    expect(input.value.length).toBeGreaterThan(held.length);
  });

  test("Enter while composing (IME) doesn't send", () => {
    const onSubmit = vi.fn();
    const { container } = render(<GlowKeyboard onSubmit={onSubmit} />);
    const input = container.querySelector("input")!;
    fireEvent.focus(input);
    input.value = "にほ";
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("にほ");
  });
  test("types each prompt once, then the scene rests and the loop stops (WCAG 2.2.2)", async () => {
    const { container } = render(<GlowKeyboard prompts={["Hi"]} />);
    await advance(12000);
    const root = container.querySelector(".ui-gk")!;
    expect(root.hasAttribute("data-resting")).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("the input pill shows a focus ring (the bare input's outline is replaced, WCAG 2.4.7)", () => {
    render(<GlowKeyboard />);
    // React hoists the component's <style> into <head>
    const css = [...document.querySelectorAll("style")].map((el) => el.textContent).join("\n");
    expect(css).toMatch(/\.ui-gk-input:focus-within \{\s*outline: var\(--tc-focus-outline/);
  });
});
