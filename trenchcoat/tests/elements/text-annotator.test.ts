/*
 * <tc-text-annotator> in real browsers: the host and both looks, marks from the value, selecting by pointer and by
 * keyboard, the toolbar (highlight, comment, copy), editing, resolving, removing with Undo, filters, controlled use,
 * the rail beside or under the text, read-only, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/text-annotator";
import type { TcTextAnnotator, TextAnnotation, TextAnnotatorCopy, TextAnnotatorValueChange } from "../../src/elements/text-annotator";
import { rangeOf, textOf } from "../../src/elements/internal/selection";
import { TextAnnotator } from "../../src/elements/react/text-annotator";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  document.getSelection()?.removeAllRanges();
  cleanup();
});

const TEXT = "Release notes\n\nThe export now runs in the background. You can keep working while it finishes.\n\nLarge files upload in parts, so a dropped connection only retries the last part.";
const at = (phrase: string) => ({ start: TEXT.indexOf(phrase), end: TEXT.indexOf(phrase) + phrase.length });
const NOTES: TextAnnotation[] = [
  { id: "a", ...at("runs in the background"), color: "yellow", author: "Maya Chen", at: "2026-10-26T09:00:00Z", comment: "Say how they'll know it's done." },
  { id: "b", ...at("keep working"), color: "green", author: "Ravi Patel" },
  { id: "c", ...at("only retries the last part"), color: "blue", author: "Maya Chen", resolved: true, comment: "Checked with the API team." },
];
const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Firefox queues selectionchange a few frames after the change
const frames = (n = 6) => new Promise<void>((r) => { const step = (k: number) => (k ? requestAnimationFrame(() => step(k - 1)) : r()); step(n); });
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const mac = /mac/i.test(navigator.userAgent);
const MOD = mac ? "Meta" : "Control";
const WORD = mac ? "Alt" : "Control";

const make = (o: { look?: string; value?: TextAnnotation[]; readonly?: boolean; width?: number } = {}) =>
  fixture<TcTextAnnotator>(
    html`<tc-text-annotator
      style=${`width: ${o.width ?? 900}px`}
      look=${o.look ?? "standard"}
      heading="Review"
      description="Draft 3"
      author="Jo Park"
      .timestamp=${() => "2026-10-27T10:00:00Z"}
      .text=${TEXT}
      .value=${o.value ?? NOTES}
      ?readonly=${!!o.readonly}
    ></tc-text-annotator>`,
  );
const root = (el: Element) => el.querySelector<HTMLElement>(".ui-tan__text")!;
const mark = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-tan__mark[data-first][data-id="${id}"]`);
const note = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-tan__note[data-id="${id}"]`);
const act_ = (el: Element, id: string, kind: string) => note(el, id)!.querySelector<HTMLButtonElement>(`.ui-tan__act[data-kind="${kind}"]`)!;
const pop = (el: Element) => el.querySelector<HTMLElement>(".ui-tan__pop");
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);
const events = (el: Element) => {
  const out: TextAnnotatorValueChange[] = [];
  el.addEventListener("tc-value-change", (e) => out.push((e as CustomEvent<TextAnnotatorValueChange>).detail));
  return out;
};
/** Selects [start, end) the way a pointer would: the native selection, then selectionchange */
const pick = async (el: TcTextAnnotator, start: number, end: number) => {
  root(el).focus();
  const r = rangeOf(root(el), start, end);
  document.getSelection()!.setBaseAndExtent(r.startContainer, r.startOffset, r.endContainer, r.endOffset);
  await frames();
  await el.updateComplete;
  await frames(2);
};

describe("tc-text-annotator", () => {
  for (const look of looks) {
    test(`${look}: the host is a region named by its heading, with the card header and a count`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("tan");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Review");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Draft 3");
      expect(plain(el.querySelector(".ui-tan__count")!.textContent)).toBe("3 highlights · , 1 open comment");
      // Standard: the header on the tray, outside the card; Clean: the card's first row
      expect(!!el.querySelector(".ui-tan__card > .tc-head")).toBe(look === "clean");
    });
  }

  test("marks render from the value; the text's offsets are untouched; marks say their colour and comments", async () => {
    const el = await make();
    expect(textOf(root(el))).toBe(TEXT);
    expect(root(el).getAttribute("role")).toBe("document");
    expect(root(el).getAttribute("aria-label")).toBe("Document text");
    const a = mark(el, "a")!;
    expect(a.dataset.color).toBe("yellow");
    expect(plain(a.textContent)).toBe("Yellow highlight, 1 comment: runs in the background");
    expect(plain(mark(el, "b")!.textContent)).toBe("Green highlight, no comments: keep working");
    expect(plain(mark(el, "c")!.textContent)).toContain("Blue highlight, 1 comment, resolved:");
    expect(mark(el, "c")!.hasAttribute("data-resolved")).toBe(true);
    // The mark is described by its comment in the rail
    expect(document.getElementById(a.getAttribute("aria-describedby")!)!.textContent).toBe("Say how they'll know it's done.");
    // Notes in reading order, with who and when
    expect([...el.querySelectorAll(".ui-tan__note")].map((n) => (n as HTMLElement).dataset.id)).toEqual(["a", "b", "c"]);
    expect(plain(note(el, "a")!.querySelector(".ui-tan__who")!.textContent)).toBe("Maya Chen");
    expect(note(el, "a")!.querySelector(".ui-tan__time")!.textContent).toMatch(/26/);
    expect(plain(note(el, "c")!.querySelector(".ui-tan__pill")!.textContent)).toBe("Resolved");
  });

  test("annotations outside the text are ignored; overlapping ones split the text, innermost on top", async () => {
    const el = await make({ value: [...NOTES, { id: "bad", start: 5, end: 999, color: "pink" }, { id: "wide", ...at("The export now runs in the background"), color: "purple" }] });
    expect(mark(el, "bad")).toBeNull();
    expect(textOf(root(el))).toBe(TEXT);
    expect(plain(mark(el, "wide")!.textContent)).toContain("The export now");
    expect(mark(el, "a")!.dataset.color).toBe("yellow");
  });

  test("a pointer selection opens the toolbar; a colour adds a highlight (cancelable tc-value-change)", async () => {
    const el = await make();
    const seen = events(el);
    const r = at("Large files");
    await pick(el, r.start - 2, r.end + 1);
    const bar = pop(el)!;
    expect(bar.getAttribute("role")).toBe("toolbar");
    expect(bar.getAttribute("aria-label")).toBe("Selection");
    expect([...bar.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? plain(b.textContent))).toEqual([
      "Highlight yellow",
      "Highlight green",
      "Highlight blue",
      "Highlight pink",
      "Highlight purple",
      "Comment",
      "Copy",
    ]);
    expect(getComputedStyle(bar).position).toBe("fixed");
    bar.querySelector<HTMLButtonElement>('[data-color="pink"]')!.click();
    await el.updateComplete;
    expect(seen).toHaveLength(1);
    // Trimmed of the white space around it
    expect(seen[0].change).toMatchObject({ type: "add", annotation: { start: r.start, end: r.end, color: "pink", author: "Jo Park", at: "2026-10-27T10:00:00Z" } });
    expect(el.value).toHaveLength(4);
    const added = seen[0].change.annotation.id;
    expect(plain(mark(el, added)!.textContent)).toBe("Pink highlight, no comments: Large files");
    expect(pop(el)).toBeNull();
    expect(status(el)).toBe("Highlighted pink: “Large files”");
  });

  test("controlled: preventDefault() keeps the value as it is", async () => {
    const el = await make();
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    await pick(el, ...(Object.values(at("Large files")) as [number, number]));
    pop(el)!.querySelector<HTMLButtonElement>('[data-color="green"]')!.click();
    await el.updateComplete;
    expect(el.value).toBe(NOTES);
    expect(el.querySelectorAll(".ui-tan__mark[data-first]")).toHaveLength(3);
  });

  test("keyboard: Shift + arrows select, Tab enters the toolbar, ← → move in it, Esc closes it and returns to the text", async () => {
    const el = await make();
    root(el).focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await userEvent.keyboard(`{Shift>}{${WORD}>}{ArrowRight}{ArrowRight}{/${WORD}}{/Shift}`);
    await el.updateComplete;
    await frames(2);
    expect(pop(el)).not.toBeNull();
    expect(status(el)).toBe("Selected “The export”. Tab for highlight, comment and copy");
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(pop(el)!.querySelector('[data-color="yellow"]'));
    await userEvent.keyboard("{ArrowLeft}");
    expect(plain(document.activeElement!.textContent)).toBe("Copy");
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(pop(el)).toBeNull();
    expect(document.activeElement).toBe(root(el));
  });

  test("keyboard: 1–5 apply a colour to the selection", async () => {
    const el = await make();
    const seen = events(el);
    root(el).focus();
    await userEvent.keyboard(`{Shift>}{${WORD}>}{ArrowRight}{/${WORD}}{/Shift}`);
    await userEvent.keyboard("3");
    await el.updateComplete;
    expect(seen[0].change.annotation).toMatchObject({ start: 0, end: 7, color: "blue" });
    expect(document.activeElement).toBe(root(el));
  });

  test("Comment: an editor in the rail; Ctrl/⌘ + Enter saves the comment with the highlight; focus goes to the mark", async () => {
    const el = await make();
    const seen = events(el);
    await pick(el, at("Large files").start, at("Large files").end);
    [...pop(el)!.querySelectorAll("button")].find((b) => plain(b.textContent) === "Comment")!.click();
    await el.updateComplete;
    const area = el.querySelector<HTMLTextAreaElement>(".ui-tan__note[data-editing] textarea")!;
    expect(document.activeElement).toBe(area);
    expect(el.querySelector(".ui-tan__mark[data-pending]")).not.toBeNull();
    expect(seen).toHaveLength(0);
    await userEvent.keyboard("How large?");
    await userEvent.keyboard(`{${MOD}>}{Enter}{/${MOD}}`);
    await el.updateComplete;
    expect(seen[0].change).toMatchObject({ type: "add", annotation: { comment: "How large?", color: "yellow" } });
    const id = seen[0].change.annotation.id;
    expect(document.activeElement).toBe(mark(el, id));
    expect(note(el, id)!.querySelector(".ui-tan__comment")!.textContent).toBe("How large?");
  });

  test("Comment then Esc discards it: nothing changes and focus is back in the text", async () => {
    const el = await make();
    const seen = events(el);
    await pick(el, at("Large files").start, at("Large files").end);
    [...pop(el)!.querySelectorAll("button")].find((b) => plain(b.textContent) === "Comment")!.click();
    await el.updateComplete;
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(seen).toHaveLength(0);
    expect(el.querySelector(".ui-tan__mark[data-pending]")).toBeNull();
    expect(document.activeElement).toBe(root(el));
    expect(status(el)).toBe("Comment discarded");
  });

  test("marks are one tab stop: arrows move between them; Enter edits the comment; Esc goes back to the mark", async () => {
    const el = await make();
    const seen = events(el);
    expect([...el.querySelectorAll<HTMLElement>(".ui-tan__mark[tabindex]")].map((m) => m.tabIndex)).toEqual([0, -1, -1]);
    mark(el, "a")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(mark(el, "b"));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(mark(el, "c"));
    await userEvent.keyboard("{Home}");
    await el.updateComplete;
    expect(mark(el, "a")!.tabIndex).toBe(0);
    await userEvent.keyboard("{Enter}");
    await el.updateComplete;
    const area = note(el, "a")!.querySelector("textarea")!;
    expect(document.activeElement).toBe(area);
    expect(area.value).toBe("Say how they'll know it's done.");
    // Change the colour from the editor's radio group, then save
    note(el, "a")!.querySelector<HTMLElement>('.ui-tan__pick[aria-checked="true"]')!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await el.updateComplete;
    expect(note(el, "a")!.querySelector('.ui-tan__pick[aria-checked="true"]')!.getAttribute("data-color")).toBe("green");
    note(el, "a")!.querySelector<HTMLButtonElement>('.ui-tan__btn[data-kind="save"]')!.click();
    await el.updateComplete;
    expect(seen[0].change).toMatchObject({ type: "edit", annotation: { id: "a", color: "green" } });
    expect(document.activeElement).toBe(mark(el, "a"));
    // Esc in a note goes back to its mark
    act_(el, "b", "edit").focus();
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(mark(el, "b"));
  });

  test("Delete on a mark removes it with an announced Undo; Ctrl/⌘ + Z restores it", async () => {
    const el = await make();
    const seen = events(el);
    mark(el, "a")!.focus();
    await userEvent.keyboard("{Delete}");
    await el.updateComplete;
    expect(seen[0].change).toMatchObject({ type: "remove", annotation: { id: "a" } });
    expect(mark(el, "a")).toBeNull();
    expect(document.activeElement).toBe(mark(el, "b"));
    expect(status(el)).toMatch(/^Yellow highlight removed\. Press (⌘|Ctrl)\+Z or Undo to restore it$/);
    expect(plain(el.querySelector(".ui-tan__undo")!.textContent)).toBe("Yellow highlight removed Undo");
    await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);
    await el.updateComplete;
    expect(seen[1].change).toMatchObject({ type: "restore", annotation: { id: "a" } });
    expect(el.value.map((a) => a.id)).toEqual(["a", "b", "c"]);
    expect(document.activeElement).toBe(mark(el, "a"));
    expect(el.querySelector(".ui-tan__undo")).toBeNull();
  });

  test("caret mode: the caret entering a highlight is announced; Enter opens it, Delete removes it", async () => {
    const el = await make();
    const seen = events(el);
    root(el).focus();
    const b = at("keep working");
    (el as unknown as { sel: { select(a: number): void } }).sel.select(b.start - 1);
    await userEvent.keyboard("{ArrowRight}");
    await el.updateComplete;
    expect(status(el)).toBe("Green highlight, no comments. Enter opens the comment, Delete removes it");
    await userEvent.keyboard("{Delete}");
    await el.updateComplete;
    expect(seen[0].change).toMatchObject({ type: "remove", annotation: { id: "b" } });
  });

  test("notes: resolve and reopen, edit, remove – focus stays in the rail", async () => {
    const el = await make();
    const seen = events(el);
    act_(el, "a", "resolve").click();
    await el.updateComplete;
    expect(seen[0].change).toMatchObject({ type: "resolve", annotation: { id: "a", resolved: true } });
    expect(note(el, "a")!.hasAttribute("data-resolved")).toBe(true);
    act_(el, "a", "resolve").click();
    await el.updateComplete;
    expect(seen[1].change.type).toBe("reopen");
    expect("resolved" in seen[1].change.annotation).toBe(false);
    act_(el, "b", "remove").focus();
    act_(el, "b", "remove").click();
    await el.updateComplete;
    expect(seen[2].change).toMatchObject({ type: "remove", annotation: { id: "b" } });
    expect(document.activeElement).toBe(act_(el, "c", "edit"));
    // A highlight without a comment offers Comment, with one Edit
    expect(act_(el, "c", "edit").getAttribute("aria-label")).toBe("Edit comment on “only retries the last part”");
  });

  test("filters: by colour, by author and open only; tc-filter-change; Show all", async () => {
    const el = await make();
    const filters: unknown[] = [];
    el.addEventListener("tc-filter-change", (e) => filters.push((e as CustomEvent).detail.filter));
    const bar = el.querySelector<HTMLElement>(".ui-tan__filterbar")!;
    expect(bar.getAttribute("role")).toBe("toolbar");
    expect([...bar.querySelectorAll("button")].map((b) => plain(b.textContent))).toEqual(["Yellow 1", "Green 1", "Blue 1", "Maya Chen", "Ravi Patel", "Open only"]);
    bar.querySelector<HTMLButtonElement>('[data-color="green"]')!.click();
    await el.updateComplete;
    expect(bar.querySelector('[data-color="green"]')!.getAttribute("aria-pressed")).toBe("true");
    expect([...el.querySelectorAll<HTMLElement>(".ui-tan__note")].map((n) => n.dataset.id)).toEqual(["b"]);
    expect(mark(el, "a")).toBeNull();
    expect(plain(el.querySelector(".ui-tan__shown")!.textContent)).toBe("1 of 3 shown");
    expect(status(el)).toBe("Showing 1 of 3 annotations");
    el.querySelector<HTMLButtonElement>(".ui-tan__clear")!.click();
    await el.updateComplete;
    [...bar.querySelectorAll("button")].find((b) => plain(b.textContent) === "Maya Chen")!.click();
    await el.updateComplete;
    expect([...el.querySelectorAll<HTMLElement>(".ui-tan__note")].map((n) => n.dataset.id)).toEqual(["a", "c"]);
    [...bar.querySelectorAll("button")].find((b) => plain(b.textContent) === "Open only")!.click();
    await el.updateComplete;
    expect([...el.querySelectorAll<HTMLElement>(".ui-tan__note")].map((n) => n.dataset.id)).toEqual(["a"]);
    expect(filters.at(-1)).toEqual({ colors: [], authors: ["Maya Chen"], resolved: false });
    expect(filters).toHaveLength(4);
  });

  test("Copy fires a cancelable tc-copy with the selected text", async () => {
    const el = await make();
    const copies: TextAnnotatorCopy[] = [];
    el.addEventListener("tc-copy", (e) => {
      copies.push((e as CustomEvent<TextAnnotatorCopy>).detail);
      e.preventDefault();
    });
    const r = at("Large files");
    await pick(el, r.start, r.end);
    [...pop(el)!.querySelectorAll("button")].find((b) => plain(b.textContent) === "Copy")!.click();
    await el.updateComplete;
    expect(copies).toEqual([{ text: "Large files", ...r }]);
    expect(pop(el)).toBeNull();
  });

  test("read-only: the toolbar only copies; notes have no actions; Enter on a mark focuses its note", async () => {
    const el = await make({ readonly: true });
    await pick(el, at("Large files").start, at("Large files").end);
    expect([...pop(el)!.querySelectorAll("button")].map((b) => plain(b.textContent))).toEqual(["Copy"]);
    expect(el.querySelector(".ui-tan__act")).toBeNull();
    mark(el, "a")!.focus();
    await userEvent.keyboard("{Enter}");
    await el.updateComplete;
    expect(document.activeElement).toBe(note(el, "a"));
    await userEvent.keyboard("{Delete}");
    expect(el.value).toBe(NOTES);
  });

  test("wide: each note sits beside its mark; narrow: the rail moves under the text", async () => {
    const el = await make({ width: 900 });
    await frames(3);
    await wait(400);
    expect(el.hasAttribute("data-narrow")).toBe(false);
    const m = mark(el, "a")!.getBoundingClientRect();
    const n = note(el, "a")!.getBoundingClientRect();
    expect(Math.abs(n.top - m.top)).toBeLessThan(2);
    expect(n.left).toBeGreaterThan(m.right);
    // b's mark is on a's line, so its note is pushed below a's, and c's below b's – never above its own mark
    expect(note(el, "b")!.getBoundingClientRect().top).toBeGreaterThanOrEqual(note(el, "a")!.getBoundingClientRect().bottom);
    expect(note(el, "c")!.getBoundingClientRect().top).toBeGreaterThanOrEqual(Math.max(note(el, "b")!.getBoundingClientRect().bottom, mark(el, "c")!.getBoundingClientRect().top - 1));
    el.style.width = "380px";
    await frames(3);
    await el.updateComplete;
    expect(el.hasAttribute("data-narrow")).toBe(true);
    expect(note(el, "a")!.getBoundingClientRect().top).toBeGreaterThan(root(el).getBoundingClientRect().bottom);
    expect(getComputedStyle(note(el, "a")!.querySelector(".ui-tan__quote")!).display).toBe("block");
  });

  test("the selection's offsets survive a re-render of the marks", async () => {
    const el = await make();
    const r = at("Large files upload");
    await pick(el, r.start, r.end);
    el.value = [...NOTES, { id: "x", ...at("files"), color: "pink" }];
    await el.updateComplete;
    await frames(2);
    expect(mark(el, "x")).not.toBeNull();
    expect(document.getSelection()!.toString()).toBe("Large files upload");
    expect(pop(el)).not.toBeNull();
  });

  test("the wrapper: an uncontrolled value survives a parent re-render; onChange reports the change", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const rootEl = createRoot(host);
    const calls: string[] = [];
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(TextAnnotator, { title: `Review ${n}`, text: TEXT, defaultValue: NOTES, onChange: (v, type, a) => calls.push(`${type}:${a.id}:${v.length}`) });
    }
    await act(async () => rootEl.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-text-annotator")!;
    act_(el, "b", "remove").click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Review 1");
    expect(note(el, "b")).toBeNull();
    expect(calls).toEqual(["remove:b:2"]);
    await act(async () => rootEl.unmount());
  });

  test("the wrapper: controlled value, and onCopy returning false stops the clipboard write", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const rootEl = createRoot(host);
    const calls: string[] = [];
    await act(async () => rootEl.render(React.createElement(TextAnnotator, { text: TEXT, value: NOTES, onChange: (_v, type) => calls.push(type), onCopy: (text) => (calls.push(`copy:${text}`), false) })));
    await settle();
    const el = host.querySelector<TcTextAnnotator>("tc-text-annotator")!;
    act_(el, "a", "resolve").click();
    await act(async () => settle());
    expect(calls).toEqual(["resolve"]);
    expect(note(el, "a")!.hasAttribute("data-resolved")).toBe(false);
    let prevented = false;
    el.addEventListener("tc-copy", (e) => (prevented = e.defaultPrevented));
    await pick(el, at("Large files").start, at("Large files").end);
    [...pop(el)!.querySelectorAll("button")].find((b) => plain(b.textContent) === "Copy")!.click();
    await act(async () => settle());
    expect(calls).toEqual(["resolve", "copy:Large files"]);
    expect(prevented).toBe(true);
    await act(async () => rootEl.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look, wide and narrow, with the toolbar and an editor open (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-text-annotator style="width: 900px" heading="Standard" .text=${TEXT} .value=${NOTES}></tc-text-annotator>
        <tc-text-annotator style="width: 900px" look="clean" heading="Clean" .text=${TEXT} .value=${NOTES}></tc-text-annotator>
        <tc-text-annotator style="width: 360px" look="clean" heading="Narrow" .text=${TEXT} .value=${NOTES} readonly></tc-text-annotator>
        <tc-text-annotator style="width: 360px" heading="Empty" .text=${TEXT}></tc-text-annotator>
      </div>`);
      const [std, clean] = [...wrap.querySelectorAll<TcTextAnnotator>("tc-text-annotator")];
      await pick(std, at("Large files").start, at("Large files").end);
      act_(clean, "b", "edit").click();
      await clean.updateComplete;
      await wait(400);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
