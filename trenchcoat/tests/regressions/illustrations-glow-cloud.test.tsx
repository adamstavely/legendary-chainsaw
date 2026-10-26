/*
 * illustrations/glow-cloud: with reduced motion, each click started a 1.2 s timeout that wasn't cleared on unmount
 * (or by the next click); it announced itself as an image even when decorative (label="" gave an empty name).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GlowCloud } from "@illustrations/glow-cloud";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("illustrations/glow-cloud", () => {
  test("reduced motion: unmounting right after a click leaves no timers", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: true, media: q }) as MediaQueryList);
    const { container, unmount } = render(<GlowCloud />);
    const root = container.querySelector<HTMLElement>(".ui-glc")!;
    fireEvent.pointerDown(root);
    fireEvent.pointerDown(root);
    await act(async () => vi.advanceTimersByTime(100));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("decorative by default, an image when labelled", () => {
    const { container, rerender } = render(<GlowCloud label="" />);
    const root = () => container.querySelector<HTMLElement>(".ui-glc")!;
    expect(root().getAttribute("aria-hidden")).toBe("true");
    expect(root().getAttribute("role")).toBeNull();
    rerender(<GlowCloud label="Our mascot" />);
    expect(root().getAttribute("role")).toBe("img");
    expect(root().getAttribute("aria-label")).toBe("Our mascot");
    expect(root().getAttribute("aria-hidden")).toBeNull();
  });
  test("idles for a while, then settles and its loop stops; the pointer wakes it (WCAG 2.2.2)", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    let report: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          report = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    try {
      const { container } = render(<GlowCloud />);
      act(() => report([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
      expect(vi.getTimerCount()).toBeGreaterThan(0);
      for (let t = 0; t < 20000; t += 16) await act(async () => vi.advanceTimersByTime(16));
      expect(vi.getTimerCount()).toBe(0);
      fireEvent.pointerMove(container.querySelector(".ui-glc")!, { clientX: 10, clientY: 10 });
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
