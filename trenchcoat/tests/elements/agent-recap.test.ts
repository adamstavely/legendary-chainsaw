/*
 * <tc-agent-recap> in real browsers: the period and totals, the binned chart and its entrance, the markers (one tab stop,
 * arrows, what each says), the board grouped and sorted, Approve / Retry gliding an item out, Open as a link, Clear
 * done, the narrow stack, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/agent-recap";
import { recapBins, type RecapEvent, type RecapItem, type RecapItemAction, type TcAgentRecap } from "../../src/elements/agent-recap";
import { AgentRecap } from "../../src/elements/react/agent-recap";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const MIN = 60_000;
const SINCE = new Date(2026, 10, 9, 18, 40).getTime();
const NOW = new Date(2026, 10, 10, 7, 30).getTime();
const EVENTS: RecapEvent[] = [
  { at: SINCE + 10 * MIN, kind: "done" },
  { at: SINCE + 12 * MIN, kind: "done" },
  { at: SINCE + 95 * MIN, kind: "failed", label: "Tax ID check timed out" },
  { at: SINCE + 250 * MIN, kind: "needs-you", label: "Two files for Northwind" },
  { at: SINCE + 300 * MIN, kind: "done", label: "Big batch finished", notable: true },
];
const ITEMS: RecapItem[] = [
  { id: "n1", status: "needs-you", title: "Two vendor files", agent: "Records agent", at: SINCE + 250 * MIN, href: "#vendors" },
  { id: "n2", status: "needs-you", title: "Publish the summary?", at: SINCE + 600 * MIN },
  { id: "f1", status: "failed", title: "Tax ID check", detail: "Timed out", at: SINCE + 95 * MIN },
  { id: "d1", status: "done", title: "Classified contracts", at: NOW - 50 * MIN, href: "#contracts" },
  { id: "d2", status: "done", title: "Matched invoices", at: NOW - 180 * MIN },
];

const recap = (extra = "") =>
  fixture<TcAgentRecap>(
    extra === "still"
      ? html`<tc-agent-recap still .since=${SINCE} .now=${NOW} locale="en-US" .events=${EVENTS} .items=${ITEMS}></tc-agent-recap>`
      : html`<tc-agent-recap .since=${SINCE} .now=${NOW} locale="en-US" .events=${EVENTS} .items=${ITEMS}></tc-agent-recap>`,
  );
const col = (el: Element, kind: string) => el.querySelector<HTMLElement>(`.ui-arcp__col[data-kind="${kind}"]`)!;
const titles = (root: Element) => [...root.querySelectorAll(".ui-arcp__title")].map((t) => t.textContent);
const btn = (root: Element, text: string) => [...root.querySelectorAll<HTMLElement>("button, a")].find((b) => b.textContent!.trim().startsWith(text));
const markers = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-arcp__marker")];
const key = async (target: Element, k: string) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await settle();
};
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const tod = (at: number) => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(at);

describe("tc-agent-recap", () => {
  test("the host is the root in both looks", async () => {
    const el = await recap("still");
    expect(el.dataset.ui).toBe("arcp");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(".ui-arcp__root > .tc-head")).not.toBeNull();
    el.look = "clean";
    await settle();
    expect(el.querySelector(".ui-arcp__card > .tc-head")).not.toBeNull();
    expect(el.querySelector(".ui-arcp__card > .ui-arcp__board")).not.toBeNull();
  });

  test("the header: since when (yesterday), the totals and Clear done", async () => {
    const el = await recap("still");
    expect(el.querySelector(".tc-head__sub")!.textContent).toBe(`Since ${tod(SINCE)} yesterday`);
    expect(el.querySelector(".ui-arcp__totals")!.textContent).toBe("2 need you · 1 failed · 2 done");
    expect(btn(el, "Clear done")).toBeTruthy();
    el.since = NOW - 60 * MIN;
    await settle();
    expect(el.querySelector(".tc-head__sub")!.textContent).toBe(`Since ${tod(NOW - 60 * MIN)}`);
  });

  test("bins: 30 minutes over a long night, 15 over a short one, events counted by kind", async () => {
    const long = recapBins(EVENTS, SINCE, NOW);
    expect(long.size).toBe(30 * MIN);
    expect(long.bins).toHaveLength(Math.ceil((NOW - SINCE) / (30 * MIN)));
    expect(long.bins[0]).toEqual({ done: 2, failed: 0, "needs-you": 0 });
    expect(long.bins[3]).toEqual({ done: 0, failed: 1, "needs-you": 0 });
    expect(recapBins(EVENTS, SINCE, SINCE + 3 * 60 * MIN).size).toBe(15 * MIN);
    // Too many bars: the bins widen
    expect(recapBins([], SINCE, SINCE + 7 * 24 * 60 * MIN).bins.length).toBeLessThanOrEqual(64);
    const el = await recap("still");
    expect(el.querySelectorAll(".ui-arcp__bin")).toHaveLength(long.bins.length);
    const done = el.querySelector<SVGRectElement>('.ui-arcp__bin .ui-arcp__bar[data-kind="done"]')!;
    expect(Number(done.getAttribute("height"))).toBeGreaterThan(0);
  });

  test("the entrance: bars grow from nothing once on screen, then rest", async () => {
    const el = await recap();
    // The first bin is the busiest: it grows to the plot's full 56 units
    const first = () => Number(el.querySelector<SVGRectElement>('.ui-arcp__bar[data-kind="done"]')!.getAttribute("height"));
    expect(first()).toBeLessThan(56);
    await expect.poll(first, { timeout: 4000 }).toBeCloseTo(56, 0);
    const still = await recap("still");
    expect(Number(still.querySelector('.ui-arcp__bar[data-kind="done"]')!.getAttribute("height"))).toBeCloseTo(56, 0);
  });

  test("markers: notable events only, one tab stop, arrows move, the caption says what happened", async () => {
    const el = await recap("still");
    const m = markers(el);
    expect(m).toHaveLength(3);
    expect(m.map((b) => b.dataset.kind)).toEqual(["failed", "needs-you", "done"]);
    expect(m.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    expect(m[0].getAttribute("aria-label")).toBe(`Tax ID check timed out – Failed, ${tod(SINCE + 95 * MIN)}`);
    m[0].focus();
    await settle();
    expect(el.querySelector(".ui-arcp__caption")!.textContent!.replace(/\s+/g, " ").trim()).toBe(`${tod(SINCE + 95 * MIN)} · Tax ID check timed out`);
    await key(m[0], "ArrowRight");
    await expect.poll(() => document.activeElement).toBe(markers(el)[1]);
    expect(markers(el).map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
    await key(document.activeElement!, "End");
    await expect.poll(() => document.activeElement).toBe(markers(el)[2]);
    await key(document.activeElement!, "Home");
    await expect.poll(() => document.activeElement).toBe(markers(el)[0]);
    const group = el.querySelector('[role="group"]')!;
    expect(group.getAttribute("aria-label")).toBe(`What happened, Since ${tod(SINCE)} yesterday`);
  });

  test("the board: three columns, newest first, each named by its label", async () => {
    const el = await recap("still");
    expect(titles(col(el, "needs-you"))).toEqual(["Publish the summary?", "Two vendor files"]);
    expect(titles(col(el, "failed"))).toEqual(["Tax ID check"]);
    expect(titles(col(el, "done"))).toEqual(["Classified contracts", "Matched invoices"]);
    const needs = col(el, "needs-you");
    expect(document.getElementById(needs.getAttribute("aria-labelledby")!)!.textContent!.replace(/\s+/g, " ").trim()).toBe("Needs you 2");
    expect(btn(needs, "Approve")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Approve: Publish the summary?");
    expect((btn(needs, "Open") as HTMLAnchorElement).getAttribute("href")).toBe("#vendors");
  });

  test("Approve and Retry: a cancelable tc-item-action, then the item glides out", async () => {
    const el = await recap();
    const seen = listen<RecapItemAction>(el, "tc-item-action");
    btn(col(el, "failed"), "Retry")!.click();
    await settle();
    expect(seen.map((s) => [s.id, s.action])).toEqual([["f1", "retry"]]);
    await finish(el);
    await expect.poll(() => titles(col(el, "failed"))).toEqual([]);
    expect(col(el, "failed").querySelector(".ui-arcp__empty")!.textContent).toBe("Nothing here");
    expect(el.querySelector(".ui-arcp__totals")!.textContent).toBe("2 need you · 0 failed · 2 done");
    // Prevented: it stays
    listen(el, "tc-item-action", true);
    btn(col(el, "needs-you"), "Approve")!.click();
    await settle();
    await finish(el);
    expect(titles(col(el, "needs-you"))).toHaveLength(2);
  });

  test("Open is a link that a prevented tc-item-action keeps from being followed; it doesn't leave", async () => {
    const el = await recap("still");
    listen(el, "tc-item-action", true);
    const open = btn(col(el, "done"), "Open")!;
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    open.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    await settle();
    expect(titles(col(el, "done"))).toHaveLength(2);
  });

  test("Clear done: a cancelable tc-clear-done with the ids", async () => {
    const el = await recap("still");
    const prevent = listen(el, "tc-clear-done", true);
    btn(el, "Clear done")!.click();
    await settle();
    expect(prevent).toEqual([{ ids: ["d1", "d2"] }]);
    expect(titles(col(el, "done"))).toHaveLength(2);
    const other = await recap("still");
    const seen = listen<{ ids: string[] }>(other, "tc-clear-done");
    btn(other, "Clear done")!.click();
    await settle();
    expect(seen).toEqual([{ ids: ["d1", "d2"] }]);
    await expect.poll(() => titles(col(other, "done"))).toEqual([]);
    expect(btn(other, "Clear done")).toBeUndefined();
    // New items with the same ids come back
    other.items = [...ITEMS];
    await settle();
    expect(titles(col(other, "done"))).toEqual([]);
    other.items = ITEMS.filter((i) => i.id !== "d1");
    await settle();
    other.items = [...ITEMS];
    await settle();
    expect(titles(col(other, "done"))).toEqual(["Classified contracts"]);
  });

  test("empty, renamed labels, and narrow: the columns stack", async () => {
    const el = await fixture<TcAgentRecap>(html`<tc-agent-recap still .now=${NOW}></tc-agent-recap>`);
    expect(markers(el)).toHaveLength(0);
    expect(el.querySelectorAll(".ui-arcp__empty")).toHaveLength(3);
    const full = await recap("still");
    full.labels = { needsYou: "Waiting on you", approve: "Go ahead", clearDone: "Tidy up" };
    await settle();
    expect(col(full, "needs-you").querySelector(".ui-arcp__col-name")!.textContent).toBe("Waiting on you");
    expect(btn(full, "Go ahead")).toBeTruthy();
    expect(btn(full, "Tidy up")).toBeTruthy();
    full.style.width = "420px";
    await settle();
    const [a, b] = [col(full, "needs-you"), col(full, "failed")].map((c) => c.getBoundingClientRect());
    expect(b.top).toBeGreaterThan(a.top);
    expect(full.scrollWidth).toBeLessThanOrEqual(full.clientWidth + 1);
  });

  test("React wrapper: title, onItemAction and onClearDone", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onItemAction = vi.fn();
    const onClearDone = vi.fn();
    const draw = (title: string) => root.render(React.createElement(AgentRecap, { title, still: true, since: SINCE, now: NOW, events: EVENTS, items: ITEMS, onItemAction, onClearDone, className: "consumer" }));
    await act(async () => draw("Overnight"));
    await settle();
    const el = host.querySelector("tc-agent-recap")!;
    expect(el.classList.contains("consumer")).toBe(true);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Overnight");
    await act(async () => btn(col(el, "failed"), "Retry")!.click());
    expect(onItemAction).toHaveBeenCalledWith("retry", ITEMS[2], expect.any(Event));
    await act(async () => draw("Overnight, again"));
    await settle();
    await expect.poll(() => titles(col(el, "failed"))).toEqual([]);
    await act(async () => btn(el, "Clear done")!.click());
    expect(onClearDone).toHaveBeenCalledWith(["d1", "d2"], expect.any(Event));
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-agent-recap look=${look} .since=${SINCE} .now=${NOW} .events=${EVENTS} .items=${ITEMS}></tc-agent-recap>
            <tc-agent-recap look=${look} .now=${NOW}></tc-agent-recap>
          </div>`,
        );
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
