/*
 * <tc-selection-toolbar> in real browsers: the toolbar in flow and floating, one tab stop, commands, toggles and menus
 * with their cancelable changes, keys, focus kept in the editor, closing, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/selection-toolbar";
import {
  defaultSelectionToolbarItems,
  selectionRect,
  type SelectionToolbarCommand,
  type SelectionToolbarItem,
  type SelectionToolbarRewrite,
  type SelectionToolbarRewriteAccept,
  type TcSelectionToolbar,
} from "../../src/elements/selection-toolbar";
import { SelectionToolbar } from "../../src/elements/react/selection-toolbar";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: SelectionToolbarItem[] = [
  { type: "button", id: "comment", label: "Comment", icon: "M4 4h16" },
  { type: "separator" },
  { type: "toggle", id: "bold", label: "Bold", icon: "M4 4h16", keys: "Control+B Meta+B", shortcut: "⌘B" },
  { type: "toggle", id: "italic", label: "Italic", icon: "M4 4h16" },
  { type: "toggle", id: "off", label: "Unavailable", icon: "M4 4h16", disabled: true },
  {
    type: "menu",
    id: "list",
    label: "List",
    icon: "M4 4h16",
    options: [
      { value: "none", label: "No list" },
      { value: "bullets", label: "Bulleted list", icon: "M8 6h13" },
      { value: "numbers", label: "Numbered list", icon: "M10 6h11" },
    ],
  },
  { type: "menu", id: "color", label: "Text colour", icon: "M4 4h16", options: [{ value: "red", label: "Red", color: "var(--tc-status-danger-fg)" }] },
];
const inline = (look = "standard") => fixture<TcSelectionToolbar>(html`<tc-selection-toolbar look=${look} .items=${ITEMS}></tc-selection-toolbar>`);
const tool = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-stb__tool[data-id="${id}"]`)!;
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true }));
const ids = (el: Element, sel: string) => [...el.querySelectorAll<HTMLElement>(sel)].map((b) => b.dataset.id);

/** An editor with a word selected, and the bar floating over it */
async function floating(look = "standard") {
  const editor = document.createElement("div");
  editor.contentEditable = "true";
  editor.textContent = "Separate method review from budget review.";
  editor.style.margin = "120px 40px";
  document.body.append(editor);
  editor.focus();
  document.getSelection()!.setBaseAndExtent(editor.firstChild!, 0, editor.firstChild!, 8);
  const el = await fixture<TcSelectionToolbar>(html`<tc-selection-toolbar look=${look} .items=${ITEMS} .editor=${editor} .anchor=${selectionRect()} open></tc-selection-toolbar>`);
  await expect.poll(() => el.querySelector(".ui-stb__bar")?.hasAttribute("data-placed")).toBe(true);
  return { el, editor, bar: el.querySelector<HTMLElement>(".ui-stb__bar")! };
}

describe("tc-selection-toolbar", () => {
  for (const look of ["standard", "clean"]) {
    test(`${look}: a named toolbar with one tab stop, separators and labelled controls`, async () => {
      const el = await inline(look);
      expect(el.dataset.ui).toBe("stb");
      expect(el.dataset.look).toBe(look);
      const bar = el.querySelector('[role="toolbar"]')!;
      expect(bar.getAttribute("aria-label")).toBe("Format");
      expect(bar.classList.contains("tc-pop")).toBe(false);
      expect(el.querySelectorAll('[role="separator"]').length).toBe(1);
      expect(ids(el, '.ui-stb__tool[tabindex="0"]')).toEqual(["comment"]);
      expect(tool(el, "comment").hasAttribute("aria-pressed")).toBe(false);
      expect(tool(el, "bold").getAttribute("aria-pressed")).toBe("false");
      expect(tool(el, "bold").getAttribute("aria-keyshortcuts")).toBe("Control+B Meta+B");
      expect(tool(el, "bold").nextElementSibling!.textContent).toContain("⌘B");
      expect(tool(el, "list").getAttribute("aria-haspopup")).toBe("menu");
      expect(tool(el, "list").getAttribute("aria-expanded")).toBe("false");
    });
  }

  test("the default bar: the reference layout's controls, in order", async () => {
    const el = await fixture<TcSelectionToolbar>(html`<tc-selection-toolbar></tc-selection-toolbar>`);
    expect(ids(el, ".ui-stb__tool")).toEqual(["ask", "comment", "react", "style", "bold", "italic", "underline", "strike", "code", "color", "list", "link"]);
    expect(el.querySelectorAll(".ui-stb__sep").length).toBe(defaultSelectionToolbarItems.filter((i) => i.type === "separator").length);
  });

  test("a button fires tc-command with its id", async () => {
    const el = await inline();
    const heard: SelectionToolbarCommand[] = [];
    el.addEventListener("tc-command", (e) => heard.push((e as CustomEvent<SelectionToolbarCommand>).detail));
    tool(el, "comment").click();
    expect(heard).toEqual([{ id: "comment" }]);
  });

  test("a toggle turns on and off, with tc-pressed-change then tc-command; prevented, `pressed` stays", async () => {
    const el = await inline();
    const heard: string[] = [];
    el.addEventListener("tc-pressed-change", (e) => heard.push(`pressed ${JSON.stringify((e as CustomEvent).detail)}`));
    el.addEventListener("tc-command", (e) => heard.push(`command ${JSON.stringify((e as CustomEvent).detail)}`));
    tool(el, "bold").click();
    await settle(el);
    expect(el.pressed).toEqual(["bold"]);
    expect(tool(el, "bold").getAttribute("aria-pressed")).toBe("true");
    tool(el, "bold").click();
    await settle(el);
    expect(el.pressed).toEqual([]);
    expect(heard).toEqual([
      'pressed {"pressed":["bold"],"id":"bold"}',
      'command {"id":"bold","value":true}',
      'pressed {"pressed":[],"id":"bold"}',
      'command {"id":"bold","value":false}',
    ]);
    el.addEventListener("tc-pressed-change", (e) => e.preventDefault());
    tool(el, "italic").click();
    await settle(el);
    expect(el.pressed).toEqual([]);
    expect(tool(el, "italic").getAttribute("aria-pressed")).toBe("false");
  });

  test("`pressed` and `values` from the page show on the controls; ids like constructor don't count", async () => {
    const el = await inline();
    el.pressed = ["italic"];
    el.values = { list: "numbers" };
    await settle(el);
    expect(tool(el, "italic").getAttribute("aria-pressed")).toBe("true");
    expect(tool(el, "list").getAttribute("aria-label")).toBe("List: Numbered list");
    el.items = [{ type: "menu", id: "constructor", label: "Odd", icon: "M4 4h16", options: [{ value: "x", label: "X" }] }];
    el.values = {};
    await settle(el);
    expect(tool(el, "constructor").getAttribute("aria-label")).toBe("Odd");
  });

  test("a menu opens on its chosen option, picks with tc-values-change and tc-command, and closes back to its button", async () => {
    const el = await inline();
    el.values = { list: "bullets" };
    await settle(el);
    const heard: string[] = [];
    el.addEventListener("tc-values-change", (e) => heard.push(`values ${JSON.stringify((e as CustomEvent).detail)}`));
    el.addEventListener("tc-command", (e) => heard.push(`command ${JSON.stringify((e as CustomEvent).detail)}`));
    tool(el, "list").focus();
    key(tool(el, "list"), "ArrowDown");
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.value).toBe("bullets");
    expect(tool(el, "list").getAttribute("aria-expanded")).toBe("true");
    expect(tool(el, "list").getAttribute("aria-controls")).toBe(el.querySelector(".ui-stb__menu")!.id);
    expect([...el.querySelectorAll('[role="menuitemradio"]')].map((o) => o.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
    key(document.activeElement!, "ArrowDown");
    expect((document.activeElement as HTMLElement).dataset.value).toBe("numbers");
    key(document.activeElement!, "End");
    expect((document.activeElement as HTMLElement).dataset.value).toBe("numbers");
    key(document.activeElement!, "Home");
    expect((document.activeElement as HTMLElement).dataset.value).toBe("none");
    key(document.activeElement!, "ArrowUp");
    (document.activeElement as HTMLButtonElement).click();
    await settle(el);
    expect(el.values).toEqual({ list: "numbers" });
    expect(el.querySelector(".ui-stb__menu")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(tool(el, "list"));
    expect(heard).toEqual(['values {"values":{"list":"numbers"},"id":"list","value":"numbers"}', 'command {"id":"list","value":"numbers"}']);
  });

  test("choosing the option already chosen does nothing; a prevented change keeps `values` but still closes", async () => {
    const el = await inline();
    el.values = { list: "bullets" };
    await settle(el);
    let commands = 0;
    el.addEventListener("tc-command", () => commands++);
    tool(el, "list").click();
    await settle(el);
    el.querySelector<HTMLButtonElement>('[data-value="bullets"]')!.click();
    await settle(el);
    expect(commands).toBe(0);
    el.addEventListener("tc-values-change", (e) => e.preventDefault());
    tool(el, "list").click();
    await settle(el);
    el.querySelector<HTMLButtonElement>('[data-value="none"]')!.click();
    await settle(el);
    expect(el.values).toEqual({ list: "bullets" });
    expect(commands).toBe(1);
  });

  test("Escape in a menu closes it, not the bar; Tab closes it; a click elsewhere closes it", async () => {
    const el = await inline();
    tool(el, "list").focus();
    key(tool(el, "list"), "ArrowUp");
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.value).toBe("numbers");
    key(document.activeElement!, "Escape");
    await expect.poll(() => document.activeElement).toBe(tool(el, "list"));
    expect(el.querySelector(".ui-stb__menu")).toBeNull();
    key(tool(el, "list"), "ArrowDown");
    await expect.poll(() => !!el.querySelector(".ui-stb__menu")).toBe(true);
    key(document.activeElement!, "Tab");
    await settle(el);
    expect(el.querySelector(".ui-stb__menu")).toBeNull();
    tool(el, "color").click();
    await settle(el);
    expect(el.querySelector(".ui-stb__swatch")).not.toBeNull();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await settle(el);
    expect(el.querySelector(".ui-stb__menu")).toBeNull();
  });

  test("a menu whose item goes away closes", async () => {
    const el = await inline();
    tool(el, "list").click();
    await settle(el);
    el.items = ITEMS.filter((i) => i.type !== "menu");
    await settle(el);
    expect(el.querySelector(".ui-stb__menu")).toBeNull();
  });

  test("arrows, Home and End move along the bar, skipping disabled controls", async () => {
    const el = await inline();
    tool(el, "comment").focus();
    key(tool(el, "comment"), "ArrowRight");
    expect(document.activeElement).toBe(tool(el, "bold"));
    key(document.activeElement!, "End");
    expect(document.activeElement).toBe(tool(el, "color"));
    key(document.activeElement!, "ArrowLeft");
    expect(document.activeElement).toBe(tool(el, "list"));
    key(document.activeElement!, "ArrowLeft");
    expect(document.activeElement).toBe(tool(el, "italic"));
    key(document.activeElement!, "Home");
    expect(document.activeElement).toBe(tool(el, "comment"));
    await settle(el);
    expect(ids(el, '.ui-stb__tool[tabindex="0"]')).toEqual(["comment"]);
  });

  test("floating: it sits above the selection in the top layer, keeps the editor's focus and selection, and Escape returns to the editor", async () => {
    const { el, editor, bar } = await floating();
    expect(bar.classList.contains("tc-pop")).toBe(true);
    const range = document.getSelection()!.getRangeAt(0).getBoundingClientRect();
    expect(bar.getBoundingClientRect().bottom).toBeLessThanOrEqual(range.top);
    const down = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    tool(el, "bold").dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    tool(el, "bold").click();
    expect(document.getSelection()!.toString()).toBe("Separate");
    el.focusToolbar();
    expect(document.activeElement).toBe(tool(el, "comment"));
    const closes: string[] = [];
    el.addEventListener("tc-close", (e) => closes.push((e as CustomEvent).detail.reason));
    key(document.activeElement!, "Escape");
    await expect.poll(() => el.open).toBe(false);
    expect(closes).toEqual(["escape"]);
    expect(el.querySelector(".ui-stb__bar")).toBeNull();
    expect(document.activeElement).toBe(editor);
    editor.remove();
  });

  test("floating: a click in the editor keeps it; a click elsewhere closes it; `open` false hides it without tc-close", async () => {
    const { el, editor } = await floating();
    const closes: string[] = [];
    el.addEventListener("tc-close", (e) => closes.push((e as CustomEvent).detail.reason));
    editor.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await settle(el);
    expect(el.open).toBe(true);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await expect.poll(() => el.open).toBe(false);
    expect(closes).toEqual(["outside"]);
    el.open = true;
    await expect.poll(() => !!el.querySelector(".ui-stb__bar")).toBe(true);
    el.open = false;
    await expect.poll(() => el.querySelector(".ui-stb__bar")).toBeNull();
    expect(closes).toEqual(["outside"]);
    editor.remove();
  });

  test("selectionRect: null for no selection or a caret, a box for a selection", async () => {
    const p = document.createElement("p");
    p.textContent = "Some text";
    document.body.append(p);
    document.getSelection()!.removeAllRanges();
    expect(selectionRect()).toBeNull();
    document.getSelection()!.collapse(p.firstChild!, 2);
    expect(selectionRect()).toBeNull();
    document.getSelection()!.setBaseAndExtent(p.firstChild!, 0, p.firstChild!, 4);
    const r = selectionRect()!;
    expect(r.width).toBeGreaterThan(0);
    p.remove();
  });

  test("renamed label", async () => {
    const el = await fixture<TcSelectionToolbar>(html`<tc-selection-toolbar .items=${ITEMS} .labels=${{ toolbar: "Formatieren" }}></tc-selection-toolbar>`);
    expect(el.querySelector('[role="toolbar"]')!.getAttribute("aria-label")).toBe("Formatieren");
  });

  test("React: uncontrolled toggles survive a re-render; controlled ones stay until the parent changes them", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const commands: string[] = [];
    const uncontrolled = (n: number) => React.createElement(SelectionToolbar, { key: "u", items: ITEMS, "data-n": n, onTcCommand: (e: CustomEvent<SelectionToolbarCommand>) => void commands.push(e.detail.id) } as never);
    await act(async () => root.render(uncontrolled(1)));
    const el = host.querySelector("tc-selection-toolbar") as TcSelectionToolbar;
    await settle(el);
    await act(async () => tool(el, "bold").click());
    await act(async () => root.render(uncontrolled(2)));
    expect(el.pressed).toEqual(["bold"]);
    expect(commands).toEqual(["bold"]);

    const heard: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(SelectionToolbar, {
          key: "c",
          items: ITEMS,
          pressed: ["italic"],
          values: { list: "none" },
          onPressedChange: (p, id) => void heard.push(`${id}:${p.join(",")}`),
          onValuesChange: (v, id, value) => void heard.push(`${id}=${value}`),
        }),
      ),
    );
    const held = host.querySelector("tc-selection-toolbar") as TcSelectionToolbar;
    await settle(held);
    await act(async () => tool(held, "bold").click());
    expect(held.pressed).toEqual(["italic"]);
    await act(async () => tool(held, "list").click());
    await act(async () => held.querySelector<HTMLButtonElement>('[data-value="bullets"]')!.click());
    expect(held.values).toEqual({ list: "none" });
    expect(heard).toEqual(["bold:italic,bold", "list=bullets"]);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`axe: ${look}, ${scheme}, with a toggle on and a menu open`, async () => {
        document.documentElement.style.colorScheme = scheme;
        const el = await inline(look);
        el.pressed = ["bold"];
        el.values = { list: "bullets" };
        await settle(el);
        tool(el, "list").click();
        await settle(el);
        await finish(el);
        const { violations } = await axe.run(el);
        document.documentElement.style.colorScheme = "";
        expect(violations.map((v) => v.id)).toEqual([]);
      });
    }
  }
});

/* ---------- Rewrite ---------- */

const rwPanel = (el: Element) => el.querySelector<HTMLElement>(".ui-stb__rewrite");
const rwField = (el: Element) => el.querySelector<HTMLInputElement>(".ui-stb__rw-field")!;
const rwButton = (el: Element, text: RegExp) => [...el.querySelectorAll<HTMLButtonElement>(".ui-stb__rewrite button")].find((b) => text.test(b.textContent!))!;
const typeInto = async (input: HTMLInputElement, text: string) => {
  input.value = text;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  await settle();
};

for (const look of ["standard", "clean"] as const) {
  describe(`tc-selection-toolbar (${look}) – rewrite`, () => {
    test("off by default: the bar is the formatting bar it was", async () => {
      const el = await inline(look);
      expect(tool(el, "rewrite")).toBeNull();
      expect(rwPanel(el)).toBeNull();
    });

    test("the wand opens a field; Enter fires tc-rewrite, the function's text shows as a diff, Accept fires tc-rewrite-accept", async () => {
      const asked: SelectionToolbarRewrite[] = [];
      const accepted: SelectionToolbarRewriteAccept[] = [];
      const signals: AbortSignal[] = [];
      const el = await fixture<TcSelectionToolbar>(html`<tc-selection-toolbar
        look=${look}
        .items=${ITEMS}
        rewritable
        selected-text="Separate method review from budget review"
        .rewrite=${async (r: SelectionToolbarRewrite, signal: AbortSignal) => {
          signals.push(signal);
          return r.instruction === "Make it shorter" ? "Separate method and budget review" : "Split method review from budget review";
        }}
        @tc-rewrite=${(e: CustomEvent<SelectionToolbarRewrite>) => asked.push(e.detail)}
        @tc-rewrite-accept=${(e: CustomEvent<SelectionToolbarRewriteAccept>) => accepted.push(e.detail)}
      ></tc-selection-toolbar>`);
      // The wand leads the bar and is one of its arrow-key stops
      expect(ids(el, ".ui-stb__bar > .ui-stb__slot > .ui-stb__tool")[0]).toBe("rewrite");
      const wand = tool(el, "rewrite");
      expect(wand.getAttribute("aria-label")).toBe("Rewrite with AI");
      expect(wand.getAttribute("aria-expanded")).toBe("false");
      wand.focus();
      wand.click();
      await settle();
      expect(wand.getAttribute("aria-expanded")).toBe("true");
      expect(wand.getAttribute("aria-controls")).toBe(rwPanel(el)!.id);
      await expect.poll(() => document.activeElement).toBe(rwField(el));
      // Arrow keys in the field don't move along the bar
      key(rwField(el), "ArrowLeft");
      expect(document.activeElement).toBe(rwField(el));
      const chips = [...el.querySelectorAll(".ui-stb__rw-chip")].map((c) => c.textContent!.trim());
      expect(chips).toEqual(["Shorter", "Clearer", "More formal", "Fix grammar"]);
      await typeInto(rwField(el), "Use plainer words");
      rwField(el).form!.requestSubmit();
      await settle();
      expect(asked).toEqual([{ instruction: "Use plainer words", text: "Separate method review from budget review" }]);
      await expect.poll(() => el.querySelector(".ui-stb__rw-diff")).not.toBeNull();
      const diff = el.querySelector(".ui-stb__rw-diff")!;
      expect([...diff.querySelectorAll("del")].map((d) => d.textContent)).toEqual(["removed: Separate"]);
      expect([...diff.querySelectorAll("ins")].map((d) => d.textContent)).toEqual(["added: Split"]);
      expect(el.querySelector(".ui-stb__rewrite [role=status]")!.textContent).toBe("Rewrite ready: 2 changes. Accept or reject it");
      await expect.poll(() => document.activeElement?.textContent).toBe("Accept");
      // Try again asks with the same instruction; a chip asks with its own
      rwButton(el, /Try again/).click();
      await settle();
      expect(asked.at(-1)!.instruction).toBe("Use plainer words");
      await expect.poll(() => el.querySelector(".ui-stb__rw-diff")).not.toBeNull();
      rwButton(el, /Reject/).click();
      await settle();
      expect(rwPanel(el)).toBeNull();
      expect(document.activeElement).toBe(wand);
      wand.click();
      await settle();
      [...el.querySelectorAll<HTMLButtonElement>(".ui-stb__rw-chip")].find((c) => c.textContent === "Shorter")!.click();
      await expect.poll(() => el.querySelector(".ui-stb__rw-diff")).not.toBeNull();
      rwButton(el, /Accept/).click();
      await settle();
      expect(accepted).toEqual([{ text: "Separate method and budget review", instruction: "Make it shorter", original: "Separate method review from budget review" }]);
      expect(rwPanel(el)).toBeNull();
    });

    test("a page that sets `rewrite` to the text in reply; prevented tc-rewrite asks nothing; a failure says so", async () => {
      const el = await fixture<TcSelectionToolbar>(html`<tc-selection-toolbar look=${look} .items=${ITEMS} rewritable selected-text="Draft one"></tc-selection-toolbar>`);
      let block = true;
      el.addEventListener("tc-rewrite", (e) => {
        if (block) e.preventDefault();
      });
      tool(el, "rewrite").click();
      await settle();
      await typeInto(rwField(el), "Shorter");
      rwField(el).form!.requestSubmit();
      await settle();
      expect(el.querySelector(".ui-stb__rewrite")!.getAttribute("aria-busy")).toBe("false");
      block = false;
      rwField(el).form!.requestSubmit();
      await settle();
      expect(el.querySelector(".ui-stb__rewrite")!.getAttribute("aria-busy")).toBe("true");
      expect(rwButton(el, /Rewriting/).disabled).toBe(true);
      el.rewrite = "Draft";
      await settle();
      await expect.poll(() => el.querySelector(".ui-stb__rw-diff")?.textContent).toBe("Draftremoved:  one");
      // A failing function: the error line and the field stay for another go
      rwButton(el, /Reject/).click();
      await settle();
      el.rewrite = () => Promise.reject(new Error("offline"));
      tool(el, "rewrite").click();
      await settle();
      await typeInto(rwField(el), "Shorter");
      rwField(el).form!.requestSubmit();
      await expect.poll(() => el.querySelector(".ui-stb__rw-error")?.textContent).toMatch(/Couldn't rewrite/);
      expect(el.querySelector(".ui-stb__rewrite [role=status]")!.textContent).toBe("Couldn't rewrite the text");
    });

    test("Escape in the panel closes it and aborts the request, back on the wand; the floating bar stays open", async () => {
      const editor = document.createElement("div");
      editor.contentEditable = "true";
      editor.textContent = "Separate method review from budget review.";
      editor.style.margin = "120px 40px";
      document.body.append(editor);
      editor.focus();
      document.getSelection()!.setBaseAndExtent(editor.firstChild!, 0, editor.firstChild!, 8);
      const signals: AbortSignal[] = [];
      const el = await fixture<TcSelectionToolbar>(html`<tc-selection-toolbar
        look=${look}
        .items=${ITEMS}
        .editor=${editor}
        .anchor=${selectionRect()}
        open
        rewritable
        .rewrite=${(_r: SelectionToolbarRewrite, signal: AbortSignal) => {
          signals.push(signal);
          return new Promise<string>(() => {});
        }}
      ></tc-selection-toolbar>`);
      await expect.poll(() => el.querySelector(".ui-stb__bar")?.hasAttribute("data-placed")).toBe(true);
      tool(el, "rewrite").click();
      await settle();
      await expect.poll(() => document.activeElement).toBe(rwField(el));
      // With no selected-text, the page's selection is the text – focus moved, but it was read when the panel opened
      const asked: SelectionToolbarRewrite[] = [];
      el.addEventListener("tc-rewrite", (e) => asked.push((e as CustomEvent<SelectionToolbarRewrite>).detail));
      await typeInto(rwField(el), "Shorter");
      rwField(el).form!.requestSubmit();
      await settle();
      expect(asked[0].text).toBe("Separate");
      key(rwField(el), "Escape");
      await settle();
      expect(signals[0].aborted).toBe(true);
      expect(rwPanel(el)).toBeNull();
      expect(el.open).toBe(true);
      await expect.poll(() => document.activeElement).toBe(tool(el, "rewrite"));
      editor.remove();
    });
  });
}

test("React: onRewriteRequest can stop a rewrite; onRewriteAccept gets the text", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const seen: string[] = [];
  let refuse = true;
  await act(async () =>
    root.render(
      React.createElement(SelectionToolbar, {
        items: ITEMS,
        rewritable: true,
        selectedText: "Old words",
        rewrite: async () => "New words",
        onRewriteRequest: (r) => {
          seen.push(`ask ${r.instruction}`);
          return refuse ? false : undefined;
        },
        onRewriteAccept: (text) => void seen.push(`accept ${text}`),
      }),
    ),
  );
  await settle();
  const el = host.querySelector("tc-selection-toolbar")!;
  tool(el, "rewrite").click();
  await settle();
  [...el.querySelectorAll<HTMLButtonElement>(".ui-stb__rw-chip")][0].click();
  await settle();
  expect(el.querySelector(".ui-stb__rw-diff")).toBeNull();
  refuse = false;
  [...el.querySelectorAll<HTMLButtonElement>(".ui-stb__rw-chip")][0].click();
  await expect.poll(() => el.querySelector(".ui-stb__rw-diff")).not.toBeNull();
  rwButton(el, /Accept/).click();
  await settle();
  expect(seen).toEqual(["ask Make it shorter", "ask Make it shorter", "accept New words"]);
  await act(async () => root.unmount());
  host.remove();
});

for (const theme of ["light", "dark"] as const) {
  test(`axe (${theme}): the rewrite field and the diff in both looks`, async () => {
    const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 16px">
      <tc-selection-toolbar .items=${ITEMS} rewritable selected-text="Old words" .rewrite=${async () => "New words"}></tc-selection-toolbar>
      <tc-selection-toolbar look="clean" .items=${ITEMS} rewritable selected-text="Old words" .rewrite=${async () => "New words"}></tc-selection-toolbar>
      <tc-selection-toolbar .items=${ITEMS} rewritable selected-text="Old words" .rewrite=${async () => "New words"}></tc-selection-toolbar>
      <tc-selection-toolbar look="clean" .items=${ITEMS} rewritable selected-text="Old words" .rewrite=${async () => "New words"}></tc-selection-toolbar>
    </div>`);
    const bars = [...wrap.querySelectorAll("tc-selection-toolbar")];
    for (const el of bars) {
      tool(el, "rewrite").click();
      await settle();
    }
    for (const el of bars.slice(2)) {
      [...el.querySelectorAll<HTMLButtonElement>(".ui-stb__rw-chip")][0].click();
      await expect.poll(() => el.querySelector(".ui-stb__rw-diff")).not.toBeNull();
    }
    await finish(wrap);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
