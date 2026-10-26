/*
 * model-wheel: the auto-turn kept scheduling turns in a hidden tab (only the IntersectionObserver was heard), and a
 * new but equal `models` array (e.g. an inline literal) restarted the drum, snapping it back to the first model.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ModelWheel, defaultModels } from "@illustrations/model-wheel";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const advance = async (ms: number) => {
  for (let t = 0; t < ms; t += 16) {
    await act(async () => {
      vi.advanceTimersByTime(16);
    });
  }
};
const activeName = (root: Element) => root.querySelector(".ui-mw-row[data-active]")?.textContent;

test("an equal models array doesn't restart the drum", async () => {
  const { container, rerender } = render(<ModelWheel models={defaultModels} />);
  await advance(4000); // one hold, then the spring settles on the next model
  const turned = activeName(container);
  expect(turned).not.toBe(defaultModels[0].name);
  rerender(<ModelWheel models={[...defaultModels]} />);
  await advance(16);
  expect(activeName(container)).toBe(turned);
});

test("a hidden tab stops the auto-turn, and it goes on when the tab is back", async () => {
  render(<ModelWheel />);
  await advance(100); // the observer reports the wheel in view
  const hidden = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  try {
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    hidden.mockRestore();
  }
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(vi.getTimerCount()).toBeGreaterThan(0);
});

/*
 * WCAG pass: the drum turned on its own forever (2.2.2) – it now rests after `turns` automatic turns (default: once
 * round the drum). The rows two and three out faded through opacity to 2.8 : 1 and 1.6 : 1 (1.4.3); they now keep
 * their text colour and fade only through the drum's mask.
 */
describe("finite turning and legible rows", () => {
  class VisibleObserver {
    constructor(private callback: IntersectionObserverCallback) {}
    observe() {
      this.callback([{ isIntersecting: true } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  beforeEach(() => vi.stubGlobal("IntersectionObserver", VisibleObserver));
  afterEach(() => vi.unstubAllGlobals());

  const activeIndex = (root: Element) => [...root.querySelectorAll(".ui-mw-row")].findIndex((r) => r.hasAttribute("data-active"));

  test("it rests after the given number of automatic turns", () => {
    const n = defaultModels.length;
    const { container } = render(<ModelWheel hold={200} turns={2} />);
    act(() => vi.advanceTimersByTime(20_000));
    // Each turn rolls the model above into the middle
    expect(activeIndex(container)).toBe(n - 2);
    act(() => vi.advanceTimersByTime(20_000));
    expect(activeIndex(container)).toBe(n - 2);
  });

  test("by default it goes once round the drum and stops on the first model", () => {
    const { container } = render(<ModelWheel hold={200} />);
    act(() => vi.advanceTimersByTime(60_000));
    expect(activeIndex(container)).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("rows up to three out keep full opacity; the fourth is gone", () => {
    const { container } = render(<ModelWheel />);
    const rows = [...container.querySelectorAll<HTMLElement>(".ui-mw-row")];
    const n = rows.length;
    expect([1, 2, 3, n - 1, n - 2, n - 3].map((i) => rows[i].style.opacity)).toEqual(["1", "1", "1", "1", "1", "1"]);
    expect(rows[4].style.opacity).toBe("0");
  });
});
