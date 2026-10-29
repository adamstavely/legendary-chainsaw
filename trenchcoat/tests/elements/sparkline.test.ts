/*
 * <tc-sparkline> in real browsers: the summary it's read as, sizing from the text, gaps, the four types, markers, the
 * reference line, the tone from `good`, interactive stepping with a tooltip and tc-point-focus, the React wrapper and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/sparkline";
import type { SparklinePointFocus, TcSparkline } from "../../src/elements/sparkline";
import { Sparkline } from "../../src/elements/react/sparkline";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const VALUES = [112, 120, 98, 131, 152, 148];
const LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const plot = (el: Element) => el.querySelector<HTMLElement>(".ui-spk__plot")!;

describe("tc-sparkline", () => {
  test("an image named by its summary, inline and as tall as the text", async () => {
    const wrap = await fixture<HTMLElement>(html`<p style="font-size: 20px">Samples <tc-sparkline label="Samples per day" .values=${VALUES}></tc-sparkline> this week</p>`);
    const el = wrap.querySelector("tc-sparkline")!;
    expect(el.dataset.ui).toBe("spk");
    expect(getComputedStyle(el).display).toBe("inline-block");
    const img = plot(el);
    expect(img.getAttribute("role")).toBe("img");
    expect(img.getAttribute("aria-label")).toBe("Samples per day: from 112 to 148, high 152, low 98");
    expect(img.hasAttribute("tabindex")).toBe(false);
    // 1.25em by 5em of the 20 px text
    const box = img.getBoundingClientRect();
    expect(Math.round(box.height)).toBe(25);
    expect(Math.round(box.width)).toBe(100);
  });

  test("width and height in px; the unit, format and locale in the summary", async () => {
    const el = await fixture<TcSparkline>(html`<tc-sparkline .values=${[1200.5, 1500]} unit="runs" locale="de" .width=${80} .height=${16}></tc-sparkline>`);
    expect(plot(el).getAttribute("aria-label")).toBe("Trend: from 1.200,5 runs to 1.500 runs, high 1.500 runs, low 1.200,5 runs");
    const box = plot(el).getBoundingClientRect();
    expect([Math.round(box.width), Math.round(box.height)]).toEqual([80, 16]);
    el.format = (v) => `${v}°`;
    await settle();
    expect(plot(el).getAttribute("aria-label")).toBe("Trend: from 1200.5° to 1500°, high 1500°, low 1200.5°");
  });

  test("a null breaks the line; an area fills each run; no data says so", async () => {
    const el = await fixture<TcSparkline>(html`<tc-sparkline .values=${[3, 4, null, 6, 5]}></tc-sparkline>`);
    expect(el.querySelectorAll(".ui-spk__line")).toHaveLength(2);
    el.type = "area";
    await settle();
    expect(el.querySelectorAll(".ui-spk__area")).toHaveLength(2);
    // A run of one point is still drawn
    el.values = [3, null, 5, 6];
    await settle();
    expect(el.querySelectorAll(".ui-spk__line")).toHaveLength(2);
    el.values = [];
    await settle();
    expect(plot(el).getAttribute("aria-label")).toBe("Trend: no data");
    el.values = [null, 7];
    await settle();
    expect(plot(el).getAttribute("aria-label")).toBe("Trend: 7");
  });

  test("bars from 0, and win-loss bars up and down with a count in the summary", async () => {
    const el = await fixture<TcSparkline>(html`<tc-sparkline type="bars" .values=${[4, 0, 2, null, 8]}></tc-sparkline>`);
    expect(el.querySelectorAll(".ui-spk__bar")).toHaveLength(4);
    // The 8 is twice the 4: bars grow from 0
    const h = (i: number) => Number(el.querySelector(`.ui-spk__bar[data-i="${i}"]`)!.getAttribute("height"));
    expect(h(4) / h(0)).toBeCloseTo(2, 1);
    el.type = "win-loss";
    el.values = [1, -1, 1, 0, 1];
    await settle();
    expect([...el.querySelectorAll<SVGElement>(".ui-spk__bar")].map((b) => b.dataset.dir)).toEqual(["up", "down", "up", "up"]);
    expect(el.querySelector(".ui-spk__axis")).not.toBeNull();
    expect(plot(el).getAttribute("aria-label")).toBe("Trend: 3 up, 1 down, 1 level");
  });

  test("markers: the last by default, then any of first, min and max; none for none", async () => {
    const el = await fixture<TcSparkline>(html`<tc-sparkline .values=${VALUES}></tc-sparkline>`);
    const kinds = () => [...el.querySelectorAll<HTMLElement>(".ui-spk__dot")].map((d) => d.dataset.kind).sort();
    expect(kinds()).toEqual(["last"]);
    el.markers = "min max last";
    await settle();
    expect(kinds()).toEqual(["last", "max", "min"]);
    // The max is the fifth of six: 80% across, at the top of the drawing (8% padding)
    const max = el.querySelector<HTMLElement>('.ui-spk__dot[data-kind="max"]')!;
    expect(parseFloat(max.style.left)).toBeCloseTo(80, 1);
    expect(parseFloat(max.style.top)).toBeCloseTo(8, 1);
    el.markers = "none";
    await settle();
    expect(kinds()).toEqual([]);
  });

  test("a reference line, in range and in the summary", async () => {
    const el = await fixture<TcSparkline>(html`<tc-sparkline label="Throughput" .values=${[100, 110]} .reference=${140} reference-label="Target"></tc-sparkline>`);
    const ref = el.querySelector(".ui-spk__ref")!;
    // The scale stretches to the target: 140 is the top
    expect(Number(ref.getAttribute("y1"))).toBeCloseTo(8, 1);
    expect(plot(el).getAttribute("aria-label")).toBe("Throughput: from 100 to 110, high 110, low 100; target 140");
  });

  test("tone: auto follows `good`, neutral without it; a fixed tone stays", async () => {
    const el = await fixture<TcSparkline>(html`<tc-sparkline .values=${[5, 8]}></tc-sparkline>`);
    expect(plot(el).dataset.tone).toBe("neutral");
    el.good = "up";
    await settle();
    expect(plot(el).dataset.tone).toBe("success");
    el.good = "down";
    await settle();
    expect(plot(el).dataset.tone).toBe("danger");
    el.values = [5, 5];
    await settle();
    expect(plot(el).dataset.tone).toBe("neutral");
    el.tone = "info";
    await settle();
    expect(plot(el).dataset.tone).toBe("info");
    // The line takes the tone's colour
    const stroke = getComputedStyle(el.querySelector(".ui-spk__line")!).stroke;
    const probe = document.createElement("span");
    probe.style.color = "var(--tc-status-info-fg)";
    el.append(probe);
    expect(stroke).toBe(getComputedStyle(probe).color);
  });

  test("interactive: one tab stop; the arrows step through the points with a tooltip, an announcement and tc-point-focus", async () => {
    const el = await fixture<TcSparkline>(html`<tc-sparkline interactive label="Samples" .values=${[3, null, 7]} .labels=${["Mon", "Tue", "Wed"]}></tc-sparkline>`);
    const p = plot(el);
    expect(p.getAttribute("role")).toBe("group");
    expect(p.getAttribute("aria-roledescription")).toBe("sparkline");
    expect(p.getAttribute("aria-label")).toBe("Samples: from 3 to 7, high 7, low 3");
    expect(p.tabIndex).toBe(0);
    expect(document.getElementById(p.getAttribute("aria-describedby")!)!.textContent).toBe("Left and right arrows step through the points");
    const seen: SparklinePointFocus[] = [];
    el.addEventListener("tc-point-focus", (e) => seen.push((e as CustomEvent<SparklinePointFocus>).detail));
    p.focus();
    // The first arrow starts at the newest point
    key(p, "ArrowLeft");
    await settle();
    expect(el.querySelector(".ui-spk__tip")!.textContent).toBe("Wed: 7");
    key(p, "ArrowLeft");
    await settle();
    expect(el.querySelector(".ui-spk__tip")!.textContent).toBe("Tue: No data");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Tue: No data, 2 of 3");
    key(p, "Home");
    await settle();
    expect(el.querySelector(".ui-spk__tip")!.textContent).toBe("Mon: 3");
    expect(el.querySelector('.ui-spk__dot[data-kind="point"]')).not.toBeNull();
    key(p, "ArrowLeft");
    await settle();
    expect(seen).toEqual([
      { index: 2, value: 7, label: "Wed" },
      { index: 1, value: null, label: "Tue" },
      { index: 0, value: 3, label: "Mon" },
    ]);
    key(p, "Escape");
    await settle();
    expect(el.querySelector(".ui-spk__tip")).toBeNull();
    key(p, "End");
    await settle();
    expect(el.querySelector(".ui-spk__tip")!.textContent).toBe("Wed: 7");
    p.blur();
    await settle();
    expect(el.querySelector(".ui-spk__tip")).toBeNull();
  });

  test("interactive: pointing picks the nearest point; leaving hides the tooltip", async () => {
    const el = await fixture<TcSparkline>(html`<tc-sparkline interactive .width=${200} .values=${[1, 2, 3, 4, 5]}></tc-sparkline>`);
    const p = plot(el);
    const box = p.getBoundingClientRect();
    p.dispatchEvent(new PointerEvent("pointermove", { clientX: box.left + box.width * 0.52, clientY: box.top + 4, bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-spk__tip")!.textContent).toBe("3");
    p.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(el.querySelector(".ui-spk__tip")).toBeNull();
    // Turning interactive off drops the point
    key(p, "End");
    await settle();
    el.interactive = false;
    await settle();
    expect(el.querySelector(".ui-spk__tip")).toBeNull();
    expect(plot(el).getAttribute("role")).toBe("img");
  });

  test("React wrapper: props reach the element; onPointFocus hears the points", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    await act(async () => root.render(React.createElement(Sparkline, { values: [2, 4, 3], labels: ["a", "b", "c"], interactive: true, type: "area", label: "Runs", onPointFocus: (i, v, l) => void seen.push([i, v, l]) })));
    await settle();
    const el = host.querySelector("tc-sparkline")!;
    expect(el.type).toBe("area");
    expect(plot(el).getAttribute("aria-label")).toBe("Runs: from 2 to 3, high 4, low 2");
    key(plot(el), "Home");
    await settle();
    expect(seen).toEqual([[0, 2, "a"]]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); color: var(--tc-text-primary)">
        <p>Plain <tc-sparkline .values=${VALUES} markers="min max last"></tc-sparkline></p>
        <p><tc-sparkline look="clean" type="area" good="up" .values=${VALUES} .reference=${130}></tc-sparkline></p>
        <p><tc-sparkline type="win-loss" .values=${[1, -1, 1]}></tc-sparkline> <tc-sparkline type="bars" .values=${[1, 3, 2]}></tc-sparkline></p>
        <p><tc-sparkline interactive label="Samples" .values=${VALUES} .labels=${LABELS}></tc-sparkline></p>
      </div>`);
      const interactive = wrap.querySelector<TcSparkline>("tc-sparkline[interactive]")!;
      plot(interactive).focus();
      key(plot(interactive), "ArrowLeft");
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
