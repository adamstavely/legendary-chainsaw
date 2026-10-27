/*
 * <tc-trace-waterfall> in real browsers – the React component's contract and regression checks, ported. The clock
 * tests fake Date and the timers (animation frames stay real, so fixtures settle).
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/trace-waterfall";
import type { TcTraceWaterfall, TraceOpenChange, TraceSpan } from "../../src/elements/trace-waterfall";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const fakeClock = () => vi.useFakeTimers({ now: 1_000_000, toFake: ["Date", "setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
const updates = async (el: TcTraceWaterfall) => {
  for (let i = 0; i < 3; i++) await el.updateComplete;
};
const advance = async (el: TcTraceWaterfall, ms: number) => {
  vi.advanceTimersByTime(ms);
  await updates(el);
};

const running: TraceSpan = { id: "run", name: "Run", kind: "agent", status: "running", start: 0, children: [{ id: "llm", name: "Plan", kind: "llm", status: "running", start: 0 }] };
const done: TraceSpan = {
  id: "run",
  name: "Run",
  kind: "agent",
  status: "done",
  start: 0,
  end: 3000,
  children: [
    { id: "a", name: "Plan", kind: "llm", status: "done", start: 0, end: 1000, detail: "opus" },
    { id: "b", name: "search", kind: "tool", status: "failed", start: 1000, end: 2000 },
    { id: "c", name: "Write", kind: "llm", status: "done", start: 2000, end: 3000 },
  ],
};
const many = (n: number, isRunning = false): TraceSpan => ({
  id: "run",
  name: "Run",
  kind: "agent",
  status: isRunning ? "running" : "done",
  start: 0,
  end: isRunning ? undefined : 9000,
  children: Array.from({ length: n }, (_, i) => ({ id: `s${i}`, name: `span ${i}`, kind: "tool" as const, status: isRunning ? ("running" as const) : ("done" as const), start: i, end: isRunning ? undefined : i + 500 })),
});

// The "now" position lives on the time layer, so a tick doesn't restyle every row
const at = (el: Element) => el.querySelector<HTMLElement>(".ui-tw__layer")!.style.getPropertyValue("--tc-trace-waterfall-at");
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="treeitem"]')];
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-trace-waterfall", () => {
  test("the host is the root; the tree is named by the heading", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${done} elapsed="3000" heading="Agent trace"></tc-trace-waterfall>`);
    expect(el.dataset.ui).toBe("tw");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector('[role="tree"]')!.getAttribute("aria-label")).toBe("Agent trace");
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Agent trace");
    expect(el.querySelector(".ui-tw__pill")!.textContent).toBe("Done");
    expect(el.hasAttribute("data-live")).toBe(false);
  });

  test("the own clock reads the real time after the first update and runs while spans run", async () => {
    fakeClock();
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${running} started-at=${1_000_000 - 4000}></tc-trace-waterfall>`);
    expect(at(el)).toBe("4000");
    await advance(el, 1000);
    expect(at(el)).toBe("5000");
  });

  test("the own clock moves running bars and durations, pauses when hidden, and rescales the axis", async () => {
    fakeClock();
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${running} started-at=${1_000_000 - 2000}></tc-trace-waterfall>`);
    const llm = () => rows(el)[1];
    const bar = () => llm().querySelector<HTMLElement>("[data-bar]")!;
    await advance(el, 100);
    await advance(el, 1500);
    expect(bar().style.getPropertyValue("--d")).toBe("3600");
    expect(llm().querySelector(".ui-tw__tag")!.textContent).toBe("3.6s");
    expect(llm().getAttribute("aria-label")).toBeNull();
    expect(llm().textContent!.replace(/\s+/g, "")).toContain("Plan,LLMcall,Running,3.6s");
    expect(el.querySelector(".ui-tw__stat .ui-tw__amount")!.textContent).toBe("3.6s");

    // A hidden tab stops the clock; it catches up when the tab shows again
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    await updates(el);
    expect(el.hasAttribute("data-offscreen")).toBe(true);
    await advance(el, 1000);
    expect(bar().style.getPropertyValue("--d")).toBe("3600");
    visibility.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await updates(el);
    expect(bar().style.getPropertyValue("--d")).toBe("4600");

    // Past the axis, the range rescales
    const ticks = () => [...el.querySelectorAll(".ui-tw__tick:not([data-leaving])")].map((t) => t.textContent);
    const before = ticks();
    await advance(el, 5000);
    await advance(el, 100);
    expect(at(el)).toBe("9700");
    expect(ticks()).not.toEqual(before);
  });

  test("now is epoch ms read against startedAt; elapsed is ms into the run; now alone keeps its old meaning", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${running} started-at="500000" now="503000"></tc-trace-waterfall>`);
    expect(at(el)).toBe("3000");
    el.startedAt = undefined;
    el.now = undefined;
    el.elapsed = 2500;
    await settle();
    expect(at(el)).toBe("2500");
    el.elapsed = undefined;
    el.now = 1200;
    await settle();
    expect(at(el)).toBe("1200");
  });

  test("controlled collapsed: a fold is reported, not applied; uncontrolled it applies", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${running} elapsed="1000"></tc-trace-waterfall>`);
    const seen: string[][] = [];
    const block = (e: Event) => {
      seen.push((e as CustomEvent<{ collapsed: string[] }>).detail.collapsed);
      e.preventDefault();
    };
    el.addEventListener("tc-collapsed-change", block);
    const run = rows(el)[0];
    key(run, "ArrowLeft");
    await settle();
    expect(seen).toEqual([["run"]]);
    expect(run.getAttribute("aria-expanded")).toBe("true");
    el.removeEventListener("tc-collapsed-change", block);
    key(run, "ArrowLeft");
    await settle();
    expect(run.getAttribute("aria-expanded")).toBe("false");
    expect(el.collapsed).toEqual(["run"]);
    // A folded parent shows how many rows it hides, and its children as marks on its bar
    expect(run.querySelector(".ui-tw__more")!.textContent).toBe("+1 folded");
    expect(run.querySelectorAll(".ui-tw__mark")).toHaveLength(1);
  });

  test("opening reports the span with the id", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${running} elapsed="1000"></tc-trace-waterfall>`);
    let got: TraceOpenChange | undefined;
    el.addEventListener("tc-open-change", (e) => (got = ((e as CustomEvent).detail as TraceOpenChange)));
    key(rows(el)[1], "Enter");
    await settle();
    expect(got!.openId).toBe("llm");
    expect(got!.span!.id).toBe("llm");
    expect(el.querySelector('[role="dialog"]')).toBeTruthy();
  });

  test("rows are named by their visible content plus kind and status, with their place among siblings", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${done} elapsed="3000"></tc-trace-waterfall>`);
    const r = rows(el);
    for (const x of r) expect(x.hasAttribute("aria-label")).toBe(false);
    expect(r[1].textContent).toContain("Plan");
    expect(r[1].textContent).toContain("opus");
    expect(r[1].textContent).toContain("LLM call, Done");
    expect(r[2].textContent).toContain("Tool call, Failed");
    expect(r[2].getAttribute("aria-posinset")).toBe("2");
    expect(r[2].getAttribute("aria-setsize")).toBe("3");
    expect(r[2].getAttribute("data-kind")).toBe("tool");
    // The slowest finished call is marked (all three take 1s: the first wins)
    expect(r[1].querySelector(".ui-tw__tag .ui-tw__slow")).toBeTruthy();
  });

  test("Enter moves focus into the details; Escape brings it back to the row", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${done} elapsed="3000"></tc-trace-waterfall>`);
    const row = rows(el)[1];
    row.focus();
    key(row, "Enter");
    await settle();
    const dialog = el.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(document.activeElement).toBe(dialog);
    expect(dialog.getAttribute("aria-label")).toBe("Plan details");
    expect(row.getAttribute("aria-selected")).toBe("true");
    key(dialog, "Escape");
    await settle();
    expect(document.activeElement).toBe(row);
  });

  test("a click opens the details without taking focus from the row; a click outside closes them", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${done} elapsed="3000"></tc-trace-waterfall>`);
    const row = rows(el)[1];
    row.focus();
    row.click();
    await settle();
    expect(el.querySelector('[role="dialog"]')).toBeTruthy();
    expect(document.activeElement).toBe(row);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(el.openId).toBeNull();
  });

  test("moving to another row closes the details, so they never cover the focused row", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${done} elapsed="3000" open-id="a"></tc-trace-waterfall>`);
    const seen: (string | null)[] = [];
    el.addEventListener("tc-open-change", (e) => seen.push(((e as CustomEvent).detail as TraceOpenChange).openId));
    const r = rows(el);
    r[1].focus();
    key(r[1], "ArrowDown");
    await settle();
    expect(seen).toEqual([null]);
    expect(document.activeElement).toBe(r[2]);
  });

  test("the close button returns focus to the row; the page closing the details doesn't drop focus to body", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${done} elapsed="3000" open-id="b"></tc-trace-waterfall>`);
    const block = (e: Event) => e.preventDefault();
    el.addEventListener("tc-open-change", block);
    const close = el.querySelector<HTMLButtonElement>('[aria-label="Close details"]')!;
    close.focus();
    close.click();
    await settle();
    expect(document.activeElement).toBe(rows(el)[2]);
    el.querySelector<HTMLButtonElement>('[aria-label="Close details"]')!.focus();
    el.openId = null;
    await settle();
    await new Promise((r) => setTimeout(r, 300));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement?.getAttribute("role")).toBe("treeitem");
  });

  test("folding the parent of the focused row hands focus to the parent", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${done} elapsed="3000"></tc-trace-waterfall>`);
    const r = rows(el);
    r[2].focus();
    key(r[2], "ArrowLeft"); // to the parent
    await settle();
    expect(document.activeElement).toBe(r[0]);
    key(r[0], "ArrowLeft"); // fold
    await settle();
    expect(r[0].getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(r[0]);
    expect(r[1].getAttribute("aria-hidden")).toBe("true");
    key(r[0], "ArrowRight"); // unfold
    await settle();
    expect(r[0].getAttribute("aria-expanded")).toBe("true");
  });

  test("one row is in the tab order; Home and End move", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${done} elapsed="3000"></tc-trace-waterfall>`);
    expect(rows(el).map((r) => r.tabIndex)).toEqual([0, -1, -1, -1]);
    rows(el)[0].focus();
    key(rows(el)[0], "End");
    await settle();
    expect(document.activeElement).toBe(rows(el)[3]);
    expect(rows(el).map((r) => r.tabIndex)).toEqual([-1, -1, -1, 0]);
    key(rows(el)[3], "Home");
    await settle();
    expect(document.activeElement).toBe(rows(el)[0]);
  });

  test("a long trace renders a window of rows; the keyboard still reaches every row", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${many(500)} elapsed="9000"></tc-trace-waterfall>`);
    const tree = el.querySelector('[role="tree"]')!;
    expect(tree.hasAttribute("data-virtual")).toBe(true);
    expect(rows(el).length).toBeLessThan(100);
    rows(el)[0].focus();
    key(rows(el)[0], "End");
    await settle();
    await settle();
    const last = document.activeElement as HTMLElement;
    expect(last.getAttribute("role")).toBe("treeitem");
    expect(last.textContent).toContain("span 499");
    expect(last.getAttribute("aria-posinset")).toBe("500");
    expect(last.getAttribute("tabindex")).toBe("0");
    key(last, "Home");
    await settle();
    expect((document.activeElement as HTMLElement).textContent).toContain("Run");
  });

  test("short traces render every row", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${many(50)} elapsed="9000"></tc-trace-waterfall>`);
    expect(rows(el)).toHaveLength(51);
    expect(el.querySelector('[role="tree"]')!.hasAttribute("data-virtual")).toBe(false);
  });

  test("the sheen runs on at most 20 running bars and the host pauses its animations off-screen", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${many(40, true)} elapsed="1000"></tc-trace-waterfall>`);
    expect(el.querySelectorAll("[data-bar][data-shine]").length).toBe(20);
    expect(el.hasAttribute("data-offscreen")).toBe(false);
    expect(el.hasAttribute("data-live")).toBe(true);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    await settle();
    expect(el.hasAttribute("data-offscreen")).toBe(true);
  });

  test("the clock position is not set on the host (a tick would restyle every row)", async () => {
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${running} elapsed="1200"></tc-trace-waterfall>`);
    expect(el.style.getPropertyValue("--tc-trace-waterfall-at")).toBe("");
    expect(at(el)).toBe("1200");
    expect(el.style.getPropertyValue("--tc-trace-waterfall-range")).toBe("10000");
  });

  test("costs and tokens add up in the numbers on top; a span's icon element is cloned", async () => {
    const logo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    logo.setAttribute("data-mine", "");
    const root: TraceSpan = { ...done, children: [{ ...done.children![0], cost: 0.05, tokensIn: 1200, tokensOut: 300, icon: logo }, done.children![1]] };
    const el = await fixture<TcTraceWaterfall>(html`<tc-trace-waterfall .root=${root} elapsed="3000"></tc-trace-waterfall>`);
    const stats = Object.fromEntries([...el.querySelectorAll(".ui-tw__stat")].map((s) => [s.querySelector("dt")!.textContent, s.querySelector("dd")!.textContent]));
    expect(stats).toEqual({ Duration: "3.0s", Cost: "$0.05", Tokens: "1.5k", "LLM calls": "1", "Tool calls": "1", Errors: "1" });
    expect(rows(el)[1].querySelector('.ui-tw__icon[data-logo] svg[data-mine]')).toBeTruthy();
    expect(logo.isConnected).toBe(false);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-trace-waterfall .root=${done} elapsed="3000" open-id="b"></tc-trace-waterfall>
      <tc-trace-waterfall look="clean" heading="Clean trace" .root=${running} elapsed="1500"></tc-trace-waterfall>
    </div>`);
    // An animation cancelled by a re-render rejects `finished` (WebKit); that one is done too
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {})));
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
