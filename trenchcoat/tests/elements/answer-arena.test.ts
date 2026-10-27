/*
 * <tc-answer-arena> in real browsers: the panes, streaming, blind mode, the vote and its reasons, the toolbar keyboard,
 * controlled use, focus, the wrapper, axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/answer-arena";
import type { ArenaAnswer, ArenaVote, TcAnswerArena } from "../../src/elements/answer-arena";
import { AnswerArena } from "../../src/elements/react/answer-arena";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const done: ArenaAnswer[] = [
  { model: "Atlas", answer: "**RAG** looks things up first.\n\nYou get:\n- Grounded answers\n- Sources", meta: "1.4s · 74 tokens" },
  { model: "Nova", answer: "An open-book exam for the model." },
];
const streaming: ArenaAnswer[] = [done[0], { ...done[1], answer: "An open-book", streaming: true }];
const vote = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-arena__vote[data-vote="${id}"]`)!;
const names = (el: Element) => [...el.querySelectorAll(".ui-arena__model")].map((n) => n.textContent);
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent!.trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const finishAnimations = (root: Element) =>
  root
    .getAnimations({ subtree: true })
    .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
    .forEach((a) => a.finish());

describe("tc-answer-arena", () => {
  test("the host is the root, in both looks; prompt and two labelled panes", async () => {
    const el = await fixture<TcAnswerArena>(html`<tc-answer-arena prompt="Explain RAG" .answers=${done}></tc-answer-arena>`);
    expect(el.dataset.ui).toBe("arena");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Prompt: Explain RAG");
    const panes = [...el.querySelectorAll("section.ui-arena__pane")];
    expect(panes.map((p) => p.getAttribute("aria-label"))).toEqual(["Answer A", "Answer B"]);
    expect(names(el)).toEqual(["Atlas", "Nova"]);
    expect(el.querySelector(".ui-arena__card")).toBeNull();
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-arena__card .ui-arena__panes")).toBeTruthy();
  });

  test("answers: paragraphs, lists and bold; the meta line once done", async () => {
    const el = await fixture<TcAnswerArena>(html`<tc-answer-arena .answers=${done}></tc-answer-arena>`);
    const a = el.querySelector('[data-side="a"] .ui-arena__answer')!;
    expect(a.querySelector("strong")!.textContent).toBe("RAG");
    expect(a.querySelectorAll("p").length).toBe(2);
    expect([...a.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["Grounded answers", "Sources"]);
    expect(el.querySelector('[data-side="a"] .ui-arena__meta')!.textContent).toBe("1.4s · 74 tokens");
  });

  test("streaming: a caret, aria-busy, no vote yet; then 'Both answers are in' once", async () => {
    const el = await fixture<TcAnswerArena>(html`<tc-answer-arena .answers=${streaming}></tc-answer-arena>`);
    const b = el.querySelector('[data-side="b"]')!;
    expect(b.getAttribute("aria-busy")).toBe("true");
    expect(b.querySelector(".ui-arena__caret")).toBeTruthy();
    expect(el.querySelector('[data-side="a"] .ui-arena__caret')).toBeNull();
    expect(el.querySelector(".ui-arena__question")!.textContent).toBe("Vote once both answers are done");
    expect(vote(el, "a").getAttribute("aria-disabled")).toBe("true");
    let changes = 0;
    el.addEventListener("tc-value-change", () => changes++);
    vote(el, "a").click();
    await settle();
    expect(changes).toBe(0);
    expect(el.value).toBeNull();
    expect(status(el)).toBe("");
    el.answers = [done[0], { ...done[1], answer: "An open-book exam", streaming: true }];
    await settle();
    expect(status(el)).toBe("");
    el.answers = done;
    await settle();
    expect(status(el)).toBe("Both answers are in.");
    expect(b.getAttribute("aria-busy")).toBe("false");
    expect(vote(el, "a").getAttribute("aria-disabled")).toBe("false");
    expect(el.querySelector(".ui-arena__question")!.textContent).toBe("Which answer is better?");
  });

  test("blind: names hidden until the vote, then revealed and announced", async () => {
    const el = await fixture<TcAnswerArena>(html`<tc-answer-arena blind .answers=${done}></tc-answer-arena>`);
    expect(names(el)).toEqual(["Model A", "Model B"]);
    expect(el.textContent).not.toContain("Atlas");
    expect([...el.querySelectorAll(".ui-arena__glyph")].map((g) => g.textContent)).toEqual(["A", "B"]);
    vote(el, "b").click();
    await settle();
    expect(names(el)).toEqual(["Atlas", "Nova"]);
    expect(status(el)).toBe("You voted: B is better. A was Atlas, B was Nova.");
    expect(el.querySelector('[data-side="b"]')!.hasAttribute("data-winner")).toBe(true);
    expect(el.querySelector('[data-side="b"] .ui-arena__pill')!.textContent).toContain("Preferred");
  });

  test("the vote and a reason; tie offers its own reasons; a reason toggles off", async () => {
    const el = await fixture<TcAnswerArena>(html`<tc-answer-arena .answers=${done}></tc-answer-arena>`);
    const seen: (ArenaVote | null)[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent).detail.value));
    const reasons = el.querySelector(".ui-arena__reasons")!;
    expect(reasons.getAttribute("data-open")).toBe("false");
    expect((reasons as HTMLElement).inert).toBe(true);
    vote(el, "a").click();
    await settle();
    expect(vote(el, "a").getAttribute("aria-pressed")).toBe("true");
    expect(reasons.getAttribute("data-open")).toBe("true");
    const chips = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-arena__reason")];
    expect(chips().map((c) => c.textContent)).toEqual(["More accurate", "Easier to follow", "More complete", "Better tone"]);
    chips()[2].click();
    await settle();
    expect(el.value).toEqual({ winner: "a", reason: "More complete" });
    expect(status(el)).toBe("Reason: More complete.");
    chips()[2].click();
    await settle();
    expect(el.value).toEqual({ winner: "a" });
    // The same side again changes nothing
    vote(el, "a").click();
    vote(el, "tie").click();
    await settle();
    expect(chips().map((c) => c.textContent)).toEqual(["Both good", "Both wrong", "Too close to call"]);
    expect(seen).toEqual([{ winner: "a" }, { winner: "a", reason: "More complete" }, { winner: "a" }, { winner: "tie" }]);
    expect(el.querySelector("[data-winner]")).toBeNull();
  });

  test("custom question and reasons", async () => {
    const el = await fixture<TcAnswerArena>(html`<tc-answer-arena question="Which reads better?" .reasons=${["Shorter"]} .answers=${done}></tc-answer-arena>`);
    expect(el.querySelector(".ui-arena__question")!.textContent).toBe("Which reads better?");
    vote(el, "b").click();
    await settle();
    expect([...el.querySelectorAll(".ui-arena__reason")].map((c) => c.textContent)).toEqual(["Shorter"]);
  });

  test("controlled: preventDefault() keeps the value; a value set from outside shows", async () => {
    const el = await fixture<TcAnswerArena>(html`<tc-answer-arena blind .answers=${done}></tc-answer-arena>`);
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    vote(el, "a").click();
    await settle();
    expect(el.value).toBeNull();
    expect(names(el)).toEqual(["Model A", "Model B"]);
    el.value = { winner: "b", reason: "Better tone" };
    await settle();
    expect(vote(el, "b").getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector('.ui-arena__reason[aria-pressed="true"]')!.textContent).toBe("Better tone");
    expect(names(el)).toEqual(["Atlas", "Nova"]);
  });

  test("the vote toolbar: one tab stop, arrows, Home and End; Enter votes", async () => {
    const el = await fixture<TcAnswerArena>(html`<tc-answer-arena .answers=${done}></tc-answer-arena>`);
    const bar = el.querySelector('[role="toolbar"]')!;
    expect(bar.getAttribute("aria-labelledby")).toBe(el.querySelector(".ui-arena__question")!.id);
    const buttons = [...bar.querySelectorAll<HTMLButtonElement>("button")];
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    buttons[0].focus();
    key(buttons[0], "ArrowRight");
    await settle();
    expect(document.activeElement).toBe(buttons[1]);
    expect(buttons.map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
    key(buttons[1], "End");
    await settle();
    expect(document.activeElement).toBe(buttons[2]);
    key(buttons[2], "ArrowRight");
    await settle();
    expect(document.activeElement).toBe(buttons[0]);
    key(buttons[0], "ArrowLeft");
    key(buttons[2], "Home");
    await settle();
    expect(document.activeElement).toBe(buttons[0]);
    // Buttons are native: Enter and Space click
    buttons[2].click();
    await settle();
    expect(el.value).toEqual({ winner: "b" });
    // The tab stop follows the vote
    expect(buttons.map((b) => b.tabIndex)).toEqual([-1, -1, 0]);
  });

  test("focus: reasons that fold away hand it back to the vote", async () => {
    const el = await fixture<TcAnswerArena>(html`<tc-answer-arena .answers=${done}></tc-answer-arena>`);
    vote(el, "a").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-arena__reason")!.focus();
    el.value = null;
    await settle();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.activeElement).toBe(vote(el, "a"));
  });

  test("narrow: the panes stack", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="width: 320px"><tc-answer-arena .answers=${done}></tc-answer-arena></div>`);
    const [a, b] = [...wrap.querySelectorAll(".ui-arena__pane")].map((p) => p.getBoundingClientRect());
    expect(b.top).toBeGreaterThanOrEqual(a.bottom);
    expect(Math.round(a.width)).toBe(Math.round(b.width));
    wrap.style.width = "860px";
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const [a2, b2] = [...wrap.querySelectorAll(".ui-arena__pane")].map((p) => p.getBoundingClientRect());
    expect(Math.round(a2.top)).toBe(Math.round(b2.top));
    expect(b2.left).toBeGreaterThan(a2.right - 1);
  });

  test("an icon is cloned in place of the letter once revealed", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("data-mine", "");
    const el = await fixture<TcAnswerArena>(html`<tc-answer-arena .answers=${[{ ...done[0], icon }, done[1]]}></tc-answer-arena>`);
    expect(el.querySelector('[data-side="a"] .ui-arena__glyph svg[data-mine]')).toBeTruthy();
    expect(icon.isConnected).toBe(false);
  });

  test("dark follows .dark, data-theme, data-tc-theme and system alike", () => {
    const css = (customElements.get("tc-answer-arena") as unknown as { css: string }).css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
  });

  test("wrapper: the vote survives a parent re-render; onChange fires; React icons are staged", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: (ArenaVote | null)[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(AnswerArena, {
        blind: true,
        answers: [{ ...done[0], icon: React.createElement("svg", { "data-react": "" }) }, done[1]],
        "data-n": n,
        onChange: (v: ArenaVote | null) => seen.push(v),
      } as React.ComponentProps<typeof AnswerArena>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-answer-arena")!;
    vote(el, "a").click();
    await settle();
    expect(el.value).toEqual({ winner: "a" });
    await act(async () => bump());
    await settle();
    expect(el.value).toEqual({ winner: "a" });
    expect(seen).toEqual([{ winner: "a" }]);
    expect(el.querySelector('[data-side="a"] .ui-arena__glyph svg[data-react]')).toBeTruthy();
    await act(async () => root.unmount());
  });

  test("wrapper: a controlled value stays as given", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(AnswerArena, { answers: done as React.ComponentProps<typeof AnswerArena>["answers"], value: null })));
    await settle();
    const el = host.querySelector("tc-answer-arena")!;
    vote(el, "tie").click();
    await settle();
    expect(el.value).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: Canvas">
        <tc-answer-arena prompt="Explain RAG" blind .answers=${streaming}></tc-answer-arena>
        <tc-answer-arena prompt="Explain RAG" .answers=${done} .value=${{ winner: "a", reason: "Clearer" }}></tc-answer-arena>
        <tc-answer-arena look="clean" prompt="Explain RAG" .answers=${done} .value=${{ winner: "tie" }}></tc-answer-arena>
        <tc-answer-arena look="clean" blind .answers=${streaming}></tc-answer-arena>
      </div>`);
      finishAnimations(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
});
