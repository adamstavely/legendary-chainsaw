/*
 * <tc-top-spenders> in real browsers: ranking, shares, change in words, the kind chips, the long tail, opening a row,
 * the roving keyboard, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/top-spenders";
import { spendChangeWords, type Spender, type TcTopSpenders, type TopSpenderOpen, type TopSpendersKindChange } from "../../src/elements/top-spenders";
import { TopSpenders } from "../../src/elements/react/top-spenders";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

/** Total 1000: teams 500 + 200, agent 250, member 50 */
const SPENDERS: Spender[] = [
  { id: "m", name: "Sam Okafor", kind: "member", spend: 50 },
  { id: "a", name: "Audit", kind: "team", spend: 500, change: 0.42, topModel: "large-1", daily: [1, 2, 3, 5] },
  { id: "p", name: "Policy Q&A", kind: "agent", spend: 250, change: -0.1 },
  { id: "r", name: "Research", kind: "team", spend: 200, change: 0 },
];
const order = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-topsp__row")].map((r) => r.dataset.id);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-topsp__row[data-id="${id}"]`)!;
const chip = (el: Element, kind: string) => el.querySelector<HTMLButtonElement>(`.ui-topsp__chip[data-kind="${kind}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard", limit = 8) =>
  fixture<TcTopSpenders>(html`<tc-top-spenders look=${look} locale="en-US" limit=${limit} .spenders=${SPENDERS}></tc-top-spenders>`);

describe("tc-top-spenders", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: ranked by spend, one tab stop, shares and change in words`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("topsp");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector("ol")!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Top spenders");
      expect(order(el)).toEqual(["a", "p", "r", "m"]);
      expect(el.querySelectorAll('.ui-topsp__row[tabindex="0"]')).toHaveLength(1);
      expect(row(el, "a").querySelector(".ui-topsp__pct")!.textContent).toBe("50%");
      expect(row(el, "a").querySelector<HTMLElement>(".ui-topsp__fill")!.style.inlineSize).toBe("50%");
      expect(row(el, "a").querySelector(".ui-topsp__change")!.textContent).toContain("Up 42%");
      expect(row(el, "p").querySelector<HTMLElement>(".ui-topsp__change")!.dataset.dir).toBe("down");
      expect(row(el, "r").querySelector(".ui-topsp__change")!.textContent).toContain("No change");
      expect(row(el, "m").querySelector(".ui-topsp__change")).toBeNull();
      expect(row(el, "a").querySelector(".ui-topsp__sr")!.textContent).toBe("1. Audit, Team; $500, 50% of the spend; Up 42% on the previous period; mostly large-1");
      expect(row(el, "a").querySelector("svg.ui-topsp__spark polyline")).toBeTruthy();
      expect(el.querySelector(".ui-topsp__total")!.textContent).toContain("$1,000");
    });
  }

  test("spendChangeWords", () => {
    expect(spendChangeWords(0.42, "en-US")).toBe("Up 42%");
    expect(spendChangeWords(-0.06, "en-US")).toBe("Down 6%");
    expect(spendChangeWords(0.001, "en-US")).toBe("No change");
    expect(spendChangeWords(undefined)).toBeUndefined();
  });

  test("the long tail folds past the limit", async () => {
    const el = await make("standard", 2);
    expect(order(el)).toEqual(["a", "p"]);
    expect(el.querySelector(".ui-topsp__tail")!.textContent!.replace(/\s+/g, " ")).toBe("and 2 others – $250");
  });

  test("kind chips filter, rerank and re-share; tc-kind-change is cancelable", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-kind-change", (e) => seen.push((e as CustomEvent<TopSpendersKindChange>).detail.kind));
    expect([...el.querySelectorAll<HTMLElement>(".ui-topsp__chip")].map((c) => c.dataset.kind)).toEqual(["all", "member", "team", "agent"]);
    expect(chip(el, "all").getAttribute("aria-pressed")).toBe("true");
    chip(el, "team").click();
    await settle();
    expect(el.kind).toBe("team");
    expect(order(el)).toEqual(["a", "r"]);
    expect(row(el, "r").querySelector(".ui-topsp__pct")!.textContent).toBe("29%");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Showing teams, 2");
    el.addEventListener("tc-kind-change", (e) => e.preventDefault());
    chip(el, "agent").click();
    await settle();
    expect(el.kind).toBe("team");
    expect(seen).toEqual(["team", "agent"]);
  });

  test("keyboard: ↑ ↓ Home End move the tab stop; Enter or a click opens", async () => {
    const el = await make();
    const opened: string[] = [];
    el.addEventListener("tc-spender-open", (e) => opened.push((e as CustomEvent<TopSpenderOpen>).detail.id));
    row(el, "a").focus();
    const at = () => document.activeElement?.getAttribute("data-id");
    const press = async (k: string, want: string) => {
      key(document.activeElement!, k);
      await expect.poll(at).toBe(want);
    };
    await press("ArrowDown", "p");
    await press("End", "m");
    await press("ArrowUp", "r");
    await press("Home", "a");
    row(el, "r").click();
    expect(opened).toEqual(["r"]);
    await settle();
    expect(row(el, "r").tabIndex).toBe(0);
  });

  test("empty, one kind (no chips), and a kind that's gone falls back to all", async () => {
    const empty = await fixture<TcTopSpenders>(html`<tc-top-spenders></tc-top-spenders>`);
    expect(empty.querySelector(".ui-topsp__empty")).toBeTruthy();
    expect(empty.querySelector(".ui-topsp__total")).toBeNull();
    const one = await fixture<TcTopSpenders>(html`<tc-top-spenders kind="key" .spenders=${[SPENDERS[1], SPENDERS[3]]}></tc-top-spenders>`);
    expect(one.querySelector(".ui-topsp__chips")).toBeNull();
    expect(order(one)).toEqual(["a", "r"]);
  });

  test("narrow: the row stays inside the card", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-top-spenders .spenders=${SPENDERS}></tc-top-spenders></div>`);
    const el = wrap.querySelector("tc-top-spenders")!;
    const r = row(el, "a").getBoundingClientRect();
    expect(r.right).toBeLessThanOrEqual(el.getBoundingClientRect().right + 1);
    expect(getComputedStyle(row(el, "a").querySelector(".ui-topsp__spark")!).display).toBe("none");
  });

  test("React wrapper: uncontrolled kind survives re-renders; controlled stays; onSpenderOpen gets the spender", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(TopSpenders, { title: "Spend", spenders: SPENDERS, onKindChange: (k) => void seen.push(k), onSpenderOpen: (id, s) => void seen.push(`${id}:${s.name}`), "data-n": n } as React.ComponentProps<typeof TopSpenders>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-top-spenders")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Spend");
    chip(el, "team").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.kind).toBe("team");
    row(el, "a").click();
    expect(seen).toEqual(["team", "a:Audit"]);
    await act(async () => root.unmount());
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(TopSpenders, { spenders: SPENDERS, kind: "all", onKindChange: (k) => void seen.push(k) })));
    await settle();
    const el2 = host2.querySelector("tc-top-spenders")!;
    chip(el2, "agent").click();
    await settle();
    expect(seen.at(-1)).toBe("agent");
    expect(el2.kind).toBe("all");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-top-spenders limit="3" .spenders=${SPENDERS}></tc-top-spenders>
        <tc-top-spenders look="clean" .spenders=${SPENDERS}></tc-top-spenders>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
