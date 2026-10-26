/*
 * illustrations/empty-calendar: its CSS loop kept running off screen and in hidden tabs; it announced itself as an image
 * even when decorative (label="" gave an empty name); no className/DOM props/ref on the root.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { EmptyCalendar } from "@illustrations/empty-calendar";

let hidden = false;
Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
afterEach(() => {
  hidden = false;
});

describe("illustrations/empty-calendar", () => {
  test("pauses while the tab is hidden", async () => {
    const { container } = render(<EmptyCalendar />);
    const root = container.querySelector<HTMLElement>(".ui-ec")!;
    expect(root.hasAttribute("data-paused")).toBe(false);
    hidden = true;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(root.hasAttribute("data-paused")).toBe(true);
    hidden = false;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(root.hasAttribute("data-paused")).toBe(false);
  });

  test("decorative by default, an image when labelled", () => {
    const { container, rerender } = render(<EmptyCalendar label="" />);
    const root = () => container.querySelector<HTMLElement>(".ui-ec")!;
    expect(root().getAttribute("aria-hidden")).toBe("true");
    expect(root().getAttribute("role")).toBeNull();
    rerender(<EmptyCalendar label="Nothing scheduled" />);
    expect(root().getAttribute("role")).toBe("img");
    expect(root().getAttribute("aria-hidden")).toBeNull();
  });
});
