/*
 * <tc-gate-config> in real browsers: the sentence, every control, controlled use, the form, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/gate-config";
import { describeGate, type GateConfigValue, type TcGateConfig } from "../../src/elements/gate-config";
import { GateConfig } from "../../src/elements/react/gate-config";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const VALUE: GateConfigValue = { triggers: ["low-confidence", "irreversible"], reviewer: "lead", view: "evidence", actions: ["approve", "send-back", "reject"], reason: "Refunds over the limit need a person." };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (value: GateConfigValue = VALUE, look: "standard" | "clean" = "standard") =>
  fixture<TcGateConfig>(html`<tc-gate-config look=${look} .value=${value}></tc-gate-config>`);
const sw = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-gc__switch[data-id="${id}"]`)!;
const box = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-gc__check[data-id="${id}"]`)!;
const sentence = (el: Element) => el.querySelector(".ui-gc__sentence")!.textContent;
const segOption = (el: Element, label: string) =>
  [...el.querySelectorAll<HTMLButtonElement>("tc-segmented-control .ui-seg__opt")].find((b) => {
    // Standard draws the label twice (regular and an aria-hidden bold copy that keeps the width)
    const text = b.querySelector(".ui-seg__label")!.textContent!.trim();
    return text === label || text === label + label;
  })!;

describe("describeGate", () => {
  test("the sentence, with the conditions in their listed order", () => {
    expect(describeGate(VALUE)).toBe("Pauses when confidence is low or the next action can't be undone, for a team lead to review the output with its evidence. They may approve, send back or reject.");
    expect(describeGate({ ...VALUE, triggers: [] })).toBe("Never pauses – turn on a condition.");
    expect(describeGate({ ...VALUE, triggers: ["no-source"], view: "trace", reviewer: "owner", actions: [] })).toBe(
      "Pauses when a claim has no source, for whoever started the run to review the full trace. They can't answer yet – allow at least one action.",
    );
    // An app's own words
    expect(
      describeGate({ triggers: ["x"], reviewer: "r", view: "v", actions: ["ok"], reason: "" }, { conditions: [{ id: "x", label: "Amount is over $500" }], reviewers: [{ id: "r", label: "Finance" }], views: [{ id: "v", label: "Summary" }], actions: [{ id: "ok", label: "Sign off" }] }),
    ).toBe("Pauses when amount is over $500, for finance to review summary. They may sign off.");
  });
});

describe("tc-gate-config", () => {
  test("the host is the root and a group named by the heading, in either look; flat drops the card", async () => {
    const el = await mount();
    expect(el.dataset.ui).toBe("gcfg");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("group");
    expect(el.getAttribute("aria-label")).toBe("Review gate");
    expect(el.querySelector(".ui-gc__card")).toBeTruthy();
    expect(el.querySelector(".ui-gc__pill")!.textContent).toBe("Pauses on 2 of 5");
    el.look = "clean";
    el.heading = "Before refunds go out";
    el.description = "Step 4 · Review";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-gc__card")).toBeNull();
    expect(el.getAttribute("aria-label")).toBe("Before refunds go out");
    expect(el.querySelector(".ui-gc__sub")!.textContent).toBe("Step 4 · Review");
    expect(el.querySelector<HTMLElement>("tc-segmented-control")!.dataset.look).toBe("clean");
    el.look = "standard";
    el.flat = true;
    await settle();
    expect(el.hasAttribute("flat")).toBe(true);
    expect(el.querySelector(".ui-gc__card")).toBeNull();
    // A page's own name is kept
    const named = await fixture<TcGateConfig>(html`<tc-gate-config aria-label="Gate 2"></tc-gate-config>`);
    expect(named.getAttribute("aria-label")).toBe("Gate 2");
  });

  test("conditions are switches named by their label and described by their line", async () => {
    const el = await mount();
    const s = sw(el, "low-confidence");
    expect(s.getAttribute("role")).toBe("switch");
    expect(s.getAttribute("aria-checked")).toBe("true");
    expect(document.getElementById(s.getAttribute("aria-labelledby")!)!.textContent).toBe("Confidence is low");
    expect(document.getElementById(s.getAttribute("aria-describedby")!)!.textContent).toBe("The agent rates its own answer under the threshold");
    expect(sw(el, "no-source").getAttribute("aria-checked")).toBe("false");
    const seen: GateConfigValue[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value as GateConfigValue));
    sw(el, "no-source").click();
    await settle();
    // Kept in the listed order
    expect(seen[0].triggers).toEqual(["low-confidence", "no-source", "irreversible"]);
    expect(el.value.triggers).toEqual(["low-confidence", "no-source", "irreversible"]);
    expect(sw(el, "no-source").getAttribute("aria-checked")).toBe("true");
    // Clicking the label text flips it too
    el.querySelector<HTMLLabelElement>(`label[for="${sw(el, "low-confidence").id}"]`)!.click();
    await settle();
    expect(el.value.triggers).toEqual(["no-source", "irreversible"]);
    // Space on a focused switch (a native button)
    sw(el, "irreversible").focus();
    sw(el, "irreversible").click();
    sw(el, "no-source").click();
    await settle();
    expect(el.value.triggers).toEqual([]);
    expect(el.querySelector(".ui-gc__pill")!.textContent).toBe("Never pauses");
    expect(sentence(el)).toBe("Never pauses – turn on a condition.");
  });

  test("reviewer select, what they see and the note", async () => {
    const el = await mount();
    const seen: GateConfigValue[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value as GateConfigValue));
    const select = el.querySelector<HTMLSelectElement>("select")!;
    expect(select.value).toBe("lead");
    expect(document.getElementById(select.getAttribute("aria-labelledby")!)!.textContent).toBe("Reviewer");
    select.value = "on-call";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.reviewer).toBe("on-call");
    // The segmented control's own event stops at the gate
    const outer: string[] = [];
    document.body.addEventListener("tc-value-change", (e) => outer.push((e.target as Element).tagName), { once: false });
    segOption(el, "Full trace").click();
    await settle();
    expect(el.value.view).toBe("trace");
    expect(outer).toEqual(["TC-GATE-CONFIG"]);
    expect(el.querySelector(".ui-gc__view .ui-gc__hint")!.textContent).toBe("Every step, tool call and source of the run");
    const note = el.querySelector<HTMLTextAreaElement>("textarea")!;
    expect(note.value).toBe("Refunds over the limit need a person.");
    note.value = "Customers see this – a person checks the tone.";
    note.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.reason).toBe("Customers see this – a person checks the tone.");
    expect(seen.map((v) => [v.reviewer, v.view, v.reason])).toEqual([
      ["on-call", "evidence", "Refunds over the limit need a person."],
      ["on-call", "trace", "Refunds over the limit need a person."],
      ["on-call", "trace", "Customers see this – a person checks the tone."],
    ]);
    // An unknown reviewer asks for one
    el.value = { ...el.value, reviewer: "gone" };
    await settle();
    expect(select.value).toBe("");
    expect(select.options[0].textContent).toBe("Pick a reviewer");
  });

  test("actions are a group of checkboxes; none is an error, no way to approve is a hint", async () => {
    const el = await mount();
    const group = el.querySelector('.ui-gc__checks[role="group"]')!;
    expect(document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent).toBe("They may");
    expect([...group.querySelectorAll('[role="checkbox"]')].map((b) => [b.querySelector(".ui-gc__check-label")!.textContent, b.getAttribute("aria-checked")])).toEqual([
      ["Approve", "true"],
      ["Edit and approve", "false"],
      ["Send back", "true"],
      ["Escalate", "false"],
      ["Reject", "true"],
    ]);
    box(el, "escalate").click();
    await settle();
    expect(el.value.actions).toEqual(["approve", "send-back", "escalate", "reject"]);
    box(el, "approve").click();
    await settle();
    expect(el.querySelector(".ui-gc__actions .ui-gc__hint")!.textContent).toBe("Nothing gets approved here – the run can only go back or stop");
    for (const id of ["send-back", "escalate", "reject"]) box(el, id).click();
    await settle();
    expect(el.value.actions).toEqual([]);
    const err = el.querySelector(".ui-gc__error")!;
    expect(err.textContent).toContain("Allow at least one action");
    expect(group.getAttribute("aria-describedby")).toBe(err.id);
  });

  test("controlled: preventDefault keeps the value; the sentence is announced after a change only", async () => {
    const el = await mount();
    const status = el.querySelector('[role="status"]')!;
    expect(status.textContent).toBe("");
    on(el, "tc-value-change", (e) => e.preventDefault());
    sw(el, "personal-data").click();
    box(el, "edit").click();
    await settle();
    expect(el.value).toEqual(VALUE);
    expect(sw(el, "personal-data").getAttribute("aria-checked")).toBe("false");
    expect(box(el, "edit").getAttribute("aria-checked")).toBe("false");
    expect(status.textContent).toBe("");
    el.value = { ...VALUE, triggers: ["personal-data"] };
    await settle();
    expect(status.textContent).toBe(sentence(el));
    expect(status.textContent).toContain("Pauses when it touches personal data");
  });

  test("its own conditions, reviewers, views and actions", async () => {
    const el = await fixture<TcGateConfig>(html`<tc-gate-config
      .conditions=${[{ id: "big", label: "Amount is over $500" }]}
      .reviewers=${[{ id: "fin", label: "Finance" }]}
      .views=${[]}
      .actions=${[{ id: "ok", label: "Sign off" }]}
      .value=${{ triggers: ["big"], reviewer: "fin", view: "", actions: ["ok"], reason: "" }}
    ></tc-gate-config>`);
    expect(el.querySelectorAll(".ui-gc__switch")).toHaveLength(1);
    expect(el.querySelector("tc-segmented-control")).toBeNull();
    expect(el.querySelector(".ui-gc__cond-desc")).toBeNull();
    expect(sw(el, "big").hasAttribute("aria-describedby")).toBe(false);
    expect(sentence(el)).toBe("Pauses when amount is over $500, for finance to review the output. They may sign off.");
  });

  test("form: JSON value, invalid without an action, reset, disabled fieldset", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><fieldset><tc-gate-config name="gate" .value=${VALUE}></tc-gate-config></fieldset></form>`);
    const el = form.querySelector<TcGateConfig>("tc-gate-config")!;
    expect(JSON.parse(new FormData(form).get("gate") as string)).toEqual(VALUE);
    expect(form.checkValidity()).toBe(true);
    for (const id of ["approve", "send-back", "reject"]) box(el, id).click();
    await settle();
    expect(form.checkValidity()).toBe(false);
    form.reset();
    await settle();
    expect(el.value).toEqual(VALUE);
    expect(form.checkValidity()).toBe(true);
    form.querySelector("fieldset")!.disabled = true;
    await settle();
    await settle();
    expect(el.hasAttribute("data-disabled")).toBe(true);
    expect(new FormData(form).get("gate")).toBeNull();
    expect(sw(el, "low-confidence").disabled).toBe(true);
    expect(box(el, "approve").disabled).toBe(true);
    expect(el.querySelector("select")!.disabled).toBe(true);
    expect(el.querySelector("textarea")!.disabled).toBe(true);
  });

  test("React wrapper: uncontrolled value survives a parent re-render; controlled stays with the app; title and onChange", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(GateConfig, { title: "Refund review", defaultValue: VALUE, onChange });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcGateConfig>("tc-gate-config")!;
    expect(el.heading).toBe("Refund review");
    await act(async () => sw(el, "no-source").click());
    await settle();
    expect(onChange).toHaveBeenCalledWith({ ...VALUE, triggers: ["low-confidence", "no-source", "irreversible"] });
    await act(async () => rerender());
    await settle();
    expect(el.value.triggers).toEqual(["low-confidence", "no-source", "irreversible"]);
    await act(async () => root.render(React.createElement(GateConfig, { value: VALUE, onChange })));
    await settle();
    const ctl = host.querySelector<TcGateConfig>("tc-gate-config")!;
    await act(async () => box(ctl, "escalate").click());
    await settle();
    expect(onChange).toHaveBeenLastCalledWith({ ...VALUE, actions: ["approve", "send-back", "escalate", "reject"] });
    expect(ctl.value).toEqual(VALUE);
    expect(box(ctl, "escalate").getAttribute("aria-checked")).toBe("false");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <tc-gate-config .value=${VALUE} description="Step 4 · Review"></tc-gate-config>
        <tc-gate-config look="clean" heading="Clean" .value=${{ ...VALUE, actions: [] }}></tc-gate-config>
        <tc-gate-config look="clean" heading="Clean off" .value=${{ ...VALUE, triggers: [], actions: ["escalate"] }}></tc-gate-config>
        <div style="background: var(--tc-surface-raised); padding: 16px"><tc-gate-config flat heading="Flat" .value=${VALUE}></tc-gate-config></div>
      </div>`);
      await settle();
      for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns transitions and the sentence fade off", () => {
    const css = (customElements.get("tc-gate-config") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion[^{]*\{\s*\.ui-gc__sentence \{ animation: none; \}/);
  });
});
