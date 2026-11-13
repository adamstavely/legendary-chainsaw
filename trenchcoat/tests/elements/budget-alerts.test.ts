/*
 * <tc-budget-alerts> in real browsers: the bar with spent, the hatched forecast and the budget line, alert markers as
 * sliders moved by keys and by dragging, adding by clicking the bar and with Add alert, removing, the forecast's
 * crossing dates, channel and recipients, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/budget-alerts";
import { budgetCrossing, type BudgetAlert, type BudgetAlertsChange, type TcBudgetAlerts } from "../../src/elements/budget-alerts";
import { BudgetAlerts } from "../../src/elements/react/budget-alerts";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ALERTS: BudgetAlert[] = [
  { id: "a80", at: 0.8, channel: "chat", recipients: ["#finance-ops"] },
  { id: "a30", at: 0.3, channel: "email", recipients: ["finance@example.org"] },
];
/** 1 Nov to 30 Nov; now is the 11th at noon. Spend 2,000 of 5,000, forecast 6,000 */
const START = Date.UTC(2026, 10, 1);
const NOW = Date.UTC(2026, 10, 11, 12);
const END = Date.UTC(2026, 10, 30, 12);
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcBudgetAlerts>(
    html`<tc-budget-alerts look=${look} locale="en-GB" currency="USD" budget="5000" spent="2000" forecast="6000" .now=${NOW} .end=${END} .alerts=${ALERTS}></tc-budget-alerts>`,
  );
const marker = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-bal__marker[data-id="${id}"]`)!;
const key = (t: Element, k: string, init: KeyboardEventInit = {}) => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const changes = (el: Element) => {
  const seen: BudgetAlertsChange[] = [];
  el.addEventListener("tc-alerts-change", (e) => seen.push((e as CustomEvent<BudgetAlertsChange>).detail));
  return seen;
};
const at = (el: TcBudgetAlerts, id: string) => el.alerts.find((a) => a.id === id)?.at;

describe("tc-budget-alerts", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the bar, the forecast, sliders with value text, rows in order with crossing dates`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("bal");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-bal__forecast")).toBeTruthy();
      const m = marker(el, "a80");
      expect(m.getAttribute("role")).toBe("slider");
      expect(m.getAttribute("aria-valuenow")).toBe("80");
      expect(m.getAttribute("aria-valuetext")).toBe("Alert at US$4,000, 80% of budget");
      expect([...el.querySelectorAll<HTMLElement>(".ui-bal__alert")].map((r) => r.dataset.id)).toEqual(["a30", "a80"]);
      expect(el.querySelector('.ui-bal__alert[data-id="a30"] .ui-bal__cross')!.textContent).toBe("Already passed");
      expect(el.querySelector('.ui-bal__alert[data-id="a80"] .ui-bal__cross')!.textContent).toBe("Forecast crosses 80% around 20 Nov");
    });
  }

  test("budgetCrossing draws a line from today's spend to the forecast", () => {
    expect(budgetCrossing(4000, { spent: 2000, forecast: 6000, now: 0, end: 100 })).toBe(50);
    expect(budgetCrossing(1000, { spent: 2000, forecast: 6000, now: 7, end: 100 })).toBe(7);
    expect(budgetCrossing(7000, { spent: 2000, forecast: 6000, now: 0, end: 100 })).toBeNull();
    void START;
  });

  test("keys move a marker by 1% and 10%, Home and End go to the ends, and the move is announced; preventDefault keeps it", async () => {
    const el = await make();
    const seen = changes(el);
    const m = marker(el, "a80");
    m.focus();
    key(m, "ArrowRight");
    await settle();
    expect(at(el, "a80")).toBe(0.81);
    key(marker(el, "a80"), "ArrowLeft", { shiftKey: true });
    await settle();
    expect(at(el, "a80")).toBe(0.71);
    key(marker(el, "a80"), "PageUp");
    await settle();
    expect(at(el, "a80")).toBe(0.81);
    key(marker(el, "a80"), "End");
    await settle();
    expect(at(el, "a80")).toBe(1.5);
    key(marker(el, "a80"), "Home");
    await settle();
    expect(at(el, "a80")).toBe(0.01);
    expect(seen.every((c) => c.change === "move" && c.id === "a80")).toBe(true);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Alert at US$50, 1% of budget");
    el.addEventListener("tc-alerts-change", (e) => e.preventDefault());
    key(marker(el, "a80"), "ArrowRight");
    await settle();
    expect(at(el, "a80")).toBe(0.01);
  });

  test("dragging a marker moves it to the pointer's share of the bar", async () => {
    const el = await make();
    const bar = el.querySelector<HTMLElement>(".ui-bal__bar")!;
    const r = bar.getBoundingClientRect();
    const m = marker(el, "a80");
    const box = m.getBoundingClientRect();
    const fire = (type: string, x: number) => m.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 3, button: 0, isPrimary: true, clientX: x, clientY: box.top + box.height / 2 }));
    fire("pointerdown", box.left + box.width / 2);
    await settle();
    // The scale runs to 1.25 of the budget here (the forecast is 1.2 of it): a quarter of the bar's width is 31%
    fire("pointermove", r.left + r.width * 0.25);
    await settle();
    fire("pointerup", r.left + r.width * 0.25);
    await settle();
    expect(at(el, "a80")).toBe(0.31);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Alert at US$1,550, 31% of budget");
  });

  test("clicking the bar adds an alert there; Add alert picks the next free share; Delete and Remove take one away", async () => {
    const el = await make();
    const seen = changes(el);
    const bar = el.querySelector<HTMLElement>(".ui-bal__bar")!;
    const r = bar.getBoundingClientRect();
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: r.left + r.width * 0.5, clientY: r.top + r.height / 2 }));
    await settle();
    expect(seen.at(-1)!.change).toBe("add");
    const added = seen.at(-1)!.id;
    expect(at(el, added)).toBe(0.63);
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.id).toBe(added);
    el.querySelector<HTMLButtonElement>(".ui-bal__add")!.click();
    await settle();
    expect(at(el, seen.at(-1)!.id)).toBe(0.5);
    // A new alert copies the last one's channel and recipients
    expect(el.alerts.at(-1)!.channel).toBe(el.alerts.at(-2)!.channel);
    key(marker(el, added), "Delete");
    await settle();
    expect(el.alerts.some((a) => a.id === added)).toBe(false);
    el.querySelector<HTMLButtonElement>('[data-remove="a30"]')!.click();
    await settle();
    expect(el.alerts.map((a) => a.id)).not.toContain("a30");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Removed the alert at 30%");
  });

  test("channel and recipients change through tc-alerts-change", async () => {
    const el = await make();
    const seen = changes(el);
    const row = el.querySelector('.ui-bal__alert[data-id="a30"]')!;
    const select = row.querySelector("select")!;
    select.value = "chat";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    const input = row.querySelector<HTMLInputElement>(".ui-bal__recipients")!;
    input.value = "a@example.org, b@example.org ,";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(seen.map((c) => c.change)).toEqual(["channel", "recipients"]);
    expect(el.alerts.find((a) => a.id === "a30")).toEqual({ id: "a30", at: 0.3, channel: "chat", recipients: ["a@example.org", "b@example.org"] });
  });

  test("without now and end there are no dates; with no alerts it says so", async () => {
    const el = await fixture<TcBudgetAlerts>(html`<tc-budget-alerts budget="5000" spent="1000" .alerts=${[{ id: "x", at: 0.9, channel: "email", recipients: [] }]}></tc-budget-alerts>`);
    expect(el.querySelector(".ui-bal__cross")).toBeNull();
    expect(el.querySelector(".ui-bal__forecast")).toBeNull();
    const empty = await fixture<TcBudgetAlerts>(html`<tc-budget-alerts budget="5000"></tc-budget-alerts>`);
    expect(empty.querySelector(".ui-bal__empty")!.textContent).toBe("No alerts yet.");
  });

  test("React wrapper: uncontrolled alerts survive re-renders; controlled ones stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(BudgetAlerts, { title: "Alerts", budget: 5000, spent: 2000, defaultAlerts: ALERTS, onAlertsChange: (_a, change, id) => void seen.push(`${change}:${id}`), "data-n": n } as React.ComponentProps<typeof BudgetAlerts>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-budget-alerts")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Alerts");
    key(marker(el, "a80"), "ArrowRight");
    await settle();
    await act(async () => bump());
    await settle();
    expect(at(el, "a80")).toBe(0.81);
    expect(seen).toEqual(["move:a80"]);
    await act(async () => root.unmount());
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(BudgetAlerts, { budget: 5000, spent: 2000, alerts: ALERTS, onAlertsChange: (_a, change, id) => void seen.push(`${change}:${id}`) })));
    await settle();
    const el2 = host2.querySelector("tc-budget-alerts")!;
    key(marker(el2, "a80"), "ArrowRight");
    await settle();
    expect(seen.at(-1)).toBe("move:a80");
    expect(at(el2, "a80")).toBe(0.8);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-budget-alerts budget="5000" spent="2000" forecast="6000" .now=${NOW} .end=${END} .alerts=${ALERTS}></tc-budget-alerts>
        <tc-budget-alerts look="clean" budget="5000" spent="5600" .alerts=${ALERTS}></tc-budget-alerts>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
