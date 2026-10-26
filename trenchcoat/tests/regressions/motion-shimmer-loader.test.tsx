/* shimmer-loader: ShimmerText follows the contract too (one spec per file covers Skeleton) – Phase 5 (motion) */
import { createRef } from "react";
import { act, render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

// A controllable observer, in place before the module's shared one is created
let report: IntersectionObserverCallback = () => {};
const observed = new Set<Element>();
vi.stubGlobal(
  "IntersectionObserver",
  class {
    constructor(cb: IntersectionObserverCallback) {
      report = cb;
    }
    observe(el: Element) {
      observed.add(el);
    }
    unobserve(el: Element) {
      observed.delete(el);
    }
    disconnect() {}
  },
);
const { ShimmerText, Skeleton } = await import("@motion/shimmer-loader");
const sheet = () => [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");
const entry = (target: Element, isIntersecting: boolean) => ({ target, isIntersecting }) as unknown as IntersectionObserverEntry;

describe("shimmer-loader", () => {
  test("ShimmerText merges className, passes DOM props and style, and takes a ref", () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <ShimmerText ref={ref} className="mine" role="status" duration={3} style={{ fontWeight: 600 }}>
        Thinking…
      </ShimmerText>,
    );
    const root = container.querySelector<HTMLElement>(".ui-shm-text")!;
    expect(ref.current).toBe(root);
    expect(root.classList.contains("mine")).toBe(true);
    expect(root.getAttribute("role")).toBe("status");
    expect(root.style.fontWeight).toBe("600");
    expect(root.style.getPropertyValue("--tc-shimmer-loader-text-dur")).toBe("3s");
  });

  test("Skeleton is hidden from assistive tech unless the caller says otherwise", () => {
    const { container } = render(
      <>
        <Skeleton />
        <Skeleton aria-hidden={false} aria-label="Loading avatar" />
      </>,
    );
    const [a, b] = container.querySelectorAll(".ui-shm");
    expect(a.getAttribute("aria-hidden")).toBe("true");
    expect(b.getAttribute("aria-hidden")).toBe("false");
  });

  test("the sweeps move on transform, never background-position, and rest after a few passes (2.2.2)", () => {
    render(<Skeleton />);
    const css = sheet();
    expect(css).not.toMatch(/background-position/);
    expect(css).not.toMatch(/infinite;/);
    expect(css).toMatch(/--tc-shimmer-loader-passes: 3;/);
    expect(css).toMatch(/@keyframes ui-shm-sweep \{\s*from \{ transform: translateX\(-100%\); \}/);
  });

  test("off screen a shimmer gets data-off (its sweep holds); back on screen it runs again", () => {
    const { container } = render(
      <>
        <Skeleton />
        <ShimmerText>Thinking…</ShimmerText>
      </>,
    );
    const block = container.querySelector(".ui-shm")!;
    const text = container.querySelector(".ui-shm-text")!;
    expect(observed.has(block) && observed.has(text)).toBe(true);
    act(() => report([entry(block, false), entry(text, false)], {} as IntersectionObserver));
    expect(block.hasAttribute("data-off") && text.hasAttribute("data-off")).toBe(true);
    act(() => report([entry(block, true)], {} as IntersectionObserver));
    expect(block.hasAttribute("data-off")).toBe(false);
  });

  test("unmounting stops watching, and the caller's ref is cleared", () => {
    const ref = createRef<HTMLSpanElement>();
    const view = render(<Skeleton ref={ref} />);
    const block = ref.current!;
    expect(observed.has(block)).toBe(true);
    view.unmount();
    expect(observed.has(block)).toBe(false);
    expect(ref.current).toBeNull();
  });

  test("ShimmerText reads once: the brighter copy in the band is hidden from assistive tech", () => {
    const { getByRole } = render(<ShimmerText role="status">Thinking…</ShimmerText>);
    const status = getByRole("status");
    const band = status.querySelector(".ui-shm-text__clip")!;
    expect(band.getAttribute("aria-hidden")).toBe("true");
    expect(band.textContent).toBe("Thinking…");
    // The label's own colour is real text colour (contrast), not a transparent fill
    expect(sheet()).toMatch(/\.ui-shm-text \{[^}]*color: var\(--tc-text-muted/);
    expect(sheet()).not.toMatch(/text-fill-color: transparent/);
  });
});
