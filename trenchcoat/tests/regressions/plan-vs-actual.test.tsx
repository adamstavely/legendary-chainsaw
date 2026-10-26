/*
 * plan-vs-actual: cyclic deps overflowed the stack while placing the steps – audit theme 10.
 * Phase 3: `now` is epoch ms (step start/end on the same clock) with a clock of its own when it isn't passed;
 * `elapsed` keeps the old run-relative meaning; className, DOM props and ref reach the root; the glide reads no clock
 * during render. (Only the Clean file exists and it isn't built from src/, so the contract runner doesn't cover it –
 * these tests do.)
 */
import { createRef } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as clean from "@components/plan-vs-actual-clean";

describe("plan-vs-actual clean", () => {
  test("cyclic and self deps render instead of overflowing the stack", () => {
    const steps = [
      { id: "a", title: "Read the brief", plan: 4000, deps: ["c"], start: 0 },
      { id: "b", title: "Build the layout", plan: 6000, deps: ["a"] },
      { id: "c", title: "Write the copy", plan: 5000, deps: ["b", "c"] },
    ];
    render(<clean.PlanVsActual steps={steps} now={2000} />);
    for (const s of steps) expect(screen.getAllByText(s.title).length).toBeGreaterThan(0);
  });

  const T0 = Date.UTC(2026, 9, 24, 12, 0, 0);
  const time = (c: HTMLElement) => c.querySelector(".ui-pvac__stat dd b")!.textContent;
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("`now` in epoch ms counts from the first start", () => {
    const steps = [{ id: "a", title: "Read the brief", plan: 60_000, start: T0 }];
    const { container } = render(<clean.PlanVsActual steps={steps} now={T0 + 42_000} />);
    expect(time(container)).toBe("0:42");
  });

  test("`elapsed` keeps the run-relative meaning", () => {
    const steps = [{ id: "a", title: "Read the brief", plan: 60_000, start: 5_000 }];
    const { container } = render(<clean.PlanVsActual steps={steps} elapsed={65_000} />);
    expect(time(container)).toBe("1:05");
  });

  test("without a clock prop it reads the clock after mount and ticks while the run goes on", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(T0 + 10_000);
    const steps = [{ id: "a", title: "Read the brief", plan: 60_000, start: T0 }];
    const { container } = render(<clean.PlanVsActual steps={steps} />);
    await act(async () => {});
    expect(time(container)).toBe("0:10");
    await act(async () => vi.advanceTimersByTime(5_000));
    expect(time(container)).toBe("0:15");
  });

  test("className is merged, DOM props and ref reach the root", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<clean.PlanVsActual ref={ref} steps={[{ id: "a", title: "A", plan: 1000 }]} elapsed={0} className="mine" data-x="1" aria-describedby="d" />);
    const root = container.querySelector(".ui-pvac") as HTMLElement;
    expect(ref.current).toBe(root);
    expect(root.classList.contains("mine")).toBe(true);
    expect(root.getAttribute("data-x")).toBe("1");
    expect(root.getAttribute("aria-describedby")).toBe("d");
  });

  test("a jump glides without reading the clock during render, then settles on the target", async () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "setTimeout", "setInterval", "clearInterval", "clearTimeout", "performance"] });
    const spy = vi.spyOn(performance, "now");
    const base = [
      { id: "a", title: "First", plan: 60_000, start: 0 },
      { id: "b", title: "Second", plan: 30_000, deps: ["a"] },
    ];
    const forecast = (c: HTMLElement) => Number((c.querySelectorAll(".ui-pvac__row")[1].querySelector('.ui-pvac__bar[data-kind="forecast"]') as HTMLElement).style.getPropertyValue("--s"));
    const { container, rerender } = render(<clean.PlanVsActual steps={base} elapsed={10_000} />);
    expect(forecast(container)).toBe(60_000);
    // The first step finishes early: the second one jumps forward – it glides there
    rerender(<clean.PlanVsActual steps={[{ ...base[0], end: 20_000 }, base[1]]} elapsed={20_000} />);
    expect(forecast(container)).toBe(60_000);
    await act(async () => vi.advanceTimersByTime(48));
    const mid = forecast(container);
    expect(mid).toBeLessThan(60_000);
    expect(mid).toBeGreaterThan(20_000);
    await act(async () => vi.advanceTimersByTime(2_000));
    expect(forecast(container)).toBe(20_000);
    expect(spy).not.toHaveBeenCalled();
  });
});

/*
 * WCAG + design pass (f7): the dependency lines (drawn for the pointer only, aria-hidden) have a text twin in each
 * row's name; a waiting row says its planned time; pointing at a row dims only the other rows' bars, never their text;
 * the running sheen is finite (3 sweeps, transform not background-position) and pauses off-screen; the live numbers
 * no longer shimmer; no `.dark`-scoped colour rules.
 */
describe("plan-vs-actual clean – a11y pass", () => {
  const css = () => [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");
  const steps = [
    { id: "a", title: "Read the brief", plan: 4000, start: 0 },
    { id: "b", title: "Build the layout", plan: 6000, deps: ["a"] },
    { id: "c", title: "Write the copy", plan: 5000, deps: ["a", "b"] },
  ];

  test("each row names what it waits for, and a waiting row its planned time", () => {
    render(<clean.PlanVsActual steps={steps} elapsed={2000} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows[0].getAttribute("aria-label")).not.toMatch(/Waits for/);
    expect(rows[1].getAttribute("aria-label")).toMatch(/planned 0:06\. Waits for Read the brief$/);
    expect(rows[2].getAttribute("aria-label")).toMatch(/Waits for Read the brief, Build the layout$/);
  });

  test("dimming another row never dims its text; the sheen is finite, composited and pauses off-screen", () => {
    render(<clean.PlanVsActual steps={steps} elapsed={2000} />);
    const sheet = css();
    expect(sheet).not.toMatch(/\.ui-pvac__row\[data-dim\]\s*\{\s*opacity/);
    expect(sheet).toMatch(/\.ui-pvac__row\[data-dim\] :is\(\.ui-pvac__bar, \.ui-pvac__ghost/);
    expect(sheet).not.toMatch(/background-position/);
    expect(sheet).not.toMatch(/infinite alternate|ui-pvac-sweep[^;]*infinite/);
    expect(sheet).toMatch(/\[data-offscreen\] \.ui-pvac__bar::before/);
    expect(sheet).not.toMatch(/\.dark[^{]*\.ui-pvac/);
    expect(document.querySelector(".ui-pvac__live[data-live]")).not.toBeNull();
    expect(sheet).not.toMatch(/\.ui-pvac__live\[data-live\]\s*\{/);
  });

  test("off-screen, the root is marked so its animations pause", async () => {
    let cb: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(fn: IntersectionObserverCallback) {
          cb = fn;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { container } = render(<clean.PlanVsActual steps={steps} elapsed={2000} />);
    const root = container.querySelector(".ui-pvac") as HTMLElement;
    await act(async () => cb([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(root.hasAttribute("data-offscreen")).toBe(true);
    await act(async () => cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(root.hasAttribute("data-offscreen")).toBe(false);
    vi.unstubAllGlobals();
  });

  test("rows show a focus outline (no outline:none without a replacement)", () => {
    render(<clean.PlanVsActual steps={steps} elapsed={2000} />);
    expect(css()).toMatch(/\.ui-pvac__row:focus-visible \{ outline: var\(--tc-focus-outline/);
  });
});
