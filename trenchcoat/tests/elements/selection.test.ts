/*
 * internal/selection.ts in real browsers: the offset maths (DOM points ⇄ text offsets, skipped content, clamping),
 * characters and words, segments for rendering marks, and the controller – pointer reads, caret-mode keys, and offsets
 * that survive a re-render.
 */
import { html, LitElement, render } from "lit";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import {
  marks,
  nextGrapheme,
  nextWordEnd,
  offsetOf,
  pointAt,
  prevGrapheme,
  prevWordStart,
  rangeOf,
  segments,
  SelectionController,
  textOf,
  trimRange,
  type TextSelection,
} from "../../src/elements/internal/selection";
import { cleanup } from "./helpers";

afterEach(() => {
  document.getSelection()?.removeAllRanges();
  cleanup();
});

const box = (markup: string) => {
  const el = document.createElement("div");
  el.innerHTML = markup;
  document.body.append(el);
  return el;
};

describe("offsets ⇄ DOM points", () => {
  test("text nodes add up in order; [data-tc-skip] content doesn't count", () => {
    const root = box(`Hello <b>brave</b><span data-tc-skip> (skip me)</span> new <i>w<u>or</u>ld</i>`);
    expect(textOf(root)).toBe("Hello brave new world");
    const b = root.querySelector("b")!.firstChild!;
    expect(offsetOf(root, b, 0)).toBe(6);
    expect(offsetOf(root, b, 5)).toBe(11);
    const u = root.querySelector("u")!.firstChild!;
    expect(offsetOf(root, u, 1)).toBe(18);
    // A point inside skipped text sits where the skipped element is
    const skipped = root.querySelector("[data-tc-skip]")!.firstChild!;
    expect(offsetOf(root, skipped, 4)).toBe(11);
  });

  test("element-level points and points outside the root are clamped", () => {
    const root = box(`ab<b>cd</b>ef`);
    expect(offsetOf(root, root, 0)).toBe(0);
    expect(offsetOf(root, root, 1)).toBe(2);
    expect(offsetOf(root, root, 2)).toBe(4);
    expect(offsetOf(root, root, 3)).toBe(6);
    const before = document.createElement("p");
    const after = document.createElement("p");
    root.before(before);
    root.after(after);
    expect(offsetOf(root, before, 0)).toBe(0);
    expect(offsetOf(root, after, 0)).toBe(6);
  });

  test("pointAt: forward bias starts the next node at a boundary, backward ends the previous one", () => {
    const root = box(`ab<b>cd</b>ef`);
    const b = root.querySelector("b")!.firstChild!;
    expect(pointAt(root, 2, "forward")).toEqual({ node: b, offset: 0 });
    expect(pointAt(root, 2, "backward")).toEqual({ node: root.firstChild, offset: 2 });
    expect(pointAt(root, 6)).toEqual({ node: root.lastChild, offset: 2 });
    for (let i = 0; i <= 6; i++) {
      const p = pointAt(root, i);
      expect(offsetOf(root, p.node, p.offset)).toBe(i);
    }
  });

  test("rangeOf covers exactly [start, end), in either order", () => {
    const root = box(`one <mark>two</mark> three`);
    expect(rangeOf(root, 4, 7).toString()).toBe("two");
    expect(rangeOf(root, 9, 2).toString()).toBe("e two t");
    expect(rangeOf(root, 3, 3).collapsed).toBe(true);
  });

  test("an empty root", () => {
    const root = box("");
    expect(textOf(root)).toBe("");
    expect(offsetOf(root, root, 0)).toBe(0);
    expect(rangeOf(root, 0, 0).collapsed).toBe(true);
  });
});

describe("characters and words", () => {
  test("graphemes: an emoji or a letter with an accent is one step", () => {
    const t = "a👍🏽éb";
    expect(nextGrapheme(t, 0)).toBe(1);
    expect(nextGrapheme(t, 1)).toBe(5);
    expect(prevGrapheme(t, 5)).toBe(1);
    expect(nextGrapheme(t, 5)).toBe(7);
    expect(prevGrapheme(t, 7)).toBe(5);
    expect(nextGrapheme(t, t.length)).toBe(t.length);
    expect(prevGrapheme(t, 0)).toBe(0);
  });

  test("word steps: to the end of the next word, to the start of the previous", () => {
    const t = "The quick, brown fox.";
    expect(nextWordEnd(t, 0)).toBe(3);
    expect(nextWordEnd(t, 3)).toBe(9);
    expect(nextWordEnd(t, 9)).toBe(16);
    expect(nextWordEnd(t, 20)).toBe(21);
    expect(prevWordStart(t, 21)).toBe(17);
    expect(prevWordStart(t, 17)).toBe(11);
    expect(prevWordStart(t, 6)).toBe(4);
    expect(prevWordStart(t, 2)).toBe(0);
  });

  test("trimRange drops white space at the ends and orders the offsets", () => {
    expect(trimRange("  hi there  ", 0, 12)).toEqual({ start: 2, end: 10 });
    expect(trimRange("a   b", 4, 1)).toEqual({ start: 4, end: 4 });
    expect(trimRange("abc", -3, 99)).toEqual({ start: 0, end: 3 });
  });
});

describe("segments and marks", () => {
  test("split at every boundary; covering ranges innermost first; clamped and invalid ranges handled", () => {
    const a = { id: "a", start: 0, end: 9 };
    const b = { id: "b", start: 4, end: 6 };
    const c = { id: "c", start: 7, end: 99 };
    const d = { id: "d", start: 5, end: 5 };
    const segs = segments("abcdefghijkl", [a, b, c, d, { id: "e", start: NaN, end: 3 }]);
    expect(segs.map((s) => [s.text, s.ranges.map((r) => r.id).join("")])).toEqual([
      ["abcd", "a"],
      ["ef", "ba"],
      ["g", "a"],
      // c is clamped to the text's end, so it's the shorter one there
      ["hi", "ca"],
      ["jkl", "c"],
    ]);
    expect(segs.map((s) => s.text).join("")).toBe("abcdefghijkl");
    // Equal lengths keep the order they were given in
    expect(segments("abcd", [{ start: 0, end: 2, id: "x" }, { start: 0, end: 2, id: "y" }])[0].ranges.map((r) => r.id)).toEqual(["x", "y"]);
    expect(segments("", [{ start: 0, end: 3 }])).toEqual([]);
    expect(segments("plain", [])).toEqual([{ start: 0, end: 5, text: "plain", ranges: [] }]);
  });

  test("marks render as template parts whose text adds up to the source, so offsets keep working", () => {
    const root = box("");
    const text = "Highlight this and that.";
    render(html`${marks(text, [{ start: 10, end: 14 }, { start: 19, end: 23 }])}`, root);
    expect([...root.querySelectorAll("mark")].map((m) => m.textContent)).toEqual(["this", "that"]);
    expect(textOf(root)).toBe(text);
    const second = root.querySelectorAll("mark")[1].firstChild!;
    expect(offsetOf(root, second, 0)).toBe(19);
  });
});

/* ---------- The controller, in a host ---------- */

class SelHost extends LitElement {
  static properties = { text: {}, hl: { attribute: false } };
  declare text: string;
  declare hl: { start: number; end: number }[];
  changes: [TextSelection | null, string, boolean][] = [];
  sel = new SelectionController(this, {
    root: () => this.querySelector(".root"),
    caret: true,
    caretEl: () => this.querySelector(".caret"),
    onChange: (s, how) => this.changes.push([s, how.cause, how.final]),
  });
  constructor() {
    super();
    this.text = "";
    this.hl = [];
  }
  protected createRenderRoot() {
    return this;
  }
  render() {
    return html`<div style="position:relative;width:240px;font:16px/24px monospace">
      <div class="root" tabindex="0" @keydown=${(e: KeyboardEvent) => this.sel.onKeyDown(e)}>${marks(this.text, this.hl)}</div>
      <span class="caret" hidden style="position:absolute;left:0;top:0;width:1px;background:red"></span>
    </div>`;
  }
}
customElements.define("tc-test-sel-host", SelHost);

const host = async (text: string) => {
  const el = document.createElement("tc-test-sel-host") as SelHost;
  el.text = text;
  document.body.append(el);
  await el.updateComplete;
  return el;
};
// Firefox queues selectionchange a few frames after the change
const frames = (n = 6) => new Promise<void>((r) => { const step = (k: number) => (k ? requestAnimationFrame(() => step(k - 1)) : r()); step(n); });

describe("SelectionController", () => {
  test("reads a native (pointer) selection as offsets, text and a rect", async () => {
    const el = await host("Select some words here");
    const root = el.querySelector<HTMLElement>(".root")!;
    const r = rangeOf(root, 7, 17);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(r);
    await frames();
    expect(el.sel.start).toBe(7);
    expect(el.sel.end).toBe(17);
    expect(el.sel.text).toBe("some words");
    expect(el.sel.value).toMatchObject({ start: 7, end: 17, collapsed: false });
    const rect = el.sel.rect()!;
    expect(rect.width).toBeGreaterThan(0);
    expect(el.changes.at(-1)![0]!.text).toBe("some words");
    expect(el.changes.at(-1)![1]).toBe("pointer");
  });

  test("a selection partly outside the root is clamped; a real selection elsewhere clears it; a click elsewhere doesn't", async () => {
    const el = await host("Inside text");
    const outside = box("Outside text");
    const root = el.querySelector<HTMLElement>(".root")!;
    const native = document.getSelection()!;
    const t = [...root.childNodes].find((n) => n.nodeType === 3)!;
    native.setBaseAndExtent(t, 7, outside.firstChild!, 3);
    await frames();
    expect([el.sel.start, el.sel.end]).toEqual([7, 11]);
    native.collapse(outside.firstChild!, 2);
    await frames();
    expect([el.sel.start, el.sel.end]).toEqual([7, 11]);
    native.setBaseAndExtent(outside.firstChild!, 0, outside.firstChild!, 4);
    await frames();
    expect(el.sel.value).toBeNull();
  });

  test("caret mode: arrows move by character, Shift extends, Ctrl/Alt by word, Home/End, select all, Esc collapses", async () => {
    const el = await host("one two three");
    const root = el.querySelector<HTMLElement>(".root")!;
    root.focus();
    const mac = /mac/i.test(navigator.userAgent);
    const word = mac ? "Alt" : "Control";
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect([el.sel.anchor, el.sel.focus]).toEqual([2, 2]);
    expect(el.querySelector<HTMLElement>(".caret")!.hidden).toBe(false);
    await userEvent.keyboard("{Shift>}{ArrowRight}{ArrowRight}{/Shift}");
    expect([el.sel.anchor, el.sel.focus]).toEqual([2, 4]);
    expect(el.sel.text).toBe("e ");
    expect(document.getSelection()!.toString()).toBe("e ");
    expect(el.querySelector<HTMLElement>(".caret")!.hidden).toBe(true);
    await userEvent.keyboard(`{Shift>}{${word}>}{ArrowRight}{/${word}}{/Shift}`);
    expect(el.sel.text).toBe("e two");
    // Without Shift, → collapses to the selection's end
    await userEvent.keyboard("{ArrowRight}");
    expect([el.sel.anchor, el.sel.focus]).toEqual([7, 7]);
    await userEvent.keyboard(`{Shift>}{${word}>}{ArrowLeft}{/${word}}{/Shift}`);
    expect(el.sel.text).toBe("two");
    await userEvent.keyboard("{Escape}");
    expect(el.sel.collapsed).toBe(true);
    await userEvent.keyboard(mac ? "{Meta>}a{/Meta}" : "{Control>}a{/Control}");
    expect(el.sel.text).toBe("one two three");
    await userEvent.keyboard("{Home}");
    expect(el.sel.focus).toBe(0);
    await userEvent.keyboard("{Shift>}{End}{/Shift}");
    expect(el.sel.text).toBe("one two three");
    expect(el.changes.every(([, cause]) => cause === "keyboard" || cause === "pointer")).toBe(true);
  });

  test("caret mode: ↑ ↓ move a line, keeping the column", async () => {
    // 240 px of 16 px monospace wraps at ~24 characters
    const el = await host("aaaa bbbb cccc dddd eeee ffff gggg hhhh iiii jjjj kkkk");
    const root = el.querySelector<HTMLElement>(".root")!;
    root.focus();
    el.sel.select(2);
    await userEvent.keyboard("{ArrowDown}");
    const down = el.sel.focus!;
    expect(down).toBeGreaterThan(20);
    expect(down % 5).toBe(2);
    await userEvent.keyboard("{ArrowUp}");
    expect(el.sel.focus).toBe(2);
    await userEvent.keyboard("{ArrowUp}");
    expect(el.sel.focus).toBe(0);
  });

  test("caret mode: ↑ ↓ stop on empty lines between paragraphs", async () => {
    const el = await host("Title\n\nPara one\n\nPara two");
    el.querySelector<HTMLElement>(".root")!.style.whiteSpace = "pre-wrap";
    el.querySelector<HTMLElement>(".root")!.focus();
    el.sel.select(0);
    const seen: number[] = [];
    for (let k = 0; k < 4; k++) {
      await userEvent.keyboard("{ArrowDown}");
      seen.push(el.sel.focus!);
    }
    expect(seen).toEqual([6, 7, 16, 17]);
    // The caret is drawn on the empty line, below the title
    el.sel.select(6);
    const caret = el.querySelector<HTMLElement>(".caret")!;
    const title = el.sel.rect();
    expect(caret.hidden).toBe(false);
    expect(title!.top).toBeGreaterThan(el.querySelector(".root")!.getBoundingClientRect().top + 10);
  });

  test("offsets survive a re-render that replaces the nodes, and the native selection is put back", async () => {
    const el = await host("Keep this selected please");
    const root = el.querySelector<HTMLElement>(".root")!;
    root.focus();
    el.sel.select(5, 18);
    expect(document.getSelection()!.toString()).toBe("this selected");
    el.hl = [{ start: 10, end: 18 }];
    await el.updateComplete;
    expect(root.querySelector("mark")!.textContent).toBe("selected");
    expect([el.sel.start, el.sel.end]).toEqual([5, 18]);
    expect(document.getSelection()!.toString()).toBe("this selected");
    // The text shrinks under the selection: it's clamped
    el.text = "Keep this";
    el.hl = [];
    await el.updateComplete;
    expect([el.sel.start, el.sel.end]).toEqual([5, 9]);
  });

  test("clear() forgets the selection and the native one", async () => {
    const el = await host("Some text");
    el.sel.select(0, 4);
    el.sel.clear();
    expect(el.sel.value).toBeNull();
    expect(document.getSelection()!.toString()).toBe("");
    expect(el.changes.at(-1)![0]).toBeNull();
  });

  test("listeners go away with the host", async () => {
    const el = await host("Some text");
    el.remove();
    const before = el.changes.length;
    const t = box("Elsewhere");
    document.getSelection()!.setBaseAndExtent(t.firstChild!, 0, t.firstChild!, 4);
    await frames();
    expect(el.changes.length).toBe(before);
  });
});
