/*
 * <tc-sla-status> in real browsers: the on-time headline, the legend's counts and shares, bars sized by their counts,
 * the readout, the grid keyboard, the trend, the period chooser (cancelable), the React wrapper and axe in both looks
 * and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/sla-status";
import type { SlaPeriodChange, SlaRow, SlaSplit, TcSlaStatus } from "../../src/elements/sla-status";
import { SlaStatus } from "../../src/elements/react/sla-status";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SPLIT: SlaSplit = { met: 94, atRisk: 4, breached: 2 };
const ROWS: SlaRow[] = [
  { id: "review", label: "Review", met: 50, atRisk: 0, breached: 0 },
  { id: "approval", label: "Approval", met: 30, atRisk: 4, breached: 2 },
  { id: "none", label: "Language", met: 0, atRisk: 0, breached: 0 },
  { id: "clear", label: "Clearance", met: 14, atRisk: 0, breached: 0 },
];

const seg = (el: Element, at: string) => el.querySelector<HTMLElement>(`[data-seg="${at}"]`)!;
const text = (n: Element | null) => n!.textContent!.replace(/\s+/g, " ").trim();
/** A period button in the chooser (the control draws its label twice, one copy for layout) */
const periodButton = (root: Element, label: string) =>
  [...root.querySelectorAll<HTMLButtonElement>(".ui-seg__opt")].find((b) => {
    const t = b.querySelector(".ui-seg__label")!.textContent!.trim();
    return t === label || t === label + label;
  })!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcSlaStatus>(html`<tc-sla-status look=${look} locale="en-US" .split=${SPLIT} .rows=${ROWS} .trend=${[0.88, 0.9, 0.94]}></tc-sla-status>`);

describe("tc-sla-status", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the on-time share, the legend with counts and shares, and a bar per row`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("sla");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".ui-sla__headline"))).toBe("94% on time");
      expect([...el.querySelectorAll(".ui-sla__key")].map(text)).toEqual(["Met 9494%", "At risk 44%", "Breached 22%"]);
      const grid = el.querySelector('[role="grid"]')!;
      expect([...grid.querySelectorAll('[role="rowheader"]')].map(text)).toEqual(["All94%", "Review100%", "Approval83%", "Language–", "Clearance100%"]);
      expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(seg(el, "0:met").getAttribute("aria-label")).toBe("Met: 94 requests, 94%");
      // Empty segments are left out; a row with nothing gets one placeholder cell
      expect(seg(el, "1:atRisk")).toBeNull();
      expect(grid.querySelector('[data-bar="none"] [data-tone="none"]')).toBeTruthy();
      expect(el.querySelector(".ui-sla__trend")!.getAttribute("aria-label")).toBe("On time over 3 weeks, from 88% to 94%");
    });
  }

  test("segments are sized by their counts; the readout names the one under the pointer or focus", async () => {
    const el = await make();
    expect(seg(el, "0:met").getBoundingClientRect().width).toBeGreaterThan(seg(el, "0:atRisk").getBoundingClientRect().width * 10);
    const readout = () => text(el.querySelector(".ui-sla__readout"));
    expect(readout()).toBe("Point at a segment to read it");
    seg(el, "2:breached").dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(readout()).toBe("Approval · Breached · 2 requests · 6%");
    el.querySelector(".ui-sla__grid")!.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(readout()).toBe("Point at a segment to read it");
  });

  test("keyboard: ← → within a bar, ↑ ↓ between bars (skipping empty ones), Home / End", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-seg");
    seg(el, "0:met").focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('[role="gridcell"][tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowRight");
    expect(at()).toBe("0:atRisk");
    await press("End");
    expect(at()).toBe("0:breached");
    await press("ArrowDown");
    // Review has only Met
    expect(at()).toBe("1:met");
    await press("ArrowDown");
    await press("End");
    expect(at()).toBe("2:breached");
    await press("ArrowDown");
    // Language is empty: skipped
    expect(at()).toBe("4:met");
    await press("ArrowUp");
    expect(at()).toBe("2:met");
    await press("Home");
    expect(at()).toBe("2:met");
    expect(text(el.querySelector(".ui-sla__readout"))).toBe("Approval · Met · 30 requests · 83%");
  });

  test("the period chooser fires a cancelable tc-period-change; prevented, the period stays", async () => {
    const el = await make();
    const seen: SlaPeriodChange[] = [];
    el.addEventListener("tc-period-change", (e) => seen.push((e as CustomEvent<SlaPeriodChange>).detail));
    periodButton(el, "7d").click();
    await settle();
    expect(seen).toEqual([{ period: "7d" }]);
    expect(el.period).toBe("7d");
    el.addEventListener("tc-period-change", (e) => e.preventDefault());
    periodButton(el, "90d").click();
    await settle();
    expect(el.period).toBe("7d");
    el.periods = [];
    await settle();
    expect(el.querySelector("tc-segmented-control")).toBeNull();
  });

  test("renamed outcomes and units; no counts shows a dash", async () => {
    const el = await fixture<TcSlaStatus>(html`<tc-sla-status unit="tickets" .labels=${{ atRisk: "Due soon" }} .split=${{ met: 1, atRisk: 1, breached: 0 }}></tc-sla-status>`);
    expect(seg(el, "0:atRisk").getAttribute("aria-label")).toBe("Due soon: 1 tickets, 50%");
    el.split = { met: 0, atRisk: 0, breached: 0 };
    await settle();
    expect(text(el.querySelector(".ui-sla__headline"))).toBe("– on time");
  });

  test("React wrapper: a controlled period stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[] = [];
    await act(async () => root.render(React.createElement(SlaStatus, { title: "SLA", split: SPLIT, period: "30d", onPeriodChange: (p) => void asked.push(p) })));
    await settle();
    const el = host.querySelector("tc-sla-status")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("SLA");
    periodButton(el, "90d").click();
    await settle();
    expect(asked).toEqual(["90d"]);
    expect(el.period).toBe("30d");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-sla-status .split=${SPLIT} .rows=${ROWS} .trend=${[0.9, 0.94]}></tc-sla-status>
        <tc-sla-status look="clean" .split=${SPLIT}></tc-sla-status>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
