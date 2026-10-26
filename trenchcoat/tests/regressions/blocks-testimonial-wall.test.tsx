/*
 * blocks/testimonial-wall (WCAG 2.2.2): the columns scroll for as long as the wall is on screen, with only hover /
 * focus per column to stop them. A Pause / Play button (a library Button, first in the tab order) now stops the
 * whole wall for good, and a stop settles to a real standstill.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TestimonialWall } from "@blocks/testimonial-wall";

const items = Array.from({ length: 6 }, (_, i) => ({ quote: `Quote ${i}`, name: `Person ${i}` }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"] });
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const h = this.classList.contains("ui-twl__set") ? 400 : 600;
    return { width: 300, height: h, top: 0, left: 0, right: 300, bottom: h, x: 0, y: 0, toJSON() {} } as DOMRect;
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const transforms = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>(".ui-twl__track")].map((t) => t.style.transform).join("|");
const run = async (ms: number) => {
  for (let t = 0; t < ms; t += 16) await act(async () => vi.advanceTimersByTime(16));
};

describe("blocks/testimonial-wall", () => {
  test("a Pause button comes first and stops every column; Play starts them again", async () => {
    const onPausedChange = vi.fn();
    const { container } = render(<TestimonialWall items={items} onPausedChange={onPausedChange} />);
    const button = screen.getByRole("button", { name: "Pause testimonials" });
    expect(button.classList.contains("ui-button")).toBe(true);
    const card = container.querySelector<HTMLElement>(".ui-twl__card[tabindex='0']")!;
    expect(button.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await run(500);
    const moving = transforms(container);
    await run(200);
    expect(transforms(container)).not.toBe(moving);

    fireEvent.click(button);
    expect(onPausedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Play testimonials" })).toBe(button);
    await run(3000);
    const stopped = transforms(container);
    await run(1000);
    expect(transforms(container)).toBe(stopped);

    fireEvent.click(button);
    await run(1000);
    expect(transforms(container)).not.toBe(stopped);
  });

  test("starts paused with defaultPaused; reduced motion has no button", async () => {
    const { container, unmount } = render(<TestimonialWall items={items} defaultPaused />);
    expect(screen.getByRole("button", { name: "Play testimonials" })).toBeTruthy();
    await run(300);
    const still = transforms(container);
    await run(500);
    expect(transforms(container)).toBe(still);
    unmount();

    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
    render(<TestimonialWall items={items} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
