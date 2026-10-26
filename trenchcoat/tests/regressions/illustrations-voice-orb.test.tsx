/*
 * voice-orb: a tab coming back to the front restarted the drawing loop even while the orb was scrolled out of view
 * (the visibility handler ignored the IntersectionObserver's last report).
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { VoiceOrb } from "@illustrations/voice-orb";

class ManualObserver {
  static last: ManualObserver | null = null;
  constructor(private callback: IntersectionObserverCallback) {
    ManualObserver.last = this;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  report(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

// A 2D context that accepts every call – jsdom has none
const fakeContext = new Proxy({}, { get: (_t, key) => (key === "createRadialGradient" ? () => ({ addColorStop() {} }) : () => {}) });
const getContext = HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", ManualObserver);
  HTMLCanvasElement.prototype.getContext = (() => fakeContext) as unknown as typeof getContext;
});
afterEach(() => {
  HTMLCanvasElement.prototype.getContext = getContext;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("an orb scrolled out of view stays stopped when the tab comes back", () => {
  const { container } = render(<VoiceOrb />);
  act(() => vi.advanceTimersByTime(100));
  expect(vi.getTimerCount(), "drawing while on screen").toBeGreaterThan(0);
  act(() => ManualObserver.last!.report(false));
  act(() => vi.advanceTimersByTime(100));
  expect(vi.getTimerCount(), "stopped off screen").toBe(0);
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  act(() => vi.advanceTimersByTime(100));
  expect(vi.getTimerCount(), "still stopped after the tab comes back").toBe(0);
  expect(container.firstElementChild!.hasAttribute("data-paused")).toBe(true);
  act(() => ManualObserver.last!.report(true));
  expect(vi.getTimerCount(), "runs again once in view").toBeGreaterThan(0);
  expect(container.firstElementChild!.hasAttribute("data-paused")).toBe(false);
});

/*
 * WCAG / themes pass: the orb read its ink once at mount (and every 30 frames), so with reduced motion – no loop –
 * a live theme switch left it near-black on a dark page. It now reads its colours again when a theme attribute
 * changes on an ancestor (or the OS setting) and redraws the still frame. Idle, it rests after a few seconds (2.2.2).
 */
const reduceMotion = () =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));

test("a theme switch on an ancestor redraws the still frame in the new ink", async () => {
  reduceMotion();
  const fills: string[] = [];
  const recording = new Proxy(
    {},
    {
      get: (_t, key) => (key === "createRadialGradient" ? () => ({ addColorStop() {} }) : () => {}),
      set: (_t, key, value) => {
        if (key === "fillStyle" && typeof value === "string") fills.push(value);
        return true;
      },
    },
  );
  HTMLCanvasElement.prototype.getContext = (() => recording) as unknown as typeof getContext;
  const page = document.createElement("div");
  // jsdom resolves neither light-dark() nor inherit, so the test gives the canvas a plain ink per theme. jsdom lets
  // the stylesheet inserted last win, so the orb's own (hoisted, kept after unmount) goes in first
  render(<VoiceOrb />).unmount();
  fills.length = 0;
  const plain = document.createElement("style");
  plain.textContent =
    ".ui-vo .ui-vo__canvas { color: rgb(23, 23, 23); } [data-tc-theme='dark'] .ui-vo .ui-vo__canvas { color: rgb(237, 237, 237); }";
  document.head.append(plain);
  document.body.append(page);
  try {
    render(<VoiceOrb />, { container: page });
    act(() => vi.advanceTimersByTime(100));
    expect(fills.some((f) => f.startsWith("rgba(23, 23, 23"))).toBe(true);
    fills.length = 0;
    await act(async () => {
      page.setAttribute("data-tc-theme", "dark");
      // MutationObserver records arrive in a microtask
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });
    expect(fills.length, "redrawn without a running loop").toBeGreaterThan(0);
    expect(fills.every((f) => !f.startsWith("rgba(23, 23, 23"))).toBe(true);
    expect(fills.some((f) => f.startsWith("rgba(237, 237, 237"))).toBe(true);
  } finally {
    page.remove();
    plain.remove();
  }
});

test("idle, the loop rests after a few seconds and a new state wakes it", () => {
  const { rerender } = render(<VoiceOrb />);
  act(() => vi.advanceTimersByTime(1000));
  expect(vi.getTimerCount(), "breathing").toBeGreaterThan(0);
  act(() => vi.advanceTimersByTime(12_000));
  expect(vi.getTimerCount(), "resting").toBe(0);
  rerender(<VoiceOrb state="listening" />);
  act(() => vi.advanceTimersByTime(100));
  expect(vi.getTimerCount(), "awake again").toBeGreaterThan(0);
});
