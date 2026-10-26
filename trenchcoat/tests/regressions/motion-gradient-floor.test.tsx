/* gradient-floor: kept morphing in hidden tabs and ignored reduced motion turned on later – Phase 5 (motion) */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GradientFloor } from "@motion/gradient-floor";

let visibility: DocumentVisibilityState = "visible";
let reduce = false;
const listeners = new Set<() => void>();
const original = window.matchMedia;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
  visibility = "visible";
  reduce = false;
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  window.matchMedia = ((query: string) => ({
    get matches() {
      return reduce && query.includes("reduce");
    },
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  vi.useRealTimers();
  window.matchMedia = original;
  listeners.clear();
  delete (document as { visibilityState?: unknown }).visibilityState;
});

const frames = async (n: number) => {
  for (let i = 0; i < n; i++) await act(async () => vi.advanceTimersByTime(16));
};
const shape = (root: HTMLElement) => root.querySelector("path")!.getAttribute("d");

describe("gradient-floor", () => {
  test("a hidden tab pauses the morph and the drift; showing it resumes", async () => {
    const { container } = render(<GradientFloor />);
    const root = container.querySelector<HTMLElement>(".ui-gf")!;
    await frames(10);
    expect(vi.getTimerCount(), "morphing").toBe(1);

    visibility = "hidden";
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
    expect(root.hasAttribute("data-paused")).toBe(true);
    expect(vi.getTimerCount(), "no frame loop while hidden").toBe(0);

    visibility = "visible";
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
    expect(root.hasAttribute("data-paused")).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
  });

  test("turning on reduced motion while it runs stops the morph and rests on the first shape", async () => {
    const { container } = render(<GradientFloor />);
    const rest = shape(container);
    await frames(30);
    expect(shape(container)).not.toBe(rest);

    reduce = true;
    await act(async () => listeners.forEach((fn) => fn()));
    expect(vi.getTimerCount()).toBe(0);
    expect(shape(container)).toBe(rest);

    reduce = false;
    await act(async () => listeners.forEach((fn) => fn()));
    expect(vi.getTimerCount(), "morphs again once motion is allowed").toBe(1);
  });

  test("by default it moves for about 5 s, then rests – no frame loop left (2.2.2)", async () => {
    const { container } = render(<GradientFloor />);
    const root = container.querySelector<HTMLElement>(".ui-gf")!;
    expect(root.style.getPropertyValue("--tc-gradient-floor-passes")).toBe("2");
    await frames(10);
    expect(vi.getTimerCount(), "morphing").toBe(1);
    await frames(Math.ceil(5200 / 16));
    expect(vi.getTimerCount(), "at rest").toBe(0);
    const rest = shape(container);
    await frames(20);
    expect(shape(container)).toBe(rest);
  });

  test("time off screen doesn't count: the rest of the run plays when it comes back", async () => {
    const { container } = render(<GradientFloor playFor={2.5} />);
    await frames(60);
    visibility = "hidden";
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
    await act(async () => vi.advanceTimersByTime(10000));
    visibility = "visible";
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
    expect(vi.getTimerCount(), "still has motion left").toBe(1);
    await frames(Math.ceil(2600 / 16));
    expect(vi.getTimerCount()).toBe(0);
    expect(container.querySelector<HTMLElement>(".ui-gf")!.style.getPropertyValue("--tc-gradient-floor-passes")).toBe("1");
  });

  test("playFor={Infinity} keeps it going, and the drift loops endlessly", async () => {
    const { container } = render(<GradientFloor playFor={Infinity} />);
    await frames(Math.ceil(8000 / 16));
    expect(vi.getTimerCount()).toBe(1);
    expect(container.querySelector<HTMLElement>(".ui-gf")!.style.getPropertyValue("--tc-gradient-floor-passes")).toBe("infinite");
  });
});
