/*
 * <tc-tool-configuration> in real browsers: the head, the lead block, the doc table read and edited in place, allowed
 * values, moving and removing with focus, the validation strip, approval, Example call, the schema, controlled use, the
 * form, React and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/tool-configuration";
import { toolExampleCall, toolInputSchema, validateTool, type TcToolConfiguration, type ToolConfigurationValue } from "../../src/elements/tool-configuration";
import { ToolConfiguration } from "../../src/elements/react/tool-configuration";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const VALUE: ToolConfigurationValue = {
  name: "search_orders",
  description: "Find a customer's orders.",
  parameters: [
    { name: "query", type: "string", required: true, description: "Email or order number" },
    { name: "status", type: "string", required: false, description: "Only orders in this state", enum: ["open", "shipped"] },
    { name: "limit", type: "integer", required: false, description: "How many", enum: ["5", "10"] },
  ],
  approval: "auto",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<any>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (look: "standard" | "clean" = "standard", value = VALUE) => fixture<TcToolConfiguration>(html`<tc-tool-configuration look=${look} .value=${value}></tc-tool-configuration>`);
const $ = <T extends Element = HTMLElement>(el: Element, sel: string) => el.querySelector<T>(sel)!;
const field = <T extends HTMLElement = HTMLInputElement>(el: Element, f: string) => $<T>(el, `[data-field="${f}"]`);
const type = (input: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const twice = async () => {
  await settle();
  await settle();
};
const editRow = async (el: Element, i: number) => {
  $<HTMLButtonElement>(el, `[data-edit="${i}"]`).click();
  await twice();
};

describe("toolInputSchema and validateTool", () => {
  test("the schema: one property per named parameter, enums typed, required listed", () => {
    expect(toolInputSchema(VALUE)).toEqual({
      type: "object",
      properties: {
        query: { type: "string", description: "Email or order number" },
        status: { type: "string", description: "Only orders in this state", enum: ["open", "shipped"] },
        limit: { type: "integer", description: "How many", enum: [5, 10] },
      },
      required: ["query"],
      additionalProperties: false,
    });
    expect(toolInputSchema({ name: "x", description: "", parameters: [{ name: "", type: "boolean", required: true, description: "" }], approval: "" })).toEqual({ type: "object", properties: {}, additionalProperties: false });
  });

  test("problems and suggestions", () => {
    expect(validateTool(VALUE)).toEqual([]);
    expect(
      validateTool({
        name: "1 bad",
        description: "",
        parameters: [
          { name: "", type: "string", required: false, description: "" },
          { name: "a", type: "integer", required: false, description: "", enum: ["1.5"] },
          { name: "a", type: "number", required: false, description: "x", enum: ["two"] },
        ],
        approval: "auto",
      }).map((x) => [x.level, x.field, x.message]),
    ).toEqual([
      ["error", "name", "Use only letters, digits, _ and - in the name, starting with a letter."],
      ["warning", "description", "Describe what it does – the model reads this to decide when to call it."],
      ["error", "param:0:name", "Parameter 1 has no name."],
      ["error", "param:1:enum", "a: “1.5” isn't a whole number."],
      ["warning", "param:1:description", "Describe a so the model fills it in well."],
      ["error", "param:2:name", "Two parameters are called “a”."],
      ["error", "param:2:enum", "a: “two” isn't a number."],
    ]);
    expect(validateTool({ ...VALUE, name: "" })[0].message).toBe("Name the tool.");
  });
});

describe("tc-tool-configuration", () => {
  for (const look of ["standard", "clean"] as const)
    test(`${look}: the host, the name as the title, the lead block and the parameters as a doc table`, async () => {
      const el = await mount(look);
      expect(el.dataset.ui).toBe("tdef");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("group");
      const title = document.getElementById(el.getAttribute("aria-labelledby")!)!;
      expect(title.tagName).toBe("H3");
      expect(title.textContent).toBe("search_orders");
      expect($(el, ".tc-head__icon svg")).toBeTruthy();
      expect(!!el.querySelector(".ui-tdef__card")).toBe(look === "standard");
      // Standard: the head sits on the tray, outside the card
      if (look === "standard") expect($(el, ".ui-tdef__card").contains($(el, ".tc-head"))).toBe(false);
      expect(el.signature).toBe('search_orders(query: string, status?: "open" | "shipped", limit?: 5 | 10)');
      expect($(el, ".ui-tdef__code .ui-tdef__sr").textContent).toBe(`Signature: ${el.signature}`);
      expect($(el, ".ui-tdef__sig-desc").textContent).toBe("Find a customer's orders.");
      expect($<HTMLSelectElement>(el, ".ui-tdef__approval-select").value).toBe("auto");
      // Nothing is a form until something is opened
      expect(el.querySelector("input")).toBeNull();
      const table = $(el, '[role="table"]');
      expect(document.getElementById(table.getAttribute("aria-labelledby")!)!.textContent).toBe("Parameters3");
      expect([...table.querySelectorAll('[role="columnheader"]')].map((h) => h.textContent)).toEqual(["Name", "Type", "Description", "Edit"]);
      const rows = [...el.querySelectorAll<HTMLElement>('.ui-tdef__param[role="row"]')];
      expect(rows.map((r) => [r.querySelector('[role="cell"]')!.textContent!.replace(/\s+/g, " ").trim(), [...r.querySelectorAll(".ui-tdef__read-type, .ui-tdef__read-enum")].map((x) => x.textContent).join(" ")])).toEqual([
        ["query required", "string"],
        ["status optional", "string enum"],
        ["limit optional", "integer enum"],
      ]);
      expect([...rows[1].querySelectorAll(".ui-tdef__val")].map((v) => v.textContent)).toEqual(['"open"', '"shipped"']);
      expect(rows[0].getAttribute("aria-label")).toBe("Parameter 1 of 3: query");
      expect($(el, ".ui-tdef__summary-head").textContent!.trim()).toBe("Valid – the schema is ready to use");
    });

  test("Edit opens the name and description in place; Escape and Done close it; a new tool starts open", async () => {
    const el = await mount();
    const edit = $<HTMLButtonElement>(el, ".ui-tdef__edit-head");
    expect(edit.getAttribute("aria-expanded")).toBe("false");
    edit.click();
    await twice();
    expect(document.activeElement).toBe(field(el, "name"));
    expect(edit.getAttribute("aria-expanded")).toBe("true");
    const seen: ToolConfigurationValue[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value));
    type(field(el, "name"), "find_orders");
    type(field<HTMLTextAreaElement>(el, "description"), "Look orders up.");
    await settle();
    expect(seen.map((v) => [v.name, v.description])).toEqual([
      ["find_orders", "Find a customer's orders."],
      ["find_orders", "Look orders up."],
    ]);
    expect(el.signature.startsWith("find_orders(")).toBe(true);
    key(field(el, "name"), "Escape");
    await twice();
    expect(el.querySelector('[data-field="name"]')).toBeNull();
    expect(document.activeElement).toBe(edit);
    // Clicking the name in the signature opens it too
    $(el, ".ui-tdef__tok-fn").click();
    await twice();
    expect(document.activeElement).toBe(field(el, "name"));
    $<HTMLButtonElement>(el, ".ui-tdef__edit-head").click();
    await twice();
    expect(el.querySelector('[data-field="name"]')).toBeNull();
    const blank = await fixture<TcToolConfiguration>(html`<tc-tool-configuration></tc-tool-configuration>`);
    expect(blank.querySelector('[data-field="name"]')).toBeTruthy();
    expect($(blank, ".ui-tdef__tok-fn").textContent).toBe("unnamed");
    expect(blank.querySelector(".tc-head__title")!.textContent).toBe("New tool");
    expect($(blank, ".ui-tdef__empty").textContent).toBe("No parameters – the tool is called with nothing.");
    // Typing a name keeps the fields open
    type(field(blank, "name"), "lookup");
    await settle();
    expect(blank.querySelector('[data-field="name"]')).toBeTruthy();
  });

  test("a parameter opens in place: name, type, required, description; Done and Escape close it and return focus", async () => {
    const el = await mount();
    await editRow(el, 0);
    const row = $(el, '.ui-tdef__param[data-mode="edit"]');
    expect(row.getAttribute("aria-label")).toBe("Parameter 1 of 3: query");
    expect(document.activeElement).toBe(field(el, "param:0:name"));
    const seen: ToolConfigurationValue[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value));
    type(field(el, "param:0:name"), "q");
    const select = field<HTMLSelectElement>(el, "param:0:type");
    select.value = "integer";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    field(el, "param:0:required").click();
    type(field(el, "param:0:description"), "Anything");
    await settle();
    expect(seen.at(-1)!.parameters[0]).toEqual({ name: "q", type: "integer", required: false, description: "Anything" });
    $<HTMLButtonElement>(row, ".ui-tdef__done").click();
    await twice();
    expect(el.querySelector('[data-mode="edit"]')).toBeNull();
    expect(document.activeElement).toBe($(el, '[data-edit="0"]'));
    await editRow(el, 1);
    key(field(el, "param:1:description"), "Escape");
    await twice();
    expect(document.activeElement).toBe($(el, '[data-edit="1"]'));
    // Clicking a parameter in the signature, or its row, opens it
    el.querySelectorAll<HTMLElement>(".ui-tdef__tok-param")[2].click();
    await twice();
    expect(document.activeElement).toBe(field(el, "param:2:name"));
  });

  test("allowed values are chips: Enter or comma adds, Backspace on empty removes the last, × removes one", async () => {
    const el = await mount();
    await editRow(el, 1);
    const input = field(el, "param:1:enum");
    expect(document.getElementById(input.getAttribute("aria-labelledby")!)!.textContent).toBe("Allowed");
    type(input, "delivered");
    key(input, "Enter");
    await settle();
    expect(el.value.parameters[1].enum).toEqual(["open", "shipped", "delivered"]);
    type(field(el, "param:1:enum"), "refunded, open,  late");
    key(field(el, "param:1:enum"), ",");
    await settle();
    expect(el.value.parameters[1].enum).toEqual(["open", "shipped", "delivered", "refunded", "late"]);
    expect(field(el, "param:1:enum").value).toBe("");
    key(field(el, "param:1:enum"), "Backspace");
    await settle();
    expect(el.value.parameters[1].enum).toEqual(["open", "shipped", "delivered", "refunded"]);
    $<HTMLButtonElement>(el, '[aria-label="Remove shipped"]').click();
    await twice();
    expect(el.value.parameters[1].enum).toEqual(["open", "delivered", "refunded"]);
    expect(document.activeElement).toBe(field(el, "param:1:enum"));
    // Booleans have no allowed values
    const select = field<HTMLSelectElement>(el, "param:1:type");
    select.value = "boolean";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.querySelector('[data-field="param:1:enum"]')).toBeNull();
  });

  test("add focuses the new name; move by buttons and Alt+arrows keeps focus with the row; remove moves focus on", async () => {
    const el = await mount();
    $<HTMLButtonElement>(el, ".ui-tdef__add").click();
    await twice();
    expect(el.value.parameters).toHaveLength(4);
    expect(document.activeElement).toBe(field(el, "param:3:name"));
    expect($(el, '[role="status"]').textContent).toBe("Parameter 4 added.");
    type(field(el, "param:3:name"), "page");
    await settle();
    $<HTMLButtonElement>(el, '.ui-tdef__move[data-dir="up"]').click();
    await twice();
    expect(el.value.parameters.map((p) => p.name)).toEqual(["query", "status", "page", "limit"]);
    expect(document.activeElement).toBe($(el, '.ui-tdef__param[data-mode="edit"] .ui-tdef__move[data-dir="up"]'));
    expect($(el, '[role="status"]').textContent).toBe("page moved to position 3 of 4.");
    key(field(el, "param:2:name"), "ArrowUp", { altKey: true });
    await twice();
    expect(el.value.parameters.map((p) => p.name)).toEqual(["query", "page", "status", "limit"]);
    expect(document.activeElement).toBe(field(el, "param:1:name"));
    // In the read view too: Alt+↓ on a row's Edit button
    $<HTMLButtonElement>(el, ".ui-tdef__done").click();
    await twice();
    $<HTMLButtonElement>(el, '[data-edit="0"]').focus();
    key($(el, '[data-edit="0"]'), "ArrowDown", { altKey: true });
    await twice();
    expect(el.value.parameters.map((p) => p.name)).toEqual(["page", "query", "status", "limit"]);
    expect(document.activeElement).toBe($(el, '[data-edit="1"]'));
    await editRow(el, 3);
    $<HTMLButtonElement>(el, ".ui-tdef__remove").click();
    await twice();
    expect(el.value.parameters.map((p) => p.name)).toEqual(["page", "query", "status"]);
    expect(document.activeElement).toBe($(el, '[data-edit="2"]'));
    expect($(el, '[role="status"]').textContent).toBe("limit removed.");
  });

  test("the summary lists problems and suggestions; each opens and focuses its field; problems make the form invalid", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><tc-tool-configuration name="tool" .value=${VALUE}></tc-tool-configuration></form>`);
    const el = form.querySelector<TcToolConfiguration>("tc-tool-configuration")!;
    expect($(el, ".ui-tdef__summary-head").textContent!.trim()).toBe("Valid – the schema is ready to use");
    expect(form.checkValidity()).toBe(true);
    expect(JSON.parse(new FormData(form).get("tool") as string)).toEqual(VALUE);
    el.value = { ...VALUE, description: "", parameters: [...VALUE.parameters, { name: "query", type: "number", required: false, description: "dup", enum: ["x"] }] };
    await settle();
    expect($(el, ".ui-tdef__summary-head").textContent!.trim()).toBe("2 problems to fix · 1 suggestion");
    expect(form.checkValidity()).toBe(false);
    expect([...el.querySelectorAll(".ui-tdef__issue")].map((b) => b.textContent)).toEqual([
      "Suggestion: Describe what it does – the model reads this to decide when to call it.",
      "Problem: Two parameters are called “query”.",
      "Problem: query: “x” isn't a number.",
    ]);
    expect(el.querySelectorAll(".ui-tdef__param[data-error] .ui-tdef__read-error")).toHaveLength(2);
    el.querySelector<HTMLButtonElement>('.ui-tdef__issue[data-target="param:3:enum"]')!.click();
    await twice();
    expect(document.activeElement).toBe(field(el, "param:3:enum"));
    expect(field(el, "param:3:enum").getAttribute("aria-invalid")).toBe("true");
    el.querySelector<HTMLButtonElement>('.ui-tdef__issue[data-target="description"]')!.click();
    await twice();
    expect(document.activeElement).toBe(field(el, "description"));
    form.reset();
    await settle();
    expect(el.value).toEqual(VALUE);
    expect(form.checkValidity()).toBe(true);
  });

  test("approval is a compact picker in the head; the JSON Schema opens on request", async () => {
    const el = await mount();
    const select = $<HTMLSelectElement>(el, ".tc-head__aside .ui-tdef__approval-select");
    expect(select.getAttribute("aria-label")).toBe("Before it runs");
    expect([...select.options].map((o) => [o.value, o.textContent, o.selected])).toEqual([
      ["inherit", "Follows tool permissions", false],
      ["ask", "Ask every time", false],
      ["auto", "Runs on its own", true],
    ]);
    expect(document.getElementById(select.getAttribute("aria-describedby")!)!.textContent).toBe("For tools that only read – lookups and searches");
    const seen: string[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value.approval));
    select.value = "ask";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(seen).toEqual(["ask"]);
    expect(el.value.approval).toBe("ask");
    expect(document.getElementById(select.getAttribute("aria-describedby")!)!.textContent).toBe("A person approves each call before it runs");
    const toggle = $<HTMLButtonElement>(el, ".ui-tdef__schema-toggle");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(el.querySelector("tc-code-block")).toBeNull();
    toggle.click();
    await settle();
    const block = el.querySelector<HTMLElement & { code: string; language: string }>("tc-code-block")!;
    expect(block.language).toBe("json");
    expect(JSON.parse(block.code)).toEqual(el.schema);
    el.approvals = [];
    el.showSchema = false;
    await settle();
    expect(el.querySelector(".ui-tdef__approval-select")).toBeNull();
    expect(el.querySelector(".ui-tdef__schema")).toBeNull();
  });

  test("Example call: made from the parameters, or the app's own; pointing at a row lights its argument", async () => {
    expect(toolExampleCall(VALUE)).toEqual({ query: "<query>", status: "open", limit: 5 });
    expect(toolExampleCall({ ...VALUE, parameters: [{ name: "n", type: "number", required: true, description: "" }, { name: "b", type: "boolean", required: false, description: "" }, { name: "", type: "string", required: false, description: "" }] })).toEqual({ n: 1.5, b: true });
    const el = await mount();
    const json = () => $(el, ".ui-tdef__json");
    expect(document.getElementById($(el, ".ui-tdef__example").getAttribute("aria-labelledby")!)!.textContent).toBe("Example call");
    expect(JSON.parse(json().querySelector(".ui-tdef__sr")!.textContent!)).toEqual(el.exampleCall);
    expect(json().querySelector("code")!.textContent!.replace(/\s+/g, "")).toBe('{"query":"<query>","status":"open","limit":5}');
    el.querySelectorAll(".ui-tdef__param")[1].dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect([...el.querySelectorAll(".ui-tdef__j-line[data-hot] .ui-tdef__j-key")].map((k) => k.textContent)).toEqual(['"status"']);
    expect(el.querySelectorAll(".ui-tdef__tok-param")[1].hasAttribute("data-hot")).toBe(true);
    el.example = { query: "dana@example.com", limit: 10 };
    await settle();
    expect(json().querySelector("code")!.textContent!.replace(/\s+/g, "")).toBe('{"query":"dana@example.com","limit":10}');
    el.showExample = false;
    await settle();
    expect(el.querySelector(".ui-tdef__example")).toBeNull();
  });

  test("controlled: preventDefault keeps the value; disabled turns everything off", async () => {
    const el = await mount();
    on(el, "tc-value-change", (e) => e.preventDefault());
    await editRow(el, 0);
    type(field(el, "param:0:name"), "zzz");
    $<HTMLButtonElement>(el, ".ui-tdef__add").click();
    await settle();
    expect(el.value).toEqual(VALUE);
    expect(field(el, "param:0:name").value).toBe("query");
    el.disabled = true;
    await settle();
    expect(el.hasAttribute("data-disabled")).toBe(true);
    expect(field(el, "param:0:name").disabled).toBe(true);
    expect($<HTMLButtonElement>(el, ".ui-tdef__add").disabled).toBe(true);
    expect($<HTMLButtonElement>(el, ".ui-tdef__edit-head").disabled).toBe(true);
    expect($<HTMLSelectElement>(el, ".ui-tdef__approval-select").disabled).toBe(true);
  });

  test("React wrapper: uncontrolled survives a re-render; controlled stays with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(ToolConfiguration, { title: "Order search", defaultValue: VALUE, onChange });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcToolConfiguration>("tc-tool-configuration")!;
    expect(el.heading).toBe("Order search");
    const pick = (target: TcToolConfiguration, v: string) => {
      const select = target.querySelector<HTMLSelectElement>(".ui-tdef__approval-select")!;
      select.value = v;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    };
    await act(async () => pick(el, "ask"));
    await settle();
    expect(onChange).toHaveBeenCalledWith({ ...VALUE, approval: "ask" });
    await act(async () => rerender());
    await settle();
    expect(el.value.approval).toBe("ask");
    await act(async () => root.render(React.createElement(ToolConfiguration, { value: VALUE, onChange })));
    await settle();
    const ctl = host.querySelector<TcToolConfiguration>("tc-tool-configuration")!;
    await act(async () => pick(ctl, "inherit"));
    await settle();
    expect(onChange).toHaveBeenLastCalledWith({ ...VALUE, approval: "inherit" });
    expect(ctl.value).toEqual(VALUE);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const bad: ToolConfigurationValue = { ...VALUE, parameters: [...VALUE.parameters, { name: "query", type: "number", required: false, description: "", enum: ["x"] }] };
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-tool-configuration .value=${VALUE} description="Orders"></tc-tool-configuration>
        <tc-tool-configuration look="clean" heading="Clean" .value=${bad}></tc-tool-configuration>
        <tc-tool-configuration heading="Blank"></tc-tool-configuration>
      </div>`);
      const [a, b] = wrap.querySelectorAll<TcToolConfiguration>("tc-tool-configuration");
      await editRow(a, 1);
      await editRow(b, 3);
      a.querySelector<HTMLButtonElement>(".ui-tdef__schema-toggle")!.click();
      await settle();
      for (const x of document.getAnimations()) if (x.effect?.getTiming().iterations !== Infinity) x.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns animation and transitions off", () => {
    const css = (customElements.get("tc-tool-configuration") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion[^{]*\{\s*\[data-ui="tdef"\] \*[^{]*\{ animation: none !important; transition: none !important; \}/);
  });
});
