/* tilt-card: caller pointer handlers and a reduced-motion switch mid-tilt – Phase 5 (motion) */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TiltCard } from "@motion/tilt-card";

let reduce = false;
const listeners = new Set<() => void>();
const original = window.matchMedia;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  reduce = false;
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
});

describe("tilt-card", () => {
  test("the caller's pointer handlers run alongside the tilt", () => {
    const onPointerMove = vi.fn();
    const onPointerLeave = vi.fn();
    const { container } = render(
      <TiltCard onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        Pro
      </TiltCard>,
    );
    const root = container.querySelector<HTMLElement>(".ui-tlt")!;
    fireEvent.pointerMove(root, { clientX: 10, clientY: 10 });
    expect(onPointerMove).toHaveBeenCalledTimes(1);
    expect(root.querySelector(".ui-tlt-card")!.hasAttribute("data-active")).toBe(true);
    fireEvent.pointerLeave(root);
    expect(onPointerLeave).toHaveBeenCalledTimes(1);
    expect(root.querySelector(".ui-tlt-card")!.hasAttribute("data-active")).toBe(false);
  });

  test("reduced motion turned on mid-tilt drops the tilt and the pending frame", async () => {
    const { container } = render(<TiltCard>Pro</TiltCard>);
    const root = container.querySelector<HTMLElement>(".ui-tlt")!;
    const card = root.querySelector<HTMLElement>(".ui-tlt-card")!;
    fireEvent.pointerMove(root, { clientX: 0, clientY: 0 });
    await act(async () => vi.advanceTimersByTime(16));
    fireEvent.pointerMove(root, { clientX: 5, clientY: 5 });
    expect(vi.getTimerCount()).toBe(1);
    reduce = true;
    await act(async () => listeners.forEach((fn) => fn()));
    expect(vi.getTimerCount()).toBe(0);
    expect(card.style.getPropertyValue("--tc-tilt-card-rx")).toBe("0deg");
    expect(card.style.getPropertyValue("--tc-tilt-card-ry")).toBe("0deg");
  });
});
