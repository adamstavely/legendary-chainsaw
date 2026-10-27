/*
 * <tc-extraction-review> in real browsers: fields with their boxes on the page, confidence, accept / correct / reject
 * as a cancelable change, the grid keyboard field by field, the page view following the active field, Confirm, the
 * React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/extraction-review";
import type { ExtractionField, ExtractionFieldsChange, ExtractionPage, TcExtractionReview } from "../../src/elements/extraction-review";
import { ExtractionReview } from "../../src/elements/react/extraction-review";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const sheet = (fill: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="${fill}"/></svg>`)}`;
const PAGES: ExtractionPage[] = [
  { src: sheet("#fff"), width: 800, height: 1000 },
  { src: sheet("#fafafa"), width: 800, height: 1000, alt: "Payment details page" },
];
const FIELDS: ExtractionField[] = [
  { id: "number", label: "Invoice number", value: "INV-2041", confidence: 0.99, box: { page: 1, x: 600, y: 100, width: 120, height: 24 } },
  { id: "due", label: "Due date", value: "11 Nov 2026", confidence: 0.62, box: { page: 1, x: 600, y: 140, width: 120, height: 24 } },
  { id: "total", label: "Total", value: "1,204.00", confidence: 0.9, box: { page: 1, x: 640, y: 900, width: 80, height: 24 } },
  { id: "terms", label: "Payment terms", value: "Net 30", confidence: 0.85, box: { page: 2, x: 64, y: 160, width: 200, height: 24 } },
  { id: "note", label: "Note", value: "", confidence: 0.4 },
];

const review = (fields: ExtractionField[] = FIELDS, pages: ExtractionPage[] = PAGES) =>
  fixture<TcExtractionReview>(html`<tc-extraction-review heading="Invoice INV-2041" source="inv-2041.pdf" .pages=${pages} .fields=${fields}></tc-extraction-review>`);
const cell = (el: Element, row: number, col = 0) => el.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`)!;
const btn = (el: Element, label: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === label)!;
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const active = () => document.activeElement as HTMLElement;
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const activeBox = (el: Element) => el.querySelector<HTMLElement>(".ui-xrev__box[data-active]");
const finishAnimations = () => document.getAnimations().forEach((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.finish());

describe("tc-extraction-review", () => {
  test("the host is the root, in both looks; Clean puts the progress inside the card", async () => {
    const el = await review();
    expect(el.dataset.ui).toBe("xrev");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(":scope > .ui-xrev__foot")).not.toBeNull();
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(":scope > .ui-xrev__card > .ui-xrev__foot")).not.toBeNull();
    const provided = await fixture(html`<tc-look-provider look="clean"><tc-extraction-review .fields=${FIELDS}></tc-extraction-review></tc-look-provider>`);
    expect(provided.querySelector("tc-extraction-review")!.dataset.look).toBe("clean");
  });

  test("a grid named by the heading: one row per field with its value, confidence and three buttons", async () => {
    const el = await review();
    const grid = el.querySelector('[role="grid"]')!;
    expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toBe("Invoice INV-2041");
    expect(el.querySelectorAll('[role="row"]')).toHaveLength(5);
    expect(el.querySelectorAll('[role="gridcell"]')).toHaveLength(20);
    expect(cell(el, 0).textContent).toContain("Invoice number");
    expect(cell(el, 0).textContent).toContain("INV-2041");
    expect(cell(el, 0).textContent).toContain("99% confidence");
    expect(el.querySelector(".ui-xrev__source")!.textContent).toContain("inv-2041.pdf");
    // Below the threshold: Low, and the row is flagged
    expect(cell(el, 1).querySelector(".ui-xrev__low")!.textContent).toBe("Low");
    expect(el.querySelectorAll('[role="row"]')[1].hasAttribute("data-low")).toBe(true);
    expect(cell(el, 0).querySelector(".ui-xrev__low")).toBeNull();
    // An empty value says so
    expect(cell(el, 4).querySelector(".ui-xrev__value")!.textContent).toBe("Empty");
    expect(btn(el, "Accept Invoice number").getAttribute("aria-pressed")).toBe("false");
    expect(btn(el, "Correct Due date")).toBeTruthy();
    expect(btn(el, "Reject Total").getAttribute("aria-keyshortcuts")).toBe("R");
    // The summary counts
    expect(el.querySelector(".ui-xrev__foot")!.textContent).toMatch(/0 of 5 reviewed\s*·\s*2 low confidence/);
  });

  test("threshold and confirm-label are properties", async () => {
    const el = await fixture<TcExtractionReview>(html`<tc-extraction-review threshold="0.95" confirm-label="Send to accounts" .fields=${FIELDS}></tc-extraction-review>`);
    expect(el.querySelectorAll(".ui-xrev__low")).toHaveLength(4);
    expect(el.querySelector(".ui-xrev__confirm")!.textContent).toBe("Send to accounts");
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Review extracted fields");
  });

  test("boxes in page pixels, placed in percent; the active field's is highlighted with its name", async () => {
    const el = await review();
    const boxes = el.querySelectorAll<HTMLElement>(".ui-xrev__box");
    // Page 1 shows its three boxes; the field without a box has none
    expect(boxes).toHaveLength(3);
    expect(boxes[0].style.left).toBe("75%");
    expect(boxes[0].style.top).toBe("10%");
    expect(boxes[0].style.width).toBe("15%");
    expect(boxes[0].style.height).toBe("2.4%");
    expect(boxes[0].getAttribute("aria-hidden")).toBe("true");
    expect(activeBox(el)!.dataset.label).toBe("Invoice number");
    expect(el.querySelector<HTMLImageElement>(".ui-xrev__img")!.alt).toBe("Page 1 of inv-2041.pdf");
    expect(el.querySelector(".ui-xrev__pageno")!.textContent).toBe("Page 1 of 2");
    // Clicking a box makes its field active and focuses it
    boxes[2].click();
    await settle();
    expect(active()).toBe(cell(el, 2));
    expect(activeBox(el)!.dataset.label).toBe("Total");
  });

  test("accept and reject: cancelable tc-fields-change, the buttons toggle, the status region says it", async () => {
    const el = await review();
    const seen = listen<ExtractionFieldsChange>(el, "tc-fields-change");
    btn(el, "Accept Invoice number").click();
    await settle();
    expect(seen[0].action).toBe("accept");
    expect(seen[0].field).toMatchObject({ id: "number", status: "accepted" });
    expect(el.fields[0].status).toBe("accepted");
    expect(btn(el, "Undo accept, Invoice number").getAttribute("aria-pressed")).toBe("true");
    expect(cell(el, 0).textContent).toContain("Accepted");
    expect(status(el)).toBe("Invoice number accepted");
    // Pressed again: back to review
    btn(el, "Undo accept, Invoice number").click();
    await settle();
    expect(seen[1].action).toBe("undo");
    expect(el.fields[0].status).toBe("pending");
    btn(el, "Reject Due date").click();
    await settle();
    expect(el.fields[1].status).toBe("rejected");
    expect(el.querySelectorAll<HTMLElement>('[role="row"]')[1].dataset.status).toBe("rejected");
    expect(el.querySelector('.ui-xrev__box[data-status="rejected"]')).not.toBeNull();
    expect(el.querySelector(".ui-xrev__foot")!.textContent).toContain("1 of 5 reviewed");
  });

  test("controlled: preventDefault keeps the fields until the app passes them back", async () => {
    const el = await review();
    const seen = listen<ExtractionFieldsChange>(el, "tc-fields-change", true);
    btn(el, "Accept Total").click();
    await settle();
    expect(seen).toHaveLength(1);
    expect(el.fields[2].status).toBeUndefined();
    el.fields = seen[0].fields;
    await settle();
    expect(btn(el, "Undo accept, Total").getAttribute("aria-pressed")).toBe("true");
  });

  test("correct: Enter opens the value, Enter saves and keeps the extracted value; Escape cancels", async () => {
    const el = await review();
    const seen = listen<ExtractionFieldsChange>(el, "tc-fields-change");
    cell(el, 2).focus();
    await key(cell(el, 2), "Enter");
    const input = active() as HTMLInputElement;
    expect(input.tagName).toBe("INPUT");
    expect(input.value).toBe("1,204.00");
    expect(input.getAttribute("aria-label")).toBe("Correct Total");
    input.value = "1,240.00";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await key(input, "Enter");
    expect(seen[0]).toMatchObject({ action: "correct", field: { id: "total", value: "1,240.00", original: "1,204.00", status: "corrected" } });
    expect(cell(el, 2).querySelector(".ui-xrev__was")!.textContent).toBe("was 1,204.00");
    expect(status(el)).toBe("Total corrected to 1,240.00");
    // Saving moves on to the next field still to review
    expect(active()).toBe(cell(el, 3));
    // Escape cancels without a change; F2 works from the buttons too
    cell(el, 1).focus();
    await key(cell(el, 1, 2), "F2");
    const again = active() as HTMLInputElement;
    again.value = "changed";
    again.dispatchEvent(new Event("input", { bubbles: true }));
    await key(again, "Escape");
    expect(seen).toHaveLength(1);
    expect(active()).toBe(cell(el, 1));
    expect(el.fields[1].value).toBe("11 Nov 2026");
    // A second correction keeps the first extracted value
    btn(el, "Correct Total").click();
    await settle();
    const third = active() as HTMLInputElement;
    third.value = "1,250.00";
    third.dispatchEvent(new Event("input", { bubbles: true }));
    await key(third, "Enter");
    expect(el.fields[2]).toMatchObject({ value: "1,250.00", original: "1,204.00" });
  });

  test("saving an unchanged value accepts it; leaving the field saves", async () => {
    const el = await review();
    cell(el, 0).focus();
    await key(cell(el, 0), "F2");
    await key(active(), "Enter");
    expect(el.fields[0].status).toBe("accepted");
    await key(cell(el, 3), "F2");
    const input = active() as HTMLInputElement;
    input.value = "Net 45";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.blur();
    await settle();
    expect(el.fields[3]).toMatchObject({ value: "Net 45", status: "corrected" });
  });

  test("the grid keyboard: one tab stop, arrows field by field and across the buttons, Home / End", async () => {
    const el = await review();
    const stops = [...el.querySelectorAll<HTMLElement>("[data-row][data-col]")].filter((c) => c.tabIndex === 0);
    expect(stops).toEqual([cell(el, 0)]);
    cell(el, 0).focus();
    await key(active(), "ArrowDown");
    expect(active()).toBe(cell(el, 1));
    expect(cell(el, 1).tabIndex).toBe(0);
    expect(cell(el, 0).tabIndex).toBe(-1);
    await key(active(), "ArrowRight");
    expect(active()).toBe(cell(el, 1, 1));
    await key(active(), "End");
    expect(active()).toBe(cell(el, 1, 3));
    await key(active(), "ArrowDown");
    expect(active()).toBe(cell(el, 2, 3));
    await key(active(), "Home");
    expect(active()).toBe(cell(el, 2, 0));
    await key(active(), "Home");
    expect(active()).toBe(cell(el, 0, 0));
    await key(active(), "End", { ctrlKey: true });
    expect(active()).toBe(cell(el, 4, 0));
    await key(active(), "ArrowUp");
    expect(active()).toBe(cell(el, 3));
    await key(active(), "PageUp");
    expect(active()).toBe(cell(el, 0));
  });

  test("A and R review and move on to the next field still to review", async () => {
    const el = await review();
    cell(el, 0).focus();
    await key(active(), "a");
    expect(el.fields[0].status).toBe("accepted");
    expect(active()).toBe(cell(el, 1));
    await key(active(), "r");
    expect(el.fields[1].status).toBe("rejected");
    expect(active()).toBe(cell(el, 2));
    // From a button cell too; a reviewed field is skipped on the way
    cell(el, 0).focus();
    await key(cell(el, 0, 1), "a");
    expect(active()).toBe(cell(el, 2));
    // Modified keys are left alone
    await key(active(), "a", { ctrlKey: true });
    expect(el.fields[2].status).toBeUndefined();
  });

  test("the page view follows the active field to its page; the page buttons turn pages", async () => {
    const el = await review();
    cell(el, 0).focus();
    await key(active(), "End", { ctrlKey: true });
    await key(active(), "ArrowUp");
    // Payment terms is on page 2
    expect(el.querySelector(".ui-xrev__pageno")!.textContent).toBe("Page 2 of 2");
    expect(el.querySelector<HTMLImageElement>(".ui-xrev__img")!.alt).toBe("Payment details page");
    expect(activeBox(el)!.dataset.label).toBe("Payment terms");
    btn(el, "Previous page").click();
    await settle();
    expect(el.querySelector(".ui-xrev__pageno")!.textContent).toBe("Page 1 of 2");
    expect(btn(el, "Previous page").getAttribute("aria-disabled")).toBe("true");
    btn(el, "Previous page").click();
    await settle();
    expect(el.querySelector(".ui-xrev__pageno")!.textContent).toBe("Page 1 of 2");
    // The total sits low on page 1: the view scrolls down to it
    await key(active(), "ArrowUp");
    const view = el.querySelector<HTMLElement>(".ui-xrev__viewport")!;
    await new Promise((r) => setTimeout(r, 600));
    expect(view.scrollTop).toBeGreaterThan(0);
  });

  test("Confirm is off until every field is reviewed, then fires tc-confirm; the last review is announced", async () => {
    const el = await review(FIELDS.slice(0, 2));
    const confirmed = listen<{ fields: ExtractionField[] }>(el, "tc-confirm");
    const confirm = el.querySelector<HTMLButtonElement>(".ui-xrev__confirm")!;
    expect(confirm.getAttribute("aria-disabled")).toBe("true");
    expect(document.getElementById(confirm.getAttribute("aria-describedby")!)!.textContent).toBe("2 fields still to review");
    confirm.click();
    await settle();
    expect(confirmed).toHaveLength(0);
    expect(status(el)).toBe("2 fields still to review");
    btn(el, "Accept Invoice number").click();
    btn(el, "Reject Due date").click();
    await settle();
    expect(status(el)).toBe("All 2 fields reviewed");
    expect(confirm.hasAttribute("aria-disabled")).toBe(false);
    confirm.click();
    expect(confirmed[0].fields.map((f) => f.status)).toEqual(["accepted", "rejected"]);
  });

  test("empty states: no fields, no pages", async () => {
    const el = await review([], []);
    expect(el.textContent).toContain("No fields extracted");
    expect(el.textContent).toContain("No page image");
    expect(el.querySelector(".ui-xrev__foot")!.textContent).toContain("Nothing to review");
  });

  test("focus: a removed field moves focus to the one in its place", async () => {
    const el = await review();
    cell(el, 1).focus();
    await settle();
    el.fields = FIELDS.filter((f) => f.id !== "due");
    await settle();
    expect(active()).toBe(cell(el, 1));
    expect(cell(el, 1).textContent).toContain("Total");
  });

  test("React wrapper: title, uncontrolled fields survive a parent re-render, callbacks fire", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onFieldsChange = vi.fn();
    const onConfirm = vi.fn();
    const draw = (n: number) => root.render(React.createElement(ExtractionReview, { title: `Run ${n}`, pages: PAGES, defaultFields: FIELDS.slice(0, 1), onFieldsChange, onConfirm, className: "consumer" }));
    await act(async () => draw(1));
    await settle();
    const el = host.querySelector("tc-extraction-review")!;
    expect(el.classList.contains("consumer")).toBe(true);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Run 1");
    await act(async () => btn(el, "Accept Invoice number").click());
    expect(onFieldsChange).toHaveBeenCalledWith([expect.objectContaining({ id: "number", status: "accepted" })], expect.objectContaining({ id: "number" }), "accept");
    await act(async () => draw(2));
    await settle();
    expect(el.fields[0].status).toBe("accepted");
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Run 2");
    el.querySelector<HTMLButtonElement>(".ui-xrev__confirm")!.click();
    expect(onConfirm).toHaveBeenCalledWith([expect.objectContaining({ status: "accepted" })]);
    await act(async () => root.unmount());
  });

  test("React wrapper, controlled: the fields stay with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onFieldsChange = vi.fn();
    await act(async () => root.render(React.createElement(ExtractionReview, { fields: FIELDS, pages: PAGES, onFieldsChange })));
    await settle();
    const el = host.querySelector("tc-extraction-review")!;
    await act(async () => btn(el, "Reject Total").click());
    await settle();
    expect(onFieldsChange).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ id: "total", status: "rejected" }), "reject");
    expect(el.fields[2].status).toBeUndefined();
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const reviewed: ExtractionField[] = [
          { ...FIELDS[0], status: "accepted" },
          { ...FIELDS[1], status: "rejected" },
          { ...FIELDS[2], status: "corrected", value: "1,240.00", original: "1,204.00" },
          ...FIELDS.slice(3),
        ];
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-extraction-review look=${look} heading="Invoice" source="inv.pdf" .pages=${PAGES} .fields=${reviewed}></tc-extraction-review>
            <div style="width: 360px"><tc-extraction-review look=${look} .pages=${PAGES} .fields=${FIELDS}></tc-extraction-review></div>
          </div>`,
        );
        const first = wrap.querySelector("tc-extraction-review")!;
        cell(first, 3).focus();
        await key(cell(first, 3), "F2");
        finishAnimations();
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
