/*
 * <tc-ai-column-create> in real browsers: the fields and their labels, variables and the chips that insert them,
 * problems in words, the choices field, Try with its preview, Create, the switch, narrow width, the React wrapper and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/ai-column-create";
import { aiColumnProblems, promptVariables, type AiColumnRequest, type AiColumnValue, type AiColumnValueChange, type TcAiColumnCreate } from "../../src/elements/ai-column-create";
import { AiColumnCreate } from "../../src/elements/react/ai-column-create";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const COLUMNS = [
  { id: "vendor", label: "Vendor" },
  { id: "website", label: "Website" },
];
const MODELS = [
  { id: "fast", label: "Fast model" },
  { id: "careful", label: "Careful model" },
];
const GOOD: AiColumnValue = { name: "Industry", type: "text", options: [], prompt: "What industry is {{vendor}} in?", model: "fast", web: false };

const make = (look: "standard" | "clean" = "standard", value?: AiColumnValue) =>
  fixture<TcAiColumnCreate>(
    html`<tc-ai-column-create look=${look} estimate="2,000 rows · about 3 min" .columns=${COLUMNS} .models=${MODELS} .value=${value ?? { ...GOOD, name: "", prompt: "" }}></tc-ai-column-create>`,
  );
const field = <T extends HTMLElement = HTMLInputElement>(el: Element, f: string) => el.querySelector<T>(`[data-field="${f}"]`)!;
async function type(input: HTMLInputElement | HTMLTextAreaElement, text: string) {
  input.focus();
  input.value = text;
  input.setSelectionRange(text.length, text.length);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
}
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;

describe("tc-ai-column-create", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: labelled fields, the column chips, the estimate and both actions`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("aic");
      expect(el.dataset.look).toBe(look);
      for (const f of ["name", "type", "prompt", "model"]) expect(el.querySelector(`label[for="${field(el, f).id}"]`)).not.toBeNull();
      expect(field(el, "web").getAttribute("role")).toBe("switch");
      expect([...el.querySelectorAll(".ui-aic__chip")].map((c) => c.textContent!.trim())).toEqual(["Vendor {{vendor}}", "Website {{website}}"]);
      expect(el.querySelector(".ui-aic__estimate")!.textContent).toBe("2,000 rows · about 3 min");
      expect(el.querySelector(".ui-aic__try")!.getAttribute("aria-disabled")).toBe("true");
      expect(el.querySelector(".ui-aic__create")!.getAttribute("aria-disabled")).toBe("true");
      expect(field<HTMLSelectElement>(el, "model").value).toBe("fast");
    });
  }

  test("helpers: the variables a prompt uses, and its problems in words", () => {
    expect(promptVariables("{{vendor}} at {{ website }}, again {{vendor}}")).toEqual(["vendor", "website"]);
    expect(aiColumnProblems(GOOD, COLUMNS)).toEqual({});
    expect(aiColumnProblems({ ...GOOD, name: " ", prompt: "" }, COLUMNS)).toEqual({ name: "Name the column", prompt: "Write the prompt" });
    expect(aiColumnProblems({ ...GOOD, prompt: "{{city}} and {{vendor}}" }, COLUMNS)).toEqual({ prompt: "The table has no column {{city}}" });
    expect(aiColumnProblems({ ...GOOD, type: "choice", options: ["One"] }, COLUMNS)).toEqual({ options: "Give at least two choices" });
  });

  test("typing fires tc-value-change with the field; prevented, the value stays", async () => {
    const el = await make();
    const seen: AiColumnValueChange[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<AiColumnValueChange>).detail));
    await type(field(el, "name"), "Industry");
    expect(seen[0].field).toBe("name");
    expect(seen[0].value.name).toBe("Industry");
    expect(el.value.name).toBe("Industry");
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    await type(field(el, "name"), "Sector");
    expect(el.value.name).toBe("Industry");
  });

  test("a chip inserts {{column}} at the caret; an unknown variable is called out", async () => {
    const el = await make();
    const prompt = field<HTMLTextAreaElement>(el, "prompt");
    await type(prompt, "Industry of  please");
    prompt.setSelectionRange(12, 12);
    el.querySelector<HTMLButtonElement>(".ui-aic__chip")!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    el.querySelector<HTMLButtonElement>(".ui-aic__chip")!.click();
    await settle();
    expect(el.value.prompt).toBe("Industry of {{vendor}} please");
    expect(status(el)).toBe("Inserted {{vendor}}");
    await expect.poll(() => document.activeElement).toBe(prompt);
    expect(el.querySelector(".ui-aic__chip")!.hasAttribute("data-used")).toBe(true);
    await type(prompt, "Where is {{city}}?");
    const unknown = el.querySelector(".ui-aic__chip[data-unknown]")!;
    expect(unknown.textContent).toContain("{{city}}");
    prompt.dispatchEvent(new Event("blur"));
    await settle();
    expect(el.querySelector(".ui-aic__problem")!.textContent).toContain("The table has no column {{city}}");
    expect(prompt.getAttribute("aria-invalid")).toBe("true");
  });

  test("Create with problems shows them all, focuses the first and fires nothing", async () => {
    const el = await make();
    let fired = 0;
    el.addEventListener("tc-create", () => fired++);
    el.querySelector<HTMLButtonElement>(".ui-aic__create")!.click();
    await settle();
    expect(fired).toBe(0);
    expect([...el.querySelectorAll(".ui-aic__problem")].map((p) => p.textContent!.trim())).toEqual(["Name the column", "Write the prompt"]);
    await expect.poll(() => document.activeElement).toBe(field(el, "name"));
    expect(status(el)).toBe("Name the column");
  });

  test("the choices field shows for a choice column and needs two choices", async () => {
    const el = await make("standard", GOOD);
    expect(field(el, "options")).toBeNull();
    const type = field<HTMLSelectElement>(el, "type");
    type.value = "choice";
    type.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    const options = field(el, "options");
    expect(options).not.toBeNull();
    options.value = "Software";
    options.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-aic__create")!.click();
    await settle();
    expect(el.querySelector(".ui-aic__problem")!.textContent).toContain("Give at least two choices");
    options.value = "Software, Logistics";
    options.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.options).toEqual(["Software", "Logistics"]);
    expect(el.querySelector(".ui-aic__problem")).toBeNull();
  });

  test("Try fires tc-preview and waits; the preview's rows show and are announced", async () => {
    const el = await make("standard", GOOD);
    let column: AiColumnValue | null = null;
    el.addEventListener("tc-preview", (e) => (column = (e as CustomEvent<AiColumnRequest>).detail.column));
    el.querySelector<HTMLButtonElement>(".ui-aic__try")!.click();
    await settle();
    expect(column!.prompt).toBe(GOOD.prompt);
    expect(el.previewing).toBe(true);
    expect(el.querySelector(".ui-aic__preview")!.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelector(".ui-aic__try")!.getAttribute("aria-disabled")).toBe("true");
    el.preview = [
      { id: "a", label: "Northwind", value: "Software" },
      { id: "b", label: "Cedarfield", state: "failed", error: "No website" },
      { id: "c", label: "Harborstone", value: "Printing" },
    ];
    await settle();
    expect(el.previewing).toBe(false);
    expect([...el.querySelectorAll(".ui-aic__prow")].map((r) => r.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Northwind Software", "Cedarfield No website", "Harborstone Printing"]);
    expect(status(el)).toBe("Preview ready – 3 rows");
  });

  test("Create fires tc-create with the column and the default model; the web switch toggles", async () => {
    const el = await make("standard", { ...GOOD, model: "" });
    const web = field(el, "web");
    web.click();
    await settle();
    expect(el.value.web).toBe(true);
    let column: AiColumnValue | null = null;
    el.addEventListener("tc-create", (e) => (column = (e as CustomEvent<AiColumnRequest>).detail.column));
    el.querySelector<HTMLButtonElement>(".ui-aic__create")!.click();
    await settle();
    expect(column).toMatchObject({ name: "Industry", model: "fast", web: true });
    expect(status(el)).toBe("Creating Industry");
  });

  test("narrow: the paired fields stack", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    wrap.style.width = "340px";
    wrap.innerHTML = `<tc-ai-column-create></tc-ai-column-create>`;
    await settle(wrap);
    const el = wrap.querySelector<TcAiColumnCreate>("tc-ai-column-create")!;
    expect(getComputedStyle(el.querySelector(".ui-aic__row2")!).gridTemplateColumns.split(" ")).toHaveLength(1);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React: uncontrolled edits survive re-renders; a controlled value stays until the parent changes it", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const seen: string[] = [];
    const render = (props: Partial<React.ComponentProps<typeof AiColumnCreate>>) =>
      act(async () => root.render(React.createElement(AiColumnCreate, { title: "Column", columns: COLUMNS, models: MODELS, ...props })));
    await render({ defaultValue: GOOD, onValueChange: (v, f) => void seen.push(`${f} ${v.name}`), onCreate: (c) => void seen.push(`create ${c.name}`) });
    const el = wrap.querySelector<TcAiColumnCreate>("tc-ai-column-create")!;
    await settle(wrap);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Column");
    await type(field(el, "name"), "Sector");
    await render({ defaultValue: GOOD, onValueChange: () => {}, onCreate: (c) => void seen.push(`create ${c.name}`) });
    await settle(wrap);
    expect(el.value.name).toBe("Sector");
    el.querySelector<HTMLButtonElement>(".ui-aic__create")!.click();
    await settle(wrap);
    expect(seen).toEqual(["name Sector", "create Sector"]);
    await render({ value: GOOD, onValueChange: () => {} });
    await settle(wrap);
    await type(field(el, "name"), "Other");
    expect(el.value.name).toBe("Industry");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.cssText = `color-scheme: ${theme}`;
      wrap.innerHTML = `<tc-ai-column-create look="standard" estimate="2,000 rows"></tc-ai-column-create><tc-ai-column-create look="clean"></tc-ai-column-create>`;
      const [a, b] = wrap.querySelectorAll<TcAiColumnCreate>("tc-ai-column-create");
      for (const el of [a, b]) {
        el.columns = COLUMNS;
        el.models = MODELS;
      }
      a.value = { ...GOOD, type: "choice", options: ["A", "B"], prompt: "{{vendor}} {{city}}" };
      a.preview = [
        { id: "a", label: "Northwind", value: "Software" },
        { id: "b", label: "Cedarfield", state: "running" },
      ];
      await settle(wrap);
      a.querySelector<HTMLButtonElement>(".ui-aic__create")!.click();
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
