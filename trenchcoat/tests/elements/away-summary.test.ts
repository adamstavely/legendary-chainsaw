/*
 * <tc-away-summary> in real browsers: how long the person was away, the Needs you / Failed / Done groups, newest first,
 * the actions as a cancelable tc-item-action (links included), the Done disclosure, Mark all seen, the empty line, the
 * React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/away-summary";
import { awayFor, type AwayItem, type AwayItemAction, type TcAwaySummary } from "../../src/elements/away-summary";
import { AwaySummary } from "../../src/elements/react/away-summary";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const NOW = Date.UTC(2026, 10, 10, 9, 30);
const MIN = 60_000;
const ITEMS: AwayItem[] = [
  { id: "n1", status: "needs-you", title: "Two vendor files", detail: "Pick one", agent: "Records agent", at: NOW - 40 * MIN, action: "Decide" },
  { id: "n2", status: "needs-you", title: "Publish the summary?", at: NOW - 10 * MIN },
  { id: "f1", status: "failed", title: "Tax ID check", detail: "Timed out", at: NOW - 70 * MIN },
  { id: "d1", status: "done", title: "Classified contracts", at: NOW - 30 * MIN, href: "#contracts" },
  { id: "d2", status: "done", title: "Matched invoices", at: NOW - 120 * MIN },
];

const tod = (at: number) => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(at).replace(/\s/g, " ");
const summary = (items: AwayItem[] = ITEMS) =>
  fixture<TcAwaySummary>(html`<tc-away-summary .since=${NOW - (3 * 60 + 12) * MIN} .now=${NOW} locale="en-US" .items=${items}></tc-away-summary>`);
const group = (el: Element, status: string) => el.querySelector<HTMLElement>(`.ui-aws__group[data-status="${status}"]`);
const titles = (root: Element | null) => [...(root?.querySelectorAll(".ui-aws__title") ?? [])].map((t) => t.textContent);
const btn = (el: Element, text: string) => [...el.querySelectorAll<HTMLElement>("button, a")].find((b) => b.textContent!.trim().startsWith(text));
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};

describe("tc-away-summary", () => {
  test("the host is the root in both looks", async () => {
    const el = await summary();
    expect(el.dataset.ui).toBe("aws");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(".ui-aws__root > .tc-head")).not.toBeNull();
    el.look = "clean";
    await settle();
    expect(el.querySelector(".ui-aws__card > .tc-head")).not.toBeNull();
  });

  test("says how long you were away and since when", async () => {
    const el = await summary();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("While you were away");
    expect(el.querySelector(".tc-head__sub")!.textContent!.replace(/\s+/g, " ")).toBe(`You were away 3 h 12 min · , since ${tod(NOW - (3 * 60 + 12) * MIN)}`);
    expect(awayFor(45 * MIN)).toBe("45 min");
    expect(awayFor(2 * 60 * MIN)).toBe("2 h");
    expect(awayFor((50 * 60 + 5) * MIN)).toBe("2 d 2 h");
    const section = el.querySelector("section")!;
    expect(document.getElementById(section.getAttribute("aria-labelledby")!)!.textContent).toBe("While you were away");
  });

  test("groups, newest first; each group a section named by its label and count", async () => {
    const el = await summary();
    expect(titles(group(el, "needs-you"))).toEqual(["Publish the summary?", "Two vendor files"]);
    expect(titles(group(el, "failed"))).toEqual(["Tax ID check"]);
    const needs = group(el, "needs-you")!;
    expect(document.getElementById(needs.getAttribute("aria-labelledby")!)!.textContent!.replace(/\s+/g, " ").trim()).toBe("Needs you 2");
    expect(needs.querySelector(".ui-aws__detail")!.textContent!.replace(/\s+/g, " ")).toBe(tod(NOW - 10 * MIN));
    expect(needs.querySelectorAll(".ui-aws__item")[1].querySelector(".ui-aws__detail")!.textContent!.replace(/\s+/g, " ")).toBe(`Pick one · , Records agent · ${tod(NOW - 40 * MIN)}`);
    // Done: folded to a count
    const toggle = el.querySelector<HTMLButtonElement>(".ui-aws__toggle")!;
    expect(toggle.textContent!.trim()).toBe("2 done");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)!.hidden).toBe(true);
  });

  test("actions: the item's own label, Retry and Open fire a cancelable tc-item-action", async () => {
    const el = await summary();
    const seen = listen<AwayItemAction>(el, "tc-item-action");
    const decide = btn(el, "Decide")!;
    expect(decide.textContent!.replace(/\s+/g, " ").trim()).toBe("Decide: Two vendor files");
    decide.click();
    btn(el, "Review")!.click();
    btn(el, "Retry")!.click();
    expect(seen.map((s) => [s.id, s.action])).toEqual([["n1", "decide"], ["n2", "review"], ["f1", "retry"]]);
    expect(seen[0].item.title).toBe("Two vendor files");
    // Open is a link; prevented, it isn't followed
    el.expanded = true;
    await settle();
    const open = btn(el, "Open")! as HTMLAnchorElement;
    expect(open.getAttribute("href")).toBe("#contracts");
    listen(el, "tc-item-action", true);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    open.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(seen.at(-1)!.action).toBe("open");
  });

  test("the Done disclosure: a cancelable tc-expanded-change", async () => {
    const el = await summary();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-aws__toggle")!;
    const seen = listen<{ expanded: boolean }>(el, "tc-expanded-change");
    toggle.click();
    await settle();
    expect(seen).toEqual([{ expanded: true }]);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(titles(group(el, "done"))).toEqual(["Classified contracts", "Matched invoices"]);
    listen(el, "tc-expanded-change", true);
    toggle.click();
    await settle();
    expect(el.expanded).toBe(true);
  });

  test("Mark all seen: a cancelable tc-seen with the ids, then one line and focus on it", async () => {
    const el = await summary();
    const prevent = listen(el, "tc-seen", true);
    btn(el, "Mark all seen")!.click();
    await settle();
    expect(prevent).toHaveLength(1);
    expect(el.seen).toBe(false);
    const other = await summary();
    const seen = listen<{ ids: string[] }>(other, "tc-seen");
    const mark = btn(other, "Mark all seen")!;
    mark.focus();
    mark.click();
    await settle();
    expect(seen).toEqual([{ ids: ["n1", "n2", "f1", "d1", "d2"] }]);
    expect(other.seen).toBe(true);
    expect(other.querySelector(".ui-aws__line-text")!.textContent).toBe("You're all caught up");
    expect(other.querySelector('[role="status"]')!.textContent).toBe("You're all caught up");
    await expect.poll(() => document.activeElement).toBe(other.querySelector(".ui-aws__line"));
  });

  test("nothing new is one line; renamed labels; narrow width", async () => {
    const el = await summary([]);
    expect(el.querySelector(".ui-aws__card")).toBeNull();
    expect(el.querySelector(".ui-aws__line-text")!.textContent).toBe("Nothing new while you were away");
    expect(el.querySelector(".ui-aws__line-away")!.textContent).toContain("You were away 3 h 12 min");
    el.items = ITEMS;
    el.labels = { needsYou: "Waiting on you", retry: "Try again", markSeen: "Got it" };
    await settle();
    expect(group(el, "needs-you")!.querySelector("h4")!.textContent).toContain("Waiting on you");
    expect(btn(el, "Try again")).toBeTruthy();
    expect(btn(el, "Got it")).toBeTruthy();
    el.style.width = "300px";
    await settle();
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
    // No `since`: no away line
    const bare = await fixture<TcAwaySummary>(html`<tc-away-summary .items=${ITEMS}></tc-away-summary>`);
    expect(bare.querySelector(".tc-head__sub")).toBeNull();
  });

  test("React wrapper: uncontrolled Done survives a re-render; onItemAction and onSeen", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onItemAction = vi.fn();
    const onSeen = vi.fn();
    const draw = (title: string) => root.render(React.createElement(AwaySummary, { title, since: NOW - 60 * MIN, now: NOW, items: ITEMS, onItemAction, onSeen, className: "consumer" }));
    await act(async () => draw("Away"));
    await settle();
    const el = host.querySelector("tc-away-summary")!;
    expect(el.classList.contains("consumer")).toBe(true);
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-aws__toggle")!.click());
    await act(async () => draw("Back again"));
    await settle();
    expect(el.expanded).toBe(true);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Back again");
    await act(async () => btn(el, "Retry")!.click());
    expect(onItemAction).toHaveBeenCalledWith("retry", ITEMS[2], expect.any(Event));
    await act(async () => btn(el, "Mark all seen")!.click());
    await settle();
    expect(onSeen).toHaveBeenCalledWith(["n1", "n2", "f1", "d1", "d2"], expect.any(Event));
    expect(el.seen).toBe(true);
    await act(async () => root.unmount());
  });

  test("React wrapper, controlled: expanded and seen stay with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onExpandedChange = vi.fn();
    await act(async () => root.render(React.createElement(AwaySummary, { items: ITEMS, expanded: false, seen: false, onExpandedChange })));
    await settle();
    const el = host.querySelector("tc-away-summary")!;
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-aws__toggle")!.click());
    await settle();
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(el.expanded).toBe(false);
    await act(async () => btn(el, "Mark all seen")!.click());
    await settle();
    expect(el.seen).toBe(false);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-away-summary look=${look} .since=${NOW - 90 * MIN} .now=${NOW} .items=${ITEMS} expanded></tc-away-summary>
            <tc-away-summary look=${look} .since=${NOW - 90 * MIN} .now=${NOW}></tc-away-summary>
            <tc-away-summary look=${look} .items=${ITEMS} seen></tc-away-summary>
          </div>`,
        );
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
