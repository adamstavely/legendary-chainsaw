/*
 * <tc-point-and-ask> in real browsers: structure in both looks, pins from a click and boxes from a drag, dragging a
 * mark, the keyboard (one tab stop, nudge, resize, delete, Enter to the question), the list, the cancelable change
 * events, Ask with its check and busy, answers, the layout beside and below, the React wrapper and axe in both looks
 * and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/point-and-ask";
import type { PointAsk, PointMark, PointMarksChange, TcPointAndAsk } from "../../src/elements/point-and-ask";
import { PointAndAsk } from "../../src/elements/react/point-and-ask";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#eee"/><rect x="40" y="60" width="120" height="160" fill="#8cc5b6"/></svg>')}`;
const MARKS: PointMark[] = [
  { id: "a", kind: "pin", x: 0.3, y: 0.4, question: "Why is this bar tallest?" },
  { id: "b", kind: "box", x: 0.5, y: 0.2, w: 0.3, h: 0.4, question: "" },
];

const surface = (el: Element) => el.querySelector<HTMLElement>(".ui-paq__surface")!;
const marksOn = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-paq__mark")];
const live = (el: Element) => el.querySelector('[role="status"]')!.textContent!.trim();
const make = (look: "standard" | "clean" = "standard", width = 820, marks: PointMark[] = []) =>
  fixture<HTMLElement>(html`<div style=${`width: ${width}px`}>
    <tc-point-and-ask look=${look} heading="Ask about page 4" src=${SRC} alt="Report page with a chart" .marks=${marks}></tc-point-and-ask>
  </div>`).then(async (wrap) => {
    const el = wrap.querySelector("tc-point-and-ask")! as TcPointAndAsk;
    await expect.poll(() => el.querySelector<HTMLImageElement>(".ui-paq__img")!.complete).toBe(true);
    await settle();
    return el;
  });

/** A press on the surface through the given fractions of its box; a target other than the surface (a mark) can start it */
async function press(el: Element, path: [number, number][], start: Element = surface(el)) {
  const s = surface(el);
  const r = s.getBoundingClientRect();
  const at = (i: number) => ({ clientX: r.left + path[i][0] * r.width, clientY: r.top + path[i][1] * r.height, pointerId: 5, pointerType: "mouse", isPrimary: true, bubbles: true, cancelable: true, button: 0, buttons: 1 });
  start.dispatchEvent(new PointerEvent("pointerdown", at(0)));
  for (let i = 1; i < path.length; i++) s.dispatchEvent(new PointerEvent("pointermove", at(i)));
  s.dispatchEvent(new PointerEvent("pointerup", { ...at(path.length - 1), buttons: 0 }));
  await settle();
}
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));

describe("tc-point-and-ask", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: header, the image with its marks group, the empty list, the question and Ask`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("paq");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("h3")!.textContent).toBe("Ask about page 4");
      expect(el.querySelector(".ui-paq__img")!.getAttribute("alt")).toBe("Report page with a chart");
      expect(el.querySelector(".ui-paq__marks")!.getAttribute("role")).toBe("group");
      expect(el.querySelector(".ui-paq__marks")!.getAttribute("aria-label")).toBe("Marks on the image");
      expect(el.querySelector(".ui-paq__empty")!.textContent).toBe("Click the image to drop a pin, or drag to draw a box.");
      expect(el.querySelector(".ui-paq__list")).toBeNull();
      expect(el.querySelector(".ui-paq__label")!.textContent).toBe("Your question");
      expect(el.querySelector(".ui-paq__ask")!.textContent!.trim()).toBe("Ask");
      await expect.poll(() => {
        const r = el.querySelector(".ui-paq__stage")!.getBoundingClientRect();
        return Math.round((r.width / r.height) * 100) / 100;
      }).toBe(1.33);
    });
  }

  test("a click drops a numbered pin, a drag draws a box; both in fractions of the image, announced and listed", async () => {
    const el = await make();
    const seen: PointMarksChange[] = [];
    el.addEventListener("tc-marks-change", (e) => seen.push((e as CustomEvent<PointMarksChange>).detail));
    await press(el, [[0.25, 0.5]]);
    expect(seen).toHaveLength(1);
    expect(seen[0].reason).toBe("add");
    expect(el.marks[0]).toMatchObject({ kind: "pin" });
    expect(el.marks[0].x).toBeCloseTo(0.25, 2);
    expect(el.marks[0].y).toBeCloseTo(0.5, 2);
    expect(live(el)).toBe("Pin 1 added");
    await press(el, [[0.5, 0.2], [0.6, 0.3], [0.8, 0.6]]);
    const box = el.marks[1];
    expect(box.kind).toBe("box");
    expect(box.x).toBeCloseTo(0.5, 2);
    expect(box.w).toBeCloseTo(0.3, 2);
    expect(box.h).toBeCloseTo(0.4, 2);
    expect(live(el)).toBe("Box 2 added");
    expect(marksOn(el).map((m) => m.textContent!.replace(/\s+/g, " ").trim())).toEqual(["1 Pin 1: no question yet", "2 Box 2: no question yet"]);
    expect([...el.querySelectorAll(".ui-paq__which")].map((b) => b.textContent!.replace(/\s+/g, " ").trim())).toEqual(["1Pin 1", "2Box 2"]);
    expect(el.querySelector(".ui-paq__count")!.textContent).toBe("2");
    // A drag too small for a box adds nothing
    await press(el, [[0.1, 0.1], [0.11, 0.115]]);
    expect(el.marks).toHaveLength(2);
  });

  test("dragging a mark moves it; a press on a mark without moving only selects it", async () => {
    const el = await make("standard", 820, MARKS);
    const reasons: string[] = [];
    el.addEventListener("tc-marks-change", (e) => reasons.push((e as CustomEvent<PointMarksChange>).detail.reason));
    const box = marksOn(el)[1];
    await press(el, [[0.6, 0.3]], box);
    expect(reasons).toEqual([]);
    expect(box.hasAttribute("data-selected")).toBe(true);
    expect(box.tabIndex).toBe(0);
    expect(marksOn(el)[0].tabIndex).toBe(-1);
    await press(el, [[0.6, 0.3], [0.65, 0.35], [0.7, 0.4]], marksOn(el)[1]);
    expect(reasons).toEqual(["move"]);
    expect(el.marks[1].x).toBeCloseTo(0.6, 2);
    expect(el.marks[1].y).toBeCloseTo(0.3, 2);
    // It can't leave the image
    await press(el, [[0.7, 0.4], [0.99, 0.99]], marksOn(el)[1]);
    expect(el.marks[1].x).toBeCloseTo(0.7, 2);
    expect(el.marks[1].y).toBeCloseTo(0.6, 2);
  });

  test("keyboard: one tab stop; arrows nudge (Shift 10 px), Alt + arrows resize a box, Delete removes, Enter goes to the question", async () => {
    const el = await make("standard", 820, MARKS);
    expect(marksOn(el).map((m) => m.tabIndex)).toEqual([0, -1]);
    expect(marksOn(el)[0].getAttribute("aria-describedby")).toBe(el.querySelector(".tc-sr-only[id$='-keys']")!.id);
    const w = surface(el).getBoundingClientRect().width;
    const h = surface(el).getBoundingClientRect().height;
    // The number in the list selects and focuses the mark on the image
    el.querySelectorAll<HTMLButtonElement>(".ui-paq__which")[1].click();
    await expect.poll(() => document.activeElement).toBe(marksOn(el)[1]);
    expect(marksOn(el).map((m) => m.tabIndex)).toEqual([-1, 0]);
    key(marksOn(el)[1], "ArrowRight");
    await settle();
    expect(el.marks[1].x).toBeCloseTo(0.5 + 1 / w, 4);
    key(marksOn(el)[1], "ArrowDown", { shiftKey: true });
    await settle();
    expect(el.marks[1].y).toBeCloseTo(0.2 + 10 / h, 3);
    key(marksOn(el)[1], "ArrowRight", { altKey: true, shiftKey: true });
    await settle();
    expect(el.marks[1].w).toBeCloseTo(0.3 + 10 / w, 3);
    // Alt does nothing special to a pin: it moves
    marksOn(el)[0].focus();
    key(marksOn(el)[0], "ArrowLeft", { altKey: true });
    await settle();
    expect(el.marks[0].x).toBeCloseTo(0.3 - 1 / w, 4);
    expect(el.marks[0].w).toBeUndefined();
    key(marksOn(el)[0], "Enter");
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-paq__item[data-id='a'] .ui-paq__q"));
    marksOn(el)[0].focus();
    key(marksOn(el)[0], "Delete");
    await settle();
    expect(el.marks.map((m) => m.id)).toEqual(["b"]);
    expect(live(el)).toBe("Pin 1 removed");
    await expect.poll(() => document.activeElement).toBe(marksOn(el)[0]);
    key(marksOn(el)[0], "Backspace");
    await settle();
    expect(el.marks).toEqual([]);
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-paq__add-pin"));
    // Add pin and Add box drop marks in the middle
    el.querySelector<HTMLButtonElement>(".ui-paq__add-pin")!.click();
    el.querySelector<HTMLButtonElement>(".ui-paq__add-box")!.click();
    await settle();
    expect(el.marks.map(({ kind, x, y, w: bw, h: bh }) => ({ kind, x, y, w: bw, h: bh }))).toEqual([
      { kind: "pin", x: 0.5, y: 0.5, w: undefined, h: undefined },
      { kind: "box", x: 0.35, y: 0.35, w: 0.3, h: 0.3 },
    ]);
    el.querySelector<HTMLButtonElement>(".ui-paq__clear")!.click();
    await settle();
    expect(el.marks).toEqual([]);
    expect(live(el)).toBe("All marks removed");
  });

  test("each mark's question, Remove in the list, and prevented changes keeping the marks", async () => {
    const el = await make("standard", 820, MARKS);
    const q = el.querySelector<HTMLInputElement>(".ui-paq__item[data-id='b'] .ui-paq__q")!;
    expect(q.getAttribute("aria-label")).toBe("Ask about this: Box 2");
    q.value = "What changed here?";
    q.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.marks[1].question).toBe("What changed here?");
    expect(marksOn(el)[1].textContent).toContain("Box 2: What changed here?");
    const remove = el.querySelectorAll<HTMLButtonElement>(".ui-paq__remove")[0];
    expect(remove.textContent!.trim()).toBe("Remove Pin 1");
    el.addEventListener("tc-marks-change", (e) => e.preventDefault());
    remove.click();
    await settle();
    expect(el.marks).toHaveLength(2);
    q.value = "Something else";
    q.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(q.value).toBe("What changed here?");
    await press(el, [[0.1, 0.9]]);
    expect(el.marks).toHaveLength(2);
  });

  test("Ask: needs a mark or a question, sends every mark with its question, turns busy, then shows the answers", async () => {
    const el = await make();
    const sent: PointAsk[] = [];
    el.addEventListener("tc-ask", (e) => sent.push((e as CustomEvent<PointAsk>).detail));
    el.querySelector<HTMLButtonElement>(".ui-paq__ask")!.click();
    await settle();
    expect(sent).toHaveLength(0);
    expect(el.querySelector(".ui-paq__hint")!.textContent).toBe("Mark part of the image or write a question first.");
    el.marks = MARKS;
    await settle();
    expect(el.querySelector(".ui-paq__hint")).toBeNull();
    const ta = el.querySelector<HTMLTextAreaElement>(".ui-paq__input")!;
    ta.value = "  Do these agree?  ";
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    key(ta, "Enter", { ctrlKey: true, metaKey: true });
    await settle();
    expect(sent).toEqual([{ marks: [{ ...MARKS[0], question: "Why is this bar tallest?" }, { ...MARKS[1], question: "" }], question: "Do these agree?" }]);
    expect(el.busy).toBe(true);
    expect(el.querySelector(".ui-paq__card")!.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelector(".ui-paq__ask")!.textContent!.trim()).toBe("Asking…");
    expect(el.querySelector<HTMLButtonElement>(".ui-paq__add-pin")!.disabled).toBe(true);
    await press(el, [[0.1, 0.9]]);
    expect(el.marks).toHaveLength(2);
    el.querySelector<HTMLButtonElement>(".ui-paq__ask")!.click();
    await settle();
    expect(sent).toHaveLength(1);
    // Answers stream in, then busy ends
    el.answers = { a: "Q4 holds the year-end checks." };
    el.answer = "Mostly – the chart counts audits, the table findings.";
    await settle();
    expect(el.querySelector(".ui-paq__item[data-id='a'] .ui-paq__answer")!.textContent).toBe("Q4 holds the year-end checks.");
    expect(el.querySelector(".ui-paq__item[data-id='b'] .ui-paq__answer")).toBeNull();
    expect(el.querySelector(".ui-paq__overall-title")!.textContent).toBe("Answer");
    expect(el.querySelector(".ui-paq__overall-text")!.textContent).toBe("Mostly – the chart counts audits, the table findings.");
    el.busy = false;
    await settle();
    expect(live(el)).toBe("Answers ready");
    // A prevented tc-ask stays idle
    el.addEventListener("tc-ask", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-paq__ask")!.click();
    await settle();
    expect(sent).toHaveLength(2);
    expect(el.busy).toBe(false);
  });

  test("the list sits beside the image when wide and below it when narrow", async () => {
    const wide = await make("standard", 820, MARKS);
    const ws = wide.querySelector(".ui-paq__stage")!.getBoundingClientRect();
    const wl = wide.querySelector(".ui-paq__side")!.getBoundingClientRect();
    expect(wl.left).toBeGreaterThanOrEqual(ws.right);
    cleanup();
    const narrow = await make("standard", 380, MARKS);
    const ns = narrow.querySelector(".ui-paq__stage")!.getBoundingClientRect();
    const nl = narrow.querySelector(".ui-paq__side")!.getBoundingClientRect();
    expect(nl.top).toBeGreaterThan(ns.bottom);
    expect(ns.width).toBeLessThanOrEqual(380);
  });

  test("React: uncontrolled marks survive re-renders; controlled ones wait for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    host.style.width = "820px";
    document.body.append(host);
    const root = createRoot(host);
    const seen: [PointMark[], string][] = [];
    const asks: PointAsk[] = [];
    const render = (props: React.ComponentProps<typeof PointAndAsk>) => act(async () => root.render(React.createElement(PointAndAsk, props)));
    await render({ title: "Ask", src: SRC, alt: "Page", onMarksChange: (m, r) => void seen.push([m, r]), onAsk: (a, e) => (asks.push(a), e.preventDefault()) });
    await settle();
    const el = host.querySelector("tc-point-and-ask")!;
    expect(el.querySelector("h3")!.textContent).toBe("Ask");
    await act(async () => press(el, [[0.4, 0.4]]));
    expect(seen.map(([m, r]) => [m.length, r])).toEqual([[1, "add"]]);
    await render({ title: "Ask again", src: SRC, alt: "Page", onMarksChange: (m, r) => void seen.push([m, r]), onAsk: (a, e) => (asks.push(a), e.preventDefault()) });
    await settle();
    expect(el.marks).toHaveLength(1);
    el.querySelector<HTMLButtonElement>(".ui-paq__ask")!.click();
    await settle();
    expect(asks).toHaveLength(1);
    expect(el.busy).toBe(false);
    // Controlled
    await render({ title: "Ask", src: SRC, alt: "Page", marks: MARKS, onMarksChange: (m, r) => void seen.push([m, r]) });
    await settle();
    expect(el.marks).toEqual(MARKS);
    el.querySelectorAll<HTMLButtonElement>(".ui-paq__remove")[0].click();
    await settle();
    expect(seen.at(-1)![1]).toBe("remove");
    expect(el.marks).toEqual(MARKS);
    await render({ title: "Ask", src: SRC, alt: "Page", marks: [MARKS[1]], onMarksChange: (m, r) => void seen.push([m, r]) });
    await settle();
    expect(marksOn(el)).toHaveLength(1);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with marks, answers and busy`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); width: 840px">
        <tc-point-and-ask heading="Ask about page 4" src=${SRC} alt="Report page" .marks=${MARKS} .answers=${{ a: "Year-end checks." }} answer="They agree." question="Do these agree?"></tc-point-and-ask>
        <tc-point-and-ask look="clean" heading="Ask about page 5" src=${SRC} alt="Report page"></tc-point-and-ask>
        <tc-point-and-ask look="clean" heading="Ask about page 6" src=${SRC} alt="Report page" .marks=${MARKS} busy></tc-point-and-ask>
      </div>`);
      await settle();
      wrap.querySelector(".ui-paq__ask")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
