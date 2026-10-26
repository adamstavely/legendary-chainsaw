/*
 * <tc-combobox> in real browsers – the pilot's accessibility, form and windowing checks (audit/lit-port-plan.md,
 * acceptance checks 1, 3, 7 and 9).
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/combobox";
import type { ComboboxOption, TcCombobox } from "../../src/elements/combobox";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const OPTIONS: ComboboxOption[] = [
  { value: "ana", label: "Ana Lima", hint: "Design", group: "People", avatar: true },
  { value: "ben", label: "Ben Ito", hint: "Engineering", group: "People" },
  { value: "bug", label: "Bug", group: "Labels", color: "#d93d42" },
  { value: "docs", label: "Docs", group: "Labels", color: "#2f74e0" },
];

const parts = (el: TcCombobox) => ({
  input: el.querySelector<HTMLInputElement>("input[role=combobox]")!,
  list: () => el.querySelector<HTMLElement>("[role=listbox]"),
  options: () => [...el.querySelectorAll<HTMLElement>("[role=option]")],
  chips: () => [...el.querySelectorAll<HTMLElement>(".ui-cbx__chips > .ui-cbx__chip:not(.ui-cbx__more):not([data-leaving])")].map((c) => c.querySelector(".ui-cbx__chip-label")!.textContent),
});
const key = (target: HTMLElement, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-combobox", () => {
  test("ARIA: the input controls the listbox and points at the active option (light DOM ids connect)", async () => {
    const el = await fixture<TcCombobox>(html`<tc-combobox label="Assignees" .options=${OPTIONS}></tc-combobox>`);
    const { input, list, options } = parts(el);
    expect(input.getAttribute("aria-expanded")).toBe("false");
    input.focus();
    key(input, "ArrowDown");
    await settle();
    expect(el.open).toBe(true);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(input.getAttribute("aria-controls")!)).toBe(list());
    key(input, "ArrowDown");
    await settle();
    const active = document.getElementById(input.getAttribute("aria-activedescendant")!)!;
    expect(active.getAttribute("role")).toBe("option");
    expect(active.textContent).toContain("Ben Ito");
    expect(options().length).toBe(4);
    expect(document.getElementById(list()!.getAttribute("aria-labelledby")!)!.textContent).toBe("Assignees");
  });

  test("Enter picks, Backspace twice removes the last chip, Escape closes", async () => {
    const el = await fixture<TcCombobox>(html`<tc-combobox label="Assignees" .options=${OPTIONS}></tc-combobox>`);
    const { input, chips } = parts(el);
    input.focus();
    key(input, "ArrowDown");
    await settle();
    key(input, "Enter");
    await settle();
    expect(el.value).toEqual(["ana"]);
    expect(chips()).toEqual(["Ana Lima"]);
    expect(el.querySelector(".ui-cbx__live")!.textContent).toBe("Ana Lima selected. 1 selected");
    key(input, "Backspace");
    await settle();
    expect(el.value).toEqual(["ana"]);
    key(input, "Backspace");
    await settle();
    expect(el.value).toEqual([]);
    key(input, "Escape");
    await settle();
    expect(el.open).toBe(false);
  });

  test("typing filters and marks the match; creatable offers to create what's missing", async () => {
    const el = await fixture<TcCombobox>(html`<tc-combobox label="Labels" creatable .options=${OPTIONS}></tc-combobox>`);
    const { input, options } = parts(el);
    input.focus();
    input.value = "do";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(options().map((o) => o.textContent!.trim())).toEqual(["Docs", "Create “do”"]);
    expect(el.querySelector("mark")!.textContent).toBe("Do");
    key(input, "ArrowDown");
    await settle();
    key(input, "Enter");
    await settle();
    expect(el.value).toEqual(["do"]);
  });

  test("controlled: preventDefault on tc-value-change keeps the value", async () => {
    const onChange = vi.fn((e: CustomEvent) => e.preventDefault());
    const el = await fixture<TcCombobox>(html`<tc-combobox label="Assignees" .options=${OPTIONS} .value=${["ben"]} @tc-value-change=${onChange}></tc-combobox>`);
    const { input } = parts(el);
    input.focus();
    key(input, "ArrowDown");
    await settle();
    key(input, "Enter");
    await settle();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].detail.value).toEqual(["ben", "ana"]);
    expect(el.value).toEqual(["ben"]);
    el.value = onChange.mock.calls[0][0].detail.value;
    await settle();
    expect(parts(el).chips()).toEqual(["Ben Ito", "Ana Lima"]);
  });

  test("forms: submits every value under its name, required blocks an empty submit, reset restores", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><tc-combobox name="who" required label="Assignees" .options=${OPTIONS} .value=${["ana", "bug"]}></tc-combobox></form>`);
    const el = form.querySelector<TcCombobox>("tc-combobox")!;
    expect(new FormData(form).getAll("who")).toEqual(["ana", "bug"]);
    expect(form.checkValidity()).toBe(true);
    el.value = [];
    await settle();
    expect(new FormData(form).getAll("who")).toEqual([]);
    expect(form.checkValidity()).toBe(false);
    form.reset();
    await settle();
    expect(el.value).toEqual(["ana", "bug"]);
    expect(new FormData(form).getAll("who")).toEqual(["ana", "bug"]);
  });

  test("a page <label for> names the input", async () => {
    const wrap = await fixture(html`<div><label for="who">Reviewers</label><tc-combobox id="who" .options=${OPTIONS}></tc-combobox></div>`);
    const input = wrap.querySelector<HTMLInputElement>("input[role=combobox]")!;
    const ids = input.getAttribute("aria-labelledby")!.split(" ");
    expect(ids.map((id) => document.getElementById(id)!.textContent)).toEqual(["Reviewers"]);
    const result = await axe.run(wrap, { runOnly: ["label", "aria-input-field-name"] });
    expect(result.violations).toEqual([]);
  });

  test("5,000 options: only the rows in view render, with their positions; opening stays fast", async () => {
    const many = Array.from({ length: 5000 }, (_, i) => ({ value: `v${i}`, label: `Option ${i}` }));
    const el = await fixture<TcCombobox>(html`<tc-combobox label="Many" .options=${many}></tc-combobox>`);
    const { input, options } = parts(el);
    input.focus();
    const t = performance.now();
    key(input, "ArrowDown");
    await settle();
    const ms = performance.now() - t;
    expect(options().length).toBeLessThan(100);
    expect(options()[0].getAttribute("aria-setsize")).toBe("5000");
    key(input, "ArrowUp");
    await settle();
    const active = document.getElementById(input.getAttribute("aria-activedescendant")!)!;
    expect(active.textContent).toContain("Option 4999");
    expect(active.getAttribute("aria-posinset")).toBe("5000");
    expect(ms).toBeLessThan(150);
  });

  test("Clean keeps one line: chips that don't fit go into +N, which names them", async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ value: `t${i}`, label: `Topic number ${i}` }));
    const el = await fixture<TcCombobox>(html`<tc-combobox look="clean" label="Topics" style="width:320px" .options=${many} .value=${many.map((o) => o.value)}></tc-combobox>`);
    await settle();
    await settle();
    const more = el.querySelector<HTMLButtonElement>(".ui-cbx__more button")!;
    expect(more.getAttribute("aria-label")).toMatch(/^\d+ more selected: /);
    const inner = el.querySelector<HTMLElement>(".ui-cbx__field-inner")!;
    expect(inner.scrollHeight).toBeLessThanOrEqual(inner.clientHeight + 1);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`axe, list open (${look})`, async () => {
      const el = await fixture<TcCombobox>(html`<tc-combobox look=${look} label="Assignees" .options=${OPTIONS} .value=${["ana"]}></tc-combobox>`);
      const { input } = parts(el);
      input.focus();
      key(input, "ArrowDown");
      await settle();
      await new Promise((r) => setTimeout(r, 400));
      const result = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
