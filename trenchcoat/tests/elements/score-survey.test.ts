/*
 * <tc-score-survey> in real browsers: the NPS and CSAT scales as radio groups (APG) with number keys, the follow-up per
 * band, Submit and Skip, the thank-you and changing the answer, dismiss, controlled use, the wrapper, narrow wrapping,
 * axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/score-survey";
import { npsBand, type ScoreSurveyScoreChange, type ScoreSurveySubmit, type TcScoreSurvey } from "../../src/elements/score-survey";
import { ScoreSurvey } from "../../src/elements/react/score-survey";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const radios = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
const checked = (el: Element) => radios(el).find((r) => r.getAttribute("aria-checked") === "true")?.dataset.value;

describe("tc-score-survey", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: NPS – the question names a radio group of 0–10, the ends in words, the bands; one tab stop`, async () => {
      const el = await fixture<TcScoreSurvey>(html`<tc-score-survey look=${look}></tc-score-survey>`);
      expect(el.dataset.ui).toBe("ssv");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Your feedback");
      expect(el.querySelector(".ui-ssv__card")!.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      const group = el.querySelector('[role="radiogroup"]')!;
      expect(document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent).toBe("How likely are you to recommend us to a friend or colleague?");
      expect(text(document.getElementById(group.getAttribute("aria-describedby")!))).toMatch(/number keys/);
      expect(radios(el).map((r) => text(r))).toEqual(["0, Not at all likely", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10, Extremely likely"]);
      expect(radios(el).map((r) => r.tabIndex).filter((t) => t === 0)).toHaveLength(1);
      expect(radios(el)[0].tabIndex).toBe(0);
      expect([...el.querySelectorAll(".ui-ssv__ends span")].map((s) => s.textContent)).toEqual(["Not at all likely", "Extremely likely"]);
      expect([...el.querySelectorAll(".ui-ssv__band")].map((b) => text(b))).toEqual(["0–6 Detractor", "7–8 Passive", "9–10 Promoter"]);
      expect(el.querySelector(".ui-ssv__more")).toBeNull();
    });

    test(`${look}: CSAT – five faces, each named by its word`, async () => {
      const el = await fixture<TcScoreSurvey>(html`<tc-score-survey look=${look} kind="csat"></tc-score-survey>`);
      expect(document.getElementById(el.querySelector('[role="radiogroup"]')!.getAttribute("aria-labelledby")!)!.textContent).toBe("How satisfied are you with your experience?");
      expect(radios(el).map((r) => text(r))).toEqual(["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"]);
      expect(radios(el).map((r) => r.dataset.value)).toEqual(["1", "2", "3", "4", "5"]);
      expect(radios(el).every((r) => r.querySelector("svg.ui-ssv__face"))).toBe(true);
      expect(el.querySelector(".ui-ssv__bands")).toBeNull();
      expect(el.querySelector(".ui-ssv__ends")).toBeNull();
    });
  }

  test("npsBand: 0–6 detractor, 7–8 passive, 9–10 promoter", () => {
    expect([0, 6, 7, 8, 9, 10].map(npsBand)).toEqual(["detractor", "detractor", "passive", "passive", "promoter", "promoter"]);
  });

  test("arrows, Home and End move and pick, wrapping; number keys pick; 1 then 0 is 10", async () => {
    const el = await fixture<TcScoreSurvey>(html`<tc-score-survey></tc-score-survey>`);
    const seen: (number | null)[] = [];
    el.addEventListener("tc-score-change", (e) => seen.push((e as CustomEvent<ScoreSurveyScoreChange>).detail.score));
    radios(el)[0].focus();
    key(radios(el)[0], "ArrowLeft");
    await settle();
    expect(el.score).toBe(10);
    expect(document.activeElement).toBe(radios(el)[10]);
    key(document.activeElement!, "ArrowRight");
    await settle();
    expect(el.score).toBe(0);
    key(document.activeElement!, "End");
    await settle();
    key(document.activeElement!, "Home");
    await settle();
    key(document.activeElement!, "7");
    await settle();
    expect(el.score).toBe(7);
    expect(document.activeElement).toBe(radios(el)[7]);
    expect(radios(el).map((r) => r.tabIndex).indexOf(0)).toBe(7);
    key(document.activeElement!, "1");
    key(document.activeElement!, "0");
    await settle();
    expect(el.score).toBe(10);
    expect(seen).toEqual([10, 0, 10, 0, 7, 1, 10]);
  });

  test("CSAT: digits outside 1–5 do nothing; clicking picks", async () => {
    const el = await fixture<TcScoreSurvey>(html`<tc-score-survey kind="csat"></tc-score-survey>`);
    radios(el)[0].focus();
    key(radios(el)[0], "9");
    key(radios(el)[0], "0");
    await settle();
    expect(el.score).toBeNull();
    key(radios(el)[0], "4");
    await settle();
    expect(el.score).toBe(4);
    radios(el)[1].click();
    await settle();
    expect(checked(el)).toBe("2");
  });

  test("preventDefault on tc-score-change keeps the score", async () => {
    const el = await fixture<TcScoreSurvey>(html`<tc-score-survey .score=${3}></tc-score-survey>`);
    el.addEventListener("tc-score-change", (e) => e.preventDefault());
    radios(el)[9].click();
    await settle();
    expect(el.score).toBe(3);
    expect(checked(el)).toBe("3");
  });

  test("the follow-up depends on the band; Submit sends score, comment and kind; then the thank-you and Change answer", async () => {
    const el = await fixture<TcScoreSurvey>(html`<tc-score-survey
      .followUps=${{ detractor: "What would make it better?", promoter: "What do you like most?" }}
      follow-up="Anything else?"
    ></tc-score-survey>`);
    const sent: ScoreSurveySubmit[] = [];
    let edits = 0;
    el.addEventListener("tc-submit", (e) => sent.push((e as CustomEvent<ScoreSurveySubmit>).detail));
    el.addEventListener("tc-edit", () => edits++);
    radios(el)[3].click();
    await settle();
    const label = () => el.querySelector<HTMLLabelElement>(".ui-ssv__label")!;
    expect(label().textContent).toBe("What would make it better?");
    expect(label().htmlFor).toBe(el.querySelector("textarea")!.id);
    radios(el)[8].click();
    await settle();
    expect(label().textContent).toBe("Anything else?");
    radios(el)[10].click();
    await settle();
    expect(label().textContent).toBe("What do you like most?");
    const field = el.querySelector("textarea")!;
    field.value = "  The holds list  ";
    field.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await settle();
    expect([...el.querySelectorAll(".ui-ssv__actions button")].map((b) => text(b))).toEqual(["Skip", "Submit"]);
    el.querySelector<HTMLButtonElement>(".ui-ssv__submit")!.click();
    await settle();
    expect(sent).toEqual([{ score: 10, comment: "The holds list", kind: "nps" }]);
    expect(el.submitted).toBe(true);
    expect(el.querySelector('[role="radiogroup"]')).toBeNull();
    expect(text(el.querySelector(".ui-ssv__thanks"))).toBe("Thanks for your feedback");
    expect(text(el.querySelector(".ui-ssv__answer"))).toBe("You answered 10 out of 10");
    expect(document.activeElement).toBe(el.querySelector(".ui-ssv__change"));
    expect(text(el.querySelector('[role="status"]'))).toBe("Thanks for your feedback");
    el.querySelector<HTMLButtonElement>(".ui-ssv__change")!.click();
    await settle();
    expect(el.submitted).toBe(false);
    expect(edits).toBe(1);
    expect(document.activeElement).toBe(radios(el)[10]);
    el.querySelector<HTMLButtonElement>(".ui-ssv__skip")!.click();
    await settle();
    expect(sent[1]).toEqual({ score: 10, comment: "", kind: "nps" });
  });

  test("a comment typed for a score whose question has gone isn't sent", async () => {
    const el = await fixture<TcScoreSurvey>(html`<tc-score-survey .followUps=${{ detractor: "What went wrong?" }}></tc-score-survey>`);
    const sent: ScoreSurveySubmit[] = [];
    el.addEventListener("tc-submit", (e) => sent.push((e as CustomEvent<ScoreSurveySubmit>).detail));
    radios(el)[3].click();
    await settle();
    const field = el.querySelector("textarea")!;
    field.value = "slow checkout";
    field.dispatchEvent(new InputEvent("input", { bubbles: true }));
    radios(el)[9].click();
    await settle();
    expect(el.querySelector("textarea")).toBeNull();
    el.querySelector<HTMLButtonElement>(".ui-ssv__submit")!.click();
    await settle();
    expect(sent).toEqual([{ score: 9, comment: "", kind: "nps" }]);
  });

  test("no follow-up: Submit alone; preventing tc-submit stays on the question; submitting shows busy", async () => {
    const el = await fixture<TcScoreSurvey>(html`<tc-score-survey kind="csat" .score=${5}></tc-score-survey>`);
    expect(el.querySelector("textarea")).toBeNull();
    expect([...el.querySelectorAll(".ui-ssv__actions button")].map((b) => text(b))).toEqual(["Submit"]);
    el.addEventListener("tc-submit", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLButtonElement>(".ui-ssv__submit")!.click();
    await settle();
    expect(el.submitted).toBe(false);
    el.submitting = true;
    await settle();
    const submit = el.querySelector<HTMLButtonElement>(".ui-ssv__submit")!;
    expect(submit.getAttribute("aria-busy")).toBe("true");
    expect(text(submit)).toBe("Sending…");
    submit.click();
    await settle();
    expect(el.submitted).toBe(false);
    el.submitting = false;
    el.submitted = true;
    await settle();
    expect(text(el.querySelector(".ui-ssv__answer"))).toBe("You answered Very satisfied");
  });

  test("labels rename; hide-bands; dismissible fires tc-dismiss", async () => {
    const el = await fixture<TcScoreSurvey>(html`<tc-score-survey hide-bands dismissible .labels=${{ low: "Never", high: "Certainly", submit: "Send" }} .score=${2}></tc-score-survey>`);
    expect(text(radios(el)[0])).toBe("0, Never");
    expect([...el.querySelectorAll(".ui-ssv__ends span")].map((s) => s.textContent)).toEqual(["Never", "Certainly"]);
    expect(el.querySelector(".ui-ssv__bands")).toBeNull();
    expect(text(el.querySelector(".ui-ssv__submit"))).toBe("Send");
    let dismissed = 0;
    el.addEventListener("tc-dismiss", () => dismissed++);
    const dismiss = el.querySelector<HTMLButtonElement>(".ui-ssv__dismiss")!;
    expect(text(dismiss)).toBe("Dismiss");
    dismiss.click();
    expect(dismissed).toBe(1);
  });

  test("narrow: the NPS row wraps to 0–5 and 6–10", async () => {
    const wrap = await fixture(html`<div style="width: 320px"><tc-score-survey></tc-score-survey></div>`);
    const r = radios(wrap);
    const top = (i: number) => r[i].getBoundingClientRect().top;
    expect(top(5)).toBe(top(0));
    expect(top(6)).toBeGreaterThan(top(5));
    expect(top(10)).toBe(top(6));
    expect(r.every((b) => b.getBoundingClientRect().width >= 24)).toBe(true);
  });

  test("React wrapper: an uncontrolled score survives a parent re-render; controlled stays until the parent changes it; onSubmit false keeps the question", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let keep = true;
    let bump = () => {};
    function App({ score }: { score?: number | null }) {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ScoreSurvey, {
        title: "App survey",
        score,
        onScoreChange: (s) => seen.push(s),
        onSubmit: (a) => {
          seen.push(a.score);
          return keep ? false : undefined;
        },
        "data-n": n,
      } as React.ComponentProps<typeof ScoreSurvey>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-score-survey")!;
    expect(el.heading).toBe("App survey");
    radios(el)[6].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.score).toBe(6);
    el.querySelector<HTMLButtonElement>(".ui-ssv__submit")!.click();
    await settle();
    expect(el.submitted).toBe(false);
    keep = false;
    el.querySelector<HTMLButtonElement>(".ui-ssv__submit")!.click();
    await settle();
    expect(el.submitted).toBe(true);
    await act(async () => root.render(React.createElement(App, { score: 2 })));
    await settle();
    el.submitted = false;
    await settle();
    radios(el)[9].click();
    await settle();
    expect(el.score).toBe(2);
    await act(async () => root.render(React.createElement(App, { score: 9 })));
    await settle();
    expect(el.score).toBe(9);
    expect(seen).toEqual([6, 6, 6, 9]);
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme – NPS with a follow-up, CSAT, the thank-you; wide and narrow", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <div style="width: 560px"><tc-score-survey dismissible .score=${8} follow-up="What could we do better?"></tc-score-survey></div>
        <div style="width: 560px"><tc-score-survey look="clean" kind="csat" .score=${4}></tc-score-survey></div>
        <div style="width: 320px"><tc-score-survey look="clean"></tc-score-survey></div>
        <div style="width: 320px"><tc-score-survey submitted .score=${9}></tc-score-survey></div>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
