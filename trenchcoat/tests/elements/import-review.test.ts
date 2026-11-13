/*
 * <tc-import-review> in real browsers: cell problems in words, duplicates by a key with Keep this and Merge, the tabs
 * with counts, editing a cell from the keyboard as a cancelable change, skip and restore, Import held with its reason
 * or with rows with problems skipped, the grid keyboard, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/import-review";
import { cellProblem, duplicateGroups, type ImportReviewColumn, type ImportReviewImport, type ImportReviewRow, type ImportReviewRowsChange, type TcImportReview } from "../../src/elements/import-review";
import { ImportReview } from "../../src/elements/react/import-review";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const COLUMNS: ImportReviewColumn[] = [
  { id: "name", label: "Vendor name", required: true },
  { id: "email", label: "Contact email", type: "email", required: true },
  { id: "start", label: "Contract start", type: "date" },
  { id: "spend", label: "Annual spend", type: "number" },
];
const row = (id: string, name: string, email: string, start: string, spend: string): ImportReviewRow => ({ id, cells: { name, email, start, spend } });
const ROWS: ImportReviewRow[] = [
  row("r1", "Kestrel Lab Supplies", "orders@kestrel-lab.example", "2024-03-01", "48,200"),
  row("r2", "Northfield Survey Co.", "hello@northfield", "2025-01-06", "19,750"),
  row("r3", "Marlow & Finch", "billing@marlowfinch.example", "Spring 2022", "8,400"),
  row("r4", "Kestrel Lab Supplies Ltd", "orders@kestrel-lab.example", "", "48,200"),
  row("r5", "", "ops@lowmoor.example", "2025-02-20", "lots"),
  row("r6", "Elmstead Data", "finance@elmstead.example", "2023-02-01", "211,900"),
];

const make = (rows = ROWS) => fixture<TcImportReview>(html`<tc-import-review heading="Review vendors" duplicate-key="email" .columns=${COLUMNS} .rows=${rows}></tc-import-review>`);
const cell = (el: Element, r: number, c: number) => el.querySelector<HTMLElement>(`[data-row="${r}"][data-col="${c}"]`)!;
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const tabs = (el: Element) => [...el.querySelectorAll('[role="tab"]')].map((t) => t.textContent!.replace(/\s+/g, " ").trim());
const btn = (el: Element, text: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent!.replace(/\s+/g, " ").trim() === text)!;
const active = () => document.activeElement as HTMLElement;

describe("tc-import-review", () => {
  test("helpers: a cell's problem in words; duplicate groups by key", () => {
    expect(cellProblem("", COLUMNS[0], ROWS[0])).toBe("Missing – required");
    expect(cellProblem("hello@northfield", COLUMNS[1], ROWS[0])).toBe("Not an email address");
    expect(cellProblem("Spring 2022", COLUMNS[2], ROWS[0])).toBe("Not a date");
    expect(cellProblem("lots", COLUMNS[3], ROWS[0])).toBe("Not a number");
    expect(cellProblem("", COLUMNS[2], ROWS[0])).toBeNull();
    expect(cellProblem("x", { id: "c", label: "Country" }, ROWS[0], (v) => (v.length < 2 ? "Too short" : null))).toBe("Too short");
    expect(duplicateGroups(ROWS, "email").map((g) => g.map((r) => r.id))).toEqual([["r1", "r4"]]);
    expect(duplicateGroups([...ROWS.slice(0, 3), { ...ROWS[3], skip: true }], "email")).toEqual([]);
  });

  test("the host is the root, in both looks; a grid named by the heading, tabs with counts, a summary", async () => {
    const el = await make();
    expect(el.dataset.ui).toBe("imr");
    expect(el.dataset.look).toBe("standard");
    const grid = el.querySelector('[role="grid"]')!;
    expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toBe("Review vendors");
    expect(el.querySelectorAll('[role="rowheader"]')).toHaveLength(6);
    expect([...el.querySelectorAll('[role="columnheader"]')].map((h) => h.textContent!.replace(/\s+/g, " ").trim())).toEqual([
      "Row",
      "Vendor name*, required",
      "Contact email*, required",
      "Contract start",
      "Annual spend",
      "Status",
      "Actions",
    ]);
    expect(tabs(el)).toEqual(["All, 6", "With problems, 3", "Duplicates, 2"]);
    expect(el.querySelector(".ui-imr__summary")!.textContent).toBe("2 rows ready, 3 to fix, 1 duplicate");
    expect(el.querySelectorAll('[tabindex="0"]')).toHaveLength(2); // the grid's tab stop and the selected tab
    el.look = "clean";
    await settle();
    expect(el.querySelector(":scope > .ui-imr__card > .ui-imr__foot")).not.toBeNull();
  });

  test("cell problems are marked and said in words; the status cell lists the row's problems", async () => {
    const el = await make();
    expect(cell(el, 1, 2).hasAttribute("data-problem")).toBe(true);
    expect(cell(el, 1, 2).textContent!.replace(/\s+/g, " ").trim()).toBe("hello@northfield , Not an email address");
    expect(cell(el, 4, 1).textContent!.replace(/\s+/g, " ").trim()).toBe("—empty , Missing – required");
    const st = cell(el, 4, 5);
    expect(st.textContent!.replace(/\s+/g, " ").trim()).toBe("2 to fix: Vendor name, Missing – required; Annual spend, Not a number");
    expect(cell(el, 3, 5).textContent!.trim()).toBe("Duplicate of row 1");
    expect(cell(el, 0, 5).textContent!.trim()).toBe("Has duplicates");
    expect(cell(el, 5, 5).textContent!.trim()).toBe("Ready");
  });

  test("editing a cell from the keyboard: Enter edits, Enter saves as a cancelable change, Escape cancels", async () => {
    const el = await make();
    cell(el, 1, 2).focus();
    await key(cell(el, 1, 2), "Enter");
    const input = el.querySelector<HTMLInputElement>(".ui-imr__input")!;
    expect(active()).toBe(input);
    expect(input.getAttribute("aria-label")).toBe("Contact email, row 2");
    input.value = "hello@northfield.example";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const seen = listen<ImportReviewRowsChange>(el, "tc-rows-change");
    await key(input, "Enter");
    expect(seen).toHaveLength(1);
    expect(seen[0].change).toBe("edit");
    expect(seen[0].id).toBe("r2");
    expect(seen[0].rows[1].cells.email).toBe("hello@northfield.example");
    expect(status(el)).toBe("Contact email in row 2 changed");
    expect(active()).toBe(cell(el, 1, 2));
    expect(cell(el, 1, 2).hasAttribute("data-problem")).toBe(false);
    await key(cell(el, 1, 2), "F2");
    const again = el.querySelector<HTMLInputElement>(".ui-imr__input")!;
    again.value = "nope";
    again.dispatchEvent(new Event("input", { bubbles: true }));
    await key(again, "Escape");
    expect(seen).toHaveLength(1);
    expect(el.rows[1].cells.email).toBe("hello@northfield.example");
  });

  test("a prevented change leaves the rows as they were", async () => {
    const el = await make();
    listen(el, "tc-rows-change", true);
    btn(el, "Skip, row 6").click();
    await settle();
    expect(el.rows[5].skip).toBeUndefined();
  });

  test("duplicates: Keep this skips the others; Merge fills this row's blanks from the others", async () => {
    const el = await make();
    btn(el, "Keep this, row 4").click();
    await settle();
    expect(el.rows.find((r) => r.id === "r1")!.skip).toBe(true);
    expect(el.rows.find((r) => r.id === "r4")!.skip).toBeUndefined();
    expect(status(el)).toBe("Kept row 4, skipped 1 duplicate");
    expect(tabs(el)[2]).toBe("Duplicates, 0");
    cleanup();
    const el2 = await make();
    const seen = listen<ImportReviewRowsChange>(el2, "tc-rows-change");
    btn(el2, "Merge, row 4").click();
    await settle();
    expect(seen[0].change).toBe("merge");
    const merged = el2.rows.find((r) => r.id === "r4")!;
    expect(merged.cells).toEqual({ name: "Kestrel Lab Supplies Ltd", email: "orders@kestrel-lab.example", start: "2024-03-01", spend: "48,200" });
    expect(el2.rows.find((r) => r.id === "r1")!.skip).toBe(true);
    expect(status(el2)).toBe("Merged 2 rows into row 4");
  });

  test("skip and restore; a skipped row is struck through, out of the counts, with Restore", async () => {
    const el = await make();
    btn(el, "Skip, row 5").click();
    await settle();
    expect(status(el)).toBe("Row 5 skipped");
    expect(cell(el, 4, 5).textContent!.trim()).toBe("Skipped");
    expect(el.querySelector(".ui-imr__summary")!.textContent).toBe("2 rows ready, 2 to fix, 1 duplicate, 1 skipped");
    btn(el, "Restore, row 5").click();
    await settle();
    expect(el.rows[4].skip).toBe(false);
  });

  test("tabs: a cancelable filter; With problems and Duplicates show only those rows; arrow keys move", async () => {
    const el = await make();
    const stop = listen(el, "tc-filter-change", true);
    el.querySelector<HTMLButtonElement>('[data-filter="problems"]')!.click();
    await settle();
    expect(el.filter).toBe("all");
    expect(stop).toHaveLength(1);
    cleanup();
    const el2 = await make();
    const seen = listen<{ filter: string }>(el2, "tc-filter-change");
    const all = el2.querySelector<HTMLButtonElement>('[data-filter="all"]')!;
    all.focus();
    await key(all, "ArrowRight");
    expect(seen).toEqual([{ filter: "problems" }]);
    expect(active().dataset.filter).toBe("problems");
    expect([...el2.querySelectorAll('[role="rowheader"]')].map((r) => r.textContent!.replace(/\D/g, ""))).toEqual(["2", "3", "5"]);
    await key(active(), "ArrowRight");
    expect([...el2.querySelectorAll('[role="rowheader"]')].map((r) => r.textContent!.replace(/\D/g, ""))).toEqual(["1", "4"]);
    expect(el2.querySelector('[role="tabpanel"]')!.getAttribute("aria-label")).toBe("Duplicates");
  });

  test("Import is held with the reason; Skip rows with problems lets it go, leaving those rows out", async () => {
    const el = await make();
    const go = el.querySelector<HTMLButtonElement>(".ui-imr__import")!;
    expect(go.getAttribute("aria-disabled")).toBe("true");
    expect(document.getElementById(go.getAttribute("aria-describedby")!)!.textContent).toBe("To import, fix 3 rows and resolve 1 duplicate, or skip rows with problems");
    const seen = listen<ImportReviewImport>(el, "tc-import");
    go.click();
    await settle();
    expect(seen).toHaveLength(0);
    expect(status(el)).toBe("To import, fix 3 rows and resolve 1 duplicate, or skip rows with problems");
    const box = el.querySelector<HTMLInputElement>(".ui-imr__check input")!;
    expect(document.getElementById(box.getAttribute("aria-describedby")!)!.textContent).toBe("Duplicates keep their first row");
    box.click();
    await settle();
    expect(el.skipProblems).toBe(true);
    expect(go.getAttribute("aria-disabled")).toBeNull();
    go.click();
    expect(seen[0].rows.map((r) => r.id)).toEqual(["r1", "r6"]);
    expect(seen[0].skipped.map((r) => r.id)).toEqual(["r2", "r3", "r4", "r5"]);
    await settle();
    expect(status(el)).toBe("Importing 2 rows, 4 rows left out");
  });

  test("the grid keyboard: one tab stop; arrows move cell by cell into the status and actions; Home / End", async () => {
    const el = await make();
    const first = cell(el, 0, 1);
    expect(first.tabIndex).toBe(0);
    first.focus();
    await key(first, "ArrowDown");
    expect(active()).toBe(cell(el, 1, 1));
    await key(active(), "ArrowLeft");
    expect(active()).toBe(cell(el, 1, 0));
    await key(active(), "End");
    expect(active().textContent!.replace(/\s+/g, " ").trim()).toBe("Skip, row 2");
    await key(active(), "Home");
    expect(active()).toBe(cell(el, 1, 0));
    await key(active(), "End", { ctrlKey: true, metaKey: true });
    expect(active()).toBe(cell(el, 5, 0));
    expect(el.querySelectorAll('[role="grid"] [tabindex="0"]')).toHaveLength(1);
  });

  test("page-size: Show more rows adds a page", async () => {
    const many = Array.from({ length: 7 }, (_, i) => row(`m${i}`, `Vendor ${i}`, `v${i}@x.example`, "2024-01-01", "100"));
    const el = await fixture<TcImportReview>(html`<tc-import-review page-size="3" .columns=${COLUMNS} .rows=${many}></tc-import-review>`);
    expect(el.querySelectorAll('[role="rowheader"]')).toHaveLength(3);
    const more = el.querySelector<HTMLButtonElement>(".ui-imr__more")!;
    expect(more.textContent!.replace(/\s+/g, " ").trim()).toBe("Show more rows3 of 7");
    more.click();
    await settle();
    expect(el.querySelectorAll('[role="rowheader"]')).toHaveLength(6);
    expect(el.querySelector('[data-filter="duplicates"]')).toBeNull();
  });

  test("React wrapper: uncontrolled rows survive a parent re-render; controlled stay with the app; onImport", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onRowsChange = vi.fn();
    const onImport = vi.fn(() => false);
    const draw = (n: number) => root.render(React.createElement(ImportReview, { title: `Review ${n}`, columns: COLUMNS, duplicateKey: "email", defaultRows: ROWS, defaultSkipProblems: true, onRowsChange, onImport }));
    await act(async () => draw(1));
    await settle();
    const el = host.querySelector("tc-import-review")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Review 1");
    await act(async () => btn(el, "Skip, row 6").click());
    expect(onRowsChange).toHaveBeenCalledWith(expect.any(Array), "skip", "r6");
    await act(async () => draw(2));
    await settle();
    expect(el.rows[5].skip).toBe(true);
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-imr__import")!.click());
    expect(onImport).toHaveBeenCalled();
    expect(status(el)).not.toContain("Importing");
    const onControlled = vi.fn();
    await act(async () => root.render(React.createElement(ImportReview, { columns: COLUMNS, rows: ROWS, onRowsChange: onControlled })));
    await settle();
    await act(async () => btn(el, "Skip, row 1").click());
    await settle();
    expect(onControlled).toHaveBeenCalledWith(expect.any(Array), "skip", "r1");
    expect(el.rows[0].skip).toBeUndefined();
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const rows = [...ROWS.slice(0, 5), { ...ROWS[5], skip: true }];
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-import-review look=${look} description="vendors.csv" duplicate-key="email" .columns=${COLUMNS} .rows=${rows}></tc-import-review>
            <div style="width: 360px"><tc-import-review look=${look} filter="problems" .columns=${COLUMNS} .rows=${ROWS}></tc-import-review></div>
          </div>`,
        );
        const first = wrap.querySelector("tc-import-review")!;
        cell(first, 0, 1).focus();
        await key(cell(first, 0, 1), "Enter");
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
