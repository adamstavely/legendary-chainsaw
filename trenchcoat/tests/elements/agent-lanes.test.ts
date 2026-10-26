/*
 * <tc-agent-lanes> in real browsers – the React component's contract and regression checks, ported.
 */
import { html, render, type TemplateResult } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/agent-lanes";
import type { LaneTask, TcAgentLanes } from "../../src/elements/agent-lanes";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const NOW = Date.UTC(2026, 9, 24, 12);
const agents = [{ id: "ada", name: "Ada" }];
const waiting: LaneTask = { id: "a", agentId: "ada", title: "Ship it?", status: "waiting", start: NOW - 60_000 };
const done: LaneTask = { id: "d", agentId: "ada", title: "Triage the inbox", status: "done", start: NOW - 600_000, end: NOW - 300_000, summary: ["Sorted 12"] };
const failed: LaneTask = { id: "f", agentId: "ada", title: "Fix date parsing", status: "failed", start: NOW - 280_000, end: NOW - 200_000 };
const statusOf = (el: Element) => el.querySelector('[data-task="a"]')?.getAttribute("data-status");
const button = (el: Element, name: string) => [...el.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === name)!;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);
/** Waits for the element's updates without an animation frame (the fake-timer tests fake requestAnimationFrame) */
const flush = async (el: TcAgentLanes) => {
  for (let i = 0; i < 3; i++) await el.updateComplete;
};
const mount = async (template: TemplateResult) => {
  const host = document.createElement("div");
  document.body.append(host);
  render(template, host);
  const el = host.firstElementChild as TcAgentLanes;
  await flush(el);
  return el;
};
/** Counts the element's renders from now on */
const renders = (el: TcAgentLanes) => {
  const counter = { n: 0 };
  const target = el as unknown as { render: () => unknown };
  const original = target.render.bind(el);
  target.render = () => {
    counter.n++;
    return original();
  };
  return counter;
};

describe("tc-agent-lanes", () => {
  test("the host is the root, with the look", async () => {
    const el = await fixture<TcAgentLanes>(html`<tc-agent-lanes .agents=${agents} .tasks=${[done]} .now=${NOW}></tc-agent-lanes>`);
    expect(el.dataset.ui).toBe("al");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(":scope > .ui-al__bar .ui-al__title")!.textContent).toBe("Agents");
    el.look = "clean";
    el.heading = "Crew";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-al__card > .ui-al__bar .ui-al__title")!.textContent).toBe("Crew");
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      const make = (tasks: LaneTask[], extra: Partial<TcAgentLanes> = {}) =>
        mount(
          html`<tc-agent-lanes look=${look} .agents=${agents} .tasks=${tasks} .now=${extra.now} .rate=${extra.rate} .onApprove=${extra.onApprove} .onReject=${extra.onReject} ?openable=${extra.openable} .expanded=${extra.expanded ?? null}></tc-agent-lanes>`,
        );

      test("a decision shows at once, and a later task update still wins", async () => {
        const onApprove = vi.fn();
        const el = await make([waiting], { now: NOW, onApprove });
        el.querySelector<HTMLElement>('[data-task="a"]')!.click();
        await settle();
        button(el, "Approve").click();
        await settle();
        expect(onApprove).toHaveBeenCalledTimes(1);
        expect(statusOf(el)).toBe("running");
        el.tasks = [{ ...waiting, status: "failed", end: NOW }];
        await settle();
        expect(statusOf(el)).toBe("failed");
      });

      test("an async decision waits, and a rejection keeps the block and says so", async () => {
        let fail: (e: Error) => void = () => {};
        const onReject = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
        const el = await make([waiting], { now: NOW, onReject });
        el.querySelector<HTMLElement>('[data-task="a"]')!.click();
        await settle();
        const reject = button(el, "Reject");
        reject.click();
        await settle();
        expect(reject.disabled).toBe(true);
        fail(new Error("offline"));
        await settle();
        expect(statusOf(el)).toBe("waiting");
        expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/try again/);
      });

      test("without `now` the lanes read the clock and follow it", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "Date", "performance"], now: NOW });
        const el = await make([waiting]);
        expect(el.querySelector('[data-task="a"]')).toBeTruthy();
        vi.advanceTimersByTime(500);
        await flush(el);
        expect(el.querySelector('[data-task="a"]')).toBeTruthy();
      });

      test("DOM ids never contain the task id", async () => {
        const el = await make([{ ...waiting, id: "x y" }], { now: NOW, expanded: "x y" });
        const pop = el.querySelector(".ui-al__pop")!;
        expect(pop.id).not.toContain("x");
        expect(el.querySelector('[aria-expanded="true"]')?.getAttribute("aria-controls")).toBe(pop.id);
      });

      test("expanded changes unless prevented, and follows its property", async () => {
        const el = await make([done, failed], { now: NOW });
        const seen: unknown[] = [];
        on(el, "tc-expanded-change", (e) => seen.push(e.detail.expanded));
        el.querySelector<HTMLElement>('[data-task="d"]')!.click();
        await settle();
        expect(seen).toEqual(["d"]);
        expect(el.querySelector('[aria-expanded="true"]')!.getAttribute("data-task")).toBe("d");
        on(el, "tc-expanded-change", (e) => e.preventDefault());
        el.querySelector<HTMLElement>('[data-task="f"]')!.click();
        await settle();
        expect(seen).toEqual(["d", "f"]);
        expect(el.querySelector('[aria-expanded="true"]')!.getAttribute("data-task")).toBe("d");
        el.expanded = "f";
        await settle();
        expect(el.querySelector('[aria-expanded="true"]')!.getAttribute("data-task")).toBe("f");
      });

      test("Escape closes the details and focus goes back to the block", async () => {
        const el = await make([done], { now: NOW });
        const block = el.querySelector<HTMLElement>('[data-task="d"]')!;
        block.focus();
        block.click();
        await settle();
        expect(el.querySelector(".ui-al__pop")).toBeTruthy();
        block.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        await settle();
        expect(el.querySelector(".ui-al__pop")).toBeNull();
        expect(document.activeElement).toBe(block);
      });

      test("a click elsewhere closes the details", async () => {
        const el = await make([done], { now: NOW });
        el.querySelector<HTMLElement>('[data-task="d"]')!.click();
        await settle();
        document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
        await settle();
        expect(el.querySelector(".ui-al__pop")).toBeNull();
      });

      /* The clock moves pixels without rendering; renders come only when a label or the set of blocks changes */
      const shift = (el: Element) => Number(el.querySelector<HTMLElement>(".ui-al__track")!.style.getPropertyValue("--t"));
      const steps = async (msTotal: number) => {
        for (let t = 0; t < msTotal; t += 16) {
          vi.advanceTimersByTime(16);
          await Promise.resolve();
        }
        await Promise.resolve();
      };

      test("real time: the window slides every few frames, with no render in between", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "Date", "performance"], now: NOW });
        const running: LaneTask = { id: "r", agentId: "ada", title: "Draft", status: "running", start: NOW - 10_000 };
        const el = await make([running]);
        await steps(100);
        const count = renders(el);
        const before = shift(el);
        await steps(5_000);
        expect(shift(el)).toBeGreaterThan(before);
        expect(count.n).toBe(0);
        el.remove();
        expect(vi.getTimerCount()).toBe(0);
      });

      test("`now` with a `rate` runs the clock on from it, rendering once a duration label changes", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "Date", "performance"], now: NOW });
        const running: LaneTask = { id: "r", agentId: "ada", title: "Draft", status: "running", start: NOW - 60_000 };
        const label = () => el.querySelector('[data-task="r"]')?.getAttribute("aria-label");
        const el = await make([running], { now: NOW, rate: 60 });
        expect(label()).toMatch(/, 1m$/);
        const count = renders(el);
        // 60× real time: a demo minute a second – the label rounds to 2m half a minute in, and to 3m a minute later
        await steps(2_000);
        await flush(el);
        expect(label()).toMatch(/, 3m$/);
        expect(count.n).toBeLessThanOrEqual(3);
        expect(shift(el)).toBeGreaterThan(5);
      });

      /* WCAG: the moving timeline can be paused and holds still under the pointer and focus (2.2.2), decisions hand
       * focus back to their block (2.4.3), the details popover isn't a role=tooltip, failed isn't colour only */
      test("a running clock gets one Pause toggle that keeps focus; a still clock has none", async () => {
        const el = await make([done], { now: NOW });
        expect(el.querySelector(".ui-al__pause")).toBeNull();
        el.rate = 20;
        await settle();
        const pause = button(el, "Pause timeline");
        expect(pause.getAttribute("aria-pressed")).toBe("false");
        expect(el.hasAttribute("data-still")).toBe(false);
        const seen: unknown[] = [];
        on(el, "tc-paused-change", (e) => seen.push(e.detail.paused));
        pause.focus();
        pause.click();
        await settle();
        expect(seen).toEqual([true]);
        expect(button(el, "Pause timeline")).toBe(pause);
        expect(pause.getAttribute("aria-pressed")).toBe("true");
        expect(document.activeElement).toBe(pause);
        expect(el.hasAttribute("data-still")).toBe(true);
      });

      test("paused is controlled through preventDefault", async () => {
        const el = await make([done], { now: NOW, rate: 20 });
        on(el, "tc-paused-change", (e) => e.preventDefault());
        button(el, "Pause timeline").click();
        await settle();
        expect(el.paused).toBe(false);
        el.paused = true;
        await settle();
        expect(button(el, "Pause timeline").getAttribute("aria-pressed")).toBe("true");
      });

      test("focus on a block holds the timeline still", async () => {
        const el = await make([done], { now: NOW, rate: 20 });
        el.querySelector<HTMLElement>('[data-task="d"]')!.focus();
        await settle();
        expect(el.hasAttribute("data-still")).toBe(true);
      });

      test("Approve takes focus when the decision opens, and hands it back to the block, not <body>", async () => {
        const el = await make([waiting], { now: NOW, onApprove: () => {} });
        el.querySelector<HTMLElement>('[data-task="a"]')!.click();
        await settle();
        const approve = button(el, "Approve");
        expect(document.activeElement).toBe(approve);
        approve.click();
        await settle();
        expect(document.activeElement).toBe(el.querySelector('[data-task="a"]'));
      });

      test("the details popover is a labelled group, not a tooltip holding a button; Open fires tc-open", async () => {
        const el = await make([done], { now: NOW, openable: true });
        const opened: unknown[] = [];
        on(el, "tc-open", (e) => opened.push(e.detail.task.id));
        el.querySelector<HTMLElement>('[data-task="d"]')!.click();
        await settle();
        expect(el.querySelector('[role="tooltip"]')).toBeNull();
        const group = el.querySelector('[role="group"][aria-label="Triage the inbox – details"]')!;
        const open = group.querySelector("button")!;
        expect(open.textContent).toBe("Open");
        open.click();
        expect(opened).toEqual(["d"]);
      });

      test("a failed block carries a mark, and every block names its full title", async () => {
        const el = await make([done, failed], { now: NOW });
        expect(el.querySelector('[data-task="f"] .ui-al__mark')).toBeTruthy();
        expect(el.querySelector('[data-task="d"] .ui-al__mark')).toBeNull();
        expect(el.querySelector('[data-task="f"]')!.getAttribute("title")).toBe("Fix date parsing");
      });
    });
  }

  test("avatars and tool logos are cloned", async () => {
    const mark = () => {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("data-mine", "");
      return s;
    };
    const avatar = mark();
    const tool = mark();
    const el = await fixture<TcAgentLanes>(html`<tc-agent-lanes .agents=${[{ ...agents[0], avatar }]} .tasks=${[{ ...done, tools: [tool] }]} .now=${NOW}></tc-agent-lanes>`);
    expect(el.querySelector(".ui-al__avatar[data-logo] svg[data-mine]")).toBeTruthy();
    expect(el.querySelector(".ui-al__tool svg[data-mine]")).toBeTruthy();
    expect(avatar.isConnected || tool.isConnected).toBe(false);
  });

  test("axe: no violations in either look", async () => {
    const tasks = [done, failed, waiting];
    const wrap = await fixture(html`<div>
      <tc-agent-lanes .agents=${agents} .tasks=${tasks} .now=${NOW} rate="20"></tc-agent-lanes>
      <tc-agent-lanes look="clean" heading="Clean" .agents=${agents} .tasks=${tasks} .now=${NOW} .expanded=${"d"}></tc-agent-lanes>
    </div>`);
    // Check the colours the blocks land on: finish what fades in, stop what loops
    for (const a of document.getAnimations()) {
      try {
        a.finish();
      } catch {
        a.cancel();
      }
    }
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
