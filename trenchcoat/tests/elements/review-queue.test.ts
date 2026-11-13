/*
 * <tc-review-queue> in real browsers: the item and its criteria as radio groups, the single-key shortcuts (and that
 * they stay out of the note), submitting with its check, the suggested verdict, J/K, skip, undo, the end screen,
 * the keys dialog, controlled use, the wrapper, axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/review-queue";
import { suggestVerdict, REVIEW_CRITERIA, type ReviewQueueGrade, type ReviewQueueItem, type ReviewQueueResult, type TcReviewQueue } from "../../src/elements/review-queue";
import { ReviewQueue } from "../../src/elements/react/review-queue";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: ReviewQueueItem[] = [
  { id: "r1", source: "Live chat · 12 Nov", input: "Do I need an itemised receipt for a €30 dinner?", output: "Yes – over €25 needs one.", reference: "Itemised above €25 (6.2)." },
  { id: "r2", input: "Hotel cap in Geneva?", output: "CHF 180 a night." },
  { id: "r3", input: "Claim deadline?", output: "60 days." },
];
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const card = (el: Element) => el.querySelector<HTMLElement>(".ui-rvq__card")!;
const group = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-criterion="${id}"]`)!;
const radios = (el: Element, id: string) => [...group(el, id).querySelectorAll<HTMLButtonElement>('[role="radio"]')];
const status = (el: Element) => text(el.querySelector(':scope > [role="status"]'));

async function queue(extra: Partial<TcReviewQueue> = {}) {
  const el = await fixture<TcReviewQueue>(html`<tc-review-queue .items=${ITEMS}></tc-review-queue>`);
  Object.assign(el, extra);
  await settle();
  return el;
}

describe("tc-review-queue", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is the root; progress, the item with its reference, a radio group per criterion`, async () => {
      const el = await fixture<TcReviewQueue>(html`<tc-review-queue look=${look} .items=${ITEMS}></tc-review-queue>`);
      expect(el.dataset.ui).toBe("rvq");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Review queue");
      expect(text(el.querySelector(".ui-rvq__progress-text"))).toBe("0 of 3");
      const bar = el.querySelector('[role="progressbar"]')!;
      expect([bar.getAttribute("aria-valuenow"), bar.getAttribute("aria-valuemax")]).toEqual(["0", "3"]);
      expect(text(el.querySelector(".ui-rvq__pos"))).toBe("Item 1 of 3");
      expect(text(el.querySelector(".ui-rvq__source"))).toBe("Live chat · 12 Nov");
      expect([...el.querySelectorAll(".ui-rvq__block")].map((b) => b.getAttribute("aria-label"))).toEqual(["Input", "Output", "Reference"]);
      const groups = [...el.querySelectorAll(".ui-rvq__crits [role='radiogroup']")];
      expect(groups.map((g) => document.getElementById(g.getAttribute("aria-labelledby")!)!.textContent)).toEqual(["Correct", "Grounded", "Helpful"]);
      expect(radios(el, "correct").map((r) => text(r))).toEqual(["Pass", "Fail"]);
      expect(radios(el, "helpful").map((r) => text(r))).toEqual(["1", "2", "3", "4", "5"]);
      expect(radios(el, "helpful").map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1]);
      expect(card(el).getAttribute("role")).toBe("group");
      expect(text(document.getElementById(card(el).getAttribute("aria-describedby")!))).toMatch(/^Shortcuts: P or F/);
    });
  }

  test("keys: P / F / digits grade the next criterion without a grade; the verdict is suggested; Enter submits and moves on", async () => {
    const el = await queue();
    const grades: ReviewQueueGrade[] = [];
    el.addEventListener("tc-grade", (e) => grades.push((e as CustomEvent<ReviewQueueGrade>).detail));
    card(el).focus();
    key(card(el), "p");
    await settle();
    expect(radios(el, "correct")[0].getAttribute("aria-checked")).toBe("true");
    expect(status(el)).toBe("Correct: Pass");
    key(card(el), "F");
    key(card(el), "9");
    key(card(el), "2");
    await settle();
    expect(el.querySelector('[data-verdict] [aria-checked="true"]')!.textContent!.trim()).toBe("Fail");
    expect(text(el.querySelector(".ui-rvq__verdict .ui-rvq__label"))).toBe("Verdict · suggested");
    // V then P overrides the suggestion
    key(card(el), "v");
    key(card(el), "p");
    await settle();
    expect(text(el.querySelector(".ui-rvq__verdict .ui-rvq__label"))).toBe("Verdict");
    key(card(el), "Enter");
    await settle();
    expect(grades).toEqual([{ id: "r1", grades: { correct: "pass", grounded: "fail", helpful: 2 }, verdict: "pass", note: "" }]);
    expect(el.results.r1).toEqual({ status: "graded", grades: { correct: "pass", grounded: "fail", helpful: 2 }, verdict: "pass", note: "" });
    expect(el.index).toBe(1);
    expect(text(el.querySelector(".ui-rvq__progress-text"))).toBe("1 of 3");
    expect(status(el)).toBe("Submitted, passed. 1 of 3 graded");
    expect(document.activeElement).toBe(radios(el, "correct")[0]);
    // The new item starts clean
    expect(el.querySelectorAll('.ui-rvq__crits [aria-checked="true"]')).toHaveLength(0);
  });

  test("in a criterion, keys act on it and focus moves to the next; arrows move within it", async () => {
    const el = await queue();
    radios(el, "grounded")[0].focus();
    key(document.activeElement!, "f");
    await settle();
    expect(radios(el, "grounded")[1].getAttribute("aria-checked")).toBe("true");
    expect(el.querySelector('[data-criterion="correct"] [aria-checked="true"]')).toBeNull();
    expect(document.activeElement).toBe(radios(el, "helpful")[0]);
    key(document.activeElement!, "ArrowRight");
    await settle();
    expect(radios(el, "helpful")[0].getAttribute("aria-checked")).toBe("true");
    key(document.activeElement!, "End");
    await settle();
    expect(radios(el, "helpful")[4].getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(radios(el, "helpful")[4]);
  });

  test("shortcuts stay out of the note; Escape leaves it; Ctrl/⌘+Enter submits from it", async () => {
    const el = await queue();
    const note = el.querySelector<HTMLTextAreaElement>(".ui-rvq__note")!;
    note.focus();
    key(note, "p");
    key(note, "j");
    await settle();
    expect(el.querySelectorAll('[aria-checked="true"]')).toHaveLength(0);
    expect(el.index).toBe(0);
    key(note, "Escape");
    await settle();
    expect(document.activeElement).toBe(card(el));
    key(card(el), "n");
    expect(document.activeElement).toBe(note);
    key(note, "Enter", { ctrlKey: true, metaKey: true });
    await settle();
    // Nothing graded yet: the check stops it
    expect(el.results).toEqual({});
  });

  test("submitting with grades missing: no event, the group is invalid and focused, the status says what to do", async () => {
    const el = await queue();
    let fired = 0;
    el.addEventListener("tc-grade", () => fired++);
    radios(el, "correct")[0].click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-rvq__submit")!.click();
    await settle();
    expect(fired).toBe(0);
    expect(group(el, "grounded").getAttribute("aria-invalid")).toBe("true");
    expect(text(document.getElementById(group(el, "grounded").getAttribute("aria-describedby")!.split(" ")[1])!)).toBe("Pick a grade");
    expect(document.activeElement).toBe(radios(el, "grounded")[0]);
    expect(status(el)).toBe("Grade Grounded before submitting");
    radios(el, "grounded")[0].click();
    await settle();
    expect(group(el, "grounded").hasAttribute("aria-invalid")).toBe(false);
  });

  test("a prevented tc-grade keeps the item open and ungraded", async () => {
    const el = await queue();
    el.addEventListener("tc-grade", (e) => e.preventDefault());
    for (const [c, i] of [["correct", 0], ["grounded", 0], ["helpful", 3]] as const) radios(el, c)[i].click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-rvq__submit")!.click();
    await settle();
    expect(el.index).toBe(0);
    expect(el.results).toEqual({});
  });

  test("J / K move between items, S skips, U undoes the last submit and brings its grades back", async () => {
    const el = await queue();
    const events: string[] = [];
    for (const t of ["tc-index-change", "tc-skip", "tc-undo", "tc-results-change"]) el.addEventListener(t, () => events.push(t));
    key(card(el), "j");
    await settle();
    expect(el.index).toBe(1);
    expect(status(el)).toBe("Item 2 of 3");
    key(card(el), "k");
    key(card(el), "k");
    await settle();
    expect(el.index).toBe(0);
    key(card(el), "s");
    await settle();
    expect(el.results).toEqual({ r1: { status: "skipped" } });
    expect(el.index).toBe(1);
    expect(text(el.querySelector(".ui-rvq__progress-text"))).toBe("0 of 3 · 1 skipped");
    for (const [c, i] of [["correct", 0], ["grounded", 0], ["helpful", 4]] as const) radios(el, c)[i].click();
    const note = el.querySelector<HTMLTextAreaElement>(".ui-rvq__note")!;
    note.value = "Good";
    note.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-rvq__submit")!.click();
    await settle();
    expect(el.index).toBe(2);
    key(card(el), "u");
    await settle();
    expect(el.index).toBe(1);
    expect(el.results.r2).toBeUndefined();
    expect(radios(el, "helpful")[4].getAttribute("aria-checked")).toBe("true");
    expect(el.querySelector<HTMLTextAreaElement>(".ui-rvq__note")!.value).toBe("Good");
    expect(status(el)).toBe("Undid the grade for item 2");
    key(card(el), "u");
    await settle();
    expect(status(el)).toBe("Nothing to undo");
    expect(events).toEqual(["tc-index-change", "tc-index-change", "tc-skip", "tc-results-change", "tc-index-change", "tc-results-change", "tc-index-change", "tc-undo", "tc-results-change", "tc-index-change"]);
  });

  test("the end: every item done shows the summary; Review skipped goes back to the skipped one", async () => {
    const el = await queue({
      results: {
        r1: { status: "graded", grades: { correct: "pass", grounded: "pass", helpful: 5 }, verdict: "pass", note: "" },
        r3: { status: "graded", grades: { correct: "fail", grounded: "pass", helpful: 2 }, verdict: "fail", note: "" },
      },
      index: 1,
    });
    key(card(el), "s");
    await settle();
    expect(text(el.querySelector(".ui-rvq__done-title"))).toBe("All 3 reviewed");
    expect(text(el.querySelector(".ui-rvq__done-sub"))).toBe("2 graded · 1 skipped");
    expect(document.activeElement).toBe(el.querySelector(".ui-rvq__again"));
    el.querySelector<HTMLButtonElement>(".ui-rvq__again")!.click();
    await settle();
    expect(text(el.querySelector(".ui-rvq__pos"))).toBe("Item 2 of 3 · skipped");
    for (const [c, i] of [["correct", 0], ["grounded", 0], ["helpful", 2]] as const) radios(el, c)[i].click();
    await settle();
    key(card(el), "Enter");
    await settle();
    expect(text(el.querySelector(".ui-rvq__done-sub"))).toBe("3 graded");
  });

  test("? opens the keys dialog; Escape closes it and focus comes back", async () => {
    const el = await queue();
    card(el).focus();
    key(card(el), "?");
    await settle();
    const dialog = el.querySelector<HTMLDialogElement>(".ui-rvq__dialog")!;
    expect(dialog.open).toBe(true);
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)!.textContent).toBe("Keyboard shortcuts");
    expect(dialog.querySelectorAll("tbody tr").length).toBeGreaterThan(5);
    expect(document.activeElement).toBe(el.querySelector(".ui-rvq__dialog-close"));
    // Keys inside the dialog don't grade
    key(dialog, "p");
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(card(el));
    expect(el.querySelectorAll('.ui-rvq__crits [aria-checked="true"]')).toHaveLength(0);
  });

  test("no-shortcuts turns the keys off; suggestVerdict; an empty queue", async () => {
    const el = await queue({ noShortcuts: true });
    key(card(el), "p");
    await settle();
    expect(el.querySelectorAll('[aria-checked="true"]')).toHaveLength(0);
    expect(suggestVerdict(REVIEW_CRITERIA, { correct: "pass", grounded: "pass", helpful: 3 })).toBe("pass");
    expect(suggestVerdict(REVIEW_CRITERIA, { correct: "pass", grounded: "pass", helpful: 2 })).toBe("fail");
    expect(suggestVerdict(REVIEW_CRITERIA, { correct: "pass" })).toBeNull();
    const empty = await fixture<TcReviewQueue>(html`<tc-review-queue></tc-review-queue>`);
    expect(text(empty.querySelector(".ui-rvq__empty"))).toBe("Nothing to review.");
  });

  test("styles: reduced motion turns motion off; no endless loop; no theme-scoped colours", async () => {
    await fixture(html`<tc-review-queue></tc-review-queue>`);
    const css = (customElements.get("tc-review-queue") as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    expect(css).not.toMatch(/infinite/);
    expect(css).not.toMatch(/\.dark\b|data-tc-theme="dark"/);
  });

  test("React wrapper: uncontrolled results and index survive a re-render; controlled index stays until the parent moves it; onGrade false keeps it open", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let keep = true;
    let bump = () => {};
    let controlled: number | undefined = undefined;
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ReviewQueue, {
        title: "Grade these",
        items: ITEMS,
        index: controlled,
        onIndexChange: (i: number) => seen.push(["index", i]),
        onResultsChange: (r: Record<string, ReviewQueueResult>) => seen.push(["results", Object.keys(r)]),
        onGrade: (g: ReviewQueueGrade) => {
          seen.push(["grade", g.id]);
          return keep ? false : undefined;
        },
        "data-n": n,
      } as React.ComponentProps<typeof ReviewQueue>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-review-queue")!;
    expect(el.heading).toBe("Grade these");
    for (const [c, i] of [["correct", 0], ["grounded", 0], ["helpful", 4]] as const) radios(el, c)[i].click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-rvq__submit")!.click();
    await settle();
    expect(el.index).toBe(0);
    keep = false;
    el.querySelector<HTMLButtonElement>(".ui-rvq__submit")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.index).toBe(1);
    expect(Object.keys(el.results)).toEqual(["r1"]);
    controlled = 2;
    await act(async () => bump());
    await settle();
    key(card(el), "k");
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.index).toBe(2);
    expect(seen).toEqual([["grade", "r1"], ["grade", "r1"], ["results", ["r1"]], ["index", 1], ["index", 1]]);
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme – mid-item with an error, narrow, done, and the keys dialog", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <div style="width: 720px"><tc-review-queue .items=${ITEMS} .results=${{ r2: { status: "skipped" } }}></tc-review-queue></div>
        <div style="width: 360px"><tc-review-queue look="clean" .items=${ITEMS}></tc-review-queue></div>
        <div style="width: 480px"><tc-review-queue look="clean" .items=${ITEMS.slice(0, 1)} .results=${{ r1: { status: "skipped" } }}></tc-review-queue></div>
      </div>`);
      const first = wrap.querySelector<TcReviewQueue>("tc-review-queue")!;
      radios(first, "correct")[1].click();
      await settle();
      first.querySelector<HTMLButtonElement>(".ui-rvq__submit")!.click();
      await settle();
      await finish(wrap);
      let result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      first.querySelector<HTMLButtonElement>(".ui-rvq__link")!.click();
      await settle();
      await finish(wrap);
      result = await axe.run(first.querySelector(".ui-rvq__dialog")!, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} dialog ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
