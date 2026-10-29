/*
 * <tc-tree-select> in real browsers: the field and the tree's ARIA, filtering that keeps parents, the tree keys,
 * single and multiple picks with cascading checkboxes, clearing, the form, controlled use, the React wrapper and axe
 * in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/tree-select";
import { flattenTree, treePath, type TcTreeSelect, type TreeOption, type TreeSelectValueChange } from "../../src/elements/tree-select";
import { TreeSelect } from "../../src/elements/react/tree-select";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const TREE: TreeOption[] = [
  {
    id: "sci",
    label: "Sciences",
    children: [
      { id: "phy", label: "Physics", children: [{ id: "opt", label: "Optics" }, { id: "aco", label: "Acoustics" }] },
      { id: "bot", label: "Botany", description: "Plants" },
    ],
  },
  { id: "hum", label: "Humanities", children: [{ id: "his", label: "History" }, { id: "res", label: "Restricted", disabled: true }] },
  { id: "map", label: "Maps" },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const field = (el: TcTreeSelect) => el.querySelector<HTMLElement>(".ui-tsel__field")!;
const items = (el: TcTreeSelect) => [...el.querySelectorAll<HTMLElement>("[role=treeitem]")];
const names = (el: TcTreeSelect) => items(el).map((i) => text(i.querySelector(".ui-tsel__name")));
const item = (el: TcTreeSelect, id: string) => el.querySelector<HTMLElement>(`[role=treeitem][data-id="${id}"]`)!;
const make = (attrs = html``, value: string | string[] | null = null, multiple = false, look = "standard") =>
  fixture<TcTreeSelect>(html`<tc-tree-select look=${look} label="Subject" .options=${TREE} .value=${value} ?multiple=${multiple}>${attrs}</tc-tree-select>`);
const openTree = async (el: TcTreeSelect) => {
  field(el).click();
  await settle();
};

describe("tc-tree-select", () => {
  test("helpers: flattenTree keeps tree order and drops repeated ids; treePath is the labels down to an id", () => {
    expect(flattenTree(TREE).map((n) => n.option.id)).toEqual(["sci", "phy", "opt", "aco", "bot", "hum", "his", "res", "map"]);
    expect(flattenTree([{ id: "a", label: "A" }, { id: "a", label: "Again" }]).length).toBe(1);
    expect(treePath(TREE, "opt")).toEqual(["Sciences", "Physics", "Optics"]);
    expect(treePath(TREE, "nope")).toEqual([]);
  });

  for (const look of ["standard", "clean"]) {
    test(`${look}: a select-only combobox naming its label and value; one tab stop; opens a tree`, async () => {
      const el = await make(html``, "opt", false, look);
      expect(el.dataset.ui).toBe("tsel");
      expect(el.dataset.look).toBe(look);
      const f = field(el);
      expect(f.getAttribute("role")).toBe("combobox");
      expect(f.getAttribute("aria-haspopup")).toBe("tree");
      expect(f.getAttribute("aria-expanded")).toBe("false");
      const name = f.getAttribute("aria-labelledby")!.split(" ").map((id) => text(document.getElementById(id))).join(" ");
      expect(name).toBe("Subject Sciences›, Physics›, Optics");
      expect(text(el.querySelector(".ui-tsel__leaf"))).toBe("Optics");
      expect(el.querySelectorAll('[tabindex="0"]').length).toBe(1);
      await openTree(el);
      expect(f.getAttribute("aria-expanded")).toBe("true");
      const tree = el.querySelector("[role=tree]")!;
      expect(document.getElementById(f.getAttribute("aria-controls")!)).toBe(tree);
      // Opening unfolds to the picked option and focuses it
      expect(names(el)).toEqual(["Sciences", "Physics", "Optics", "Acoustics", "Botany", "Humanities", "Maps"]);
      await expect.poll(() => document.activeElement).toBe(item(el, "opt"));
      expect(item(el, "opt").getAttribute("aria-selected")).toBe("true");
      expect(item(el, "opt").getAttribute("aria-level")).toBe("3");
      expect(item(el, "sci").getAttribute("aria-expanded")).toBe("true");
      expect(item(el, "map").hasAttribute("aria-expanded")).toBe(false);
      expect(el.querySelectorAll('[role=treeitem][tabindex="0"]').length).toBe(1);
    });
  }

  test("keys: ↓ ↑ Home End move, → unfolds then enters, ← folds then goes up, * unfolds siblings, Enter picks and closes", async () => {
    const el = await make();
    const changes: TreeSelectValueChange[] = [];
    el.addEventListener("tc-value-change", (e) => changes.push((e as CustomEvent<TreeSelectValueChange>).detail));
    field(el).focus();
    key(field(el), "ArrowDown");
    await settle();
    await expect.poll(() => document.activeElement).toBe(item(el, "sci"));
    expect(names(el)).toEqual(["Sciences", "Humanities", "Maps"]);
    key(item(el, "sci"), "ArrowRight");
    await settle();
    expect(names(el)).toEqual(["Sciences", "Physics", "Botany", "Humanities", "Maps"]);
    key(item(el, "sci"), "ArrowRight");
    await settle();
    await expect.poll(() => document.activeElement).toBe(item(el, "phy"));
    key(item(el, "phy"), "*");
    await settle();
    // Physics' siblings with children – only Physics itself has some
    expect(names(el)).toContain("Optics");
    key(item(el, "phy"), "ArrowLeft");
    await settle();
    expect(names(el)).not.toContain("Optics");
    key(item(el, "phy"), "ArrowLeft");
    await settle();
    await expect.poll(() => document.activeElement).toBe(item(el, "sci"));
    key(item(el, "sci"), "End");
    await settle();
    await expect.poll(() => document.activeElement).toBe(item(el, "map"));
    key(item(el, "map"), "Home");
    await settle();
    await expect.poll(() => document.activeElement).toBe(item(el, "sci"));
    key(item(el, "sci"), "ArrowDown");
    await settle();
    key(item(el, "phy"), "Enter");
    await settle();
    expect(changes).toEqual([{ value: "phy", options: [TREE[0].children![0]] }]);
    expect(el.value).toBe("phy");
    expect(el.open).toBe(false);
    await expect.poll(() => document.activeElement).toBe(field(el));
    expect(text(el.querySelector('[role="status"]'))).toBe("Sciences, Physics selected");
  });

  test("filter: typing keeps matches and their parents, marks the match; Escape clears, then closes", async () => {
    const el = await make();
    await openTree(el);
    const input = el.querySelector<HTMLInputElement>(".ui-tsel__filter")!;
    // Typing in the tree types into the filter
    key(item(el, "sci"), "o");
    await settle();
    expect(input.value).toBe("o");
    input.value = "opt";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(names(el)).toEqual(["Sciences", "Physics", "Optics"]);
    expect(item(el, "opt").hasAttribute("data-hit")).toBe(true);
    expect(item(el, "phy").hasAttribute("data-hit")).toBe(false);
    expect(text(item(el, "opt").querySelector("mark"))).toBe("Opt");
    // Descriptions match too
    input.value = "plants";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(names(el)).toEqual(["Sciences", "Botany"]);
    input.value = "zzz";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(text(el.querySelector(".ui-tsel__empty"))).toBe("No matches for “zzz”");
    key(input, "Escape");
    await settle();
    expect(input.value).toBe("");
    expect(el.open).toBe(true);
    key(el.querySelector(".ui-tsel__filter")!, "Escape");
    await settle();
    expect(el.open).toBe(false);
  });

  test("multiple: checking a parent checks its enabled descendants; a partial parent is mixed; cascade off checks one row", async () => {
    const el = await make(html``, [], true);
    await openTree(el);
    expect(el.querySelector("[role=tree]")!.getAttribute("aria-multiselectable")).toBe("true");
    item(el, "hum").querySelector<HTMLElement>(".ui-tsel__row")!.click();
    await settle();
    // Restricted is disabled: it isn't checked, and Humanities counts as all checked
    expect(el.value).toEqual(["hum", "his"]);
    expect(item(el, "hum").getAttribute("aria-checked")).toBe("true");
    item(el, "sci").querySelector<HTMLElement>(".ui-tsel__twisty")!.click();
    await settle();
    item(el, "bot").querySelector<HTMLElement>(".ui-tsel__row")!.click();
    await settle();
    expect(item(el, "sci").getAttribute("aria-checked")).toBe("mixed");
    expect(el.value).toEqual(["bot", "hum", "his"]);
    item(el, "sci").querySelector<HTMLElement>(".ui-tsel__row")!.click();
    await settle();
    expect(el.value).toEqual(["sci", "phy", "opt", "aco", "bot", "hum", "his"]);
    expect(text(el.querySelector(".ui-tsel__count"))).toBe("7 selected");
    // Unchecking a child unchecks its parents
    item(el, "bot").querySelector<HTMLElement>(".ui-tsel__row")!.click();
    await settle();
    expect(el.value).toEqual(["phy", "opt", "aco", "hum", "his"]);
    expect(item(el, "sci").getAttribute("aria-checked")).toBe("mixed");
    item(el, "bot").querySelector<HTMLElement>(".ui-tsel__row")!.click();
    await settle();
    expect(el.open).toBe(true);
    // Chips: three, then +N more
    expect([...el.querySelectorAll(".ui-tsel__chip")].map(text)).toEqual(["Sciences", "Physics", "Optics", "+4 more"]);
    el.cascade = false;
    el.value = [];
    await settle();
    item(el, "hum").querySelector<HTMLElement>(".ui-tsel__row")!.click();
    await settle();
    expect(el.value).toEqual(["hum"]);
    // Clear in the footer
    el.querySelector<HTMLButtonElement>(".ui-tsel__text-btn")!.click();
    await settle();
    expect(el.value).toEqual([]);
  });

  test("disabled options can't be picked; × clears; prevented changes keep the value", async () => {
    const el = await make(html``, "his");
    await openTree(el);
    item(el, "res").querySelector<HTMLElement>(".ui-tsel__row")!.click();
    await settle();
    expect(el.value).toBe("his");
    expect(item(el, "res").getAttribute("aria-disabled")).toBe("true");
    el.open = false;
    await settle();
    el.addEventListener("tc-value-change", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLButtonElement>(".ui-tsel__clear")!.click();
    await settle();
    expect(el.value).toBe("his");
    el.querySelector<HTMLButtonElement>(".ui-tsel__clear")!.click();
    await settle();
    expect(el.value).toBe(null);
    expect(el.querySelector(".ui-tsel__clear")).toBeNull();
    expect(text(el.querySelector(".ui-tsel__placeholder"))).toBe("Choose…");
    // A prevented open stays closed
    el.addEventListener("tc-open-change", (e) => e.preventDefault(), { once: true });
    field(el).click();
    await settle();
    expect(el.open).toBe(false);
  });

  test("form: submits the id (one entry per id with multiple), required blocks submit, reset brings back the first value", async () => {
    const form = await fixture<HTMLFormElement>(html`<form>
      <tc-tree-select name="subject" required .options=${TREE}></tc-tree-select>
      <tc-tree-select name="covers" multiple .options=${TREE} .value=${["opt", "aco"]}></tc-tree-select>
    </form>`);
    const [one, many] = [...form.querySelectorAll("tc-tree-select")];
    expect(form.checkValidity()).toBe(false);
    one.value = "bot";
    await settle();
    expect(form.checkValidity()).toBe(true);
    const data = new FormData(form);
    expect(data.get("subject")).toBe("bot");
    expect(data.getAll("covers")).toEqual(["opt", "aco"]);
    many.value = [];
    await settle();
    form.reset();
    await settle();
    expect(one.value).toBe(null);
    expect(many.value).toEqual(["opt", "aco"]);
  });

  test("an unknown id shows as itself; options arriving later fill in its path", async () => {
    const el = await fixture<TcTreeSelect>(html`<tc-tree-select label="Subject" .value=${"opt"}></tc-tree-select>`);
    expect(text(el.querySelector(".ui-tsel__leaf"))).toBe("opt");
    el.options = TREE;
    await settle();
    expect(text(el.querySelector(".ui-tsel__path"))).toBe("Sciences›, Physics›, Optics");
  });

  test("React wrapper: uncontrolled picks survive re-renders; a controlled value stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(
        "div",
        { "data-n": n },
        React.createElement(TreeSelect, { label: "Own", options: TREE, defaultValue: null }),
        React.createElement(TreeSelect, { label: "Held", options: TREE, value: "map", onChange: (v) => void seen.push(v) }),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const [own, held] = [...host.querySelectorAll("tc-tree-select")];
    field(own).click();
    await settle();
    item(own, "map").querySelector<HTMLElement>(".ui-tsel__row")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(own.value).toBe("map");
    field(held).click();
    await settle();
    item(held, "sci").querySelector<HTMLElement>(".ui-tsel__row")!.click();
    await settle();
    expect(seen).toEqual(["sci"]);
    expect(held.value).toBe("map");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, closed and open, single and multiple`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px 16px 360px; background: var(--tc-surface-base); display: grid; gap: 16px">
        <tc-tree-select label="Subject" .options=${TREE} .value=${"opt"}></tc-tree-select>
        <tc-tree-select look="clean" label="Covers" multiple .options=${TREE} .value=${["bot", "his"]}></tc-tree-select>
        <tc-tree-select label="Empty" placeholder="Choose a subject…" .options=${TREE}></tc-tree-select>
        <tc-tree-select look="clean" label="Disabled" disabled .options=${TREE} .value=${"map"}></tc-tree-select>
      </div>`);
      const [a, b] = [...wrap.querySelectorAll("tc-tree-select")];
      a.open = true;
      await settle();
      await finish(wrap);
      let result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      a.open = false;
      b.open = true;
      await settle();
      await finish(wrap);
      result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
