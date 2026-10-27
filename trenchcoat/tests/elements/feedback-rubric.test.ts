/*
 * <tc-feedback-rubric> in real browsers: the criteria as radio groups (APG), the failure types, the correction editor,
 * the payload, Send with its check of required scores, sent and editing again, controlled use, the wrapper, axe in
 * both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/feedback-rubric";
import { FEEDBACK_CRITERIA, FEEDBACK_FAILURES, type FeedbackRating, type FeedbackRubricSubmit, type FeedbackRubricValueChange, type TcFeedbackRubric } from "../../src/elements/feedback-rubric";
import { FeedbackRubric } from "../../src/elements/react/feedback-rubric";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const ANSWER = "You can return it to any store for a full refund and a $15 voucher.";
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const group = (el: Element, id: string) => el.querySelector<HTMLElement>(`[role="radiogroup"][id$="-${id}"]`)!;
const radios = (el: Element, id: string) => [...group(el, id).querySelectorAll<HTMLButtonElement>('[role="radio"]')];
const chips = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-fbr__chip")];

describe("tc-feedback-rubric", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is the root; the answer, a scale per criterion, the failure types, the correction button`, async () => {
      const el = await fixture<TcFeedbackRubric>(html`<tc-feedback-rubric look=${look} .answer=${ANSWER}></tc-feedback-rubric>`);
      expect(el.dataset.ui).toBe("fbr");
      expect(el.dataset.look).toBe(look);
      expect(getComputedStyle(el).display).toBe("block");
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Rate this answer");
      expect(el.querySelector(".ui-fbr__card")!.getAttribute("role")).toBe("group");
      expect(el.querySelector(".ui-fbr__card")!.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      expect(text(el.querySelector(".ui-fbr__quote"))).toBe(ANSWER);
      expect(text(el.querySelector(".ui-fbr__progress"))).toBe("0 of 3 scored");
      const groups = [...el.querySelectorAll('[role="radiogroup"]')];
      expect(groups.map((g) => document.getElementById(g.getAttribute("aria-labelledby")!)!.textContent)).toEqual(FEEDBACK_CRITERIA.map((c) => c.label));
      expect(document.getElementById(groups[0].getAttribute("aria-describedby")!)!.textContent).toBe("Is everything it says true?");
      expect(groups[0].getAttribute("aria-required")).toBe("true");
      expect(radios(el, "accuracy").map((r) => text(r))).toEqual(["1, Poor", "2, Weak", "3, Fair", "4, Good", "5, Excellent"]);
      expect(chips(el).map((c) => c.textContent!.trim())).toEqual(FEEDBACK_FAILURES.map((f) => f.label));
      expect(el.querySelector(".ui-fbr__chips")!.getAttribute("role")).toBe("group");
      expect(text(el.querySelector(".ui-fbr__start"))).toBe("Write the answer it should have been");
      expect(el.querySelector("textarea")).toBeNull();
    });

    test(`${look}: a scale is an APG radio group – one tab stop; arrows, Home and End move and pick, wrapping`, async () => {
      const el = await fixture<TcFeedbackRubric>(html`<tc-feedback-rubric look=${look}></tc-feedback-rubric>`);
      const values: FeedbackRating[] = [];
      el.addEventListener("tc-value-change", (e) => values.push((e as CustomEvent<FeedbackRubricValueChange>).detail.value));
      expect(radios(el, "tone").map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1]);
      radios(el, "tone")[0].focus();
      key(radios(el, "tone")[0], "ArrowRight");
      await settle();
      // Nothing picked yet: the first arrow picks the first level
      expect(el.value.scores.tone).toBe(1);
      key(document.activeElement!, "ArrowRight");
      key(document.activeElement!, "ArrowDown");
      await settle();
      expect(el.value.scores.tone).toBe(3);
      expect(document.activeElement).toBe(radios(el, "tone")[2]);
      expect(radios(el, "tone").map((r) => r.getAttribute("aria-checked"))).toEqual(["false", "false", "true", "false", "false"]);
      expect(radios(el, "tone").map((r) => r.tabIndex)).toEqual([-1, -1, 0, -1, -1]);
      expect(text(group(el, "tone").parentElement!.querySelector(".ui-fbr__level-word"))).toBe("Fair");
      key(document.activeElement!, "End");
      await settle();
      expect(el.value.scores.tone).toBe(5);
      key(document.activeElement!, "ArrowRight");
      await settle();
      expect(el.value.scores.tone).toBe(1);
      key(document.activeElement!, "ArrowLeft");
      await settle();
      expect(el.value.scores.tone).toBe(5);
      key(document.activeElement!, "Home");
      await settle();
      radios(el, "accuracy")[3].click();
      await settle();
      expect(values.map((v) => v.scores)).toEqual([{ tone: 1 }, { tone: 2 }, { tone: 3 }, { tone: 5 }, { tone: 1 }, { tone: 5 }, { tone: 1 }, { tone: 1, accuracy: 4 }]);
      expect(text(el.querySelector(".ui-fbr__progress"))).toBe("2 of 3 scored");
    });
  }

  test("failure types toggle; the correction starts from the answer, counts the changes, starts over and goes", async () => {
    const el = await fixture<TcFeedbackRubric>(html`<tc-feedback-rubric .answer=${ANSWER}></tc-feedback-rubric>`);
    chips(el)[0].click();
    await settle();
    chips(el)[2].click();
    await settle();
    expect(el.value.failures).toEqual(["hallucination", "wrong-tone"]);
    expect(chips(el)[0].getAttribute("aria-pressed")).toBe("true");
    chips(el)[0].click();
    await settle();
    expect(el.value.failures).toEqual(["wrong-tone"]);
    el.querySelector<HTMLButtonElement>(".ui-fbr__start")!.click();
    await settle();
    const field = el.querySelector("textarea")!;
    expect(field.value).toBe(ANSWER);
    expect(el.value.correction).toBe(ANSWER);
    expect(document.activeElement).toBe(field);
    expect(el.querySelector<HTMLLabelElement>("label.ui-fbr__label")!.htmlFor).toBe(field.id);
    expect(text(document.getElementById(field.getAttribute("aria-describedby")!))).toBe("Edit the answer into the one it should have been");
    field.value = "I've refunded $89 to your card. No need to send it back.";
    field.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await settle();
    expect(el.value.correction).toBe("I've refunded $89 to your card. No need to send it back.");
    expect(text(el.querySelector(".ui-fbr__note"))).toMatch(/^\d+ changes? to the answer$/);
    const links = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-fbr__fix-foot .ui-fbr__link")];
    expect(links().map((b) => b.textContent!.trim())).toEqual(["Start over", "Remove"]);
    links()[0].click();
    await settle();
    expect(el.querySelector("textarea")!.value).toBe(ANSWER);
    expect(links().map((b) => b.textContent!.trim())).toEqual(["Remove"]);
    links()[0].focus();
    links()[0].click();
    await settle();
    expect(el.value.correction).toBeNull();
    expect(document.activeElement).toBe(el.querySelector(".ui-fbr__start"));
  });

  test("Send: missing scores are named and focused; then tc-submit carries the whole rating, the answer and meta; Edit reopens", async () => {
    const meta = { messageId: "m1" };
    const el = await fixture<TcFeedbackRubric>(html`<tc-feedback-rubric .answer=${ANSWER} .meta=${meta} .criteria=${[...FEEDBACK_CRITERIA, { id: "style", label: "Style", optional: true }]}></tc-feedback-rubric>`);
    const sent: FeedbackRubricSubmit[] = [];
    let edits = 0;
    el.addEventListener("tc-submit", (e) => sent.push((e as CustomEvent<FeedbackRubricSubmit>).detail));
    el.addEventListener("tc-edit", () => edits++);
    radios(el, "accuracy")[1].click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-fbr__send")!.click();
    await settle();
    expect(sent).toEqual([]);
    expect([...el.querySelectorAll(".ui-fbr__error")].map((e) => e.textContent)).toEqual(["Pick a score", "Pick a score"]);
    expect(group(el, "completeness").getAttribute("aria-invalid")).toBe("true");
    expect(group(el, "completeness").getAttribute("aria-describedby")).toContain(el.querySelector(".ui-fbr__error")!.id);
    expect(group(el, "style").getAttribute("aria-invalid")).toBeNull();
    expect(document.activeElement).toBe(radios(el, "completeness")[0]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Score 2 more criteria before sending");
    // Scoring a missing criterion clears its error
    radios(el, "completeness")[4].click();
    await settle();
    expect(el.querySelectorAll(".ui-fbr__error")).toHaveLength(1);
    radios(el, "tone")[3].click();
    chips(el)[0].click();
    await settle();
    // What gets sent: the payload as JSON, behind a disclosure
    const toggle = el.querySelector<HTMLButtonElement>(".ui-fbr__toggle")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const json = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(JSON.parse(json.textContent!)).toEqual({ scores: { accuracy: 2, completeness: 5, tone: 4 }, failures: ["hallucination"], correction: null, answer: ANSWER, meta });
    el.querySelector<HTMLButtonElement>(".ui-fbr__send")!.click();
    await settle();
    expect(sent).toEqual([{ scores: { accuracy: 2, completeness: 5, tone: 4 }, failures: ["hallucination"], correction: null, answer: ANSWER, meta }]);
    expect(el.sent).toBe(true);
    expect(el.hasAttribute("sent")).toBe(true);
    expect(el.querySelector<HTMLFieldSetElement>("fieldset")!.disabled).toBe(true);
    expect(text(el.querySelector(".ui-fbr__sent"))).toBe("Rating sent");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Rating sent");
    expect(document.activeElement).toBe(el.querySelector(".ui-fbr__edit"));
    expect(el.querySelector(".ui-fbr__json")).toBeNull();
    el.querySelector<HTMLButtonElement>(".ui-fbr__edit")!.click();
    await settle();
    expect(edits).toBe(1);
    expect(el.sent).toBe(false);
    expect(el.querySelector<HTMLFieldSetElement>("fieldset")!.disabled).toBe(false);
    expect(document.activeElement).toBe(el.querySelector(".ui-fbr__send"));
  });

  test("a prevented tc-submit stays editable; sending shows busy and Send does nothing; the app sets sent", async () => {
    const el = await fixture<TcFeedbackRubric>(html`<tc-feedback-rubric .criteria=${[{ id: "ok", label: "Correct" }]} submit-label="Save"></tc-feedback-rubric>`);
    let n = 0;
    el.addEventListener("tc-submit", (e) => {
      n++;
      e.preventDefault();
    });
    radios(el, "ok")[0].click();
    await settle();
    const send = el.querySelector<HTMLButtonElement>(".ui-fbr__send")!;
    expect(text(send)).toBe("Save");
    send.focus();
    send.click();
    await settle();
    expect(n).toBe(1);
    expect(el.sent).toBe(false);
    el.sending = true;
    await settle();
    expect(text(send)).toBe("Sending…");
    expect(send.getAttribute("aria-busy")).toBe("true");
    send.click();
    expect(n).toBe(1);
    el.sending = false;
    el.sent = true;
    await settle();
    // Send went away with focus on it: focus lands on Edit, and the status says it was sent
    expect(document.activeElement).toBe(el.querySelector(".ui-fbr__edit"));
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Rating sent");
  });

  test("controlled – preventDefault keeps the rating until the app passes it back; custom levels, criteria and failure types", async () => {
    const el = await fixture<TcFeedbackRubric>(html`<tc-feedback-rubric
      .criteria=${[{ id: "grounded", label: "Grounded", levels: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] }]}
      .failureTypes=${[{ value: "x", label: "Cites the wrong source" }]}
    ></tc-feedback-rubric>`);
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    expect(radios(el, "grounded").map((r) => text(r))).toEqual(["0, No", "1, Yes"]);
    radios(el, "grounded")[1].click();
    chips(el)[0].click();
    await settle();
    expect(el.value).toEqual({ scores: {}, failures: [], correction: null });
    expect(radios(el, "grounded")[1].getAttribute("aria-checked")).toBe("false");
    el.value = { scores: { grounded: 1 }, failures: ["x"], correction: "Fixed" };
    await settle();
    expect(radios(el, "grounded")[1].getAttribute("aria-checked")).toBe("true");
    expect(chips(el)[0].getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector("textarea")!.value).toBe("Fixed");
    // Typing into a controlled correction that the app doesn't take back: the field shows the app's value
    const field = el.querySelector("textarea")!;
    field.value = "Fixed!";
    field.dispatchEvent(new InputEvent("input", { bubbles: true }));
    el.requestUpdate();
    await settle();
    expect(field.value).toBe("Fixed");
  });

  test("a long answer folds to three lines with Show all", async () => {
    const long = Array.from({ length: 30 }, () => "A sentence that goes on.").join(" ");
    const el = await fixture<TcFeedbackRubric>(html`<div style="width: 360px"><tc-feedback-rubric .answer=${long}></tc-feedback-rubric></div>`);
    const rubric = el.querySelector("tc-feedback-rubric")!;
    await settle();
    const more = rubric.querySelector<HTMLButtonElement>(".ui-fbr__answer .ui-fbr__link")!;
    expect(more.textContent!.trim()).toBe("Show all");
    expect(more.getAttribute("aria-expanded")).toBe("false");
    const quote = rubric.querySelector<HTMLElement>(".ui-fbr__quote-text")!;
    const folded = quote.clientHeight;
    more.click();
    await settle();
    expect(quote.clientHeight).toBeGreaterThan(folded);
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(more.textContent!.trim()).toBe("Show less");
  });

  test("styles: reduced motion turns motion off; no endless loop; no theme-scoped colours", async () => {
    await fixture(html`<tc-feedback-rubric></tc-feedback-rubric>`);
    const css = (customElements.get("tc-feedback-rubric") as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    expect(css).not.toMatch(/infinite/);
    expect(css).not.toMatch(/\.dark\b|data-tc-theme="dark"/);
  });

  test("React wrapper: an uncontrolled rating survives a parent re-render; title, onChange, onSubmit (false keeps it open), onEdit", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let keepOpen = true;
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(FeedbackRubric, {
        title: "Rate it",
        answer: ANSWER,
        criteria: [{ id: "ok", label: "Correct" }],
        onChange: (v) => seen.push(v.scores),
        onSubmit: (r) => {
          seen.push(r.answer);
          return keepOpen ? false : undefined;
        },
        onEdit: () => seen.push("edit"),
        "data-n": n,
      } as React.ComponentProps<typeof FeedbackRubric>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-feedback-rubric")!;
    expect(el.heading).toBe("Rate it");
    radios(el, "ok")[2].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.value.scores).toEqual({ ok: 3 });
    el.querySelector<HTMLButtonElement>(".ui-fbr__send")!.click();
    await settle();
    expect(el.sent).toBe(false);
    keepOpen = false;
    el.querySelector<HTMLButtonElement>(".ui-fbr__send")!.click();
    await settle();
    expect(el.sent).toBe(true);
    el.querySelector<HTMLButtonElement>(".ui-fbr__edit")!.click();
    await settle();
    expect(seen).toEqual([{ ok: 3 }, ANSWER, ANSWER, "edit"]);
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme – editing with an error and the JSON open, and sent; wide and narrow", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <div style="width: 560px"><tc-feedback-rubric .answer=${ANSWER} .value=${{ scores: { accuracy: 2 }, failures: ["hallucination"], correction: "Fixed it" }}></tc-feedback-rubric></div>
        <div style="width: 560px"><tc-feedback-rubric look="clean" sent .answer=${ANSWER} .value=${{ scores: { accuracy: 2, completeness: 3, tone: 4 }, failures: ["incomplete"], correction: null }}></tc-feedback-rubric></div>
        <div style="width: 320px"><tc-feedback-rubric look="clean" .answer=${ANSWER}></tc-feedback-rubric></div>
        <div style="width: 320px"><tc-feedback-rubric sent .value=${{ scores: { accuracy: 2 }, failures: [], correction: "Fixed" }}></tc-feedback-rubric></div>
      </div>`);
      const first = wrap.querySelector("tc-feedback-rubric")!;
      first.querySelector<HTMLButtonElement>(".ui-fbr__send")!.click();
      first.querySelector<HTMLButtonElement>(".ui-fbr__toggle")!.click();
      const third = wrap.querySelectorAll("tc-feedback-rubric")[2];
      third.querySelector<HTMLButtonElement>(".ui-fbr__toggle")!.click();
      await settle();
      wrap.getAnimations({ subtree: true }).forEach((a) => a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
