/*
 * <tc-coverage-ring> in real browsers: the ring's fill and label, the clamp, the segment bar and its readout, the
 * keyboard, tc-select, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/coverage-ring";
import type { CoverageSegment, CoverageSelect, TcCoverageRing } from "../../src/elements/coverage-ring";
import { CoverageRing } from "../../src/elements/react/coverage-ring";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SEGMENTS: CoverageSegment[] = [
  { id: "strong", label: "Well covered", count: 6, tone: "success" },
  { id: "thin", label: "Thin", count: 3, tone: "warning" },
  { id: "empty", label: "Nothing", count: 0, tone: "neutral" },
  { id: "bare", label: "Uncovered", count: 1, tone: "danger" },
];

const seg = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-segment="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const offset = (el: Element) => parseFloat(el.querySelector<SVGCircleElement>(".ui-covr__fill")!.style.strokeDashoffset);
const C = 2 * Math.PI * 42;
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcCoverageRing>(html`<tc-coverage-ring look=${look} heading="Gap coverage" description="Share of open gaps with work." value="0.61" unit="topics" .segments=${SEGMENTS}></tc-coverage-ring>`);

describe("tc-coverage-ring", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the ring names its share; the title, description and the middle's percentage and caption`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("covr");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector('[role="img"]')!.getAttribute("aria-label")).toBe("61% covered");
      expect(el.querySelector(".ui-covr__num")!.textContent).toBe("61%");
      expect(el.querySelector(".ui-covr__caption")!.textContent).toBe("covered");
      expect(el.querySelector("h3")!.textContent).toBe("Gap coverage");
      expect(el.querySelector(".ui-covr__desc")!.textContent).toBe("Share of open gaps with work.");
      expect(offset(el)).toBeCloseTo(C * 0.39, 1);
    });
  }

  test("the value is clamped to 0–1; the tone and caption can change", async () => {
    const el = await make();
    el.value = 1.4;
    await settle();
    expect(el.querySelector(".ui-covr__num")!.textContent).toBe("100%");
    expect(offset(el)).toBeCloseTo(0, 1);
    el.value = -1;
    el.caption = "passing";
    el.tone = "danger";
    await settle();
    expect(el.querySelector('[role="img"]')!.getAttribute("aria-label")).toBe("0% passing");
    expect(el.querySelector<SVGElement>(".ui-covr__fill")!.dataset.tone).toBe("danger");
  });

  test("the bar: segments with a count, sized by it, each named; the ends, or the segment under the pointer", async () => {
    const el = await make();
    const segs = [...el.querySelectorAll<HTMLButtonElement>("[data-segment]")];
    expect(segs.map((s) => s.dataset.segment)).toEqual(["strong", "thin", "bare"]);
    expect(seg(el, "strong").getAttribute("aria-label")).toBe("Well covered: 6 topics, 60%");
    expect(seg(el, "strong").getBoundingClientRect().width).toBeGreaterThan(seg(el, "thin").getBoundingClientRect().width);
    const ends = () => [...el.querySelector(".ui-covr__ends")!.children].map((c) => c.textContent!.replace(/\s+/g, " ").trim()).join(" ");
    expect(ends()).toBe("Healthiest Needs attention");
    seg(el, "thin").dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(ends()).toBe("Thin · 3 topics · 30%");
    el.querySelector(".ui-covr__bar")!.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(ends()).toBe("Healthiest Needs attention");
    // A count of one takes the singular, once the page gives it
    expect(seg(el, "bare").getAttribute("aria-label")).toBe("Uncovered: 1 topics, 10%");
    el.unitOne = "topic";
    await settle();
    expect(seg(el, "bare").getAttribute("aria-label")).toBe("Uncovered: 1 topic, 10%");
    el.segments = [];
    await settle();
    expect(el.querySelector(".ui-covr__bar")).toBeNull();
  });

  test("keyboard: one tab stop, ← → Home End move and read out; Enter or a click fires tc-select", async () => {
    const el = await make();
    const picked: string[] = [];
    el.addEventListener("tc-select", (e) => picked.push((e as CustomEvent<CoverageSelect>).detail.id));
    expect(el.querySelectorAll('[data-segment][tabindex="0"]')).toHaveLength(1);
    seg(el, "strong").focus();
    key(seg(el, "strong"), "ArrowRight");
    await expect.poll(() => document.activeElement?.getAttribute("data-segment")).toBe("thin");
    expect(el.querySelector(".ui-covr__readout")!.textContent).toContain("Thin");
    key(document.activeElement!, "End");
    await expect.poll(() => document.activeElement?.getAttribute("data-segment")).toBe("bare");
    key(document.activeElement!, "Home");
    await expect.poll(() => document.activeElement?.getAttribute("data-segment")).toBe("strong");
    seg(el, "bare").click();
    expect(picked).toEqual(["bare"]);
  });

  test("React wrapper: props pass through; onSegmentSelect gets the segment", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    await act(async () => root.render(React.createElement(CoverageRing, { title: "Coverage", value: 0.5, segments: SEGMENTS, onSegmentSelect: (id, s) => void seen.push([id, s.label]) })));
    await settle();
    const el = host.querySelector("tc-coverage-ring")!;
    expect(el.querySelector("h3")!.textContent).toBe("Coverage");
    expect(el.querySelector(".ui-covr__num")!.textContent).toBe("50%");
    seg(el, "thin").click();
    expect(seen).toEqual([["thin", "Thin"]]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-coverage-ring heading="Gap coverage" description="Share of open gaps with work." value="0.61" .segments=${SEGMENTS}></tc-coverage-ring>
        <tc-coverage-ring look="clean" heading="Tests passing" value="0.9"></tc-coverage-ring>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
