/*
 * <tc-output-schema-builder> in real browsers: the helpers, the head, the tree and its keyboard, editing, the toolbar,
 * the rendered preview and how it lights with the tree, problems on their rows, controlled use, the form, the React
 * wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/output-schema-builder";
import { sampleFromFields, schemaFieldError, schemaFromFields, schemaIssues, validateOutputSample, type OutputSchemaField, type TcOutputSchemaBuilder } from "../../src/elements/output-schema-builder";
import { OutputSchemaBuilder } from "../../src/elements/react/output-schema-builder";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const FIELDS: OutputSchemaField[] = [
  { name: "summary", type: "string", required: true, description: "One sentence" },
  { name: "priority", type: "string", required: true, enum: ["low", "high"] },
  { name: "customer", type: "object", required: false, fields: [{ name: "email", type: "string", required: true }, { name: "seats", type: "integer", required: false }] },
  { name: "tags", type: "array", required: false },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (value: OutputSchemaField[] = FIELDS, look: "standard" | "clean" = "standard") =>
  fixture<TcOutputSchemaBuilder>(html`<tc-output-schema-builder look=${look} heading="Triage" .value=${value}></tc-output-schema-builder>`);
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-osb__row")];
const keys = (el: Element) => rows(el).map((r) => r.querySelector(".ui-osb__key")!.textContent);
const active = (el: Element) => el.querySelector<HTMLElement>('.ui-osb__row[tabindex="0"]')!;
const press = async (target: Element, key: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const tool = (el: Element, label: string) => el.querySelector<HTMLButtonElement>(`.ui-osb__tool[title="${label}"]`)!;

describe("helpers", () => {
  test("schemaFromFields: closed objects, required, enums, descriptions, lists", () => {
    expect(schemaFromFields(FIELDS)).toEqual({
      type: "object",
      properties: {
        summary: { type: "string", description: "One sentence" },
        priority: { type: "string", enum: ["low", "high"] },
        customer: { type: "object", properties: { email: { type: "string" }, seats: { type: "integer" } }, required: ["email"], additionalProperties: false },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["summary", "priority"],
      additionalProperties: false,
    });
    expect(schemaFromFields([{ name: "rows", type: "array", itemType: "object", required: true, fields: [{ name: "n", type: "number", required: true }] }]).properties!.rows).toEqual({
      type: "array",
      items: { type: "object", properties: { n: { type: "number" } }, required: ["n"], additionalProperties: false },
    });
  });

  test("sampleFromFields and validateOutputSample agree", () => {
    const sample = sampleFromFields(FIELDS);
    expect(sample).toEqual({ summary: "text", priority: "low", customer: { email: "text", seats: 1 }, tags: ["text"] });
    expect(validateOutputSample(sample, schemaFromFields(FIELDS))).toEqual([]);
    expect(validateOutputSample({ summary: 1, priority: "mid", extra: true }, schemaFromFields(FIELDS))).toEqual(["$.summary: expected string.", "$.priority: value is not in the allowed list.", "$.extra: unexpected field."]);
    expect(validateOutputSample({}, schemaFromFields([{ name: "toString", type: "string", required: true }]))).toHaveLength(1);
  });

  test("schemaIssues: names, duplicates, empty and repeated values, empty objects", () => {
    const bad: OutputSchemaField[] = [
      { name: "", type: "string", required: true },
      { name: "a", type: "string", required: true, enum: [] },
      { name: "a", type: "string", required: true, enum: ["x", "x"] },
      { name: "o", type: "object", required: true, fields: [] },
    ];
    expect(schemaIssues(bad).map((i) => [i.path.join("/"), i.level, i.message])).toEqual([
      ["0", "error", "Give the field a name"],
      ["1", "error", "List at least one allowed value, or allow any text"],
      ["2", "error", "Another field here is already called “a”"],
      ["2", "error", "“x” is listed twice"],
      ["3", "warning", "An empty object can't hold anything – add a field"],
    ]);
    expect(schemaIssues(bad).map((i) => i.short)).toEqual(["No name", "No allowed values", "Name used twice", "“x” twice", "Empty"]);
    expect(schemaFieldError(bad)).toBe("Give the field a name");
    expect(schemaFieldError(FIELDS)).toBe("");
  });
});

describe("tc-output-schema-builder", () => {
  test("host, looks, the head, the tree's rows with glyphs, types and marks; the preview", async () => {
    const el = await mount();
    expect(el.dataset.ui).toBe("osb");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("group");
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Triage");
    expect(el.querySelectorAll(".ui-osb__card")).toHaveLength(1);
    expect(el.querySelector(".ui-osb__card")!.contains(el.querySelector(".tc-head"))).toBe(false);
    expect(el.querySelector(".tc-head__title")!.tagName).toBe("H3");
    expect(el.querySelector(".tc-head__aside .ui-osb__pill")).toBeTruthy();
    expect(keys(el)).toEqual(["summary", "priority", "customer", "email", "seats", "tags"]);
    const tree = el.querySelector('[role="tree"]')!;
    expect(tree.getAttribute("aria-labelledby")).toBe(el.getAttribute("aria-labelledby"));
    const r = rows(el);
    expect(r.map((x) => x.getAttribute("aria-level"))).toEqual(["1", "1", "1", "2", "2", "1"]);
    expect(r[2].getAttribute("aria-expanded")).toBe("true");
    expect(r[3].getAttribute("aria-posinset")).toBe("1");
    expect(r[3].getAttribute("aria-setsize")).toBe("2");
    expect(r.map((x) => x.querySelector(".ui-osb__glyph")!.textContent)).toEqual(["abc", "abc", "{ }", "abc", "123", "[ ]"]);
    expect(r[5].querySelector(".ui-osb__type")!.textContent).toBe("string[]");
    expect(r[0].textContent).toContain(", required");
    expect(r[2].textContent).toContain(", optional");
    expect(r[1].querySelector(".ui-osb__enum")!.textContent).toContain("low · high");
    expect(el.querySelector(".ui-osb__pill")!.textContent).toBe("6 fields");
    // The preview renders the answer: each key, its value and its type, objects nested
    expect(el.preview).toBe("output");
    expect(el.querySelector("tc-code-block")).toBeNull();
    const props = [...el.querySelectorAll<HTMLElement>(".ui-osb__prop")];
    expect(props.map((p) => [p.querySelector(".ui-osb__pkey")!.textContent, p.querySelector(":scope > .ui-osb__pline .ui-osb__ptype")!.textContent])).toEqual([
      ["summary", "string"],
      ["priority", "enum"],
      ["customer?", "object"],
      ["email", "string"],
      ["seats?", "integer"],
      ["tags?", "string[]"],
    ]);
    expect(props[0].querySelector(".ui-osb__pval")!.textContent).toBe("One sentence");
    expect([...props[1].querySelector(".ui-osb__pval")!.children].map((c) => c.textContent)).toEqual(["low", "or 1 other"]);
    expect(props[2].querySelector(".ui-osb__obj .ui-osb__prop")).toBe(props[3]);
    expect(props[4].querySelector(".ui-osb__pval")!.textContent).toBe("1");
    expect(el.querySelector(".ui-osb__out")!.getAttribute("aria-label")).toBe("What the model returns, with each value's type");
    el.preview = "sample";
    await settle();
    const code = el.querySelector("tc-code-block")!;
    expect(JSON.parse(code.code)).toEqual(sampleFromFields(FIELDS));
    expect(code.filename).toBe("sample.json");
    el.look = "clean";
    el.flat = true;
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-osb__card")).toBeNull();
    expect(el.querySelector<HTMLElement>("tc-code-block")!.dataset.look).toBe("clean");
  });

  test("Output / JSON / Schema: the segmented control's own event stops here; tc-preview-change is cancelable", async () => {
    const el = await mount();
    const outer: string[] = [];
    document.body.addEventListener("tc-value-change", (e) => outer.push((e.target as Element).tagName));
    const seen: string[] = [];
    on(el, "tc-preview-change", (e) => seen.push(e.detail.preview));
    const opt = [...el.querySelectorAll<HTMLButtonElement>("tc-segmented-control .ui-seg__opt")].find((b) => b.textContent!.includes("Schema"))!;
    opt.click();
    await settle();
    expect(seen).toEqual(["schema"]);
    expect(outer).toEqual([]);
    expect(el.preview).toBe("schema");
    expect(JSON.parse(el.querySelector("tc-code-block")!.code)).toEqual(schemaFromFields(FIELDS));
    on(el, "tc-preview-change", (e) => e.preventDefault());
    [...el.querySelectorAll<HTMLButtonElement>("tc-segmented-control .ui-seg__opt")].find((b) => b.textContent!.includes("JSON"))!.click();
    await settle();
    expect(el.preview).toBe("schema");
    expect([...el.querySelectorAll("tc-segmented-control .ui-seg__opt")].map((b) => b.querySelector(".ui-seg__text")!.textContent)).toEqual(["Output", "JSON", "Schema"]);
  });

  test("tree keyboard: arrows, Home / End, fold and step in and out", async () => {
    const el = await mount();
    active(el).focus();
    await press(document.activeElement!, "ArrowDown");
    await press(document.activeElement!, "ArrowDown");
    expect(document.activeElement!.textContent).toContain("customer");
    await press(document.activeElement!, "ArrowLeft");
    expect(keys(el)).toEqual(["summary", "priority", "customer", "tags"]);
    expect(active(el).getAttribute("aria-expanded")).toBe("false");
    await press(document.activeElement!, "ArrowRight");
    expect(keys(el)).toHaveLength(6);
    await press(document.activeElement!, "ArrowRight");
    expect(document.activeElement!.textContent).toContain("email");
    await press(document.activeElement!, "ArrowLeft");
    expect(document.activeElement!.textContent).toContain("customer");
    await press(document.activeElement!, "End");
    expect(document.activeElement!.textContent).toContain("tags");
    await press(document.activeElement!, "Home");
    expect(document.activeElement!.textContent).toContain("summary");
    expect(document.activeElement!.getAttribute("aria-selected")).toBe("true");
    expect(el.querySelectorAll('.ui-osb__row[tabindex="0"]')).toHaveLength(1);
  });

  test("Alt+arrows reorder, Delete removes and keeps focus in the tree", async () => {
    const el = await mount();
    const seen: OutputSchemaField[][] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value as OutputSchemaField[]));
    active(el).focus();
    await press(document.activeElement!, "ArrowDown", { altKey: true });
    expect(keys(el).slice(0, 2)).toEqual(["priority", "summary"]);
    expect(document.activeElement!.textContent).toContain("summary");
    expect(el.querySelector('.ui-osb__sr[role="status"]')!.textContent).toBe("Moved summary down, 2 of 4");
    await press(document.activeElement!, "ArrowUp", { altKey: true });
    expect(keys(el).slice(0, 2)).toEqual(["summary", "priority"]);
    // Nested: moves among its own siblings only
    await press(document.activeElement!, "ArrowDown");
    await press(document.activeElement!, "ArrowDown");
    await press(document.activeElement!, "ArrowDown");
    await press(document.activeElement!, "ArrowDown", { altKey: true });
    expect(el.value[2].fields!.map((f) => f.name)).toEqual(["seats", "email"]);
    await press(document.activeElement!, "Delete");
    expect(el.value[2].fields!.map((f) => f.name)).toEqual(["seats"]);
    expect(document.activeElement!.textContent).toContain("seats");
    await press(document.activeElement!, "Delete");
    expect(document.activeElement!.textContent).toContain("customer");
    expect(el.value[2].fields).toEqual([]);
    expect(el.querySelector('.ui-osb__row[data-state="warning"] .ui-osb__issue')!.textContent).toContain("An empty object");
    expect(seen).toHaveLength(5);
  });

  test("Enter opens the editor; renaming, type, required, description and allowed values; Esc returns to the row", async () => {
    const el = await mount();
    active(el).focus();
    await press(document.activeElement!, "ArrowDown");
    await press(document.activeElement!, "Enter");
    const editor = el.querySelector<HTMLElement>(".ui-osb__editor")!;
    expect(editor.getAttribute("aria-label")).toBe("Edit priority");
    const name = editor.querySelector<HTMLInputElement>(".ui-osb__name-input")!;
    expect(document.activeElement).toBe(name);
    // Allowed values: add with Enter, remove with ×, Backspace removes the last
    const add = editor.querySelector<HTMLInputElement>(".ui-osb__value-input")!;
    add.value = "urgent";
    await press(add, "Enter");
    expect(el.value[1].enum).toEqual(["low", "high", "urgent"]);
    el.querySelector<HTMLButtonElement>('.ui-osb__chip-x[aria-label="Remove low"]')!.click();
    await settle();
    expect(el.value[1].enum).toEqual(["high", "urgent"]);
    await press(el.querySelector(".ui-osb__value-input")!, "Backspace");
    expect(el.value[1].enum).toEqual(["high"]);
    // Only allowed values off: any text
    el.querySelector<HTMLButtonElement>('.ui-osb__editor [role="switch"][id$="-only"]')!.click();
    await settle();
    expect(el.value[1].enum).toBeUndefined();
    el.querySelector<HTMLButtonElement>('.ui-osb__editor [role="switch"][id$="-req"]')!.click();
    await settle();
    expect(el.value[1].required).toBe(false);
    const desc = el.querySelectorAll<HTMLInputElement>(".ui-osb__editor input")[1];
    desc.value = "How soon";
    desc.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value[1].description).toBe("How soon");
    const type = el.querySelector<HTMLSelectElement>(".ui-osb__editor select")!;
    type.value = "array";
    type.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value[1]).toMatchObject({ type: "array", itemType: "string" });
    const items = el.querySelectorAll<HTMLSelectElement>(".ui-osb__editor select")[1];
    items.value = "object";
    items.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value[1]).toMatchObject({ type: "array", itemType: "object", fields: [] });
    const nameInput = el.querySelector<HTMLInputElement>(".ui-osb__name-input")!;
    nameInput.value = "level";
    await press(nameInput, "Enter");
    expect(el.value[1].name).toBe("level");
    expect(el.querySelector(".ui-osb__editor")).toBeNull();
    expect(document.activeElement!.textContent).toContain("level");
    await press(document.activeElement!, "F2");
    await press(el.querySelector(".ui-osb__name-input")!, "Escape");
    expect(el.querySelector(".ui-osb__editor")).toBeNull();
    expect(document.activeElement!.classList.contains("ui-osb__row")).toBe(true);
  });

  test("toolbar: add after, add inside, move, remove; one tab stop", async () => {
    const el = await mount([{ name: "a", type: "string", required: true }, { name: "o", type: "object", required: true, fields: [] }]);
    const items = [...el.querySelectorAll<HTMLButtonElement>(".ui-osb__tool")];
    expect(items.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    expect(tool(el, "Add a field inside").disabled).toBe(true);
    expect(tool(el, "Move up").disabled).toBe(true);
    tool(el, "Add field").click();
    await settle();
    expect(el.value.map((f) => f.name)).toEqual(["a", "field_3", "o"]);
    expect(document.activeElement).toBe(el.querySelector(".ui-osb__name-input"));
    await press(document.activeElement!, "Escape");
    await press(document.activeElement!, "ArrowDown");
    expect(tool(el, "Add a field inside").disabled).toBe(false);
    tool(el, "Add a field inside").click();
    await settle();
    expect(el.value[2].fields!.map((f) => f.name)).toEqual(["field_1"]);
    expect(rows(el).find((r) => r.getAttribute("aria-level") === "2")).toBeTruthy();
    tool(el, "Move up").click();
    await settle();
    tool(el, "Remove field").click();
    await settle();
    expect(el.value[2].fields).toEqual([]);
    expect(el.querySelector('.ui-osb__sr[role="status"]')!.textContent).toBe("Removed field_1");
    el.value = [];
    await settle();
    expect(el.querySelector(".ui-osb__empty")!.textContent).toBe("No fields yet – add the first one.");
    tool(el, "Add field").click();
    await settle();
    expect(el.value).toEqual([{ name: "field_1", type: "string", required: true }]);
  });

  test("problems: a marker and a short note on the row, the full reason to screen readers, counted in the head", async () => {
    const el = await mount([{ name: "a", type: "string", required: true }, { name: "a", type: "string", required: false, enum: [] }]);
    const bad = rows(el)[1];
    expect(bad.dataset.state).toBe("error");
    const issue = bad.querySelector<HTMLElement>(".ui-osb__issue")!;
    expect(bad.querySelectorAll(".ui-osb__issue")).toHaveLength(1);
    expect(issue.querySelector("svg")).toBeTruthy();
    expect(issue.querySelector('span[aria-hidden="true"]')!.textContent).toBe("Name used twice +1");
    expect(issue.querySelector(".ui-osb__sr")!.textContent).toBe(", problem: Another field here is already called “a”, problem: List at least one allowed value, or allow any text");
    expect(issue.title).toBe("Another field here is already called “a”. List at least one allowed value, or allow any text");
    expect(el.querySelector(".tc-head__aside .ui-osb__pill")!.textContent).toBe("2 problems");
    expect(el.querySelector('.ui-osb__prop[data-state="error"] .ui-osb__v-none')!.textContent).toBe("no allowed values");
    expect(el.checkValidity()).toBe(false);
    expect(el.issues).toHaveLength(2);
  });

  test("the tree and the preview light each other: pointing at either, the selection, and a click in the preview selects the row", async () => {
    const el = await mount();
    const lit = () => [...el.querySelectorAll(".ui-osb__prop[data-lit] > .ui-osb__pline .ui-osb__pkey")].map((k) => k.textContent);
    const litRows = () => [...el.querySelectorAll(".ui-osb__row[data-lit] .ui-osb__key")].map((k) => k.textContent);
    // The selected field is lit in both
    expect(lit()).toEqual(["summary"]);
    expect(litRows()).toEqual(["summary"]);
    rows(el)[3].dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(lit()).toEqual(["email"]);
    rows(el)[3].dispatchEvent(new PointerEvent("pointerleave"));
    el.querySelectorAll<HTMLElement>(".ui-osb__prop")[1].dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(litRows()).toEqual(["priority"]);
    el.querySelectorAll<HTMLElement>(".ui-osb__prop")[1].dispatchEvent(new PointerEvent("pointerleave"));
    // Folded: a click on a nested value opens its parent and focuses its row
    active(el).focus();
    await press(document.activeElement!, "ArrowDown");
    await press(document.activeElement!, "ArrowDown");
    await press(document.activeElement!, "ArrowLeft");
    expect(keys(el)).not.toContain("seats");
    el.querySelectorAll<HTMLElement>(".ui-osb__prop")[4].querySelector<HTMLElement>(".ui-osb__pline")!.click();
    await settle();
    expect(keys(el)).toContain("seats");
    expect(document.activeElement!.textContent).toContain("seats");
    expect(document.activeElement!.getAttribute("aria-selected")).toBe("true");
    expect(lit()).toEqual(["seats?"]);
  });

  test("controlled: preventDefault keeps the value", async () => {
    const el = await mount();
    on(el, "tc-value-change", (e) => e.preventDefault());
    active(el).focus();
    await press(document.activeElement!, "Delete");
    await press(document.activeElement!, "ArrowDown", { altKey: true });
    tool(el, "Add field").click();
    await settle();
    expect(el.value).toEqual(FIELDS);
    expect(keys(el)).toEqual(["summary", "priority", "customer", "email", "seats", "tags"]);
  });

  test("form: the schema as JSON, invalid with a problem, reset, disabled fieldset", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><fieldset><tc-output-schema-builder name="schema" .value=${FIELDS}></tc-output-schema-builder></fieldset></form>`);
    const el = form.querySelector<TcOutputSchemaBuilder>("tc-output-schema-builder")!;
    expect(JSON.parse(new FormData(form).get("schema") as string)).toEqual(schemaFromFields(FIELDS));
    expect(form.checkValidity()).toBe(true);
    el.value = [...FIELDS, { name: "summary", type: "string", required: false }];
    await settle();
    expect(form.checkValidity()).toBe(false);
    form.reset();
    await settle();
    expect(el.value).toEqual(FIELDS);
    expect(form.checkValidity()).toBe(true);
    form.querySelector("fieldset")!.disabled = true;
    await settle();
    await settle();
    expect(el.hasAttribute("data-disabled")).toBe(true);
    expect(new FormData(form).get("schema")).toBeNull();
    expect(tool(el, "Add field").disabled).toBe(true);
    active(el).focus();
    await press(document.activeElement!, "Enter");
    expect(el.querySelector(".ui-osb__editor")).toBeNull();
  });

  test("React wrapper: uncontrolled value survives a parent re-render; controlled stays with the app; title and onChange", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    const onPreviewChange = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(OutputSchemaBuilder, { title: "Triage", defaultValue: FIELDS, onChange, onPreviewChange });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcOutputSchemaBuilder>("tc-output-schema-builder")!;
    expect(el.heading).toBe("Triage");
    await act(async () => tool(el, "Add field").click());
    await settle();
    expect(onChange).toHaveBeenCalledTimes(1);
    await act(async () => rerender());
    await settle();
    expect(el.value).toHaveLength(5);
    await act(async () => [...el.querySelectorAll<HTMLButtonElement>("tc-segmented-control .ui-seg__opt")].find((b) => b.textContent!.includes("Schema"))!.click());
    await settle();
    expect(onPreviewChange).toHaveBeenCalledWith("schema");
    expect(el.preview).toBe("schema");
    await act(async () => root.render(React.createElement(OutputSchemaBuilder, { value: FIELDS, onChange })));
    await settle();
    const ctl = host.querySelector<TcOutputSchemaBuilder>("tc-output-schema-builder")!;
    await act(async () => tool(ctl, "Remove field").click());
    await settle();
    expect(onChange).toHaveBeenLastCalledWith(FIELDS.slice(1));
    expect(ctl.value).toEqual(FIELDS);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <tc-output-schema-builder .value=${FIELDS} description="What the model returns"></tc-output-schema-builder>
        <tc-output-schema-builder look="clean" heading="Clean" preview="schema" .value=${[...FIELDS, { name: "", type: "object", required: true, fields: [] }]}></tc-output-schema-builder>
        <tc-output-schema-builder look="clean" heading="Empty"></tc-output-schema-builder>
      </div>`);
      const first = wrap.querySelector<TcOutputSchemaBuilder>("tc-output-schema-builder")!;
      first.querySelector<HTMLElement>('.ui-osb__row[tabindex="0"]')!.focus();
      await press(document.activeElement!, "ArrowDown");
      await press(document.activeElement!, "Enter");
      await settle();
      for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns transitions off", () => {
    const css = (customElements.get("tc-output-schema-builder") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion[^{]*\{[^}]*transition: none !important/);
  });
});
