/*
 * <tc-line-items> in real browsers: the grid and its totals, editing with locale numbers, Check and Low confidence,
 * the stated-total match, adding and removing rows, streaming, Confirm, the keyboard, narrow width, the React wrapper
 * and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/line-items";
import { lineAmount, lineTotals, parseLocaleNumber, type LineItem, type LineItemsChange, type TcLineItems } from "../../src/elements/line-items";
import { LineItems } from "../../src/elements/react/line-items";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ROWS: LineItem[] = [
  { id: "reg", description: "Registration", quantity: 1, unitPrice: 640 },
  { id: "hotel", description: "Hotel", category: "Lodging", quantity: 3, unitPrice: 148.5, uncertain: ["quantity"] },
  { id: "taxi", description: "Taxi", amount: 24, confidence: 0.5, flag: "Receipt is hard to read" },
];
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcLineItems>(html`<tc-line-items look=${look} heading="Claim" currency="EUR" locale="en-GB" .items=${ROWS}></tc-line-items>`);
const cell = (el: Element, row: number, col: number) => el.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`)!;
const total = (el: Element) => el.querySelector(".ui-lni__total dd")!.textContent!.trim();
const key = (k: string, init: KeyboardEventInit = {}) =>
  document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const at = () => {
  const a = document.activeElement as HTMLElement;
  return `${a.dataset.row}:${a.dataset.col}`;
};
async function type(el: TcLineItems, text: string) {
  await expect.poll(() => !!el.querySelector(".ui-lni__input")).toBe(true);
  const field = el.querySelector<HTMLInputElement>(".ui-lni__input")!;
  field.value = text;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
  field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  await settle();
}

describe("tc-line-items", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid with column headers, the amounts and the total, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("lni");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect(grid.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      expect([...el.querySelectorAll('[role="columnheader"]')].map((c) => c.textContent!.trim())).toEqual(["Description", "Qty", "Unit price", "Amount", "Remove"]);
      expect(el.querySelectorAll('.ui-lni__row[data-id]')).toHaveLength(3);
      expect(cell(el, 1, 3).textContent).toContain("€445.50");
      expect(total(el)).toBe("€1,109.50");
      expect(el.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(el.querySelector(".ui-lni__count")!.textContent).toBe("3 items");
    });
  }

  test("helpers: amounts, totals with tax, and numbers in the locale's writing", () => {
    expect(lineAmount({ id: "a", description: "", quantity: 2, unitPrice: 3.5 })).toBe(7);
    expect(lineAmount({ id: "a", description: "", quantity: 2, unitPrice: 3.5, amount: 9 })).toBe(9);
    expect(lineAmount({ id: "a", description: "", unitPrice: 4 })).toBe(4);
    expect(lineTotals(ROWS, 0.1)).toEqual({ subtotal: 1109.5, tax: 110.95, total: 1220.45 });
    expect(parseLocaleNumber("1,234.50", "en-US")).toBe(1234.5);
    expect(parseLocaleNumber("1.234,50", "de-DE")).toBe(1234.5);
    expect(parseLocaleNumber("€ 12,5", "fr-FR")).toBe(12.5);
    expect(parseLocaleNumber("-3", "en-US")).toBe(-3);
    expect(parseLocaleNumber("(3.00)", "en-US")).toBe(-3);
    expect(parseLocaleNumber("abc", "en-US")).toBeNaN();
    expect(parseLocaleNumber("1.2.3", "en-US")).toBeNaN();
  });

  test("Check on uncertain cells, Low confidence on a doubtful row, the flag and category in words", async () => {
    const el = await make();
    expect(cell(el, 1, 1).querySelector(".ui-lni__check")!.textContent).toContain("Check");
    expect(cell(el, 1, 0).querySelector(".ui-lni__check")).toBeNull();
    expect(cell(el, 2, 0).querySelector(".ui-lni__low")!.textContent).toBe("Low confidence");
    expect(cell(el, 0, 0).querySelector(".ui-lni__low")).toBeNull();
    expect(el.querySelector(".ui-lni__flag")!.textContent).toContain("Receipt is hard to read");
    expect(cell(el, 1, 0).querySelector(".ui-lni__cat")!.textContent).toBe("Lodging");
  });

  test("editing a quantity recomputes the amount and the total, clears Check, and fires a cancelable change", async () => {
    const el = await make();
    const seen: LineItemsChange[] = [];
    el.addEventListener("tc-items-change", (e) => seen.push((e as CustomEvent<LineItemsChange>).detail));
    cell(el, 1, 1).focus();
    key("Enter");
    await type(el, "2");
    expect(seen).toHaveLength(1);
    expect(seen[0].action).toBe("edit");
    expect(seen[0].item).toMatchObject({ id: "hotel", quantity: 2 });
    expect(seen[0].item.uncertain).toBeUndefined();
    expect(cell(el, 1, 3).textContent).toContain("€297.00");
    expect(total(el)).toBe("€961.00");
    expect(cell(el, 1, 1).querySelector(".ui-lni__check")).toBeNull();
    await expect.poll(at).toBe("1:1");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Qty of Hotel changed");
  });

  test("an amount edit sets the amount; a unit price edit drops a given amount; locale numbers are read", async () => {
    const el = await fixture<TcLineItems>(html`<tc-line-items currency="EUR" locale="de-DE" .items=${ROWS}></tc-line-items>`);
    cell(el, 0, 3).focus();
    key("Enter");
    await type(el, "1.200,25");
    expect(el.items[0].amount).toBe(1200.25);
    cell(el, 2, 2).focus();
    key("Enter");
    await type(el, "30");
    expect(el.items[2].unitPrice).toBe(30);
    expect("amount" in el.items[2]).toBe(false);
    expect(lineAmount(el.items[2])).toBe(30);
  });

  test("a number that isn't one keeps the field open, invalid and announced; Escape cancels", async () => {
    const el = await make();
    cell(el, 0, 2).focus();
    key("Enter");
    await type(el, "twelve");
    const input = el.querySelector<HTMLInputElement>(".ui-lni__input")!;
    expect(input).toBeTruthy();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Enter a number");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await settle();
    expect(el.querySelector(".ui-lni__input")).toBeNull();
    expect(el.items[0].unitPrice).toBe(640);
    await expect.poll(at).toBe("0:2");
  });

  test("typing a character starts editing with it; prevented changes leave the rows", async () => {
    const el = await make();
    el.addEventListener("tc-items-change", (e) => e.preventDefault());
    cell(el, 0, 0).focus();
    key("V");
    await expect.poll(() => el.querySelector<HTMLInputElement>(".ui-lni__input")?.value).toBe("V");
    await type(el, "Venue pass");
    expect(el.items[0].description).toBe("Registration");
  });

  test("the stated total: a mismatch in words with the difference, then a match", async () => {
    const el = await make();
    el.statedTotal = 1143.5;
    await settle();
    const match = el.querySelector<HTMLElement>(".ui-lni__match")!;
    expect(match.dataset.match).toBe("no");
    expect(match.textContent).toContain("Doesn't match the document's total of €1,143.50 – off by €34.00");
    el.items = ROWS.map((r) => (r.id === "taxi" ? { ...r, amount: 58 } : r));
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-lni__match")!.dataset.match).toBe("yes");
  });

  test("tax shows a subtotal and the rate", async () => {
    const el = await make();
    el.taxRate = 0.1;
    await settle();
    expect([...el.querySelectorAll(".ui-lni__sum dt")].map((d) => d.textContent)).toEqual(["Subtotal", "Tax 10%", "Total"]);
    expect(total(el)).toBe("€1,220.45");
  });

  test("Add row adds one and edits its description; the remove button and Delete take rows out", async () => {
    const el = await make();
    const actions: string[] = [];
    el.addEventListener("tc-items-change", (e) => actions.push((e as CustomEvent<LineItemsChange>).detail.action));
    el.querySelector<HTMLElement>(".ui-lni__add")!.click();
    await settle();
    expect(el.items).toHaveLength(4);
    await expect.poll(() => document.activeElement?.classList.contains("ui-lni__input")).toBe(true);
    await type(el, "Poster printing");
    expect(el.items[3].description).toBe("Poster printing");
    el.querySelector<HTMLElement>('.ui-lni__row[data-id="reg"] .ui-lni__remove')!.click();
    await settle();
    expect(el.items.map((i) => i.id)).not.toContain("reg");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Removed Registration");
    cell(el, 0, 0).focus();
    key("Delete");
    await settle();
    expect(el.items.map((i) => i.id)).not.toContain("hotel");
    expect(actions).toEqual(["add", "edit", "remove", "remove"]);
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.row).toBe("0");
  });

  test("keyboard: arrows, Home / End and Ctrl+Home / Ctrl+End move the one tab stop", async () => {
    const el = await make();
    cell(el, 0, 0).focus();
    key("ArrowRight");
    await expect.poll(at).toBe("0:1");
    key("ArrowDown");
    await expect.poll(at).toBe("1:1");
    key("End");
    await expect.poll(at).toBe("1:4");
    key("Home");
    await expect.poll(at).toBe("1:0");
    key("End", { ctrlKey: true, metaKey: true });
    await expect.poll(at).toBe("2:0");
    key("Home", { ctrlKey: true, metaKey: true });
    await expect.poll(at).toBe("0:0");
    expect(el.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  test("streaming: busy, Reading…, Confirm waits with a reason, and the end is announced", async () => {
    const el = await make();
    el.streaming = true;
    el.items = ROWS.slice(0, 1);
    await settle();
    expect(el.querySelector('[role="grid"]')!.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelector(".ui-lni__count")!.textContent).toBe("Reading…");
    const confirm = el.querySelector<HTMLElement>(".ui-lni__confirm")!;
    expect(confirm.getAttribute("aria-disabled")).toBe("true");
    let confirmed = 0;
    el.addEventListener("tc-confirm", () => confirmed++);
    confirm.click();
    await settle();
    expect(confirmed).toBe(0);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Still reading line items");
    el.items = ROWS;
    el.streaming = false;
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("3 line items read");
  });

  test("Confirm hands back the rows and the totals, and is announced unless prevented", async () => {
    const el = await make();
    let detail: { total: number; items: LineItem[] } | null = null;
    el.addEventListener("tc-confirm", (e) => (detail = (e as CustomEvent).detail), { once: true });
    el.querySelector<HTMLElement>(".ui-lni__confirm")!.click();
    await settle();
    expect(detail!.total).toBe(1109.5);
    expect(detail!.items).toHaveLength(3);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Confirmed 3 line items, total €1,109.50");
    el.addEventListener("tc-confirm", (e) => e.preventDefault());
    el.items = ROWS.slice(0, 1);
    await settle();
    el.querySelector<HTMLElement>(".ui-lni__confirm")!.click();
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Confirmed 3 line items, total €1,109.50");
  });

  test("empty: says so; narrow: rows become labelled cards", async () => {
    const empty = await fixture<TcLineItems>(html`<tc-line-items></tc-line-items>`);
    expect(empty.querySelector(".ui-lni__none")!.textContent).toBe("No line items yet");
    const wrap = document.body.appendChild(document.createElement("div"));
    wrap.style.width = "360px";
    wrap.innerHTML = `<tc-line-items currency="EUR"></tc-line-items>`;
    const el = wrap.querySelector<TcLineItems>("tc-line-items")!;
    el.items = ROWS;
    await settle(wrap);
    expect(getComputedStyle(el.querySelector(".ui-lni__headrow")!).display).toBe("none");
    expect(getComputedStyle(el.querySelector('.ui-lni__cell[data-field="quantity"] .ui-lni__label')!).display).toBe("block");
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React: uncontrolled edits survive re-renders; controlled rows stay until the parent changes them", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const seen: string[] = [];
    const render = (props: Partial<React.ComponentProps<typeof LineItems>>) =>
      act(async () => root.render(React.createElement(LineItems, { title: "Claim", currency: "EUR", locale: "en-GB", ...props })));
    await render({ defaultItems: ROWS, onItemsChange: (_items, item, action) => void seen.push(`${action} ${item.id}`) });
    const el = wrap.querySelector<TcLineItems>("tc-line-items")!;
    await settle(wrap);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Claim");
    el.querySelector<HTMLElement>('.ui-lni__row[data-id="reg"] .ui-lni__remove')!.click();
    await settle(wrap);
    await render({ defaultItems: ROWS, onItemsChange: () => {} });
    await settle(wrap);
    expect(el.items.map((i) => i.id)).toEqual(["hotel", "taxi"]);
    expect(seen).toEqual(["remove reg"]);
    await render({ items: ROWS, onItemsChange: () => {} });
    el.querySelector<HTMLElement>('.ui-lni__row[data-id="reg"] .ui-lni__remove')!.click();
    await settle(wrap);
    expect(el.items).toHaveLength(3);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.cssText = `color-scheme: ${theme}`;
      wrap.innerHTML = `<tc-line-items look="standard" currency="EUR" stated-total="1000"></tc-line-items><tc-line-items look="clean" currency="EUR" tax-rate="0.2"></tc-line-items>`;
      wrap.querySelectorAll<TcLineItems>("tc-line-items").forEach((el) => (el.items = ROWS));
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
