/*
 * <tc-fingerprint-card> in real browsers: two hands of five fingers in ANSI/NIST positions, each status with its mark
 * and words, the count on file and the legend, a finger's detail on Enter or click, the grid keyboard, `order`,
 * controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/fingerprint-card";
import type { FingerPosition, FingerPrint, FingerprintSelectedChange, TcFingerprintCard } from "../../src/elements/fingerprint-card";
import { FingerprintCard } from "../../src/elements/react/fingerprint-card";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const AT = new Date(2026, 9, 26, 9, 40).getTime();
/** 1–3, 5, 6, 8 captured · 7 poor · 4 bandaged · 9 unable · 10 not listed (not captured) */
const PRINTS: FingerPrint[] = [
  { position: 1, status: "captured", quality: 1, pattern: "whorl", captured: AT, device: "Kiosk 2" },
  { position: 2, status: "captured", quality: 2, pattern: "loop" },
  { position: 3, status: "captured", quality: 3, pattern: "arch" },
  { position: 4, status: "bandaged", note: "Recapture next week." },
  { position: 5, status: "captured", quality: 2 },
  { position: 6, status: "captured", quality: 1 },
  { position: 7, status: "poor", quality: 5, note: "Smudged." },
  { position: 8, status: "captured", quality: 4 },
  { position: 9, status: "unable" },
];

const tile = (el: Element, p: number) => el.querySelector<HTMLElement>(`[data-finger="${p}"]`)!;
/** What a finger reads: its visually hidden name */
const said = (el: Element, p: number) => tile(el, p).querySelector(".ui-fpc__sr")!.textContent;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const make = (look: "standard" | "clean" = "standard", selected: FingerPosition | null = null) =>
  fixture<TcFingerprintCard>(html`<tc-fingerprint-card look=${look} description="Rolled prints." .prints=${PRINTS} .selected=${selected}></tc-fingerprint-card>`);

describe("tc-fingerprint-card", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid of two hands, five fingers each in ANSI/NIST order, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("fpc");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toBe("Fingerprints");
      const rows = grid.querySelectorAll('[role="row"]');
      expect([...rows].map((r) => r.querySelector('[role="rowheader"]')!.textContent)).toEqual(["Right hand", "Left hand"]);
      expect([...rows].map((r) => [...r.querySelectorAll<HTMLElement>('[role="gridcell"]')].map((c) => Number(c.dataset.finger)))).toEqual([
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
      ]);
      expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(tile(el, 1).getAttribute("tabindex")).toBe("0");
      expect([...rows[0].querySelectorAll(".ui-fpc__finger")].map((f) => f.textContent)).toEqual(["Thumb", "Index", "Middle", "Ring", "Little"]);
    });
  }

  test("statuses: each with its words and mark; a finger not listed is not captured; NFIQ bars for captured prints", async () => {
    const el = await make();
    expect([1, 4, 7, 9, 10].map((p) => tile(el, p).dataset.status)).toEqual(["captured", "bandaged", "poor", "unable", "missing"]);
    expect(said(el, 1)).toBe("Right thumb, position 1: Captured, NFIQ 1");
    expect(said(el, 7)).toBe("Left index, position 7: Poor quality, NFIQ 5");
    expect(said(el, 10)).toBe("Left little, position 10: Not captured");
    expect(tile(el, 9).querySelector(".ui-fpc__status-text")!.textContent).toBe("Unable to print");
    // NFIQ 1 lights five bars, NFIQ 4 lights two
    expect(tile(el, 1).querySelectorAll(".ui-fpc__bar[data-on]")).toHaveLength(5);
    expect(tile(el, 8).querySelectorAll(".ui-fpc__bar[data-on]")).toHaveLength(2);
    // Each status draws differently: ridges for prints, a slash for unable, a band for bandaged, none when not captured
    expect(tile(el, 1).querySelector(".ui-fpc__ridges")).toBeTruthy();
    expect(tile(el, 10).querySelector(".ui-fpc__ridges")).toBeNull();
    expect(tile(el, 9).querySelector(".ui-fpc__slash")).toBeTruthy();
    expect(tile(el, 4).querySelector(".ui-fpc__band")).toBeTruthy();
    // On file counts captured and poor; the legend counts the rest
    expect(el.querySelector(".ui-fpc__count-num")!.textContent).toBe("7/10");
    expect([...el.querySelectorAll(".ui-fpc__legend-item")].map((i) => i.textContent!.trim())).toEqual(["Poor quality1", "Not captured1", "Unable to print1", "Bandaged1"]);
    el.statusLabels = { unable: "Can't print" };
    await settle();
    expect(said(el, 9)).toBe("Left ring, position 9: Can't print");
  });

  test("an image replaces the drawn pattern for a print on file", async () => {
    const img = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'/>";
    const el = await fixture<TcFingerprintCard>(html`<tc-fingerprint-card .prints=${[{ position: 1, status: "captured", image: img }, { position: 2, status: "missing", image: img }]}></tc-fingerprint-card>`);
    expect(tile(el, 1).querySelector("image")!.getAttribute("href")).toBe(img);
    expect(tile(el, 1).querySelector(".ui-fpc__ridges")).toBeNull();
    expect(tile(el, 2).querySelector("image")).toBeNull();
  });

  test("click or Enter opens a finger's detail; again, Escape or Close closes it; tc-selected-change fires with the print", async () => {
    const el = await make();
    const seen: FingerprintSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<FingerprintSelectedChange>).detail));
    tile(el, 1).click();
    await settle();
    expect(el.selected).toBe(1);
    expect(tile(el, 1).getAttribute("aria-selected")).toBe("true");
    const detail = el.querySelector(".ui-fpc__detail")!;
    expect(tile(el, 1).getAttribute("aria-controls")).toBe(detail.id);
    expect(detail.querySelector(".ui-fpc__detail-title")!.textContent).toBe("Right thumb");
    const facts = [...detail.querySelectorAll(".ui-fpc__fact")].map((f) => [f.querySelector("dt")!.textContent, f.querySelector("dd")!.textContent]);
    expect(facts.slice(0, 2)).toEqual([
      ["Quality", "NFIQ 1 · Excellent"],
      ["Pattern", "Whorl"],
    ]);
    expect(facts.map((f) => f[0])).toEqual(["Quality", "Pattern", "Captured", "Device"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Right thumb: Captured, NFIQ 1");
    tile(el, 1).click();
    await settle();
    expect(el.selected).toBeNull();
    key(tile(el, 4), "Enter");
    await settle();
    expect(el.querySelector(".ui-fpc__note")!.textContent).toBe("Recapture next week.");
    key(tile(el, 4), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    key(tile(el, 7), " ");
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-fpc__close")!.click();
    await settle();
    expect(el.selected).toBeNull();
    await expect.poll(() => document.activeElement).toBe(tile(el, 7));
    expect(seen.map((s) => [s.selected, s.print?.status])).toEqual([
      [1, "captured"],
      [null, undefined],
      [4, "bandaged"],
      [null, undefined],
      [7, "poor"],
      [null, undefined],
    ]);
  });

  test("with a finger open, every id in the card is unique – the tile's and the detail's clip paths don't clash", async () => {
    const el = await make("standard", 1);
    const ids = [...el.querySelectorAll("[id]")].map((n) => n.id);
    expect(ids.length).toBeGreaterThan(10);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("keyboard: ← → along the hand, ↑ ↓ to the same finger on the other hand, Home / End to the thumb and little finger", async () => {
    const el = await make();
    const at = () => Number((document.activeElement as HTMLElement).dataset.finger);
    tile(el, 1).focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('[role="gridcell"][tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowRight");
    expect(at()).toBe(2);
    await press("ArrowDown");
    expect(at()).toBe(7);
    await press("End");
    expect(at()).toBe(10);
    await press("ArrowRight");
    expect(at()).toBe(10);
    await press("Home");
    expect(at()).toBe(6);
    await press("ArrowUp");
    expect(at()).toBe(1);
    await press("ArrowLeft");
    expect(at()).toBe(1);
    expect(tile(el, 1).getAttribute("tabindex")).toBe("0");
  });

  test("order left-first puts the left hand on top; ↑ ↓ follow the rows as shown", async () => {
    const el = await fixture<TcFingerprintCard>(html`<tc-fingerprint-card order="left-first" .prints=${PRINTS}></tc-fingerprint-card>`);
    expect([...el.querySelectorAll('[role="rowheader"]')].map((h) => h.textContent)).toEqual(["Left hand", "Right hand"]);
    tile(el, 6).focus();
    key(tile(el, 6), "ArrowDown");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.finger).toBe("1");
  });

  test("controlled: preventDefault() keeps the detail as it is; an empty card renders with nothing on file", async () => {
    const el = await make("standard", 2);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    tile(el, 5).click();
    await settle();
    expect(el.selected).toBe(2);
    expect(el.querySelector(".ui-fpc__detail-title")!.textContent).toBe("Right index");
    const empty = await fixture<TcFingerprintCard>(html`<tc-fingerprint-card heading="Prints"></tc-fingerprint-card>`);
    expect(empty.querySelector(".ui-fpc__count-num")!.textContent).toBe("0/10");
    expect(empty.querySelectorAll('[data-status="missing"][role="gridcell"]')).toHaveLength(10);
    expect(empty.querySelector(".tc-head__title")!.textContent).toBe("Prints");
  });

  test("React wrapper: an uncontrolled finger survives parent re-renders; onSelectedChange gets the print", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(FingerprintCard, {
        title: "Badge prints",
        prints: PRINTS,
        onSelectedChange: (s, p) => void seen.push([s, p?.status]),
        "data-n": n,
      } as React.ComponentProps<typeof FingerprintCard>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-fingerprint-card")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Badge prints");
    tile(el, 7).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe(7);
    expect(seen).toEqual([[7, "poor"]]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled finger stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: (FingerPosition | null)[] = [];
    await act(async () => root.render(React.createElement(FingerprintCard, { prints: PRINTS, selected: null, onSelectedChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-fingerprint-card")!;
    tile(el, 3).click();
    await settle();
    expect(asked).toEqual([3]);
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-fingerprint-card description="Rolled prints." .prints=${PRINTS} .selected=${7}></tc-fingerprint-card>
        <tc-fingerprint-card look="clean" .prints=${PRINTS} .selected=${1}></tc-fingerprint-card>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
