/*
 * <tc-evaluation-dataset-editor> in real browsers: the helpers, the split counts and filters, the grid and its window,
 * the case editor, the comparison, controlled use, the form, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/evaluation-dataset-editor";
import {
  compareEvaluationDatasets,
  evaluationDatasetFromJsonl,
  evaluationDatasetIssues,
  evaluationDatasetToJsonl,
  type EvaluationCase,
  type EvaluationDatasetValue,
  type EvaluationDatasetVersion,
  type TcEvaluationDatasetEditor,
} from "../../src/elements/evaluation-dataset-editor";
import { EvaluationDatasetEditor } from "../../src/elements/react/evaluation-dataset-editor";
import { cleanup, fixture, settle } from "./helpers";
import { expectReactFormReset } from "./form-reset";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const CASES: EvaluationCase[] = [
  { id: "a", input: "Where is my order?", expected: "Gives the tracking link", assertions: [{ id: "c1", type: "contains", value: "tracking" }], tags: ["shipping"], split: "train" },
  { id: "b", input: "Refund for a broken mug", expected: "Offers a refund", assertions: [], tags: ["refunds"], split: "train" },
  { id: "c", input: "Charged twice", assertions: [{ id: "c1", type: "rubric", value: "Apologises once" }], tags: ["billing"], split: "validation" },
  { id: "d", input: "Change my email", expected: "Points to Settings", assertions: [], tags: [], split: "test" },
];
const VALUE: EvaluationDatasetValue = { cases: CASES };
const V1: EvaluationDatasetVersion = { id: "v1", label: "v1", cases: [{ ...CASES[0], expected: "Old answer" }, CASES[1], { id: "z", input: "Gone case", assertions: [], tags: [], split: "test", expected: "x" }] };
const many = (n: number): EvaluationCase[] => Array.from({ length: n }, (_, i) => ({ id: `case-${i}`, input: `Question ${i}`, expected: "An answer", assertions: [], tags: i % 2 ? ["odd"] : [], split: ["train", "validation", "test"][i % 3] }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- detail types differ per event
const on = (el: Element, name: string, fn: (e: CustomEvent<any>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (value: EvaluationDatasetValue = VALUE, look: "standard" | "clean" = "standard") =>
  fixture<TcEvaluationDatasetEditor>(html`<tc-evaluation-dataset-editor style="width: 760px" look=${look} .value=${value}></tc-evaluation-dataset-editor>`);
const grid = (el: Element) => el.querySelector<HTMLElement>(".ui-eds__grid")!;
const key = (target: Element, k: string, o: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...o }));
const rows = (el: Element) => [...el.querySelectorAll(".ui-eds__rows .ui-eds__row")];
const rowText = (el: Element) => rows(el).map((r) => r.querySelector(".ui-eds__input-text")!.textContent);
const detail = (el: Element) => el.querySelector<HTMLElement>(".ui-eds__detail");
const edit = async (el: Element) => {
  detail(el)!.querySelector<HTMLButtonElement>(".ui-eds__mode")!.click();
  await settle();
};
const change = (input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("helpers", () => {
  test("issues: errors for no input, duplicates, empty and broken checks; warnings for no split and nothing checked", () => {
    const issues = evaluationDatasetIssues({
      cases: [
        { id: "x", input: " ", assertions: [{ id: "k", type: "contains", value: "" }], tags: [], split: "train" },
        { id: "x", input: "Hi", assertions: [{ id: "k", type: "schema", value: "{ nope" }], tags: [], split: "elsewhere" },
        { id: "y", input: "Hi", assertions: [], tags: [], split: "test" },
      ],
    });
    expect(issues.map((i) => [i.caseId, i.level, i.message])).toEqual([
      ["x", "error", "Another case has the same id"],
      ["x", "error", "Add an input"],
      ["x", "error", "Check 1 is empty"],
      ["x", "error", "Another case has the same id"],
      ["x", "error", "Check 1 isn't valid JSON"],
      ["x", "warning", "Pick a split"],
      ["y", "warning", "Nothing is checked – add an expected output or a check"],
    ]);
    expect(evaluationDatasetIssues(VALUE)).toEqual([]);
    // Splits and check types are data
    expect(evaluationDatasetIssues({ cases: [{ ...CASES[3], split: "dev" }] }, { splits: [{ id: "dev", label: "Dev" }] })).toEqual([]);
  });

  test("compare: added, edited (content, not identity) and removed", () => {
    const d = compareEvaluationDatasets(V1.cases, CASES);
    expect(d.added).toEqual(["c", "d"]);
    expect(d.edited).toEqual(["a"]);
    expect(d.removed.map((c) => c.id)).toEqual(["z"]);
    expect(compareEvaluationDatasets(CASES, CASES.map((c) => ({ ...c, tags: [...c.tags] })))).toEqual({ added: [], edited: [], removed: [] });
  });

  test("JSON Lines out and back; bad lines reported with their number", () => {
    const text = evaluationDatasetToJsonl(VALUE);
    expect(text.split("\n")).toHaveLength(4);
    expect(JSON.parse(text.split("\n")[0])).toEqual({ id: "a", input: "Where is my order?", expected: "Gives the tracking link", assertions: [{ type: "contains", value: "tracking" }], tags: ["shipping"], split: "train" });
    const back = evaluationDatasetFromJsonl(text);
    expect(back.errors).toEqual([]);
    expect(back.value.cases.map((c) => [c.id, c.input, c.expected, c.assertions.map((a) => a.type), c.split])).toEqual(CASES.map((c) => [c.id, c.input, c.expected, c.assertions.map((a) => a.type), c.split]));
    const bad = evaluationDatasetFromJsonl(['{"input":"ok"}', "", "{oops", '{"input":3}', "[1]", '{"input":"x","assertions":[{"type":"contains"}]}'].join("\n"));
    expect(bad.value.cases).toEqual([{ id: "line-1", input: "ok", assertions: [], tags: [], split: "" }]);
    expect(bad.errors).toEqual(["Line 3: not valid JSON", 'Line 4: "input" must be text', "Line 5: not an object", 'Line 6: each assertion needs a "type" and a "value"']);
  });
});

describe("tc-evaluation-dataset-editor", () => {
  test("the host is a group named by the heading, in either look; counts and the problem pill", async () => {
    const el = await mount();
    expect(el.dataset.ui).toBe("eds");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("group");
    expect(el.getAttribute("aria-label")).toBe("Evaluation set");
    expect(el.querySelector(".ui-eds__summary")!.textContent).toBe("4 cases");
    expect(el.querySelector(".ui-eds__status")).toBeNull();
    el.look = "clean";
    el.heading = "Support replies";
    el.description = "Billing and shipping";
    el.value = { cases: [...CASES, { id: "e", input: "", assertions: [], tags: [], split: "train" }] };
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.getAttribute("aria-label")).toBe("Support replies");
    expect(el.querySelector(".ui-eds__summary")!.textContent).toBe("5 cases · Billing and shipping");
    expect(el.querySelector(".ui-eds__status")!.textContent).toBe("1 problem");
    expect(el.problems.map((p) => p.message)).toEqual(["Add an input", "Nothing is checked – add an expected output or a check"]);
    const named = await fixture<TcEvaluationDatasetEditor>(html`<tc-evaluation-dataset-editor aria-label="Set 2"></tc-evaluation-dataset-editor>`);
    expect(named.getAttribute("aria-label")).toBe("Set 2");
    expect(named.querySelector(".ui-eds__empty")!.textContent).toBe("No cases yet – add one or import a file");
  });

  test("splits: the legend's counts and shares; the split filter is a radio group with arrows; search", async () => {
    const el = await mount();
    expect([...el.querySelectorAll(".ui-eds__split")].map((s) => s.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Train 2 , 50%", "Validation 1 , 25%", "Test 1 , 25%"]);
    const radios = [...el.querySelectorAll<HTMLButtonElement>(".ui-eds__show [role=radio]")];
    expect(radios.map((r) => [r.textContent!.replace(/\s+/g, " ").trim(), r.getAttribute("aria-checked"), r.tabIndex])).toEqual([
      ["All, 4 cases", "true", 0],
      ["Train, 2 cases", "false", -1],
      ["Validation, 1 case", "false", -1],
      ["Test, 1 case", "false", -1],
    ]);
    radios[0].focus();
    key(radios[0], "ArrowRight");
    await settle();
    expect(el.filter).toBe("train");
    expect(document.activeElement!.textContent).toContain("Train");
    expect(rowText(el)).toEqual(["Where is my order?", "Refund for a broken mug"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("2 cases");
    key(document.activeElement!, "ArrowLeft");
    key(el.querySelector(".ui-eds__show [aria-checked=true]")!, "ArrowLeft");
    await settle();
    expect(el.filter).toBe("test");
    el.querySelector<HTMLButtonElement>(".ui-eds__show [role=radio]")!.click();
    const search = el.querySelector<HTMLInputElement>(".ui-eds__search-input")!;
    search.value = "REFUND";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(rowText(el)).toEqual(["Refund for a broken mug"]);
    search.value = "billing";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(rowText(el)).toEqual(["Charged twice"]);
    search.value = "nothing like this";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-eds__empty")!.textContent).toBe("No cases match these filters");
  });

  test("grid: one tab stop, arrows, Home / End, Ctrl+End; Enter opens the case, Escape closes it", async () => {
    const el = await mount();
    const g = grid(el);
    expect(g.getAttribute("role")).toBe("grid");
    expect(g.tabIndex).toBe(0);
    expect(g.getAttribute("aria-rowcount")).toBe("5");
    const opens: (string | null)[] = [];
    on(el, "tc-open-change", (e) => opens.push(e.detail.open));
    g.focus();
    await settle();
    const active = () => document.getElementById(g.getAttribute("aria-activedescendant")!)!;
    expect(active().textContent).toContain("Where is my order?");
    key(g, "ArrowDown");
    key(g, "ArrowRight");
    await settle();
    expect(active().getAttribute("data-col")).toBe("1");
    expect(active().textContent).toBe("Expected");
    key(g, "End");
    await settle();
    expect(active().textContent).toBe("Train");
    key(g, "End", { ctrlKey: true });
    await settle();
    expect(active().textContent).toBe("Test");
    key(g, "Home");
    await settle();
    expect(active().textContent).toContain("Change my email");
    key(g, "Enter");
    await settle();
    expect(opens).toEqual(["d"]);
    expect(el.open).toBe("d");
    expect(detail(el)!.querySelector(".ui-eds__id")!.textContent).toBe("d");
    expect(el.querySelector(".ui-eds__row[data-open]")!.textContent).toContain("Change my email");
    key(g, "Escape");
    await settle();
    expect(el.open).toBeNull();
    expect(detail(el)).toBeNull();
    // Clicking a cell opens its case
    rows(el)[2].querySelector<HTMLElement>(".ui-eds__col-split")!.click();
    await settle();
    expect(el.open).toBe("c");
    // Escape inside the editor closes it and returns to the grid
    key(detail(el)!.querySelector(".ui-eds__read")!, "Escape");
    await settle();
    expect(el.open).toBeNull();
    expect(document.activeElement).toBe(g);
  });

  test("windowing: 5,000 cases render a window; the keyboard reaches the last case", async () => {
    const el = await fixture<TcEvaluationDatasetEditor>(html`<tc-evaluation-dataset-editor .value=${{ cases: many(5000) }} max-height="300"></tc-evaluation-dataset-editor>`);
    await settle();
    expect(rows(el).length).toBeGreaterThan(0);
    expect(rows(el).length).toBeLessThan(200);
    const g = grid(el);
    g.focus();
    key(g, "End", { ctrlKey: true });
    await settle();
    await settle();
    const active = document.getElementById(g.getAttribute("aria-activedescendant") ?? "");
    expect(active?.closest(".ui-eds__row")!.textContent).toContain("Question 4999");
    expect(rows(el).length).toBeLessThan(200);
    key(g, "PageUp");
    await settle();
    await settle();
    expect(document.getElementById(g.getAttribute("aria-activedescendant")!)!.closest(".ui-eds__row")!.textContent).toContain("Question 4989");
  });

  test("read view: the open case reads as a test case; Edit, Enter or F2 open the form, Done or Escape return", async () => {
    const el = await mount({ cases: [...CASES, { id: "s", input: "Refund JSON", expected: "A refund", assertions: [{ id: "c1", type: "schema", value: '{"type":"object","properties":{"refund_id":{},"amount":{}}}' }, { id: "c2", type: "equals", value: "" }], tags: ["refunds", "json", "api"], split: "test" }] });
    el.open = "s";
    await settle();
    const d = detail(el)!;
    expect(d.querySelector("textarea")).toBeNull();
    const read = d.querySelector<HTMLElement>(".ui-eds__read")!;
    expect(read.getAttribute("role")).toBe("group");
    expect(document.getElementById(read.getAttribute("aria-describedby")!)!.textContent).toBe("Enter or F2 to edit");
    expect(read.querySelector(".ui-eds__prompt")!.textContent).toBe("Refund JSON");
    expect([...read.querySelectorAll(".ui-eds__rule")].map((r) => r.textContent!.replace(/\s+/g, " ").trim())).toEqual([
      "output matches schema {refund_id, amount}",
      "Problem: output equals “”",
      "output resembles “A refund”",
    ]);
    expect([...read.querySelectorAll(".ui-eds__read-meta > *")].map((x) => x.textContent)).toEqual(["Test", "refunds", "json", "api"]);
    // Table: the first two tags as chips, then +1
    expect([...rows(el)[4].querySelectorAll(".ui-eds__col-tags .ui-eds__tag")].map((t) => t.textContent)).toEqual(["refunds", "json", "+1"]);
    // Rubric checks read as their criterion
    el.open = "c";
    await settle();
    expect(detail(el)!.querySelector(".ui-eds__rule")!.textContent!.replace(/\s+/g, " ").trim()).toBe("rubric: Apologises once");
    // Enter on the read view opens the form with the cursor in the input; Escape goes back and focuses Edit
    detail(el)!.querySelector<HTMLElement>(".ui-eds__read")!.focus();
    key(detail(el)!.querySelector(".ui-eds__read")!, "Enter");
    await settle();
    expect(el.editing).toBe(true);
    expect(document.activeElement).toBe(detail(el)!.querySelector('[data-field="input"]'));
    // Typing then Escape saves what was typed
    const input = detail(el)!.querySelector<HTMLTextAreaElement>('[data-field="input"]')!;
    input.value = "Charged twice for one order";
    key(input, "Escape");
    await settle();
    expect(el.editing).toBe(false);
    expect(el.value.cases[2].input).toBe("Charged twice for one order");
    expect(document.activeElement).toBe(detail(el)!.querySelector(".ui-eds__mode"));
    expect(el.open).toBe("c");
    // F2 from the read view; Done goes back
    key(detail(el)!.querySelector(".ui-eds__mode")!, "F2");
    await settle();
    expect(el.editing).toBe(true);
    [...detail(el)!.querySelectorAll<HTMLButtonElement>(".ui-eds__mode")].find((b) => b.textContent === "Done")!.click();
    await settle();
    expect(el.editing).toBe(false);
    // F2 in the grid opens the active case straight into its form; opening another case reads first
    grid(el).focus();
    await settle();
    key(grid(el), "F2");
    await settle();
    expect(el.open).toBe("a");
    expect(el.editing).toBe(true);
    expect(document.activeElement).toBe(detail(el)!.querySelector('[data-field="input"]'));
    grid(el).focus();
    key(grid(el), "ArrowDown");
    key(grid(el), "Enter");
    await settle();
    expect(el.open).toBe("b");
    expect(el.editing).toBe(false);
  });

  test("editor: input, expected, checks added, retyped and removed, tags and split – each a tc-value-change", async () => {
    const el = await mount();
    el.open = "b";
    await settle();
    await edit(el);
    const seen: EvaluationDatasetValue[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value));
    const d = detail(el)!;
    const caseB = () => el.value.cases.find((c) => c.id === "b")!;
    change(d.querySelector<HTMLTextAreaElement>('[data-field="input"]')!, "Refund for a cracked mug");
    change(d.querySelector<HTMLTextAreaElement>('[data-field="expected"]')!, "");
    await settle();
    expect(caseB().input).toBe("Refund for a cracked mug");
    expect("expected" in caseB()).toBe(false);
    // Nothing checked now: a warning on the case and its row
    expect(detail(el)!.querySelector(".ui-eds__issue")!.textContent).toContain("Nothing is checked");
    expect(rows(el)[1].querySelector(".ui-eds__flag")!.getAttribute("data-level")).toBe("warning");
    detail(el)!.querySelector<HTMLButtonElement>(".ui-eds__ghost")!.click();
    await settle();
    expect(caseB().assertions).toHaveLength(1);
    expect(document.activeElement).toBe(detail(el)!.querySelector(".ui-eds__value"));
    // An empty check is an error, described on its field
    const value = detail(el)!.querySelector<HTMLInputElement>(".ui-eds__value")!;
    expect(value.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(value.getAttribute("aria-describedby")!)!.textContent).toBe("Check 1 is empty");
    expect(el.querySelector(".ui-eds__status")!.textContent).toBe("1 problem");
    change(detail(el)!.querySelector<HTMLSelectElement>("select")!, "schema");
    await settle();
    expect(caseB().assertions[0].type).toBe("schema");
    expect(detail(el)!.querySelector("textarea.ui-eds__value")).toBeTruthy();
    change(detail(el)!.querySelector<HTMLTextAreaElement>("textarea.ui-eds__value")!, "{ broken");
    await settle();
    expect(detail(el)!.querySelector(".ui-eds__error")!.textContent).toBe("Check 1 isn't valid JSON");
    change(detail(el)!.querySelector<HTMLTextAreaElement>("textarea.ui-eds__value")!, '{"type":"object"}');
    await settle();
    expect(el.querySelector(".ui-eds__status")).toBeNull();
    detail(el)!.querySelector<HTMLButtonElement>('[aria-label="Remove check 1"]')!.click();
    await settle();
    expect(caseB().assertions).toEqual([]);
    // Tags: Enter adds, Backspace on empty removes the last, × removes one
    const tag = detail(el)!.querySelector<HTMLInputElement>(".ui-eds__chip-input")!;
    tag.value = "priority";
    key(tag, "Enter");
    await settle();
    expect(caseB().tags).toEqual(["refunds", "priority"]);
    key(detail(el)!.querySelector(".ui-eds__chip-input")!, "Backspace");
    await settle();
    expect(caseB().tags).toEqual(["refunds"]);
    detail(el)!.querySelector<HTMLButtonElement>('[aria-label="Remove tag refunds"]')!.click();
    await settle();
    expect(caseB().tags).toEqual([]);
    // Split: a radio group; arrows move and pick
    const split = detail(el)!.querySelector<HTMLButtonElement>('.ui-eds__radio[aria-checked="true"]')!;
    expect(split.textContent!.trim()).toBe("Train");
    split.focus();
    key(split, "ArrowRight");
    await settle();
    expect(caseB().split).toBe("validation");
    expect(document.activeElement!.textContent!.trim()).toBe("Validation");
    expect(seen.length).toBeGreaterThanOrEqual(10);
  });

  test("add and delete: a new case opens with its input focused; deleting returns focus to the grid", async () => {
    const el = await mount();
    const added: EvaluationDatasetValue[] = [];
    on(el, "tc-value-change", (e) => added.push(e.detail.value));
    [...el.querySelectorAll<HTMLButtonElement>(".ui-eds__btn")].find((b) => b.textContent!.includes("Add case"))!.click();
    await settle();
    await settle();
    const fresh = el.value.cases[4];
    expect(fresh).toEqual({ id: "case-1", input: "", assertions: [], tags: [], split: "train" });
    expect(el.open).toBe("case-1");
    expect(document.activeElement).toBe(detail(el)!.querySelector('[data-field="input"]'));
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Case added");
    detail(el)!.querySelector<HTMLButtonElement>(".ui-eds__danger")!.focus();
    detail(el)!.querySelector<HTMLButtonElement>(".ui-eds__danger")!.click();
    await settle();
    await settle();
    expect(el.value.cases.map((c) => c.id)).toEqual(["a", "b", "c", "d"]);
    expect(el.open).toBeNull();
    expect(document.activeElement).toBe(grid(el));
    // In a split filter, the new case goes in that split
    el.querySelectorAll<HTMLButtonElement>(".ui-eds__show [role=radio]")[3].click();
    await settle();
    [...el.querySelectorAll<HTMLButtonElement>(".ui-eds__btn")].find((b) => b.textContent!.includes("Add case"))!.click();
    await settle();
    expect(el.value.cases[4].split).toBe("test");
  });

  test("comparison: markers, deltas, changed only, removed cases restored; tc-compare-change", async () => {
    const el = await fixture<TcEvaluationDatasetEditor>(html`<tc-evaluation-dataset-editor .value=${VALUE} .versions=${[V1]}></tc-evaluation-dataset-editor>`);
    expect(el.querySelector(".ui-eds__change")).toBeNull();
    expect(el.comparison).toBeNull();
    const picked: string[] = [];
    on(el, "tc-compare-change", (e) => picked.push(e.detail.compare));
    change(el.querySelector<HTMLSelectElement>(".ui-eds__compare select")!, "v1");
    await settle();
    await settle();
    expect(picked).toEqual(["v1"]);
    expect(el.compare).toBe("v1");
    expect(el.comparison!.added).toEqual(["c", "d"]);
    expect(rows(el).map((r) => r.querySelector(".ui-eds__change")?.textContent ?? "")).toEqual(["Edited", "", "New", "New"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Compared with v1: 2 new, 1 edited, 1 removed");
    // Deltas against v1: train 2 (was 2), validation 1 (was 0), test 1 (was 1)
    expect([...el.querySelectorAll(".ui-eds__delta")].map((d) => d.textContent!.replace(/\s+/g, " ").trim())).toEqual([", +1 since v1"]);
    const changed = [...el.querySelectorAll<HTMLButtonElement>(".ui-eds__toggle")].find((b) => b.hasAttribute("aria-pressed"))!;
    changed.click();
    await settle();
    expect(changed.getAttribute("aria-pressed")).toBe("true");
    expect(rowText(el)).toEqual(["Where is my order?", "Charged twice", "Change my email"]);
    const removed = el.querySelector<HTMLButtonElement>(".ui-eds__toggle[aria-expanded]")!;
    expect(removed.textContent!.trim()).toBe("1 removed case");
    removed.click();
    await settle();
    expect(document.getElementById(removed.getAttribute("aria-controls")!)!.textContent).toContain("Gone case");
    el.querySelector<HTMLButtonElement>('[aria-label="Restore “Gone case”"]')!.click();
    await settle();
    expect(el.value.cases.map((c) => c.id)).toEqual(["a", "b", "c", "d", "z"]);
    expect(el.querySelector(".ui-eds__toggle[aria-expanded]")).toBeNull();
    // Back to no comparison
    change(el.querySelector<HTMLSelectElement>(".ui-eds__compare select")!, "");
    await settle();
    expect(el.querySelector(".ui-eds__change")).toBeNull();
    expect(rows(el)).toHaveLength(5);
  });

  test("controlled: preventDefault keeps the value, the open case and the comparison", async () => {
    const el = await fixture<TcEvaluationDatasetEditor>(html`<tc-evaluation-dataset-editor .value=${VALUE} .versions=${[V1]}></tc-evaluation-dataset-editor>`);
    for (const name of ["tc-value-change", "tc-open-change", "tc-compare-change"]) on(el, name, (e) => e.preventDefault());
    rows(el)[0].querySelector<HTMLElement>(".ui-eds__case")!.click();
    await settle();
    expect(el.open).toBeNull();
    change(el.querySelector<HTMLSelectElement>(".ui-eds__compare select")!, "v1");
    await settle();
    expect(el.compare).toBe("");
    expect(el.querySelector<HTMLSelectElement>(".ui-eds__compare select")!.value).toBe("");
    el.open = "a";
    await settle();
    await edit(el);
    change(detail(el)!.querySelector<HTMLTextAreaElement>('[data-field="input"]')!, "Changed");
    await settle();
    expect(el.value).toBe(VALUE);
    expect(detail(el)!.querySelector<HTMLTextAreaElement>('[data-field="input"]')!.value).toBe("Where is my order?");
  });

  test("import and export are events; nothing is read or written by the element", async () => {
    const el = await mount();
    const imports = vi.fn();
    const exports: { value: EvaluationDatasetValue; jsonl: string }[] = [];
    on(el, "tc-import", imports);
    on(el, "tc-export", (e) => exports.push(e.detail));
    const btn = (label: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-eds__btn")].find((b) => b.textContent!.includes(label))!;
    btn("Import").click();
    btn("Export").click();
    expect(imports).toHaveBeenCalledTimes(1);
    expect(exports[0].value).toBe(VALUE);
    expect(exports[0].jsonl).toBe(evaluationDatasetToJsonl(VALUE));
    const empty = await mount({ cases: [] });
    expect([...empty.querySelectorAll<HTMLButtonElement>(".ui-eds__btn")].find((b) => b.textContent!.includes("Export"))!.disabled).toBe(true);
  });

  test("form: JSON value, invalid with a broken case, reset, disabled fieldset", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><fieldset><tc-evaluation-dataset-editor name="set" .value=${VALUE}></tc-evaluation-dataset-editor></fieldset></form>`);
    const el = form.querySelector<TcEvaluationDatasetEditor>("tc-evaluation-dataset-editor")!;
    expect(JSON.parse(new FormData(form).get("set") as string)).toEqual(VALUE);
    expect(form.checkValidity()).toBe(true);
    el.open = "a";
    await settle();
    await edit(el);
    change(detail(el)!.querySelector<HTMLTextAreaElement>('[data-field="input"]')!, "");
    await settle();
    expect(form.checkValidity()).toBe(false);
    form.reset();
    await settle();
    expect(el.value).toEqual(VALUE);
    expect(form.checkValidity()).toBe(true);
    form.querySelector("fieldset")!.disabled = true;
    await settle();
    await settle();
    expect(el.hasAttribute("data-disabled")).toBe(true);
    expect(new FormData(form).get("set")).toBeNull();
    // Disabled: back to the read view, and Edit is off
    expect(detail(el)!.querySelector("textarea")).toBeNull();
    expect(detail(el)!.querySelector<HTMLButtonElement>(".ui-eds__mode")!.disabled).toBe(true);
    expect([...el.querySelectorAll<HTMLButtonElement>(".ui-eds__btn")].find((b) => b.textContent!.includes("Add case"))!.disabled).toBe(true);
  });

  test("form reset through React: the baseline is the value React passed; reset goes through onChange", async () => {
    await expectReactFormReset(EvaluationDatasetEditor, "tc-evaluation-dataset-editor", VALUE, { cases: CASES.slice(1) });
  });

  test("React wrapper: uncontrolled value survives a parent re-render; controlled stays with the app; callbacks", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    const onExport = vi.fn();
    const onImport = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(EvaluationDatasetEditor, { title: "Support replies", defaultValue: VALUE, onChange, onOpenChange, onExport, onImport, versions: [V1], defaultCompare: "v1" });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcEvaluationDatasetEditor>("tc-evaluation-dataset-editor")!;
    expect(el.heading).toBe("Support replies");
    expect(el.compare).toBe("v1");
    await act(async () => rows(el)[1].querySelector<HTMLElement>(".ui-eds__case")!.click());
    await settle();
    expect(onOpenChange).toHaveBeenCalledWith("b");
    await act(async () => edit(el));
    await act(async () => change(detail(el)!.querySelector<HTMLTextAreaElement>('[data-field="input"]')!, "Edited input"));
    await settle();
    expect(onChange).toHaveBeenCalledTimes(1);
    await act(async () => rerender());
    await settle();
    expect(el.value.cases[1].input).toBe("Edited input");
    expect(el.open).toBe("b");
    await act(async () => [...el.querySelectorAll<HTMLButtonElement>(".ui-eds__btn")].find((b) => b.textContent!.includes("Export"))!.click());
    await act(async () => [...el.querySelectorAll<HTMLButtonElement>(".ui-eds__btn")].find((b) => b.textContent!.includes("Import"))!.click());
    expect(onExport).toHaveBeenCalledWith(el.value, evaluationDatasetToJsonl(el.value));
    expect(onImport).toHaveBeenCalledTimes(1);
    await act(async () => root.render(React.createElement(EvaluationDatasetEditor, { value: VALUE, onChange, open: null, onOpenChange })));
    await settle();
    const ctl = host.querySelector<TcEvaluationDatasetEditor>("tc-evaluation-dataset-editor")!;
    await act(async () => rows(ctl)[0].querySelector<HTMLElement>(".ui-eds__case")!.click());
    await settle();
    expect(onOpenChange).toHaveBeenLastCalledWith("a");
    expect(ctl.open).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const broken: EvaluationDatasetValue = { cases: [...CASES, { id: "e", input: "", assertions: [{ id: "k", type: "schema", value: "{" }], tags: ["x"], split: "nowhere" }] };
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <tc-evaluation-dataset-editor .value=${broken} .versions=${[V1]} compare="v1" .open=${"e"} description="Support"></tc-evaluation-dataset-editor>
        <tc-evaluation-dataset-editor look="clean" heading="Clean" .value=${VALUE} .versions=${[V1]} compare="v1" .open=${"a"}></tc-evaluation-dataset-editor>
        <tc-evaluation-dataset-editor look="clean" heading="Empty"></tc-evaluation-dataset-editor>
      </div>`);
      await settle();
      wrap.querySelector<HTMLButtonElement>(".ui-eds__toggle[aria-expanded]")!.click();
      // One case in its read view, one in its form
      wrap.querySelectorAll<HTMLButtonElement>(".ui-eds__mode")[1].click();
      grid(wrap).focus();
      await settle();
      for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns animation and transitions off", () => {
    const css = (customElements.get("tc-evaluation-dataset-editor") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion[^{]*\{\s*\[data-ui="eds"\] \*[^{]*\{ animation: none !important; transition: none !important; \}/);
  });
});
