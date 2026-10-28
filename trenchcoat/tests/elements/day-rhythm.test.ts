/*
 * <tc-day-rhythm> in real browsers: blocks placed by time, a block past midnight drawn as two pieces, words on wide
 * blocks, row labels, the now marker, the readout, the keyboard across rows, tc-select, the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/day-rhythm";
import type { RhythmKind, RhythmRow, RhythmSelect, TcDayRhythm } from "../../src/elements/day-rhythm";
import { DayRhythm } from "../../src/elements/react/day-rhythm";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const KINDS: RhythmKind[] = [
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
  { id: "transit", label: "Transit", color: 5 },
];
/** Weekdays: home 22:00–07:00 (past midnight), transit 07:00–08:00, work 08:00–18:00 · Weekend: home 00:00–10:00, work 12:00–13:00 */
const ROWS: RhythmRow[] = [
  {
    id: "wk",
    label: "Weekdays",
    segments: [
      { start: 1320, end: 420, kind: "home", place: "Home" },
      { start: 420, end: 480, kind: "transit", place: "Tram 4" },
      { start: 480, end: 1080, kind: "work", place: "Harbour office" },
    ],
  },
  {
    id: "we",
    label: "Weekend",
    segments: [
      { start: 0, end: 600, kind: "home" },
      { start: 720, end: 780, kind: "work" },
    ],
  },
];

const piece = (el: Element, r: number, i: number) => el.querySelector<HTMLElement>(`[data-piece="${r}:${i}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard", now?: number) =>
  fixture<TcDayRhythm>(html`<tc-day-rhythm look=${look} description="Typical day." .kinds=${KINDS} .rows=${ROWS} .now=${now}></tc-day-rhythm>`);

describe("tc-day-rhythm", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a strip per row, blocks placed by time, a block past midnight as two pieces, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("drh");
      expect(el.dataset.look).toBe(look);
      const strips = el.querySelectorAll(".ui-drh__strip");
      expect(strips).toHaveLength(2);
      expect([...strips].map((s) => document.getElementById(s.getAttribute("aria-labelledby")!)!.textContent)).toEqual(["Weekdays", "Weekend"]);
      // Weekdays: home 00:00–07:00, transit, work, home 22:00–24:00 – in time order
      expect([0, 1, 2, 3].map((i) => piece(el, 0, i).getAttribute("aria-label"))).toEqual([
        "Home · 22:00–07:00 · Home",
        "Transit · 07:00–08:00 · Tram 4",
        "Work · 08:00–18:00 · Harbour office",
        "Home · 22:00–07:00 · Home",
      ]);
      const left = (r: number, i: number) => parseFloat((piece(el, r, i).parentElement as HTMLElement).style.left);
      const width = (r: number, i: number) => parseFloat((piece(el, r, i).parentElement as HTMLElement).style.width);
      expect(left(0, 2)).toBeCloseTo((480 / 1440) * 100, 3);
      expect(width(0, 2)).toBeCloseTo((600 / 1440) * 100, 3);
      expect(left(0, 3)).toBeCloseTo((1320 / 1440) * 100, 3);
      // Wide blocks say their kind; a 60-minute block doesn't
      expect(piece(el, 0, 2).textContent!.trim()).toBe("Work");
      expect(piece(el, 0, 1).textContent!.trim()).toBe("");
      expect(el.querySelectorAll('.ui-drh__seg[tabindex="0"]')).toHaveLength(1);
      expect(piece(el, 0, 0).getAttribute("tabindex")).toBe("0");
      // Kinds take chart colours in order, or the one they name
      expect(piece(el, 0, 1).closest("li")!.getAttribute("style")).toContain("--tc-chart-5");
      expect(piece(el, 0, 2).closest("li")!.getAttribute("style")).toContain("--tc-chart-2");
      expect([...el.querySelectorAll(".ui-drh__key")].map((k) => k.textContent!.trim())).toEqual(["Home", "Work", "Transit"]);
    });
  }

  test("one unnamed row is named by the heading; the now marker shows on the ticks and every strip", async () => {
    const el = await fixture<TcDayRhythm>(html`<tc-day-rhythm .kinds=${KINDS} .rows=${[{ id: "d", segments: ROWS[0].segments }]} .now=${860}></tc-day-rhythm>`);
    const strip = el.querySelector(".ui-drh__strip")!;
    expect(document.getElementById(strip.getAttribute("aria-labelledby")!)!.textContent).toBe("Daily rhythm");
    expect(el.querySelector(".ui-drh__row-label")).toBeNull();
    expect(el.querySelector(".ui-drh__now")!.textContent).toBe("Now 14:20");
    expect(el.querySelectorAll(".ui-drh__now-line")).toHaveLength(1);
    expect(parseFloat((el.querySelector(".ui-drh__now-line") as HTMLElement).style.left)).toBeCloseTo((860 / 1440) * 100, 3);
    el.now = undefined;
    await settle();
    expect(el.querySelector(".ui-drh__now")).toBeNull();
  });

  test("the readout names the block under the pointer or focus", async () => {
    const el = await make();
    const readout = () => el.querySelector(".ui-drh__readout")!.textContent!.trim();
    expect(readout()).toBe("Point at a block to see it in full");
    piece(el, 0, 2).dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(readout()).toBe("Work · 08:00–18:00 · Harbour office");
    el.querySelector(".ui-drh__body")!.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(readout()).toBe("Point at a block to see it in full");
    piece(el, 1, 1).focus();
    await settle();
    expect(readout()).toBe("Work · 12:00–13:00");
  });

  test("keyboard: ← → along the row, ↑ ↓ to the same time in the other row, Home/End; Enter and clicks fire tc-select", async () => {
    const el = await make();
    const seen: RhythmSelect[] = [];
    el.addEventListener("tc-select", (e) => seen.push((e as CustomEvent<RhythmSelect>).detail));
    const at = () => document.activeElement?.getAttribute("data-piece");
    piece(el, 0, 0).focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('.ui-drh__seg[tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowRight");
    await press("ArrowRight");
    expect(at()).toBe("0:2");
    // Work 08:00–18:00 has its middle at 13:00: the weekend's 12:00–13:00 block
    await press("ArrowDown");
    expect(at()).toBe("1:1");
    await press("ArrowDown");
    expect(at()).toBe("1:1");
    await press("Home");
    expect(at()).toBe("1:0");
    // Home 00:00–10:00 has its middle at 05:00: the weekday morning's home block
    await press("ArrowUp");
    expect(at()).toBe("0:0");
    await press("End");
    expect(at()).toBe("0:3");
    await press("ArrowRight");
    expect(at()).toBe("0:3");
    key(document.activeElement!, "Enter");
    piece(el, 1, 1).click();
    expect(seen.map((s) => [s.row, s.segment.kind, s.segment.start])).toEqual([
      ["wk", "home", 1320],
      ["we", "work", 720],
    ]);
  });

  test("rows changing keep the tab stop on a block; empty rows and no rows render without errors", async () => {
    const el = await make();
    piece(el, 0, 3).focus();
    await settle();
    el.rows = [{ id: "we", label: "Weekend", segments: ROWS[1].segments }];
    await settle();
    expect(el.querySelectorAll('.ui-drh__seg[tabindex="0"]')).toHaveLength(1);
    el.rows = [];
    await settle();
    expect(el.querySelector(".ui-drh__empty")).toBeTruthy();
  });

  test("React wrapper: the title and onSelect", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    await act(async () => root.render(React.createElement(DayRhythm, { title: "Routine", kinds: KINDS, rows: ROWS, onSelect: (row, s) => void seen.push([row, s.place]) })));
    await settle();
    const el = host.querySelector("tc-day-rhythm")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Routine");
    piece(el, 0, 2).click();
    expect(seen).toEqual([["wk", "Harbour office"]]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-day-rhythm description="Typical day." .kinds=${KINDS} .rows=${ROWS} .now=${860}></tc-day-rhythm>
        <tc-day-rhythm look="clean" .kinds=${KINDS} .rows=${[ROWS[0]]}></tc-day-rhythm>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
