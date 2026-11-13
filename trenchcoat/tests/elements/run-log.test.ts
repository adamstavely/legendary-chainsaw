/*
 * <tc-run-log> in real browsers: columns, status words, relative and absolute times, chips, search and range, errors
 * that open in place, opening a run, the keyboard, live runs held behind Show new, empty and narrow states, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/run-log";
import { filterRuns, type RunLogRun, type TcRunLog } from "../../src/elements/run-log";
import { RunLog } from "../../src/elements/react/run-log";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 3, 11, 0);
const MIN = 60_000;
const RUNS: RunLogRun[] = [
  { id: "a", status: "succeeded", agent: "Policy Q&A", trigger: "Chat", startedAt: NOW - 6 * MIN, duration: 4_200, steps: 2, tokens: 3_100, cost: 0.011, user: "R. Okafor" },
  { id: "b", status: "failed", agent: "Invoice matcher", trigger: "Webhook", startedAt: NOW - 14 * MIN, duration: 31_800, steps: 5, tokens: 41_200, cost: 0.29, error: "Purchase order not found" },
  { id: "c", status: "running", agent: "Invoice matcher", trigger: "Webhook", startedAt: NOW - 1 * MIN, steps: 3 },
  { id: "d", status: "succeeded", agent: "Vendor risk monitor", trigger: "Schedule", startedAt: NOW - 3 * 86_400_000, duration: 70_000, cost: 0.05 },
];
const make = (look: "standard" | "clean" = "standard", runs = RUNS) => fixture<TcRunLog>(html`<tc-run-log look=${look} locale="en-US" .now=${NOW} .runs=${runs}></tc-run-log>`);
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-runl__row")];
const ids = (el: Element) => rows(el).map((r) => r.dataset.id);
const text = (el: Element | null) => el?.textContent!.replace(/\s+/g, " ").trim();
const chip = (el: Element, group: string, v: string) => el.querySelector<HTMLElement>(`.ui-runl__chips[data-group="${group}"] .ui-runl__chip[data-value="${v}"]`)!;
const key = async (el: TcRunLog, k: string, target: Element = document.activeElement!) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await el.updateComplete;
  await settle(el.parentElement!);
};

describe("tc-run-log", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid of runs, newest first, with words, times and one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("runl");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="treegrid"]')!;
      expect(grid.getAttribute("aria-labelledby")).toBe(el.querySelector("h3")!.id);
      expect([...grid.querySelectorAll('[role="columnheader"]')].map(text)).toEqual(["Status", "Agent", "Trigger", "Started", "Duration", "Steps", "Tokens", "Cost", "User"]);
      expect(ids(el)).toEqual(["c", "a", "b", "d"]);
      const cells = (i: number) => [...rows(el)[i].querySelectorAll('[role="gridcell"]')].map(text);
      expect(cells(1)).toEqual(["Succeeded", "Policy Q&A", "Chat", "6 minutes ago", "4.2 s", "2", "3,100", "$0.01", "R. Okafor"]);
      expect(cells(0)[4]).toBe("–");
      expect(cells(3)[3]).toBe("3 days ago");
      expect(cells(3)[4]).toBe("1 min 10 s");
      expect(el.querySelectorAll('.ui-runl__row[tabindex="0"]')).toHaveLength(1);
      expect(text(el.querySelector(".ui-runl__foot"))!.replace(/\s*·\s*/g, " · ")).toBe("4 runs · 1 failed · $0.35");
    });
  }

  test("without now, started is a date and time", async () => {
    const el = await fixture<TcRunLog>(html`<tc-run-log locale="en-US" .runs=${RUNS}></tc-run-log>`);
    expect(text(rows(el)[1].querySelector(".ui-runl__started"))).toMatch(/Nov 3/);
  });

  test("chips filter by status, agent and trigger, with counts; prevented stays", async () => {
    const el = await make();
    expect(text(chip(el, "status", "failed"))).toBe("Failed 1");
    let detail: unknown = null;
    el.addEventListener("tc-filter-change", (e) => (detail = (e as CustomEvent).detail), { once: true });
    chip(el, "agents", "Invoice matcher").click();
    await el.updateComplete;
    expect(detail).toEqual({ filter: { status: [], agents: ["Invoice matcher"], triggers: [] } });
    expect(ids(el)).toEqual(["c", "b"]);
    chip(el, "status", "failed").click();
    await el.updateComplete;
    expect(ids(el)).toEqual(["b"]);
    el.addEventListener("tc-filter-change", (e) => e.preventDefault(), { once: true });
    chip(el, "status", "failed").click();
    await el.updateComplete;
    expect(ids(el)).toEqual(["b"]);
  });

  test("search, range and Clear filters", async () => {
    const el = await make();
    const q = el.querySelector<HTMLInputElement>(".ui-runl__query")!;
    q.value = "purchase";
    q.dispatchEvent(new Event("input"));
    await el.updateComplete;
    expect(ids(el)).toEqual(["b"]);
    expect(el.query).toBe("purchase");
    q.value = "";
    q.dispatchEvent(new Event("input"));
    const range = el.querySelector<HTMLSelectElement>(".ui-runl__range")!;
    range.value = "1h";
    range.dispatchEvent(new Event("change"));
    await el.updateComplete;
    expect(ids(el)).toEqual(["c", "a", "b"]);
    q.value = "nothing like this";
    q.dispatchEvent(new Event("input"));
    await el.updateComplete;
    expect(text(el.querySelector(".ui-runl__empty p"))).toBe("No runs match");
    el.querySelector<HTMLButtonElement>(".ui-runl__clear")!.click();
    await el.updateComplete;
    expect([el.query, el.range, ids(el).length]).toEqual(["", "all", 4]);
  });

  test("filterRuns matches the error text and keeps a range from the reference", () => {
    expect(filterRuns(RUNS, { status: [], agents: [], triggers: [] }, "not found", "all", NOW).map((r) => r.id)).toEqual(["b"]);
    expect(filterRuns(RUNS, { status: [], agents: [], triggers: [] }, "", "24h", NOW).map((r) => r.id)).toEqual(["c", "a", "b"]);
  });

  test("a failed run opens to its error from the keyboard and a click; Enter opens a run", async () => {
    const el = await make();
    const failed = rows(el)[2];
    expect(failed.getAttribute("aria-expanded")).toBe("false");
    expect(rows(el)[0].hasAttribute("aria-expanded")).toBe(false);
    rows(el)[0].focus();
    await key(el, "ArrowDown");
    await key(el, "ArrowDown");
    expect(document.activeElement).toBe(failed);
    let change: unknown = null;
    el.addEventListener("tc-expanded-change", (e) => (change = (e as CustomEvent).detail), { once: true });
    await key(el, "ArrowRight");
    expect(change).toEqual({ expanded: ["b"], id: "b", open: true });
    expect(failed.getAttribute("aria-expanded")).toBe("true");
    const err = el.querySelector(`#${failed.getAttribute("aria-controls")}`)!;
    expect(text(err)).toBe("Error Purchase order not found");
    await key(el, " ");
    expect(el.querySelector(".ui-runl__error")).toBeNull();
    failed.querySelector<HTMLElement>(".ui-runl__toggle")!.click();
    await el.updateComplete;
    expect(el.expanded).toEqual(["b"]);
    let opened: unknown = null;
    el.addEventListener("tc-run-open", (e) => (opened = (e as CustomEvent).detail.id));
    await key(el, "Home");
    await key(el, "Enter");
    expect(opened).toBe("c");
    rows(el)[3].click();
    expect(opened).toBe("d");
  });

  test("chip groups are one tab stop each and move with arrows", async () => {
    const el = await make();
    const group = el.querySelector('.ui-runl__chips[data-group="status"]')!;
    expect(group.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    (group.querySelector('[tabindex="0"]') as HTMLElement).focus();
    await key(el, "ArrowRight");
    expect(document.activeElement).toBe(group.querySelectorAll(".ui-runl__chip")[1]);
  });

  test("live: new runs wait behind Show new, are announced, and come in on demand", async () => {
    const el = await make();
    el.live = true;
    await el.updateComplete;
    const fresh: RunLogRun = { id: "z", status: "running", agent: "Policy Q&A", trigger: "Chat", startedAt: NOW };
    el.runs = [fresh, { ...fresh, id: "y" }, ...RUNS];
    await el.updateComplete;
    expect(ids(el)).toEqual(["c", "a", "b", "d"]);
    expect(text(el.querySelector(".ui-runl__new"))).toBe("Show 2 new runs");
    await expect.poll(() => el.querySelector('[role="status"]')!.textContent).toBe("2 new runs");
    let shown: unknown = null;
    el.addEventListener("tc-show-new", (e) => (shown = (e as CustomEvent).detail));
    el.querySelector<HTMLButtonElement>(".ui-runl__new")!.click();
    await settle(el.parentElement!);
    expect(shown).toEqual({ ids: ["z", "y"] });
    expect(ids(el).slice(0, 2)).toEqual(["z", "y"]);
    await expect.poll(() => document.activeElement).toBe(rows(el)[0]);
    expect(el.querySelector(".ui-runl__new")).toBeNull();
  });

  test("no runs and narrow width", async () => {
    const empty = await make("standard", []);
    expect(text(empty.querySelector(".ui-runl__empty"))).toBe("No runs yet");
    const el = await make();
    el.style.width = "380px";
    await settle(el.parentElement!);
    await expect.poll(() => getComputedStyle(rows(el)[0].querySelector(".ui-runl__tokens")!).display).toBe("none");
    expect(getComputedStyle(rows(el)[0].querySelector(".ui-runl__cost")!).display).not.toBe("none");
  });

  test("React: uncontrolled filter survives re-renders; controlled expanded stays until changed", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(RunLog, { runs: RUNS, now: NOW, locale: "en-US" })));
    const el = host.querySelector("tc-run-log") as TcRunLog;
    await settle(host);
    await act(async () => chip(el, "triggers", "Webhook").click());
    await act(async () => root.render(React.createElement(RunLog, { runs: RUNS, now: NOW, locale: "en-US", title: "History" })));
    expect(el.filter.triggers).toEqual(["Webhook"]);
    let told: unknown = null;
    await act(async () => root.render(React.createElement(RunLog, { runs: RUNS, now: NOW, expanded: [], onExpandedChange: (x) => (told = x) })));
    await settle(host);
    await act(async () => el.querySelector<HTMLElement>(".ui-runl__toggle")!.click());
    await settle(host);
    expect(el.expanded).toEqual([]);
    expect(told).toEqual(["b"]);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: ${look} ${theme}`, async () => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        const el = await make(look);
        el.live = true;
        el.expanded = ["b"];
        await el.updateComplete;
        el.runs = [{ id: "n", status: "queued", agent: "Policy Q&A", trigger: "Chat", startedAt: NOW }, ...RUNS];
        await finish(el.parentElement!);
        const r = await axe.run(el);
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        expect(r.violations.flatMap((v) => [v.id, ...v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary)])).toEqual([]);
      });
});
