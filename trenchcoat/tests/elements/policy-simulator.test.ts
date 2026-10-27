/*
 * <tc-policy-simulator> in real browsers: the form, evaluate() and its result, the trace disclosure, examples as a
 * toolbar, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/policy-simulator";
import type { PolicySimInput, PolicySimInputChange, PolicySimResult, PolicySimResultEvent, PolicySimRun, TcPolicySimulator } from "../../src/elements/policy-simulator";
import { PolicySimulator } from "../../src/elements/react/policy-simulator";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const RESULT: PolicySimResult = {
  decision: "require-approval",
  rule: { id: "AP-20", name: "Payments over $1,000", source: "Agent policy · v14" },
  reason: "$2,400 is over the limit, so a person approves it first.",
  trace: [
    { rule: "Production data deletion", ruleId: "HS-01", outcome: "skipped", detail: "Only for delete" },
    { rule: "Payments over $1,000", ruleId: "AP-20", outcome: "matched", decision: "require-approval", detail: "$2,400 is over the limit", ms: 4 },
    { rule: "Small internal changes", ruleId: "AL-41", outcome: "skipped" },
  ],
};
const STOP: PolicySimResult = { decision: "hard-stop", rule: { id: "HS-01", name: "Production data deletion" }, reason: "Targets production.", trace: [{ rule: "Production data deletion", ruleId: "HS-01", outcome: "matched", ms: 2 }] };

const make = (look: "standard" | "clean" = "standard", extra: Partial<TcPolicySimulator> = {}) =>
  fixture<TcPolicySimulator>(html`<tc-policy-simulator look=${look} description="Try it first." .evaluate=${extra.evaluate} .result=${extra.result} .examples=${extra.examples ?? []} action=${extra.action ?? ""}></tc-policy-simulator>`);
const actionField = (el: Element) => el.querySelector<HTMLInputElement>(".ui-psim__action")!;
const select = (el: Element) => el.querySelector<HTMLSelectElement>("select")!;
const contextField = (el: Element) => el.querySelector<HTMLTextAreaElement>(".ui-psim__context")!;
const run = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-psim__run")!;
const type = (field: HTMLInputElement | HTMLTextAreaElement, text: string) => {
  field.value = text;
  field.dispatchEvent(new Event("input", { bubbles: true }));
};
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const finish = async (root: Element) => {
  for (const a of root.getAnimations?.({ subtree: true }) ?? []) a.finish();
  await settle();
};

describe("tc-policy-simulator", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, the labelled form and the empty result`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("psim");
      expect(el.dataset.look).toBe(look);
      const form = el.querySelector("form")!;
      expect(document.getElementById(form.getAttribute("aria-labelledby")!)!.textContent).toBe("Policy simulator");
      // The header first: on the tray above the form card in Standard, the first row in Clean
      expect(el.querySelector(":scope > .ui-psim__sr + .tc-head + .ui-psim__card")).toBeTruthy();
      // Every field is named by its label
      expect(actionField(el).labels![0].textContent).toBe("Action");
      expect(select(el).labels![0].textContent).toBe("Rule class");
      expect(contextField(el).labels![0].textContent).toContain("Context");
      expect([...select(el).options].map((o) => o.textContent)).toEqual(["Read", "Write", "Communicate", "Spend", "Delete"]);
      expect(el.querySelector(".ui-psim__hint")!.textContent).toBe("Looks something up; changes nothing");
      expect(el.querySelector(".ui-psim__empty")).toBeTruthy();
      expect(el.querySelector(".ui-psim__dry")!.textContent).toContain("nothing is executed");
    });
  }

  test("Simulate without an action marks the field invalid and focuses it; evaluate isn't called", async () => {
    let calls = 0;
    const el = await make("standard", { evaluate: () => (calls++, RESULT) });
    run(el).click();
    await settle();
    expect(calls).toBe(0);
    expect(actionField(el).getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(actionField(el).getAttribute("aria-describedby")!)!.textContent).toBe("Describe the action to simulate.");
    expect(document.activeElement).toBe(actionField(el));
    type(actionField(el), "Refund");
    await settle();
    expect(actionField(el).getAttribute("aria-invalid")).toBe("false");
  });

  test("evaluate gets the input; the decision, the rule, the reason and the trace show; tc-simulate and tc-result fire", async () => {
    const seen: PolicySimInput[] = [];
    const el = await make("standard", { evaluate: (i: PolicySimInput) => (seen.push(i), RESULT) });
    const events: string[] = [];
    el.addEventListener("tc-simulate", (e) => events.push(`simulate:${(e as CustomEvent<PolicySimRun>).detail.input.action}`));
    el.addEventListener("tc-result", (e) => events.push(`result:${(e as CustomEvent<PolicySimResultEvent>).detail.result.decision}`));
    type(actionField(el), "Refund invoice INV-2291");
    select(el).value = "spend";
    select(el).dispatchEvent(new Event("change", { bubbles: true }));
    type(contextField(el), "amount: $2,400");
    await settle();
    run(el).click();
    await settle();
    expect(seen).toEqual([{ action: "Refund invoice INV-2291", ruleClass: "spend", context: "amount: $2,400" }]);
    expect(events).toEqual(["simulate:Refund invoice INV-2291", "result:require-approval"]);
    expect(el.querySelector(".ui-psim__verdict")!.getAttribute("data-decision")).toBe("require-approval");
    expect(el.querySelector(".ui-psim__verdict-label")!.textContent).toBe("Decision: Needs approval");
    expect(el.querySelector(".ui-psim__reason")!.textContent).toBe(RESULT.reason);
    expect(el.querySelector(".ui-psim__rule dd")!.textContent).toContain("Payments over $1,000");
    expect(el.querySelector(".ui-psim__rule .ui-psim__id")!.textContent).toBe("AP-20");
    const steps = [...el.querySelectorAll<HTMLElement>(".ui-psim__step")];
    expect(steps.map((s) => s.dataset.outcome)).toEqual(["skipped", "matched", "skipped"]);
    expect(steps[1].hasAttribute("data-deciding")).toBe(true);
    expect(steps[1].querySelector(".ui-psim__pill")!.textContent).toBe("Decides · Needs approval");
    expect(steps[1].querySelector(".ui-psim__step-ms")!.textContent).toBe("4ms");
    // After the deciding rule: not reached
    expect(steps[2].hasAttribute("data-after")).toBe(true);
    expect(steps[2].querySelector(".ui-psim__step-detail")!.textContent).toContain("Not reached");
    expect(el.querySelector(".ui-psim__trace-count")!.textContent).toBe("1 of 3 checked");
    expect(el.querySelector('[role="status"]')!.textContent).toBe(`Needs approval – Payments over $1,000. ${RESULT.reason}`);
  });

  test("a promise: busy while it runs, then the result; a rejection shows the error", async () => {
    let resolve: (r: PolicySimResult) => void = () => {};
    let fail = false;
    const el = await make("standard", { action: "Delete backups", evaluate: () => (fail ? Promise.reject(new Error("down")) : new Promise<PolicySimResult>((r) => (resolve = r))) });
    run(el).click();
    await settle();
    expect(run(el).getAttribute("aria-disabled")).toBe("true");
    expect(run(el).querySelector(".ui-psim__spinner")).toBeTruthy();
    resolve(STOP);
    await settle();
    await settle();
    expect(run(el).getAttribute("aria-disabled")).toBe("false");
    expect(el.querySelector(".ui-psim__verdict")!.getAttribute("data-decision")).toBe("hard-stop");
    fail = true;
    run(el).click();
    await settle();
    await settle();
    expect(el.querySelector('[role="alert"]')!.textContent).toBe("Couldn't run the simulation. Try again.");
  });

  test("keyboard: Enter in the action field and ⌘/Ctrl+Enter in the context run it; the trace toggles", async () => {
    let calls = 0;
    const el = await make("clean", { action: "Look up an invoice", evaluate: () => (calls++, RESULT) });
    actionField(el).focus();
    // Enter submits the form, as a browser does
    el.querySelector("form")!.requestSubmit();
    await settle();
    expect(calls).toBe(1);
    key(contextField(el), "Enter", { ctrlKey: true });
    await settle();
    expect(calls).toBe(2);
    key(contextField(el), "Enter");
    await settle();
    expect(calls).toBe(2);
    const toggle = el.querySelector<HTMLButtonElement>(".ui-psim__trace-toggle")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)!.hidden).toBe(false);
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)!.hidden).toBe(true);
  });

  test("examples: a toolbar with one tab stop; a chip fills the form", async () => {
    const el = await make("standard", { examples: [{ label: "Refund", action: "Refund $2,400", ruleClass: "spend", context: "amount: 2400" }, { label: "Lookup", action: "Find an invoice", ruleClass: "nope" }] });
    const chips = [...el.querySelectorAll<HTMLButtonElement>(".ui-psim__example")];
    expect(el.querySelector('[role="toolbar"]')).toBeTruthy();
    expect(chips.map((c) => c.tabIndex)).toEqual([0, -1]);
    chips[0].focus();
    key(chips[0], "ArrowRight");
    expect(document.activeElement).toBe(chips[1]);
    const changes: PolicySimInputChange[] = [];
    el.addEventListener("tc-input-change", (e) => changes.push((e as CustomEvent<PolicySimInputChange>).detail));
    chips[0].click();
    await settle();
    expect(changes[0]).toEqual({ field: "example", input: { action: "Refund $2,400", ruleClass: "spend", context: "amount: 2400" } });
    expect(actionField(el).value).toBe("Refund $2,400");
    expect(select(el).value).toBe("spend");
    // An unknown class keeps the current one
    chips[1].click();
    await settle();
    expect(select(el).value).toBe("spend");
    expect(contextField(el).value).toBe("");
  });

  test("controlled: preventDefault() keeps the fields; a prevented tc-simulate skips evaluate", async () => {
    let calls = 0;
    const el = await make("standard", { action: "Refund", evaluate: () => (calls++, RESULT) });
    el.addEventListener("tc-input-change", (e) => e.preventDefault());
    type(actionField(el), "Something else");
    await settle();
    expect(actionField(el).value).toBe("Refund");
    expect(el.action).toBe("Refund");
    el.addEventListener("tc-simulate", (e) => e.preventDefault());
    run(el).click();
    await settle();
    expect(calls).toBe(0);
    // The app sets the result itself
    el.result = STOP;
    await settle();
    expect(el.querySelector(".ui-psim__verdict-label")!.textContent).toContain("Hard stop");
  });

  test("a result goes out of date when the inputs change; labels can be renamed", async () => {
    const el = await make("standard", { action: "Refund", result: RESULT });
    expect(el.querySelector(".ui-psim__stale")).toBeNull();
    type(actionField(el), "Refund twice");
    await settle();
    expect(el.querySelector(".ui-psim__result")!.hasAttribute("data-stale")).toBe(true);
    expect(el.querySelector(".ui-psim__stale")!.textContent).toContain("simulate again");
    el.decisionLabels = { "require-approval": "Review" };
    await settle();
    expect(el.querySelector(".ui-psim__verdict-label")!.textContent).toBe("Decision: Review");
  });

  test("focus stays in the element when the trace goes away", async () => {
    const el = await make("standard", { result: RESULT });
    const toggle = el.querySelector<HTMLButtonElement>(".ui-psim__trace-toggle")!;
    toggle.focus();
    el.result = { ...RESULT, trace: [] };
    await settle();
    expect(el.querySelector(".ui-psim__trace-toggle")).toBeNull();
    expect(el.contains(document.activeElement)).toBe(true);
  });

  test("React wrapper: an uncontrolled value and result survive parent re-renders; callbacks fire", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(PolicySimulator, {
        title: "Try the policy",
        defaultValue: { action: "Refund", ruleClass: "spend" },
        evaluate: () => RESULT,
        onChange: (i, f) => void seen.push(["change", i.action, f]),
        onSimulate: (i) => void seen.push(["simulate", i.ruleClass]),
        onResult: (r) => void seen.push(["result", r.decision]),
        "data-n": n,
      } as React.ComponentProps<typeof PolicySimulator>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-policy-simulator")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Try the policy");
    expect(select(el).value).toBe("spend");
    type(actionField(el), "Refund $2,400");
    await settle();
    run(el).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(actionField(el).value).toBe("Refund $2,400");
    expect(el.querySelector(".ui-psim__verdict")!.getAttribute("data-decision")).toBe("require-approval");
    expect(seen).toEqual([
      ["change", "Refund $2,400", "action"],
      ["simulate", "spend"],
      ["result", "require-approval"],
    ]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled value stays until the parent changes it; onSimulate false skips evaluate", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[] = [];
    let calls = 0;
    await act(async () =>
      root.render(React.createElement(PolicySimulator, { value: { action: "Refund" }, onChange: (i) => void asked.push(i.action), onSimulate: () => false, evaluate: () => (calls++, RESULT) })),
    );
    await settle();
    const el = host.querySelector("tc-policy-simulator")!;
    type(actionField(el), "Refund more");
    await settle();
    expect(asked).toEqual(["Refund more"]);
    expect(actionField(el).value).toBe("Refund");
    run(el).click();
    await settle();
    expect(calls).toBe(0);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-policy-simulator description="Try it first." action="Refund" .result=${RESULT} .examples=${[{ label: "Refund", action: "Refund" }]}></tc-policy-simulator>
        <tc-policy-simulator look="clean" action="Delete" .result=${STOP}></tc-policy-simulator>
        <tc-policy-simulator look="clean"></tc-policy-simulator>
      </div>`);
      const [, b] = wrap.querySelectorAll<TcPolicySimulator>("tc-policy-simulator");
      // One out of date
      type(actionField(b), "Delete more");
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
