/*
 * <tc-eval-criteria-editor> in real browsers: the rows and their disclosures, editing in place, weights as shares,
 * add / move / remove (buttons and Alt+arrows), the answer kinds, examples, the checks and Try, the judge prompt and
 * Copy, the pure helpers, controlled use, the wrapper, axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/eval-criteria-editor";
import { criteriaProblems, judgePrompt, weightShares, type EvalCriteriaTry, type JudgeCriterion, type TcEvalCriteriaEditor } from "../../src/elements/eval-criteria-editor";
import { EvalCriteriaEditor } from "../../src/elements/react/eval-criteria-editor";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const CRITERIA: JudgeCriterion[] = [
  { id: "correct", name: "Correct", question: "Is the policy stated correctly?", type: "pass-fail", weight: 3, examples: [{ output: "Geneva cap is CHF 180.", verdict: "FAIL", why: "it's CHF 240" }] },
  { id: "helpful", name: "Helpful", question: "How well does it answer?", type: "scale", scale: { min: 1, max: 5, anchors: { 1: "Not at all", 5: "Fully" } }, weight: 2 },
  { id: "tone", name: "Tone", question: "How does it sound?", type: "label", labels: ["plain", "too formal"], weight: 1 },
];
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const rows = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-ece__summary")];
const type = (input: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
};
const status = (el: Element) => text(el.querySelector(':scope > [role="status"]'));
const input = (el: Element, id: string, field: string) => el.querySelector<HTMLInputElement>(`[id$="-${id}-${field}"]`)!;

async function editor(criteria = CRITERIA) {
  return fixture<TcEvalCriteriaEditor>(html`<tc-eval-criteria-editor .criteria=${criteria}></tc-eval-criteria-editor>`);
}

describe("tc-eval-criteria-editor", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is the root; a row per criterion with its kind and share; the first open`, async () => {
      const el = await fixture<TcEvalCriteriaEditor>(html`<tc-eval-criteria-editor look=${look} .criteria=${CRITERIA}></tc-eval-criteria-editor>`);
      expect(el.dataset.ui).toBe("ece");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Judge criteria");
      expect(text(el.querySelector(".ui-ece__count"))).toBe("3 criteria");
      expect(rows(el).map((r) => text(r.querySelector(".ui-ece__name")))).toEqual(["Correct", "Helpful", "Tone"]);
      expect(rows(el).map((r) => text(r.querySelector(".ui-ece__type")))).toEqual(["Pass or fail", "Scale", "Label"]);
      expect([...el.querySelectorAll(".ui-ece__share-num")].map((s) => text(s))).toEqual(["50% of the score", "33% of the score", "17% of the score"]);
      expect(rows(el).map((r) => r.getAttribute("aria-expanded"))).toEqual(["true", "false", "false"]);
      const body = document.getElementById(rows(el)[0].getAttribute("aria-controls")!)!;
      expect(body.hidden).toBe(false);
      expect(body.getAttribute("role")).toBe("group");
      expect(el.querySelector<HTMLLabelElement>(`label[for="${input(el, "correct", "name").id}"]`)!.textContent).toBe("Name");
      expect(input(el, "correct", "name").value).toBe("Correct");
      expect(text(document.getElementById(rows(el)[0].getAttribute("aria-describedby")!))).toBe("Alt plus up or down arrow moves it");
    });
  }

  test("helpers: shares, problems in words, and the assembled prompt", () => {
    expect(weightShares(CRITERIA)).toEqual({ correct: 50, helpful: 33, tone: 17 });
    expect(weightShares([])).toEqual({});
    expect(criteriaProblems(CRITERIA)).toEqual([]);
    const bad: JudgeCriterion[] = [
      { id: "a", name: "Tone", question: "", type: "label", labels: ["plain"], weight: 1 },
      { id: "b", name: "tone", question: "Q", type: "scale", scale: { min: 5, max: 1 }, weight: 0 },
      { id: "c", name: " ", question: "Q", type: "pass-fail", weight: 1 },
    ];
    expect(criteriaProblems(bad).map((p) => `${p.id} ${p.field}: ${p.message}`)).toEqual([
      "a name: Another criterion has this name",
      "a question: Write the question the judge answers",
      "a labels: Add at least two labels",
      "b name: Another criterion has this name",
      "b scale: The top of the scale must be above the bottom",
      "b weight: Give it a weight above 0",
      "c name: Give it a name",
    ]);
    const prompt = judgePrompt(CRITERIA);
    expect(prompt).toContain("1. Correct (weight 50%) – Is the policy stated correctly? Answer PASS or FAIL.");
    expect(prompt).toContain('   Example: "Geneva cap is CHF 180." → FAIL, because it\'s CHF 240');
    expect(prompt).toContain("2. Helpful (weight 33%) – How well does it answer? Answer with a whole number from 1 to 5 (1 = Not at all, 5 = Fully).");
    expect(prompt).toContain("3. Tone (weight 17%) – How does it sound? Answer with one of: plain, too formal.");
    expect(prompt).toContain('"correct": "PASS" | "FAIL", "helpful": 1–5, "tone": "plain" | "too formal"');
  });

  test("editing in place fires tc-criteria-change; a weight moves the shares; prevented, nothing changes", async () => {
    const el = await editor();
    const changes: JudgeCriterion[][] = [];
    el.addEventListener("tc-criteria-change", (e) => changes.push((e as CustomEvent<{ criteria: JudgeCriterion[] }>).detail.criteria));
    type(input(el, "correct", "name"), "Accurate");
    await settle();
    expect(el.criteria[0].name).toBe("Accurate");
    expect(text(rows(el)[0].querySelector(".ui-ece__name"))).toBe("Accurate");
    type(input(el, "correct", "weight"), "1");
    await settle();
    expect(text(el.querySelector(".ui-ece__share-num"))).toBe("25% of the score");
    expect(text(document.getElementById(input(el, "correct", "weight").getAttribute("aria-describedby")!))).toBe("25% of the score");
    el.addEventListener("tc-criteria-change", (e) => e.preventDefault(), { once: true });
    type(input(el, "correct", "question"), "Changed?");
    await settle();
    expect(el.criteria[0].question).toBe("Is the policy stated correctly?");
    expect(changes).toHaveLength(3);
  });

  test("rows open and close; Add opens a new one with its name focused; Remove moves focus to the next row", async () => {
    const el = await editor();
    rows(el)[1].click();
    await settle();
    expect(rows(el).map((r) => r.getAttribute("aria-expanded"))).toEqual(["true", "true", "false"]);
    rows(el)[0].click();
    await settle();
    expect(rows(el)[0].getAttribute("aria-expanded")).toBe("false");
    el.querySelector<HTMLButtonElement>(".ui-ece__add")!.click();
    await settle();
    expect(el.criteria).toHaveLength(4);
    expect(el.criteria[3]).toMatchObject({ name: "", question: "", type: "pass-fail", weight: 1 });
    expect(rows(el)[3].getAttribute("aria-expanded")).toBe("true");
    expect(text(rows(el)[3].querySelector(".ui-ece__name"))).toBe("Untitled criterion");
    expect(document.activeElement).toBe(input(el, el.criteria[3].id, "name"));
    expect(status(el)).toBe("Criterion 4 added");
    const removeHelpful = [...el.querySelectorAll<HTMLButtonElement>(".ui-ece__remove")][1];
    expect(text(removeHelpful)).toBe("Remove Helpful");
    removeHelpful.click();
    await settle();
    expect(el.criteria.map((c) => c.id)).toEqual(["correct", "tone", el.criteria[2].id]);
    expect(document.activeElement).toBe(rows(el)[1]);
    expect(status(el)).toBe("Removed Helpful");
  });

  test("Move up / down and Alt+↑ / Alt+↓ reorder, keeping focus on the row and saying where it went", async () => {
    const el = await editor();
    const down = el.querySelectorAll<HTMLButtonElement>(".ui-ece__tools .ui-ece__icon-btn")[1];
    expect(text(down)).toBe("Move Correct down");
    expect(el.querySelectorAll<HTMLButtonElement>(".ui-ece__tools .ui-ece__icon-btn")[0].disabled).toBe(true);
    down.click();
    await settle();
    expect(el.criteria.map((c) => c.id)).toEqual(["helpful", "correct", "tone"]);
    expect(status(el)).toBe("Moved Correct to position 2 of 3");
    expect(document.activeElement).toBe(rows(el)[1]);
    key(rows(el)[1], "ArrowDown", { altKey: true });
    await settle();
    expect(el.criteria.map((c) => c.id)).toEqual(["helpful", "tone", "correct"]);
    expect(document.activeElement).toBe(rows(el)[2]);
    key(rows(el)[2], "ArrowDown", { altKey: true });
    await settle();
    expect(el.criteria.map((c) => c.id)).toEqual(["helpful", "tone", "correct"]);
    key(rows(el)[2], "ArrowUp", { altKey: true });
    await settle();
    expect(el.criteria.map((c) => c.id)).toEqual(["helpful", "correct", "tone"]);
    // Without Alt, arrows leave the order alone
    key(rows(el)[1], "ArrowUp");
    await settle();
    expect(el.criteria.map((c) => c.id)).toEqual(["helpful", "correct", "tone"]);
  });

  test("the answer kind: radios; Scale shows its ends and words, Label its labels; examples add and remove", async () => {
    const el = await editor([{ id: "x", name: "Clear", question: "Is it clear?", type: "pass-fail", weight: 1 }]);
    const radios = () => [...el.querySelectorAll<HTMLInputElement>('.ui-ece__types input[type="radio"]')];
    expect(radios().map((r) => r.parentElement!.textContent!.trim())).toEqual(["Pass or fail", "Scale", "Label"]);
    expect(radios()[0].checked).toBe(true);
    radios()[1].click();
    await settle();
    expect(el.criteria[0].type).toBe("scale");
    expect(el.criteria[0].scale).toEqual({ min: 1, max: 5, anchors: { 1: "Poor", 5: "Excellent" } });
    const min = input(el, "x", "scale");
    expect(el.querySelector<HTMLLabelElement>(`label[for="${min.id}"]`)!.textContent).toBe("From");
    type(min, "6");
    await settle();
    expect(min.getAttribute("aria-invalid")).toBe("true");
    expect(text(el.querySelector(".ui-ece__group .ui-ece__error"))).toBe("The top of the scale must be above the bottom");
    radios()[2].click();
    await settle();
    expect(el.criteria[0].type).toBe("label");
    const labels = input(el, "x", "labels");
    labels.value = "plain, formal ,, casual";
    labels.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.criteria[0].labels).toEqual(["plain", "formal", "casual"]);
    expect(text(document.getElementById(labels.getAttribute("aria-describedby")!.split(" ")[0])!)).toBe("Separate them with commas");
    el.querySelector<HTMLButtonElement>(".ui-ece__examples .ui-ece__link")!.click();
    await settle();
    expect(el.criteria[0].examples).toEqual([{ output: "", verdict: "", why: "" }]);
    expect(document.activeElement).toBe(el.querySelector(".ui-ece__ex textarea"));
    type(el.querySelector<HTMLTextAreaElement>(".ui-ece__ex textarea")!, "Short and plain.");
    await settle();
    expect(el.criteria[0].examples![0].output).toBe("Short and plain.");
    el.querySelector<HTMLButtonElement>(".ui-ece__ex .ui-ece__icon-btn")!.click();
    await settle();
    expect(el.criteria[0].examples).toEqual([]);
    expect(document.activeElement).toBe(el.querySelector(".ui-ece__examples .ui-ece__link"));
  });

  test("problems show once a field is left; Try with problems opens them, says how many and focuses the first; fixed, Try fires", async () => {
    const el = await editor([
      { id: "a", name: "Correct", question: "Right?", type: "pass-fail", weight: 1 },
      { id: "b", name: "", question: "", type: "pass-fail", weight: 1 },
    ]);
    const tried: EvalCriteriaTry[] = [];
    el.addEventListener("tc-try", (e) => tried.push((e as CustomEvent<EvalCriteriaTry>).detail));
    rows(el)[0].click();
    await settle();
    expect(el.querySelector(".ui-ece__error")).toBeNull();
    el.querySelector<HTMLButtonElement>(".ui-ece__try")!.click();
    await settle();
    expect(tried).toEqual([]);
    expect(status(el)).toBe("2 problems to fix before trying");
    expect(text(el.querySelector(".ui-ece__count"))).toBe("2 criteria · 2 to fix");
    expect(rows(el)[1].getAttribute("aria-expanded")).toBe("true");
    const name = input(el, "b", "name");
    expect(document.activeElement).toBe(name);
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(text(document.getElementById(name.getAttribute("aria-describedby")!))).toBe("Give it a name");
    type(name, "correct");
    await settle();
    expect(text(document.getElementById(name.getAttribute("aria-describedby")!))).toBe("Another criterion has this name");
    type(name, "Complete");
    type(input(el, "b", "question"), "Does it cover everything?");
    await settle();
    expect(el.querySelector(".ui-ece__error")).toBeNull();
    el.querySelector<HTMLButtonElement>(".ui-ece__try")!.click();
    await settle();
    expect(tried).toHaveLength(1);
    expect(tried[0].criteria.map((c) => c.name)).toEqual(["Correct", "Complete"]);
    expect(tried[0].prompt).toBe(judgePrompt(tried[0].criteria));
    // A field left empty shows its problem without Try
    const fresh = await editor([{ id: "z", name: "", question: "Q", type: "pass-fail", weight: 1 }]);
    input(fresh, "z", "name").focus();
    input(fresh, "z", "name").blur();
    await settle();
    expect(text(fresh.querySelector(".ui-ece__error"))).toBe("Give it a name");
  });

  test("the judge prompt is a disclosure with the assembled text and Copy; a prevented copy copies nothing", async () => {
    const el = await editor();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-ece__toggle")!;
    const panel = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(panel.hidden).toBe(true);
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    const pre = panel.querySelector("pre")!;
    expect(pre.textContent).toBe(judgePrompt(CRITERIA));
    expect(pre.tabIndex).toBe(0);
    let copied = "";
    el.addEventListener("tc-prompt-copy", (e) => {
      copied = (e as CustomEvent<{ prompt: string }>).detail.prompt;
      e.preventDefault();
    });
    panel.querySelector<HTMLButtonElement>(".ui-ece__link")!.click();
    await settle();
    expect(copied).toBe(judgePrompt(CRITERIA));
    expect(text(panel.querySelector(".ui-ece__link"))).toBe("Copy the judge prompt");
  });

  test("empty: a note, and Try asks for a criterion first", async () => {
    const el = await editor([]);
    expect(text(el.querySelector(".ui-ece__empty"))).toMatch(/^No criteria yet/);
    el.querySelector<HTMLButtonElement>(".ui-ece__try")!.click();
    await settle();
    expect(status(el)).toBe("Add a criterion first");
    expect(document.activeElement).toBe(el.querySelector(".ui-ece__add"));
  });

  test("styles: reduced motion turns motion off; no endless loop; no theme-scoped colours", async () => {
    await fixture(html`<tc-eval-criteria-editor></tc-eval-criteria-editor>`);
    const css = (customElements.get("tc-eval-criteria-editor") as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    expect(css).not.toMatch(/infinite/);
    expect(css).not.toMatch(/\.dark\b|data-tc-theme="dark"/);
  });

  test("React wrapper: uncontrolled criteria survive a re-render; controlled ones stay until the parent changes them; onTry", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    let controlled: JudgeCriterion[] | undefined = undefined;
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(EvalCriteriaEditor, {
        title: "Judge",
        criteria: controlled,
        defaultCriteria: CRITERIA,
        onCriteriaChange: (c: JudgeCriterion[]) => seen.push(c.map((x) => x.name).join(",")),
        onTry: (c: JudgeCriterion[]) => seen.push(`try ${c.length}`),
        "data-n": n,
      } as React.ComponentProps<typeof EvalCriteriaEditor>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-eval-criteria-editor")!;
    expect(el.heading).toBe("Judge");
    type(input(el, "correct", "name"), "Accurate");
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.criteria[0].name).toBe("Accurate");
    el.querySelector<HTMLButtonElement>(".ui-ece__try")!.click();
    controlled = CRITERIA;
    await act(async () => bump());
    await settle();
    type(input(el, "correct", "name"), "Precise");
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.criteria[0].name).toBe("Correct");
    expect(seen).toEqual(["Accurate,Helpful,Tone", "try 3", "Precise,Helpful,Tone"]);
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme – all open with problems and the prompt, narrow, and empty", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <div style="width: 640px"><tc-eval-criteria-editor .criteria=${[...CRITERIA, { id: "d", name: "", question: "", type: "scale", scale: { min: 3, max: 1 }, weight: 1 }]} .open=${["correct", "helpful", "tone", "d"]}></tc-eval-criteria-editor></div>
        <div style="width: 360px"><tc-eval-criteria-editor look="clean" .criteria=${CRITERIA} .open=${["helpful", "tone"]}></tc-eval-criteria-editor></div>
        <div style="width: 360px"><tc-eval-criteria-editor look="clean"></tc-eval-criteria-editor></div>
      </div>`);
      const first = wrap.querySelector<TcEvalCriteriaEditor>("tc-eval-criteria-editor")!;
      first.querySelector<HTMLButtonElement>(".ui-ece__try")!.click();
      first.querySelector<HTMLButtonElement>(".ui-ece__toggle")!.click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
