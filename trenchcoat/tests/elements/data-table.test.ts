/*
 * <tc-data-table> in real browsers – the pilot's runtime checks (audit/lit-port-plan.md, acceptance checks 1, 2
 * and 7): grid keyboard, range selection, editing and undo, paste, sort, checked rows, windowing at 10,000 rows.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/data-table";
import { numberColumnIcon, tagColumnIcon, type DataColumn, type DataRow, type TcDataTable } from "../../src/elements/data-table";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const columns = (): DataColumn[] => [
  { key: "name", label: "Company", type: "title" },
  { key: "stage", label: "Stage", type: "tag", icon: tagColumnIcon() },
  { key: "arr", label: "ARR", type: "number", icon: numberColumnIcon() },
];
const rows = (): DataRow[] => [
  { id: "a", name: "Acme", stage: "Lead", arr: 1200 },
  { id: "b", name: "Bolt", stage: "Won", arr: 800 },
  { id: "c", name: "Cove", stage: "Lead", arr: 400 },
];
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const grid = (el: TcDataTable) => el.querySelector<HTMLElement>("[role=grid]")!;
const cell = (el: TcDataTable, r: number, c: number) => el.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`)!;

describe("tc-data-table", () => {
  test("the header: the heading in cardHead, with the table icon, or a copy of the app's own icon", async () => {
    const el = await fixture<TcDataTable>(html`<tc-data-table heading="Accounts" .columns=${columns()} .rows=${rows()}></tc-data-table>`);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Accounts");
    expect(el.querySelector(".tc-head + .ui-dt__card")).toBeTruthy();
    expect(el.querySelector(".tc-head__icon rect")).toBeTruthy();
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.innerHTML = '<circle cx="8" cy="8" r="5"></circle>';
    el.icon = icon;
    await settle();
    expect(el.querySelector(".tc-head__icon > svg:not(.tc-head__glyph) circle")).toBeTruthy();
    expect(icon.isConnected).toBe(false);
  });

  test("a grid: arrows move the active cell, which aria-activedescendant points at", async () => {
    const el = await fixture<TcDataTable>(html`<tc-data-table heading="Accounts" .columns=${columns()} .rows=${rows()}></tc-data-table>`);
    const g = grid(el);
    expect(g.getAttribute("aria-rowcount")).toBe("4");
    g.focus();
    key(g, "ArrowDown");
    await settle();
    key(g, "ArrowRight");
    await settle();
    key(g, "ArrowDown");
    await settle();
    const active = document.getElementById(g.getAttribute("aria-activedescendant")!)!;
    expect(active).toBe(cell(el, 1, 1));
    expect(active.textContent!.trim()).toBe("Won");
    expect(el.querySelector(".ui-dt__summary")!.textContent).toBe("B2");
  });

  test("Shift extends a range; the footer sums numbers and announces it", async () => {
    const el = await fixture<TcDataTable>(html`<tc-data-table heading="Accounts" .columns=${columns()} .rows=${rows()}></tc-data-table>`);
    const g = grid(el);
    g.focus();
    key(g, "ArrowDown");
    await settle();
    key(g, "End");
    await settle();
    key(g, "ArrowDown", { shiftKey: true });
    key(g, "ArrowDown", { shiftKey: true });
    await settle();
    expect(el.querySelector(".ui-dt__summary")!.textContent).toBe("3 values · Sum 2,400");
    expect(el.querySelector("[role=status]")!.textContent).toBe("3 values · Sum 2,400");
    expect(el.querySelectorAll("[data-in-range]").length).toBe(2);
  });

  test("typing edits a cell, Enter saves and moves down; undo restores; tc-rows-change reports every change", async () => {
    const onRows = vi.fn();
    const el = await fixture<TcDataTable>(html`<tc-data-table heading="Accounts" .columns=${columns()} .rows=${rows()} @tc-rows-change=${onRows}></tc-data-table>`);
    const g = grid(el);
    g.focus();
    key(g, "ArrowDown");
    await settle();
    key(g, "Z");
    await settle();
    const input = el.querySelector<HTMLInputElement>(".ui-dt__input")!;
    expect(document.activeElement).toBe(input);
    input.value = "Zeta";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    key(input, "Enter");
    await settle();
    expect(el.rows[0].name).toBe("Zeta");
    expect(onRows).toHaveBeenCalledTimes(1);
    expect(cell(el, 1, 0).hasAttribute("data-active")).toBe(true);
    el.querySelector<HTMLButtonElement>(".ui-dt__tool")!.click();
    await settle();
    expect(el.rows[0].name).toBe("Acme");
  });

  test("paste fills a block from tab-separated text", async (ctx) => {
    // Firefox ignores clipboardData on a scripted ClipboardEvent, so a synthetic paste carries no text there
    const probe = new DataTransfer();
    probe.setData("text/plain", "x");
    if (!new ClipboardEvent("paste", { clipboardData: probe }).clipboardData?.getData("text/plain")) ctx.skip();
    const el = await fixture<TcDataTable>(html`<tc-data-table heading="Accounts" .columns=${columns()} .rows=${rows()}></tc-data-table>`);
    const g = grid(el);
    g.focus();
    key(g, "ArrowDown");
    await settle();
    const data = new DataTransfer();
    data.setData("text/plain", "Delta\tWon\t1,500\nEcho\tLead\t$90");
    g.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    await settle();
    expect(el.rows.slice(0, 2).map((r) => [r.name, r.stage, r.arr])).toEqual([
      ["Delta", "Won", 1500],
      ["Echo", "Lead", 90],
    ]);
  });

  test("sorting by a header cycles asc, desc, none and sets aria-sort", async () => {
    const el = await fixture<TcDataTable>(html`<tc-data-table heading="Accounts" .columns=${columns()} .rows=${rows()}></tc-data-table>`);
    const th = () => el.querySelectorAll<HTMLElement>("th[role=columnheader]")[3];
    th().querySelector("button")!.click();
    await settle();
    expect(th().getAttribute("aria-sort")).toBe("ascending");
    expect(cell(el, 0, 0).textContent!.trim()).toBe("Cove");
    th().querySelector("button")!.click();
    await settle();
    expect(th().getAttribute("aria-sort")).toBe("descending");
    th().querySelector("button")!.click();
    await settle();
    expect(th().getAttribute("aria-sort")).toBe("none");
  });

  test("checked rows: the bulk bar deletes them and focus lands on the grid, not <body>", async () => {
    const el = await fixture<TcDataTable>(html`<tc-data-table heading="Accounts" .columns=${columns()} .rows=${rows()}></tc-data-table>`);
    const checks = () => [...el.querySelectorAll<HTMLButtonElement>("tbody [role=checkbox]")];
    checks()[0].click();
    checks()[2].click();
    await settle();
    expect(el.selection).toEqual(["a", "c"]);
    expect(el.querySelector("[role=status]")!.textContent).toBe("2 rows selected");
    const del = el.querySelector<HTMLButtonElement>(".ui-dt__add--danger")!;
    del.focus();
    del.click();
    await settle();
    expect(el.rows.map((r) => r.id)).toEqual(["b"]);
    expect(document.activeElement).toBe(grid(el));
  });

  test("renderCell draws a cell from the app; icons are cloned into the headers", async () => {
    const renderCell = (row: DataRow, col: DataColumn) => (col.key === "arr" ? `€${row.arr}` : undefined);
    const el = await fixture<TcDataTable>(html`<tc-data-table heading="Accounts" .columns=${columns()} .rows=${rows()} .renderCell=${renderCell}></tc-data-table>`);
    expect(cell(el, 0, 2).textContent!.trim()).toBe("€1200");
    expect(el.querySelectorAll(".ui-dt__col-icon svg").length).toBe(2);
  });

  test("10,000 rows: only the rows near the viewport render; mount and scroll stay fast", async () => {
    const many: DataRow[] = Array.from({ length: 10000 }, (_, i) => ({ id: `r${i}`, name: `Company ${i}`, stage: i % 2 ? "Won" : "Lead", arr: i }));
    const t = performance.now();
    const el = await fixture<TcDataTable>(html`<tc-data-table heading="Many" .columns=${columns()} .rows=${many}></tc-data-table>`);
    const mount = performance.now() - t;
    expect(el.querySelectorAll("tbody tr[aria-rowindex]").length).toBeLessThan(80);
    expect(grid(el).getAttribute("aria-rowcount")).toBe("10001");
    const g = grid(el);
    g.focus();
    key(g, "ArrowDown");
    await settle();
    key(g, "ArrowDown", { ctrlKey: true, metaKey: true });
    await settle();
    await settle();
    const active = document.getElementById(g.getAttribute("aria-activedescendant")!);
    expect(active?.textContent?.trim()).toBe("Company 9999");
    expect(active!.closest("tr")!.getAttribute("aria-rowindex")).toBe("10001");
    expect(mount).toBeLessThan(400);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`axe (${look})`, async () => {
      const el = await fixture<TcDataTable>(html`<tc-data-table look=${look} heading="Accounts" .columns=${columns()} .rows=${rows()} .selection=${["b"]}></tc-data-table>`);
      grid(el).focus();
      key(grid(el), "ArrowDown");
      await settle();
      await new Promise((r) => setTimeout(r, 300));
      const result = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
