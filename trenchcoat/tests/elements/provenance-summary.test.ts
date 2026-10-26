/*
 * <tc-provenance-summary> in real browsers: the host and both looks, the totals and the legend, a stacked bar per
 * section, the grid's keyboard (one tab stop, arrows, Home/End, Ctrl+Home/End, Escape), the highlight and readout,
 * tc-lineage-open, kind labels and units, empty and zero cases, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/provenance-summary";
import type { ProvenanceSection, TcProvenanceSummary } from "../../src/elements/provenance-summary";
import { ProvenanceSummary } from "../../src/elements/react/provenance-summary";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const SECTIONS: ProvenanceSection[] = [
  { id: "intro", title: "Introduction", sourced: 100, synthesis: 200, original: 100 },
  { id: "market", title: "Market", sourced: 300, synthesis: 100, original: 0 },
  { id: "risks", title: "Risks", sourced: 0, synthesis: 0, original: 200 },
];
const summary = (look = "standard", sections = SECTIONS) =>
  fixture<TcProvenanceSummary>(html`<tc-provenance-summary look=${look} scope="Market brief" .sections=${sections}></tc-provenance-summary>`);
const seg = (el: Element, row: number, kind: string) => el.querySelector<HTMLButtonElement>(`.ui-pvs__row[data-row="${row}"] .ui-pvs__seg[data-kind="${kind}"]`)!;
const key = async (k: string, opts: KeyboardEventInit = {}) => {
  document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...opts }));
  await settle();
};
const focused = () => {
  const b = document.activeElement as HTMLElement;
  return `${b.closest<HTMLElement>(".ui-pvs__row")?.dataset.row}:${b.dataset.kind}`;
};

describe("tc-provenance-summary", () => {
  for (const look of looks) {
    test(`${look}: the host is the root and a region named by its heading; the legend gives the totals`, async () => {
      const el = await summary(look);
      expect(el.dataset.ui).toBe("pvs");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Provenance");
      expect(el.querySelector(".ui-pvs__sub")!.textContent).toBe("Market brief");
      expect([...el.querySelectorAll(".ui-pvs__key")].map((k) => plain(k.textContent))).toEqual(["From sources 40%", "AI synthesis 30%", "Original writing 30%"]);
    });
  }

  test("a row for the whole document, then one per section, each a stacked bar of its shares", async () => {
    const el = await summary();
    const rows = el.querySelectorAll<HTMLElement>(".ui-pvs__row");
    expect([...rows].map((r) => plain(r.querySelector('[role="rowheader"]')!.textContent))).toEqual([
      "Whole document 1,000 words",
      "Introduction 400 words",
      "Market 400 words",
      "Risks 200 words",
    ]);
    expect(rows[0].hasAttribute("data-total")).toBe(true);
    const widths = (i: number) => [...rows[i].querySelectorAll<HTMLElement>(".ui-pvs__cell")].map((c) => c.style.width);
    expect(widths(0)).toEqual(["40%", "30%", "30%"]);
    expect(widths(1)).toEqual(["25%", "50%", "25%"]);
    expect(widths(2)).toEqual(["75%", "25%", "0%"]);
    expect(seg(el, 2, "original").disabled).toBe(true);
    expect(seg(el, 1, "synthesis").getAttribute("aria-label")).toBe("AI synthesis: 50%, 200 words – open lineage");
    expect(seg(el, 2, "original").getAttribute("aria-label")).toBe("Original writing: 0%, 0 words");
    el.totalOnly = true;
    await settle();
    expect(el.querySelectorAll(".ui-pvs__row").length).toBe(1);
  });

  test("a grid with one tab stop; arrows move along and between rows, skipping empty segments", async () => {
    const el = await summary();
    const grid = el.querySelector<HTMLElement>(".ui-pvs__grid")!;
    expect(grid.getAttribute("role")).toBe("grid");
    expect(el.querySelectorAll('[role="row"]').length).toBe(4);
    expect(el.querySelectorAll('[role="gridcell"]').length).toBe(12);
    expect([...el.querySelectorAll<HTMLElement>(".ui-pvs__seg")].filter((b) => b.tabIndex === 0).length).toBe(1);
    seg(el, 0, "sourced").focus();
    await settle();
    await key("ArrowRight");
    expect(focused()).toBe("0:synthesis");
    await key("End");
    expect(focused()).toBe("0:original");
    await key("ArrowRight");
    expect(focused()).toBe("0:original");
    await key("ArrowDown");
    expect(focused()).toBe("1:original");
    // Market has no original writing: the nearest kind
    await key("ArrowDown");
    expect(focused()).toBe("2:synthesis");
    await key("Home");
    expect(focused()).toBe("2:sourced");
    await key("ArrowDown");
    expect(focused()).toBe("3:original");
    await key("ArrowDown");
    expect(focused()).toBe("3:original");
    await key("Home", { ctrlKey: true });
    expect(focused()).toBe("0:sourced");
    await key("End", { ctrlKey: true });
    expect(focused()).toBe("3:original");
    await key("ArrowUp");
    expect(focused()).toBe("2:synthesis");
    expect([...el.querySelectorAll<HTMLElement>(".ui-pvs__seg")].filter((b) => b.tabIndex === 0)).toEqual([seg(el, 2, "synthesis")]);
  });

  test("focus or hover lights the kind everywhere and the row reads its share; Escape clears", async () => {
    const el = await summary();
    seg(el, 1, "synthesis").focus();
    await settle();
    const grid = el.querySelector<HTMLElement>(".ui-pvs__grid")!;
    expect(grid.dataset.kind).toBe("synthesis");
    expect(el.querySelector('.ui-pvs__key[data-kind="synthesis"]')!.hasAttribute("data-active")).toBe(true);
    expect(plain(el.querySelector('.ui-pvs__row[data-row="1"] .ui-pvs__amount')!.textContent)).toBe("AI synthesis · 50%");
    await key("Escape");
    expect(grid.dataset.kind).toBeUndefined();
    expect(plain(el.querySelector('.ui-pvs__row[data-row="1"] .ui-pvs__amount')!.textContent)).toBe("400 words");
    (document.activeElement as HTMLElement).blur();
    seg(el, 0, "original").dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    await settle();
    expect(grid.dataset.kind).toBe("original");
    grid.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
    await settle();
    expect(grid.dataset.kind).toBeUndefined();
  });

  test("a segment fires tc-lineage-open with the section, kind, amount and share; Enter does too", async () => {
    const el = await summary();
    const seen: unknown[] = [];
    el.addEventListener("tc-lineage-open", (e) => seen.push((e as CustomEvent).detail));
    seg(el, 0, "sourced").click();
    seg(el, 2, "sourced").click();
    expect(seen).toEqual([
      { section: null, kind: "sourced", amount: 400, share: 0.4 },
      { section: "market", kind: "sourced", amount: 300, share: 0.75 },
    ]);
  });

  test("kind labels, unit, total label and locale are properties", async () => {
    const el = await summary();
    el.kindLabels = { sourced: "Sourced", synthesis: "Model", original: "Analyst" };
    el.unit = "sentences";
    el.totalLabel = "Whole report";
    el.locale = "de-DE";
    el.sections = [{ id: "a", title: "A", sourced: 1200, synthesis: 800, original: 0 }];
    await settle();
    expect([...el.querySelectorAll(".ui-pvs__key")].map((k) => plain(k.textContent))).toEqual(["Sourced 60 %", "Model 40 %", "Analyst 0 %"]);
    expect(plain(el.querySelector('[role="rowheader"]')!.textContent)).toBe("Whole report 2.000 sentences");
  });

  test("empty: nothing written yet; a removed section moves the tab stop to one that exists", async () => {
    const el = await summary("standard", []);
    expect(el.querySelector(".ui-pvs__empty")!.textContent).toBe("Nothing written yet");
    expect(el.querySelector(".ui-pvs__grid")).toBeNull();
    el.sections = SECTIONS;
    await settle();
    seg(el, 3, "original").focus();
    await settle();
    el.sections = SECTIONS.slice(0, 2);
    await settle();
    expect([...el.querySelectorAll<HTMLElement>(".ui-pvs__seg")].filter((b) => b.tabIndex === 0).length).toBe(1);
  });

  test("the wrapper: title and onOpenLineage", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: unknown[] = [];
    await act(async () => root.render(React.createElement(ProvenanceSummary, { title: "Made of", sections: SECTIONS, onOpenLineage: (s, k, d) => calls.push([s, k, d.amount]) })));
    await settle();
    const el = host.querySelector("tc-provenance-summary")!;
    expect(el.querySelector("h3")!.textContent).toBe("Made of");
    seg(el, 1, "synthesis").click();
    expect(calls).toEqual([["intro", "synthesis", 200]]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-provenance-summary scope="Standard" .sections=${SECTIONS}></tc-provenance-summary>
        <tc-provenance-summary look="clean" heading="Clean" .sections=${SECTIONS}></tc-provenance-summary>
        <tc-provenance-summary look="clean" heading="Empty"></tc-provenance-summary>
      </div>`);
      wrap.querySelector<HTMLButtonElement>(".ui-pvs__seg")!.focus();
      await wait(500);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
