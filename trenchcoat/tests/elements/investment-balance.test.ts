/*
 * <tc-investment-balance> in real browsers: shares per tier, over- and under-invested flags, the computed and
 * overridden finding, totals, selecting a tier, the listbox keyboard, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/investment-balance";
import type { InvestmentSelectedChange, InvestmentTier, TcInvestmentBalance } from "../../src/elements/investment-balance";
import { InvestmentBalance } from "../../src/elements/react/investment-balance";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

/** Items 10/30/60 → 10%, 30%, 60%. Budget 40/30/30 → p1 over by 30 points, p3 under by 30. People 10/30/60 → even */
const TIERS: InvestmentTier[] = [
  { id: "p1", badge: "1", label: "Top priority", items: 10, budget: 4_000_000, people: 10 },
  { id: "p2", badge: "2", label: "High", items: 30, budget: 3_000_000, people: 30 },
  { id: "p3", badge: "3", label: "Medium", items: 60, budget: 3_000_000, people: 60 },
];
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-id="${id}"]`)!;
const flags = (el: Element, id: string) => [...row(el, id).querySelectorAll<HTMLElement>(".ui-invb__measure")].map((m) => m.dataset.mark);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") => fixture<TcInvestmentBalance>(html`<tc-investment-balance look=${look} locale="en-US" .tiers=${TIERS}></tc-investment-balance>`);

describe("tc-investment-balance", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a listbox with an option per tier, one tab stop, shares in text and bars`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("invb");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector('[role="listbox"]')!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Investment vs priority");
      expect(list.querySelectorAll('[role="option"]')).toHaveLength(3);
      expect(list.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      const pcts = [...row(el, "p1").querySelectorAll(".ui-invb__pct")].map((p) => p.textContent);
      expect(pcts).toEqual(["10%", "40%", "10%"]);
      expect(row(el, "p1").querySelector('[data-kind="budget"] .ui-invb__num')!.textContent).toBe("$4M");
      expect(row(el, "p1").querySelector<HTMLElement>('[data-kind="budget"] .ui-invb__fill')!.style.inlineSize).toBe("40%");
    });
  }

  test("flags: over and under by the threshold, in words; the finding names the biggest gap; totals add up", async () => {
    const el = await make();
    expect(flags(el, "p1")).toEqual(["even", "over", "even"]);
    expect(flags(el, "p2")).toEqual(["even", "even", "even"]);
    expect(flags(el, "p3")).toEqual(["even", "under", "even"]);
    expect(row(el, "p1").querySelector(".ui-invb__flag")!.textContent).toContain("Over");
    expect(row(el, "p3").querySelector(".ui-invb__flag")!.textContent).toContain("Under");
    expect(row(el, "p1").querySelector(".ui-invb__sr")!.textContent).toContain("budget $4M, 40%, over-invested");
    // p1 and p3 are both 30 points off; the first found wins
    expect(el.querySelector(".ui-invb__finding")!.textContent).toBe("Top priority is 10% of topics but draws 40% of the budget.");
    expect([...el.querySelectorAll(".ui-invb__total > span")].map((s) => s.textContent)).toEqual(["Total", "100 topics", "$10M", "100 FTE"]);
    expect(el.querySelector(".ui-invb__count")!.textContent).toBe("2 off balance");
    // A wider threshold leaves everything even
    el.threshold = 0.35;
    await settle();
    expect(flags(el, "p1")).toEqual(["even", "even", "even"]);
    expect(el.querySelector(".ui-invb__finding")!.textContent).toBe("Budget and people follow priority – no tier is more than 35% off its share of topics.");
    expect(el.querySelector(".ui-invb__count")!.textContent).toBe("In balance");
    // The page's own finding, or none
    el.finding = "Our own words.";
    await settle();
    expect(el.querySelector(".ui-invb__finding")!.textContent).toBe("Our own words.");
    el.finding = "";
    await settle();
    expect(el.querySelector(".ui-invb__finding")).toBeNull();
  });

  test("an under-invested tier is named with 'gets only'; people can be the biggest gap", async () => {
    const el = await fixture<TcInvestmentBalance>(html`<tc-investment-balance locale="en-US" item-label="projects" .tiers=${[
      { id: "a", label: "Core", items: 50, budget: 50, people: 20 },
      { id: "b", label: "Bets", items: 50, budget: 50, people: 80 },
    ]}></tc-investment-balance>`);
    expect(el.querySelector(".ui-invb__finding")!.textContent).toBe("Core is 50% of projects but gets only 20% of the people.");
  });

  test("click, Enter or Space selects; again or Escape clears; tc-selected-change fires and can be prevented", async () => {
    const el = await make();
    const seen: (string | null)[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<InvestmentSelectedChange>).detail.selected));
    row(el, "p2").click();
    await settle();
    expect(el.selected).toBe("p2");
    expect(row(el, "p2").getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Selected High");
    key(row(el, "p2"), "Enter");
    await settle();
    expect(el.selected).toBeNull();
    key(row(el, "p3"), " ");
    await settle();
    key(row(el, "p3"), "Escape");
    await settle();
    expect(seen).toEqual(["p2", null, "p3", null]);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    row(el, "p1").click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("keyboard: ↑ ↓ Home End move a roving tab stop", async () => {
    const el = await make();
    row(el, "p1").focus();
    const at = () => document.activeElement?.getAttribute("data-id");
    const press = async (k: string, want: string) => {
      key(document.activeElement!, k);
      await expect.poll(at).toBe(want);
    };
    await press("ArrowDown", "p2");
    await press("End", "p3");
    await press("ArrowDown", "p3");
    await press("ArrowUp", "p2");
    await press("Home", "p1");
    expect(el.querySelectorAll('[role="option"][tabindex="0"]')).toHaveLength(1);
  });

  test("a tier that goes away clears the selection; an empty element renders", async () => {
    const el = await make();
    el.selected = "p3";
    await settle();
    el.tiers = TIERS.slice(0, 2);
    await settle();
    expect(el.selected).toBeNull();
    const empty = await fixture<TcInvestmentBalance>(html`<tc-investment-balance></tc-investment-balance>`);
    expect(empty.querySelector(".ui-invb__empty")).toBeTruthy();
    expect(empty.querySelector('[role="listbox"]')).toBeNull();
  });

  test("React wrapper: uncontrolled survives re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(InvestmentBalance, { title: "Balance", tiers: TIERS, onSelectedChange: (s, t) => void seen.push([s, t?.label]), "data-n": n } as React.ComponentProps<typeof InvestmentBalance>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-investment-balance")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Balance");
    row(el, "p2").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("p2");
    expect(seen).toEqual([["p2", "High"]]);
    await act(async () => root.unmount());
    // Controlled, on a fresh root: a click asks, and nothing changes until the parent does
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(InvestmentBalance, { tiers: TIERS, selected: null, onSelectedChange: (s) => void seen.push(s) })));
    await settle();
    const el2 = host2.querySelector("tc-investment-balance")!;
    row(el2, "p1").click();
    await settle();
    expect(seen.at(-1)).toBe("p1");
    expect(el2.selected).toBeNull();
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-investment-balance .tiers=${TIERS} selected="p1"></tc-investment-balance>
        <tc-investment-balance look="clean" .tiers=${TIERS}></tc-investment-balance>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
