/*
 * <tc-element-inspector> in real browsers: the tree as markup, folding and keys, choosing, highlight events, the box
 * model and styles, empty states, narrow width, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/element-inspector";
import type { InspectorDetails, InspectorNode, TcElementInspector } from "../../src/elements/element-inspector";
import { ElementInspector } from "../../src/elements/react/element-inspector";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NODES: InspectorNode[] = [
  {
    id: "body",
    tag: "body",
    children: [
      { id: "h1", tag: "h1", text: "Apply" },
      {
        id: "form",
        tag: "form",
        attrs: { method: "post", class: "form wide", id: "apply" },
        children: [
          { id: "title", tag: "input", attrs: { id: "title" } },
          { id: "submit", tag: "button", attrs: { type: "submit" }, text: "Submit" },
        ],
      },
    ],
  },
];
const DETAILS: InspectorDetails = {
  box: { width: 640.4, height: 412, margin: [0, 0, 32, 0], border: [1, 1, 1, 1], padding: [24, 24, 24, 24] },
  styles: [
    { property: "display", value: "grid", source: "form.css:4" },
    { property: "gap", value: "12px" },
  ],
};
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcElementInspector>(html`<tc-element-inspector look=${look} .nodes=${NODES} .expanded=${["body"]}></tc-element-inspector>`);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-elin__row[data-id="${id}"]`)!;
const ids = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-elin__row")].map((r) => r.dataset.id);
const key = (k: string) => (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("tc-element-inspector", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a named tree with one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("elin");
      expect(el.dataset.look).toBe(look);
      const tree = el.querySelector('[role="tree"]')!;
      expect(tree.getAttribute("aria-label")).toBe("Elements");
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Elements");
      expect(ids(el)).toEqual(["body", "h1", "form"]);
      expect([...el.querySelectorAll<HTMLElement>('[role="treeitem"]')].filter((r) => r.tabIndex === 0)).toHaveLength(1);
      expect(row(el, "body").getAttribute("aria-expanded")).toBe("true");
      expect(row(el, "form").getAttribute("aria-expanded")).toBe("false");
      expect(row(el, "h1").hasAttribute("aria-expanded")).toBe(false);
      expect(row(el, "form").getAttribute("aria-level")).toBe("2");
      expect(row(el, "form").getAttribute("aria-posinset")).toBe("2");
    });
  }

  test("rows read like markup: id and class first, text inline, folded ones closed with …", async () => {
    const el = await make();
    expect(row(el, "form").querySelector(".ui-elin__code")!.textContent).toBe('<form id="apply" class="form wide" method="post">…</form>');
    expect(row(el, "h1").querySelector(".ui-elin__code")!.textContent).toBe("<h1>Apply</h1>");
    expect(row(el, "body").querySelector(".ui-elin__code")!.textContent).toBe("<body>");
    expect([...row(el, "form").querySelectorAll(".ui-elin__attr")].map((a) => a.textContent)).toEqual(["id", "class", "method"]);
  });

  test("keyboard: ↓ ↑, → opens then moves in, ← closes then moves out, Home / End, Enter chooses", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-expanded-change", (e) => seen.push((e as CustomEvent).detail));
    row(el, "body").focus();
    key("ArrowDown");
    key("ArrowDown");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("form");
    key("ArrowRight");
    await expect.poll(() => ids(el)).toEqual(["body", "h1", "form", "title", "submit"]);
    expect(seen).toEqual([{ expanded: ["body", "form"], id: "form" }]);
    key("ArrowRight");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("title");
    key("ArrowLeft");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("form");
    key("ArrowLeft");
    await expect.poll(() => ids(el)).toEqual(["body", "h1", "form"]);
    key("End");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("form");
    key("Home");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("body");
    key("Enter");
    await expect.poll(() => el.selected).toBe("body");
    expect(row(el, "body").getAttribute("aria-selected")).toBe("true");
    expect([...el.querySelectorAll<HTMLElement>('[role="treeitem"]')].filter((r) => r.tabIndex === 0)).toHaveLength(1);
  });

  test("clicking chooses; the chevron folds; preventing keeps the choice and the folds", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent).detail));
    row(el, "h1").click();
    await settle();
    expect(seen).toEqual([{ selected: "h1", node: NODES[0].children![0] }]);
    expect(el.selected).toBe("h1");
    row(el, "form").querySelector<HTMLElement>(".ui-elin__twisty")!.click();
    await settle();
    expect(el.expanded).toEqual(["body", "form"]);
    expect(el.selected).toBe("h1");
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    el.addEventListener("tc-expanded-change", (e) => e.preventDefault());
    row(el, "submit").click();
    row(el, "form").querySelector<HTMLElement>(".ui-elin__twisty")!.click();
    await settle();
    expect(el.selected).toBe("h1");
    expect(el.expanded).toEqual(["body", "form"]);
  });

  test("hover and focus fire tc-highlight with the node; leaving the tree fires null once", async () => {
    const el = await make();
    const seen: (string | null)[] = [];
    el.addEventListener("tc-highlight", (e) => seen.push((e as CustomEvent).detail.id));
    row(el, "h1").dispatchEvent(new MouseEvent("mouseenter"));
    row(el, "h1").dispatchEvent(new MouseEvent("mouseenter"));
    row(el, "form").dispatchEvent(new MouseEvent("mouseenter"));
    el.querySelector('[role="tree"]')!.dispatchEvent(new MouseEvent("mouseleave"));
    row(el, "body").focus();
    const outside = document.body.appendChild(document.createElement("button"));
    outside.focus();
    expect(seen).toEqual(["h1", "form", null, "body", null]);
  });

  test("details: the chosen element's tag, box model in numbers and words, and styles", async () => {
    const el = await make();
    expect(el.querySelector(".ui-elin__empty")!.textContent).toBe("Select an element");
    el.selected = "form";
    el.details = DETAILS;
    await settle();
    expect(el.querySelector(".ui-elin__picked")!.textContent).toBe("form#apply.form.wide");
    expect(el.querySelector(".ui-elin__content")!.textContent).toBe("640 × 412");
    expect(el.querySelector(".ui-elin__box")!.getAttribute("aria-hidden")).toBe("true");
    expect(el.querySelector(".ui-elin__box + .ui-elin__sr")!.textContent).toBe("content 640 by 412, padding 24 24 24 24, border 1 1 1 1, margin 0 0 32 0");
    const margin = el.querySelector(".ui-elin__margin")!;
    expect(margin.querySelector(':scope > [data-side="bottom"]')!.textContent).toBe("32");
    expect(margin.querySelector(':scope > [data-side="top"]')!.textContent).toBe("–");
    const styles = [...el.querySelectorAll(".ui-elin__style")].map((s) => s.textContent!.replace(/\s+/g, " ").trim());
    expect(styles).toEqual(["displaygridform.css:4", "gap12px"]);
    // A folded element can be chosen from outside
    el.selected = "submit";
    el.details = {};
    await settle();
    expect(el.querySelector(".ui-elin__picked")!.textContent).toBe("button");
    expect(el.querySelector(".ui-elin__box")).toBeNull();
    expect(el.querySelector(".ui-elin__none")!.textContent).toBe("No styles");
    el.labels = { noStyles: "Keine Stile" };
    await settle();
    expect(el.querySelector(".ui-elin__none")!.textContent).toBe("Keine Stile");
  });

  test("choosing another element hides the last one's box and styles until the page sends its details", async () => {
    const el = await make();
    el.selected = "form";
    el.details = DETAILS;
    await settle();
    row(el, "h1").click();
    await settle();
    expect(el.selected).toBe("h1");
    expect(el.querySelector(".ui-elin__picked")!.textContent).toBe("h1");
    expect(el.querySelector(".ui-elin__box")).toBeNull();
    expect(el.querySelector(".ui-elin__styles")).toBeNull();
    expect(el.querySelector(".ui-elin__details [role=\"status\"]")!.textContent).toBe("Loading details");
    el.details = { styles: [{ property: "font-size", value: "20px" }] };
    await settle();
    expect(el.querySelector(".ui-elin__details [role=\"status\"]")).toBeNull();
    expect(el.querySelector(".ui-elin__styles")!.textContent).toContain("font-size");
  });

  test("empty tree; wide sits side by side, narrow stacks without overflowing", async () => {
    const empty = await fixture<TcElementInspector>(html`<tc-element-inspector></tc-element-inspector>`);
    expect(empty.querySelector(".ui-elin__tree-pane .ui-elin__empty")!.textContent).toBe("No elements");
    const el = await make();
    el.style.width = "900px";
    await settle();
    const tree = () => el.querySelector(".ui-elin__tree-pane")!.getBoundingClientRect();
    const details = () => el.querySelector(".ui-elin__details")!.getBoundingClientRect();
    await expect.poll(() => details().left >= tree().right - 1).toBe(true);
    el.style.width = "320px";
    await settle();
    await expect.poll(() => details().top >= tree().bottom - 1).toBe(true);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React: uncontrolled survives a re-render, controlled waits for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const render = (props: Partial<React.ComponentProps<typeof ElementInspector>>) => act(async () => root.render(React.createElement(ElementInspector, { nodes: NODES, defaultExpanded: ["body"], ...props })));
    await render({ defaultSelected: "body" });
    const el = wrap.querySelector<TcElementInspector>("tc-element-inspector")!;
    await settle();
    expect(el.selected).toBe("body");
    await act(async () => row(el, "h1").click());
    await act(async () => row(el, "form").querySelector<HTMLElement>(".ui-elin__twisty")!.click());
    await render({ defaultSelected: "body", description: "Again" });
    await settle();
    expect(el.selected).toBe("h1");
    expect(el.expanded).toEqual(["body", "form"]);
    const seen: unknown[] = [];
    await render({ selected: "body", onSelectedChange: (s, n) => void seen.push([s, n?.tag]) });
    await settle();
    await act(async () => row(el, "h1").click());
    await settle();
    expect(seen).toEqual([["h1", "h1"]]);
    await expect.poll(() => el.selected).toBe("body");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.colorScheme = theme;
      wrap.innerHTML = `<tc-element-inspector look="standard" heading="A"></tc-element-inspector><tc-element-inspector look="clean" heading="B"></tc-element-inspector><tc-element-inspector look="clean"></tc-element-inspector>`;
      wrap.querySelectorAll<TcElementInspector>("tc-element-inspector").forEach((el, i) => {
        if (i < 2) {
          el.nodes = NODES;
          el.expanded = ["body", "form"];
          el.selected = "form";
          el.details = DETAILS;
        }
      });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
