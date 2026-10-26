/*
 * <tc-clarifying-questions> in real browsers: single, multiple and text questions with "You decide", the value as a
 * cancelable change, Enter moving on and sending from the last, required answers, skip, the sent reply, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/clarifying-questions";
import type { ClarifyingAnswers, ClarifyingQuestion, TcClarifyingQuestions } from "../../src/elements/clarifying-questions";
import { ClarifyingQuestions } from "../../src/elements/react/clarifying-questions";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const QUESTIONS: ClarifyingQuestion[] = [
  { id: "length", prompt: "How long?", kind: "single", options: [{ value: "short", label: "Short" }, { value: "long", label: "Long", description: "20 slides" }] },
  { id: "areas", prompt: "Which areas?", hint: "Each gets a section.", kind: "multiple", options: [{ value: "rev", label: "Revenue" }, { value: "hire", label: "Hiring" }, { value: "risk", label: "Risks" }] },
  { id: "avoid", prompt: "Anything to leave out?", kind: "text", placeholder: "e.g. names", optional: true },
];

const ask = (questions: ClarifyingQuestion[] = QUESTIONS, value: ClarifyingAnswers = {}) =>
  fixture<TcClarifyingQuestions>(html`<tc-clarifying-questions intro="I'll draft once I know." .questions=${questions} .value=${value}></tc-clarifying-questions>`);
const q = (el: Element, i: number) => el.querySelector<HTMLElement>(`[data-q="${i}"]`)!;
const choice = (el: Element, i: number, v: string) => q(el, i).querySelector<HTMLButtonElement>(`[data-choice="${CSS.escape(v)}"]`)!;
const decide = (el: Element, i: number) => q(el, i).querySelector<HTMLButtonElement>("[data-decide]")!;
const input = (el: Element) => el.querySelector<HTMLInputElement>(".ui-clq__input")!;
const btn = (el: Element, label: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent!.replace("↵", "").trim() === label);
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const type = async (field: HTMLInputElement, text: string) => {
  field.value = text;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
const active = () => document.activeElement as HTMLElement;
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const finishAnimations = () => document.getAnimations().forEach((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.finish());

describe("tc-clarifying-questions", () => {
  test("the host is the root, in both looks; Clean puts Send inside the card", async () => {
    const el = await ask();
    expect(el.dataset.ui).toBe("clq");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(".ui-clq__form > .ui-clq__foot")).not.toBeNull();
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-clq__card > .ui-clq__foot")).not.toBeNull();
    const provided = await fixture(html`<tc-look-provider look="clean"><tc-clarifying-questions></tc-clarifying-questions></tc-look-provider>`);
    expect(provided.querySelector("tc-clarifying-questions")!.dataset.look).toBe("clean");
  });

  test("a form named by the heading; each question a group with its answers", async () => {
    const el = await ask();
    const form = el.querySelector('[role="form"]')!;
    expect(document.getElementById(form.getAttribute("aria-labelledby")!)!.textContent).toBe("A few questions before I start");
    expect(el.querySelector(".ui-clq__intro")!.textContent).toBe("I'll draft once I know.");
    expect(document.getElementById(q(el, 0).getAttribute("aria-labelledby")!)!.textContent).toBe("How long?");
    // One choice: a radiogroup with You decide at the end; several: checkboxes
    const radios = q(el, 0).querySelectorAll('[role="radiogroup"] [role="radio"]');
    expect([...radios].map((r) => r.textContent!.trim().replace(/\s+/g, " "))).toEqual(["Short", "Long, 20 slides", "You decide"]);
    expect(q(el, 0).querySelector("[data-cards]")).not.toBeNull();
    expect(q(el, 1).querySelectorAll('[role="group"] [role="checkbox"]')).toHaveLength(4);
    expect(q(el, 1).querySelector(".ui-clq__hint")!.textContent).toBe("Each gets a section.");
    // Text: a field labelled by its question, Optional, and a You decide toggle
    expect(document.getElementById(input(el).getAttribute("aria-labelledby")!)!.textContent).toBe("Anything to leave out?");
    expect(input(el).placeholder).toBe("e.g. names");
    expect(q(el, 2).querySelector(".ui-clq__optional")!.textContent).toBe("Optional");
    expect(decide(el, 2).getAttribute("aria-pressed")).toBe("false");
    expect(el.querySelector(".ui-clq__foot")!.textContent).toContain("0 of 3 answered");
  });

  test("answers: a cancelable tc-value-change with every answer; You decide replaces the choices", async () => {
    const el = await ask();
    const seen = listen<{ value: ClarifyingAnswers }>(el, "tc-value-change");
    choice(el, 0, "long").click();
    await settle();
    expect(seen.at(-1)!.value).toEqual({ length: { values: ["long"] } });
    expect(choice(el, 0, "long").getAttribute("aria-checked")).toBe("true");
    choice(el, 1, "risk").click();
    choice(el, 1, "rev").click();
    await settle();
    // Kept in the options' order
    expect(el.value.areas).toEqual({ values: ["rev", "risk"] });
    choice(el, 1, "risk").click();
    await settle();
    expect(el.value.areas).toEqual({ values: ["rev"] });
    decide(el, 1).click();
    await settle();
    expect(el.value.areas).toEqual({ decide: true });
    expect(choice(el, 1, "rev").getAttribute("aria-checked")).toBe("false");
    expect(decide(el, 1).getAttribute("aria-checked")).toBe("true");
    await type(input(el), "No customer names");
    expect(el.value.avoid).toEqual({ text: "No customer names" });
    decide(el, 2).click();
    await settle();
    expect(el.value.avoid).toEqual({ decide: true });
    expect(input(el).value).toBe("");
    expect(input(el).placeholder).toBe("You decide – left to the agent");
    expect(el.querySelector(".ui-clq__foot")!.textContent).toContain("3 of 3 answered");
    expect(q(el, 0).querySelector(".ui-clq__num[data-done]")).not.toBeNull();
  });

  test("controlled: preventDefault keeps the answers until the app passes them back", async () => {
    const el = await ask();
    const seen = listen<{ value: ClarifyingAnswers }>(el, "tc-value-change", true);
    choice(el, 0, "short").click();
    await settle();
    expect(seen).toHaveLength(1);
    expect(el.value).toEqual({});
    expect(choice(el, 0, "short").getAttribute("aria-checked")).toBe("false");
    el.value = seen[0].value;
    await settle();
    expect(choice(el, 0, "short").getAttribute("aria-checked")).toBe("true");
  });

  test("one choice: arrows pick as they move, one tab stop on the picked answer, Home / End", async () => {
    const el = await ask();
    const radios = [...q(el, 0).querySelectorAll<HTMLElement>('[role="radio"]')];
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    radios[0].focus();
    await key(radios[0], "ArrowRight");
    expect(el.value.length).toEqual({ values: ["long"] });
    expect(active()).toBe(choice(el, 0, "long"));
    expect(choice(el, 0, "long").tabIndex).toBe(0);
    await key(active(), "End");
    expect(el.value.length).toEqual({ decide: true });
    await key(active(), "ArrowRight");
    expect(el.value.length).toEqual({ values: ["short"] });
    await key(active(), "ArrowUp");
    expect(el.value.length).toEqual({ decide: true });
  });

  test("several choices: arrows move without picking, Space ticks (native), the tab stop follows", async () => {
    const el = await ask();
    choice(el, 1, "rev").focus();
    await key(active(), "ArrowRight");
    expect(active()).toBe(choice(el, 1, "hire"));
    expect(el.value.areas).toBeUndefined();
    expect(choice(el, 1, "hire").tabIndex).toBe(0);
    expect(choice(el, 1, "rev").tabIndex).toBe(-1);
    await key(active(), "Home");
    expect(active()).toBe(choice(el, 1, "rev"));
    await key(active(), "ArrowLeft");
    expect(active()).toBe(decide(el, 1));
  });

  test("Enter moves to the next question and sends from the last", async () => {
    const el = await ask();
    const sent = listen<{ value: ClarifyingAnswers }>(el, "tc-send");
    choice(el, 0, "short").focus();
    choice(el, 0, "short").click();
    await settle();
    await key(active(), "Enter");
    // To the next question's first answer (nothing picked there yet)
    expect(active()).toBe(choice(el, 1, "rev"));
    expect(q(el, 1).hasAttribute("data-current")).toBe(true);
    choice(el, 1, "hire").click();
    await settle();
    await key(choice(el, 1, "hire"), "Enter");
    expect(active()).toBe(input(el));
    await type(input(el), "Names");
    await key(input(el), "Enter");
    expect(sent).toEqual([{ value: { length: { values: ["short"] }, areas: { values: ["hire"] }, avoid: { text: "Names" } } }]);
    expect(el.sent).toBe(true);
  });

  test("required questions: Send flags the first unanswered one, focuses it and says so; optional may stay empty", async () => {
    const el = await ask();
    const sent = listen(el, "tc-send");
    choice(el, 0, "short").click();
    await settle();
    btn(el, "Send answers")!.click();
    await settle();
    expect(sent).toHaveLength(0);
    expect(q(el, 1).hasAttribute("data-missing")).toBe(true);
    const group = q(el, 1).querySelector('[role="group"]')!;
    expect(document.getElementById(group.getAttribute("aria-describedby")!)!.textContent).toBe("Answer this, or choose You decide");
    expect(status(el)).toBe("Answer question 2, or choose You decide");
    expect(active()).toBe(choice(el, 1, "rev"));
    // Answering clears the flag; the optional text stays out of the reply
    decide(el, 1).click();
    await settle();
    expect(q(el, 1).hasAttribute("data-missing")).toBe(false);
    btn(el, "Send answers")!.click();
    await settle();
    expect(sent).toEqual([{ value: { length: { values: ["short"] }, areas: { decide: true } } }]);
  });

  test("a text question without You decide is flagged as invalid; decide: false hides the option", async () => {
    const el = await ask([{ id: "goal", prompt: "What's the goal?", kind: "text", decide: false }]);
    expect(decide(el, 0)).toBeNull();
    btn(el, "Send answers")!.click();
    await settle();
    expect(input(el).getAttribute("aria-invalid")).toBe("true");
    expect(status(el)).toBe("Answer question 1");
    expect(active()).toBe(input(el));
  });

  test("skip: every question left to the agent in one reply; skippable=false hides it", async () => {
    const el = await ask();
    const sent = listen<{ value: ClarifyingAnswers }>(el, "tc-send");
    btn(el, "Skip, you decide")!.click();
    await settle();
    expect(sent[0].value).toEqual({ length: { decide: true }, areas: { decide: true }, avoid: { decide: true } });
    const other = await ask();
    other.skippable = false;
    await settle();
    expect(btn(other, "Skip, you decide")).toBeUndefined();
  });

  test("sent: the card folds into the answers, focus moves to it, the status says so", async () => {
    const el = await ask(QUESTIONS, { length: { values: ["long"] }, areas: { values: ["rev", "risk"] } });
    btn(el, "Send answers")!.focus();
    btn(el, "Send answers")!.click();
    await settle();
    expect(el.hasAttribute("sent")).toBe(true);
    expect(el.querySelector(".ui-clq__q")).toBeNull();
    const rows = [...el.querySelectorAll(".ui-clq__answer")].map((r) => [r.querySelector("dt")!.textContent, r.querySelector("dd")!.textContent]);
    expect(rows).toEqual([
      ["How long?", "Long"],
      ["Which areas?", "Revenue, Risks"],
      ["Anything to leave out?", "No answer"],
    ]);
    expect(status(el)).toBe("Answers sent");
    expect(active()).toBe(el.querySelector(".ui-clq__card"));
  });

  test("send, controlled: preventDefault keeps the questions open; labels are properties", async () => {
    const el = await ask(QUESTIONS, { length: { decide: true }, areas: { decide: true } });
    listen(el, "tc-send", true);
    el.sendLabel = "Start";
    el.decideLabel = "Your call";
    el.skipLabel = "Just start";
    el.heading = "Quick check";
    await settle();
    btn(el, "Start")!.click();
    await settle();
    expect(el.sent).toBe(false);
    expect(decide(el, 0).textContent!.trim()).toBe("Your call");
    expect(btn(el, "Just start")).toBeTruthy();
    expect(el.querySelector(".ui-clq__title")!.textContent).toBe("Quick check");
    el.sent = true;
    await settle();
    expect(el.querySelector(".ui-clq__answer dd")!.textContent).toBe("Your call");
  });

  test("React wrapper: title, uncontrolled answers survive a parent re-render, onSend fires and the reply shows", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    const onSend = vi.fn();
    const draw = (n: number) => root.render(React.createElement(ClarifyingQuestions, { title: `Ask ${n}`, questions: QUESTIONS, onChange, onSend, className: "consumer" }));
    await act(async () => draw(1));
    await settle();
    const el = host.querySelector("tc-clarifying-questions")!;
    expect(el.classList.contains("consumer")).toBe(true);
    expect(el.querySelector(".ui-clq__title")!.textContent).toBe("Ask 1");
    await act(async () => choice(el, 0, "short").click());
    expect(onChange).toHaveBeenCalledWith({ length: { values: ["short"] } });
    await act(async () => draw(2));
    await settle();
    expect(choice(el, 0, "short").getAttribute("aria-checked")).toBe("true");
    expect(el.querySelector(".ui-clq__title")!.textContent).toBe("Ask 2");
    await act(async () => btn(el, "Skip, you decide")!.click());
    await settle();
    expect(onSend).toHaveBeenCalledWith({ length: { decide: true }, areas: { decide: true }, avoid: { decide: true } }, expect.any(Event));
    expect(el.sent).toBe(true);
    await act(async () => draw(3));
    await settle();
    expect(el.sent).toBe(true);
    await act(async () => root.unmount());
  });

  test("React wrapper, controlled: value and sent stay with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    const onSend = vi.fn();
    await act(async () => root.render(React.createElement(ClarifyingQuestions, { questions: QUESTIONS, value: { length: { decide: true }, areas: { decide: true } }, sent: false, onChange, onSend })));
    await settle();
    const el = host.querySelector("tc-clarifying-questions")!;
    await act(async () => choice(el, 0, "short").click());
    await settle();
    expect(onChange).toHaveBeenCalledWith({ length: { values: ["short"] }, areas: { decide: true } });
    expect(el.value.length).toEqual({ decide: true });
    await act(async () => btn(el, "Send answers")!.click());
    await settle();
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(el.sent).toBe(false);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-clarifying-questions look=${look} intro="Before I start." .questions=${QUESTIONS} .value=${{ length: { values: ["long"] }, areas: { values: ["rev"] } }}></tc-clarifying-questions>
            <tc-clarifying-questions look=${look} .questions=${QUESTIONS} .value=${{ length: { decide: true }, areas: { decide: true } }} sent></tc-clarifying-questions>
          </div>`,
        );
        // A flagged question too
        const first = wrap.querySelector("tc-clarifying-questions")!;
        first.value = {};
        await settle();
        btn(first, "Send answers")!.click();
        await settle();
        finishAnimations();
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
