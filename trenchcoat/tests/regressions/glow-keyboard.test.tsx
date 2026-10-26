/* glow-keyboard: the demo loop's sleeps and the key-release timeouts outlived an unmount */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as ui from "@illustrations/glow-keyboard";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("glow-keyboard", () => {
  test("unmounting mid-demo leaves no timers pending", async () => {
    const { unmount } = render(<ui.GlowKeyboard />);
    // Past the entry pause and into the typing, where sleeps and key releases are in flight
    for (let t = 0; t < 3000; t += 16) {
      await act(async () => {
        vi.advanceTimersByTime(16);
      });
    }
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
