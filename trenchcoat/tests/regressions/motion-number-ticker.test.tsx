/* number-ticker: render-time ref writes, a commit per count-in, rolls running off screen – Phase 5 (motion) */
import { Profiler } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { NumberTicker } from "@motion/number-ticker";

let visibility: DocumentVisibilityState = "visible";
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
  visibility = "visible";
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
});
afterEach(() => {
  vi.useRealTimers();
  delete (document as { visibilityState?: unknown }).visibilityState;
});

const run = async (ms: number) => {
  for (let t = 0; t < ms; t += 16) await act(async () => vi.advanceTimersByTime(16));
};
const offsets = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(".ui-nt__stack")].map((s) => s.style.transform);
const at = (digits: number[]) => digits.map((d) => `translateY(${(-d / 11) * 100}%)`);

describe("number-ticker", () => {
  test("the count-in and every new value cost one commit each, never one per frame", async () => {
    let commits = 0;
    const ui = (value: number) => (
      <Profiler id="nt" onRender={() => commits++}>
        <NumberTicker value={value} locale="en-US" duration={400} />
      </Profiler>
    );
    const view = render(ui(42));
    await run(1000);
    expect(commits, "mount only – the count-in itself renders nothing").toBe(1);
    expect(offsets(view.container)).toEqual(at([4, 2]));

    view.rerender(ui(57));
    await run(1000);
    expect(commits).toBe(2);
    expect(offsets(view.container)).toEqual(at([5, 7]));
  });

  test("a column that appears later slides in; the others don't", async () => {
    const view = render(<NumberTicker value={99} locale="en-US" duration={200} />);
    await run(500);
    view.rerender(<NumberTicker value={100} locale="en-US" duration={200} />);
    const cols = [...view.container.querySelectorAll(".ui-nt__col")];
    expect(cols.map((c) => c.hasAttribute("data-enter"))).toEqual([true, false, false]);
    await run(500);
    expect(offsets(view.container)).toEqual(at([1, 0, 0]));
  });

  test("in a hidden tab a roll jumps to its end instead of animating", async () => {
    const view = render(<NumberTicker value={10} locale="en-US" duration={900} />);
    await run(1200);
    visibility = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    view.rerender(<NumberTicker value={34} locale="en-US" duration={900} />);
    await act(async () => {});
    expect(offsets(view.container)).toEqual(at([3, 4]));
    expect(vi.getTimerCount(), "no frame loop left running").toBe(0);
  });

  test("hiding the tab mid-roll finishes it", async () => {
    const view = render(<NumberTicker value={10} locale="en-US" duration={900} />);
    await run(1200);
    view.rerender(<NumberTicker value={34} locale="en-US" duration={900} />);
    await run(100);
    visibility = "hidden";
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
    expect(offsets(view.container)).toEqual(at([3, 4]));
    expect(vi.getTimerCount()).toBe(0);
  });

  test("each new value is announced through a polite region on the root, which callers can turn off (4.1.3)", () => {
    const { container } = render(
      <>
        <NumberTicker value={5} locale="en-US" />
        <NumberTicker value={5} locale="en-US" aria-live="off" />
      </>,
    );
    const [a, b] = container.querySelectorAll(".ui-nt");
    expect(a.getAttribute("aria-live")).toBe("polite");
    expect(b.getAttribute("aria-live")).toBe("off");
    expect(a.querySelector(".ui-nt__track")!.getAttribute("aria-hidden")).toBe("true");
  });
});
