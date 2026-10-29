/*
 * <tc-ai-search> in real browsers: the combobox and its suggestions, submitting, AI mode's prompt and examples, the
 * contents switch, scope chips, Clear, the hotkey, controlled use, the React wrapper and axe in both looks and both
 * themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/ai-search";
import type { AiSearchScope, AiSearchSubmit, AiSearchSuggestion, TcAiSearch } from "../../src/elements/ai-search";
import { AiSearch } from "../../src/elements/react/ai-search";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SUGGESTIONS: AiSearchSuggestion[] = [
  { label: "invoice 7741", kind: "recent" },
  { label: "Helios Holdings wire", kind: "recent" },
  { label: "Board minutes 2026", kind: "suggested" },
  { label: "Vendor contracts expiring", kind: "suggested" },
];
const SCOPES: AiSearchScope[] = [
  { id: "files", label: "Files" },
  { id: "case", label: "Case 22-1187" },
];
const EXAMPLES = ["Summarise what changed in the vendor contracts", "Who signed off the Q3 budget?"];

const field = (el: Element) => el.querySelector<HTMLInputElement & HTMLTextAreaElement>(".ui-aisr__input")!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const type = (input: HTMLInputElement | HTMLTextAreaElement, text: string) => {
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const options = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcAiSearch>(html`<tc-ai-search look=${look} .suggestions=${SUGGESTIONS} .scopes=${SCOPES} .examples=${EXAMPLES}></tc-ai-search>`);

describe("tc-ai-search", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a combobox with scope chips, the AI mode switch, the contents checkbox and the hotkey hint`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("aisr");
      expect(el.dataset.look).toBe(look);
      const input = field(el);
      expect(input.getAttribute("role")).toBe("combobox");
      expect(input.getAttribute("aria-expanded")).toBe("false");
      expect(input.getAttribute("aria-label")).toBe("Search");
      expect([...el.querySelectorAll(".ui-aisr__scope")].map((s) => s.textContent!.trim())).toEqual(["Files", "Case 22-1187"]);
      const sw = el.querySelector<HTMLElement>('[role="switch"]')!;
      expect(sw.getAttribute("aria-checked")).toBe("false");
      expect(sw.textContent!.trim()).toBe("AI mode");
      expect(el.querySelector(".ui-aisr__check")!.textContent!.trim()).toBe("Search within file contents");
      expect(el.querySelectorAll(".ui-aisr__keys kbd")).toHaveLength(2);
      // An empty search field has no Send yet; it appears with the first character
      expect(el.querySelector(".ui-aisr__send")).toBeNull();
    });
  }

  test("the card: Standard's tray and Clean's divider, the drawn checkbox, the keys hint by mode, and the focus ring on the card", async () => {
    const std = await make();
    const clean = await make("clean");
    // Standard: the tray is the host, the card is the box; Clean: the host is the card, the switches below a divider
    expect(getComputedStyle(std).backgroundColor).not.toBe(getComputedStyle(std.querySelector(".ui-aisr__box")!).backgroundColor);
    expect(getComputedStyle(clean.querySelector(".ui-aisr__opts")!).borderTopStyle).toBe("solid");
    // The examples sit inside the card in AI mode
    std.mode = "ai";
    await settle();
    expect(std.querySelector(".ui-aisr__box .ui-aisr__examples")).not.toBeNull();
    expect(std.querySelector(".ui-aisr__hint")!.textContent!.replace(/\s+/g, " ").trim()).toBe("↵ to ask · ⇧↵ new line");
    expect(clean.querySelector(".ui-aisr__hint")!.textContent!.replace(/\s+/g, " ").trim()).toBe("↵ to search");
    expect(clean.querySelector(".ui-aisr__hint")!.getAttribute("aria-hidden")).toBe("true");
    // The checkbox is the real one, drawn with tokens; its tick shows when checked
    const box = clean.querySelector<HTMLInputElement>(".ui-aisr__check input")!;
    expect(getComputedStyle(box).appearance).toBe("none");
    box.click();
    await settle();
    expect(clean.contents).toBe(true);
    await expect.poll(() => getComputedStyle(clean.querySelector(".ui-aisr__tick")!).strokeDashoffset).toBe("0px");
    // The prompt is three lines tall at least
    const prompt = std.querySelector<HTMLTextAreaElement>("textarea")!;
    expect(prompt.getBoundingClientRect().height).toBeGreaterThanOrEqual(3 * parseFloat(getComputedStyle(prompt).lineHeight) - 1);
    // Focus rings the card
    clean.querySelector<HTMLInputElement>(".ui-aisr__input")!.focus();
    await expect.poll(() => getComputedStyle(clean).boxShadow).toContain("0px 0px 0px");
  });

  test("suggestions: open on focus, recent first, filtered as you type, ↓ ↑ move, Enter submits the one picked", async () => {
    const el = await make();
    const got: AiSearchSubmit[] = [];
    el.addEventListener("tc-submit", (e) => got.push((e as CustomEvent<AiSearchSubmit>).detail));
    const input = field(el);
    input.focus();
    await settle();
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect([...el.querySelectorAll(".ui-aisr__group")].map((g) => g.textContent)).toEqual(["Recent", "Suggested"]);
    expect(options(el)).toHaveLength(4);
    type(input, "hel");
    await settle();
    expect(options(el).map((o) => o.textContent!.trim())).toEqual(["Helios Holdings wire"]);
    type(input, "o");
    await settle();
    key(input, "ArrowDown");
    await settle();
    expect(input.getAttribute("aria-activedescendant")).toBe(options(el)[0].id);
    key(input, "ArrowDown");
    key(input, "ArrowUp");
    await settle();
    key(input, "ArrowUp");
    await settle();
    // Wraps from the first to the last
    expect(input.getAttribute("aria-activedescendant")).toBe(options(el)[options(el).length - 1].id);
    const last = options(el)[options(el).length - 1].textContent!.trim();
    key(input, "Enter");
    await settle();
    expect(got).toEqual([{ query: last, mode: "search", contents: false, scopes: ["files", "case"] }]);
    expect(input.value).toBe(last);
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  test("suggestions show their hint and pick out what's typed; Send appears with the first character", async () => {
    const el = await fixture<TcAiSearch>(html`<tc-ai-search .suggestions=${[{ label: "Helios Holdings wire", kind: "recent", hint: "Yesterday" }]}></tc-ai-search>`);
    const input = field(el);
    input.focus();
    await settle();
    expect(el.querySelector(".ui-aisr__option-hint")!.textContent).toBe("Yesterday");
    expect(el.querySelector(".ui-aisr__match")).toBeNull();
    expect(el.querySelector(".ui-aisr__send")).toBeNull();
    type(input, "HOLD");
    await settle();
    expect(el.querySelector(".ui-aisr__match")!.textContent).toBe("Hold");
    expect(el.querySelector(".ui-aisr__option-label")!.textContent).toBe("Helios Holdings wire");
    expect(el.querySelector<HTMLButtonElement>(".ui-aisr__send")!.disabled).toBe(false);
  });

  test("Enter with nothing picked searches for what's typed; Escape closes the list, then clears", async () => {
    const el = await make();
    const got: string[] = [];
    el.addEventListener("tc-submit", (e) => got.push((e as CustomEvent<AiSearchSubmit>).detail.query));
    const input = field(el);
    input.focus();
    type(input, "  quarterly report ");
    await settle();
    key(input, "Enter");
    expect(got).toEqual(["quarterly report"]);
    type(input, "b");
    await settle();
    expect(input.getAttribute("aria-expanded")).toBe("true");
    key(input, "Escape");
    await settle();
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(input.value).toBe("b");
    key(input, "Escape");
    await settle();
    expect(input.value).toBe("");
    // A click on a suggestion submits it
    type(input, "board");
    await settle();
    options(el)[0].click();
    expect(got.at(-1)).toBe("Board minutes 2026");
  });

  test("AI mode: a multi-line prompt, example prompts, Enter asks and Shift+Enter doesn't; tc-mode-change", async () => {
    const el = await make();
    const modes: string[] = [];
    const got: AiSearchSubmit[] = [];
    el.addEventListener("tc-mode-change", (e) => modes.push((e as CustomEvent<{ mode: string }>).detail.mode));
    el.addEventListener("tc-submit", (e) => got.push((e as CustomEvent<AiSearchSubmit>).detail));
    el.querySelector<HTMLElement>('[role="switch"]')!.click();
    await settle();
    expect(el.mode).toBe("ai");
    expect(field(el).tagName).toBe("TEXTAREA");
    expect(field(el).getAttribute("aria-label")).toBe("Search, AI mode");
    expect(el.querySelectorAll('[role="option"]')).toHaveLength(0);
    const examples = [...el.querySelectorAll<HTMLButtonElement>(".ui-aisr__example")];
    expect(examples.map((b) => b.textContent!.trim())).toEqual(EXAMPLES);
    examples[1].click();
    await settle();
    expect(field(el).value).toBe(EXAMPLES[1]);
    await expect.poll(() => document.activeElement === field(el)).toBe(true);
    key(field(el), "Enter", { shiftKey: true });
    expect(got).toEqual([]);
    key(field(el), "Enter");
    expect(got).toEqual([{ query: EXAMPLES[1], mode: "ai", contents: false, scopes: ["files", "case"] }]);
    expect(modes).toEqual(["ai"]);
  });

  test("the contents checkbox and scope chips change unless prevented; Clear empties the field", async () => {
    const el = await make();
    const box = el.querySelector<HTMLInputElement>(".ui-aisr__check input")!;
    box.click();
    await settle();
    expect(el.contents).toBe(true);
    el.addEventListener("tc-contents-change", (e) => e.preventDefault(), { once: true });
    box.click();
    await settle();
    expect(el.contents).toBe(true);
    expect(box.checked).toBe(true);
    el.querySelector<HTMLButtonElement>('.ui-aisr__scope-x[aria-label="Remove Files"]')!.click();
    await settle();
    expect(el.scopes.map((s) => s.id)).toEqual(["case"]);
    el.addEventListener("tc-scope-remove", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-aisr__scope-x")!.click();
    await settle();
    expect(el.scopes.map((s) => s.id)).toEqual(["case"]);
    type(field(el), "draft");
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-aisr__clear")!.click();
    await settle();
    expect(field(el).value).toBe("");
  });

  test("the hotkey focuses the field from anywhere; hotkey false turns it off; prevented mode stays", async () => {
    const el = await make();
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true, bubbles: true, cancelable: true }));
    await expect.poll(() => document.activeElement === field(el)).toBe(true);
    field(el).blur();
    el.hotkey = false;
    await settle();
    expect(el.querySelector(".ui-aisr__keys")).toBeNull();
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true, bubbles: true, cancelable: true }));
    await settle();
    expect(document.activeElement).not.toBe(field(el));
    el.addEventListener("tc-mode-change", (e) => e.preventDefault());
    el.querySelector<HTMLElement>('[role="switch"]')!.click();
    await settle();
    expect(el.mode).toBe("search");
  });

  test("React wrapper: uncontrolled mode and scopes survive parent re-renders; onSearch gets the submit", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const got: AiSearchSubmit[] = [];
    const modes: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(AiSearch, {
        suggestions: SUGGESTIONS,
        defaultScopes: SCOPES,
        onModeChange: (m) => void modes.push(m),
        onSearch: (d) => void got.push(d),
        "data-n": n,
      } as React.ComponentProps<typeof AiSearch>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-ai-search")!;
    el.querySelector<HTMLButtonElement>('.ui-aisr__scope-x[aria-label="Remove Files"]')!.click();
    el.querySelector<HTMLElement>('[role="switch"]')!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.mode).toBe("ai");
    expect(el.scopes.map((s) => s.id)).toEqual(["case"]);
    type(field(el), "what changed?");
    await settle();
    await act(async () => bump());
    await settle();
    expect(field(el).value).toBe("what changed?");
    key(field(el), "Enter");
    expect(got).toEqual([{ query: "what changed?", mode: "ai", contents: false, scopes: ["case"] }]);
    expect(modes).toEqual(["ai"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled mode stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[] = [];
    await act(async () => root.render(React.createElement(AiSearch, { mode: "search", onModeChange: (m) => void asked.push(m) })));
    await settle();
    const el = host.querySelector("tc-ai-search")!;
    el.querySelector<HTMLElement>('[role="switch"]')!.click();
    await settle();
    expect(asked).toEqual(["ai"]);
    expect(el.mode).toBe("search");
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled value – typing asks the parent, and the parent can clear the field after a search", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[] = [];
    function Page() {
      const [q, setQ] = React.useState("first");
      return React.createElement(AiSearch, {
        value: q,
        onQueryChange: (next) => {
          asked.push(next);
          if (next !== "nope") setQ(next);
        },
        onSearch: () => setQ(""),
      });
    }
    await act(async () => root.render(React.createElement(Page)));
    await settle();
    const el = host.querySelector("tc-ai-search")!;
    expect(field(el).value).toBe("first");
    await act(async () => type(field(el), "nope"));
    await settle();
    expect(asked).toEqual(["nope"]);
    expect([el.value, field(el).value]).toEqual(["first", "first"]);
    await act(async () => type(field(el), "invoice"));
    await settle();
    expect([el.value, field(el).value]).toEqual(["invoice", "invoice"]);
    await act(async () => void key(field(el), "Enter"));
    await settle();
    expect([el.value, field(el).value]).toEqual(["", ""]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, list open and in AI mode`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px 16px 280px; background: var(--tc-surface-base)">
        <tc-ai-search .suggestions=${SUGGESTIONS} .scopes=${SCOPES}></tc-ai-search>
        <tc-ai-search look="clean" mode="ai" contents .examples=${EXAMPLES}></tc-ai-search>
      </div>`);
      field(wrap.querySelector("tc-ai-search")!).focus();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
