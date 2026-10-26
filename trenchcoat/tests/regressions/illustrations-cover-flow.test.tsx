/*
 * illustrations/cover-flow: a controlled `index` was applied on every drag, key and click (and reported for each
 * cover passing by) instead of being asked of the parent; no className/DOM props/ref on the root.
 */
import { useState } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { CoverFlow } from "@illustrations/cover-flow";

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] }));
afterEach(() => vi.useRealTimers());

const items = ["One", "Two", "Three", "Four", "Five"].map((title, i) => ({ id: i, title }));
const front = (c: HTMLElement) => c.querySelector("[data-active]")?.getAttribute("aria-label");
const settle = async () => {
  for (let t = 0; t < 2000; t += 16) await act(async () => vi.advanceTimersByTime(16));
};
const viewport = (c: HTMLElement) => c.querySelector<HTMLElement>(".ui-cf__viewport")!;

describe("illustrations/cover-flow", () => {
  test("controlled: a key press is reported, not applied", async () => {
    const onIndexChange = vi.fn();
    const { container } = render(<CoverFlow items={items} index={1} onIndexChange={onIndexChange} />);
    await settle();
    fireEvent.keyDown(viewport(container), { key: "ArrowRight" });
    await settle();
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(front(container)).toBe("2 of 5: Two");
  });

  test("controlled: the row follows the parent's index", async () => {
    function Parent() {
      const [index, setIndex] = useState(0);
      return <CoverFlow items={items} index={index} onIndexChange={setIndex} />;
    }
    const { container } = render(<Parent />);
    await settle();
    fireEvent.keyDown(viewport(container), { key: "End" });
    await settle();
    expect(front(container)).toBe("5 of 5: Five");
  });

  test("uncontrolled: moves on its own and reports each new front cover", async () => {
    const onIndexChange = vi.fn();
    const { container } = render(<CoverFlow items={items} defaultIndex={0} onIndexChange={onIndexChange} />);
    fireEvent.keyDown(viewport(container), { key: "ArrowRight" });
    await settle();
    expect(front(container)).toBe("2 of 5: Two");
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
  });
  test("a status region, there from mount, names only the cover a move settles on (WCAG 4.1.3)", async () => {
    const { container } = render(<CoverFlow items={items} defaultIndex={0} />);
    const status = container.querySelector('[role="status"]')!;
    expect(status).not.toBeNull();
    expect(status.textContent).toBe("");
    expect(container.querySelector("[aria-live]")).toBeNull();
    fireEvent.keyDown(viewport(container), { key: "End" });
    await settle();
    expect(status.textContent).toBe("5 of 5: Five");
  });

  test("Next keeps focus when it reaches the last cover: aria-disabled, not disabled (WCAG 2.4.3)", async () => {
    const { container } = render(<CoverFlow items={items} defaultIndex={3} />);
    const next = container.querySelector<HTMLButtonElement>('button[aria-label="Next"]')!;
    next.focus();
    fireEvent.click(next);
    await settle();
    expect(next.getAttribute("aria-disabled")).toBe("true");
    expect(next.disabled).toBe(false);
    expect(document.activeElement).toBe(next);
    fireEvent.click(next);
    await settle();
    expect(front(container)).toBe("5 of 5: Five");
  });
});
