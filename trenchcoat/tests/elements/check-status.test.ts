/*
 * <tc-check-status> in real browsers: the summary and its order, compact, counts, opening and re-running, the keyboard,
 * the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/check-status";
import { countChecks, overallCheckState, type CheckItem, type TcCheckStatus } from "../../src/elements/check-status";
import { CheckStatus } from "../../src/elements/react/check-status";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const CHECKS: CheckItem[] = [
  { id: "lint", name: "Lint", state: "passing", durationMs: 90000 },
  { id: "docs", name: "Docs", state: "skipped" },
  { id: "e2e", name: "Browser", state: "pending" },
  { id: "unit", name: "Unit", state: "failing", detail: "2 failed" },
];
const make = (look: "standard" | "clean" = "standard") => fixture<TcCheckStatus>(html`<tc-check-status look=${look} .checks=${CHECKS} retryable></tc-check-status>`);
const ids = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-cks__row")].map((r) => r.dataset.id);

describe("tc-check-status", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: summary in words, failing first, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("cks");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-cks__summary")!.textContent).toBe("1 of 3 passed, 1 failed, 1 pending, 1 skipped");
      expect(ids(el)).toEqual(["unit", "e2e", "lint", "docs"]);
      expect(el.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
      expect(el.querySelector('[data-id="lint"] .ui-cks__time')!.textContent).toBe("1m 30s");
    });
  }

  test("helpers count and pick the state that speaks for the set", () => {
    const counts = countChecks(CHECKS);
    expect(counts).toEqual({ passing: 1, failing: 1, pending: 1, skipped: 1 });
    expect(overallCheckState(counts)).toBe("failing");
    expect(overallCheckState({ ...counts, failing: 0 })).toBe("pending");
    expect(overallCheckState({ passing: 2, failing: 0, pending: 0, skipped: 0 })).toBe("passing");
    expect(overallCheckState({ passing: 0, failing: 0, pending: 0, skipped: 0 })).toBeNull();
  });

  test("compact: a mark and a tally, with the words for screen readers", async () => {
    const el = await fixture<TcCheckStatus>(html`<tc-check-status compact .counts=${{ passing: 5, failing: 1, pending: 5, skipped: 2 }}></tc-check-status>`);
    expect(el.querySelector(".ui-cks__tally")!.textContent).toBe("5/11");
    expect(el.querySelector<HTMLElement>(".ui-cks__compact")!.dataset.state).toBe("failing");
    expect(el.querySelector(".ui-cks__sr")!.textContent).toContain("5 of 11 passed, 1 failed, 5 pending, 2 skipped");
    expect(el.querySelector(".ui-cks__row")).toBeNull();
    expect(getComputedStyle(el).display).toBe("inline-flex");
    expect(el.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  test("checks win over counts; counts alone draw only the summary; empty says so; words can be renamed", async () => {
    const el = await make();
    el.counts = { passing: 9, failing: 0, pending: 0, skipped: 0 };
    await settle();
    expect(ids(el)).toHaveLength(4);
    el.checks = undefined;
    await settle();
    expect(ids(el)).toHaveLength(0);
    expect(el.querySelector(".ui-cks__summary")!.textContent).toBe("9 of 9 passed");
    el.counts = undefined;
    await settle();
    expect(el.querySelector(".ui-cks__summary")!.textContent).toBe("No checks");
    el.checks = CHECKS;
    el.statusLabels = { failing: "Broken" };
    await settle();
    expect(el.querySelector('[data-id="unit"] .ui-cks__word')!.textContent).toBe("Broken");
  });

  test("a row opens; Re-run is only on failing rows, only when retryable, and is announced", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-open", (e) => seen.push(`open ${(e as CustomEvent).detail.id}`));
    el.addEventListener("tc-retry", (e) => seen.push(`retry ${(e as CustomEvent).detail.check.name}`));
    expect(el.querySelectorAll(".ui-cks__retry")).toHaveLength(1);
    el.querySelector<HTMLElement>('[data-id="lint"] .ui-cks__open')!.click();
    el.querySelector<HTMLElement>(".ui-cks__retry")!.click();
    await settle();
    expect(seen).toEqual(["open lint", "retry Unit"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Re-running Unit");
    el.retryable = false;
    await settle();
    expect(el.querySelector(".ui-cks__retry")).toBeNull();
  });

  test("keyboard: arrows, Home and End move the one tab stop", async () => {
    const el = await make();
    const first = el.querySelector<HTMLElement>('[data-at="0:0"]')!;
    first.focus();
    const key = (k: string) => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    const at = () => (document.activeElement as HTMLElement).dataset.at;
    key("ArrowRight");
    await expect.poll(at).toBe("0:1");
    key("ArrowDown");
    await expect.poll(at).toBe("1:0");
    key("End");
    await expect.poll(at).toBe("3:0");
    key("Home");
    await expect.poll(at).toBe("0:0");
    expect(el.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
  });

  test("bare drops the tray", async () => {
    const el = await fixture<TcCheckStatus>(html`<tc-check-status bare .checks=${CHECKS}></tc-check-status>`);
    expect(getComputedStyle(el).paddingTop).toBe("0px");
  });

  test("React: events reach the page and the title is the heading", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const seen: string[] = [];
    const root = createRoot(wrap);
    await act(async () => root.render(React.createElement(CheckStatus, { title: "Build", checks: CHECKS, onTcOpen: (e) => void seen.push(e.detail.id) })));
    const el = wrap.querySelector<TcCheckStatus>("tc-check-status")!;
    await settle();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Build");
    el.querySelector<HTMLElement>(".ui-cks__open")!.click();
    expect(seen).toEqual(["unit"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      // Compact has no surface of its own, so it needs one in the theme
      wrap.style.cssText = `color-scheme: ${theme}; background: var(--tc-surface-raised)`;
      wrap.innerHTML = `<tc-check-status look="standard"></tc-check-status><tc-check-status look="clean"></tc-check-status><tc-check-status compact></tc-check-status>`;
      wrap.querySelectorAll<TcCheckStatus>("tc-check-status").forEach((el) => {
        el.checks = CHECKS;
        el.retryable = true;
      });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
