/*
 * blocks/logo-marquee (WCAG 2.2.2): the strip moves for as long as it is on screen, with only hover / focus to stop
 * it. It now has a Pause / Play button (a library Button, first in the tab order) that stops it for good, and a
 * stop settles to a real standstill. Brand names (text) moved off --tc-icon-muted (1.4.3).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LogoMarquee } from "@blocks/logo-marquee";

const logos = [{ name: "Orbitly", href: "#o" }, { name: "Quanta", href: "#q" }, { name: "Lumen" }];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"] });
  // One set is 300 px wide, so the loop has a wrap distance (jsdom has no layout)
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const w = this.classList.contains("ui-lm__set") ? 300 : 600;
    return { width: w, height: 40, top: 0, left: 0, right: w, bottom: 40, x: 0, y: 0, toJSON() {} } as DOMRect;
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const transform = (c: HTMLElement) => (c.querySelector(".ui-lm__track") as HTMLElement).style.transform;
const run = async (ms: number) => {
  for (let t = 0; t < ms; t += 16) await act(async () => vi.advanceTimersByTime(16));
};

describe("blocks/logo-marquee", () => {
  test("a Pause button comes first and stops the strip for good; Play starts it again", async () => {
    const onPausedChange = vi.fn();
    const { container } = render(<LogoMarquee logos={logos} label="Customers" onPausedChange={onPausedChange} />);
    const button = screen.getByRole("button", { name: "Pause logos" });
    expect(button.classList.contains("ui-button")).toBe(true);
    // Before the links in the tab order
    const link = screen.getAllByRole("link")[0];
    expect(button.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await run(500);
    const moving = transform(container);
    await run(200);
    expect(transform(container)).not.toBe(moving);

    fireEvent.click(button);
    expect(onPausedChange).toHaveBeenCalledWith(true);
    // Same element, new name – focus stays put
    expect(screen.getByRole("button", { name: "Play logos" })).toBe(button);
    await run(3000);
    const stopped = transform(container);
    await run(1000);
    expect(transform(container)).toBe(stopped);

    fireEvent.click(button);
    expect(onPausedChange).toHaveBeenLastCalledWith(false);
    await run(1000);
    expect(transform(container)).not.toBe(stopped);
  });

  test("paused can be controlled, and the button can be left out", async () => {
    const { container, rerender } = render(<LogoMarquee logos={logos} paused onPausedChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Play logos" })).toBeTruthy();
    await run(500);
    const still = transform(container);
    await run(500);
    expect(transform(container)).toBe(still);
    rerender(<LogoMarquee logos={logos} pauseButton={false} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("reduced motion: nothing moves, so there is no Pause button", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
    render(<LogoMarquee logos={logos} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
