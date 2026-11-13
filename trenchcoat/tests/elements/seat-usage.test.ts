/*
 * <tc-seat-usage> in real browsers: the totals and their words, the bar, the cost, the breakdown table, idle members with
 * last active, ticking and Select all, reclaiming through the confirmation (Escape, focus), the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/seat-usage";
import { seatTotals, type IdleMember, type SeatGroup, type SeatReclaim, type SeatSelectedChange, type TcSeatUsage } from "../../src/elements/seat-usage";
import { SeatUsage } from "../../src/elements/react/seat-usage";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 12);
const DAY = 86_400_000;
/** Paid 150, assigned 146, active 112: idle 34, unassigned 4 */
const GROUPS: SeatGroup[] = [
  { id: "a", label: "Audit", paid: 60, assigned: 60, active: 49 },
  { id: "r", label: "Research", paid: 55, assigned: 51, active: 41 },
  { id: "o", label: "Operations", paid: 35, assigned: 35, active: 22 },
];
const IDLE: IdleMember[] = [
  { id: "u1", name: "Ines Lindqvist", detail: "Analyst", group: "Audit", lastActive: NOW - 47 * DAY },
  { id: "u2", name: "Omar Haddad", group: "Research", lastActive: NOW - DAY },
  { id: "u3", name: "Tomás Ferreira", group: "Research" },
];
const member = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-seat__member[data-id="${id}"]`)!;
const box = (el: Element, id: string) => member(el, id).querySelector<HTMLInputElement>("input")!;
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcSeatUsage>(html`<tc-seat-usage look=${look} locale="en-US" seat-price="30" now=${NOW} .groups=${GROUPS} .idle=${IDLE}></tc-seat-usage>`);

describe("tc-seat-usage", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the headline, the bar, the legend and the cost`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("seat");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-seat__headline")!.textContent!.replace(/\s+/g, " ").trim()).toBe("112 of 150 seats used · 34 idle · 4 unassigned");
      const segs = [...el.querySelectorAll<HTMLElement>(".ui-seat__summary .ui-seat__seg")].map((s) => parseFloat(s.style.inlineSize).toFixed(1));
      expect(segs).toEqual(["74.7", "22.7"]);
      expect([...el.querySelectorAll(".ui-seat__legend li")].map((l) => l.textContent!.trim())).toEqual(["Active 112", "Idle 34", "Unassigned 4"]);
      expect(el.querySelector(".ui-seat__cost")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Idle and unassigned seats cost $1,140 a month.");
    });
  }

  test("seatTotals: from groups or given totals, clamped", () => {
    expect(seatTotals(GROUPS)).toEqual({ paid: 150, assigned: 146, active: 112, idle: 34, unassigned: 4 });
    expect(seatTotals([], { paid: 10, assigned: 12, active: 20 })).toEqual({ paid: 10, assigned: 10, active: 10, idle: 0, unassigned: 0 });
  });

  test("the breakdown table and last active in words or as a date", async () => {
    const el = await make();
    const table = el.querySelector("table")!;
    expect(table.querySelector("caption")!.textContent).toBe("Seats by team");
    expect([...table.querySelectorAll("tbody tr")].map((r) => [...r.children].slice(0, 4).map((c) => c.textContent!.trim()))).toEqual([
      ["Audit", "60", "49", "11"],
      ["Research", "55", "41", "14"],
      ["Operations", "35", "22", "13"],
    ]);
    expect(member(el, "u1").querySelector(".ui-seat__last")!.textContent).toBe("Last active 47 days ago");
    expect(member(el, "u2").querySelector(".ui-seat__last")!.textContent).toBe("Last active 1 day ago");
    expect(member(el, "u3").querySelector(".ui-seat__last")!.textContent).toBe("Never active");
    el.now = undefined;
    el.timeZone = "UTC";
    await settle();
    expect(member(el, "u1").querySelector(".ui-seat__last")!.textContent).toBe("Last active Sep 26, 2026");
  });

  test("ticking and Select all fire a cancelable tc-selected-change", async () => {
    const el = await make();
    const seen: string[][] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<SeatSelectedChange>).detail.selected));
    const reclaim = el.querySelector<HTMLButtonElement>(".ui-seat__reclaim-picked")!;
    expect(reclaim.getAttribute("aria-disabled")).toBe("true");
    box(el, "u1").click();
    await settle();
    expect(el.selected).toEqual(["u1"]);
    expect(reclaim.textContent!.trim()).toBe("Reclaim 1 seat");
    const all = el.querySelector<HTMLInputElement>(".ui-seat__all input")!;
    expect(all.indeterminate).toBe(true);
    all.click();
    await settle();
    expect(el.selected).toEqual(["u1", "u2", "u3"]);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    box(el, "u2").click();
    await settle();
    expect(el.selected).toEqual(["u1", "u2", "u3"]);
    expect(box(el, "u2").checked).toBe(true);
    expect(seen).toEqual([["u1"], ["u1", "u2", "u3"], ["u1", "u3"]]);
  });

  test("reclaiming: the confirmation takes focus, Escape cancels back to the button, confirming fires tc-reclaim", async () => {
    const el = await make();
    const fired: SeatReclaim[] = [];
    el.addEventListener("tc-reclaim", (e) => fired.push((e as CustomEvent<SeatReclaim>).detail));
    const one = member(el, "u1").querySelector<HTMLButtonElement>(".ui-seat__reclaim")!;
    expect(one.textContent!.replace(/\s+/g, " ").trim()).toBe("Reclaim seat from Ines Lindqvist");
    one.click();
    await settle();
    const confirm = member(el, "u1").querySelector(".ui-seat__confirm")!;
    expect(confirm.textContent!.replace(/\s+/g, " ")).toContain("Reclaim 1 seat? Ines Lindqvist loses access until given a seat again – about $30 a month.");
    await expect.poll(() => document.activeElement?.className).toContain("ui-seat__cancel");
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await settle();
    expect(el.querySelector(".ui-seat__confirm")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(one);
    // Several at once, from the ticked ones
    box(el, "u2").click();
    box(el, "u3").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-seat__reclaim-picked")!.click();
    await settle();
    expect(el.querySelector(".ui-seat__confirm-text")!.textContent!.replace(/\s+/g, " ")).toContain("Omar Haddad and 1 other lose access");
    el.querySelector<HTMLButtonElement>(".ui-seat__confirm-btn")!.click();
    await settle();
    expect(fired.map((f) => f.ids)).toEqual([["u2", "u3"]]);
    expect(fired[0].members.map((m) => m.name)).toEqual(["Omar Haddad", "Tomás Ferreira"]);
    expect(el.querySelector(".ui-seat__confirm")).toBeNull();
    expect(el.selected).toEqual([]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Reclaimed 2 seats");
  });

  test("a prevented tc-reclaim keeps the confirmation open", async () => {
    const el = await make();
    el.addEventListener("tc-reclaim", (e) => e.preventDefault());
    member(el, "u1").querySelector<HTMLButtonElement>(".ui-seat__reclaim")!.click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-seat__confirm-btn")!.click();
    await settle();
    expect(el.querySelector(".ui-seat__confirm")).toBeTruthy();
  });

  test("no seats, and no idle members", async () => {
    const empty = await fixture<TcSeatUsage>(html`<tc-seat-usage></tc-seat-usage>`);
    expect(empty.querySelector(".ui-seat__empty")).toBeTruthy();
    const busy = await fixture<TcSeatUsage>(html`<tc-seat-usage paid="10" assigned="10" active="10"></tc-seat-usage>`);
    expect(busy.querySelector(".ui-seat__none")).toBeTruthy();
    expect(busy.querySelector("table")).toBeNull();
    expect(busy.querySelector(".ui-seat__cost")).toBeNull();
  });

  test("narrow: rows stay inside the card", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-seat-usage now=${NOW} .groups=${GROUPS} .idle=${IDLE}></tc-seat-usage></div>`);
    const el = wrap.querySelector("tc-seat-usage")!;
    const right = el.getBoundingClientRect().right;
    for (const m of el.querySelectorAll(".ui-seat__member")) expect(m.getBoundingClientRect().right).toBeLessThanOrEqual(right + 1);
  });

  test("React wrapper: uncontrolled selection survives re-renders; controlled stays; onReclaim can refuse", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(SeatUsage, { title: "Licences", groups: GROUPS, idle: IDLE, onSelectedChange: (s) => void seen.push(s), onReclaim: (ids) => (seen.push(ids), false), "data-n": n } as React.ComponentProps<typeof SeatUsage>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-seat-usage")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Licences");
    box(el, "u1").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toEqual(["u1"]);
    el.querySelector<HTMLButtonElement>(".ui-seat__reclaim-picked")!.click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-seat__confirm-btn")!.click();
    await settle();
    expect(seen).toEqual([["u1"], ["u1"]]);
    expect(el.querySelector(".ui-seat__confirm")).toBeTruthy();
    await act(async () => root.unmount());
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(SeatUsage, { groups: GROUPS, idle: IDLE, selected: [], onSelectedChange: (s) => void seen.push(s) })));
    await settle();
    const el2 = host2.querySelector("tc-seat-usage")!;
    box(el2, "u2").click();
    await settle();
    expect(seen.at(-1)).toEqual(["u2"]);
    expect(el2.selected).toEqual([]);
    expect(box(el2, "u2").checked).toBe(false);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with a confirmation open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-seat-usage seat-price="30" now=${NOW} .groups=${GROUPS} .idle=${IDLE} .selected=${["u1"]}></tc-seat-usage>
        <tc-seat-usage look="clean" .groups=${GROUPS} .idle=${IDLE}></tc-seat-usage>
      </div>`);
      wrap.querySelector<HTMLButtonElement>(".ui-seat__reclaim")!.click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
