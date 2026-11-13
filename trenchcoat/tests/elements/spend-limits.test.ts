/*
 * <tc-spend-limits> in real browsers: rows over the cap first, spent of the cap in words and as a meter, the workspace
 * default, editing a cap in place, the action select, remove and add, the React wrapper and axe in both looks and both
 * themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/spend-limits";
import { parseLimit, type SpendLimit, type SpendLimitsChange, type SpendLimitTarget, type TcSpendLimits } from "../../src/elements/spend-limits";
import { SpendLimits } from "../../src/elements/react/spend-limits";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const LIMITS: SpendLimit[] = [
  { id: "jonah", kind: "member", name: "Jonah Tran", limit: 300, spent: 96, period: "month", action: "block" },
  { id: "audit", kind: "team", name: "Audit", limit: 2000, spent: 1640, period: "month", action: "warn" },
  { id: "research", kind: "team", name: "Research", limit: 3500, spent: 3720, period: "month", action: "notify" },
];
const TARGETS: SpendLimitTarget[] = [
  { kind: "member", id: "priya", name: "Priya Raman" },
  { kind: "member", id: "jonah", name: "Jonah Tran" },
  { kind: "key", id: "ingest", name: "invoice-ingest (prod)" },
];
const order = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-spl__row")].map((r) => r.dataset.id);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-spl__row[data-id="${id}"]`)!;
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcSpendLimits>(
    html`<tc-spend-limits look=${look} locale="en-US" .limits=${LIMITS} .targets=${TARGETS} .defaultLimit=${{ limit: 150, period: "month", action: "warn" }}></tc-spend-limits>`,
  );
const changes = (el: Element) => {
  const seen: SpendLimitsChange[] = [];
  el.addEventListener("tc-limits-change", (e) => seen.push((e as CustomEvent<SpendLimitsChange>).detail));
  return seen;
};
const typeInto = (input: HTMLInputElement, text: string) => {
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const enter = (t: Element, k = "Enter") => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-spend-limits", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: over-limit rows first, then the fullest; spent of the cap in words and a meter; the default on top`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("spl");
      expect(el.dataset.look).toBe(look);
      expect(order(el)).toEqual(["research", "audit", "jonah"]);
      const meter = row(el, "research").querySelector('[role="meter"]')!;
      expect(meter.getAttribute("aria-valuetext")).toBe("$3,720 of $3,500 a month, 106%, over by $220");
      expect(row(el, "research").querySelector(".ui-spl__flag")!.textContent).toContain("Over limit");
      expect(row(el, "audit").querySelector(".ui-spl__flag")!.textContent).toBe("Near limit");
      expect(row(el, "jonah").querySelector(".ui-spl__flag")).toBeNull();
      expect(el.querySelector(".ui-spl__count")!.textContent).toBe("1 over limit");
      expect(el.querySelector(".ui-spl__default")!.textContent!.replace(/\s+/g, " ")).toContain("Every member: $150, edit workspace default limit a month, then warn");
    });
  }

  test("parseLimit reads amounts people type", () => {
    expect(parseLimit("$1,250")).toBe(1250);
    expect(parseLimit(" 40.5 ")).toBe(40.5);
    expect(parseLimit("0")).toBeNull();
    expect(parseLimit("lots")).toBeNull();
  });

  test("editing a cap: Enter saves through a cancelable tc-limits-change; a bad amount is said in words; Escape cancels", async () => {
    const el = await make();
    const seen = changes(el);
    row(el, "audit").querySelector<HTMLButtonElement>(".ui-spl__cap")!.click();
    await settle();
    const input = el.querySelector<HTMLInputElement>(".ui-spl__edit-input")!;
    expect(document.activeElement).toBe(input);
    typeInto(input, "abc");
    enter(input);
    await settle();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(el.querySelector(".ui-spl__error")!.textContent).toBe("Enter an amount above zero");
    typeInto(input, "2,500");
    enter(input);
    await settle();
    expect(seen.at(-1)).toMatchObject({ change: "edit", id: "audit" });
    expect(el.limits.find((l) => l.id === "audit")!.limit).toBe(2500);
    expect(document.activeElement).toBe(row(el, "audit").querySelector(".ui-spl__cap"));
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Audit's limit set to $2,500");
    row(el, "jonah").querySelector<HTMLButtonElement>(".ui-spl__cap")!.click();
    await settle();
    enter(el.querySelector(".ui-spl__edit-input")!, "Escape");
    await settle();
    expect(el.querySelector(".ui-spl__edit-input")).toBeNull();
    el.addEventListener("tc-limits-change", (e) => e.preventDefault());
    row(el, "jonah").querySelector<HTMLButtonElement>(".ui-spl__cap")!.click();
    await settle();
    typeInto(el.querySelector<HTMLInputElement>(".ui-spl__edit-input")!, "999");
    enter(el.querySelector(".ui-spl__edit-input")!);
    await settle();
    expect(el.limits.find((l) => l.id === "jonah")!.limit).toBe(300);
  });

  test("the workspace default is edited through tc-default-limit-change", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-default-limit-change", (e) => seen.push((e as CustomEvent).detail.defaultLimit));
    el.querySelector<HTMLButtonElement>('[data-edit="default"]')!.click();
    await settle();
    const input = el.querySelector<HTMLInputElement>(".ui-spl__edit-input")!;
    typeInto(input, "200");
    enter(input);
    await settle();
    expect(seen).toEqual([{ limit: 200, period: "month", action: "warn" }]);
    expect(el.defaultLimit!.limit).toBe(200);
  });

  test("the action select and Remove fire tc-limits-change; focus moves to the next row's Remove", async () => {
    const el = await make();
    const seen = changes(el);
    const select = row(el, "jonah").querySelector<HTMLSelectElement>(".ui-spl__action")!;
    select.value = "notify";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(seen.at(-1)).toMatchObject({ change: "action", id: "jonah" });
    expect(el.limits.find((l) => l.id === "jonah")!.action).toBe("notify");
    row(el, "audit").querySelector<HTMLButtonElement>(".ui-spl__remove")!.click();
    await settle();
    expect(order(el)).toEqual(["research", "jonah"]);
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.remove).toBe("jonah");
  });

  test("Add limit offers targets without a limit, checks the amount, adds the row and focuses its cap", async () => {
    const el = await make();
    const seen = changes(el);
    el.querySelector<HTMLButtonElement>(".ui-spl__add-open")!.click();
    await settle();
    const form = el.querySelector<HTMLFormElement>(".ui-spl__add")!;
    expect([...form.querySelectorAll<HTMLOptionElement>("[name=target] option")].map((o) => o.textContent)).toEqual(["Priya Raman"]);
    form.requestSubmit();
    await settle();
    expect(el.querySelector(".ui-spl__add .ui-spl__error")!.textContent).toBe("Enter an amount above zero");
    form.querySelector<HTMLInputElement>("[name=limit]")!.value = "250";
    form.requestSubmit();
    await settle();
    expect(seen.at(-1)).toMatchObject({ change: "add", id: "priya" });
    expect(el.limits.at(-1)).toEqual({ id: "priya", kind: "member", name: "Priya Raman", limit: 250, spent: 0, period: "month", action: "block" });
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.edit).toBe("priya");
  });

  test("empty and narrow", async () => {
    const empty = await fixture<TcSpendLimits>(html`<tc-spend-limits></tc-spend-limits>`);
    expect(empty.querySelector(".ui-spl__empty")!.textContent).toBe("No limits yet.");
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-spend-limits .limits=${LIMITS}></tc-spend-limits></div>`);
    const el = wrap.querySelector("tc-spend-limits")!;
    for (const r of el.querySelectorAll(".ui-spl__row")) expect(r.getBoundingClientRect().right).toBeLessThanOrEqual(el.getBoundingClientRect().right + 1);
  });

  test("React wrapper: uncontrolled limits survive re-renders; controlled ones stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(SpendLimits, { title: "Caps", defaultLimits: LIMITS, onLimitsChange: (_l, change, id) => void seen.push(`${change}:${id}`), "data-n": n } as React.ComponentProps<typeof SpendLimits>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-spend-limits")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Caps");
    row(el, "audit").querySelector<HTMLButtonElement>(".ui-spl__remove")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(order(el)).toEqual(["research", "jonah"]);
    expect(seen).toEqual(["remove:audit"]);
    await act(async () => root.unmount());
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(SpendLimits, { limits: LIMITS, onLimitsChange: (_l, change, id) => void seen.push(`${change}:${id}`) })));
    await settle();
    const el2 = host2.querySelector("tc-spend-limits")!;
    row(el2, "jonah").querySelector<HTMLButtonElement>(".ui-spl__remove")!.click();
    await settle();
    expect(seen.at(-1)).toBe("remove:jonah");
    expect(order(el2)).toEqual(["research", "audit", "jonah"]);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, editing and adding`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-spend-limits .limits=${LIMITS} .targets=${TARGETS} .defaultLimit=${{ limit: 150, period: "month", action: "warn" }}></tc-spend-limits>
        <tc-spend-limits look="clean" .limits=${LIMITS} .targets=${TARGETS}></tc-spend-limits>
      </div>`);
      const [a, b] = wrap.querySelectorAll("tc-spend-limits");
      row(a, "audit").querySelector<HTMLButtonElement>(".ui-spl__cap")!.click();
      b.querySelector<HTMLButtonElement>(".ui-spl__add-open")!.click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
