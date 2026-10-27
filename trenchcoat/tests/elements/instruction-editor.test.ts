/*
 * <tc-instruction-editor> in real browsers: highlighted variables, missing and unused warnings, the token count, the
 * diff against a chosen version, restore, save as a new version, controlled use, the form, the wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/instruction-editor";
import { instructionVariables, type InstructionEditorValue, type InstructionVariable, type InstructionVersion, type TcInstructionEditor } from "../../src/elements/instruction-editor";
import { InstructionEditor } from "../../src/elements/react/instruction-editor";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const VARS: InstructionVariable[] = [
  { name: "company", description: "Trading name" },
  { name: "order_id", description: "The order" },
];
const V1: InstructionVersion = { id: "a", label: "v1", value: { role: "system", text: "Help customers of {{company}} with orders." }, note: "First", by: "Priya", at: "Monday" };
const V2: InstructionVersion = { id: "b", label: "v2", value: { role: "system", text: "Help customers of {{company}} with order {{order_id}}." }, note: "Order lookup" };
const VALUE: InstructionEditorValue = { role: "system", text: "Help customers of {{company}} in a {{tone}} voice." };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- event details differ per test
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (value = VALUE, look: "standard" | "clean" = "standard") =>
  fixture<TcInstructionEditor>(html`<tc-instruction-editor look=${look} .value=${value} .variables=${VARS} .versions=${[V1, V2]}></tc-instruction-editor>`);
const field = (el: Element) => el.querySelector<HTMLTextAreaElement>(".ui-ied__input")!;
const type = (el: Element, text: string) => {
  const f = field(el);
  f.value = text;
  f.dispatchEvent(new Event("input", { bubbles: true }));
};
// diffWords splits on words and punctuation, so the braces stay put and only the names change
const DIFF = ["DEL removed: with order", "INS added: in a", "DEL removed: order_id", "INS added: tone", "INS added:  voice"];
const STATS = "+4 −3";
const flat = (n: Element | null) => n!.textContent!.replace(/\s+/g, " ").trim();

describe("instructionVariables", () => {
  test("counts each {{name}}, spaces inside the braces allowed", () => {
    expect([...instructionVariables("Hi {{name}}, {{ name }} and {{order.id}}; not {name} or {{1x}}")]).toEqual([
      ["name", 2],
      ["order.id", 1],
    ]);
  });
});

describe("tc-instruction-editor", () => {
  test("the host is a group named by the heading; both looks; the textarea is named by it too", async () => {
    const el = await mount();
    expect(el.dataset.ui).toBe("ied");
    expect(el.getAttribute("role")).toBe("group");
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Instructions");
    expect(document.getElementById(field(el).getAttribute("aria-labelledby")!)!.textContent).toBe("Instructions");
    // Standard: the header on the tray, above the card
    expect(el.querySelector(':scope > .tc-head + .ui-ied__card')).toBeTruthy();
    expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Edited since v2");
    el.look = "clean";
    await settle();
    expect(el.querySelector(".ui-ied__card")).toBeNull();
    expect(el.querySelector(":scope > .tc-head + .ui-ied__body")).toBeTruthy();
    expect(el.querySelector<HTMLElement>("tc-segmented-control")!.dataset.look).toBe("clean");
  });

  test("the code surface: one numbered line per line, variables as chips, unknown ones as missing", async () => {
    const el = await mount({ role: "system", text: "Help {{company}}\n\nin a {{tone}} voice." });
    const chips = [...el.querySelectorAll<HTMLElement>(".ui-ied__mirror .ui-ied__chip")];
    expect(chips.map((m) => [m.textContent, m.hasAttribute("data-missing")])).toEqual([
      ["{{company}}", false],
      ["{{tone}}", true],
    ]);
    const mirror = el.querySelector(".ui-ied__mirror")!;
    expect(mirror.getAttribute("aria-hidden")).toBe("true");
    // The mirror carries the same text as the field, a line per line (an empty one holds a zero-width space)
    expect([...mirror.querySelectorAll(".ui-ied__line")].map((l) => l.textContent!.replace("\u200b", ""))).toEqual(["Help {{company}}", "", "in a {{tone}} voice."]);
    expect(el.querySelector(".ui-ied__status")!.textContent).toContain("3 lines · 2 variables");
    // The textarea's own text is transparent – the mirror is what shows
    expect(getComputedStyle(field(el)).color).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(field(el).getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(field(el).getAttribute("aria-describedby")!)!.textContent).toBe("Uses variables the app doesn't define: tone");
  });

  test("the variables: used, not used, not defined, with a summary", async () => {
    const el = await mount();
    const rows = [...el.querySelectorAll<HTMLElement>(".ui-ied__var")];
    expect(rows.map((r) => [r.querySelector(".ui-ied__var-name")!.textContent, r.dataset.status, r.querySelector(".ui-ied__var-status")!.textContent])).toEqual([
      ["{{company}}", "ok", "1×"],
      ["{{order_id}}", "unused", "not used"],
      ["{{tone}}", "missing", "not defined"],
    ]);
    // A defined one is a button that inserts it; a missing one isn't
    expect(rows[0].querySelector("button")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Insert {{company}}1×, Trading name");
    expect(rows[2].querySelector("button")).toBeNull();
    expect(flat(el.querySelector(".ui-ied__warn"))).toBe("1 variable isn't defined – the app can't fill it in · 1 defined variable isn't used.");
    expect(el.variableUses.map((u) => u.status)).toEqual(["ok", "unused", "missing"]);
    // No variables at all
    el.variables = [];
    el.value = { role: "system", text: "Plain." };
    await settle();
    expect(el.querySelector(".ui-ied__none")!.textContent).toContain("None yet");
  });

  test("Insert puts {{name}} at the caret and keeps focus in the editor", async () => {
    const el = await mount({ role: "system", text: "Order: ." });
    const f = field(el);
    f.focus();
    f.setSelectionRange(7, 7);
    const btn = [...el.querySelectorAll<HTMLElement>(".ui-ied__var")].find((r) => r.textContent!.includes("order_id"))!.querySelector<HTMLButtonElement>("button")!;
    expect(btn.textContent).toContain("Insert {{order_id}}");
    btn.click();
    await settle();
    expect(el.value.text).toBe("Order: {{order_id}}.");
    expect(document.activeElement).toBe(f);
    expect(f.selectionStart).toBe(19);
  });

  test("typing fires tc-value-change; the role switch too", async () => {
    const el = await mount();
    const seen: InstructionEditorValue[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value as InstructionEditorValue));
    type(el, "Help {{company}}.");
    await settle();
    expect(seen[0]).toEqual({ role: "system", text: "Help {{company}}." });
    const dev = [...el.querySelectorAll<HTMLButtonElement>(".ui-seg__opt")].find((b) => b.textContent!.includes("Developer"))!;
    dev.click();
    await settle();
    expect(el.value.role).toBe("developer");
    expect(seen).toHaveLength(2);
  });

  test("the token count is the app's: count, limit, over the limit, counting", async () => {
    const el = await mount();
    expect(el.querySelector(".ui-ied__tokens")).toBeNull();
    el.tokenCount = 412;
    await settle();
    expect(flat(el.querySelector(".ui-ied__tokens"))).toBe("412 tokens");
    el.tokenLimit = 400;
    await settle();
    expect(flat(el.querySelector(".ui-ied__tokens"))).toBe("412 of 400 tokens – over the limit");
    expect(el.querySelector(".ui-ied__tokens")!.getAttribute("data-state")).toBe("over");
    el.counting = true;
    await settle();
    expect(el.querySelector(".ui-ied__tokens")!.textContent).toBe("Counting tokens…");
  });

  test("the version rail and the changes tab: a word diff against the latest version, or a chosen one; Restore", async () => {
    const el = await mount();
    const radios = () => [...el.querySelectorAll<HTMLElement>('.ui-ied__versions [role="radio"]')];
    expect(el.querySelector(".ui-ied__versions")!.getAttribute("aria-label")).toBe("Compare with");
    expect(radios().map((r) => [r.querySelector(".ui-ied__node-title")!.textContent!.replace(/\s+/g, " ").trim(), r.getAttribute("aria-checked"), r.tabIndex])).toEqual([
      ["v2 Latest", "true", 0],
      ["v1", "false", -1],
    ]);
    const tabs = [...el.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    expect(tabs.map((t) => t.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Edit", `Changes since v2 ${STATS} words`]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector<HTMLElement>(`#${tabs[1].getAttribute("aria-controls")}`)!.hidden).toBe(true);
    // Tabs: arrows move between them
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    await settle();
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    const diff = el.querySelector(".ui-ied__diff")!;
    expect(diff.getAttribute("aria-label")).toBe("Changes since v2");
    expect([...diff.querySelectorAll("del, ins")].map((d) => `${d.tagName} ${d.textContent}`)).toEqual(DIFF);
    // The rail: ↓ picks the older version and shows its changes
    radios()[0].focus();
    radios()[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    await settle();
    expect(el.compareTo).toBe("a");
    expect(radios()[1].getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(radios()[1]);
    expect(radios()[1].querySelector(".ui-ied__node-meta")!.textContent).toBe("Priya · Monday");
    expect(el.querySelector(".ui-ied__diff")!.getAttribute("aria-label")).toBe("Changes since v1");
    el.querySelector<HTMLButtonElement>(".ui-ied__restore")!.click();
    await settle();
    expect(el.value).toEqual(V1.value);
    expect(el.querySelector(".ui-ied__same")!.textContent).toBe("No changes since v1.");
    expect(el.querySelector(".ui-ied__restore")).toBeNull();
    expect(el.querySelector('.ui-ied__sr[role="status"]')!.textContent).toBe("Restored v1");
    // Clicking a version picks it too
    radios()[0].click();
    await settle();
    expect(el.compareTo).toBe("b");
  });

  test("save as a new version: the note, tc-save, the list grows; nothing to save when unchanged; ⌘S / Ctrl+S", async () => {
    const el = await mount();
    const saves: Record<string, unknown>[] = [];
    on(el, "tc-save", (e) => saves.push(e.detail));
    const note = el.querySelector<HTMLInputElement>(".ui-ied__note")!;
    note.value = "Tone variable";
    note.dispatchEvent(new Event("input", { bubbles: true }));
    const btn = el.querySelector<HTMLButtonElement>(".ui-ied__primary")!;
    expect(btn.textContent!.trim()).toBe("Save as v3");
    btn.click();
    await settle();
    expect(saves).toHaveLength(1);
    expect((saves[0].version as InstructionVersion).label).toBe("v3");
    expect((saves[0].version as InstructionVersion).note).toBe("Tone variable");
    expect((saves[0].version as InstructionVersion).value).toEqual(VALUE);
    expect(el.versions.map((v) => v.label)).toEqual(["v1", "v2", "v3"]);
    expect(el.querySelector<HTMLInputElement>(".ui-ied__note")!.value).toBe("");
    expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Saved as v3");
    // Nothing changed since: the button explains and does nothing
    const again = el.querySelector<HTMLButtonElement>(".ui-ied__primary")!;
    expect(again.getAttribute("aria-disabled")).toBe("true");
    expect(document.getElementById(again.getAttribute("aria-describedby")!)!.textContent).toBe("Same as v3");
    again.click();
    await settle();
    expect(saves).toHaveLength(1);
    // The shortcut in the editor
    type(el, "New text {{company}}");
    await settle();
    const mac = /mac|iphone|ipad/i.test(navigator.userAgent);
    const ev = new KeyboardEvent("keydown", { key: "s", metaKey: mac, ctrlKey: !mac, bubbles: true, cancelable: true });
    field(el).dispatchEvent(ev);
    await settle();
    expect(ev.defaultPrevented).toBe(true);
    expect(saves).toHaveLength(2);
    expect(el.versions).toHaveLength(4);
  });

  test("controlled: preventDefault keeps the value and the versions", async () => {
    const el = await mount();
    on(el, "tc-value-change", (e) => e.preventDefault());
    on(el, "tc-save", (e) => e.preventDefault());
    type(el, "Something else");
    await settle();
    expect(el.value).toEqual(VALUE);
    expect(field(el).value).toBe(VALUE.text);
    el.save();
    await settle();
    expect(el.versions).toHaveLength(2);
  });

  test("readonly and the form", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><tc-instruction-editor name="prompt" .value=${VALUE}></tc-instruction-editor></form>`);
    const el = form.querySelector<TcInstructionEditor>("tc-instruction-editor")!;
    expect(new FormData(form).get("prompt")).toBe(VALUE.text);
    type(el, "Changed");
    await settle();
    expect(new FormData(form).get("prompt")).toBe("Changed");
    form.reset();
    await settle();
    expect(el.value).toEqual(VALUE);
    el.readonly = true;
    await settle();
    expect(field(el).readOnly).toBe(true);
    expect(el.querySelector(".ui-ied__primary, .ui-ied__note, button.ui-ied__var-btn")).toBeNull();
  });

  test("React wrapper: value and versions, onChange and onSave; controlled versions stay with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    const onSave = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(InstructionEditor, { title: "Reply assistant", defaultValue: VALUE, defaultVersions: [V1], variables: VARS, onChange, onSave });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcInstructionEditor>("tc-instruction-editor")!;
    expect(el.heading).toBe("Reply assistant");
    await act(async () => type(el, "Hello {{company}}"));
    await settle();
    expect(onChange).toHaveBeenCalledWith({ role: "system", text: "Hello {{company}}" });
    await act(async () => el.save());
    await settle();
    expect(onSave.mock.calls[0][0].label).toBe("v2");
    await act(async () => rerender());
    await settle();
    expect(el.value.text).toBe("Hello {{company}}");
    expect(el.versions.map((v) => v.label)).toEqual(["v1", "v2"]);
    await act(async () => root.render(React.createElement(InstructionEditor, { value: VALUE, versions: [V1], onSave })));
    await settle();
    const ctl = host.querySelector<TcInstructionEditor>("tc-instruction-editor")!;
    await act(async () => ctl.save());
    await settle();
    expect(ctl.versions).toEqual([V1]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <tc-instruction-editor .value=${VALUE} .variables=${VARS} .versions=${[V1, V2]} token-count="412" token-limit="400"></tc-instruction-editor>
        <tc-instruction-editor look="clean" heading="Clean" .value=${VALUE} .variables=${VARS} .versions=${[V1, V2]} token-count="120"></tc-instruction-editor>
        <tc-instruction-editor look="clean" heading="Empty" readonly></tc-instruction-editor>
      </div>`);
      await settle();
      for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns transitions off", () => {
    const css = (customElements.get("tc-instruction-editor") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\[data-ui="ied"\] \*/);
  });
});
