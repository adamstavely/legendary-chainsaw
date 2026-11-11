/*
 * <tc-score-ring> in real browsers: a segment per sub-score as long as its weight and filled to its score, the
 * weighted overall score and its band, isolating a segment from its row or the ring, selecting, the rows' keyboard,
 * metrics, the sweep ending where a still ring is drawn, controlled use, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/score-ring";
import type { ScoreRingMetric, ScoreRingSubscore, ScoreRingSubscoreChange, TcScoreRing } from "../../src/elements/score-ring";
import { ScoreRing } from "../../src/elements/react/score-ring";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

/** Weighted: (91·4 + 84·3 + 62·2 + 71·2) / 11 = 80.2 → 80, Good */
const SUBS: ScoreRingSubscore[] = [
  { id: "complete", label: "Completeness", score: 91, weight: 4 },
  { id: "accurate", label: "Accuracy", score: 84, weight: 3 },
  { id: "fresh", label: "Freshness", score: 62, weight: 2 },
  { id: "consistent", label: "Consistency", score: 71, weight: 2 },
];
const METRICS: ScoreRingMetric[] = [
  { label: "Records checked", value: 48210 },
  { label: "Median age", value: 19, unit: "days", change: "+3 days", trend: "bad" },
];

const make = (look: "standard" | "clean" = "standard", still = true) =>
  fixture<TcScoreRing>(html`<tc-score-ring look=${look} ?still=${still} heading="Data quality" .subscores=${SUBS} .metrics=${METRICS}></tc-score-ring>`);
const row = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-subscore="${id}"]`)!;
const seg = (el: Element, id: string) => el.querySelector<SVGGElement>(`[data-seg="${id}"]`)!;
/** The middle's parts, a space between them */
const mid = (el: Element) => [...el.querySelector(".ui-scrg__mid")!.children].map((c) => c.textContent!.trim()).join(" ");
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
/** A path's length, for comparing segments */
const len = (p: Element | null) => (p ? (p as SVGPathElement).getTotalLength() : 0);

describe("tc-score-ring", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the ring as an image with a summary, a row per sub-score, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("scrg");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector('[role="img"]')!.getAttribute("aria-label")).toBe(
        "Data quality: 80 out of 100, Good. Completeness 91, Accuracy 84, Freshness 62, Consistency 71",
      );
      const rows = el.querySelectorAll<HTMLButtonElement>(".ui-scrg__row");
      expect(rows).toHaveLength(4);
      expect(el.querySelector('[role="group"]')!.getAttribute("aria-label")).toBe("Data quality sub-scores");
      expect(rows[0].textContent!.replace(/\s+/g, " ").trim()).toBe("Completeness 36% of the score 91");
      expect([...rows].filter((r) => r.tabIndex === 0)).toHaveLength(1);
      expect(rows[0].tabIndex).toBe(0);
      expect(mid(el)).toBe("80 Good out of 100");
      expect(el.querySelector(".ui-scrg__band")!.getAttribute("data-tone")).toBe("success");
    });
  }

  test("segments: as long as their weight, filled to their score, in the palette unless given a colour", async () => {
    const el = await make();
    expect(el.querySelectorAll(".ui-scrg__track")).toHaveLength(4);
    expect(el.querySelectorAll(".ui-scrg__fill")).toHaveLength(4);
    const track = (id: string) => len(seg(el, id).querySelector(".ui-scrg__track"));
    const fill = (id: string) => len(seg(el, id).querySelector(".ui-scrg__fill"));
    // Completeness weighs twice Freshness
    expect(track("complete") / track("fresh")).toBeCloseTo(2, 1);
    expect(track("fresh")).toBeCloseTo(track("consistent"), 1);
    // Filled to the score
    expect(fill("complete") / track("complete")).toBeCloseTo(0.91, 1);
    expect(fill("fresh") / track("fresh")).toBeCloseTo(0.62, 1);
    expect(seg(el, "complete").getAttribute("style")).toContain("var(--tc-chart-1)");
    el.subscores = [{ ...SUBS[0], color: "rebeccapurple" }, ...SUBS.slice(1)];
    await settle();
    expect(seg(el, "complete").getAttribute("style")).toContain("rebeccapurple");
  });

  test("`score` overrides the average; bands can be renamed; empty sub-scores show an empty state", async () => {
    const el = await make();
    el.score = 55;
    el.bands = [
      { min: 70, label: "On track", tone: "success" },
      { min: 0, label: "Behind", tone: "warning" },
    ];
    el.caption = "points";
    await settle();
    expect(mid(el)).toBe("55 Behind points");
    expect(el.querySelector(".ui-scrg__band")!.getAttribute("data-tone")).toBe("warning");
    el.subscores = [];
    el.score = undefined;
    await settle();
    expect(el.querySelector(".ui-scrg__empty")!.textContent).toBe("No score to show yet.");
    expect(el.querySelector(".ui-scrg__metrics")).toBeTruthy();
  });

  test("pointing at a row or a segment, or focusing a row, isolates it; leaving restores the score", async () => {
    const el = await make();
    row(el, "fresh").dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(mid(el)).toBe("62 Freshness");
    expect(seg(el, "fresh").hasAttribute("data-muted")).toBe(false);
    expect(seg(el, "complete").hasAttribute("data-muted")).toBe(true);
    expect(row(el, "complete").hasAttribute("data-muted")).toBe(true);
    el.querySelector(".ui-scrg__card")!.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(mid(el)).toBe("80 Good out of 100");
    expect(el.querySelectorAll("[data-muted]")).toHaveLength(0);
    seg(el, "accurate").dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(mid(el)).toBe("84 Accuracy");
    el.querySelector(".ui-scrg__card")!.dispatchEvent(new PointerEvent("pointerleave"));
    row(el, "consistent").focus();
    await settle();
    expect(mid(el)).toBe("71 Consistency");
  });

  test("click or Enter selects a sub-score, again or Escape clears it; tc-subscore-change carries it", async () => {
    const el = await make();
    const seen: ScoreRingSubscoreChange[] = [];
    el.addEventListener("tc-subscore-change", (e) => seen.push((e as CustomEvent<ScoreRingSubscoreChange>).detail));
    row(el, "fresh").click();
    await settle();
    expect(el.subscore).toBe("fresh");
    expect(row(el, "fresh").getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Selected Freshness: 62");
    // Selected stays isolated with the pointer gone
    el.querySelector(".ui-scrg__card")!.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(mid(el)).toBe("62 Freshness");
    key(row(el, "fresh"), "Enter");
    row(el, "fresh").click();
    await settle();
    expect(el.subscore).toBeNull();
    seg(el, "accurate").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(el.subscore).toBe("accurate");
    key(row(el, "accurate"), "Escape");
    await settle();
    expect(el.subscore).toBeNull();
    expect(seen.map((d) => [d.subscore, d.item?.label])).toEqual([
      ["fresh", "Freshness"],
      [null, undefined],
      ["accurate", "Accuracy"],
      [null, undefined],
    ]);
  });

  test("keyboard: arrows move between rows, Home / End to the ends", async () => {
    const el = await make();
    row(el, "complete").focus();
    const at = () => (document.activeElement as HTMLElement).dataset.subscore;
    const press = async (k: string, want: string) => {
      key(document.activeElement!, k);
      await expect.poll(at).toBe(want);
    };
    await press("ArrowDown", "accurate");
    await press("ArrowRight", "fresh");
    await press("ArrowUp", "accurate");
    await press("End", "consistent");
    await press("ArrowDown", "consistent");
    await press("Home", "complete");
    expect([...el.querySelectorAll<HTMLElement>(".ui-scrg__row")].filter((r) => r.tabIndex === 0)).toHaveLength(1);
  });

  test("metrics: the value formatted, its unit and its change with its trend", async () => {
    const el = await make();
    const items = [...el.querySelectorAll(".ui-scrg__metric")];
    expect(items).toHaveLength(2);
    expect(items[0].querySelector("dt")!.textContent).toBe("Records checked");
    expect(items[0].querySelector("dd")!.textContent!.trim()).toBe(new Intl.NumberFormat().format(48210));
    expect(items[1].querySelector("dd")!.textContent!.replace(/\s+/g, " ").trim()).toBe("19 days +3 days");
    expect(items[1].querySelector(".ui-scrg__metric-change")!.getAttribute("data-trend")).toBe("bad");
  });

  test("the sweep ends where the still ring is drawn", async () => {
    const still = await make("standard", true);
    const want = [...still.querySelectorAll(".ui-scrg__fill")].map((p) => p.getAttribute("d"));
    cleanup();
    const el = await make("standard", false);
    await expect.poll(() => [...el.querySelectorAll(".ui-scrg__fill")].map((p) => p.getAttribute("d")), { timeout: 8000 }).toEqual(want);
  });

  test("controlled: preventDefault() keeps the selection; a sub-score that goes away clears it", async () => {
    const el = await fixture<TcScoreRing>(html`<tc-score-ring still .subscores=${SUBS} subscore="fresh"></tc-score-ring>`);
    el.addEventListener("tc-subscore-change", (e) => e.preventDefault());
    expect(row(el, "fresh").tabIndex).toBe(0);
    row(el, "complete").click();
    await settle();
    expect(el.subscore).toBe("fresh");
    el.subscores = SUBS.filter((s) => s.id !== "fresh");
    await settle();
    expect(el.subscore).toBeNull();
  });

  test("React wrapper: an uncontrolled selection survives parent re-renders; onSubscoreChange gets the item", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ScoreRing, {
        title: "Data quality",
        subscores: SUBS,
        still: true,
        onSubscoreChange: (s, item) => void seen.push([s, item?.label]),
        "data-n": n,
      } as React.ComponentProps<typeof ScoreRing>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-score-ring")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Data quality");
    row(el, "accurate").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.subscore).toBe("accurate");
    expect(seen).toEqual([["accurate", "Accuracy"]]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled selection stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: (string | null)[] = [];
    await act(async () => root.render(React.createElement(ScoreRing, { subscores: SUBS, still: true, subscore: null, onSubscoreChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-score-ring")!;
    row(el, "fresh").click();
    await settle();
    expect(asked).toEqual(["fresh"]);
    expect(el.subscore).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-score-ring still heading="Data quality" description="Survey records, scored this week." .subscores=${SUBS} .metrics=${METRICS} subscore="fresh"></tc-score-ring>
        <tc-score-ring still look="clean" .subscores=${SUBS} .metrics=${METRICS}></tc-score-ring>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
