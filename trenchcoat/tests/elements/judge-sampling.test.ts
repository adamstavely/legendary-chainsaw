/*
 * <tc-judge-sampling> in real browsers: the estimate maths, the stepped sliders and their words, the rules' switches,
 * the model and budget, the over-budget warning and its announcement, prevented changes, the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/judge-sampling";
import type { JudgeSamplingChange, JudgeSamplingValue, TcJudgeSampling } from "../../src/elements/judge-sampling";
import { JUDGE_RATES, judgeEstimate, judgeRateStop } from "../../src/elements/judge-sampling";
import { JudgeSampling } from "../../src/elements/react/judge-sampling";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SEGMENTS = [
  { id: "intranet", label: "Intranet widget", chatsPerDay: 8000 },
  { id: "email", label: "Email replies", chatsPerDay: 2000 },
];
const RULES = [
  { id: "thumbs", label: "Thumbs-down", description: "Every chat someone rated badly", chatsPerDay: 100 },
  { id: "new-prompt", label: "New prompt version", chatsPerDay: 1000 },
];
const MODELS = [
  { id: "small", label: "Small judge", costPerChat: 0.002 },
  { id: "large", label: "Large judge", costPerChat: 0.02 },
];
const VALUE: JudgeSamplingValue = { rates: { intranet: 0.05, email: 0.1 }, include: { thumbs: true, "new-prompt": false }, model: "small", budget: 100 };

const range = (el: Element, id: string) => el.querySelector<HTMLInputElement>(`[data-segment="${id}"] input[type="range"]`)!;
const stat = (el: Element, name: string) => el.querySelector(`[data-stat="${name}"]`)!.textContent!.trim();
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const slide = (input: HTMLInputElement, stop: number) => {
  input.value = String(stop);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const make = (look: "standard" | "clean" = "standard", value = VALUE) =>
  fixture<TcJudgeSampling>(
    html`<tc-judge-sampling look=${look} locale="en-US" currency="USD" .segments=${SEGMENTS} .includeRules=${RULES} .models=${MODELS} .value=${value}></tc-judge-sampling>`,
  );

describe("tc-judge-sampling", () => {
  test("judgeEstimate: sample plus the always-included chats it missed, cost, what it can see, the budget", () => {
    const e = judgeEstimate(VALUE, { segments: SEGMENTS, includeRules: RULES, models: MODELS });
    // 400 + 200 sampled = 600 of 10,000 (6%); thumbs-down adds 100 × 94%
    expect(e.perDay).toBeCloseTo(694);
    expect(e.monthlyCost).toBeCloseTo(694 * 30 * 0.002);
    expect(e.dailyDrop).toBeCloseTo(2.8 / Math.sqrt(694));
    expect(e.within).toBe("day");
    expect(e.overBudget).toBe(false);
    expect(judgeEstimate({ ...VALUE, rates: { intranet: 0.001, email: 0.001 }, include: {} }, { segments: SEGMENTS, models: MODELS }).within).toBe("month");
    expect(judgeEstimate({ ...VALUE, rates: {}, include: {} }, { segments: SEGMENTS, models: MODELS }).within).toBe("");
    expect(judgeEstimate({ ...VALUE, model: "large" }, { segments: SEGMENTS, includeRules: RULES, models: MODELS }).overBudget).toBe(true);
    expect(judgeRateStop(0.05)).toBe(5);
    expect(judgeRateStop(0.04)).toBe(5);
    expect(JUDGE_RATES[0]).toBe(0.001);
    expect(JUDGE_RATES[JUDGE_RATES.length - 1]).toBe(1);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: segments, rules, model and budget, with the estimates in words`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("jsm");
      expect(el.dataset.look).toBe(look);
      const r = range(el, "intranet");
      expect(r.labels![0].textContent).toBe("Intranet widget");
      expect(r.value).toBe("5");
      expect(r.getAttribute("aria-valuetext")).toBe("5%, about 400 chats a day");
      expect(document.getElementById(r.getAttribute("aria-describedby")!)!.textContent).toBe("8,000 chats a day · about 400 judged");
      const sw = el.querySelector<HTMLInputElement>('input[role="switch"]')!;
      expect(sw.checked).toBe(true);
      expect(sw.labels![0].textContent).toBe("Thumbs-down");
      expect([...el.querySelectorAll("select option")].map((o) => o.textContent)).toEqual(["Small judge · $0.002 a chat", "Large judge · $0.02 a chat"]);
      expect(stat(el, "per-day")).toBe("694");
      expect(stat(el, "cost")).toBe("$41.64");
      expect(stat(el, "confidence")).toBe("Enough to see a 0.2 drop within a day.");
      expect(el.querySelector(".ui-jsm__aside")!.textContent).toBe("$41.64 a month");
      expect(el.querySelector("[data-warning]")).toBeNull();
    });
  }

  test("a slider steps through the rates and fires tc-value-change; prevented, it stays", async () => {
    const el = await make();
    const seen: JudgeSamplingChange[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<JudgeSamplingChange>).detail));
    slide(range(el, "email"), 9);
    await settle();
    expect(seen[0].field).toBe("rates.email");
    expect(seen[0].value.rates).toEqual({ intranet: 0.05, email: 1 });
    expect(el.value.rates.email).toBe(1);
    expect(el.querySelector('[data-segment="email"] .ui-jsm__seg-rate')!.textContent).toBe("100%");
    el.addEventListener("tc-value-change", (e) => e.preventDefault(), { once: true });
    slide(range(el, "email"), 0);
    await settle();
    expect(el.value.rates.email).toBe(1);
    expect(range(el, "email").value).toBe("9");
  });

  test("rules, the model and the budget; over budget it warns and says so once", async () => {
    const el = await make();
    const fields: string[] = [];
    el.addEventListener("tc-value-change", (e) => fields.push((e as CustomEvent<JudgeSamplingChange>).detail.field));
    const sw = el.querySelectorAll<HTMLInputElement>('input[role="switch"]')[1];
    sw.click();
    await settle();
    expect(el.value.include["new-prompt"]).toBe(true);
    const select = el.querySelector("select")!;
    select.value = "large";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.model).toBe("large");
    const warning = el.querySelector("[data-warning]")!;
    expect(warning.textContent!.replace(/\s+/g, " ")).toMatch(/Over budget\. The estimate is \$[\d,]+ a month, \$[\d,]+ over the \$100 cap/);
    expect(el.querySelector(".ui-jsm__stat[data-over]")).toBeTruthy();
    expect(status(el)).toMatch(/^Over budget: \$[\d,]+ a month$/);
    const budget = el.querySelector<HTMLInputElement>('input[type="number"]')!;
    budget.value = "5000";
    budget.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.budget).toBe(5000);
    expect(el.querySelector("[data-warning]")).toBeNull();
    expect(status(el)).toBe("Back within budget");
    budget.value = "-3";
    budget.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.budget).toBe(5000);
    expect(budget.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(budget.getAttribute("aria-describedby")!)!.textContent).toMatch(/0 or more/);
    budget.value = "";
    budget.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.budget).toBe(0);
    expect(budget.getAttribute("aria-invalid")).toBe("false");
    expect(fields).toEqual(["include.new-prompt", "model", "budget", "budget"]);
  });

  test("nothing judged, or too few to see a drop, is said plainly", async () => {
    const el = await make("standard", { rates: {}, include: {}, model: "small" });
    expect(stat(el, "confidence")).toBe("Nothing is judged, so drops won't be seen.");
    el.scoreSd = 20;
    el.value = { rates: { intranet: 0.001 }, include: {}, model: "small" };
    await settle();
    expect(stat(el, "confidence")).toBe("Too few to see a 0.2 drop within a month – raise a rate.");
  });

  test("React wrapper: uncontrolled value survives re-renders; controlled waits for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    const render = (n: number) =>
      root.render(React.createElement(JudgeSampling, { title: `Sampling ${n}`, segments: SEGMENTS, models: MODELS, defaultValue: VALUE, onValueChange: (_, f) => void seen.push(f) }));
    await act(async () => render(1));
    await settle();
    const el = host.querySelector("tc-judge-sampling")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Sampling 1");
    slide(range(el, "intranet"), 7);
    await settle();
    await act(async () => render(2));
    await settle();
    expect(el.value.rates.intranet).toBe(0.2);
    await act(async () => root.render(React.createElement(JudgeSampling, { segments: SEGMENTS, models: MODELS, value: VALUE, onValueChange: (_, f) => void seen.push(f) })));
    await settle();
    slide(range(el, "intranet"), 9);
    await settle();
    expect(el.value.rates.intranet).toBe(0.05);
    expect(seen).toEqual(["rates.intranet", "rates.intranet"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-judge-sampling description="Policy desk" .segments=${SEGMENTS} .includeRules=${RULES} .models=${MODELS} .value=${VALUE}></tc-judge-sampling>
        <tc-judge-sampling look="clean" .segments=${SEGMENTS} .includeRules=${RULES} .models=${MODELS} .value=${{ ...VALUE, model: "large" }}></tc-judge-sampling>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
