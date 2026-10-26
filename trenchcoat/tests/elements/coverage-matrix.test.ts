/*
 * <tc-coverage-matrix> in real browsers: the grid, statuses and totals, the legend's counts, a cell's detail on Enter
 * or click, the grid keyboard, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/coverage-matrix";
import type { CoverageCellRef, CoverageCheck, CoverageMap, CoverageOpenChange, CoveragePart, TcCoverageMatrix } from "../../src/elements/coverage-matrix";
import { CoverageMatrix } from "../../src/elements/react/coverage-matrix";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const checks: CoverageCheck[] = [
  { id: "inj", label: "Prompt injection", description: "Hidden instructions" },
  { id: "pii", label: "Personal data" },
];
const parts: CoveragePart[] = [
  { id: "chat", label: "Chat" },
  { id: "email", label: "Email agent" },
  { id: "code", label: "Code agent" },
];
/** inj: covered, partial, (gap by default) · pii: covered, gap, none */
const MAP: CoverageMap = {
  inj: { chat: { status: "covered", detail: "Runs every release.", evidence: "142 cases" }, email: "partial" },
  pii: { chat: "covered", email: { status: "gap", detail: "Nothing tests forwarding." }, code: "none" },
};

const cell = (el: Element, r: number, c: number) => el.querySelector<HTMLElement>(`[data-cell="${r}:${c}"]`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const make = (look: "standard" | "clean" = "standard", open: CoverageCellRef | null = null) =>
  fixture<TcCoverageMatrix>(html`<tc-coverage-matrix look=${look} description="Suites against surfaces." .checks=${checks} .parts=${parts} .coverage=${MAP} .open=${open}></tc-coverage-matrix>`);
const finish = async (root: Element) => {
  for (const a of root.getAnimations?.({ subtree: true }) ?? []) a.finish();
  await settle();
};

describe("tc-coverage-matrix", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, the grid's headers, one tab stop and each cell's status`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("cov");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toBe("Coverage");
      expect([...grid.querySelectorAll('[role="columnheader"]')].map((h) => h.textContent!.trim())).toEqual(["Check", "Chat", "Email agent", "Code agent", "Coverage"]);
      expect([...grid.querySelectorAll('[role="rowheader"]')].map((h) => h.querySelector(".ui-cov__check-label")!.textContent)).toEqual(["Prompt injection", "Personal data", "Coverage"]);
      expect(grid.getAttribute("aria-rowcount")).toBe("4");
      expect(grid.getAttribute("aria-colcount")).toBe("5");
      expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect([0, 1, 2].map((c) => cell(el, 0, c).dataset.status)).toEqual(["covered", "partial", "gap"]);
      expect([0, 1, 2].map((c) => cell(el, 1, c).dataset.status)).toEqual(["covered", "gap", "none"]);
      expect(cell(el, 0, 1).querySelector(".ui-cov__sr")!.textContent).toBe("Partial");
    });
  }

  test("totals: the share covered per row, column and overall – partial counts half, not applicable is left out", async () => {
    const el = await make();
    const num = (r: number, c: number) => cell(el, r, c).querySelector(".ui-cov__total-num")!.textContent;
    // inj: 1 + 0.5 + 0 of 3 → 50%; pii: 1 + 0 of 2 → 50%
    expect([num(0, 3), num(1, 3)]).toEqual(["50%", "50%"]);
    // Columns: chat 100%, email 25%, code 0% (one applicable gap)
    expect([num(2, 0), num(2, 1), num(2, 2)]).toEqual(["100%", "25%", "0%"]);
    // Overall: 2.5 of 5
    expect(num(2, 3)).toBe("50%");
    expect(el.querySelector(".ui-cov__overall-num")!.textContent).toBe("50%");
    el.partialWeight = 1;
    await settle();
    expect(num(0, 3)).toBe("67%");
    // The legend counts each status
    expect([...el.querySelectorAll(".ui-cov__legend-item")].map((i) => i.textContent!.trim())).toEqual(["Covered2", "Partial1", "Gap2", "Not applicable1"]);
    el.defaultStatus = "none";
    await settle();
    expect(num(0, 3)).toBe("100%");
  });

  test("click or Enter opens a cell's detail; Enter again or Escape closes it; tc-open-change fires", async () => {
    const el = await make();
    const events: CoverageOpenChange[] = [];
    el.addEventListener("tc-open-change", (e) => events.push((e as CustomEvent<CoverageOpenChange>).detail));
    cell(el, 1, 1).click();
    await settle();
    expect(el.open).toEqual({ check: "pii", part: "email" });
    expect(events[0]).toEqual({ open: { check: "pii", part: "email" }, cell: { status: "gap", detail: "Nothing tests forwarding." } });
    const detail = el.querySelector(".ui-cov__detail")!;
    expect(cell(el, 1, 1).getAttribute("aria-controls")).toBe(detail.id);
    expect(cell(el, 1, 1).querySelector(".ui-cov__sr")!.textContent).toBe("Gap, detail shown");
    expect(document.getElementById(detail.getAttribute("aria-labelledby")!)!.textContent).toBe("Personal data ×  for Email agent");
    expect(detail.querySelector(".ui-cov__detail-text")!.textContent).toBe("Nothing tests forwarding.");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Personal data for Email agent: Gap. Nothing tests forwarding.");
    // Enter on another cell moves the detail; Enter on the open one closes it
    cell(el, 0, 0).focus();
    key(cell(el, 0, 0), "Enter");
    await settle();
    expect(el.querySelector(".ui-cov__evidence")!.textContent).toBe("142 cases");
    expect(el.querySelector(".ui-cov__detail-check")!.textContent).toBe("Hidden instructions");
    key(cell(el, 0, 0), "Enter");
    await settle();
    expect(el.open).toBeNull();
    key(cell(el, 0, 0), " ");
    await settle();
    expect(el.open).toEqual({ check: "inj", part: "chat" });
    key(cell(el, 0, 0), "Escape");
    await settle();
    expect(el.querySelector(".ui-cov__detail")).toBeNull();
    // A total has no detail
    key(cell(el, 0, 3), "Enter");
    await settle();
    expect(el.open).toBeNull();
    // A gap with no detail says so
    cell(el, 0, 2).click();
    await settle();
    expect(el.querySelector(".ui-cov__detail-text")!.textContent).toBe("Nothing covers this yet.");
  });

  test("keyboard: arrows, Home/End, ⌘/Ctrl+Home/End and Page keys move a roving tab stop, totals included", async () => {
    const el = await make();
    const at = () => (document.activeElement as HTMLElement).dataset.cell;
    cell(el, 0, 0).focus();
    key(document.activeElement!, "ArrowRight");
    await settle();
    expect(at()).toBe("0:1");
    expect(cell(el, 0, 0).tabIndex).toBe(-1);
    key(document.activeElement!, "End");
    await settle();
    expect(at()).toBe("0:3");
    key(document.activeElement!, "ArrowDown");
    await settle();
    key(document.activeElement!, "ArrowDown");
    await settle();
    expect(at()).toBe("2:3");
    key(document.activeElement!, "ArrowDown");
    await settle();
    expect(at()).toBe("2:3");
    key(document.activeElement!, "Home", { ctrlKey: true, metaKey: true });
    await settle();
    expect(at()).toBe("0:0");
    key(document.activeElement!, "End", { ctrlKey: true, metaKey: true });
    await settle();
    expect(at()).toBe("2:3");
    key(document.activeElement!, "PageUp");
    await settle();
    expect(at()).toBe("0:3");
    key(document.activeElement!, "Home");
    await settle();
    expect(at()).toBe("0:0");
  });

  test("controlled: preventDefault() keeps the detail as it is", async () => {
    const el = await make("clean", { check: "inj", part: "chat" });
    expect(el.querySelector(".ui-cov__detail")).toBeTruthy();
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    cell(el, 1, 1).click();
    key(cell(el, 1, 1), "Escape");
    await settle();
    expect(el.open).toEqual({ check: "inj", part: "chat" });
  });

  test("focus: Close returns to the cell; rows going away keep the tab stop and close a detail they held", async () => {
    const el = await make();
    cell(el, 1, 2).click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-cov__close")!.focus();
    el.querySelector<HTMLButtonElement>(".ui-cov__close")!.click();
    await settle();
    expect(el.querySelector(".ui-cov__detail")).toBeNull();
    expect(document.activeElement).toBe(cell(el, 1, 2));
    cell(el, 1, 1).click();
    await settle();
    el.checks = [checks[0]];
    el.parts = [parts[0]];
    await settle();
    expect(el.open).toBeNull();
    expect(el.querySelectorAll('[role="grid"] [tabindex="0"]')).toHaveLength(1);
    expect(el.querySelector('[role="grid"] [tabindex="0"]')!.getAttribute("data-cell")).toBe("1:1");
  });

  test("labels can be renamed; an empty element renders without errors", async () => {
    const el = await make();
    el.statusLabels = { gap: "Missing" };
    el.totalLabel = "Share";
    await settle();
    expect(el.querySelector(".ui-cov__legend")!.textContent).toContain("Missing");
    expect(el.querySelector(".ui-cov__part--total")!.textContent!.trim()).toBe("Share");
    const empty = await fixture<TcCoverageMatrix>(html`<tc-coverage-matrix></tc-coverage-matrix>`);
    expect(empty.querySelector(".ui-cov__empty")).toBeTruthy();
    expect(empty.querySelector('[role="grid"]')).toBeNull();
  });

  test("React wrapper: an uncontrolled open cell survives parent re-renders; onOpenChange gets the cell", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(CoverageMatrix, {
        title: "Red-team coverage",
        checks,
        parts,
        coverage: MAP,
        onOpenChange: (o, c) => void seen.push([o?.part ?? null, c?.status]),
        "data-n": n,
      } as React.ComponentProps<typeof CoverageMatrix>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-coverage-matrix")!;
    expect(el.querySelector(".ui-cov__title")!.textContent).toBe("Red-team coverage");
    cell(el, 0, 1).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.querySelector(".ui-cov__detail")).toBeTruthy();
    expect(seen).toEqual([["email", "partial"]]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled open cell stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: (CoverageCellRef | null)[] = [];
    await act(async () => root.render(React.createElement(CoverageMatrix, { checks, parts, coverage: MAP, open: null, onOpenChange: (o) => void asked.push(o) })));
    await settle();
    const el = host.querySelector("tc-coverage-matrix")!;
    cell(el, 0, 0).click();
    await settle();
    expect(asked).toEqual([{ check: "inj", part: "chat" }]);
    expect(el.querySelector(".ui-cov__detail")).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-coverage-matrix description="Suites against surfaces." .checks=${checks} .parts=${parts} .coverage=${MAP} .open=${{ check: "pii", part: "email" }}></tc-coverage-matrix>
        <tc-coverage-matrix look="clean" .checks=${checks} .parts=${parts} .coverage=${MAP} .open=${{ check: "inj", part: "chat" }}></tc-coverage-matrix>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
