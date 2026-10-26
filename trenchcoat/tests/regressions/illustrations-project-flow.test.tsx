/*
 * project-flow: every resize re-rendered the component to rescale the artboard (and nothing rendered until it had
 * been measured once); the build-up played even while the scene was off screen, so you could miss it entirely.
 */
import { Profiler } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ProjectFlow } from "@illustrations/project-flow";

afterEach(() => vi.unstubAllGlobals());

test("resizing rescales the artboard without a render", () => {
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
  let commits = 0;
  const { container } = render(
    <Profiler id="t" onRender={() => commits++}>
      <ProjectFlow />
    </Profiler>,
  );
  const root = container.firstElementChild as HTMLElement;
  const stage = root.querySelector<HTMLElement>(".pf-stage")!;
  expect(stage.style.visibility, "hidden until it has a size").toBe("hidden");
  Object.defineProperty(root, "clientWidth", { configurable: true, value: 1156 });
  commits = 0;
  act(() => resize());
  expect(commits).toBe(0);
  expect(stage.style.transform).toBe("scale(0.5)");
  expect(stage.style.visibility).toBe("");
});

test("the build-up is held while off screen", () => {
  let report: (visible: boolean) => void = () => {};
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        report = (isIntersecting) => callback([{ isIntersecting } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  const { container } = render(<ProjectFlow />);
  act(() => report(false));
  expect(container.firstElementChild!.hasAttribute("data-paused")).toBe(true);
  act(() => report(true));
  expect(container.firstElementChild!.hasAttribute("data-paused")).toBe(false);
});

/*
 * Themes pass: the dark scene only appeared with theme="dark" – a .dark class, data-tc-theme or the OS setting left
 * white cards on a grey vignette. Without `theme` it now follows the colour scheme in use (re-read when an ancestor's
 * theme attributes change) and the swapped-in scene shows finished; its colours are light-dark() tokens.
 * Contrast (1.4.3): the grey sub lines and the pill label were 2.9 : 1 and 2.7 : 1.
 */
const inkPerTheme = () => {
  // jsdom resolves no light-dark(): give the root a plain ink per theme, as a browser would. jsdom lets the
  // stylesheet inserted last win, so the component's own (hoisted, kept after unmount) goes in first
  render(<ProjectFlow />).unmount();
  const style = document.createElement("style");
  style.textContent = "body div .ui-pf { color: rgb(23, 23, 23); } body .dark .ui-pf { color: rgb(237, 237, 237); }";
  document.head.append(style);
  return () => style.remove();
};

test("without a theme it follows the page and shows the new scene finished", async () => {
  const cleanup = inkPerTheme();
  const page = document.createElement("div");
  document.body.append(page);
  try {
    const { container } = render(<ProjectFlow />, { container: page });
    const root = container.firstElementChild!;
    expect(root.getAttribute("data-scene")).toBe("light");
    expect(root.hasAttribute("data-theme")).toBe(false);
    expect(root.hasAttribute("data-settled")).toBe(false);
    await act(async () => {
      page.classList.add("dark");
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });
    expect(root.getAttribute("data-scene")).toBe("dark");
    expect(root.hasAttribute("data-settled"), "no replay of the build-up").toBe(true);
  } finally {
    page.remove();
    cleanup();
  }
});

test("a dark page shows the dark scene from the first paint, with the build-up", () => {
  const cleanup = inkPerTheme();
  const page = document.createElement("div");
  page.className = "dark";
  document.body.append(page);
  try {
    const root = render(<ProjectFlow />, { container: page }).container.firstElementChild!;
    expect(root.getAttribute("data-scene")).toBe("dark");
    expect(root.hasAttribute("data-settled")).toBe(false);
  } finally {
    page.remove();
    cleanup();
  }
});

test("theme pins the scene", () => {
  const cleanup = inkPerTheme();
  try {
    const root = render(<ProjectFlow theme="dark" />).container.firstElementChild!;
    expect(root.getAttribute("data-scene")).toBe("dark");
    expect(root.getAttribute("data-theme")).toBe("dark");
  } finally {
    cleanup();
  }
});

test("scene colours are light-dark() tokens, and the secondary text meets 4.5 : 1", () => {
  render(<ProjectFlow />);
  const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");
  expect(css).not.toMatch(/\[data-theme="dark"\] \./);
  expect(css).toContain("--tc-project-flow-sub: light-dark(#737373");
  expect(css).toContain("--tc-project-flow-pill-text: light-dark(#8a6510");
});
