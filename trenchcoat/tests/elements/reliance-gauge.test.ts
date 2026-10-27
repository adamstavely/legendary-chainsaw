/*
 * <tc-reliance-gauge> in real browsers: the host and both looks, the dial (given index, or from reliance and
 * accuracy) and its bands, which way trust leans, the trend and its keyboard, signals against both thresholds, the
 * recommendation and its sentence (and overrides), the episode buttons, switching the review level (and controlled
 * use), the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/reliance-gauge";
import type { RelianceSignal, RelianceWindow, TcRelianceGauge } from "../../src/elements/reliance-gauge";
import { RelianceGauge } from "../../src/elements/react/reliance-gauge";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const TREND: RelianceWindow[] = [
  { label: "Week 1", index: 0.94 },
  { label: "Week 2", index: 0.97 },
  { label: "Week 3", index: 0.89 },
  { label: "Week 4", index: 0.83 },
];
const sig = (id: string, value: number, extra: Partial<RelianceSignal> = {}): RelianceSignal => ({ id, label: id === "a" ? "Accepted unedited" : "Sources not opened", value, ...extra });
const gauge = (o: { look?: string; signals?: RelianceSignal[]; level?: string } = {}) =>
  fixture<TcRelianceGauge>(
    html`<tc-reliance-gauge look=${o.look ?? "standard"} scope="Last 30 days" reliance="0.9" accuracy="0.73" review-level=${o.level ?? "routine"} overtrust="6" undertrust="1" .trend=${TREND} .signals=${o.signals ?? [sig("a", 0.4), sig("b", 0.3)]}></tc-reliance-gauge>`,
  );

describe("tc-reliance-gauge", () => {
  for (const look of looks) {
    test(`${look}: the host is the root and a region named by its heading`, async () => {
      const el = await gauge({ look });
      expect(el.dataset.ui).toBe("rlg");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Reliance");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Last 30 days");
      expect(el.querySelector(".ui-rlg__index")!.textContent).toBe("0.83");
      expect(el.querySelector(".ui-rlg__pill")!.textContent).toBe("Drifting");
      expect(el.dataset.band).toBe("drifting");
    });
  }

  test("the dial is a meter: from reliance and accuracy, or a given index; bands follow the thresholds", async () => {
    const el = await gauge();
    const dial = el.querySelector<HTMLElement>(".ui-rlg__dial")!;
    expect(dial.getAttribute("role")).toBe("meter");
    expect(dial.getAttribute("aria-label")).toBe("Reliance–accuracy index");
    expect(dial.getAttribute("aria-valuemin")).toBe("0");
    expect(dial.getAttribute("aria-valuemax")).toBe("1");
    expect(Number(dial.getAttribute("aria-valuenow"))).toBeCloseTo(0.83, 5);
    expect(dial.getAttribute("aria-valuetext")).toBe("0.83 of 1, drifting, leaning to overtrust");
    expect(dial.querySelector(".ui-rlg__fill")!.getAttribute("stroke-dasharray")).toMatch(/^83(\.\d+)? 100$/);
    expect(dial.querySelectorAll(".ui-rlg__notch").length).toBe(2);
    el.index = 0.95;
    await settle();
    await wait(800);
    await settle();
    expect(el.querySelector(".ui-rlg__index")!.textContent).toBe("0.95");
    expect(el.dataset.band).toBe("calibrated");
    el.driftAt = 0.97;
    el.calibratedAt = 0.99;
    await settle();
    expect(el.dataset.band).toBe("miscalibrated");
    expect(el.querySelector(".ui-rlg__pill")!.textContent).toBe("Miscalibrated");
    const empty = await fixture<TcRelianceGauge>(html`<tc-reliance-gauge></tc-reliance-gauge>`);
    expect(empty.querySelector(".ui-rlg__index")!.textContent).toBe("–");
    expect(empty.querySelector(".ui-rlg__dial")!.getAttribute("aria-valuetext")).toBe("No data yet");
    expect(empty.querySelector(".ui-rlg__dial")!.hasAttribute("aria-valuenow")).toBe(false);
    expect(empty.querySelector(".ui-rlg__pill")).toBeNull();
    expect(empty.dataset.band).toBeUndefined();
  });

  test("which way trust leans", async () => {
    const el = await gauge();
    expect(el.querySelector(".ui-rlg__lean-title")!.textContent).toBe("Leaning to overtrust");
    expect(plain(el.querySelector(".ui-rlg__pair")!.textContent)).toBe("Reliance90% Accuracy73%");
    el.reliance = 0.6;
    await settle();
    expect(el.querySelector(".ui-rlg__lean-title")!.textContent).toBe("Leaning to undertrust");
    expect(el.querySelector(".ui-rlg__dial")!.getAttribute("aria-valuetext")).toContain("leaning to undertrust");
    el.reliance = 0.75;
    await settle();
    expect(el.querySelector(".ui-rlg__lean-title")!.textContent).toBe("Trust matches accuracy");
    el.reliance = undefined;
    el.index = 0.7;
    await settle();
    expect(el.querySelector(".ui-rlg__lean")).toBeNull();
  });

  test("the trend: the change over the windows; arrows, Home, End and Escape read each window aloud", async () => {
    const el = await gauge();
    expect(plain(el.querySelector(".ui-rlg__trend-read")!.textContent)).toBe("−0.11over 4 windows");
    expect(el.querySelector(".ui-rlg__delta")!.getAttribute("data-dir")).toBe("down");
    expect(el.querySelectorAll(".ui-rlg__point").length).toBe(4);
    const plot = el.querySelector<HTMLElement>(".ui-rlg__plot")!;
    expect(plot.getAttribute("role")).toBe("group");
    expect(plot.getAttribute("aria-label")).toBe("Index over the last 4 windows, from 0.94 to 0.83 – arrow keys read each window");
    plot.focus();
    const key = async (k: string) => {
      plot.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
      await settle();
    };
    await key("ArrowLeft");
    expect(plain(el.querySelector(".ui-rlg__trend-read")!.textContent)).toBe("Week 4 · 0.83");
    await key("ArrowLeft");
    expect(plain(el.querySelector(".ui-rlg__trend-read")!.textContent)).toBe("Week 3 · 0.89");
    expect(el.querySelector('.ui-rlg__point[data-active]')).toBe(el.querySelectorAll(".ui-rlg__point")[2]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Week 3: 0.89, drifting");
    await key("Home");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Week 1: 0.94, calibrated");
    await key("ArrowLeft");
    expect(plain(el.querySelector(".ui-rlg__trend-read")!.textContent)).toBe("Week 1 · 0.94");
    await key("End");
    expect(plain(el.querySelector(".ui-rlg__trend-read")!.textContent)).toBe("Week 4 · 0.83");
    await key("Escape");
    expect(el.querySelector(".ui-rlg__delta")).not.toBeNull();
    // One window draws no trend
    el.trend = [TREND[0]];
    await settle();
    expect(el.querySelector(".ui-rlg__plot")).toBeNull();
  });

  test("signals: meters with both thresholds, their state and values", async () => {
    const el = await gauge({ signals: [sig("a", 0.72, { hint: "Used without a change" }), sig("b", 0.3)] });
    const rows = el.querySelectorAll<HTMLElement>(".ui-rlg__signal");
    expect([...rows].map((r) => r.dataset.state)).toEqual(["spot-check", "ok"]);
    const meter = rows[0].querySelector<HTMLElement>(".ui-rlg__thin")!;
    expect(meter.getAttribute("role")).toBe("meter");
    expect(meter.getAttribute("aria-label")).toBe("Accepted unedited");
    expect(meter.getAttribute("aria-valuenow")).toBe("0.72");
    expect(meter.getAttribute("aria-valuetext")).toBe("72%, past the spot-check threshold (60%)");
    expect([...meter.querySelectorAll<HTMLElement>(".ui-rlg__tick")].map((t) => t.style.left)).toEqual(["60%", "80%"]);
    expect(rows[0].querySelector(".ui-rlg__signal-hint")!.textContent).toBe("Used without a change");
    expect(rows[0].querySelector(".ui-rlg__dot")).not.toBeNull();
    expect(rows[1].querySelector(".ui-rlg__dot")).toBeNull();
    // Element thresholds and a signal's own
    el.spotCheckAt = 0.2;
    el.signals = [sig("a", 0.72), sig("b", 0.3, { mandatoryAt: 0.25 })];
    await settle();
    expect([...el.querySelectorAll<HTMLElement>(".ui-rlg__signal")].map((r) => r.dataset.state)).toEqual(["spot-check", "mandatory"]);
    expect(el.querySelectorAll<HTMLElement>(".ui-rlg__signal")[1].querySelector(".ui-rlg__thin")!.getAttribute("aria-valuetext")).toBe("30%, past the mandatory threshold (25%)");
  });

  test("the recommendation follows the worst signal and the index, with a sentence; announced when it changes", async () => {
    const el = await gauge();
    const advice = () => el.querySelector<HTMLElement>(".ui-rlg__advice")!;
    expect(advice().dataset.level).toBe("routine");
    expect(plain(advice().querySelector(".ui-rlg__advice-title")!.textContent)).toBe("Recommended: Routine review");
    expect(advice().querySelector(".ui-rlg__advice-text")!.textContent).toBe("Every signal is under its threshold, but the index is drifting – review as usual and watch the trend.");
    el.signals = [sig("a", 0.66), sig("b", 0.3)];
    await settle();
    expect(advice().dataset.level).toBe("spot-check");
    expect(advice().querySelector(".ui-rlg__advice-text")!.textContent).toBe("Accepted unedited is at 66%, past the 60% spot-check threshold – check a sample of outputs.");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Recommended review is now spot-check.");
    el.signals = [sig("a", 0.86), sig("b", 0.81)];
    await settle();
    expect(advice().dataset.level).toBe("mandatory");
    expect(advice().querySelector(".ui-rlg__advice-text")!.textContent).toBe("2 signals are past the mandatory threshold, led by accepted unedited at 86% – check every output before relying on it.");
    // The index alone: below the drift line asks for a spot-check
    el.signals = [];
    el.index = 0.7;
    await settle();
    expect(advice().dataset.level).toBe("spot-check");
    expect(advice().querySelector(".ui-rlg__advice-text")!.textContent).toBe("The index is 0.70, below 0.80 – trust no longer matches performance, so check a sample of outputs.");
    // Overrides and level names
    el.recommended = "mandatory";
    el.reason = "Policy: new templates are reviewed in full for their first month.";
    el.levelLabels = { mandatory: "Full review" };
    await settle();
    expect(plain(advice().querySelector(".ui-rlg__advice-title")!.textContent)).toBe("Recommended: Full review");
    expect(advice().querySelector(".ui-rlg__advice-text")!.textContent).toBe("Policy: new templates are reviewed in full for their first month.");
  });

  test("episodes: counts; buttons that fire tc-episodes-open only when browsable", async () => {
    const el = await gauge();
    expect([...el.querySelectorAll(".ui-rlg__ep-count")].map((c) => c.textContent)).toEqual(["6", "1"]);
    expect(el.querySelector("button.ui-rlg__ep")).toBeNull();
    el.browsable = true;
    await settle();
    const kinds: string[] = [];
    el.addEventListener("tc-episodes-open", (e) => kinds.push((e as CustomEvent).detail.kind));
    const buttons = el.querySelectorAll<HTMLButtonElement>("button.ui-rlg__ep");
    expect(plain(buttons[0].textContent)).toBe("6 Overtrust relied on, then found wrong");
    buttons[1].click();
    buttons[0].click();
    expect(kinds).toEqual(["undertrust", "overtrust"]);
  });

  test("the footer: the level in force, and a switch that fires a cancelable tc-review-level-change", async () => {
    const el = await gauge({ signals: [sig("a", 0.85)] });
    expect(plain(el.querySelector(".ui-rlg__status")!.textContent)).toBe("In force: Routine review");
    const btn = el.querySelector<HTMLButtonElement>(".ui-rlg__btn")!;
    expect(btn.textContent).toBe("Switch to mandatory review");
    expect(btn.classList.contains("ui-rlg__btn--primary")).toBe(true);
    const seen: unknown[] = [];
    el.addEventListener("tc-review-level-change", (e) => seen.push((e as CustomEvent).detail));
    btn.click();
    await settle();
    expect(seen).toEqual([{ level: "mandatory", previous: "routine" }]);
    expect(el.reviewLevel).toBe("mandatory");
    expect(el.querySelector(".ui-rlg__btn")).toBeNull();
    expect(el.querySelector(".ui-rlg__match")!.textContent).toBe("As recommended");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Review level set to mandatory review.");
    // Easing off is offered as the quieter button
    el.signals = [sig("a", 0.2)];
    await settle();
    expect(el.querySelector(".ui-rlg__btn")!.classList.contains("ui-rlg__btn--secondary")).toBe(true);
    // No level in force: no footer
    el.reviewLevel = undefined;
    await settle();
    expect(el.querySelector(".ui-rlg__foot")).toBeNull();
  });

  test("controlled: preventDefault keeps the level until the app passes it back", async () => {
    const el = await gauge({ signals: [sig("a", 0.7)] });
    el.addEventListener("tc-review-level-change", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-rlg__btn")!.click();
    await settle();
    expect(el.reviewLevel).toBe("routine");
    el.reviewLevel = "spot-check";
    await settle();
    expect(el.querySelector(".ui-rlg__match")).not.toBeNull();
  });

  test("a change rolls the numbers to the new value", async () => {
    const el = await gauge();
    el.index = 0.4;
    await settle();
    await wait(100);
    expect(el.querySelector(".ui-rlg__index")!.textContent).not.toBe("0.40");
    await wait(800);
    await settle();
    expect(el.querySelector(".ui-rlg__index")!.textContent).toBe("0.40");
  });

  test("the wrapper: an uncontrolled level survives a parent re-render; callbacks fire", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: unknown[] = [];
    let rerender!: (n: number) => void;
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(RelianceGauge, {
        title: `Reliance ${n}`,
        index: 0.85,
        signals: [sig("a", 0.9)],
        defaultReviewLevel: "routine",
        onReviewLevelChange: (level, previous) => calls.push(["level", level, previous]),
        onOpenEpisodes: (kind) => calls.push(["open", kind]),
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-reliance-gauge")!;
    expect(el.browsable).toBe(true);
    el.querySelector<HTMLButtonElement>(".ui-rlg__btn")!.click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector("h3")!.textContent).toBe("Reliance 1");
    expect(el.reviewLevel).toBe("mandatory");
    el.querySelector<HTMLButtonElement>("button.ui-rlg__ep")!.click();
    expect(calls).toEqual([["level", "mandatory", "routine"], ["open", "overtrust"]]);
    await act(async () => root.unmount());
  });

  test("the wrapper: a controlled level only reports", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    await act(async () => root.render(React.createElement(RelianceGauge, { index: 0.85, signals: [sig("a", 0.9)], reviewLevel: "routine", onReviewLevelChange: (l) => seen.push(l) })));
    await settle();
    const el = host.querySelector("tc-reliance-gauge")!;
    expect(el.browsable).toBe(false);
    el.querySelector<HTMLButtonElement>(".ui-rlg__btn")!.click();
    await act(async () => settle());
    expect(seen).toEqual(["mandatory"]);
    expect(el.reviewLevel).toBe("routine");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-reliance-gauge scope="Routine" reliance="0.82" accuracy="0.8" review-level="routine" .trend=${TREND} .signals=${[sig("a", 0.3)]}></tc-reliance-gauge>
        <tc-reliance-gauge heading="Spot" browsable reliance="0.9" accuracy="0.73" overtrust="4" review-level="routine" .trend=${TREND} .signals=${[sig("a", 0.66), sig("b", 0.2)]}></tc-reliance-gauge>
        <tc-reliance-gauge look="clean" heading="Mandatory" browsable index="0.6" undertrust="3" review-level="routine" .trend=${TREND} .signals=${[sig("a", 0.9)]}></tc-reliance-gauge>
        <tc-reliance-gauge look="clean" heading="Clean spot" reliance="0.6" accuracy="0.8" .signals=${[sig("b", 0.62)]}></tc-reliance-gauge>
      </div>`);
      await wait(700);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
