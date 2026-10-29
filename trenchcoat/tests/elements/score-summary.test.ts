/*
 * <tc-score-summary> in real browsers: NPS and CSAT from counts or scores, bands rounded to 100, the change and the
 * sparkline, the target, the distribution as a toolbar with picking, empty data, controlled use, the wrapper, axe in
 * both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/score-summary";
import { percentsTo100, scoreCounts, summarizeScores, type ScoreSummaryScoreSelect, type TcScoreSummary } from "../../src/elements/score-summary";
import { ScoreSummary } from "../../src/elements/react/score-summary";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const bars = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-ssm__bar")];
const keys = (el: Element) => [...el.querySelectorAll(".ui-ssm__key")].map((k) => text(k));

// 312 answers: 52 detractors, 90 passives, 170 promoters
const Q3 = [6, 3, 4, 5, 7, 11, 16, 38, 52, 74, 96];
const CSAT = [9, 14, 31, 92, 118];

describe("tc-score-summary", () => {
  test("percentsTo100 adds up to 100 by largest remainder; all zero stays zero", () => {
    expect(percentsTo100([1, 1, 1])).toEqual([34, 33, 33]);
    expect(percentsTo100([52, 90, 170])).toEqual([17, 29, 54]);
    expect(percentsTo100([0, 0])).toEqual([0, 0]);
    for (const c of [[3, 3, 3, 3, 3, 3, 1], [7, 0, 2], [1, 2, 3, 4, 5]]) expect(percentsTo100(c).reduce((a, b) => a + b, 0)).toBe(100);
  });

  test("scoreCounts from counts or from a list of scores; summarizeScores for NPS and CSAT", () => {
    expect(scoreCounts("nps", [], [10, 9, 0, 7, 10, 11, -1])).toEqual([1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 2]);
    expect(scoreCounts("csat", [], [5, 4, 4, 1, 0])).toEqual([1, 0, 0, 2, 1]);
    expect(scoreCounts("csat", [2, 1])).toEqual([2, 1, 0, 0, 0]);
    const nps = summarizeScores("nps", Q3);
    expect(nps.total).toBe(312);
    expect(nps.bands.map((b) => [b.key, b.count, b.percent])).toEqual([["detractor", 52, 17], ["passive", 90, 29], ["promoter", 170, 54]]);
    expect(nps.value).toBe(38);
    const csat = summarizeScores("csat", CSAT);
    expect(csat.value).toBe(80);
    expect(csat.bands.reduce((a, b) => a + b.percent, 0)).toBe(100);
    expect(summarizeScores("nps", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).value).toBeNull();
    expect(summarizeScores("nps", [10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).value).toBe(-100);
    // From the counts, rounded once: a balanced split is 0, not the −1 the rounded bands (33 − 34) would give
    expect(summarizeScores("nps", [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0]).value).toBe(0);
    // 7 of 8 promoters, 1 passive: 87.5 rounds to 88
    expect(summarizeScores("nps", [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 7]).value).toBe(88);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: NPS – the score with its name, the count, the change, the target, the bands and a bar per score`, async () => {
      const el = await fixture<TcScoreSummary>(html`<tc-score-summary
        look=${look}
        description="Riverside Library app · Q3"
        .responses=${Q3}
        .trend=${[{ label: "Q1", value: 18 }, { label: "Q2", value: 24 }]}
        target="40"
      ></tc-score-summary>`);
      expect(el.dataset.ui).toBe("ssm");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Net Promoter Score");
      expect(el.querySelector(".ui-ssm__card")!.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      expect(text(el.querySelector(".ui-ssm__total"))).toBe("312 responses");
      expect(text(el.querySelector(".ui-ssm__hero"))).toBe("NPS +38");
      expect(text(el.querySelector(".ui-ssm__change"))).toBe("Up 14 points from Q2");
      expect(el.querySelector(".ui-ssm__change")!.getAttribute("data-dir")).toBe("up");
      expect(text(el.querySelector(".ui-ssm__spark .ui-ssm__sr"))).toBe("Trend: Q1 +18, Q2 +24, now +38");
      expect(el.querySelector(".ui-ssm__spark svg")!.getAttribute("aria-hidden")).toBe("true");
      expect(text(el.querySelector(".ui-ssm__target"))).toBe("Target +40 · 2 points below");
      expect(keys(el)).toEqual(["Detractors 17% 52", "Passives 29% 90", "Promoters 54% 170"]);
      const dist = el.querySelector(".ui-ssm__dist")!;
      expect(dist.getAttribute("role")).toBe("toolbar");
      expect(document.getElementById(dist.getAttribute("aria-labelledby")!)!.textContent).toBe("Answers by score");
      expect(bars(el)).toHaveLength(11);
      expect(text(bars(el)[9])).toBe("74 9: 74 responses, 24%");
      expect(bars(el).map((b) => b.dataset.band)).toEqual([...Array(7).fill("detractor"), "passive", "passive", "promoter", "promoter"]);
      expect(bars(el).filter((b) => b.tabIndex === 0)).toHaveLength(1);
    });

    test(`${look}: CSAT – the share of 4s and 5s, five bands by word, the change from previous`, async () => {
      const el = await fixture<TcScoreSummary>(html`<tc-score-summary look=${look} kind="csat" .responses=${CSAT} previous="82" compared-to="last quarter"></tc-score-summary>`);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Customer satisfaction");
      expect(text(el.querySelector(".ui-ssm__hero"))).toBe("CSAT 80%");
      expect(text(el.querySelector(".ui-ssm__change"))).toBe("Down 2 points from last quarter");
      expect(el.querySelector(".ui-ssm__spark")).toBeNull();
      expect(el.querySelector(".ui-ssm__target")).toBeNull();
      expect(keys(el).map((k) => k.split(" ").slice(0, -2).join(" "))).toEqual(["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"]);
      expect(bars(el).map((b) => b.dataset.score)).toEqual(["1", "2", "3", "4", "5"]);
    });
  }

  test("a list of scores; one response; negative NPS; no change; target met", async () => {
    const el = await fixture<TcScoreSummary>(html`<tc-score-summary .scores=${[2]} previous="-100" target="-100"></tc-score-summary>`);
    expect(text(el.querySelector(".ui-ssm__total"))).toBe("1 response");
    expect(text(el.querySelector(".ui-ssm__hero"))).toBe("NPS −100");
    expect(text(el.querySelector(".ui-ssm__change"))).toBe("No change from last time");
    expect(text(el.querySelector(".ui-ssm__target"))).toBe("Target −100 · met");
    expect(el.querySelector(".ui-ssm__target")!.hasAttribute("data-met")).toBe(true);
    expect(el.querySelector(".ui-ssm__fill")!.hasAttribute("data-neg")).toBe(true);
  });

  test("empty: a dash and No responses yet, no bands or bars", async () => {
    const el = await fixture<TcScoreSummary>(html`<tc-score-summary></tc-score-summary>`);
    expect(text(el.querySelector(".ui-ssm__hero"))).toBe("NPS –");
    expect(text(el.querySelector(".ui-ssm__empty-text"))).toBe("No responses yet");
    expect(text(el.querySelector(".ui-ssm__total"))).toBe("0 responses");
    expect(el.querySelector(".ui-ssm__bands")).toBeNull();
    expect(bars(el)).toHaveLength(0);
  });

  test("the distribution: arrows, Home and End move; Enter picks and fires tc-score-select; again clears; Escape clears", async () => {
    const el = await fixture<TcScoreSummary>(html`<tc-score-summary .responses=${Q3}></tc-score-summary>`);
    const seen: (number | null)[] = [];
    el.addEventListener("tc-score-select", (e) => seen.push((e as CustomEvent<ScoreSummaryScoreSelect>).detail.score));
    bars(el)[0].focus();
    key(bars(el)[0], "End");
    await settle();
    expect(document.activeElement).toBe(bars(el)[10]);
    key(document.activeElement!, "ArrowLeft");
    await settle();
    expect(document.activeElement).toBe(bars(el)[9]);
    expect(bars(el)[9].tabIndex).toBe(0);
    key(document.activeElement!, "Home");
    await settle();
    key(document.activeElement!, "ArrowLeft");
    await settle();
    expect(document.activeElement).toBe(bars(el)[0]);
    bars(el)[8].click();
    await settle();
    expect(el.selected).toBe(8);
    expect(bars(el)[8].getAttribute("aria-pressed")).toBe("true");
    expect(text(el.querySelector(".ui-ssm__picked"))).toBe("Score 8 · 52 responses (17%) · Passives");
    bars(el)[8].click();
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector(".ui-ssm__picked")).toBeNull();
    bars(el)[2].click();
    await settle();
    key(bars(el)[2], "Escape");
    await settle();
    expect(el.selected).toBeNull();
    expect(seen).toEqual([8, null, 2, null]);
  });

  test("preventDefault keeps the selection; a selection off the scale is dropped", async () => {
    const el = await fixture<TcScoreSummary>(html`<tc-score-summary kind="csat" .responses=${CSAT} .selected=${4}></tc-score-summary>`);
    expect(text(el.querySelector(".ui-ssm__picked"))).toBe("Score 4 · 92 responses (35%) · Satisfied");
    el.addEventListener("tc-score-select", (e) => e.preventDefault());
    bars(el)[0].click();
    await settle();
    expect(el.selected).toBe(4);
    el.selected = 0;
    await settle();
    expect(el.selected).toBeNull();
  });

  test("narrow: the meter goes under the score and every bar keeps a usable width", async () => {
    const wrap = await fixture(html`<div style="width: 320px"><tc-score-summary .responses=${Q3} target="40"></tc-score-summary></div>`);
    const el = wrap.querySelector("tc-score-summary")!;
    const score = el.querySelector(".ui-ssm__score")!.getBoundingClientRect();
    const meter = el.querySelector(".ui-ssm__meter")!.getBoundingClientRect();
    expect(meter.top).toBeGreaterThanOrEqual(score.bottom - 1);
    expect(bars(el).every((b) => b.getBoundingClientRect().width >= 18)).toBe(true);
    expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(320);
  });

  test("React wrapper: an uncontrolled pick survives a parent re-render; a controlled one stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: (number | null)[] = [];
    let bump = () => {};
    function App({ selected }: { selected?: number | null }) {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ScoreSummary, { title: "App NPS", responses: Q3, selected, onScoreSelect: (s) => seen.push(s), "data-n": n } as React.ComponentProps<typeof ScoreSummary>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-score-summary")!;
    expect(el.heading).toBe("App NPS");
    bars(el)[10].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe(10);
    await act(async () => root.render(React.createElement(App, { selected: 3 })));
    await settle();
    bars(el)[5].click();
    await settle();
    expect(el.selected).toBe(3);
    await act(async () => root.render(React.createElement(App, { selected: 5 })));
    await settle();
    expect(el.selected).toBe(5);
    expect(seen).toEqual([10, 5]);
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme – NPS picked with a trend and target, CSAT, empty; wide and narrow", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <div style="width: 640px"><tc-score-summary .responses=${Q3} .trend=${[{ label: "Q1", value: 18 }, { label: "Q2", value: 24 }]} target="40" .selected=${9}></tc-score-summary></div>
        <div style="width: 640px"><tc-score-summary look="clean" kind="csat" .responses=${CSAT} previous="82"></tc-score-summary></div>
        <div style="width: 320px"><tc-score-summary look="clean" .responses=${Q3} .selected=${2}></tc-score-summary></div>
        <div style="width: 320px"><tc-score-summary></tc-score-summary></div>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
