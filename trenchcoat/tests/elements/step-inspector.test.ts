/*
 * <tc-step-inspector> in real browsers: the step's title and inputs, typed values and mappings from earlier steps,
 * missing inputs in words, the mapping list from the keyboard, Test with sample, the last run's Input and Output tabs,
 * the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/step-inspector";
import { resolveRef, stepInputMissing, type InspectorStep, type StepChange, type StepRun, type StepTest, type TcStepInspector, type UpstreamStep } from "../../src/elements/step-inspector";
import { StepInspector } from "../../src/elements/react/step-inspector";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const UPSTREAM: UpstreamStep[] = [
  { id: "received", title: "Invoice received", kind: "trigger", outputs: [{ name: "sender", type: "text" }] },
  { id: "extract", title: "Extract fields", kind: "llm", outputs: [{ name: "vendor", type: "text", sample: "Northwind Labs" }, { name: "amount", type: "number", sample: "12,480.00" }] },
];
const STEP: InspectorStep = {
  id: "post",
  kind: "output",
  title: "Post to ledger",
  inputs: [
    { id: "amount", label: "Amount", type: "number", required: true, source: { kind: "ref", ref: "extract.amount" } },
    { id: "account", label: "Account", type: "select", required: true, options: ["5100", "6100"], source: { kind: "value", value: "5100" } },
    { id: "cost", label: "Cost centre", required: true, description: "e.g. CC-210" },
    { id: "memo", label: "Memo", type: "long" },
  ],
};
const RUN: StepRun = { status: "succeeded", duration: "1.4 s", input: { amount: 12480 }, output: { entry: "GL-1", posted: true } };

const field = (el: Element, id: string) => el.querySelector<HTMLFieldSetElement>(`[data-input="${id}"]`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, composed: true, ...init }));
const make = (look: "standard" | "clean" = "standard", run: StepRun | null = null) =>
  fixture<TcStepInspector>(html`<tc-step-inspector look=${look} .step=${STEP} .upstream=${UPSTREAM} .lastRun=${run}></tc-step-inspector>`);

describe("tc-step-inspector", () => {
  test("resolveRef and stepInputMissing", () => {
    expect(resolveRef("extract.amount", UPSTREAM)!.output.sample).toBe("12,480.00");
    expect(resolveRef("extract.nope", UPSTREAM)).toBeNull();
    expect(resolveRef("amount", UPSTREAM)).toBeNull();
    expect(stepInputMissing(STEP.inputs[0], UPSTREAM)).toBe(false);
    expect(stepInputMissing(STEP.inputs[2], UPSTREAM)).toBe(true);
    expect(stepInputMissing(STEP.inputs[3], UPSTREAM)).toBe(false);
    expect(stepInputMissing({ id: "x", label: "X", required: true, source: { kind: "value", value: "  " } }, UPSTREAM)).toBe(true);
    expect(stepInputMissing({ id: "x", label: "X", required: true, source: { kind: "ref", ref: "gone.field" } }, UPSTREAM)).toBe(true);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the title, a fieldset per input with its source, mappings as chips, and what's missing in words`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("sti");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Post to ledger");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Output · 4 inputs");
      expect(el.querySelector(".tc-head__aside")!.textContent!.trim()).toBe("1 missing");
      expect(el.querySelector<HTMLInputElement>(".ui-sti__field")!.value).toBe("Post to ledger");
      expect([...el.querySelectorAll(".ui-sti__legend")].map((l) => l.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Amount Required", "Account Required", "Cost centre Required", "Memo"]);
      // A mapping: a chip naming the step and output, and its reference
      const chip = field(el, "amount").querySelector(".ui-sti__chip")!;
      expect(chip.textContent!.replace(/\s+/g, " ").trim()).toBe("Amount: Extract fields › amount");
      expect(field(el, "amount").querySelector(".ui-sti__ref")!.textContent).toBe("extract.amount");
      expect(field(el, "amount").querySelector<HTMLInputElement>('input[value="ref"]')!.checked).toBe(true);
      expect(field(el, "account").querySelector("select")!.value).toBe("5100");
      // Missing: marked invalid and described by the message and the description
      const cost = field(el, "cost").querySelector<HTMLInputElement>(".ui-sti__field")!;
      expect(cost.getAttribute("aria-invalid")).toBe("true");
      const described = cost.getAttribute("aria-describedby")!.split(" ").map((id) => document.getElementById(id)!.textContent!.trim());
      expect(described).toEqual(["e.g. CC-210", "Missing – type a value or map it from an earlier step"]);
      expect(field(el, "cost").hasAttribute("data-missing")).toBe(true);
      expect(field(el, "memo").querySelector("textarea")).toBeTruthy();
      expect(el.querySelector(".ui-sti__test")!.getAttribute("aria-disabled")).toBe("true");
      expect(el.querySelector(".ui-sti__norun")!.textContent).toBe("Not tested yet.");
    });
  }

  test("typing a value fires tc-step-change with the input; the missing count follows; preventDefault() keeps the step", async () => {
    const el = await make();
    const seen: StepChange[] = [];
    el.addEventListener("tc-step-change", (e) => seen.push((e as CustomEvent<StepChange>).detail));
    const cost = field(el, "cost").querySelector<HTMLInputElement>(".ui-sti__field")!;
    cost.value = "CC-210";
    cost.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(seen[0]).toMatchObject({ field: "input", input: "cost" });
    expect(seen[0].step.inputs[2].source).toEqual({ kind: "value", value: "CC-210" });
    expect(el.querySelector(".tc-head__aside")!.textContent!.trim()).toBe("Ready");
    expect(field(el, "cost").querySelector(".ui-sti__error")).toBeNull();
    expect(el.querySelector(".ui-sti__test")!.getAttribute("aria-disabled")).toBe("false");
    // The title
    const title = el.querySelector<HTMLInputElement>(".ui-sti__field")!;
    title.value = "Post invoice";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(seen[1]).toMatchObject({ field: "title" });
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Post invoice");
    el.addEventListener("tc-step-change", (e) => e.preventDefault());
    title.value = "Something else";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.step!.title).toBe("Post invoice");
    expect(title.value).toBe("Post invoice");
  });

  test("From a step opens the outputs of earlier steps; ↑ ↓ and Enter map the input; Escape closes back to the chip", async () => {
    const el = await make();
    const seen: StepChange[] = [];
    el.addEventListener("tc-step-change", (e) => seen.push((e as CustomEvent<StepChange>).detail));
    const ref = field(el, "cost").querySelector<HTMLInputElement>('input[value="ref"]')!;
    ref.click();
    await settle();
    const list = el.querySelector('[role="listbox"]')!;
    expect(list.getAttribute("aria-label")).toBe("Outputs for Cost centre");
    expect([...list.querySelectorAll('[role="group"]')].map((g) => g.getAttribute("aria-label"))).toEqual(["Invoice received", "Extract fields"]);
    const options = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((o) => o.dataset.ref)).toEqual(["received.sender", "extract.vendor", "extract.amount"]);
    await expect.poll(() => document.activeElement).toBe(options[0]);
    key(options[0], "ArrowDown");
    await settle();
    expect(document.activeElement).toBe(options[1]);
    key(options[1], "Enter");
    await settle();
    expect(seen.at(-1)!.step.inputs[2].source).toEqual({ kind: "ref", ref: "extract.vendor" });
    expect(el.querySelector('[role="listbox"]')).toBeNull();
    const chip = field(el, "cost").querySelector<HTMLElement>(".ui-sti__chip")!;
    await expect.poll(() => document.activeElement).toBe(chip);
    expect(chip.getAttribute("aria-expanded")).toBe("false");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Cost centre comes from Extract fields vendor");
    // Reopening marks the current mapping; Escape returns to the chip
    chip.click();
    await settle();
    expect(el.querySelector('[role="option"][aria-selected="true"]')!.getAttribute("data-ref")).toBe("extract.vendor");
    key(document.activeElement!, "Escape");
    await settle();
    expect(el.querySelector('[role="listbox"]')).toBeNull();
    await expect.poll(() => document.activeElement).toBe(chip);
    // Back to a value clears the mapping
    field(el, "cost").querySelector<HTMLInputElement>('input[value="value"]')!.click();
    await settle();
    expect(el.step!.inputs[2].source).toEqual({ kind: "value", value: "" });
  });

  test("Test with sample fires tc-test once nothing is missing; the last run shows Input and Output as tabs", async () => {
    const el = await make("standard", RUN);
    const tests: StepTest[] = [];
    el.addEventListener("tc-test", (e) => tests.push((e as CustomEvent<StepTest>).detail));
    const button = el.querySelector<HTMLButtonElement>(".ui-sti__test")!;
    button.click();
    expect(tests).toHaveLength(0);
    expect(document.getElementById(button.getAttribute("aria-describedby")!)!.textContent).toBe("Fill in the missing inputs to test this step.");
    el.step = { ...STEP, inputs: STEP.inputs.map((i) => (i.id === "cost" ? { ...i, source: { kind: "value", value: "CC-1" } } : i)) };
    await settle();
    button.click();
    expect(tests[0].step.id).toBe("post");
    el.testing = true;
    await settle();
    expect(button.textContent!.trim()).toBe("Testing…");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    el.testing = false;
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Test finished");
    expect(el.querySelector(".ui-sti__run-status")!.textContent!.trim()).toBe("Last test succeeded · 1.4 s");
    const tabs = [...el.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(tabs.map((t) => t.textContent!.trim())).toEqual(["Input", "Output"]);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    const panel = el.querySelector('[role="tabpanel"]')!;
    expect(JSON.parse(panel.textContent!)).toEqual({ entry: "GL-1", posted: true });
    key(tabs[1], "ArrowLeft");
    await settle();
    expect(JSON.parse(el.querySelector('[role="tabpanel"]')!.textContent!)).toEqual({ amount: 12480 });
    await expect.poll(() => document.activeElement?.textContent?.trim()).toBe("Input");
    // A failed run says so and shows why
    el.lastRun = { status: "failed", error: "The ledger refused the entry: period closed.", input: { amount: 1 } };
    await settle();
    expect(el.querySelector(".ui-sti__run-status")!.textContent!.trim()).toBe("Last test failed");
    expect(el.querySelector(".ui-sti__run-error")!.textContent).toBe("The ledger refused the entry: period closed.");
    expect(el.querySelectorAll('[role="tab"]')).toHaveLength(1);
  });

  test("no step: asks for one; no earlier steps: From a step is off; read-only: nothing can change", async () => {
    const empty = await fixture<TcStepInspector>(html`<tc-step-inspector></tc-step-inspector>`);
    expect(empty.querySelector(".ui-sti__none")!.textContent).toBe("Select a step to see its settings.");
    const lone = await fixture<TcStepInspector>(html`<tc-step-inspector .step=${STEP}></tc-step-inspector>`);
    expect(field(lone, "cost").querySelector<HTMLInputElement>('input[value="ref"]')!.disabled).toBe(true);
    expect(field(lone, "cost").querySelector(".ui-sti__error")!.textContent).toBe("Missing – type a value");
    // A mapping to a step that isn't upstream counts as missing
    expect(lone.querySelector(".tc-head__aside")!.textContent!.trim()).toBe("2 missing");
    const ro = await fixture<TcStepInspector>(html`<tc-step-inspector readonly .step=${STEP} .upstream=${UPSTREAM}></tc-step-inspector>`);
    expect(ro.querySelector(".ui-sti__test")).toBeNull();
    expect([...ro.querySelectorAll("fieldset")].every((f) => f.disabled)).toBe(true);
  });

  test("React wrapper: an uncontrolled step keeps edits across re-renders; a controlled one waits for the parent; onTest", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(StepInspector, { defaultStep: STEP, upstream: UPSTREAM, onStepChange: (_s, d) => void seen.push(d.field), "data-n": n } as React.ComponentProps<typeof StepInspector>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-step-inspector")!;
    const title = el.querySelector<HTMLInputElement>(".ui-sti__field")!;
    title.value = "Post invoice";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.step!.title).toBe("Post invoice");
    expect(seen).toEqual(["title"]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    const tested: string[] = [];
    const ready = { ...STEP, inputs: STEP.inputs.filter((i) => i.id !== "cost") };
    await act(async () => root2.render(React.createElement(StepInspector, { step: ready, upstream: UPSTREAM, onStepChange: () => {}, onTest: (s) => void tested.push(s.id) })));
    await settle();
    const el2 = host2.querySelector("tc-step-inspector")!;
    const t2 = el2.querySelector<HTMLInputElement>(".ui-sti__field")!;
    t2.value = "Changed";
    t2.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el2.step!.title).toBe("Post to ledger");
    el2.querySelector<HTMLButtonElement>(".ui-sti__test")!.click();
    expect(tested).toEqual(["post"]);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with the mapping list open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 560px; background: var(--tc-surface-base); display: grid; gap: 16px">
        <tc-step-inspector .step=${STEP} .upstream=${UPSTREAM} .lastRun=${RUN}></tc-step-inspector>
        <tc-step-inspector look="clean" .step=${STEP} .upstream=${UPSTREAM}></tc-step-inspector>
        <tc-step-inspector look="clean"></tc-step-inspector>
      </div>`);
      wrap.querySelector<HTMLElement>(".ui-sti__chip")!.click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
