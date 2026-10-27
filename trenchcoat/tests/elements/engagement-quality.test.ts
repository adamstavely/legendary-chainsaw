/*
 * <tc-engagement-quality> in real browsers: the host and both looks, the index (given, or the weighted mean of the
 * signals) and its bands, the sentence that names the weakest signals, the trend, the signals with their built-in or
 * own labels, readings and explanations, the example disclosures and their keyboard, tc-signal-open, the shared note,
 * the React wrapper and axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/engagement-quality";
import { engagementIndex, type EngagementSignal, type EngagementWindow, type TcEngagementQuality } from "../../src/elements/engagement-quality";
import { EngagementQuality } from "../../src/elements/react/engagement-quality";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const SIGNALS: EngagementSignal[] = [
  { id: "words", kind: "boilerplate", value: 0.82, reading: "1 of 12 notes reused earlier wording", example: "“Checked, looks fine.” – used on 4 items" },
  { id: "time", kind: "source-time", value: 0.41, reading: "Median 9 s with the source open", example: "Verdict 4 s after opening a 12-page source" },
  { id: "batch", kind: "batch-dismissal", value: 0.66, reading: "2 batches of 6 or more" },
  { id: "commit", kind: "repeated-commitment", value: 0.9 },
];
const TREND: EngagementWindow[] = [
  { label: "Session 1", index: 0.58 },
  { label: "Session 2", index: 0.63 },
  { label: "Session 3", index: 0.7 },
];
const card = (o: { look?: string; signals?: EngagementSignal[]; extra?: Partial<TcEngagementQuality> } = {}) =>
  fixture<TcEngagementQuality>(
    html`<tc-engagement-quality look=${o.look ?? "standard"} scope="Last 3 sessions" .trend=${TREND} .signals=${o.signals ?? SIGNALS}></tc-engagement-quality>`,
  );

describe("tc-engagement-quality", () => {
  for (const look of looks) {
    test(`${look}: the host is the root and a region named by its heading`, async () => {
      const el = await card({ look });
      expect(el.dataset.ui).toBe("egq");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Engagement quality");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Last 3 sessions");
      // Standard: the header on the tray, before the card · Clean: inside it
      expect(!!el.querySelector(".ui-egq__card .tc-head")).toBe(look === "clean");
      expect(el.querySelector(".ui-egq__index")!.textContent).toBe("0.70");
      expect(el.querySelector(".ui-egq__pill")!.textContent).toBe("Mixed");
      expect(el.dataset.band).toBe("mixed");
    });
  }

  test("the index: the weighted mean of the signals, or a given value; bands follow the thresholds", async () => {
    expect(engagementIndex(SIGNALS)).toBeCloseTo((0.82 + 0.41 + 0.66 + 0.9) / 4, 6);
    expect(engagementIndex([{ id: "a", value: 1, weight: 3 }, { id: "b", value: 0, weight: 1 }, { id: "c", value: 0.5, weight: 0 }])).toBeCloseTo(0.75, 6);
    expect(engagementIndex([])).toBeUndefined();
    const el = await card();
    const scale = el.querySelector<HTMLElement>(".ui-egq__scale")!;
    expect(scale.getAttribute("role")).toBe("meter");
    expect(scale.getAttribute("aria-label")).toBe("Engagement quality index");
    expect(scale.getAttribute("aria-valuemin")).toBe("0");
    expect(scale.getAttribute("aria-valuemax")).toBe("1");
    expect(Number(scale.getAttribute("aria-valuenow"))).toBeCloseTo(0.6975, 4);
    expect(scale.getAttribute("aria-valuetext")).toBe("0.70 of 1, mixed");
    expect([...el.querySelectorAll<HTMLElement>(".ui-egq__cut")].map((c) => c.style.left)).toEqual(["50%", "75%"]);
    expect(plain(el.querySelector(".ui-egq__bands")!.textContent)).toBe("Low Mixed Strong");
    expect(el.querySelector(".ui-egq__bands [data-on]")!.textContent).toBe("Mixed");
    el.index = 0.91;
    await settle();
    expect(el.querySelector(".ui-egq__index")!.textContent).toBe("0.91");
    expect(el.dataset.band).toBe("strong");
    expect(el.querySelector(".ui-egq__title")!.textContent).toBe("Reviews look genuine");
    el.index = 0.3;
    await settle();
    expect(el.dataset.band).toBe("low");
    expect(el.querySelector(".ui-egq__pill")!.textContent).toBe("Low");
    expect(el.querySelector(".ui-egq__title")!.textContent).toBe("Reviews look hurried");
    // Own thresholds and band names
    el.mixedAt = 0.2;
    el.strongAt = 0.6;
    el.bandLabels = { mixed: "Fair" };
    await settle();
    expect(el.querySelector(".ui-egq__pill")!.textContent).toBe("Fair");
    expect(el.querySelector(".ui-egq__scale")!.getAttribute("aria-valuetext")).toBe("0.30 of 1, fair");
    const empty = await fixture<TcEngagementQuality>(html`<tc-engagement-quality></tc-engagement-quality>`);
    expect(empty.querySelector(".ui-egq__index")!.textContent).toBe("–");
    expect(empty.querySelector(".ui-egq__scale")!.hasAttribute("role")).toBe(false);
    expect(empty.querySelector(".ui-egq__scale")!.getAttribute("aria-hidden")).toBe("true");
    expect(empty.querySelector(".ui-egq__sentence")!.textContent).toBe("No reviews to measure yet.");
    expect(empty.querySelector(".ui-egq__pill")).toBeNull();
    expect(empty.querySelector(".ui-egq__signals")).toBeNull();
  });

  test("the sentence names the signals below the strong band, lowest first; `summary` overrides it", async () => {
    const el = await card();
    expect(el.querySelector(".ui-egq__title")!.textContent).toBe("Mostly genuine");
    expect(el.querySelector(".ui-egq__sentence")!.textContent).toBe("Time on the source (0.41) and dismissals (0.66) are the signals holding it back.");
    el.signals = [SIGNALS[0], SIGNALS[1]];
    await settle();
    expect(el.querySelector(".ui-egq__sentence")!.textContent).toBe("Time on the source (0.41) is the signal holding it back.");
    el.signals = [SIGNALS[0], SIGNALS[3]];
    await settle();
    expect(el.querySelector(".ui-egq__sentence")!.textContent).toBe("Every signal is in the strong band.");
    el.summary = "Quicker verdicts on short sources are expected.";
    await settle();
    expect(el.querySelector(".ui-egq__sentence")!.textContent).toBe("Quicker verdicts on short sources are expected.");
  });

  test("the trend: columns per window and the change over them, said in words", async () => {
    const el = await card();
    expect(el.querySelectorAll(".ui-egq__bar").length).toBe(3);
    expect(el.querySelector(".ui-egq__bars")!.getAttribute("aria-hidden")).toBe("true");
    expect(el.querySelector(".ui-egq__delta")!.getAttribute("data-dir")).toBe("up");
    expect(plain(el.querySelector(".ui-egq__delta")!.textContent)).toBe("+0.12 over 3 windows");
    expect(el.querySelector(".ui-egq__trend .ui-egq__sr")!.textContent).toBe("From 0.58 in Session 1 to 0.70 in Session 3.");
    el.trend = [TREND[2], TREND[0]];
    await settle();
    expect(el.querySelector(".ui-egq__delta")!.getAttribute("data-dir")).toBe("down");
    expect(plain(el.querySelector(".ui-egq__delta")!.textContent)).toBe("−0.12 over 2 windows");
    el.trend = [TREND[0], TREND[0]];
    await settle();
    expect(plain(el.querySelector(".ui-egq__delta")!.textContent)).toBe("Steady over 2 windows");
    el.trend = [TREND[0]];
    await settle();
    expect(el.querySelector(".ui-egq__trend")).toBeNull();
  });

  test("signals: built-in labels and explanations, or the app's own; value, band, reading and meter", async () => {
    const el = await card();
    const rows = [...el.querySelectorAll<HTMLElement>(".ui-egq__signal")];
    expect(rows.map((r) => r.querySelector(".ui-egq__signal-label")!.textContent)).toEqual(["Written reasoning", "Time on the source", "Dismissals", "Follow-up commitments"]);
    expect(rows.map((r) => r.dataset.band)).toEqual(["strong", "low", "mixed", "strong"]);
    expect(rows[1].querySelector(".ui-egq__signal-value")!.textContent).toBe("0.41");
    expect(rows[1].querySelector(".ui-egq__reading")!.textContent).toBe("Median 9 s with the source open");
    expect(rows[1].querySelector(".ui-egq__explain")!.textContent).toContain("How long the source was open before a verdict was given.");
    const meter = rows[1].querySelector<HTMLElement>(".ui-egq__thin")!;
    expect(meter.getAttribute("role")).toBe("meter");
    expect(meter.getAttribute("aria-label")).toBe("Time on the source");
    expect(meter.getAttribute("aria-valuetext")).toBe("0.41 of 1, low – Median 9 s with the source open");
    expect(meter.querySelector<HTMLElement>(".ui-egq__thin-fill")!.style.width).toBe("41%");
    expect(rows[3].querySelector(".ui-egq__reading")).toBeNull();
    // The caption names the list
    const list = el.querySelector(".ui-egq__signals")!;
    expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("What it's built from");
    el.signals = [{ id: "x", label: "Checklist answers", explanation: "Whether checklist items are answered or skipped.", value: 0.5 }, { id: "bare", value: 0.2 }];
    await settle();
    const own = [...el.querySelectorAll<HTMLElement>(".ui-egq__signal")];
    expect(own[0].querySelector(".ui-egq__signal-label")!.textContent).toBe("Checklist answers");
    expect(own[0].querySelector(".ui-egq__explain")!.textContent).toBe("Whether checklist items are answered or skipped.");
    expect(own[1].querySelector(".ui-egq__signal-label")!.textContent).toBe("bare");
    expect(own[1].querySelector(".ui-egq__explain")).toBeNull();
    expect(own[1].querySelector(".ui-egq__toggle")).toBeNull();
  });

  test("examples are disclosures: Enter and Space open and close them; removed signals close", async () => {
    const el = await card();
    const toggles = el.querySelectorAll<HTMLButtonElement>(".ui-egq__toggle");
    // Only signals with an example get one (no browsable)
    expect(toggles.length).toBe(2);
    const t = toggles[1];
    const panel = document.getElementById(t.getAttribute("aria-controls")!)!;
    expect(t.getAttribute("aria-expanded")).toBe("false");
    expect(panel.hidden).toBe(true);
    expect(plain(t.textContent)).toBe("Example – Time on the source");
    t.focus();
    // A native button: Enter and Space are its click
    t.click();
    await settle();
    expect(t.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    expect(panel.querySelector(".ui-egq__quote")!.textContent).toBe("Verdict 4 s after opening a 12-page source");
    expect(panel.querySelector("button")).toBeNull();
    t.click();
    await settle();
    expect(panel.hidden).toBe(true);
    t.click();
    await settle();
    el.signals = SIGNALS.filter((s) => s.id !== "time");
    await settle();
    el.signals = SIGNALS;
    await settle();
    expect(el.querySelectorAll<HTMLButtonElement>(".ui-egq__toggle")[1].getAttribute("aria-expanded")).toBe("false");
  });

  test("browsable: every signal offers 'Show these reviews', which fires tc-signal-open", async () => {
    const el = await card();
    el.browsable = true;
    await settle();
    const toggles = el.querySelectorAll<HTMLButtonElement>(".ui-egq__toggle");
    expect(toggles.length).toBe(4);
    const ids: string[] = [];
    el.addEventListener("tc-signal-open", (e) => ids.push((e as CustomEvent).detail.id));
    toggles[3].click();
    await settle();
    const btn = el.querySelector<HTMLButtonElement>('[data-id="commit"] .ui-egq__btn')!;
    expect(plain(btn.textContent)).toBe("Show these reviews – Follow-up commitments");
    expect(el.querySelector('[data-id="commit"] .ui-egq__quote')).toBeNull();
    btn.click();
    expect(ids).toEqual(["commit"]);
  });

  test("the shared note: who else sees it, or the app's own words; placed by the look", async () => {
    const el = await card();
    expect(el.querySelector(".ui-egq__note")).toBeNull();
    el.sharedWith = "your team lead";
    await settle();
    expect(el.querySelector(".ui-egq__note")!.textContent).toBe("Shared with your team lead. It shows how far the review record can be relied on – it isn't a performance rating.");
    expect(el.querySelector(".ui-egq__card .ui-egq__note")).toBeNull();
    el.sharedNote = "Your reviewer sees this too.";
    el.look = "clean";
    await settle();
    expect(el.querySelector(".ui-egq__card .ui-egq__note")!.textContent).toBe("Your reviewer sees this too.");
  });

  test("quality, not a violation: no danger colours anywhere in its CSS", async () => {
    await card();
    const css = (customElements.get("tc-engagement-quality") as unknown as { css: string }).css;
    expect(css).not.toMatch(/danger/);
  });

  test("the wrapper: title and callbacks", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const opened: string[] = [];
    let rerender!: (n: number) => void;
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(EngagementQuality, n < 2 ? { title: `Quality ${n}`, signals: SIGNALS, sharedWith: "your lead", onOpenSignal: (id) => opened.push(id) } : { signals: SIGNALS });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-engagement-quality")!;
    expect(el.browsable).toBe(true);
    el.querySelectorAll<HTMLButtonElement>(".ui-egq__toggle")[0].click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector("h3")!.textContent).toBe("Quality 1");
    // The open example survives the parent's render
    expect(el.querySelectorAll<HTMLButtonElement>(".ui-egq__toggle")[0].getAttribute("aria-expanded")).toBe("true");
    el.querySelector<HTMLButtonElement>(".ui-egq__btn")!.click();
    expect(opened).toEqual(["words"]);
    await act(async () => rerender(2));
    await settle();
    expect(el.browsable).toBe(false);
    expect(el.querySelector("h3")!.textContent).toBe("Engagement quality");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-engagement-quality scope="Mixed" shared-with="your lead" .trend=${TREND} .signals=${SIGNALS}></tc-engagement-quality>
        <tc-engagement-quality heading="Strong" browsable index="0.9" .signals=${[SIGNALS[0], SIGNALS[3]]}></tc-engagement-quality>
        <tc-engagement-quality look="clean" heading="Low" browsable shared-with="your lead" index="0.3" .trend=${TREND} .signals=${SIGNALS}></tc-engagement-quality>
        <tc-engagement-quality look="clean" heading="Empty"></tc-engagement-quality>
      </div>`);
      for (const t of wrap.querySelectorAll<HTMLButtonElement>(".ui-egq__toggle")) t.click();
      await settle();
      await wait(400);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
