/*
 * <tc-prioritisation-matrix> in real browsers: quadrants, points and their descriptions, moving with the keys and by
 * dragging, cancelable changes, clusters that fan out, the lists by quadrant and their highlight, read only, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/prioritisation-matrix";
import { quadrantOf, type PrioritisationItem, type PrioritisationItemsChange, type TcPrioritisationMatrix } from "../../src/elements/prioritisation-matrix";
import { PrioritisationMatrix } from "../../src/elements/react/prioritisation-matrix";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: PrioritisationItem[] = [
  { id: "portal", label: "Open data portal", value: 8, effort: 3 },
  { id: "reef", label: "Reef sensors", value: 9, effort: 8 },
  { id: "signs", label: "Signage", value: 2.5, effort: 1.5 },
  { id: "news", label: "Newsletter", value: 2.5, effort: 1.5 },
  { id: "intranet", label: "Intranet", value: 3, effort: 7 },
];
const make = (look = "standard", items = ITEMS) => fixture<TcPrioritisationMatrix>(html`<tc-prioritisation-matrix look=${look} heading="Portfolio" .items=${items}></tc-prioritisation-matrix>`);
const point = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-point="${id}"]`)!;
const key = (t: Element, k: string, init: KeyboardEventInit = {}) => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const desc = (el: Element, id: string) => text(el.querySelector(`#${point(el, id).getAttribute("aria-describedby")}`));

describe("tc-prioritisation-matrix", () => {
  test("quadrantOf: value 5 and up is high, effort under 5 is low", () => {
    expect(quadrantOf(8, 3)).toBe("quickWins");
    expect(quadrantOf(5, 5)).toBe("bigBets");
    expect(quadrantOf(4.5, 4.5)).toBe("fillIns");
    expect(quadrantOf(0, 10)).toBe("moneyPits");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: quadrants named, points numbered and described, lists by quadrant with counts`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("pmx");
      expect(el.dataset.look).toBe(look);
      expect([...el.querySelectorAll(".ui-pmx__quad-name")].map(text)).toEqual(["Quick wins", "Big bets", "Fill-ins", "Time sinks"]);
      expect(text(point(el, "portal").querySelector('[aria-hidden="true"]'))).toBe("1");
      expect(text(point(el, "portal").querySelector(".tc-sr-only"))).toBe("Open data portal");
      expect(desc(el, "portal")).toBe("Value 8, effort 3 – Quick wins");
      expect([...el.querySelectorAll(".ui-pmx__group-name")].map(text)).toEqual(["Quick wins 1", "Big bets 1", "Fill-ins 2", "Time sinks 1"]);
      expect(point(el, "portal").style.left).toBe("calc(30% + 0px)");
      expect(point(el, "portal").style.top).toBe("calc(20% + 0px)");
    });
  }

  test("keys: arrows move half a step, Shift two; tc-items-change carries the next list; prevented, it stays", async () => {
    const el = await make();
    const seen: PrioritisationItemsChange[] = [];
    el.addEventListener("tc-items-change", (e) => seen.push((e as CustomEvent<PrioritisationItemsChange>).detail));
    const p = point(el, "portal");
    p.focus();
    key(p, "ArrowUp");
    await settle();
    expect(seen[0].change).toEqual({ id: "portal", value: 8.5, effort: 3 });
    key(point(el, "portal"), "ArrowRight", { shiftKey: true });
    await settle();
    expect(el.items[0]).toMatchObject({ value: 8.5, effort: 5 });
    expect(document.activeElement).toBe(point(el, "portal"));
    expect(text(el.querySelector('[role="status"]'))).toBe("Open data portal: Value 8.5, effort 5 – Big bets, now in Big bets");
    // Clamped at the edges
    for (let i = 0; i < 4; i++) key(point(el, "portal"), "ArrowUp", { shiftKey: true });
    await settle();
    expect(el.items[0].value).toBe(10);
    el.addEventListener("tc-items-change", (e) => e.preventDefault(), { once: true });
    key(point(el, "portal"), "ArrowDown");
    await settle();
    expect(el.items[0].value).toBe(10);
  });

  test("drag: a point follows the pointer in half steps and commits on release", async () => {
    const el = await make();
    const seen: PrioritisationItemsChange[] = [];
    el.addEventListener("tc-items-change", (e) => seen.push((e as CustomEvent<PrioritisationItemsChange>).detail));
    const plot = el.querySelector<HTMLElement>(".ui-pmx__plot")!.getBoundingClientRect();
    const p = point(el, "intranet");
    const at = (effort: number, value: number) => ({ clientX: plot.left + (effort / 10) * plot.width, clientY: plot.top + ((10 - value) / 10) * plot.height, bubbles: true, pointerId: 1, button: 0 });
    p.dispatchEvent(new PointerEvent("pointerdown", at(7, 3)));
    p.dispatchEvent(new PointerEvent("pointermove", at(2.2, 7.9)));
    await settle();
    expect(point(el, "intranet").hasAttribute("data-dragging")).toBe(true);
    expect(seen).toHaveLength(0);
    point(el, "intranet").dispatchEvent(new PointerEvent("pointerup", at(2.2, 7.9)));
    await settle();
    expect(seen[0].change).toEqual({ id: "intranet", value: 8, effort: 2 });
    expect(desc(el, "intranet")).toBe("Value 8, effort 2 – Quick wins");
  });

  test("a cluster: two on one spot gather with a count; click fans them out; Escape gathers them", async () => {
    const el = await make();
    const cluster = el.querySelector<HTMLButtonElement>(".ui-pmx__cluster")!;
    expect(text(cluster.querySelector(".tc-sr-only"))).toBe("2 items here: Signage, Newsletter. Show them");
    expect(point(el, "signs")).toBeNull();
    cluster.click();
    await settle();
    expect(point(el, "signs")).not.toBeNull();
    expect(point(el, "news")).not.toBeNull();
    expect(document.activeElement).toBe(point(el, "signs"));
    key(point(el, "signs"), "Escape");
    await settle();
    expect(point(el, "signs")).toBeNull();
    expect(document.activeElement).toBe(el.querySelector(".ui-pmx__cluster"));
  });

  test("highlight: a point lights its row and a row its point", async () => {
    const el = await make();
    point(el, "reef").dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(text(el.querySelector(".ui-pmx__row[data-lit]"))).toContain("Reef sensors");
    point(el, "reef").dispatchEvent(new PointerEvent("pointerleave"));
    el.querySelectorAll<HTMLElement>(".ui-pmx__row")[0].dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(point(el, "portal").hasAttribute("data-lit")).toBe(true);
  });

  test("read only: keys and drags don't move points; no items says so", async () => {
    const el = await make();
    el.readonly = true;
    await settle();
    key(point(el, "portal"), "ArrowUp");
    await settle();
    expect(el.items[0].value).toBe(8);
    expect(point(el, "portal").getAttribute("aria-disabled")).toBe("true");
    const empty = await make("standard", []);
    expect(text(empty.querySelector(".ui-pmx__empty"))).toBe("Nothing to place yet.");
  });

  test("React wrapper: uncontrolled moves survive re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const lists: PrioritisationItem[][] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(PrioritisationMatrix, { title: "Ours", defaultItems: ITEMS, onItemsChange: (next) => void lists.push(next), "data-n": n } as React.ComponentProps<typeof PrioritisationMatrix>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-prioritisation-matrix")!;
    key(point(el, "portal"), "ArrowUp");
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.items[0].value).toBe(8.5);
    expect(lists).toHaveLength(1);
    await act(async () => root.render(React.createElement(PrioritisationMatrix, { items: ITEMS })));
    await settle();
    const held = host.querySelector("tc-prioritisation-matrix")!;
    key(point(held, "portal"), "ArrowUp");
    await settle();
    expect(held.items[0].value).toBe(8);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-prioritisation-matrix heading="Portfolio" description="Scored by the steering group" .items=${ITEMS}></tc-prioritisation-matrix>
        <tc-prioritisation-matrix look="clean" readonly heading="Read only" .items=${ITEMS}></tc-prioritisation-matrix>
        <tc-prioritisation-matrix style="width: 360px" heading="Narrow" .items=${ITEMS}></tc-prioritisation-matrix>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
