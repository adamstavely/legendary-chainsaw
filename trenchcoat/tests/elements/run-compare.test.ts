/*
 * <tc-run-compare> in real browsers: the word diff on both sides, the steps lined up, the numbers and their change,
 * the tabs (APG, controlled and not), "Use this", a streaming candidate, the wrapper, axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/run-compare";
import { alignRunSteps, type RunComparePick, type RunCompareRun, type RunCompareViewChange, type TcRunCompare } from "../../src/elements/run-compare";
import { RunCompare } from "../../src/elements/react/run-compare";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const A: RunCompareRun = {
  id: "a",
  label: "Prompt v3",
  model: "Sonnet",
  status: "done",
  prompt: "Be polite and thorough.",
  output: "Your refund of $89 is on its way. It takes 5 days.",
  steps: [
    { name: "lookup_order", detail: "Order 48213", duration: 400 },
    { name: "draft_reply", detail: "86 words", duration: 2900 },
    { name: "tone_check", detail: "Passed", duration: 600 },
  ],
  duration: 5000,
  cost: 0.04,
  tokens: 8000,
  score: 80,
};
const B: RunCompareRun = {
  id: "b",
  label: "Prompt v4",
  status: "done",
  prompt: "Be warm and brief.",
  output: "Your refund of $89 is on its way. It takes 3 days.",
  steps: [
    { name: "lookup_order", detail: "Order 48213", duration: 380 },
    { name: "check_stock", detail: "14 in stock", duration: 270 },
    { name: "draft_reply", detail: "47 words", duration: 2100 },
  ],
  duration: 4000,
  cost: 0.05,
  tokens: 6000,
  score: 90,
};
const tabs = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
const tab = (el: Element, name: string) => tabs(el).find((t) => t.textContent!.trim().startsWith(name))!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();

describe("tc-run-compare", () => {
  test("alignRunSteps: matched by name in order; the rest added or dropped; a changed detail is changed", () => {
    expect(alignRunSteps(A.steps!, B.steps!).map((r) => r.kind)).toEqual(["same", "added", "changed", "dropped"]);
    expect(alignRunSteps([], [{ name: "x" }]).map((r) => r.kind)).toEqual(["added"]);
    expect(alignRunSteps([{ name: "x", status: "ok" }], [{ name: "x", status: "error" }]).map((r) => r.kind)).toEqual(["changed"]);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is the root; the outputs are diffed word by word, one side per column`, async () => {
      const el = await fixture<TcRunCompare>(html`<tc-run-compare look=${look} heading="Refund reply" .baseline=${A} .candidate=${B}></tc-run-compare>`);
      expect(el.dataset.ui).toBe("rc");
      expect(el.dataset.look).toBe(look);
      expect(getComputedStyle(el).display).toBe("block");
      expect(el.querySelector(".ui-rc__title")!.textContent).toBe("Refund reply");
      const [left, right] = el.querySelectorAll(".ui-rc__body > .ui-rc__cell");
      expect([...left.querySelectorAll("del")].map((d) => d.textContent)).toEqual(["5"]);
      expect(left.querySelector("ins")).toBeNull();
      expect([...right.querySelectorAll("ins")].map((d) => d.textContent)).toEqual(["3"]);
      expect(right.querySelector("del")).toBeNull();
      expect(text(right.querySelector(".ui-rc__text"))).toBe("Your refund of $89 is on its way. It takes 3 days.");
      // Output 1, steps 3, prompt 2
      expect(tabs(el).map((t) => text(t))).toEqual(["Output, 1 difference", "Steps, 3 differences", "Prompt, 2 differences"]);
      expect(el.querySelector(".ui-rc__count")!.textContent).toBe("6 differences");
    });

    test(`${look}: tabs – one tab stop; arrows, Home and End move and select (APG); a click reports`, async () => {
      const el = await fixture<TcRunCompare>(html`<tc-run-compare look=${look} .baseline=${A} .candidate=${B}></tc-run-compare>`);
      const views: string[] = [];
      el.addEventListener("tc-view-change", (e) => views.push((e as CustomEvent<RunCompareViewChange>).detail.view));
      const list = el.querySelector('[role="tablist"]')!;
      expect(list.getAttribute("aria-labelledby")).toBe(el.querySelector(".ui-rc__title")!.id);
      expect(tabs(el).map((t) => t.tabIndex)).toEqual([0, -1, -1]);
      const panel = el.querySelector('[role="tabpanel"]')!;
      expect(panel.getAttribute("aria-labelledby")).toBe(tab(el, "Output").id);
      expect(tab(el, "Output").getAttribute("aria-controls")).toBe(panel.id);
      tab(el, "Output").focus();
      key(tab(el, "Output"), "ArrowRight");
      await settle();
      expect(views).toEqual(["steps"]);
      expect(document.activeElement).toBe(tab(el, "Steps"));
      expect(tab(el, "Steps").getAttribute("aria-selected")).toBe("true");
      expect(el.querySelector(".ui-rc__steps")).toBeTruthy();
      key(document.activeElement!, "End");
      await settle();
      expect(document.activeElement).toBe(tab(el, "Prompt"));
      key(document.activeElement!, "ArrowRight");
      await settle();
      expect(document.activeElement).toBe(tab(el, "Output"));
      key(document.activeElement!, "ArrowLeft");
      await settle();
      expect(el.view).toBe("prompt");
      expect([...el.querySelectorAll(".ui-rc__body del")].map((d) => d.textContent)).toEqual(["polite", "thorough"]);
      key(document.activeElement!, "Home");
      await settle();
      expect(el.view).toBe("output");
      tab(el, "Steps").click();
      await settle();
      expect(views).toEqual(["steps", "prompt", "output", "prompt", "output", "steps"]);
    });

    test(`${look}: controlled – preventDefault keeps the tab until the app passes it back`, async () => {
      const el = await fixture<TcRunCompare>(html`<tc-run-compare look=${look} .baseline=${A} .candidate=${B}></tc-run-compare>`);
      el.addEventListener("tc-view-change", (e) => e.preventDefault());
      tab(el, "Steps").click();
      await settle();
      expect(el.view).toBe("output");
      expect(tab(el, "Output").getAttribute("aria-selected")).toBe("true");
      el.view = "steps";
      await settle();
      expect(tab(el, "Steps").getAttribute("aria-selected")).toBe("true");
    });
  }

  test("steps: Added, Dropped and Changed are said in words; a changed detail is diffed; the missing side says so", async () => {
    const el = await fixture<TcRunCompare>(html`<tc-run-compare view="steps" .baseline=${A} .candidate=${B}></tc-run-compare>`);
    const rows = [...el.querySelectorAll(".ui-rc__row")];
    expect(rows.map((r) => r.getAttribute("data-kind"))).toEqual(["same", "added", "changed", "dropped"]);
    expect(text(rows[1].querySelector('[data-side="baseline"]'))).toBe("Not in this run");
    expect(text(rows[1].querySelector(".ui-rc__tag"))).toBe("Added");
    expect(text(rows[2].querySelector(".ui-rc__tag"))).toBe("Changed");
    expect(rows[2].querySelector('[data-side="baseline"] del')!.textContent).toBe("86");
    expect(rows[2].querySelector('[data-side="candidate"] ins')!.textContent).toBe("47");
    expect(text(rows[3].querySelector('[data-side="candidate"]'))).toBe("Not taken");
    expect(text(rows[3].querySelector(".ui-rc__tag"))).toBe("Dropped");
    // The numbers are the step's place in its own run
    expect(rows[2].querySelector('[data-side="candidate"] .ui-rc__n')!.textContent).toBe("3");
  });

  test("numbers: the candidate's change against the baseline, better or worse, in words too", async () => {
    const el = await fixture<TcRunCompare>(html`<tc-run-compare .baseline=${A} .candidate=${B} .formatCost=${(n: number) => `€${n.toFixed(2)}`}></tc-run-compare>`);
    const nums = el.querySelectorAll('.ui-rc__nums[data-side="candidate"] .ui-rc__num');
    const byLabel = Object.fromEntries([...nums].map((n) => [n.querySelector("dt")!.textContent, n]));
    expect(byLabel.Time.querySelector(".ui-rc__val")!.textContent).toBe("4.0s");
    expect(byLabel.Time.querySelector(".ui-rc__delta")!.getAttribute("data-tone")).toBe("better");
    expect(text(byLabel.Time.querySelector(".ui-rc__delta"))).toBe("(−20%, better)");
    expect(byLabel.Cost.querySelector(".ui-rc__val")!.textContent).toBe("€0.05");
    expect(byLabel.Cost.querySelector(".ui-rc__delta")!.getAttribute("data-tone")).toBe("worse");
    expect(byLabel.Tokens.querySelector(".ui-rc__val")!.textContent).toBe("6.0k");
    expect(byLabel.Steps.querySelector(".ui-rc__delta")).toBeNull();
    expect(text(byLabel.Score.querySelector(".ui-rc__delta"))).toContain("+10");
    expect(el.querySelector('.ui-rc__nums[data-side="baseline"] .ui-rc__delta')).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe(
      "Prompt v4 against Prompt v3: 1 difference in the output, 3 steps differ, 2 changes to the prompt. −20% time, better; +25% cost, worse.",
    );
  });

  test("pointing at a change lights up its counterpart on the other side", async () => {
    const one = { ...A, output: "We ship today." };
    const two = { ...B, output: "We ship today and tomorrow." };
    const el = await fixture<TcRunCompare>(html`<tc-run-compare .baseline=${one} .candidate=${two}></tc-run-compare>`);
    const ins = el.querySelector<HTMLElement>("ins.ui-rc__ins")!;
    ins.dispatchEvent(new MouseEvent("mouseenter"));
    await settle();
    expect(el.querySelector("ins.ui-rc__ins")!.hasAttribute("data-hot")).toBe(true);
    expect(el.querySelector('.ui-rc__hole[data-chg="0"]')!.hasAttribute("data-hot")).toBe(true);
    el.querySelector("ins.ui-rc__ins")!.dispatchEvent(new MouseEvent("mouseleave"));
    await settle();
    expect(el.querySelector("[data-hot]")).toBeNull();
  });

  test("Use this: on finished runs only, with can-pick; it fires tc-pick", async () => {
    const running = { ...B, status: "running" as const };
    const el = await fixture<TcRunCompare>(html`<tc-run-compare can-pick .baseline=${A} .candidate=${running}></tc-run-compare>`);
    const picks: RunComparePick[] = [];
    el.addEventListener("tc-pick", (e) => picks.push((e as CustomEvent<RunComparePick>).detail));
    expect([...el.querySelectorAll(".ui-rc__pick")].map((b) => b.getAttribute("aria-label"))).toEqual(["Use this: Prompt v3"]);
    el.candidate = B;
    await settle();
    el.querySelectorAll<HTMLButtonElement>(".ui-rc__pick")[1].click();
    expect(picks).toEqual([{ run: B, side: "candidate" }]);
    el.canPick = false;
    await settle();
    expect(el.querySelector(".ui-rc__pick")).toBeNull();
  });

  test("a running candidate streams: a caret, Comparing…, Running – and no summary until it is through", async () => {
    const el = await fixture<TcRunCompare>(html`<tc-run-compare .baseline=${A} .candidate=${{ ...B, status: "running", output: "Your refund" }}></tc-run-compare>`);
    expect(el.querySelector('.ui-rc__cell[data-side="candidate"] .ui-rc__caret')).toBeTruthy();
    expect(el.querySelector(".ui-rc__count")!.textContent).toBe("Comparing…");
    expect(el.querySelector('.ui-rc__head[data-side="candidate"] .ui-rc__status')!.textContent).toBe("Running");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("");
    el.candidate = { ...B, output: A.output };
    await settle();
    expect(el.querySelector(".ui-rc__caret")).toBeNull();
    expect(el.querySelector(".ui-rc__count")!.textContent).toBe("5 differences");
  });

  test("without prompts there is no Prompt tab; without a candidate the side says so", async () => {
    const el = await fixture<TcRunCompare>(html`<tc-run-compare .baseline=${{ ...A, prompt: undefined }}></tc-run-compare>`);
    expect(tabs(el).map((t) => text(t).split(",")[0])).toEqual(["Output", "Steps"]);
    expect(el.querySelector('.ui-rc__head[data-side="candidate"]')!.textContent!.trim()).toContain("No run yet");
    el.view = "prompt";
    await settle();
    expect(tab(el, "Output").getAttribute("aria-selected")).toBe("true");
  });

  test("styles: reduced motion turns motion off; no endless loop; no theme-scoped colours", async () => {
    await fixture(html`<tc-run-compare></tc-run-compare>`);
    const css = (customElements.get("tc-run-compare") as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    expect(css).not.toMatch(/infinite/);
    expect(css).not.toMatch(/\.dark\b|data-tc-theme="dark"/);
  });

  test("React wrapper: an uncontrolled tab survives a parent re-render; title, onViewChange and onPick", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const views: string[] = [];
    const picks: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RunCompare, { title: "Refund", baseline: A, candidate: B, onViewChange: (v) => views.push(v), onPick: (p) => picks.push(p.run.id), "data-n": n } as React.ComponentProps<typeof RunCompare>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-run-compare")!;
    expect(el.heading).toBe("Refund");
    tab(el, "Steps").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(views).toEqual(["steps"]);
    expect(el.view).toBe("steps");
    el.querySelector<HTMLButtonElement>(".ui-rc__pick")!.click();
    expect(picks).toEqual(["a"]);
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme, on every tab", async () => {
    for (const theme of ["light", "dark"]) {
      for (const view of ["output", "steps", "prompt"] as const) {
        const wrap = await fixture(html`<div data-tc-theme=${theme}>
          <div style="width: 760px"><tc-run-compare can-pick view=${view} .baseline=${A} .candidate=${B}></tc-run-compare></div>
          <div style="width: 760px"><tc-run-compare look="clean" view=${view} .baseline=${A} .candidate=${{ ...B, status: "running" }}></tc-run-compare></div>
          <div style="width: 320px"><tc-run-compare look="clean" view=${view} .baseline=${A} .candidate=${B}></tc-run-compare></div>
        </div>`);
        wrap.getAnimations({ subtree: true }).forEach((a) => a.finish());
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${theme}/${view} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
        cleanup();
      }
    }
  });
});
