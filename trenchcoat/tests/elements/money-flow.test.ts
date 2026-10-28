/*
 * <tc-money-flow> in real browsers: entities in columns worked out from the transfers, bands sized by amount with
 * labels and flags, lighting an entity's or a transfer's flows with a readout, selection by click and keyboard, the
 * transfers list and the table, re-layout on resize, controlled use, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/money-flow";
import type { FlowNode, FlowRef, FlowSelectedChange, FlowTransfer, TcMoneyFlow } from "../../src/elements/money-flow";
import { MoneyFlow } from "../../src/elements/react/money-flow";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

/** dir → op → hold → prop / bank; op → courier */
const NODES: FlowNode[] = [
  { id: "dir", label: "J. Halden", kind: "person" },
  { id: "op", label: "Halden Freight", kind: "company", detail: "France" },
  { id: "hold", label: "Kestrel Holdings", kind: "shell" },
  { id: "courier", label: "R. Okoro", kind: "person" },
  { id: "prop", label: "Alder Estates", kind: "company" },
  { id: "bank", label: "Gulf Bank", kind: "bank" },
];
const TRANSFERS: FlowTransfer[] = [
  { id: "t1", from: "dir", to: "op", amount: 58000, date: Date.UTC(2026, 4, 2, 12) },
  { id: "t2", from: "op", to: "hold", amount: 240000, date: Date.UTC(2026, 4, 15, 12), flag: "Layering" },
  { id: "t3", from: "op", to: "courier", amount: 9500 },
  { id: "t4", from: "hold", to: "prop", amount: 180000 },
  { id: "t5", from: "hold", to: "bank", amount: 55000 },
  // Dropped: an unknown entity, and a payment to itself
  { id: "bad", from: "nobody", to: "op", amount: 1 },
  { id: "self", from: "op", to: "op", amount: 1 },
];

const node = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-node="${id}"]`)!;
const band = (el: Element, id: string) => el.querySelector<SVGGElement>(`[data-band="${id}"]`)!;
const transfer = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-transfer="${id}"]`)!;
const readout = (el: Element) => el.querySelector(".ui-mfl__readout")!.textContent!.replace(/\s+/g, " ").trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const euro = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const day = (ms: number) => new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(ms);
const make = (look: "standard" | "clean" = "standard", width = 760) =>
  fixture<HTMLDivElement>(html`<div style=${`width: ${width}px`}><tc-money-flow look=${look} description="Last 90 days." .nodes=${NODES} .transfers=${TRANSFERS}></tc-money-flow></div>`).then(
    (w) => w.querySelector("tc-money-flow")!,
  );
const left = (el: Element, id: string) => node(el, id).getBoundingClientRect().left;

describe("tc-money-flow", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: entities as cards with their kind, bands and labels for each valid transfer, the total in the header`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("mfl");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelectorAll(".ui-mfl__node")).toHaveLength(6);
      expect(node(el, "op").querySelector(".ui-mfl__node-kind")!.textContent!.trim()).toBe("Company · France");
      expect(node(el, "hold").querySelector(".ui-mfl__node-kind")!.textContent!.trim()).toBe("Shell entity");
      // Transfers to unknown entities or to themselves are left out
      expect([...el.querySelectorAll("[data-band]")].map((b) => b.getAttribute("data-band"))).toEqual(["t1", "t2", "t3", "t4", "t5"]);
      expect(el.querySelector('[data-label="t2"]')!.textContent).toContain("Layering");
      expect(band(el, "t2").hasAttribute("data-flag")).toBe(true);
      // Width follows the amount
      const w = (id: string) => parseFloat(band(el, id).querySelector<SVGPathElement>(".ui-mfl__band-line")!.style.strokeWidth);
      expect(w("t2")).toBeGreaterThan(w("t4"));
      expect(w("t4")).toBeGreaterThan(w("t3"));
      expect([...el.querySelector(".ui-mfl__total")!.children].map((c) => c.textContent).join(" ")).toBe(`5 transfers ${euro(58000 + 240000 + 9500 + 180000 + 55000)}`);
      // One tab stop for the entities, one for the transfers
      expect(el.querySelectorAll('.ui-mfl__nodes button[tabindex="0"]')).toHaveLength(1);
      expect(el.querySelectorAll('.ui-mfl__transfers button[tabindex="0"]')).toHaveLength(1);
    });
  }

  test("columns: payers to the left of who they paid; a given column wins", async () => {
    const el = await make();
    expect(left(el, "dir")).toBeLessThan(left(el, "op"));
    expect(left(el, "op")).toBeLessThan(left(el, "hold"));
    expect(Math.abs(left(el, "hold") - left(el, "courier"))).toBeLessThan(1);
    expect(left(el, "hold")).toBeLessThan(left(el, "prop"));
    el.nodes = NODES.map((n) => (n.id === "courier" ? { ...n, column: 3 } : n));
    await settle();
    expect(Math.abs(left(el, "courier") - left(el, "prop"))).toBeLessThan(1);
  });

  test("lighting: an entity lights its transfers and dims the rest; a transfer lights its ends; the readout says it", async () => {
    const el = await make();
    expect(readout(el)).toBe("Point at an entity or a transfer to trace it");
    node(el, "hold").dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(["t2", "t4", "t5"].every((t) => band(el, t).hasAttribute("data-on"))).toBe(true);
    expect(band(el, "t1").hasAttribute("data-dim")).toBe(true);
    expect(node(el, "dir").hasAttribute("data-dim")).toBe(true);
    expect(readout(el)).toBe(`Kestrel Holdings · Shell entity · in ${euro(240000)} · out ${euro(235000)} · 3 transfers`);
    el.querySelector(".ui-mfl__stage")!.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(band(el, "t1").hasAttribute("data-dim")).toBe(false);
    band(el, "t2").querySelector(".ui-mfl__band-hit")!.dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(readout(el)).toBe(`Halden Freight → Kestrel Holdings · ${euro(240000)} · ${day(Date.UTC(2026, 4, 15, 12))} · Layering`);
    expect(node(el, "op").hasAttribute("data-on")).toBe(true);
    expect(node(el, "prop").hasAttribute("data-dim")).toBe(true);
    // Focusing a transfer in the list lights it too
    el.querySelector(".ui-mfl__stage")!.dispatchEvent(new PointerEvent("pointerleave"));
    transfer(el, "t4").focus();
    await settle();
    expect(band(el, "t4").hasAttribute("data-on")).toBe(true);
    expect(transfer(el, "t4").hasAttribute("data-on")).toBe(true);
  });

  test("selection: click or Enter on an entity or a transfer, again or Escape clears; tc-selected-change carries it", async () => {
    const el = await make();
    const seen: FlowSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<FlowSelectedChange>).detail));
    node(el, "op").click();
    await settle();
    expect(el.selected).toEqual({ kind: "node", id: "op" });
    expect(node(el, "op").getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^Selected Halden Freight · Company/);
    key(node(el, "op"), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    key(transfer(el, "t2"), "Enter");
    await settle();
    expect(el.selected).toEqual({ kind: "transfer", id: "t2" });
    expect(band(el, "t2").hasAttribute("data-selected")).toBe(true);
    band(el, "t2").querySelector<SVGPathElement>(".ui-mfl__band-hit")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(el.selected).toBeNull();
    expect(seen.map((s) => [s.selected, s.node?.id ?? s.transfer?.id])).toEqual([
      [{ kind: "node", id: "op" }, "op"],
      [null, undefined],
      [{ kind: "transfer", id: "t2" }, "t2"],
      [null, undefined],
    ]);
    // Controlled: preventDefault() keeps it
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    node(el, "dir").click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("keyboard: ← → to the nearest entity in the next column, ↑ ↓ within a column, Home / End; ↑ ↓ through transfers", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-node") ?? document.activeElement?.getAttribute("data-transfer");
    node(el, "dir").focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await settle();
    };
    await press("ArrowRight");
    await expect.poll(at).toBe("op");
    await press("ArrowRight");
    await expect.poll(at).toBe("hold");
    await press("ArrowDown");
    await expect.poll(at).toBe("courier");
    await press("ArrowUp");
    await expect.poll(at).toBe("hold");
    await press("End");
    await expect.poll(at).toBe("bank");
    await press("Home");
    await expect.poll(at).toBe("dir");
    await press("ArrowLeft");
    await expect.poll(at).toBe("dir");
    expect(node(el, "dir").getAttribute("tabindex")).toBe("0");
    transfer(el, "t1").focus();
    await press("ArrowDown");
    await expect.poll(at).toBe("t2");
    await press("End");
    await expect.poll(at).toBe("t5");
    expect(transfer(el, "t5").getAttribute("tabindex")).toBe("0");
  });

  test("Show as table swaps the drawing for a table of every transfer", async () => {
    const el = await make();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-mfl__toggle")!;
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector(".ui-mfl__stage")).toBeNull();
    expect(el.querySelector(".ui-mfl__transfers")).toBeNull();
    const rows = [...el.querySelectorAll(".ui-mfl__table tbody tr")].map((r) => [...r.querySelectorAll("td")].map((c) => c.textContent!.trim()));
    expect(rows[1]).toEqual(["Halden Freight", "Kestrel Holdings", euro(240000), day(Date.UTC(2026, 4, 15, 12)), "Layering"]);
    expect(rows[2][3]).toBe("–");
    expect(rows).toHaveLength(5);
    toggle.click();
    await settle();
    expect(el.querySelector(".ui-mfl__stage")).toBeTruthy();
  });

  test("re-lays out when its width changes; too narrow for its columns, it keeps its size and scrolls", async () => {
    const el = await make("standard", 1400);
    await expect.poll(() => left(el, "bank") - left(el, "dir")).toBeGreaterThan(900);
    const before = left(el, "bank") - left(el, "dir");
    el.parentElement!.style.width = "1100px";
    await expect.poll(() => left(el, "bank") - left(el, "dir")).toBeLessThan(before - 80);
    // Four columns need room for their cards and the labels between them: narrower than that, the drawing scrolls
    el.parentElement!.style.width = "560px";
    const body = el.querySelector<HTMLElement>(".ui-mfl__body")!;
    await expect.poll(() => body.scrollWidth > body.clientWidth).toBe(true);
    const stage = el.querySelector<HTMLElement>(".ui-mfl__stage")!;
    const labels = [...el.querySelectorAll<HTMLElement>(".ui-mfl__label")].map((l) => l.getBoundingClientRect());
    const cards = [...el.querySelectorAll<HTMLElement>(".ui-mfl__node")].map((n) => n.getBoundingClientRect());
    // No label sits on a card
    for (const l of labels) for (const c of cards) expect(l.right <= c.left || l.left >= c.right || l.bottom <= c.top || l.top >= c.bottom).toBe(true);
    expect(stage.offsetWidth).toBeGreaterThan(body.clientWidth);
  });

  test("a selection whose entity goes away clears; an empty element says so", async () => {
    const el = await make();
    el.selected = { kind: "node", id: "bank" };
    await settle();
    el.nodes = NODES.filter((n) => n.id !== "bank");
    await settle();
    expect(el.selected).toBeNull();
    const empty = await fixture<TcMoneyFlow>(html`<tc-money-flow></tc-money-flow>`);
    expect(empty.querySelector(".ui-mfl__empty")!.textContent).toBe("No transfers to show yet.");
  });

  test("React wrapper: an uncontrolled selection survives re-renders; onSelectedChange gets the item; controlled stays put", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(MoneyFlow, { title: "Funds", nodes: NODES, transfers: TRANSFERS, onSelectedChange: (s, item) => void seen.push([s?.id ?? null, item?.id]), "data-n": n } as React.ComponentProps<typeof MoneyFlow>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    let el = host.querySelector("tc-money-flow")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Funds");
    node(el, "hold").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toEqual({ kind: "node", id: "hold" });
    expect(seen).toEqual([["hold", "hold"]]);
    const asked: (FlowRef | null)[] = [];
    await act(async () => root.render(React.createElement(MoneyFlow, { nodes: NODES, transfers: TRANSFERS, selected: null, onSelectedChange: (s) => void asked.push(s) })));
    await settle();
    el = host.querySelector("tc-money-flow")!;
    node(el, "op").click();
    await settle();
    expect(asked).toEqual([{ kind: "node", id: "op" }]);
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, drawing and table`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="width: 760px; padding: 16px; background: var(--tc-surface-base)">
        <tc-money-flow description="Last 90 days." .nodes=${NODES} .transfers=${TRANSFERS} .selected=${{ kind: "node", id: "hold" }}></tc-money-flow>
        <tc-money-flow look="clean" .nodes=${NODES} .transfers=${TRANSFERS} table></tc-money-flow>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
