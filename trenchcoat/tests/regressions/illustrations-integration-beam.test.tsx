/*
 * illustrations/integration-beam: the pulse loop ran on in hidden tabs (only off-screen paused it), and coming back
 * fired every queued pulse at once; no className/DOM props/ref on the root.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { IntegrationBeam } from "@illustrations/integration-beam";

let hidden = false;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
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

describe("illustrations/integration-beam", () => {
  test("the loop stops while the tab is hidden and resumes when it's back", async () => {
    render(<IntegrationBeam />);
    await advance(1000);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    hidden = true;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    await advance(100);
    expect(vi.getTimerCount()).toBe(0);
    hidden = false;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });
  test("runs a few sync cycles, then the loop stops until it comes back into view (WCAG 2.2.2)", async () => {
    render(<IntegrationBeam />);
    await advance(30000);
    expect(vi.getTimerCount()).toBe(0);
    hidden = true;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    hidden = false;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });
});
