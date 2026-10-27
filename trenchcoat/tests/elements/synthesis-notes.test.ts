/*
 * <tc-synthesis-notes> in real browsers: the three lists, adding, editing in place, moving from the keyboard (within
 * and across lists), removing with Undo, the cancelable notes change (controlled use), export with provenance and
 * Markdown, focus after each change, the wrapper, axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/synthesis-notes";
import { synthesisMarkdown, type SynthesisExport, type SynthesisNote, type SynthesisNotesChange, type TcSynthesisNotes } from "../../src/elements/synthesis-notes";
import { SynthesisNotes } from "../../src/elements/react/synthesis-notes";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOTES: SynthesisNote[] = [
  { id: "a", kind: "conclusions", text: "We can end the contract with notice" },
  { id: "b", kind: "conclusions", text: "No exit fee after the first year" },
  { id: "c", kind: "assumptions", text: "The order form is the latest version" },
  { id: "d", kind: "verify", text: "Notice period: 30 or 60 days?" },
];
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const texts = (el: Element, kind: string) => [...el.querySelectorAll(`[data-section="${kind}"] .ui-syn__text`)].map((p) => p.textContent);
const handle = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-note="${id}"] .ui-syn__handle`)!;
const text = (n: Element | null) => n!.textContent!.replace(/\s+/g, " ").trim();
const type = async (field: HTMLTextAreaElement, value: string) => {
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};

describe("tc-synthesis-notes", () => {
  test("synthesisMarkdown: a heading, the provenance line and one list per section with notes", () => {
    expect(synthesisMarkdown(NOTES.slice(0, 3), undefined, { heading: "Contract review", sessionId: "s-1", author: "Maya" })).toBe(
      [
        "# Contract review",
        "",
        "_Written by Maya, session s-1 – the person's own notes, not model output._",
        "",
        "## Conclusions",
        "",
        "- We can end the contract with notice",
        "- No exit fee after the first year",
        "",
        "## Assumptions",
        "",
        "- The order form is the latest version",
      ].join("\n"),
    );
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is a group named by the heading; three lists with counts; set apart as the person's own`, async () => {
      const el = await fixture<TcSynthesisNotes>(html`<tc-synthesis-notes look=${look} session-id="s-2291" author="Maya Chen" .notes=${NOTES}></tc-synthesis-notes>`);
      expect(el.dataset.ui).toBe("syn");
      expect(el.dataset.look).toBe(look);
      expect(getComputedStyle(el).display).toBe("block");
      expect(el.getAttribute("role")).toBe("group");
      expect(el.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      expect(text(el.querySelector(".ui-syn__own"))).toBe("Written by you");
      expect([...el.querySelectorAll(".ui-syn__heading")].map((h) => text(h))).toEqual(["Conclusions, 2 notes", "Assumptions, 1 note", "Still to verify, 1 note"]);
      expect(texts(el, "conclusions")).toEqual([NOTES[0].text, NOTES[1].text]);
      expect(text(el.querySelector(".ui-syn__line"))).toBe("Session s-2291 · by Maya Chen · 4 notes");
      // The provenance line: on the tray in Standard, in the card's last row in Clean
      expect(!!el.querySelector(".ui-syn__card .ui-syn__foot")).toBe(look === "clean");
      expect(handle(el, "a").getAttribute("aria-label")).toBe(`Move “${NOTES[0].text}”`);
      expect(document.getElementById(handle(el, "a").getAttribute("aria-describedby")!)!.textContent).toContain("Up and down arrows move it");
    });
  }

  test("empty lists say so; Add opens a field that adds on Enter and stays open; Escape closes it", async () => {
    const el = await fixture<TcSynthesisNotes>(html`<tc-synthesis-notes></tc-synthesis-notes>`);
    expect([...el.querySelectorAll(".ui-syn__empty")].map((p) => p.textContent)).toEqual(["No conclusions yet", "No assumptions yet", "Nothing to verify yet"]);
    expect(el.querySelector<HTMLButtonElement>(".ui-syn__btn--export")!.disabled).toBe(true);
    const changes: SynthesisNote[][] = [];
    el.addEventListener("tc-notes-change", (e) => changes.push((e as CustomEvent<SynthesisNotesChange>).detail.notes));
    const add = el.querySelector<HTMLButtonElement>('[data-section="assumptions"] .ui-syn__add')!;
    expect(text(add)).toBe("Add an assumption");
    add.click();
    await settle();
    const field = el.querySelector<HTMLTextAreaElement>('[data-section="assumptions"] .ui-syn__new')!;
    expect(document.activeElement).toBe(field);
    expect(field.getAttribute("aria-label")).toBe("Add an assumption");
    key(field, "Enter");
    await settle();
    expect(changes).toEqual([]);
    await type(field, "  The   renewal date is March 1  ");
    key(field, "Enter");
    await settle();
    expect(changes.length).toBe(1);
    expect(changes[0][0]).toMatchObject({ kind: "assumptions", text: "The renewal date is March 1" });
    expect(texts(el, "assumptions")).toEqual(["The renewal date is March 1"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Added to Assumptions");
    // Still open, empty, focused – ready for the next one
    expect(document.activeElement).toBe(el.querySelector('[data-section="assumptions"] .ui-syn__new'));
    expect(el.querySelector<HTMLTextAreaElement>('[data-section="assumptions"] .ui-syn__new')!.value).toBe("");
    key(document.activeElement!, "Escape");
    await settle();
    expect(el.querySelector(".ui-syn__new")).toBeNull();
    expect(document.activeElement).toBe(el.querySelector('[data-section="assumptions"] .ui-syn__add'));
  });

  test("edit in place: Enter saves, Escape cancels, focus back on Edit", async () => {
    const el = await fixture<TcSynthesisNotes>(html`<tc-synthesis-notes .notes=${NOTES}></tc-synthesis-notes>`);
    el.querySelector<HTMLButtonElement>('[data-note="c"] [data-act="edit"]')!.click();
    await settle();
    let field = el.querySelector<HTMLTextAreaElement>('[data-note="c"] .ui-syn__edit')!;
    expect(document.activeElement).toBe(field);
    expect(field.value).toBe(NOTES[2].text);
    await type(field, "Changed my mind");
    key(field, "Escape");
    await settle();
    expect(texts(el, "assumptions")).toEqual([NOTES[2].text]);
    expect(document.activeElement).toBe(el.querySelector('[data-note="c"] [data-act="edit"]'));
    el.querySelector<HTMLButtonElement>('[data-note="c"] [data-act="edit"]')!.click();
    await settle();
    field = el.querySelector<HTMLTextAreaElement>('[data-note="c"] .ui-syn__edit')!;
    await type(field, "The signed order form is the latest version");
    key(field, "Enter");
    await settle();
    expect(texts(el, "assumptions")).toEqual(["The signed order form is the latest version"]);
    expect(el.notes.find((n) => n.id === "c")!.text).toBe("The signed order form is the latest version");
    expect(document.activeElement).toBe(el.querySelector('[data-note="c"] [data-act="edit"]'));
  });

  test("move from the keyboard: ↑ ↓ Home End within the list, ← → across lists, Alt+↑ ↓ from the other buttons; focus stays on the grip", async () => {
    const notes = [...NOTES, { id: "e", kind: "conclusions", text: "Third conclusion" }];
    const el = await fixture<TcSynthesisNotes>(html`<tc-synthesis-notes .notes=${notes}></tc-synthesis-notes>`);
    handle(el, "a").focus();
    key(handle(el, "a"), "ArrowDown");
    await settle();
    expect(texts(el, "conclusions")).toEqual(["No exit fee after the first year", "We can end the contract with notice", "Third conclusion"]);
    expect(document.activeElement).toBe(handle(el, "a"));
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Moved to position 2 of 3");
    key(handle(el, "a"), "End");
    await settle();
    expect(texts(el, "conclusions")!.at(-1)).toBe("We can end the contract with notice");
    key(handle(el, "a"), "Home");
    await settle();
    expect(texts(el, "conclusions")[0]).toBe("We can end the contract with notice");
    key(handle(el, "a"), "ArrowUp");
    await settle();
    expect(texts(el, "conclusions")[0]).toBe("We can end the contract with notice");
    // To the next list: it lands at the end
    key(handle(el, "a"), "ArrowRight");
    await settle();
    expect(texts(el, "assumptions")).toEqual([NOTES[2].text, "We can end the contract with notice"]);
    expect(el.notes.find((n) => n.id === "a")!.kind).toBe("assumptions");
    expect(document.activeElement).toBe(handle(el, "a"));
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Moved to Assumptions, position 2 of 2");
    key(handle(el, "a"), "ArrowLeft");
    key(handle(el, "a"), "ArrowLeft");
    await settle();
    expect(el.notes.find((n) => n.id === "a")!.kind).toBe("conclusions");
    // Alt + ↑ from Edit
    const edit = el.querySelector<HTMLButtonElement>('[data-note="a"] [data-act="edit"]')!;
    edit.focus();
    key(edit, "ArrowUp", { altKey: true });
    await settle();
    expect(texts(el, "conclusions")).toEqual(["No exit fee after the first year", "We can end the contract with notice", "Third conclusion"]);
  });

  test("remove with Undo: focus moves to the next note; Undo brings it back in place; the undo timer waits while held", async () => {
    const el = await fixture<TcSynthesisNotes>(html`<tc-synthesis-notes undo-for="200" .notes=${NOTES}></tc-synthesis-notes>`);
    el.querySelector<HTMLButtonElement>('[data-note="a"] [data-act="remove"]')!.focus();
    el.querySelector<HTMLButtonElement>('[data-note="a"] [data-act="remove"]')!.click();
    await settle();
    expect(texts(el, "conclusions")).toEqual([NOTES[1].text]);
    expect(document.activeElement).toBe(handle(el, "b"));
    expect(text(el.querySelector(".ui-syn__line--removed"))).toBe(`Removed “${NOTES[0].text}”`);
    expect(el.querySelector('[role="status"]')!.textContent).toBe(`Removed “${NOTES[0].text}”. Undo is on the tray.`);
    el.querySelector<HTMLButtonElement>(".ui-syn__btn--undo")!.click();
    await settle();
    expect(texts(el, "conclusions")).toEqual([NOTES[0].text, NOTES[1].text]);
    expect(document.activeElement).toBe(handle(el, "a"));
    // Delete on the grip removes; the last note of a list hands focus to its Add button
    handle(el, "d").focus();
    key(handle(el, "d"), "Delete");
    await settle();
    expect(document.activeElement).toBe(el.querySelector('[data-section="verify"] .ui-syn__add'));
    // Held: Undo stays past its time; let go, it goes
    const foot = el.querySelector(".ui-syn__foot")!;
    foot.dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    await new Promise((r) => setTimeout(r, 300));
    expect(el.querySelector(".ui-syn__btn--undo")).toBeTruthy();
    foot.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    await new Promise((r) => setTimeout(r, 300));
    await settle();
    expect(el.querySelector(".ui-syn__btn--undo")).toBeNull();
  });

  test("controlled: preventDefault keeps every change out until the app passes the list back", async () => {
    const el = await fixture<TcSynthesisNotes>(html`<tc-synthesis-notes .notes=${NOTES}></tc-synthesis-notes>`);
    const seen: SynthesisNote[][] = [];
    el.addEventListener("tc-notes-change", (e) => {
      e.preventDefault();
      seen.push((e as CustomEvent<SynthesisNotesChange>).detail.notes);
    });
    handle(el, "a").focus();
    key(handle(el, "a"), "ArrowDown");
    await settle();
    expect(seen.length).toBe(1);
    expect(texts(el, "conclusions")).toEqual([NOTES[0].text, NOTES[1].text]);
    el.notes = seen[0];
    await settle();
    expect(texts(el, "conclusions")).toEqual([NOTES[1].text, NOTES[0].text]);
  });

  test("export: fires tc-export with the notes, the session id, the author and Markdown", async () => {
    const el = await fixture<TcSynthesisNotes>(html`<tc-synthesis-notes heading="Contract review" session-id="s-2291" author="Maya Chen" .notes=${NOTES}></tc-synthesis-notes>`);
    const got: SynthesisExport[] = [];
    el.addEventListener("tc-export", (e) => got.push((e as CustomEvent<SynthesisExport>).detail));
    el.querySelector<HTMLButtonElement>(".ui-syn__btn--export")!.click();
    await settle();
    expect(got.length).toBe(1);
    expect(got[0]).toMatchObject({ notes: NOTES, sessionId: "s-2291", author: "Maya Chen", heading: "Contract review" });
    expect(got[0].sections.map((s) => s.id)).toEqual(["conclusions", "assumptions", "verify"]);
    expect(got[0].markdown).toBe(synthesisMarkdown(NOTES, undefined, { heading: "Contract review", sessionId: "s-2291", author: "Maya Chen" }));
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Exported 4 notes");
    el.noExport = true;
    await settle();
    expect(el.querySelector(".ui-syn__btn--export")).toBeNull();
  });

  test("custom sections and labels", async () => {
    const sections = [
      { id: "found", label: "Findings", addLabel: "Add a finding", empty: "None yet" },
      { id: "open", label: "Open questions" },
    ];
    const el = await fixture<TcSynthesisNotes>(html`<tc-synthesis-notes own-label="Analyst notes" .sections=${sections} .notes=${[{ id: "x", kind: "open", text: "Who signed?" }]}></tc-synthesis-notes>`);
    expect([...el.querySelectorAll(".ui-syn__label")].map((l) => l.textContent)).toEqual(["Findings", "Open questions"]);
    expect(text(el.querySelector('[data-section="found"] .ui-syn__empty'))).toBe("None yet");
    expect(text(el.querySelector('[data-section="open"] .ui-syn__add'))).toBe("Add to Open questions");
    expect(text(el.querySelector(".ui-syn__own"))).toBe("Analyst notes");
  });

  test("styles: reduced motion turns motion off; no endless loop; no theme-scoped colours", async () => {
    await fixture(html`<tc-synthesis-notes></tc-synthesis-notes>`);
    const css = (customElements.get("tc-synthesis-notes") as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    expect(css).not.toMatch(/infinite/);
    expect(css).not.toMatch(/\.dark\b|data-tc-theme="dark"/);
  });

  test("React wrapper: uncontrolled notes survive a parent re-render; onChange and onExport; no onExport, no Export", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const changes: number[] = [];
    const exports: string[] = [];
    let bump = () => {};
    let withExport = true;
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(SynthesisNotes, {
        title: "Review notes",
        sessionId: "s-7",
        defaultNotes: NOTES,
        onChange: (list) => changes.push(list.length),
        onExport: withExport ? (d) => exports.push(d.sessionId) : undefined,
        "data-n": n,
      } as React.ComponentProps<typeof SynthesisNotes>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-synthesis-notes")!;
    expect(el.heading).toBe("Review notes");
    el.querySelector<HTMLButtonElement>('[data-note="d"] [data-act="remove"]')!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(changes).toEqual([3]);
    expect(el.notes.length).toBe(3);
    el.querySelector<HTMLButtonElement>(".ui-syn__btn--export")!.click();
    expect(exports).toEqual(["s-7"]);
    withExport = false;
    await act(async () => bump());
    await settle();
    expect(el.querySelector(".ui-syn__btn--export")).toBeNull();
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme – lists, an open editor, a new note and Undo", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <div style="width: 560px"><tc-synthesis-notes session-id="s-1" author="Maya" .notes=${NOTES}></tc-synthesis-notes></div>
        <div style="width: 320px"><tc-synthesis-notes look="clean" session-id="s-1" .notes=${NOTES}></tc-synthesis-notes></div>
        <div style="width: 560px"><tc-synthesis-notes look="clean"></tc-synthesis-notes></div>
      </div>`);
      const [a, b, c] = [...wrap.querySelectorAll<TcSynthesisNotes>("tc-synthesis-notes")];
      a.querySelector<HTMLButtonElement>('[data-note="a"] [data-act="edit"]')!.click();
      b.querySelector<HTMLButtonElement>('[data-note="b"] [data-act="remove"]')!.click();
      c.querySelector<HTMLButtonElement>(".ui-syn__add")!.click();
      await settle();
      wrap.getAnimations({ subtree: true }).forEach((x) => x.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
