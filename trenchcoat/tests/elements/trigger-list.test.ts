/*
 * <tc-trigger-list> in real browsers: rows in words, switches, errors, Edit, the Add trigger menu by keyboard, controlled
 * use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/trigger-list";
import { triggerAgo, type AgentTrigger, type TcTriggerList, type TriggerEnabledChange } from "../../src/elements/trigger-list";
import { TriggerList } from "../../src/elements/react/trigger-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 12, 10);
const HOUR = 3_600_000;
const TRIGGERS: AgentTrigger[] = [
  { id: "daily", kind: "schedule", summary: "Every weekday at 09:00", enabled: true, lastFired: NOW - HOUR, fires7d: 5 },
  { id: "hook", kind: "webhook", summary: "POST /hooks/inv-7f3a", enabled: true, lastFired: NOW - 20 * 60_000, fires7d: 1, error: "The last 3 requests had no X-Signature header" },
  { id: "mail", kind: "email", summary: "Email to invoices@example.org", enabled: false, fires7d: 0 },
  { id: "run", kind: "manual", summary: "Someone presses Run", enabled: true },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<any>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (triggers = TRIGGERS) => fixture<TcTriggerList>(html`<tc-trigger-list .triggers=${triggers} .now=${NOW}></tc-trigger-list>`);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-trigger="${id}"]`)!;
const sw = (el: Element, id: string) => row(el, id).querySelector<HTMLInputElement>(".ui-trl__switch")!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-trigger-list", () => {
  test("each row in words: kind, summary, last fired, this week, errors; the count", async () => {
    const el = await mount();
    expect(el.dataset.ui).toBe("trl");
    expect(text(el.querySelector(".ui-trl__count"))).toBe("3 of 4 on");
    expect(text(row(el, "daily").querySelector(".ui-trl__kind"))).toBe("Schedule");
    expect(text(row(el, "daily").querySelector(".ui-trl__facts"))).toBe("Last fired 1 hour ago 5 times this week");
    expect(text(row(el, "hook").querySelector(".ui-trl__facts"))).toBe("Last fired 20 minutes ago Once this week");
    expect(text(row(el, "mail").querySelector(".ui-trl__facts"))).toBe("Hasn't fired yet Not this week");
    expect(text(row(el, "run").querySelector(".ui-trl__facts"))).toBe("Hasn't fired yet");
    expect(text(row(el, "hook").querySelector(".ui-trl__error"))).toBe("Failing: The last 3 requests had no X-Signature header");
    expect(sw(el, "hook").getAttribute("aria-describedby")).toBe(row(el, "hook").querySelector(".ui-trl__error")!.id);
    expect(row(el, "mail").hasAttribute("data-off")).toBe(true);
    expect(text(row(el, "mail").querySelector(".ui-trl__state"))).toBe("Off");
    expect(sw(el, "daily").getAttribute("role")).toBe("switch");
    expect(sw(el, "daily").checked).toBe(true);
    expect(text(row(el, "daily").querySelector("label .tc-sr-only"))).toBe("Run on Every weekday at 09:00");
    expect(triggerAgo(NOW - 2 * 86_400_000, NOW)).toBe("2 days ago");
  });

  test("without now, last fired is a date", async () => {
    const el = await fixture<TcTriggerList>(html`<tc-trigger-list locale="en-GB" .triggers=${[TRIGGERS[0]!]}></tc-trigger-list>`);
    expect(text(row(el, "daily").querySelector(".ui-trl__facts li"))).toMatch(/^Last fired 12 Nov 2026/);
  });

  test("a switch turns a trigger off and says so; prevented, it stays on", async () => {
    const el = await mount();
    const seen: TriggerEnabledChange[] = [];
    on(el, "tc-enabled-change", (e) => seen.push(e.detail));
    sw(el, "daily").click();
    await settle();
    expect(seen.map((d) => [d.id, d.enabled])).toEqual([["daily", false]]);
    expect(el.triggers.find((t) => t.id === "daily")!.enabled).toBe(false);
    expect(text(el.querySelector(".ui-trl__count"))).toBe("2 of 4 on");
    expect(text(el.querySelector('[role="status"]'))).toBe("Turned off: Every weekday at 09:00");
    on(el, "tc-enabled-change", (e) => e.preventDefault());
    sw(el, "mail").click();
    await settle();
    expect(sw(el, "mail").checked).toBe(false);
    expect(el.triggers.find((t) => t.id === "mail")!.enabled).toBe(false);
  });

  test("Edit fires with the trigger", async () => {
    const el = await mount();
    const edits: string[] = [];
    on(el, "tc-edit", (e) => edits.push(e.detail.id));
    const edit = row(el, "hook").querySelector<HTMLButtonElement>(".ui-trl__edit")!;
    expect(text(edit)).toBe("Edit, POST /hooks/inv-7f3a");
    edit.click();
    expect(edits).toEqual(["hook"]);
  });

  test("Add trigger: a menu of kinds by mouse and keyboard; Escape returns focus", async () => {
    const el = await mount();
    const added: string[] = [];
    on(el, "tc-add", (e) => added.push(e.detail.kind));
    const add = el.querySelector<HTMLButtonElement>(".ui-trl__add")!;
    const menu = el.querySelector<HTMLElement>(".ui-trl__menu")!;
    expect(add.getAttribute("aria-haspopup")).toBe("menu");
    expect(menu.hidden).toBe(true);
    add.click();
    await settle();
    expect(add.getAttribute("aria-expanded")).toBe("true");
    const items = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-trl__item")];
    expect(items().map((i) => text(i))).toEqual(["Schedule", "Webhook", "Event", "Email", "Manual"]);
    await expect.poll(() => document.activeElement === items()[0]).toBe(true);
    key(items()[0]!, "ArrowDown");
    await settle();
    await expect.poll(() => document.activeElement === items()[1]).toBe(true);
    key(items()[1]!, "End");
    await settle();
    await expect.poll(() => document.activeElement === items()[4]).toBe(true);
    key(items()[4]!, "Escape");
    await settle();
    expect(menu.hidden).toBe(true);
    await expect.poll(() => document.activeElement === add).toBe(true);
    // ↑ on the button opens it on the last kind
    key(add, "ArrowUp");
    await settle();
    await expect.poll(() => document.activeElement === items()[4]).toBe(true);
    items()[2]!.click();
    await settle();
    expect(added).toEqual(["event"]);
    expect(menu.hidden).toBe(true);
    // Only the kinds offered; none: no Add trigger
    el.kinds = ["schedule", "webhook"];
    await settle();
    expect(items()).toHaveLength(2);
    el.kinds = [];
    await settle();
    expect(el.querySelector(".ui-trl__add")).toBeNull();
  });

  test("a click outside closes the menu", async () => {
    const el = await mount();
    el.querySelector<HTMLButtonElement>(".ui-trl__add")!.click();
    await settle();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-trl__menu")!.hidden).toBe(true);
  });

  test("empty, and renamed words", async () => {
    const el = await fixture<TcTriggerList>(html`<tc-trigger-list .labels=${{ empty: "Nothing starts this agent.", kinds: { manual: "By hand" } }} .triggers=${[]}></tc-trigger-list>`);
    expect(text(el.querySelector(".ui-trl__empty"))).toBe("Nothing starts this agent.");
    el.triggers = [TRIGGERS[3]!];
    await settle();
    expect(text(row(el, "run").querySelector(".ui-trl__kind"))).toBe("By hand");
  });
});

describe("React", () => {
  test("uncontrolled survives a parent re-render; controlled stays until the parent changes it; onEdit and onAdd", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    let rerender = () => {};
    const edits: string[] = [];
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(TriggerList, { title: "Invoice matcher", defaultTriggers: TRIGGERS, now: NOW, onEdit: (id: string) => edits.push(id) });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcTriggerList>("tc-trigger-list")!;
    expect(el.heading).toBe("Invoice matcher");
    await act(async () => sw(el, "daily").click());
    await settle();
    await act(async () => rerender());
    await settle();
    expect(el.triggers.find((t) => t.id === "daily")!.enabled).toBe(false);
    await act(async () => row(el, "hook").querySelector<HTMLButtonElement>(".ui-trl__edit")!.click());
    expect(edits).toEqual(["hook"]);

    const seen: AgentTrigger[][] = [];
    const added: string[] = [];
    await act(async () => root.render(React.createElement(TriggerList, { triggers: TRIGGERS, now: NOW, onTriggersChange: (t: AgentTrigger[]) => seen.push(t), onAdd: (k: string) => added.push(k) })));
    await settle();
    const ctl = host.querySelector<TcTriggerList>("tc-trigger-list")!;
    await act(async () => sw(ctl, "daily").click());
    await settle();
    expect(seen).toHaveLength(1);
    expect(seen[0]!.find((t) => t.id === "daily")!.enabled).toBe(false);
    expect(ctl.triggers).toBe(TRIGGERS);
    expect(sw(ctl, "daily").checked).toBe(true);
    await act(async () => ctl.querySelector<HTMLButtonElement>(".ui-trl__add")!.click());
    await settle();
    await act(async () => ctl.querySelector<HTMLButtonElement>('.ui-trl__item[data-kind="webhook"]')!.click());
    expect(added).toEqual(["webhook"]);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`no axe violations, ${look} ${theme} – with the menu open`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} data-tc-theme=${theme}><tc-trigger-list .triggers=${TRIGGERS} .now=${NOW}></tc-trigger-list></div>`);
        wrap.querySelector<HTMLButtonElement>(".ui-trl__add")!.click();
        await settle();
        await finish(wrap);
        const { violations } = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });

  test("narrow: the kind goes above the summary", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 360px"><tc-trigger-list .triggers=${TRIGGERS} .now=${NOW}></tc-trigger-list></div>`);
    const r = wrap.querySelector<HTMLElement>('[data-trigger="daily"]')!;
    const kind = r.querySelector(".ui-trl__kind")!.getBoundingClientRect();
    const summary = r.querySelector(".ui-trl__summary")!.getBoundingClientRect();
    expect(kind.bottom).toBeLessThanOrEqual(summary.top + 1);
  });
});
