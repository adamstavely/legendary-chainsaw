/*
 * <tc-reflection-gate> in real browsers: the four modes and their fields, the checks on Submit, the cancelable
 * value, submit, skip and phase events (controlled use), the hidden answer, the comparison, the radio keyboard,
 * focus after each move, the wrapper, axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/reflection-gate";
import {
  missingTerms,
  type ReflectionGatePhaseChange,
  type ReflectionGateSubmission,
  type ReflectionGateValueChange,
  type TcReflectionGate,
} from "../../src/elements/reflection-gate";
import { ReflectionGate } from "../../src/elements/react/reflection-gate";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const ANSWER = "The notice period is 30 days under clause 14, and the supplier must confirm cancellation in writing.";
const CLAIMS = [
  { id: "c1", text: "The notice period is 30 days" },
  { id: "c2", text: "Cancellation must be confirmed in writing" },
];
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const type = async (el: Element, selector: string, text: string) => {
  const f = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
  f.value = text;
  f.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
const field = (el: Element, name: string) => el.querySelector<HTMLElement>(`.ui-rg__field[data-field="${name}"]`)!;
const radios = (el: Element, name: string) => [...field(el, name).querySelectorAll<HTMLButtonElement>('[role="radio"]')];
const submit = async (el: Element) => {
  el.querySelector<HTMLButtonElement>('.ui-rg__foot [type="submit"]')!.click();
  await settle();
};
const text = (n: Element | null) => n!.textContent!.replace(/\s+/g, " ").trim();

describe("tc-reflection-gate", () => {
  test("missingTerms: numbers and longer words the restatement leaves out, once each", () => {
    expect(missingTerms(ANSWER, "You get 30 days notice.")).toEqual(["14", "supplier", "confirm", "cancellation", "writing"]);
    expect(missingTerms("Refund $89.00 within 5 days.", "They refund $89.00 within 5 days")).toEqual([]);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is the root; intent asks for the task, the decision and the stakes`, async () => {
      const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate look=${look}></tc-reflection-gate>`);
      expect(el.dataset.ui).toBe("rg");
      expect(el.dataset.look).toBe(look);
      expect(getComputedStyle(el).display).toBe("block");
      expect(text(el.querySelector(".ui-rg__title"))).toBe("Before you ask");
      expect([...el.querySelectorAll(".ui-rg__field")].map((f) => f.getAttribute("data-field"))).toEqual(["task", "decision", "stakes"]);
      const form = el.querySelector("form")!;
      expect(form.getAttribute("aria-labelledby")).toBe(el.querySelector(".ui-rg__title")!.id);
      expect(el.querySelector<HTMLLabelElement>('label[for]')!.htmlFor).toBe(el.querySelector("input")!.id);
      expect(radios(el, "stakes").map((r) => text(r))).toEqual(["Minor Easy to notice and undo", "Costly Takes real work to fix", "Serious Hard or impossible to undo"]);
      expect(el.querySelector(".ui-rg__btn--ghost")).toBeNull();
    });

    test(`${look}: Submit with gaps shows each field's message, focuses the first, and says it`, async () => {
      const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate look=${look}></tc-reflection-gate>`);
      const submits: unknown[] = [];
      el.addEventListener("tc-submit", (e) => submits.push(e));
      await submit(el);
      expect(submits).toEqual([]);
      expect(el.phase).toBe("open");
      const task = el.querySelector<HTMLInputElement>('[data-field="task"] input')!;
      expect(task.getAttribute("aria-invalid")).toBe("true");
      expect(document.activeElement).toBe(task);
      expect(task.getAttribute("aria-describedby")).toBe(el.querySelector('[data-field="task"] .ui-rg__msg')!.id);
      expect(field(el, "stakes").querySelector('[role="radiogroup"]')!.getAttribute("aria-invalid")).toBe("true");
      expect(text(field(el, "stakes").querySelector(".ui-rg__msg"))).toBe("Pick one to continue");
      expect(el.querySelector('[role="status"]')!.textContent).toBe("Fill this in to continue");
      await type(el, '[data-field="task"] input', "Reply to a refund request");
      await type(el, '[data-field="decision"] input', "Whether to refund in full");
      await submit(el);
      // Stakes still missing: focus lands on its first radio
      expect(document.activeElement).toBe(radios(el, "stakes")[0]);
    });
  }

  test("values: every edit fires a cancelable tc-value-change; controlled, nothing moves until passed back", async () => {
    const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate></tc-reflection-gate>`);
    const seen: ReflectionGateValueChange[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<ReflectionGateValueChange>).detail));
    await type(el, '[data-field="task"] input', "Plan");
    expect(seen.at(-1)).toEqual({ value: { task: "Plan" } });
    expect(el.value).toEqual({ task: "Plan" });
    radios(el, "stakes")[2].click();
    await settle();
    expect(el.value).toEqual({ task: "Plan", stakes: "high" });
    expect(radios(el, "stakes")[2].getAttribute("aria-checked")).toBe("true");

    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    radios(el, "stakes")[0].click();
    await settle();
    expect(seen.at(-1)!.value.stakes).toBe("low");
    expect(el.value.stakes).toBe("high");
    expect(radios(el, "stakes")[2].getAttribute("aria-checked")).toBe("true");
    await type(el, '[data-field="task"] input', "Plan it");
    expect(el.querySelector<HTMLInputElement>('[data-field="task"] input')!.value).toBe("Plan");
    el.value = { ...el.value, task: "Plan it" };
    await settle();
    expect(el.querySelector<HTMLInputElement>('[data-field="task"] input')!.value).toBe("Plan it");
  });

  test("intent: a passing Submit fires tc-submit with only the mode's fields, then shows what was noted", async () => {
    const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate .value=${{ task: " Reply ", decision: "Refund", stakes: "medium", belief: "stray" }}></tc-reflection-gate>`);
    const got: ReflectionGateSubmission[] = [];
    const phases: string[] = [];
    el.addEventListener("tc-submit", (e) => got.push((e as CustomEvent<ReflectionGateSubmission>).detail));
    el.addEventListener("tc-phase-change", (e) => phases.push((e as CustomEvent<ReflectionGatePhaseChange>).detail.phase));
    await submit(el);
    expect(got).toEqual([{ mode: "intent", value: { task: "Reply", decision: "Refund", stakes: "medium" } }]);
    expect(phases).toEqual(["done"]);
    expect(el.phase).toBe("done");
    expect(el.getAttribute("phase")).toBe("done");
    expect(document.activeElement).toBe(el.querySelector(".ui-rg__result"));
    expect(text(el.querySelector(".ui-rg__result-text"))).toBe("Noted");
    expect([...el.querySelectorAll(".ui-rg__row")].map((r) => [text(r.querySelector("dt")), text(r.querySelector("dd"))])).toEqual([
      ["What are you trying to do?", "Reply"],
      ["What decision will it support?", "Refund"],
      ["If the answer is wrong", "Costly"],
    ]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Noted");
    // Edit goes back to the fields, focus on the first
    el.querySelector<HTMLButtonElement>(".ui-rg__text-btn")!.click();
    await settle();
    expect(el.phase).toBe("open");
    expect(document.activeElement).toBe(el.querySelector('[data-field="task"] input'));
  });

  test("submit: preventDefault keeps the gate open; a prevented phase change waits for the app", async () => {
    const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate .value=${{ task: "a", decision: "b", stakes: "low" }}></tc-reflection-gate>`);
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-submit", stop);
    await submit(el);
    expect(el.phase).toBe("open");
    el.removeEventListener("tc-submit", stop);
    el.addEventListener("tc-phase-change", stop);
    await submit(el);
    expect(el.phase).toBe("open");
    el.phase = "done";
    await settle();
    expect(document.activeElement).toBe(el.querySelector(".ui-rg__result"));
  });

  test("prior: the answer stays hidden until the prior is in; the confidence row is optional", async () => {
    const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate mode="prior" .answer=${ANSWER}></tc-reflection-gate>`);
    expect(text(el.querySelector(".ui-rg__title"))).toBe("Before you see the answer");
    expect(el.textContent).not.toContain("clause 14");
    expect(el.querySelector(".ui-rg__veil")).toBeTruthy();
    expect([...el.querySelectorAll(".ui-rg__field")].map((f) => f.getAttribute("data-field"))).toEqual(["belief", "confidence", "changeMind"]);
    expect(text(field(el, "confidence").querySelector(".ui-rg__optional"))).toBe("Optional");
    await type(el, '[data-field="belief"] textarea', "About a month's notice");
    await type(el, '[data-field="changeMind"] textarea', "A clause that says otherwise");
    const got: ReflectionGateSubmission[] = [];
    el.addEventListener("tc-submit", (e) => got.push((e as CustomEvent<ReflectionGateSubmission>).detail));
    // ⌘/Ctrl + Enter submits from a text area
    key(el.querySelector('[data-field="changeMind"] textarea')!, "Enter", { ctrlKey: true });
    await settle();
    expect(got).toEqual([{ mode: "prior", value: { belief: "About a month's notice", changeMind: "A clause that says otherwise" } }]);
    expect(el.querySelector(".ui-rg__veil")).toBeNull();
    expect(text(el.querySelector(".ui-rg__quote"))).toBe(ANSWER);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Noted. The answer is shown.");
  });

  test("radio keyboard: one tab stop; arrows, Home and End move and pick; Space picks the first", async () => {
    const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate mode="prior"></tc-reflection-gate>`);
    const r = () => radios(el, "confidence");
    expect(r().map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    r()[0].focus();
    key(r()[0], " ");
    await settle();
    expect(el.value.confidence).toBe("unsure");
    key(r()[0], "ArrowRight");
    await settle();
    expect(el.value.confidence).toBe("leaning");
    expect(document.activeElement).toBe(r()[1]);
    expect(r().map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
    key(r()[1], "End");
    await settle();
    expect(document.activeElement).toBe(r()[2]);
    key(r()[2], "ArrowDown");
    await settle();
    expect(el.value.confidence).toBe("unsure");
    key(r()[0], "ArrowUp");
    await settle();
    expect(el.value.confidence).toBe("sure");
    key(r()[2], "Home");
    await settle();
    expect(el.value.confidence).toBe("unsure");
  });

  test("reformulate: too short is said; Compare marks the missing terms; Done submits the restatement and the match", async () => {
    const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate mode="reformulate" min-words="4" .answer=${ANSWER}></tc-reflection-gate>`);
    expect(text(el.querySelector(".ui-rg__quote"))).toBe(ANSWER);
    expect(text(el.querySelector('.ui-rg__foot [type="submit"]'))).toBe("Compare");
    await type(el, "textarea", "30 days");
    await submit(el);
    expect(text(el.querySelector(".ui-rg__msg"))).toBe("Write at least 4 words");
    await type(el, "textarea", "You must give 30 days notice in writing");
    await submit(el);
    expect(el.phase).toBe("compare");
    expect([...el.querySelectorAll("mark.ui-rg__miss")].map((m) => m.textContent)).toEqual(["14", "supplier", "confirm", "cancellation"]);
    expect(text(el.querySelector(".ui-rg__gaps"))).toBe("4 terms from the answer aren't in yours – marked above.");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("4 terms from the answer aren't in yours");
    expect(document.activeElement).toBe(radios(el, "match")[0]);
    await submit(el);
    expect(field(el, "match").querySelector(".ui-rg__msg")).toBeTruthy();
    radios(el, "match")[1].click();
    await settle();
    const got: ReflectionGateSubmission[] = [];
    el.addEventListener("tc-submit", (e) => got.push((e as CustomEvent<ReflectionGateSubmission>).detail));
    await submit(el);
    expect(got).toEqual([{ mode: "reformulate", value: { restatement: "You must give 30 days notice in writing", match: "partly" } }]);
    expect([...el.querySelectorAll(".ui-rg__row dd")].map((d) => d.textContent)).toEqual(["You must give 30 days notice in writing", "Partly"]);
  });

  test("reformulate: Edit mine goes back to the text, focus in it", async () => {
    const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate mode="reformulate" phase="compare" .answer=${ANSWER} .value=${{ restatement: "Thirty days notice, in writing, by the supplier" }}></tc-reflection-gate>`);
    el.querySelector<HTMLButtonElement>(".ui-rg__btn--ghost")!.click();
    await settle();
    expect(el.phase).toBe("open");
    expect(document.activeElement).toBe(el.querySelector("textarea"));
  });

  test("checkpoint: pick a claim (its id is submitted); without claims the claim is typed", async () => {
    const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate mode="checkpoint" .claims=${CLAIMS}></tc-reflection-gate>`);
    expect(radios(el, "claim").map((r) => text(r))).toEqual(CLAIMS.map((c) => c.text));
    radios(el, "claim")[1].click();
    await type(el, '[data-field="method"] input', "Against the signed contract");
    const got: ReflectionGateSubmission[] = [];
    el.addEventListener("tc-submit", (e) => got.push((e as CustomEvent<ReflectionGateSubmission>).detail));
    await submit(el);
    expect(got).toEqual([{ mode: "checkpoint", value: { claim: "c2", method: "Against the signed contract" } }]);
    expect(el.querySelector(".ui-rg__row dd")!.textContent).toBe("Cancellation must be confirmed in writing");

    el.claims = [];
    el.phase = "open";
    await settle();
    expect(field(el, "claim").querySelector("textarea")).toBeTruthy();
  });

  test("skip: only with allow-skip; cancelable; skipped shows Reflect now, and the prior's answer", async () => {
    const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate mode="prior" allow-skip .answer=${ANSWER}></tc-reflection-gate>`);
    const skips: string[] = [];
    el.addEventListener("tc-skip", (e) => skips.push((e as CustomEvent<{ mode: string }>).detail.mode));
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-skip", stop);
    el.querySelector<HTMLButtonElement>(".ui-rg__btn--ghost")!.click();
    await settle();
    expect(el.phase).toBe("open");
    el.removeEventListener("tc-skip", stop);
    el.querySelector<HTMLButtonElement>(".ui-rg__btn--ghost")!.click();
    await settle();
    expect(skips).toEqual(["prior", "prior"]);
    expect(el.phase).toBe("skipped");
    expect(text(el.querySelector(".ui-rg__result-text"))).toBe("Skipped – nothing noted");
    expect(text(el.querySelector(".ui-rg__quote"))).toBe(ANSWER);
    el.querySelector<HTMLButtonElement>(".ui-rg__text-btn")!.click();
    await settle();
    expect(el.phase).toBe("open");
    expect(document.activeElement).toBe(el.querySelector("textarea"));
  });

  test("labels, heading and description replace the gate's text", async () => {
    const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate heading="Antes de preguntar" description="Para qué es" .labels=${{ task: "¿Qué quieres hacer?", submit: "Seguir" }}></tc-reflection-gate>`);
    expect(text(el.querySelector(".ui-rg__title"))).toBe("Antes de preguntar");
    expect(text(el.querySelector(".ui-rg__desc"))).toBe("Para qué es");
    expect(text(el.querySelector('[data-field="task"] label'))).toBe("¿Qué quieres hacer?");
    expect(text(el.querySelector('[type="submit"]'))).toBe("Seguir");
  });

  test("styles: reduced motion turns motion off; no endless loop; no theme-scoped colours", async () => {
    await fixture(html`<tc-reflection-gate></tc-reflection-gate>`);
    const css = (customElements.get("tc-reflection-gate") as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    expect(css).not.toMatch(/infinite/);
    expect(css).not.toMatch(/\.dark\b|data-tc-theme="dark"/);
  });

  test("React wrapper: an uncontrolled value and phase survive a parent re-render; onSubmit false keeps it open; onSkip shows Skip", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const changes: string[] = [];
    const submitted: string[] = [];
    let keep = true;
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ReflectionGate, {
        mode: "intent",
        title: "Before you start",
        defaultValue: { decision: "Refund", stakes: "low" },
        onChange: (v) => changes.push(v.task ?? ""),
        onSubmit: (s) => {
          submitted.push(s.value.task ?? "");
          return keep ? false : undefined;
        },
        onSkip: () => undefined,
        "data-n": n,
      } as React.ComponentProps<typeof ReflectionGate>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-reflection-gate")!;
    expect(el.heading).toBe("Before you start");
    expect(el.allowSkip).toBe(true);
    await type(el, '[data-field="task"] input', "Reply");
    await act(async () => bump());
    await settle();
    expect(changes).toEqual(["Reply"]);
    expect(el.querySelector<HTMLInputElement>('[data-field="task"] input')!.value).toBe("Reply");
    await submit(el);
    expect(submitted).toEqual(["Reply"]);
    expect(el.phase).toBe("open");
    keep = false;
    await submit(el);
    await act(async () => bump());
    await settle();
    expect(el.phase).toBe("done");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: brief – one combined field per mode, said plainly to be the short version`, async () => {
      const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate look=${look} brief .answer=${ANSWER} .claims=${CLAIMS}></tc-reflection-gate>`);
      const labels: Record<string, string> = {
        intent: "What's this for, and what if it's wrong?",
        prior: "What do you expect, and how sure are you?",
        reformulate: "The answer in one line of your own",
        checkpoint: "One thing you'll check, and how",
      };
      for (const mode of ["intent", "prior", "reformulate", "checkpoint"] as const) {
        el.mode = mode;
        await settle();
        expect([...el.querySelectorAll(".ui-rg__field")].map((f) => f.getAttribute("data-field"))).toEqual(["brief"]);
        const input = el.querySelector<HTMLInputElement>('[data-field="brief"] input')!;
        expect(el.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`)!.textContent).toBe(labels[mode]);
        expect(input.getAttribute("aria-required")).toBe("true");
        expect(text(el.querySelector(".ui-rg__tag"))).toBe("Short version");
        expect(text(el.querySelector(".ui-rg__desc"))).toMatch(/^The short version, for when time is tight/);
        expect(text(el.querySelector('[type="submit"]'))).toBe("Continue");
      }
      // Prior still hides the answer until the line is in
      el.mode = "prior";
      await settle();
      expect(el.querySelector(".ui-rg__veil")).toBeTruthy();
      expect(el.querySelector(".ui-rg__quote")).toBeNull();
      expect(el.getAttribute("brief")).toBe("");
    });
  }

  test("brief: empty is refused; a line is submitted with brief: true and recorded as the short version", async () => {
    const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate brief mode="reformulate" .answer=${ANSWER} .value=${{ restatement: "stray" }}></tc-reflection-gate>`);
    const got: ReflectionGateSubmission[] = [];
    el.addEventListener("tc-submit", (e) => got.push((e as CustomEvent<ReflectionGateSubmission>).detail));
    await submit(el);
    expect(got).toEqual([]);
    const input = el.querySelector<HTMLInputElement>('[data-field="brief"] input')!;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(input);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Fill this in to continue");
    await type(el, '[data-field="brief"] input', " 30 days' notice, in writing ");
    await submit(el);
    // No compare step in the short version
    expect(got).toEqual([{ mode: "reformulate", value: { brief: "30 days' notice, in writing" }, brief: true }]);
    expect(el.phase).toBe("done");
    expect(text(el.querySelector(".ui-rg__result-text"))).toBe("Noted – short version");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Noted – short version");
    expect([...el.querySelectorAll(".ui-rg__row")].map((r) => text(r))).toEqual(["The answer in one line of your own 30 days' notice, in writing"]);
    // Edit goes back to the line, not to a comparison
    el.querySelector<HTMLButtonElement>(".ui-rg__text-btn")!.click();
    await settle();
    expect(el.phase).toBe("open");
  });

  test("brief: prior shows the answer once the line is in; without brief nothing changes", async () => {
    const el = await fixture<TcReflectionGate>(html`<tc-reflection-gate brief mode="prior" .answer=${ANSWER}></tc-reflection-gate>`);
    const got: ReflectionGateSubmission[] = [];
    el.addEventListener("tc-submit", (e) => got.push((e as CustomEvent<ReflectionGateSubmission>).detail));
    await type(el, '[data-field="brief"] input', "A month, fairly sure");
    await submit(el);
    expect(got[0]).toEqual({ mode: "prior", value: { brief: "A month, fairly sure" }, brief: true });
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Noted – short version. The answer is shown.");
    expect(el.querySelector(".ui-rg__quote")).toBeTruthy();
    const full = await fixture<TcReflectionGate>(html`<tc-reflection-gate mode="prior"></tc-reflection-gate>`);
    expect(full.querySelector(".ui-rg__tag")).toBeNull();
    expect(full.hasAttribute("brief")).toBe(false);
    full.addEventListener("tc-submit", (e) => got.push((e as CustomEvent<ReflectionGateSubmission>).detail));
    await type(full, '[data-field="belief"] textarea', "A month");
    await type(full, '[data-field="changeMind"] textarea', "The clause");
    await submit(full);
    expect("brief" in got[1]).toBe(false);
  });

  test("axe: no violations in either look or theme, in every mode and phase", async () => {
    const cases = [
      { mode: "intent", phase: "open", value: {} },
      { mode: "prior", phase: "open", value: {} },
      { mode: "prior", phase: "done", value: { belief: "A month", confidence: "leaning", changeMind: "The clause" } },
      { mode: "reformulate", phase: "compare", value: { restatement: "Thirty days, in writing" } },
      { mode: "checkpoint", phase: "open", value: { claim: "c1" } },
      { mode: "intent", phase: "skipped", value: {} },
      { mode: "prior", phase: "open", value: {}, brief: true },
      { mode: "reformulate", phase: "done", value: { brief: "Thirty days, in writing" }, brief: true },
    ] as const;
    for (const theme of ["light", "dark"]) {
      for (const c of cases) {
        const wrap = await fixture(html`<div data-tc-theme=${theme}>
          <div style="width: 560px"><tc-reflection-gate allow-skip ?brief=${"brief" in c} mode=${c.mode} phase=${c.phase} .value=${c.value} .answer=${ANSWER} .claims=${CLAIMS}></tc-reflection-gate></div>
          <div style="width: 320px"><tc-reflection-gate look="clean" allow-skip ?brief=${"brief" in c} mode=${c.mode} phase=${c.phase} .value=${c.value} .answer=${ANSWER} .claims=${CLAIMS}></tc-reflection-gate></div>
        </div>`);
        // Messages showing too
        const gate = wrap.querySelector<TcReflectionGate>("tc-reflection-gate")!;
        if (c.phase === "open") {
          gate.querySelector<HTMLButtonElement>('[type="submit"]')?.click();
          await settle();
        }
        wrap.getAnimations({ subtree: true }).forEach((a) => a.finish());
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${theme}/${c.mode}/${c.phase} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
        cleanup();
      }
    }
  });
});
