/*
 * <tc-entity-timeline> in real browsers: events sorted and grouped by month, category tags, source and grade tags,
 * flags, the category filter, an event's detail, the keyboard, controlled use, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/entity-timeline";
import type { TcEntityTimeline, TimelineCategory, TimelineEvent, TimelineFilterChange, TimelineSelectedChange } from "../../src/elements/entity-timeline";
import { EntityTimeline } from "../../src/elements/react/entity-timeline";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();
const CATS: TimelineCategory[] = [
  { id: "pay", label: "Payment", tone: "warning" },
  { id: "acct", label: "Account", tone: "info" },
];
const EVENTS: TimelineEvent[] = [
  { id: "old", date: at(2026, 2, 2), title: "Account opened", category: "acct", source: { label: "Core banking", grade: "A1" } },
  { id: "held", date: at(2026, 6, 4), title: "Payment held", detail: "First payment to a new payee.", category: "pay", source: { label: "Payments", grade: "D4" }, flag: "Auto-flag", body: "Held for review.", links: [{ label: "Log", href: "#log" }] },
  { id: "wire", date: at(2026, 6, 1), title: "Wire sent", category: "pay" },
];

const titles = (el: Element) => [...el.querySelectorAll(".ui-etl__title-text")].map((t) => t.textContent);
const btn = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-event="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcEntityTimeline>(html`<tc-entity-timeline look=${look} description="A review." .events=${EVENTS} .categories=${CATS}></tc-entity-timeline>`);

describe("tc-entity-timeline", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: newest first, grouped by month, with tags, a source grade and a flag`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("etl");
      expect(el.dataset.look).toBe(look);
      expect(titles(el)).toEqual(["Payment held", "Wire sent", "Account opened"]);
      const months = [...el.querySelectorAll(".ui-etl__month")].map((m) => m.textContent);
      expect(months).toHaveLength(2);
      expect(months[0]).toBe(new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(at(2026, 6, 4)));
      const held = btn(el, "held").closest("li")!;
      expect(held.querySelector(".ui-etl__cat")!.textContent).toBe("Payment");
      expect(held.querySelector<HTMLElement>(".ui-etl__src")!.dataset.band).toBe("low");
      expect(held.querySelector(".ui-etl__src .ui-etl__sr")!.textContent).toContain("grade D4");
      expect(held.querySelector(".ui-etl__flag")!.textContent).toBe("Auto-flag");
      expect(btn(el, "old").closest("li")!.querySelector<HTMLElement>(".ui-etl__src")!.dataset.band).toBe("high");
      expect(el.querySelector(".ui-etl__count")!.textContent).toBe("3 events");
      // One tab stop
      expect(el.querySelectorAll('[data-event][tabindex="0"]')).toHaveLength(1);
      el.order = "oldest";
      await settle();
      expect(titles(el)).toEqual(["Account opened", "Wire sent", "Payment held"]);
    });
  }

  test("the filter: chips with counts; picking one fires tc-filter-change and narrows the list; cancelable", async () => {
    const el = await make();
    const chips = [...el.querySelectorAll<HTMLButtonElement>(".ui-etl__chip")];
    expect(chips.map((c) => c.textContent!.replace(/\s+/g, " ").trim())).toEqual(["All 3", "Payment 2", "Account 1"]);
    const seen: string[] = [];
    el.addEventListener("tc-filter-change", (e) => seen.push((e as CustomEvent<TimelineFilterChange>).detail.filter));
    chips[2].click();
    await settle();
    expect(titles(el)).toEqual(["Account opened"]);
    expect(chips[2].getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("1 event, Account");
    el.addEventListener("tc-filter-change", (e) => e.preventDefault(), { once: true });
    chips[0].click();
    await settle();
    expect(el.filter).toBe("acct");
    expect(seen).toEqual(["acct", "all"]);
  });

  test("an event opens its detail inline; again or Escape closes it; an event the filter hides closes", async () => {
    const el = await make();
    const seen: (string | null)[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<TimelineSelectedChange>).detail.selected));
    expect(btn(el, "wire").hasAttribute("aria-expanded")).toBe(false);
    btn(el, "held").click();
    await settle();
    expect(btn(el, "held").getAttribute("aria-expanded")).toBe("true");
    const detail = document.getElementById(btn(el, "held").getAttribute("aria-controls")!)!;
    expect(detail.textContent).toContain("Held for review.");
    expect(detail.querySelector("a")!.getAttribute("href")).toBe("#log");
    key(btn(el, "held"), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    btn(el, "held").click();
    await settle();
    el.filter = "acct";
    await settle();
    expect(el.selected).toBeNull();
    expect(seen).toEqual(["held", null, "held"]);
  });

  test("keyboard: ↑ ↓ Home End move one tab stop between events", async () => {
    const el = await make();
    btn(el, "held").focus();
    const at = () => document.activeElement?.getAttribute("data-event");
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('[data-event][tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowDown");
    expect(at()).toBe("wire");
    await press("End");
    expect(at()).toBe("old");
    await press("ArrowDown");
    expect(at()).toBe("old");
    await press("Home");
    expect(at()).toBe("held");
    expect(btn(el, "held").getAttribute("tabindex")).toBe("0");
  });

  test("controlled: preventDefault() keeps the open event; empty states", async () => {
    const el = await make();
    el.selected = "wire";
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    btn(el, "held").click();
    await settle();
    expect(el.selected).toBe("wire");
    const empty = await fixture<TcEntityTimeline>(html`<tc-entity-timeline></tc-entity-timeline>`);
    expect(empty.querySelector(".ui-etl__empty")!.textContent).toBe("No events yet.");
    expect(empty.querySelector(".ui-etl__filters")).toBeNull();
  });

  test("React wrapper: filter and selection uncontrolled survive re-renders; callbacks get the event", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(EntityTimeline, {
        title: "Account timeline",
        events: EVENTS,
        categories: CATS,
        onSelectedChange: (s, ev) => void seen.push([s, ev?.title]),
        onFilterChange: (f) => void seen.push(f),
        "data-n": n,
      } as React.ComponentProps<typeof EntityTimeline>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-entity-timeline")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Account timeline");
    btn(el, "held").click();
    el.querySelectorAll<HTMLButtonElement>(".ui-etl__chip")[1].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("held");
    expect(el.filter).toBe("pay");
    expect(seen).toEqual([["held", "Payment held"], "pay"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled filter stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[] = [];
    await act(async () => root.render(React.createElement(EntityTimeline, { events: EVENTS, categories: CATS, filter: "all", onFilterChange: (f) => void asked.push(f) })));
    await settle();
    const el = host.querySelector("tc-entity-timeline")!;
    el.querySelectorAll<HTMLButtonElement>(".ui-etl__chip")[1].click();
    await settle();
    expect(asked).toEqual(["pay"]);
    expect(el.filter).toBe("all");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-entity-timeline description="A review." .events=${EVENTS} .categories=${CATS} .selected=${"held"}></tc-entity-timeline>
        <tc-entity-timeline look="clean" .events=${EVENTS} .categories=${CATS}></tc-entity-timeline>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
