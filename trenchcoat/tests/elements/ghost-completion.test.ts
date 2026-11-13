/*
 * <tc-ghost-completion> in real browsers: the field and its name, a suggestion shown after the text, Tab / Ctrl+→ /
 * Escape, typing that uses the suggestion up, suggest() debounced and aborted, controlled value, React and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/ghost-completion";
import { nextWord, type TcGhostCompletion } from "../../src/elements/ghost-completion";
import { GhostCompletion } from "../../src/elements/react/ghost-completion";
import { cleanup, finish, fixture, pageStyles, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const field = (el: Element) => el.querySelector<HTMLTextAreaElement>(".ui-ghc__input")!;
const ghost = (el: Element) => el.querySelector(".ui-ghc__ghost")!.textContent;
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const key = (el: Element, k: string, mods: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...mods });
  field(el).dispatchEvent(e);
  return e;
};
const toEnd = (el: Element) => {
  const f = field(el);
  f.focus();
  f.setSelectionRange(f.value.length, f.value.length);
};
async function type(el: TcGhostCompletion, text: string) {
  const f = field(el);
  f.value += text;
  f.setSelectionRange(f.value.length, f.value.length);
  f.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
  await settle();
}

test("nextWord takes the next word with the space before it", () => {
  expect(nextWord(" last completed in March")).toBe(" last");
  expect(nextWord("ing the rest")).toBe("ing");
  expect(nextWord("   ")).toBe("   ");
});

for (const look of ["standard", "clean"] as const) {
  describe(`tc-ghost-completion (${look})`, () => {
    test("the field is named by its label and described by the keys; the header shows the heading", async () => {
      const el = await fixture<TcGhostCompletion>(html`<tc-ghost-completion look=${look} heading="Finding 4" label="Finding"></tc-ghost-completion>`);
      expect(el.dataset.ui).toBe("ghc");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Finding 4");
      const f = field(el);
      expect(document.querySelector(`label[for="${f.id}"]`)!.textContent).toBe("Finding");
      expect(document.getElementById(f.getAttribute("aria-describedby")!)!.textContent).toMatch(/Tab accepts/);
      expect(el.querySelector(".ui-ghc__mirror")!.getAttribute("aria-hidden")).toBe("true");
      expect([...el.querySelectorAll("textarea, button, [tabindex]")].filter((n) => (n as HTMLElement).tabIndex >= 0)).toHaveLength(1);
    });

    test("a suggestion shows after the text, with the hint, and is read once", async () => {
      const el = await fixture<TcGhostCompletion>(html`<tc-ghost-completion look=${look} value="Reviews were" suggestion=" last done in March."></tc-ghost-completion>`);
      expect(el.querySelector(".ui-ghc__typed")!.textContent).toBe("Reviews were");
      expect(ghost(el)).toBe(" last done in March.");
      expect(el.querySelector<HTMLElement>(".ui-ghc__hint")!.hidden).toBe(false);
      expect(status(el)).toBe("Suggestion: last done in March.");
      expect(field(el).placeholder).toBe("");
    });

    test("Tab takes the whole suggestion: the value changes and tc-accept says so", async () => {
      const el = await fixture<TcGhostCompletion>(html`<tc-ghost-completion look=${look} value="Reviews were" suggestion=" late."></tc-ghost-completion>`);
      const values: string[] = [];
      const accepts: unknown[] = [];
      el.addEventListener("tc-value-change", (e) => values.push((e as CustomEvent).detail.value));
      el.addEventListener("tc-accept", (e) => accepts.push((e as CustomEvent).detail));
      toEnd(el);
      const e = key(el, "Tab");
      await settle();
      expect(e.defaultPrevented).toBe(true);
      expect(el.value).toBe("Reviews were late.");
      expect(field(el).value).toBe("Reviews were late.");
      expect(values).toEqual(["Reviews were late."]);
      expect(accepts).toEqual([{ text: " late.", whole: true }]);
      expect(ghost(el)).toBe("");
      expect(el.querySelector<HTMLElement>(".ui-ghc__hint")!.hidden).toBe(true);
    });

    test("Tab with no suggestion is left alone, so focus can move on", async () => {
      const el = await fixture<TcGhostCompletion>(html`<tc-ghost-completion look=${look} value="Text"></tc-ghost-completion>`);
      toEnd(el);
      expect(key(el, "Tab").defaultPrevented).toBe(false);
    });

    test("Ctrl/⌘ + → takes the next word; the rest stays", async () => {
      const el = await fixture<TcGhostCompletion>(html`<tc-ghost-completion look=${look} value="Reviews were" suggestion=" last done in March."></tc-ghost-completion>`);
      const accepts: unknown[] = [];
      el.addEventListener("tc-accept", (e) => accepts.push((e as CustomEvent).detail));
      toEnd(el);
      key(el, "ArrowRight", { ctrlKey: true, metaKey: true });
      await settle();
      expect(el.value).toBe("Reviews were last");
      expect(ghost(el)).toBe(" done in March.");
      expect(accepts).toEqual([{ text: " last", whole: false }]);
    });

    test("Escape dismisses the suggestion with tc-dismiss", async () => {
      const el = await fixture<TcGhostCompletion>(html`<tc-ghost-completion look=${look} value="Reviews were" suggestion=" late."></tc-ghost-completion>`);
      const dismissed = vi.fn();
      el.addEventListener("tc-dismiss", (e) => dismissed((e as CustomEvent).detail));
      toEnd(el);
      expect(key(el, "Escape").defaultPrevented).toBe(true);
      await settle();
      expect(ghost(el)).toBe("");
      expect(dismissed).toHaveBeenCalledWith({ text: " late." });
      expect(el.value).toBe("Reviews were");
    });

    test("typing the suggestion's letters uses them up; other letters drop it", async () => {
      const el = await fixture<TcGhostCompletion>(html`<tc-ghost-completion look=${look} value="Reviews were" suggestion=" late."></tc-ghost-completion>`);
      toEnd(el);
      await type(el, " la");
      expect(el.value).toBe("Reviews were la");
      expect(ghost(el)).toBe("te.");
      await type(el, "x");
      expect(ghost(el)).toBe("");
    });

    test("moving the caret off the end hides the suggestion", async () => {
      const el = await fixture<TcGhostCompletion>(html`<tc-ghost-completion look=${look} value="Reviews were" suggestion=" late."></tc-ghost-completion>`);
      const f = field(el);
      f.focus();
      f.setSelectionRange(2, 2);
      f.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowLeft", bubbles: true }));
      await settle();
      expect(ghost(el)).toBe("");
    });

    test("suggest() is asked after typing pauses, aborted when typing goes on, and its answer shows", async () => {
      const signals: AbortSignal[] = [];
      const suggest = vi.fn((text: string, signal: AbortSignal) => {
        signals.push(signal);
        return new Promise<string>((resolve) => setTimeout(() => resolve(text.endsWith("were") ? " late." : ""), 30));
      });
      const el = await fixture<TcGhostCompletion>(html`<tc-ghost-completion look=${look} value="Reviews" debounce="10" .suggest=${suggest}></tc-ghost-completion>`);
      toEnd(el);
      await type(el, " w");
      await expect.poll(() => suggest.mock.calls.length).toBe(1);
      await type(el, "ere");
      await expect.poll(() => signals[0].aborted).toBe(true);
      await expect.poll(() => ghost(el)).toBe(" late.");
      expect(suggest).toHaveBeenLastCalledWith("Reviews were", expect.anything());
      expect(el.querySelector(".ui-ghc__loading")).toBeNull();
    });

    test("controlled: a prevented change keeps the value and the field shows it", async () => {
      const el = await fixture<TcGhostCompletion>(html`<tc-ghost-completion look=${look} value="Kept" suggestion=" more"></tc-ghost-completion>`);
      el.addEventListener("tc-value-change", (e) => e.preventDefault());
      toEnd(el);
      await type(el, "!");
      expect(el.value).toBe("Kept");
      expect(field(el).value).toBe("Kept");
      key(el, "Tab");
      await settle();
      expect(el.value).toBe("Kept");
      expect(ghost(el)).toBe(" more");
    });

    test("disabled: no suggestion and no editing", async () => {
      const el = await fixture<TcGhostCompletion>(html`<tc-ghost-completion look=${look} disabled value="Text" suggestion=" more"></tc-ghost-completion>`);
      expect(field(el).disabled).toBe(true);
      expect(ghost(el)).toBe("");
    });

    test("narrow: the field stays inside the width", async () => {
      const wrap = await fixture<HTMLElement>(html`<div style="width: 260px"><tc-ghost-completion look=${look} value="A long finding about access reviews" suggestion=" that wraps onto more lines"></tc-ghost-completion></div>`);
      const el = wrap.querySelector("tc-ghost-completion")!;
      expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(261);
      expect(field(el).getBoundingClientRect().right).toBeLessThanOrEqual(el.getBoundingClientRect().right + 1);
    });
  });
}

test("labels rename the hint and the announcement", async () => {
  const el = await fixture<TcGhostCompletion>(html`<tc-ghost-completion value="Hola" suggestion=" mundo" .labels=${{ hint: "para aceptar", suggestion: "Sugerencia" }}></tc-ghost-completion>`);
  expect(el.querySelector(".ui-ghc__hint")!.textContent).toMatch(/para aceptar/);
  expect(status(el)).toBe("Sugerencia: mundo");
});

test("React: an uncontrolled value survives re-renders; callbacks get their details", async () => {
  const wrap = document.body.appendChild(document.createElement("div"));
  const root = createRoot(wrap);
  const onValueChange = vi.fn();
  const onAccept = vi.fn();
  const render = (title: string) => act(async () => root.render(React.createElement(GhostCompletion, { title, defaultValue: "Reviews were", suggestion: " late.", onValueChange, onAccept })));
  await render("One");
  const el = wrap.querySelector<TcGhostCompletion>("tc-ghost-completion")!;
  await settle(wrap);
  toEnd(el);
  await act(async () => void key(el, "Tab"));
  await settle(wrap);
  expect(onValueChange).toHaveBeenCalledWith("Reviews were late.");
  expect(onAccept).toHaveBeenCalledWith(" late.", true);
  await render("Two");
  await settle(wrap);
  expect(el.heading).toBe("Two");
  expect(el.value).toBe("Reviews were late.");
  await act(async () => root.unmount());
  wrap.remove();
});

test("React: a controlled value stays until the parent changes it, and the suggestion follows it", async () => {
  const wrap = document.body.appendChild(document.createElement("div"));
  const root = createRoot(wrap);
  const onValueChange = vi.fn();
  const render = (value: string) => act(async () => root.render(React.createElement(GhostCompletion, { value, suggestion: " late.", onValueChange })));
  await render("Reviews were");
  const el = wrap.querySelector<TcGhostCompletion>("tc-ghost-completion")!;
  await settle(wrap);
  toEnd(el);
  await act(async () => void key(el, "Tab"));
  await settle(wrap);
  expect(onValueChange).toHaveBeenCalledWith("Reviews were late.");
  expect(el.value).toBe("Reviews were");
  expect(ghost(el)).toBe(" late.");
  await render("Reviews were late.");
  await settle(wrap);
  expect(ghost(el)).toBe("");
  await act(async () => root.unmount());
  wrap.remove();
});

for (const theme of ["light", "dark"] as const) {
  test(`axe (${theme}): no violations in either look`, async () => {
    const wrap = await fixture<HTMLElement>(html`<div data-tc-page data-tc-theme=${theme} style="padding: 16px; display: grid; gap: 16px">${pageStyles}
      <tc-ghost-completion look="standard" heading="Finding" label="Finding" value="Reviews were" suggestion=" last done in March."></tc-ghost-completion>
      <tc-ghost-completion look="clean" heading="Empty" label="Note" placeholder="Write a note…"></tc-ghost-completion>
      <tc-ghost-completion look="clean" heading="Disabled" label="Locked" disabled value="Read only"></tc-ghost-completion>
    </div>`);
    await finish(wrap);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
