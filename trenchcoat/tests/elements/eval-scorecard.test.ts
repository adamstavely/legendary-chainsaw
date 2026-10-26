/*
 * <tc-eval-scorecard> in real browsers: the pass rates and their trend, the filters (tags and outcome, controlled and
 * not), the grid's keyboard (APG grid), the open case beside its expected answer, 10,000 cases windowed, the wrapper,
 * axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/eval-scorecard";
import {
  evalRegressed,
  evalStats,
  type EvalCase,
  type EvalScorecardOpenChange,
  type EvalScorecardShowChange,
  type EvalScorecardTagsChange,
  type EvalVersion,
  type TcEvalScorecard,
} from "../../src/elements/eval-scorecard";
import { EvalScorecard } from "../../src/elements/react/eval-scorecard";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const V: EvalVersion[] = [
  { id: "a", label: "v1" },
  { id: "b", label: "v2", detail: "Opus" },
];
const CASES: EvalCase[] = [
  { id: "c1", name: "Refund", tags: ["refunds"], input: "My blender broke", expected: "Your refund of $89 is on its way", results: { a: { outcome: "pass", output: "Your refund of $89 is on its way" }, b: { outcome: "fail", output: "Please send it back first", reason: "Asked for a return", score: 0.2 } } },
  { id: "c2", name: "Late parcel", tags: ["shipping"], results: { a: { outcome: "fail" }, b: { outcome: "pass" } } },
  { id: "c3", name: "Double charge", tags: ["billing", "refunds"], results: { a: { outcome: "pass" }, b: { outcome: "pass" } } },
  { id: "c4", name: "Spanish", tags: ["multilingual"], results: { a: { outcome: "error" }, b: { outcome: "pending" } } },
];
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const rows = (el: Element) => [...el.querySelectorAll(".ui-evs__rows .ui-evs__row")];
const names = (el: Element) => rows(el).map((r) => r.querySelector(".ui-evs__name")!.textContent);
const grid = (el: Element) => el.querySelector<HTMLElement>('[role="grid"]')!;
const active = (el: Element) => document.getElementById(grid(el).getAttribute("aria-activedescendant") ?? "");

describe("tc-eval-scorecard", () => {
  test("evalStats: passes over finished results; evalRegressed: passed before, fails now", () => {
    const [a, b] = evalStats(V, CASES);
    expect(a).toEqual({ pass: 2, fail: 1, error: 1, pending: 0, rate: 0.5 });
    expect(b).toEqual({ pass: 2, fail: 1, error: 0, pending: 1, rate: 2 / 3 });
    expect(evalStats(V, [])[0].rate).toBeNull();
    expect(CASES.map((c) => evalRegressed(c, V))).toEqual([true, false, false, false]);
    expect(evalRegressed(CASES[0], [V[0]])).toBe(false);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is the root; the trend gives each version its pass rate and the change`, async () => {
      const el = await fixture<TcEvalScorecard>(html`<tc-eval-scorecard look=${look} heading="Support" .versions=${V} .cases=${CASES}></tc-eval-scorecard>`);
      expect(el.dataset.ui).toBe("evs");
      expect(el.dataset.look).toBe(look);
      expect(getComputedStyle(el).display).toBe("block");
      expect(el.querySelector(".ui-evs__title")!.textContent).toBe("Support");
      expect(text(el.querySelector(".ui-evs__summary"))).toBe("4 cases · 2 versions");
      const vers = [...el.querySelectorAll(".ui-evs__ver")];
      expect(vers.map((v) => text(v.querySelector(".ui-evs__rate")))).toEqual(["50%", "67%"]);
      expect(text(vers[1].querySelector(".ui-evs__delta"))).toBe(", +17 points");
      expect(text(vers[1].querySelector(".ui-evs__ver-count"))).toBe(", 2 / 3 passed");
      expect(vers[0].querySelector(".ui-evs__delta")).toBeNull();
      expect(el.querySelectorAll(".ui-evs__dot")).toHaveLength(2);
      // The grid: a row per case, a mark per version, each said in words
      expect(names(el)).toEqual(["Refund", "Late parcel", "Double charge", "Spanish"]);
      expect(rows(el)[0].querySelectorAll('[role="gridcell"]')).toHaveLength(3);
      expect([...rows(el)[3].querySelectorAll(".ui-evs__cell .ui-evs__sr")].map((s) => s.textContent)).toEqual(["Error", "Running"]);
      const regressed = rows(el)[0].querySelectorAll(".ui-evs__cell")[1];
      expect(regressed.hasAttribute("data-regressed")).toBe(true);
      expect(regressed.querySelector(".ui-evs__sr")!.textContent).toBe("Fail, regressed from v1");
    });

    test(`${look}: grid keyboard – focus picks a cell; arrows, Home, End, Page keys move it; Enter opens; Esc closes`, async () => {
      const el = await fixture<TcEvalScorecard>(html`<tc-eval-scorecard look=${look} .versions=${V} .cases=${CASES}></tc-eval-scorecard>`);
      const opens: unknown[] = [];
      el.addEventListener("tc-open-change", (e) => opens.push((e as CustomEvent<EvalScorecardOpenChange>).detail.open));
      const g = grid(el);
      expect(g.getAttribute("aria-rowcount")).toBe("5");
      expect(g.getAttribute("aria-colcount")).toBe("3");
      g.focus();
      await settle();
      // The latest version of the first case
      expect(active(el)!.closest(".ui-evs__row")!.querySelector(".ui-evs__name")!.textContent).toBe("Refund");
      expect(active(el)!.getAttribute("title")).toBe("v2: Fail – regressed");
      key(g, "ArrowDown");
      await settle();
      expect(active(el)!.getAttribute("title")).toBe("v2: Pass");
      key(g, "Home");
      await settle();
      expect(active(el)!.classList.contains("ui-evs__case")).toBe(true);
      key(g, "ArrowLeft");
      await settle();
      expect(active(el)!.classList.contains("ui-evs__case")).toBe(true);
      key(g, "End", { ctrlKey: true });
      await settle();
      expect(active(el)!.getAttribute("title")).toBe("v2: Running");
      key(g, "PageUp");
      await settle();
      expect(active(el)!.closest(".ui-evs__row")!.getAttribute("aria-rowindex")).toBe("2");
      key(g, "ArrowLeft");
      await settle();
      key(g, "Enter");
      await settle();
      expect(opens).toEqual([{ caseId: "c1", versionId: "a" }]);
      expect(el.querySelector(".ui-evs__case-title")!.textContent).toBe("Refund");
      expect(rows(el)[0].hasAttribute("data-open")).toBe(true);
      key(g, "Escape");
      await settle();
      expect(opens[1]).toBeNull();
      expect(el.querySelector(".ui-evs__detail")).toBeNull();
    });
  }

  test("the open case: input, the grader's reason, its output beside the expected answer, diffed; versions switch; close", async () => {
    const el = await fixture<TcEvalScorecard>(html`<tc-eval-scorecard .versions=${V} .cases=${CASES} .open=${{ caseId: "c1", versionId: "b" }}></tc-eval-scorecard>`);
    const opens: unknown[] = [];
    el.addEventListener("tc-open-change", (e) => opens.push((e as CustomEvent<EvalScorecardOpenChange>).detail.open));
    const detail = el.querySelector<HTMLElement>(".ui-evs__detail")!;
    expect(detail.getAttribute("aria-labelledby")).toBe(el.querySelector(".ui-evs__case-title")!.id);
    expect(text(detail.querySelector(".ui-evs__verdict"))).toBe("Fail Score 0.2 Asked for a return");
    expect(text(detail.querySelector(".ui-evs__input .ui-evs__text"))).toBe("My blender broke");
    const [expected, output] = detail.querySelectorAll(".ui-evs__side");
    expect(text(expected.querySelector(".ui-evs__label"))).toBe("Expected");
    expect(text(output.querySelector(".ui-evs__label"))).toBe("Output · v2");
    expect(expected.querySelectorAll("del.ui-evs__miss").length).toBeGreaterThan(0);
    expect(expected.querySelector("ins")).toBeNull();
    expect(output.querySelectorAll("ins.ui-evs__extra").length).toBeGreaterThan(0);
    expect(text(output.querySelector(".ui-evs__text"))).toBe("Please send it back first");
    // The versions: a toolbar of toggle buttons, one tab stop, the shown one pressed
    const runs = [...detail.querySelectorAll<HTMLButtonElement>(".ui-evs__run")];
    expect(detail.querySelector(".ui-evs__runs")!.getAttribute("role")).toBe("toolbar");
    expect(runs.map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "true"]);
    expect(runs.map((b) => b.tabIndex)).toEqual([0, -1]);
    expect(text(runs[0])).toBe("Pass, v1");
    runs[0].focus();
    key(runs[0], "ArrowRight");
    expect(document.activeElement).toBe(runs[1]);
    runs[0].click();
    await settle();
    expect(opens).toEqual([{ caseId: "c1", versionId: "a" }]);
    // The same text on both sides: no marks
    expect(el.querySelector(".ui-evs__miss, .ui-evs__extra")).toBeNull();
    el.querySelector<HTMLButtonElement>(".ui-evs__close")!.focus();
    el.querySelector<HTMLButtonElement>(".ui-evs__close")!.click();
    await settle();
    expect(el.open).toBeNull();
    expect(document.activeElement).toBe(grid(el));
    // A case without expected answer or output says so
    el.open = { caseId: "c2", versionId: "a" };
    await settle();
    expect([...el.querySelectorAll(".ui-evs__side .ui-evs__text")].map((p) => p.textContent)).toEqual(["No expected answer", "No output"]);
  });

  test("filters: tags (any of them) and All / Failing / Regressed; the trend follows; the status says how many", async () => {
    const el = await fixture<TcEvalScorecard>(html`<tc-eval-scorecard .versions=${V} .cases=${CASES}></tc-eval-scorecard>`);
    const tags: string[][] = [];
    const shows: string[] = [];
    el.addEventListener("tc-tags-change", (e) => tags.push((e as CustomEvent<EvalScorecardTagsChange>).detail.tags));
    el.addEventListener("tc-show-change", (e) => shows.push((e as CustomEvent<EvalScorecardShowChange>).detail.show));
    const chips = [...el.querySelectorAll<HTMLButtonElement>(".ui-evs__tag")];
    expect(chips.map((c) => text(c))).toEqual(["refunds, 2 cases", "billing, 1 case", "multilingual, 1 case", "shipping, 1 case"]);
    expect(el.querySelector(".ui-evs__tags")!.getAttribute("role")).toBe("group");
    chips[0].click();
    await settle();
    expect(tags).toEqual([["refunds"]]);
    expect(chips[0].getAttribute("aria-pressed")).toBe("true");
    expect(names(el)).toEqual(["Refund", "Double charge"]);
    expect(text(el.querySelector(".ui-evs__summary"))).toBe("2 of 4 cases · 2 versions");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("2 cases of 4");
    expect([...el.querySelectorAll(".ui-evs__rate")].map((r) => text(r))).toEqual(["100%", "50%"]);
    el.querySelectorAll<HTMLButtonElement>(".ui-evs__tag")[3].click();
    await settle();
    expect(names(el)).toEqual(["Refund", "Late parcel", "Double charge"]);
    el.querySelector<HTMLButtonElement>(".ui-evs__clear")!.click();
    await settle();
    expect(tags[2]).toEqual([]);
    expect(names(el)).toHaveLength(4);
    // The outcome: a radio group – arrows move and pick
    const radios = () => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    expect(radios().map((r) => text(r))).toEqual(["All, 4 cases", "Failing, 1 case", "Regressed, 1 case"]);
    expect(radios().map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    radios()[0].focus();
    key(radios()[0], "ArrowRight");
    await settle();
    expect(shows).toEqual(["failing"]);
    expect(document.activeElement).toBe(radios()[1]);
    expect(radios()[1].getAttribute("aria-checked")).toBe("true");
    expect(names(el)).toEqual(["Refund"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Failing: 1 case");
    key(radios()[1], "ArrowLeft");
    key(document.activeElement!, "ArrowLeft");
    await settle();
    expect(el.show).toBe("regressed");
    // Nothing matches
    el.tags = ["shipping"];
    await settle();
    expect(rows(el)).toHaveLength(0);
    expect(text(el.querySelector(".ui-evs__empty"))).toBe("No cases match these filters");
  });

  test("controlled – preventDefault keeps tags, show and open until the app passes them back", async () => {
    const el = await fixture<TcEvalScorecard>(html`<tc-eval-scorecard .versions=${V} .cases=${CASES}></tc-eval-scorecard>`);
    for (const name of ["tc-tags-change", "tc-show-change", "tc-open-change"]) el.addEventListener(name, (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-evs__tag")!.click();
    el.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1].click();
    rows(el)[0].querySelectorAll<HTMLElement>(".ui-evs__cell")[0].click();
    await settle();
    expect(el.tags).toEqual([]);
    expect(el.show).toBe("all");
    expect(el.open).toBeNull();
    expect(el.querySelector(".ui-evs__detail")).toBeNull();
    el.open = { caseId: "c2", versionId: "b" };
    await settle();
    expect(el.querySelector(".ui-evs__case-title")!.textContent).toBe("Late parcel");
  });

  test("10,000 cases: only the rows near the scroll position render; the keyboard reaches the last one", async () => {
    const many: EvalCase[] = Array.from({ length: 10_000 }, (_, i) => ({ id: `c${i}`, name: `Case ${i + 1}`, tags: [i % 2 ? "odd" : "even"], results: { a: { outcome: i % 3 ? "pass" : "fail" }, b: { outcome: "pass" } } }));
    const t0 = performance.now();
    const el = await fixture<TcEvalScorecard>(html`<tc-eval-scorecard .versions=${V} .cases=${many}></tc-eval-scorecard>`);
    expect(performance.now() - t0).toBeLessThan(3000);
    const g = grid(el);
    expect(g.getAttribute("aria-rowcount")).toBe("10001");
    expect(rows(el).length).toBeLessThan(120);
    expect(text(el.querySelector(".ui-evs__rate"))).toBe("67%");
    g.focus();
    await settle();
    key(g, "End", { ctrlKey: true });
    await settle();
    await settle();
    expect(active(el)!.closest(".ui-evs__row")!.getAttribute("aria-rowindex")).toBe("10001");
    expect(names(el)).toContain("Case 10000");
    expect(rows(el).length).toBeLessThan(120);
    // The spacers keep the scroll height of every row
    const spacers = [...el.querySelectorAll<HTMLElement>(".ui-evs__spacer")].map((s) => s.offsetHeight);
    expect(spacers[0]).toBeGreaterThan(300_000);
    el.tags = ["odd"];
    await settle();
    expect(g.getAttribute("aria-rowcount")).toBe("5001");
  });

  test("styles: reduced motion turns motion off; no endless loop; no theme-scoped colours", async () => {
    await fixture(html`<tc-eval-scorecard></tc-eval-scorecard>`);
    const css = (customElements.get("tc-eval-scorecard") as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    expect(css).not.toMatch(/infinite/);
    expect(css).not.toMatch(/\.dark\b|data-tc-theme="dark"/);
  });

  test("React wrapper: uncontrolled tags survive a parent re-render; title, onTagsChange, onShowChange, onOpenChange", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(EvalScorecard, {
        title: "Support",
        versions: V,
        cases: CASES,
        defaultShow: "all",
        onTagsChange: (t) => seen.push(t),
        onShowChange: (s) => seen.push(s),
        onOpenChange: (o) => seen.push(o),
        "data-n": n,
      } as React.ComponentProps<typeof EvalScorecard>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-eval-scorecard")!;
    expect(el.heading).toBe("Support");
    el.querySelector<HTMLButtonElement>(".ui-evs__tag")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.tags).toEqual(["refunds"]);
    el.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1].click();
    rows(el)[0].querySelector<HTMLElement>(".ui-evs__case")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.show).toBe("failing");
    expect(el.open).toEqual({ caseId: "c1", versionId: "b" });
    expect(seen).toEqual([["refunds"], "failing", { caseId: "c1", versionId: "b" }]);
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme, with a case open, wide and narrow", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <div style="width: 960px"><tc-eval-scorecard .versions=${V} .cases=${CASES} .open=${{ caseId: "c1", versionId: "b" }}></tc-eval-scorecard></div>
        <div style="width: 960px"><tc-eval-scorecard look="clean" .tags=${["refunds"]} .versions=${V} .cases=${CASES} .open=${{ caseId: "c1", versionId: "b" }}></tc-eval-scorecard></div>
        <div style="width: 320px"><tc-eval-scorecard look="clean" show="failing" .versions=${V} .cases=${CASES} .open=${{ caseId: "c4", versionId: "a" }}></tc-eval-scorecard></div>
        <div style="width: 320px"><tc-eval-scorecard .versions=${V} .cases=${[]}></tc-eval-scorecard></div>
      </div>`);
      const g = wrap.querySelector<HTMLElement>('[role="grid"]')!;
      g.focus();
      await settle();
      wrap.getAnimations({ subtree: true }).forEach((a) => a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
