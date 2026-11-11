/*
 * <tc-diff-table> in real browsers: edited cells and whole rows, deciding one, a row or all, undo, controlled use, the
 * keyboard and the popover, streaming, narrow width, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/diff-table";
import type { DiffTableColumn, DiffTableDecisions, DiffTableEdit, DiffTableRow, TcDiffTable } from "../../src/elements/diff-table";
import { DiffTable } from "../../src/elements/react/diff-table";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const COLUMNS: DiffTableColumn[] = [
  { key: "vendor", label: "Vendor" },
  { key: "owner", label: "Owner" },
  { key: "review", label: "Next review" },
];
const ROWS: DiffTableRow[] = [
  { id: "v1", cells: { vendor: "Northfield Labs", owner: "R. Okafor", review: "Mar 2027" } },
  { id: "v2", cells: { vendor: "Clearwater Analytics", owner: "M. Lindqvist", review: "Jan 2026" } },
  { id: "v3", cells: { vendor: "Pinecrest Printing", owner: "A. Haddad", review: "Sep 2024" }, change: "removed" },
  { id: "v4", cells: { vendor: "Kestrel Instruments", owner: "J. Park", review: "May 2028" }, change: "added" },
];
const EDITS: DiffTableEdit[] = [
  { id: "e1", row: "v2", column: "review", from: "Jan 2026", to: "Jan 2027", reason: "Renewed in December." },
  { id: "e2", row: "v2", column: "owner", from: "M. Lindqvist", to: "S. Ruiz" },
  { id: "e3", row: "v1", column: "owner", from: "R. Okafor", to: "J. Park" },
];

const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcDiffTable>(html`<tc-diff-table look=${look} heading="Proposed register cleanup" .columns=${COLUMNS} .rows=${ROWS} .edits=${EDITS}></tc-diff-table>`);
const cell = (el: Element, at: string) => el.querySelector<HTMLElement>(`[data-at="${at}"]`)!;
const count = (el: Element) => el.querySelector(".ui-dftb__count")!.textContent;
const key = (k: string, init: KeyboardEventInit = {}) =>
  document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const at = () => (document.activeElement as HTMLElement).dataset.at;
const bar = (el: Element, i: number) => el.querySelectorAll<HTMLElement>(".ui-dftb__bar button")[i];

describe("tc-diff-table", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: edited cells show old and new, whole rows are marked, the count adds them up`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("dftb");
      expect(el.dataset.look).toBe(look);
      const table = el.querySelector("table")!;
      expect(table.getAttribute("role")).toBe("grid");
      expect(table.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      const review = cell(el, "1:2");
      expect(review.dataset.state).toBe("pending");
      expect(review.querySelector("del")!.textContent).toContain("Jan 2026");
      expect(review.querySelector("ins")!.textContent).toContain("Jan 2027");
      expect(review.textContent!.replace(/\s+/g, " ").trim()).toBe("Was Jan 2026, Now Jan 2027, pending");
      expect(el.querySelector('tr[data-id="v3"]')!.getAttribute("data-row-state")).toBe("pending");
      expect(cell(el, "2:0").textContent).toContain("Removed row:");
      expect(cell(el, "3:0").textContent).toContain("New row:");
      expect(count(el)).toBe("5 pending");
      expect(el.querySelectorAll('table [tabindex="0"]')).toHaveLength(1);
      expect(el.querySelectorAll('th[role="rowheader"]')).toHaveLength(4);
    });
  }

  test("A and R decide the focused edit; the cell keeps its new or old value and says so", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-edit-change", (e) => seen.push((e as CustomEvent).detail));
    cell(el, "1:2").focus();
    key("a");
    await el.updateComplete;
    expect(seen).toEqual([{ edit: "e1", decision: "accepted" }]);
    expect(el.decisions).toEqual({ e1: "accepted" });
    expect(cell(el, "1:2").dataset.state).toBe("accepted");
    expect(cell(el, "1:2").textContent).toContain("Jan 2027");
    expect(cell(el, "1:2").textContent).toContain("Accepted");
    key("r");
    await el.updateComplete;
    expect(cell(el, "1:2").textContent).toContain("Jan 2026");
    expect(count(el)).toBe("4 pending");
  });

  test("a row's buttons decide everything pending in it, and focus stays in the row", async () => {
    const el = await make();
    const changes: DiffTableDecisions[] = [];
    el.addEventListener("tc-decisions-change", (e) => changes.push((e as CustomEvent).detail.decisions));
    const accept = cell(el, "1:3");
    expect(accept.textContent!.replace(/\s+/g, " ").trim()).toBe("Accept Clearwater Analytics");
    accept.focus();
    accept.click();
    await settle();
    expect(changes).toEqual([{ e1: "accepted", e2: "accepted" }]);
    expect(el.querySelector('tr[data-id="v2"] .ui-dftb__verdict')!.textContent).toBe("Accepted");
    await expect.poll(at).toBe("1:2");
    cell(el, "2:4").click();
    await settle();
    expect(el.decisions["row:v3"]).toBe("rejected");
    expect(el.querySelector('tr[data-id="v3"]')!.getAttribute("data-row-state")).toBe("rejected");
  });

  test("Accept all, Reject all and Undo; preventDefault keeps the verdicts", async () => {
    const el = await make();
    bar(el, 1).click();
    await settle();
    expect(count(el)).toBe("All reviewed");
    expect(Object.values(el.decisions)).toEqual(["rejected", "rejected", "rejected", "rejected", "rejected"]);
    expect(bar(el, 0).getAttribute("aria-disabled")).toBe("true");
    bar(el, 2).click();
    await settle();
    expect(el.decisions).toEqual({});
    expect(count(el)).toBe("5 pending");
    expect(bar(el, 2).getAttribute("aria-disabled")).toBe("true");
    el.addEventListener("tc-decisions-change", (e) => e.preventDefault());
    bar(el, 0).click();
    await settle();
    expect(el.decisions).toEqual({});
  });

  test("keyboard: arrows, Home, End and Ctrl+End move the one tab stop through cells and buttons", async () => {
    const el = await make();
    cell(el, "0:0").focus();
    key("ArrowDown");
    await expect.poll(at).toBe("1:0");
    key("End");
    await expect.poll(at).toBe("1:4");
    key("ArrowLeft");
    await expect.poll(at).toBe("1:3");
    key("ArrowLeft");
    await expect.poll(at).toBe("1:2");
    key("Home");
    await expect.poll(at).toBe("1:0");
    key("End", { ctrlKey: true, metaKey: true });
    await expect.poll(at).toBe("3:4");
    key("Home", { ctrlKey: true, metaKey: true });
    await expect.poll(at).toBe("0:0");
  });

  test("Enter opens the popover with the reason; its buttons decide, and Escape returns focus", async () => {
    const el = await make();
    cell(el, "1:2").focus();
    key("Enter");
    await expect.poll(() => el.querySelector(".ui-dftb__pop")).not.toBeNull();
    const pop = el.querySelector<HTMLElement>(".ui-dftb__pop")!;
    expect(pop.getAttribute("role")).toBe("dialog");
    expect(pop.querySelector(".ui-dftb__pop-title")!.textContent).toBe("Clearwater Analytics – Next review");
    expect(pop.querySelector(".ui-dftb__reason")!.textContent).toBe("Renewed in December.");
    await expect.poll(() => pop.contains(document.activeElement)).toBe(true);
    key("Escape");
    await expect.poll(() => el.querySelector(".ui-dftb__pop")).toBeNull();
    await expect.poll(at).toBe("1:2");
    cell(el, "1:2").click();
    await expect.poll(() => el.querySelector(".ui-dftb__pop")).not.toBeNull();
    el.querySelector<HTMLElement>(".ui-dftb__pop .ui-dftb__btn--accept")!.click();
    await settle();
    expect(el.decisions.e1).toBe("accepted");
    await expect.poll(() => el.querySelector(".ui-dftb__pop")).toBeNull();
  });

  test("streaming sweeps the edits in a row at a time; Accept all waits for them", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const el = await fixture<TcDiffTable>(html`<tc-diff-table streaming .columns=${COLUMNS} .rows=${ROWS} .edits=${EDITS}></tc-diff-table>`);
    expect(el.querySelectorAll(".ui-dftb__chg")).toHaveLength(0);
    expect(bar(el, 0).getAttribute("aria-disabled")).toBe("true");
    vi.advanceTimersByTime(160);
    await el.updateComplete;
    expect(el.querySelector('tr[data-id="v1"]')!.hasAttribute("data-sweep")).toBe(true);
    expect(el.querySelectorAll(".ui-dftb__chg")).toHaveLength(1);
    vi.advanceTimersByTime(160 * 4);
    await el.updateComplete;
    expect(el.querySelectorAll(".ui-dftb__chg")).toHaveLength(3);
    expect(vi.getTimerCount()).toBe(0);
    expect(bar(el, 0).getAttribute("aria-disabled")).toBe("false");
  });

  test("empty data says so; new edits clear Undo", async () => {
    const el = await make();
    bar(el, 0).click();
    await settle();
    expect(bar(el, 2).getAttribute("aria-disabled")).toBe("false");
    el.edits = [...EDITS];
    await settle();
    expect(bar(el, 2).getAttribute("aria-disabled")).toBe("true");
    el.rows = [];
    await settle();
    expect(el.querySelector(".ui-dftb__empty")!.textContent).toBe("No changes proposed");
  });

  test("narrow: the table scrolls sideways under a sticky first column", async () => {
    const el = await make();
    el.style.width = "320px";
    await settle();
    const scroll = el.querySelector<HTMLElement>(".ui-dftb__scroll")!;
    expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth);
    const first = cell(el, "0:0");
    const left = first.getBoundingClientRect().left;
    scroll.scrollLeft = 120;
    await expect.poll(() => Math.round(first.getBoundingClientRect().left)).toBe(Math.round(left));
    expect(getComputedStyle(first).position).toBe("sticky");
  });

  test("React: uncontrolled keeps verdicts across re-renders, controlled waits for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const render = (props: Partial<React.ComponentProps<typeof DiffTable>>) =>
      act(async () => root.render(React.createElement(DiffTable, { columns: COLUMNS, rows: ROWS, edits: EDITS, ...props })));
    await render({ defaultDecisions: { e3: "accepted" } });
    const el = wrap.querySelector<TcDiffTable>("tc-diff-table")!;
    await settle(wrap);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Proposed changes");
    expect(cell(el, "0:1").dataset.state).toBe("accepted");
    await act(async () => cell(el, "1:3").click());
    await settle(wrap);
    await render({ defaultDecisions: { e3: "accepted" }, description: "Again" });
    await settle(wrap);
    expect(el.decisions).toEqual({ e3: "accepted", e1: "accepted", e2: "accepted" });
    const seen: DiffTableDecisions[] = [];
    await render({ decisions: {}, onDecisionsChange: (d) => void seen.push(d) });
    await settle(wrap);
    await act(async () => cell(el, "1:3").click());
    await settle(wrap);
    expect(seen).toEqual([{ e1: "accepted", e2: "accepted" }]);
    expect(el.decisions).toEqual({});
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with decisions and the popover open`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.colorScheme = theme;
      wrap.innerHTML = `<tc-diff-table look="standard"></tc-diff-table><tc-diff-table look="clean"></tc-diff-table>`;
      wrap.querySelectorAll<TcDiffTable>("tc-diff-table").forEach((el) => {
        el.columns = COLUMNS;
        el.rows = ROWS;
        el.edits = EDITS;
        el.decisions = { e3: "accepted", "row:v4": "rejected" };
      });
      await settle(wrap);
      cell(wrap, "1:2").click();
      await expect.poll(() => wrap.querySelector(".ui-dftb__pop")).not.toBeNull();
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
