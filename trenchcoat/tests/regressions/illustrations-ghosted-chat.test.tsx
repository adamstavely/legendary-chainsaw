/*
 * illustrations/ghosted-chat: its CSS loop kept running off screen and in hidden tabs; it announced itself as an image
 * even when decorative (label="" gave an empty name); no className/DOM props/ref on the root.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { GhostedChat } from "@illustrations/ghosted-chat";

let hidden = false;
Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
afterEach(() => {
  hidden = false;
});

describe("illustrations/ghosted-chat", () => {
  test("pauses while the tab is hidden", async () => {
    const { container } = render(<GhostedChat />);
    const root = container.querySelector<HTMLElement>(".ui-gc")!;
    expect(root.hasAttribute("data-paused")).toBe(false);
    hidden = true;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(root.hasAttribute("data-paused")).toBe(true);
    hidden = false;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(root.hasAttribute("data-paused")).toBe(false);
  });

  test("decorative by default, an image when labelled", () => {
    const { container, rerender } = render(<GhostedChat label="" />);
    const root = () => container.querySelector<HTMLElement>(".ui-gc")!;
    expect(root().getAttribute("aria-hidden")).toBe("true");
    expect(root().getAttribute("role")).toBeNull();
    rerender(<GhostedChat label="Nothing scheduled" />);
    expect(root().getAttribute("role")).toBe("img");
    expect(root().getAttribute("aria-hidden")).toBeNull();
  });
  test("the shine moves by transform only and runs a few times, not forever (WCAG 2.2.2)", () => {
    render(<GhostedChat />);
    const css = [...document.querySelectorAll("style")].map((el) => el.textContent).join("\n");
    const shine = css.match(/\.ui-gc-shine \{[^}]*\}/)![0];
    expect(shine).toMatch(/animation: ui-gc-shine [^;]* 3 both/);
    expect(css).not.toMatch(/background-position/);
  });
});
