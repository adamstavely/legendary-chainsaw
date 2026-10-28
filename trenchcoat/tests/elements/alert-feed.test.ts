/*
 * <tc-alert-feed> in real browsers: newest first, category, severity in words and marks, relative times, the header's
 * counts, actions and acknowledging, pausing with new alerts held, announcements, the keyboard, the element's own
 * clock, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/alert-feed";
import type { AlertActionEvent, AlertItem, AlertPausedChange, TcAlertFeed } from "../../src/elements/alert-feed";
import { alertTime } from "../../src/elements/alert-feed";
import { AlertFeed } from "../../src/elements/react/alert-feed";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const MIN = 60_000;
const NOW = new Date(2026, 9, 27, 9, 45).getTime();
const ITEMS: AlertItem[] = [
  { id: "b", category: "Location", severity: "high", title: "Payout to a new bank account", subject: "Lumen Freight · MER-9011", source: "Case 23-0461", time: NOW - 4 * MIN },
  { id: "a", category: "Payment", severity: "critical", title: "Card used in two countries", subject: "Dana Okafor · CUS-0098 · Geneva", time: NOW - 20_000 },
  { id: "d", category: "Sign-in", severity: "info", title: "Password reset", time: NOW - 26 * 60 * MIN, acknowledged: true },
  { id: "c", category: "Document", severity: "medium", title: "ID failed the liveness check", time: NOW - 3 * 60 * MIN, actions: [{ id: "review", label: "Review", tone: "primary" }] },
];

const alert = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-alert="${id}"]`)!;
const titles = (el: Element) => [...el.querySelectorAll(".ui-afd__title")].map((t) => t.textContent);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const make = (look: "standard" | "clean" = "standard", items = ITEMS) =>
  fixture<TcAlertFeed>(html`<tc-alert-feed look=${look} description="Accounts and payments." .items=${items} .now=${NOW}></tc-alert-feed>`);

describe("tc-alert-feed", () => {
  test("alertTime: just now, minutes, hours, then the date", () => {
    expect(alertTime(NOW - 20_000, NOW)).toBe("just now");
    expect(alertTime(NOW - 4 * MIN, NOW)).toBe("4m ago");
    expect(alertTime(NOW - 3 * 60 * MIN, NOW)).toBe("3h ago");
    expect(alertTime(NOW - 26 * 60 * MIN, NOW, "en-GB")).toMatch(/26 Oct/);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: newest first, with category, severity in words and a mark, subject, source and time; one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("afd");
      expect(el.dataset.look).toBe(look);
      expect(titles(el)).toEqual(["Card used in two countries", "Payout to a new bank account", "ID failed the liveness check", "Password reset"]);
      const a = alert(el, "a");
      expect(a.dataset.severity).toBe("critical");
      expect(a.querySelector(".ui-afd__category")!.textContent).toBe("Payment");
      expect(a.querySelector(".ui-afd__severity")!.textContent).toBe("Critical");
      expect(a.querySelector(".ui-afd__mark svg")).toBeTruthy();
      expect(a.querySelector(".ui-afd__subject-line")!.textContent).toBe("Dana Okafor · CUS-0098 · Geneva");
      expect(a.querySelector(".ui-afd__time")!.textContent).toBe("just now");
      expect(alert(el, "b").querySelector(".ui-afd__source")!.textContent).toBe("Case 23-0461");
      expect(alert(el, "b").querySelector(".ui-afd__time")!.textContent).toBe("4m ago");
      // Named by the title, described by severity, category, subject and state
      expect(document.getElementById(a.getAttribute("aria-labelledby")!)!.textContent).toBe("Card used in two countries");
      expect(document.getElementById(alert(el, "d").getAttribute("aria-describedby")!)!.textContent).toBe("Info · Sign-in · Acknowledged");
      expect(el.querySelectorAll('.ui-afd__alert[tabindex="0"]')).toHaveLength(1);
      expect(a.getAttribute("tabindex")).toBe("0");
    });
  }

  test("the header: events today, critical still open, Pause feed; todayCount overrides the count", async () => {
    const el = await make();
    // Today: a, b and c – d was yesterday
    expect(el.querySelector(".ui-afd__live")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Live · 3 events today");
    expect(el.querySelector(".ui-afd__critical")!.textContent).toBe("1 critical");
    el.todayCount = 37;
    await settle();
    expect(el.querySelector(".ui-afd__live")!.textContent).toContain("37 events today");
  });

  test("actions: the defaults, or the alert's own; Acknowledge quiets an alert and moves the focus to it; prevented, it stays", async () => {
    const el = await make();
    const seen: AlertActionEvent[] = [];
    el.addEventListener("tc-action", (e) => seen.push((e as CustomEvent<AlertActionEvent>).detail));
    const labels = (id: string) => [...alert(el, id).querySelectorAll(".ui-afd__btn")].map((b) => b.textContent);
    expect(labels("a")).toEqual(["Escalate", "Acknowledge"]);
    expect(labels("c")).toEqual(["Review"]);
    // Already acknowledged: no Acknowledge, and it says so
    expect(labels("d")).toEqual(["Escalate"]);
    expect(alert(el, "d").querySelector(".ui-afd__done")!.textContent).toBe("Acknowledged");
    alert(el, "a").querySelector<HTMLButtonElement>('[data-action="acknowledge"]')!.focus();
    alert(el, "a").querySelector<HTMLButtonElement>('[data-action="acknowledge"]')!.click();
    await settle();
    expect(alert(el, "a").hasAttribute("data-acked")).toBe(true);
    expect(labels("a")).toEqual(["Escalate"]);
    await expect.poll(() => document.activeElement).toBe(alert(el, "a"));
    expect(status(el)).toBe("Acknowledged: Card used in two countries");
    // The critical count only counts what's still open
    expect(el.querySelector(".ui-afd__critical")).toBeNull();
    el.addEventListener("tc-action", (e) => e.preventDefault(), { once: true });
    alert(el, "b").querySelector<HTMLButtonElement>('[data-action="acknowledge"]')!.click();
    await settle();
    expect(alert(el, "b").hasAttribute("data-acked")).toBe(false);
    alert(el, "b").querySelector<HTMLButtonElement>('[data-action="escalate"]')!.click();
    expect(seen.map((s) => [s.id, s.action])).toEqual([
      ["a", "acknowledge"],
      ["b", "acknowledge"],
      ["b", "escalate"],
    ]);
  });

  test("new alerts slide in and are announced – one by its title, several as a count", async () => {
    const el = await make();
    expect(el.querySelector(".ui-afd__alert[data-new]")).toBeNull();
    const one: AlertItem = { id: "n1", category: "Device", severity: "high", title: "New device trusted", time: NOW };
    el.items = [one, ...ITEMS];
    await settle();
    expect(alert(el, "n1").hasAttribute("data-new")).toBe(true);
    expect(status(el)).toBe("New high alert: New device trusted");
    el.items = [
      { id: "n2", category: "Payment", severity: "critical", title: "Card tested", time: NOW },
      { id: "n3", category: "Payment", severity: "medium", title: "Large refund", time: NOW },
      one,
      ...ITEMS,
    ];
    await settle();
    expect(status(el)).toBe("2 new alerts, 1 critical");
  });

  test("Pause holds new alerts behind “Show N new”; Resume shows them; tc-paused-change is cancelable", async () => {
    const el = await make();
    const seen: AlertPausedChange[] = [];
    el.addEventListener("tc-paused-change", (e) => seen.push((e as CustomEvent<AlertPausedChange>).detail));
    const pause = el.querySelector<HTMLButtonElement>(".ui-afd__pause")!;
    pause.click();
    await settle();
    expect(el.paused).toBe(true);
    expect(pause.getAttribute("aria-pressed")).toBe("true");
    expect(pause.textContent).toBe("Resume feed");
    expect(el.querySelector(".ui-afd__live")!.textContent).toContain("Paused");
    el.items = [{ id: "n1", category: "Device", severity: "high", title: "New device trusted", time: NOW }, ...ITEMS];
    await settle();
    expect(alert(el, "n1")).toBeNull();
    expect(el.querySelector(".ui-afd__waiting")!.textContent).toBe("Show 1 new alert");
    expect(status(el)).toBe("1 new alert waiting");
    el.querySelector<HTMLButtonElement>(".ui-afd__waiting")!.click();
    await settle();
    expect(el.paused).toBe(false);
    expect(alert(el, "n1")).toBeTruthy();
    expect(status(el)).toBe("New high alert: New device trusted");
    el.addEventListener("tc-paused-change", (e) => e.preventDefault(), { once: true });
    pause.click();
    await settle();
    expect(el.paused).toBe(false);
    expect(seen).toEqual([{ paused: true }, { paused: false }, { paused: true }]);
  });

  test("keyboard: ↑ ↓ between alerts, Home / End; only the focused alert's actions are in the tab order", async () => {
    const el = await make();
    const at = () => (document.activeElement as HTMLElement | null)?.dataset.alert;
    alert(el, "a").focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('.ui-afd__alert[tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowDown");
    expect(at()).toBe("b");
    expect([...alert(el, "b").querySelectorAll(".ui-afd__btn")].map((b) => b.getAttribute("tabindex"))).toEqual(["0", "0"]);
    expect([...alert(el, "a").querySelectorAll(".ui-afd__btn")].map((b) => b.getAttribute("tabindex"))).toEqual(["-1", "-1"]);
    await press("End");
    expect(at()).toBe("d");
    await press("ArrowDown");
    expect(at()).toBe("d");
    await press("Home");
    expect(at()).toBe("a");
    // Keys on an action button don't move between alerts
    const btn = alert(el, "a").querySelector<HTMLButtonElement>(".ui-afd__btn")!;
    btn.focus();
    key(btn, "ArrowDown");
    await settle();
    expect(document.activeElement).toBe(btn);
  });

  test("without `now` the element keeps its own clock; an empty feed says so", async () => {
    const el = await fixture<TcAlertFeed>(html`<tc-alert-feed .items=${[{ id: "x", category: "Payment", severity: "info", title: "Payout sent", time: Date.now() - 5 * MIN }]}></tc-alert-feed>`);
    await expect.poll(() => el.querySelector(".ui-afd__time")!.textContent).toBe("5m ago");
    expect(el.querySelector(".ui-afd__live")!.textContent).toMatch(/1 event today|0 events today/);
    el.items = [];
    await settle();
    expect(el.querySelector(".ui-afd__empty")!.textContent).toBe("No alerts. All quiet.");
  });

  test("React wrapper: controlled paused waits for the parent; onAction returning false keeps an alert open", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    await act(async () =>
      root.render(
        React.createElement(AlertFeed, {
          title: "Alerts",
          items: ITEMS,
          now: NOW,
          paused: false,
          onPausedChange: (p) => void seen.push(`paused ${p}`),
          onAction: (id, action) => {
            seen.push(`${action} ${id}`);
            return false;
          },
        }),
      ),
    );
    await settle();
    const el = host.querySelector("tc-alert-feed")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Alerts");
    el.querySelector<HTMLButtonElement>(".ui-afd__pause")!.click();
    await settle();
    expect(el.paused).toBe(false);
    alert(el, "a").querySelector<HTMLButtonElement>('[data-action="acknowledge"]')!.click();
    await settle();
    expect(alert(el, "a").hasAttribute("data-acked")).toBe(false);
    expect(seen).toEqual(["paused true", "acknowledge a"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-alert-feed description="Accounts and payments." .items=${ITEMS} .now=${NOW}></tc-alert-feed>
        <tc-alert-feed look="clean" .items=${ITEMS} .now=${NOW} paused></tc-alert-feed>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
