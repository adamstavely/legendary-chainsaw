/*
 * <tc-enrichment-grid> in real browsers: the grid and its headers, cell states in words, the progress line, Pause /
 * Resume and Retry, picking a cell, the keyboard (with rows drawn only in view), the prompt tooltip, the React wrapper
 * and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/enrichment-grid";
import {
  enrichmentProgress,
  enrichmentTimeLeft,
  type EnrichmentCellSelect,
  type EnrichmentColumn,
  type EnrichmentRetry,
  type EnrichmentRow,
  type TcEnrichmentGrid,
} from "../../src/elements/enrichment-grid";
import { EnrichmentGrid } from "../../src/elements/react/enrichment-grid";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const COLUMNS: EnrichmentColumn[] = [
  { id: "vendor", label: "Vendor" },
  { id: "industry", label: "Industry", ai: true, prompt: "What industry is {{vendor}} in?" },
  { id: "hq", label: "HQ", ai: true },
];
const ROWS: EnrichmentRow[] = [
  { id: "a", cells: { vendor: "Northwind", industry: { state: "done", value: "Software", confidence: 0.92, source: "https://example.org/a" }, hq: { state: "review", value: "Porto", confidence: 0.4, note: "Two pages disagree" } } },
  { id: "b", cells: { vendor: "Cedarfield", industry: { state: "running" }, hq: { state: "failed", note: "Timed out" } } },
  { id: "c", cells: { vendor: "Harborstone" } },
];
const many = (n: number): EnrichmentRow[] => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, cells: { vendor: `Vendor ${i}`, industry: { state: "done", value: `V${i}` } } }));

const make = (look: "standard" | "clean" = "standard", rows = ROWS) =>
  fixture<TcEnrichmentGrid>(html`<tc-enrichment-grid look=${look} heading="Vendors" running locale="en-GB" .columns=${COLUMNS} .rows=${rows} .remaining=${240000}></tc-enrichment-grid>`);
const cell = (el: Element, row: number, col: number) => el.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`)!;
const key = (k: string, init: KeyboardEventInit = {}) =>
  document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const at = () => {
  const a = document.activeElement as HTMLElement;
  return `${a.dataset.row}:${a.dataset.col}`;
};
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;

describe("tc-enrichment-grid", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid named by its heading, headers with the AI columns marked, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("eng");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect(grid.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      expect(grid.getAttribute("aria-rowcount")).toBe("4");
      const heads = [...el.querySelectorAll('[role="columnheader"]')];
      expect(heads.map((h) => h.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Vendor", "Industry (AI column) Prompt: What industry is {{vendor}} in?", "HQ (AI column)"]);
      expect(heads[1].querySelector(".ui-eng__spark")).not.toBeNull();
      expect(el.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(cell(el, 0, 0).getAttribute("role")).toBe("rowheader");
    });
  }

  test("cells say their state in words, with confidence, review and a source link", async () => {
    const el = await make();
    expect(cell(el, 0, 1).textContent!.replace(/\s+/g, " ")).toContain("Software92% confidence");
    expect(cell(el, 0, 1).querySelector<HTMLAnchorElement>(".ui-eng__source")!.href).toBe("https://example.org/a");
    expect(cell(el, 0, 2).querySelector(".ui-eng__review")!.textContent).toBe("Review");
    expect(cell(el, 0, 2).querySelector(".ui-eng__conf")!.hasAttribute("data-low")).toBe(true);
    expect(cell(el, 1, 1).textContent).toContain("Filling");
    expect(cell(el, 1, 2).textContent).toContain("Failed");
    expect(cell(el, 2, 1).textContent).toContain("Queued");
  });

  test("progress in words: filled of total, failed, to review, time left – and Paused", async () => {
    const p = enrichmentProgress(COLUMNS, ROWS);
    expect(p).toEqual({ total: 6, filled: 2, done: 1, review: 1, running: 1, queued: 2, failed: 1 });
    expect(enrichmentTimeLeft(30_000)).toBe("under a minute left");
    expect(enrichmentTimeLeft(240_000)).toBe("~4 min left");
    expect(enrichmentTimeLeft(3 * 3_600_000)).toBe("~3 h left");
    const el = await make();
    expect(el.querySelector(".ui-eng__progress")!.textContent).toBe("2 of 6 cells · 1 failed · 1 to review · ~4 min left");
    el.running = false;
    await settle();
    expect(el.querySelector(".ui-eng__progress")!.textContent).toBe("2 of 6 cells · 1 failed · 1 to review · Paused");
  });

  test("Pause and Resume fire tc-run-change; prevented, running stays", async () => {
    const el = await make();
    const seen: boolean[] = [];
    el.addEventListener("tc-run-change", (e) => seen.push((e as CustomEvent).detail.running));
    const run = el.querySelector<HTMLButtonElement>(".ui-eng__run")!;
    expect(run.textContent!.trim()).toBe("Pause");
    run.click();
    await settle();
    expect(el.running).toBe(false);
    expect(status(el)).toBe("Run paused");
    expect(el.querySelector(".ui-eng__run")!.textContent!.trim()).toBe("Resume");
    el.addEventListener("tc-run-change", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-eng__run")!.click();
    await settle();
    expect(el.running).toBe(false);
    expect(seen).toEqual([false, true]);
  });

  test("Retry failed and R on a failed cell fire tc-retry with the cells", async () => {
    const el = await make();
    const seen: EnrichmentRetry[] = [];
    el.addEventListener("tc-retry", (e) => seen.push((e as CustomEvent<EnrichmentRetry>).detail));
    const all = el.querySelector<HTMLButtonElement>(".ui-eng__retry-all")!;
    expect(all.textContent!.trim()).toBe("Retry failed (1)");
    all.click();
    await settle();
    expect(seen[0].cells).toEqual([{ row: "b", column: "hq" }]);
    expect(status(el)).toBe("Retrying 1 cell");
    cell(el, 1, 2).focus();
    key("r");
    await settle();
    expect(seen).toHaveLength(2);
    cell(el, 0, 1).focus();
    key("r");
    await settle();
    expect(seen).toHaveLength(2);
  });

  test("picking a cell – click, Enter or Space – fires tc-cell-select and marks it; prevented, nothing changes", async () => {
    const el = await make();
    let detail: EnrichmentCellSelect | null = null;
    el.addEventListener("tc-cell-select", (e) => (detail = (e as CustomEvent<EnrichmentCellSelect>).detail));
    cell(el, 0, 1).click();
    await settle();
    expect(detail!.row).toBe("a");
    expect(detail!.column).toBe("industry");
    expect(detail!.selected).toEqual({ row: "a", column: "industry" });
    expect(detail!.cell).toMatchObject({ value: "Software" });
    expect(cell(el, 0, 1).getAttribute("aria-selected")).toBe("true");
    expect(status(el)).toBe("Picked Industry, Northwind");
    cell(el, 2, 0).focus();
    key("Enter");
    await settle();
    expect(detail!.cell).toBe("Harborstone");
    el.addEventListener("tc-cell-select", (e) => e.preventDefault());
    cell(el, 1, 1).focus();
    key(" ");
    await settle();
    expect(el.selected).toEqual({ row: "c", column: "vendor" });
  });

  test("keyboard: arrows, Home/End, Ctrl+Home/End and up into the headers", async () => {
    const el = await make();
    cell(el, 0, 0).focus();
    key("ArrowRight");
    await settle();
    expect(at()).toBe("0:1");
    key("End");
    await settle();
    expect(at()).toBe("0:2");
    key("End", { ctrlKey: true, metaKey: true });
    await settle();
    expect(at()).toBe("2:2");
    key("Home");
    await settle();
    expect(at()).toBe("2:0");
    key("Home", { ctrlKey: true, metaKey: true });
    await settle();
    expect(at()).toBe("0:0");
    key("ArrowRight");
    await settle();
    key("ArrowUp");
    await settle();
    expect(at()).toBe("-1:1");
    expect(document.activeElement!.getAttribute("role")).toBe("columnheader");
    expect(el.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  test("the prompt shows on a focused AI header and Escape hides it", async () => {
    const el = await make();
    const head = el.querySelector<HTMLElement>('.ui-eng__colhead[data-col="1"]')!;
    const tip = head.querySelector<HTMLElement>(".ui-eng__tip")!;
    expect(head.getAttribute("aria-describedby")).toBe(tip.id);
    expect(tip.getAttribute("role")).toBe("tooltip");
    cell(el, 0, 1).focus();
    key("ArrowUp");
    await settle();
    await expect.poll(() => getComputedStyle(tip).display).toBe("block");
    key("Escape");
    await settle();
    expect(getComputedStyle(tip).display).toBe("none");
  });

  test("thousands of rows: only those in view are drawn, and the tab stop's row stays drawn", async () => {
    const el = await make("standard", many(2000));
    const drawn = el.querySelectorAll(".ui-eng__row:not(.ui-eng__headrow)").length;
    expect(drawn).toBeGreaterThan(5);
    expect(drawn).toBeLessThan(60);
    expect(el.querySelector('[role="grid"]')!.getAttribute("aria-rowcount")).toBe("2001");
    cell(el, 0, 0).focus();
    key("End", { ctrlKey: true, metaKey: true });
    await settle();
    await expect.poll(() => at()).toBe("1999:0");
    expect(document.activeElement!.closest('[role="row"]')!.getAttribute("aria-rowindex")).toBe("2001");
    const scroller = el.querySelector<HTMLElement>(".ui-eng__scroll")!;
    expect(scroller.scrollTop).toBeGreaterThan(1000);
    key("PageUp");
    await settle();
    expect(Number(at().split(":")[0])).toBeLessThan(1999);
  });

  test("empty: no columns or no rows say so", async () => {
    const none = await fixture<TcEnrichmentGrid>(html`<tc-enrichment-grid></tc-enrichment-grid>`);
    expect(none.querySelector(".ui-eng__none")!.textContent).toBe("No columns yet");
    const empty = await fixture<TcEnrichmentGrid>(html`<tc-enrichment-grid .columns=${COLUMNS}></tc-enrichment-grid>`);
    expect(empty.querySelector(".ui-eng__none")!.textContent).toBe("No rows yet");
    expect(empty.querySelector(".ui-eng__progress")!.textContent).toBe("No rows");
  });

  test("React: an uncontrolled pause survives re-renders; controlled running stays until the parent changes it", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const seen: string[] = [];
    const render = (props: Partial<React.ComponentProps<typeof EnrichmentGrid>>) =>
      act(async () => root.render(React.createElement(EnrichmentGrid, { title: "Vendors", columns: COLUMNS, rows: ROWS, ...props })));
    await render({ defaultRunning: true, onRunChange: (r) => void seen.push(`run ${r}`), onCellSelect: (s, c) => void seen.push(`pick ${s.row} ${typeof c}`) });
    const el = wrap.querySelector<TcEnrichmentGrid>("tc-enrichment-grid")!;
    await settle(wrap);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Vendors");
    el.querySelector<HTMLButtonElement>(".ui-eng__run")!.click();
    await settle(wrap);
    await render({ defaultRunning: true, onRunChange: (r) => void seen.push(`run ${r}`), onCellSelect: (s, c) => void seen.push(`pick ${s.row} ${typeof c}`) });
    await settle(wrap);
    expect(el.running).toBe(false);
    cell(el, 0, 1).click();
    await settle(wrap);
    expect(seen).toEqual(["run false", "pick a object"]);
    await render({ running: true, onRunChange: () => {} });
    await settle(wrap);
    el.querySelector<HTMLButtonElement>(".ui-eng__run")!.click();
    await settle(wrap);
    expect(el.running).toBe(true);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.cssText = `color-scheme: ${theme}`;
      wrap.innerHTML = `<tc-enrichment-grid look="standard" running></tc-enrichment-grid><tc-enrichment-grid look="clean"></tc-enrichment-grid>`;
      wrap.querySelectorAll<TcEnrichmentGrid>("tc-enrichment-grid").forEach((el) => {
        el.columns = COLUMNS;
        el.rows = ROWS;
        el.selected = { row: "a", column: "industry" };
      });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
