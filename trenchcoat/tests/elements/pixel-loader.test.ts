/*
 * <tc-pixel-loader> in real browsers: the grid and its patterns, the clock and how it stops, the end shapes, the
 * announcements, narrow width, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/pixel-loader";
import { formatElapsed, type TcPixelLoader } from "../../src/elements/pixel-loader";
import { PixelLoader } from "../../src/elements/react/pixel-loader";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const dots = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-pxl__dot")];
const lit = (el: Element) => dots(el).flatMap((d, i) => (d.hasAttribute("data-lit") ? [i] : []));
const time = (el: Element) => el.querySelector(".ui-pxl__time")!.textContent;
const sr = (el: Element) => el.querySelector(".ui-pxl__sr")!.textContent;

describe("tc-pixel-loader", () => {
  test("formats the elapsed time", () => {
    expect(formatElapsed(0)).toBe("0.0s");
    expect(formatElapsed(240)).toBe("0.2s");
    expect(formatElapsed(9_960)).toBe("9.9s");
    expect(formatElapsed(12_400)).toBe("12s");
    expect(formatElapsed(64_000)).toBe("1m 4s");
    expect(formatElapsed(-50)).toBe("0.0s");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a 5 × 5 grid, the label, the time and a status line`, async () => {
      const el = await fixture<TcPixelLoader>(html`<tc-pixel-loader look=${look} label="Reading the audit log" .started=${1000} .now=${3400}></tc-pixel-loader>`);
      expect(el.dataset.ui).toBe("pxl");
      expect(el.dataset.look).toBe(look);
      expect(dots(el)).toHaveLength(25);
      expect(el.querySelector(".ui-pxl__grid")!.getAttribute("aria-hidden")).toBe("true");
      expect(el.querySelector(".ui-pxl__label")!.textContent).toBe("Reading the audit log");
      expect(time(el)).toBe("2.4s");
      expect(el.querySelector(".ui-pxl__sr")!.getAttribute("role")).toBe("status");
      expect(sr(el)).toBe("Reading the audit log");
      expect(el.querySelector(".ui-pxl__time")!.getAttribute("aria-hidden")).toBe("true");
      expect(getComputedStyle(el).display).toBe("inline-flex");
    });
  }

  test("each pattern gives the dots their own phases; orbit rests the middle", async () => {
    const el = await fixture<TcPixelLoader>(html`<tc-pixel-loader pattern="wave"></tc-pixel-loader>`);
    const phases = () => dots(el).map((d) => d.style.getPropertyValue("--tc-pxl-phase"));
    const wave = phases();
    expect(wave[0]).toBe("0.000");
    expect(wave[6]).toBe(wave[2]);
    el.pattern = "drive";
    await el.updateComplete;
    const drive = phases();
    expect(drive[4]).toBe("0.160");
    expect(drive[9]).toBe("0.200"); // row 1 runs back from the right
    el.pattern = "orbit";
    await el.updateComplete;
    expect(dots(el).filter((d) => d.hasAttribute("data-rest"))).toHaveLength(9);
    el.pattern = "dots";
    await el.updateComplete;
    const once = phases();
    const again = await fixture<TcPixelLoader>(html`<tc-pixel-loader pattern="dots"></tc-pixel-loader>`);
    expect(dots(again).map((d) => d.style.getPropertyValue("--tc-pxl-phase"))).toEqual(once);
    expect(new Set(once).size).toBeGreaterThan(10);
  });

  test("its own clock ticks without re-rendering, and stops when done", async () => {
    vi.useFakeTimers({ now: 1_000_000, toFake: ["setInterval", "clearInterval", "Date"] });
    const el = await fixture<TcPixelLoader>(html`<tc-pixel-loader></tc-pixel-loader>`);
    const updates = vi.spyOn(el as unknown as { update: (c: unknown) => void }, "update");
    vi.advanceTimersByTime(2300);
    expect(time(el)).toBe("2.3s");
    vi.advanceTimersByTime(12_000);
    expect(time(el)).toBe("14s");
    expect(updates).not.toHaveBeenCalled();
    el.state = "done";
    await el.updateComplete;
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(time(el)).toBe("14s");
    // Back to work starts the count over
    el.state = "working";
    await el.updateComplete;
    vi.advanceTimersByTime(500);
    expect(time(el)).toBe("0.5s");
  });

  test("started sets where the count starts; now drives it with no timer of its own", async () => {
    vi.useFakeTimers({ now: 50_000, toFake: ["setInterval", "clearInterval", "Date"] });
    const el = await fixture<TcPixelLoader>(html`<tc-pixel-loader .started=${38_000}></tc-pixel-loader>`);
    expect(time(el)).toBe("12s");
    const driven = await fixture<TcPixelLoader>(html`<tc-pixel-loader .started=${0} .now=${64_000}></tc-pixel-loader>`);
    expect(time(driven)).toBe("1m 4s");
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
    driven.now = 65_000;
    await driven.updateComplete;
    expect(time(driven)).toBe("1m 5s");
  });

  test("done lights a check, error a cross, and the status says how it ended", async () => {
    const el = await fixture<TcPixelLoader>(html`<tc-pixel-loader label="Exporting the register"></tc-pixel-loader>`);
    expect(lit(el)).toEqual([]);
    expect(el.querySelector(".ui-pxl__shine")).not.toBeNull();
    el.state = "done";
    await el.updateComplete;
    expect(lit(el)).toEqual([4, 8, 10, 12, 16]);
    expect(sr(el)).toBe("Done: Exporting the register");
    expect(el.querySelector(".ui-pxl__shine")).toBeNull();
    el.labels = { error: "Couldn't finish" };
    el.state = "error";
    await el.updateComplete;
    expect(lit(el)).toEqual([0, 4, 6, 8, 12, 16, 18, 20, 24]);
    expect(sr(el)).toBe("Couldn't finish: Exporting the register");
  });

  test("hide-time drops the time and the timer", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    const el = await fixture<TcPixelLoader>(html`<tc-pixel-loader hide-time></tc-pixel-loader>`);
    expect(el.querySelector(".ui-pxl__time")).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("narrow: a long label is cut off rather than overflowing", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 180px"><tc-pixel-loader label="Matching every vendor ID against the institute's register"></tc-pixel-loader></div>`);
    const el = wrap.querySelector<TcPixelLoader>("tc-pixel-loader")!;
    await settle(wrap);
    expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(181);
    expect(el.querySelector(".ui-pxl__time")!.getBoundingClientRect().right).toBeLessThanOrEqual(el.getBoundingClientRect().right + 1);
  });

  test("React: props reach the element and a re-render keeps the clock", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const render = (state: "working" | "done") =>
      act(async () => root.render(React.createElement(PixelLoader, { label: "Matching vendor IDs", pattern: "drive", size: "sm", started: 1000, now: 4000, state })));
    await render("working");
    const el = wrap.querySelector<TcPixelLoader>("tc-pixel-loader")!;
    await settle(wrap);
    expect(el.getAttribute("pattern")).toBe("drive");
    expect(el.getAttribute("size")).toBe("sm");
    expect(time(el)).toBe("3.0s");
    await render("done");
    await settle(wrap);
    expect(lit(el)).toHaveLength(5);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, working and ended`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.colorScheme = theme;
      wrap.innerHTML = `
        <tc-pixel-loader look="standard" label="Reading the audit log"></tc-pixel-loader>
        <tc-pixel-loader look="clean" label="Matching vendor IDs" pattern="orbit"></tc-pixel-loader>
        <tc-pixel-loader look="standard" label="Exporting" state="done"></tc-pixel-loader>
        <tc-pixel-loader look="clean" label="Uploading" state="error" size="sm"></tc-pixel-loader>`;
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
