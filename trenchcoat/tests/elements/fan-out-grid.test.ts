/*
 * <tc-fan-out-grid> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/fan-out-grid";
import { TcFanOutGrid, type FanoutTask } from "../../src/elements/fan-out-grid";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const T0 = Date.UTC(2026, 9, 24, 12, 0, 0);
const time = (el: Element) => el.querySelector(".ui-fog__time")!.textContent;
const key = (el: Element, k: string) => el.querySelector(".ui-fog__grid")!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);

const mixed: FanoutTask[] = [
  { id: "a", label: "alpha.io", status: "done", start: 0, end: 10 },
  { id: "b", label: "beta.io", status: "running", start: 0 },
  { id: "c", label: "gamma.io", status: "failed", start: 0, end: 10, error: "timeout" },
  { id: "d", label: "delta.io", status: "queued" },
];

describe("tc-fan-out-grid", () => {
  test("the host is the root, with the look", async () => {
    const el = await fixture<TcFanOutGrid>(html`<tc-fan-out-grid .tasks=${mixed} .now=${20}></tc-fan-out-grid>`);
    expect(el.dataset.ui).toBe("fog");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(".ui-fog__title")!.textContent).toBe("Fan-out");
    el.look = "clean";
    el.heading = "Leads";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-fog__title")!.textContent).toBe("Leads");
    // Clean: the counts sit inside the panel
    expect(el.querySelector(".ui-fog__panel .ui-fog__foot")).toBeTruthy();
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      const make = (tasks: FanoutTask[], extra: Partial<TcFanOutGrid> = {}) =>
        fixture<TcFanOutGrid>(html`<tc-fan-out-grid look=${look} .tasks=${tasks} .now=${extra.now} .elapsed=${extra.elapsed} .onRetry=${extra.onRetry} .filter=${extra.filter ?? null} .selected=${extra.selected ?? null}></tc-fan-out-grid>`);

      test("`now` in epoch ms counts from the earliest start", async () => {
        const el = await make([{ id: "a", label: "a", status: "running", start: T0 }], { now: T0 + 12_000 });
        expect(time(el)).toBe("12s so far");
      });

      test("`elapsed` keeps the job-relative meaning", async () => {
        const el = await make([{ id: "a", label: "a", status: "running", start: 400 }], { elapsed: 5_000 });
        expect(time(el)).toBe("5.0s so far");
      });

      test("without a clock it reads the clock after connecting and ticks while tasks run", async () => {
        vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"], now: T0 + 3_000 });
        const el = await make([{ id: "a", label: "a", status: "running", start: T0 }]);
        await settle();
        expect(time(el)).toBe("3.0s so far");
        vi.advanceTimersByTime(2_000);
        await settle();
        expect(time(el)).toBe("5.0s so far");
        el.remove();
        expect(vi.getTimerCount()).toBe(0);
      });

      test("finished: the span from the first start to the last end", async () => {
        const el = await make(
          [
            { id: "a", label: "a", status: "done", start: T0, end: T0 + 4_000 },
            { id: "b", label: "b", status: "failed", start: T0 + 1_000, end: T0 + 7_000 },
          ],
          { now: T0 + 9_000 },
        );
        expect(time(el)).toBe("Finished in 7.0s");
      });

      test("the filter changes unless prevented, and follows its property", async () => {
        const el = await make([{ id: "a", label: "a", status: "done", start: 0, end: 10 }, ...mixed.slice(1)], { now: 20 });
        const seen: unknown[] = [];
        on(el, "tc-filter-change", (e) => seen.push(e.detail.filter));
        el.querySelector<HTMLElement>('.ui-fog__key[data-status="done"]')!.click();
        await settle();
        expect(seen).toEqual(["done"]);
        expect(el.filter).toBe("done");
        expect(el.querySelector('.ui-fog__key[aria-pressed="true"]')!.getAttribute("data-status")).toBe("done");
        expect(el.querySelectorAll(".ui-fog__cell[data-dim]")).toHaveLength(3);
        // Controlled: prevented, nothing changes
        on(el, "tc-filter-change", (e) => e.preventDefault());
        el.querySelector<HTMLElement>('.ui-fog__key[data-status="failed"]')!.click();
        await settle();
        expect(seen).toEqual(["done", "failed"]);
        expect(el.filter).toBe("done");
        el.filter = "failed";
        await settle();
        expect(el.querySelector('.ui-fog__key[aria-pressed="true"]')!.getAttribute("data-status")).toBe("failed");
      });

      test("the selection: a click keeps a task open, tc-select reports it; controlled through preventDefault", async () => {
        const el = await make(mixed, { now: 20 });
        const selected: unknown[] = [];
        const picked: unknown[] = [];
        on(el, "tc-selected-change", (e) => selected.push(e.detail.selected));
        on(el, "tc-select", (e) => picked.push((e.detail.task as FanoutTask | null)?.id ?? null));
        el.querySelectorAll<HTMLElement>(".ui-fog__cell")[1].click();
        await settle();
        expect(selected).toEqual(["b"]);
        expect(picked).toEqual(["b"]);
        expect(el.querySelectorAll(".ui-fog__cell")[1].hasAttribute("data-pinned")).toBe(true);
        expect(el.querySelector('[role="tooltip"] .ui-fog__tip-label')!.textContent).toBe("beta.io");
        on(el, "tc-selected-change", (e) => e.preventDefault());
        el.querySelectorAll<HTMLElement>(".ui-fog__cell")[0].click();
        await settle();
        expect(selected).toEqual(["b", "a"]);
        expect(el.selected).toBe("b");
        el.selected = "a";
        await settle();
        expect(el.querySelectorAll(".ui-fog__cell")[0].hasAttribute("data-pinned")).toBe(true);
      });

      test("a click in the gap picks the nearest cell (WCAG 2.5.8)", async () => {
        const el = await make(mixed, { now: 20 });
        const cell = el.querySelectorAll<HTMLElement>(".ui-fog__cell")[2].getBoundingClientRect();
        const grid = el.querySelector(".ui-fog__grid")!;
        grid.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: cell.left + cell.width / 2 + 10, clientY: cell.top + cell.height / 2 }));
        await settle();
        expect(el.selected).toBe("c");
        // 12px squares 12px apart, wider than 520px (14px apart below it)
        expect(TcFanOutGrid.css).toMatch(/--tc-fan-out-grid-gap: 12px;/);
      });

      test("a rejected onRetry says so and the button can be pressed again", async () => {
        const onRetry = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
        const el = await make([{ id: "a", label: "a", status: "failed", start: 0, end: 10 }], { now: 20, onRetry });
        el.querySelector<HTMLElement>(".ui-fog__retry")!.click();
        await settle();
        await settle();
        expect(onRetry).toHaveBeenCalledWith(["a"]);
        expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/Couldn't retry/);
        const again = el.querySelector<HTMLElement>(".ui-fog__retry")!;
        expect(again.textContent).toMatch(/try again/);
        again.click();
        await settle();
        await settle();
        expect(onRetry).toHaveBeenCalledTimes(2);
        expect(el.querySelector('[role="alert"]')).toBeNull();
      });

      test("without onRetry there's no Retry button", async () => {
        const el = await make(mixed, { now: 20 });
        expect(el.querySelector(".ui-fog__retry")).toBeNull();
      });

      test("WCAG 4.1.2: the grid is a listbox of named options; arrows move the active option", async () => {
        const el = await make(mixed, { now: 20 });
        const grid = el.querySelector<HTMLElement>('[role="listbox"]')!;
        const options = [...el.querySelectorAll('[role="option"]')];
        expect(options.map((o) => o.getAttribute("aria-label"))).toEqual(["alpha.io, done", "beta.io, running", "gamma.io, failed", "delta.io, queued"]);
        grid.focus();
        await settle();
        expect(grid.getAttribute("aria-activedescendant")).toBe(options[0].id);
        key(el, "ArrowRight");
        await settle();
        expect(grid.getAttribute("aria-activedescendant")).toBe(options[1].id);
        key(el, "End");
        await settle();
        expect(grid.getAttribute("aria-activedescendant")).toBe(options[3].id);
        key(el, "Home");
        key(el, "ArrowRight");
        await settle();
        key(el, "Enter");
        await settle();
        expect(options[1].getAttribute("aria-selected")).toBe("true");
        expect(grid.getAttribute("aria-describedby")).toBe(el.querySelector('[role="tooltip"]')!.id);
        key(el, "Escape");
        await settle();
        expect(options[1].hasAttribute("aria-selected")).toBe(false);
        expect(grid.hasAttribute("aria-activedescendant")).toBe(false);
      });

      test("WCAG 1.4.13: the hover window can be hovered and closes with Escape without moving focus", async () => {
        const el = await make(mixed, { now: 20 });
        const before = document.activeElement;
        el.querySelectorAll('[role="option"]')[2].dispatchEvent(new MouseEvent("mouseenter"));
        await settle();
        const tip = el.querySelector('[role="tooltip"]')!;
        expect(tip).toBeTruthy();
        el.querySelector(".ui-fog__grid")!.dispatchEvent(new MouseEvent("mouseleave"));
        tip.dispatchEvent(new MouseEvent("mouseenter"));
        await new Promise((r) => setTimeout(r, 300));
        await settle();
        expect(el.querySelector('[role="tooltip"]')).toBeTruthy();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await settle();
        expect(el.querySelector('[role="tooltip"]')).toBeNull();
        expect(document.activeElement).toBe(before);
      });

      test("the window sits over its cell, inside the panel", async () => {
        const el = await make(mixed, { now: 20 });
        el.querySelectorAll('[role="option"]')[1].dispatchEvent(new MouseEvent("mouseenter"));
        await settle();
        const tip = el.querySelector<HTMLElement>('[role="tooltip"]')!;
        expect(tip.style.left).toMatch(/px$/);
        expect(tip.dataset.side).toMatch(/above|below/);
      });

      test("WCAG 4.1.3: the live region is there from the start and speaks in steps of ten percent", async () => {
        const tasks: FanoutTask[] = Array.from({ length: 20 }, (_, i) => ({ id: `t${i}`, label: `t${i}`, status: i < 2 ? "done" : "running", start: 0 }));
        const el = await make(tasks, { now: 20 });
        const live = el.querySelector('.ui-fog__sr[aria-live="polite"]')!;
        expect(live.textContent).toBe("10% of 20 tasks done.");
        el.tasks = tasks.map((t, i) => (i === 2 ? { ...t, status: "done" as const, end: 5 } : t));
        await settle();
        expect(live.textContent).toBe("10% of 20 tasks done.");
      });

      test("WCAG 2.4.3: Retry going away moves focus to the grid", async () => {
        const tasks: FanoutTask[] = [{ id: "a", label: "a", status: "failed", start: 0, end: 10 }];
        const el = await make(tasks, { now: 20, onRetry: () => {} });
        el.querySelector<HTMLElement>(".ui-fog__retry")!.focus();
        el.tasks = [{ ...tasks[0], status: "running" }];
        await settle();
        await settle();
        expect(document.activeElement).toBe(el.querySelector('[role="listbox"]'));
      });
    });
  }

  test("performance and 2.2.2: the shine moves with transform, stops after a few runs and pauses off-screen", () => {
    const css = TcFanOutGrid.css;
    expect(css).not.toMatch(/background-position/);
    expect(css).toMatch(/ui-fog-cell-sweep \{ from \{ transform/);
    expect(css).not.toMatch(/infinite/);
    expect(css).toMatch(/\[data-offscreen\] \.ui-fog__cell[^{]*\{ animation-play-state: paused/);
  });

  test("a custom icon is cloned in place of the default", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("data-mine", "");
    const el = await fixture<TcFanOutGrid>(html`<tc-fan-out-grid .icon=${icon} .tasks=${mixed} .now=${20}></tc-fan-out-grid>`);
    expect(el.querySelector(".ui-fog__mark svg[data-mine]")).toBeTruthy();
    expect(icon.isConnected).toBe(false);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-fan-out-grid job="Enrich leads" .tasks=${mixed} .now=${20} .onRetry=${() => {}}></tc-fan-out-grid>
      <tc-fan-out-grid look="clean" heading="Clean" .tasks=${mixed} .now=${20} .onRetry=${() => {}}></tc-fan-out-grid>
    </div>`);
    // Retry fades in – check the colours it lands on
    document.getAnimations().forEach((a) => a.finish());
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

