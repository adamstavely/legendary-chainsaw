/*
 * <tc-budget-burn> in real browsers: rows with spent against budget, burn and pace in words, the pace marker, totals,
 * sorting by budget or burn, opening a row, the roving keyboard, the React wrapper and axe in both looks and both
 * themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/budget-burn";
import type { BurnItem, BurnOpen, BurnSortChange, TcBudgetBurn } from "../../src/elements/budget-burn";
import { BudgetBurn } from "../../src/elements/react/budget-burn";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

/** Budgets 4M / 2M / 1M; burn 25% / 80% / 50%. At period 0.5: behind, ahead, on pace */
const ITEMS: BurnItem[] = [
  { id: "b", label: "Bravo", budget: 2_000_000, spent: 1_600_000, committed: 200_000, people: 1.5, team: ["Ana Ruiz", "Ben Ode", "Cy Park", "Di Mo"] },
  { id: "a", label: "Alpha", owner: "Sofia Almeida", priority: "1", budget: 4_000_000, spent: 1_000_000, committed: 1_000_000, people: 2 },
  { id: "c", label: "Charlie", budget: 1_000_000, spent: 500_000 },
];
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-id="${id}"]`)!;
const order = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-bburn__row")].map((r) => r.dataset.id);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const sortBtn = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-bburn__sort-btn")].find((b) => b.textContent === name)!;
const make = (look: "standard" | "clean" = "standard") => fixture<TcBudgetBurn>(html`<tc-budget-burn look=${look} locale="en-US" period="0.5" .items=${ITEMS}></tc-budget-burn>`);

describe("tc-budget-burn", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: rows of buttons sorted by budget, one tab stop, spent / budget, burn and pace in words`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("bburn");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector("ul")!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Budget burn");
      expect(order(el)).toEqual(["a", "b", "c"]);
      expect(el.querySelectorAll('.ui-bburn__row[tabindex="0"]')).toHaveLength(1);
      expect(row(el, "a").querySelector(".ui-bburn__money")!.textContent).toBe("$1M / $4M");
      expect(row(el, "a").querySelector(".ui-bburn__pct")!.textContent).toBe("25%");
      expect([...el.querySelectorAll<HTMLElement>(".ui-bburn__pace")].map((p) => p.dataset.pace)).toEqual(["behind", "ahead", "on"]);
      expect(row(el, "b").querySelector(".ui-bburn__pace")!.textContent).toContain("Ahead of pace");
      expect(row(el, "a").querySelector(".ui-bburn__sr")!.textContent).toBe("Alpha, Sofia Almeida; $1M of $4M spent, 25%; Behind pace; 2 FTE; priority 1");
    });
  }

  test("the pace marker, totals, the team's initials; no period hides pace", async () => {
    const el = await make();
    expect(row(el, "a").querySelector<HTMLElement>(".ui-bburn__marker")!.style.insetInlineStart).toBe("50%");
    expect(row(el, "b").querySelector<HTMLElement>(".ui-bburn__fill")!.style.inlineSize).toBe("80%");
    const totals = [...el.querySelectorAll(".ui-bburn__totals > div")].map((d) => d.textContent!.replace(/\s+/g, " ").trim());
    expect(totals).toEqual(["Allocated$7M", "Spent$3.1M · 44%", "Committed$1.2M", "Through the period50%"]);
    expect([...row(el, "b").querySelectorAll(".ui-bburn__avatar")].map((a) => a.textContent)).toEqual(["AR", "BO", "CP", "+1"]);
    el.period = undefined;
    await settle();
    expect(el.querySelector(".ui-bburn__pace")).toBeNull();
    expect(el.querySelector(".ui-bburn__marker")).toBeNull();
    expect(el.querySelectorAll(".ui-bburn__totals > div")).toHaveLength(3);
  });

  test("sorting by burn or budget fires a cancelable tc-sort-change", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-sort-change", (e: Event) => seen.push((e as CustomEvent<BurnSortChange>).detail.sort));
    expect(sortBtn(el, "Budget").getAttribute("aria-pressed")).toBe("true");
    sortBtn(el, "Burn").click();
    await settle();
    expect(el.sort).toBe("burn");
    expect(order(el)).toEqual(["b", "c", "a"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Sorted by burn");
    el.addEventListener("tc-sort-change", (e) => e.preventDefault());
    sortBtn(el, "Budget").click();
    await settle();
    expect(el.sort).toBe("burn");
    expect(seen).toEqual(["burn", "budget"]);
  });

  test("keyboard: ↑ ↓ Home End move the tab stop; Enter or a click opens", async () => {
    const el = await make();
    const opened: string[] = [];
    el.addEventListener("tc-open", (e) => opened.push((e as CustomEvent<BurnOpen>).detail.id));
    row(el, "a").focus();
    const at = () => document.activeElement?.getAttribute("data-id");
    const press = async (k: string, want: string) => {
      key(document.activeElement!, k);
      await expect.poll(at).toBe(want);
    };
    await press("ArrowDown", "b");
    await press("End", "c");
    await press("ArrowUp", "b");
    await press("Home", "a");
    row(el, "c").click();
    row(el, "c").focus();
    (document.activeElement as HTMLElement).click();
    expect(opened).toEqual(["c", "c"]);
  });

  test("an empty element renders; a currency the browser doesn't know falls back to plain numbers", async () => {
    const empty = await fixture<TcBudgetBurn>(html`<tc-budget-burn></tc-budget-burn>`);
    expect(empty.querySelector(".ui-bburn__empty")).toBeTruthy();
    expect(empty.querySelector(".ui-bburn__sort")).toBeNull();
    const odd = await fixture<TcBudgetBurn>(html`<tc-budget-burn locale="en-US" currency="not a code" .items=${[ITEMS[2]]}></tc-budget-burn>`);
    expect(row(odd, "c").querySelector(".ui-bburn__money")!.textContent).toBe("500K / 1M");
  });

  test("React wrapper: uncontrolled sort survives re-renders; controlled stays; onOpen gets the item", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(BudgetBurn, { title: "Burn", items: ITEMS, onSortChange: (s) => void seen.push(s), onOpen: (id, item) => void seen.push(`${id}:${item.label}`), "data-n": n } as React.ComponentProps<typeof BudgetBurn>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-budget-burn")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Burn");
    sortBtn(el, "Burn").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.sort).toBe("burn");
    row(el, "a").click();
    expect(seen).toEqual(["burn", "a:Alpha"]);
    await act(async () => root.unmount());
    // Controlled, on a fresh root: a click asks, and nothing changes until the parent does
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(BudgetBurn, { items: ITEMS, sort: "budget", onSortChange: (s) => void seen.push(s) })));
    await settle();
    const el2 = host2.querySelector("tc-budget-burn")!;
    sortBtn(el2, "Burn").click();
    await settle();
    expect(seen.at(-1)).toBe("burn");
    expect(el2.sort).toBe("budget");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-budget-burn period="0.5" .items=${ITEMS}></tc-budget-burn>
        <tc-budget-burn look="clean" .items=${ITEMS}></tc-budget-burn>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
