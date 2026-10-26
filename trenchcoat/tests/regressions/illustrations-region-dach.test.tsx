/*
 * region-dach: a new region took two commits (render, then an effect added the crossfade layer); every resize re-rendered
 * to scale the menu; measuring the menu re-rendered on open and on every hovered row; and a controlled `region`
 * without its handler froze the menu silently.
 */
import { Profiler, type ReactNode } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { RegionDach } from "@illustrations/region-dach";

afterEach(() => vi.unstubAllGlobals());

const counted = () => {
  const count = { commits: 0 };
  const wrap = (node: ReactNode) => (
    <Profiler id="t" onRender={() => count.commits++}>
      {node}
    </Profiler>
  );
  return { count, wrap };
};

test("switching the region shows the new layer in the same commit", () => {
  const { count, wrap } = counted();
  const { container, rerender } = render(wrap(<RegionDach region="dach" onRegionChange={() => {}} />));
  count.commits = 0;
  rerender(wrap(<RegionDach region="jp" onRegionChange={() => {}} />));
  expect(count.commits).toBe(1);
  // The old layer fades out while the new one comes in
  expect([...container.querySelectorAll(".ui-rd-layer")].map((l) => l.getAttribute("data-phase"))).toEqual(["exit", "enter"]);
});

test("resizing scales the menu without a render", () => {
  let resize: () => void = () => {};
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  const { count, wrap } = counted();
  const { container } = render(wrap(<RegionDach />));
  const root = container.firstElementChild as HTMLElement;
  Object.defineProperty(root, "clientWidth", { configurable: true, value: 2000 });
  Object.defineProperty(root, "clientHeight", { configurable: true, value: 2000 });
  count.commits = 0;
  act(() => resize());
  expect(count.commits).toBe(0);
  expect(root.style.getPropertyValue("--tc-region-dach-s")).toBe("1");
});

test("opening the menu and hovering rows doesn't re-render to measure", () => {
  const { count, wrap } = counted();
  const { container } = render(wrap(<RegionDach />));
  count.commits = 0;
  act(() => {
    fireEvent.click(container.querySelector(".ui-rd-trigger")!);
  });
  // One commit for the open state – the measurements go straight to the DOM
  expect(count.commits).toBe(1);
  const options = container.querySelectorAll('[role="option"]');
  count.commits = 0;
  act(() => {
    fireEvent.pointerEnter(options[1]);
  });
  act(() => {
    fireEvent.pointerEnter(options[2]);
  });
  expect(count.commits).toBe(2);
});

test("a controlled region without its handler says so", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  try {
    render(<RegionDach region="jp" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`region` is set without its change handler"));
    warn.mockClear();
    // Without the menu nothing can change it, so it needs no handler
    render(<RegionDach region="jp" showSwitcher={false} />);
    expect(warn).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});
