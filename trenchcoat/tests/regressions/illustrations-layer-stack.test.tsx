/*
 * layer-stack: the autoplay kept stepping while scrolled off screen; the chosen entry couldn't be controlled
 * (only defaultIndex + a user-picks-only onChange); Home/End didn't move through the list.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LayerStack } from "@illustrations/layer-stack";

class ManualObserver {
  static last: ManualObserver | null = null;
  target: Element | null = null;
  constructor(private callback: IntersectionObserverCallback) {
    ManualObserver.last = this;
  }
  observe(target: Element) {
    this.target = target;
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  report(isIntersecting: boolean) {
    this.callback([{ target: this.target, isIntersecting } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", ManualObserver);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const selected = (root: Element) => [...root.querySelectorAll('[role="tab"]')].findIndex((t) => t.getAttribute("aria-selected") === "true");

test("the autoplay holds while off screen", () => {
  const { container } = render(<LayerStack interval={1000} />);
  act(() => vi.advanceTimersByTime(1000));
  expect(selected(container)).toBe(1);
  act(() => ManualObserver.last!.report(false));
  act(() => vi.advanceTimersByTime(5000));
  expect(selected(container)).toBe(1);
  act(() => ManualObserver.last!.report(true));
  act(() => vi.advanceTimersByTime(1000));
  expect(selected(container)).toBe(2);
});

test("index is controlled: it doesn't step on its own, and picks are reported, not applied", () => {
  const onIndexChange = vi.fn();
  const onChange = vi.fn();
  const { container, rerender } = render(<LayerStack index={2} onIndexChange={onIndexChange} onChange={onChange} interval={1000} />);
  act(() => vi.advanceTimersByTime(5000));
  expect(selected(container)).toBe(2);
  fireEvent.click(container.querySelectorAll('[role="tab"]')[4]);
  expect(onIndexChange).toHaveBeenCalledWith(4);
  expect(onChange).toHaveBeenCalledWith(4); // the deprecated alias still reports user picks
  expect(selected(container)).toBe(2);
  rerender(<LayerStack index={4} onIndexChange={onIndexChange} interval={1000} />);
  expect(selected(container)).toBe(4);
});

test("onIndexChange also reports the automatic steps; onChange only the user's picks", () => {
  const onIndexChange = vi.fn();
  const onChange = vi.fn();
  render(<LayerStack onIndexChange={onIndexChange} onChange={onChange} interval={1000} />);
  act(() => vi.advanceTimersByTime(1000));
  expect(onIndexChange).toHaveBeenCalledWith(1);
  expect(onChange).not.toHaveBeenCalled();
});

test("Home and End jump to the first and last entry", () => {
  const { container } = render(<LayerStack defaultIndex={2} />);
  const tabs = container.querySelectorAll<HTMLElement>('[role="tab"]');
  fireEvent.keyDown(tabs[2], { key: "End" });
  expect(selected(container)).toBe(4);
  expect(document.activeElement).toBe(tabs[4]);
  fireEvent.keyDown(tabs[4], { key: "Home" });
  expect(selected(container)).toBe(0);
  expect(document.activeElement).toBe(tabs[0]);
});

/*
 * WCAG pass: the autoplay stepped through the entries forever (2.2.2) – it now rests after `rounds` times through the
 * list (default 2); the chosen title used the plain accent, 4.49 : 1 on the white pill (1.4.3).
 */
test("the autoplay rests after two rounds by default", () => {
  const onIndexChange = vi.fn();
  render(<LayerStack interval={1000} onIndexChange={onIndexChange} />);
  act(() => vi.advanceTimersByTime(30_000));
  expect(onIndexChange).toHaveBeenCalledTimes(10);
  expect(onIndexChange).toHaveBeenLastCalledWith(0); // back on the first entry
});

test("rounds={Infinity} keeps it going", () => {
  const onIndexChange = vi.fn();
  render(<LayerStack interval={1000} rounds={Infinity} onIndexChange={onIndexChange} />);
  act(() => vi.advanceTimersByTime(30_000));
  expect(onIndexChange).toHaveBeenCalledTimes(30);
});

test("the chosen title uses the accent text colour", () => {
  render(<LayerStack />);
  const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");
  expect(css).toMatch(/\.ui-lyr-row\[aria-selected="true"\] \.ui-lyr-title \{ color: var\(--tc-accent-text/);
});
