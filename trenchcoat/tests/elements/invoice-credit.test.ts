/*
 * <tc-invoice-credit> in real browsers: the two stacked sheets and their totals, the tab switch, Credit invoice and
 * the related-invoice link handing focus to the sheet that comes forward, picking lines and editing amounts, issuing
 * (with a promise from onIssue, a rejection and a retry), controlled `view`, lines passed later, narrow width, the
 * React wrapper and the block on it, and axe in both looks and both themes. Ported from the jsdom regressions of
 * blocks/invoice-credit.tsx.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/invoice-credit";
import type { InvoiceIssue, InvoiceLine, InvoiceViewChange, TcInvoiceCredit } from "../../src/elements/invoice-credit";
import { InvoiceCredit } from "../../src/elements/react/invoice-credit";
import { InvoiceCredit as InvoiceCreditBlock } from "../../blocks/invoice-credit";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const line = (id: string, name: string, rate: number, extra: Partial<InvoiceLine> = {}): InvoiceLine => ({ id, name, qty: 1, rate, tax: 0.2, ...extra });

const make = (extra: Partial<TcInvoiceCredit> = {}, look: "standard" | "clean" = "standard") =>
  fixture<HTMLElement>(
    html`<div style="width: 760px"><tc-invoice-credit look=${look} .lines=${extra.lines ?? [line("a", "Plan", 100), line("b", "Seats", 50, { group: "Add-ons" })]} .view=${extra.view ?? "invoice"} .onIssue=${extra.onIssue}></tc-invoice-credit></div>`,
  ).then((w) => w.querySelector("tc-invoice-credit")!);
const tab = (el: Element, name: string) => [...el.querySelectorAll<HTMLElement>('[role="tab"]')].find((t) => t.textContent!.includes(name))!;
const btn = (el: Element, label: string) => [...el.querySelectorAll<HTMLButtonElement>("tc-button button")].find((b) => b.textContent!.includes(label));
const sheet = (el: Element, doc: string) => el.querySelector<HTMLElement>(`.ui-iv__sheet[data-doc="${doc}"]`)!;
const amount = (el: Element, name: string) => el.querySelector<HTMLInputElement>(`input[aria-label="Credit amount for ${name}"]`)!;
const check = (el: Element, name: string) => el.querySelector<HTMLButtonElement>(`[role="checkbox"][aria-label="Credit ${name}"]`)!;

describe("<tc-invoice-credit>", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`structure (${look}): the switch, two sheets with the invoice in front, its totals and grouped lines`, async () => {
      const el = await make({}, look);
      expect(el.dataset.ui).toBe("iv");
      expect(el.dataset.look).toBe(look);
      expect(el.dataset.view).toBe("invoice");
      expect(sheet(el, "invoice").hasAttribute("data-behind")).toBe(false);
      expect(sheet(el, "credit").getAttribute("aria-hidden")).toBe("true");
      expect(sheet(el, "credit").inert).toBe(true);
      expect(sheet(el, "invoice").querySelector(".ui-iv__big")!.textContent).toBe("$180.00");
      expect(el.querySelector(".ui-iv__group")!.textContent).toBe("Add-ons");
      expect(el.querySelector("tr[data-indent] td")!.textContent).toBe("Seats");
    });
  }

  test("the switch is a tablist whose tabs control the sheets; arrows switch", async () => {
    const el = await make();
    const credit = tab(el, "Credit note");
    const panel = document.getElementById(credit.getAttribute("aria-controls")!)!;
    expect(panel.getAttribute("role")).toBe("tabpanel");
    tab(el, "Invoice").focus();
    tab(el, "Invoice").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    await settle(el);
    expect(tab(el, "Credit note").getAttribute("aria-selected")).toBe("true");
    expect(el.dataset.view).toBe("credit");
  });

  test("Credit invoice goes away – focus moves to the credit note; the related invoice link moves it back", async () => {
    const el = await make();
    const credit = btn(el, "Credit invoice")!;
    credit.focus();
    credit.click();
    await settle(el);
    expect(btn(el, "Credit invoice")).toBeUndefined();
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Credit note");
    const back = [...el.querySelectorAll<HTMLButtonElement>("button.ui-iv__ref")].find((b) => b.textContent === "INV-2041")!;
    back.focus();
    back.click();
    await settle(el);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Invoice");
  });

  test("tc-view-change carries the view; preventDefault keeps the sheet", async () => {
    const el = await make();
    const asked: string[] = [];
    el.addEventListener("tc-view-change", (e) => {
      asked.push((e as CustomEvent<InvoiceViewChange>).detail.view);
      e.preventDefault();
    });
    btn(el, "Credit invoice")!.click();
    await settle(el);
    tab(el, "Credit note").click();
    await settle(el);
    expect(asked).toEqual(["credit", "credit"]);
    expect(el.dataset.view).toBe("invoice");
    expect(tab(el, "Invoice").getAttribute("aria-selected")).toBe("true");
  });

  test("lines start picked in full; unpicking and editing an amount update the totals; amounts are capped", async () => {
    const el = await make({ view: "credit" });
    const due = () => el.querySelector('.ui-iv__sheet[data-doc="credit"] .ui-iv__due')!.textContent!;
    expect(due()).toContain("$180.00 credited");
    check(el, "Seats").click();
    await settle(el);
    expect(check(el, "Seats").getAttribute("aria-checked")).toBe("false");
    expect(amount(el, "Seats").disabled).toBe(true);
    expect(due()).toContain("$120.00 credited");
    const plan = amount(el, "Plan");
    plan.focus();
    await settle(el);
    expect(plan.value).toBe("100");
    plan.value = "40x";
    plan.dispatchEvent(new Event("input", { bubbles: true }));
    expect(plan.value).toBe("40");
    plan.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle(el);
    expect(plan.value).toBe("40.00");
    expect(due()).toContain("$48.00 credited");
    plan.focus();
    plan.value = "999";
    plan.dispatchEvent(new Event("input", { bubbles: true }));
    plan.blur();
    await settle(el);
    expect(plan.value).toBe("100.00");
  });

  test("lines passed later start picked in full", async () => {
    const el = (await make({ view: "credit", lines: [line("a", "Plan", 100)] })) as TcInvoiceCredit;
    el.lines = [line("a", "Plan", 100), line("b", "Seats", 50)];
    await settle(el);
    expect(amount(el, "Seats").value).toBe("50.00");
    expect(check(el, "Seats").getAttribute("aria-checked")).toBe("true");
  });

  test("a rejected onIssue keeps the note editable and shows the error; a retry can succeed", async () => {
    const calls: [Record<string, number>, number][] = [];
    let n = 0;
    const el = await make({
      view: "credit",
      lines: [line("a", "Plan", 100)],
      onIssue: (credits, total) => {
        calls.push([credits, total]);
        return n++ === 0 ? Promise.reject(new Error("Ledger is locked")) : Promise.resolve();
      },
    });
    const issued: InvoiceIssue[] = [];
    el.addEventListener("tc-issue", (e) => issued.push((e as CustomEvent<InvoiceIssue>).detail));
    btn(el, "Issue credit note")!.click();
    await expect.poll(() => el.querySelector("[role='alert']")?.textContent).toBe("Ledger is locked");
    expect(el.querySelector(".ui-iv__badge")).toBeNull();
    expect(calls).toEqual([[{ a: 100 }, 120]]);
    expect(issued).toEqual([]);
    btn(el, "Try again")!.click();
    await expect.poll(() => el.querySelector(".ui-iv__badge")?.textContent).toBe("Issued");
    expect(el.querySelector("[role='alert']")).toBeNull();
    expect(issued).toEqual([{ credits: { a: 100 }, total: 120 }]);
    expect(check(el, "Plan").disabled).toBe(true);
  });

  test("Issue and Edit are the same button, so focus stays; Issued is announced by a region present from mount", async () => {
    const el = await make({ view: "credit" });
    const status = el.querySelector(".ui-iv__live[role='status']")!;
    expect(status.textContent!.trim()).toBe("");
    const issue = btn(el, "Issue credit note")!;
    issue.focus();
    issue.click();
    await settle(el);
    expect(status.textContent!.trim()).toBe("Issued");
    expect(btn(el, "Edit credit note")).toBe(issue);
    expect(document.activeElement).toBe(issue);
    issue.click();
    await settle(el);
    expect(btn(el, "Issue credit note")).toBe(issue);
    expect(check(el, "Plan").disabled).toBe(false);
  });

  test("nothing picked: Issue is disabled", async () => {
    const el = await make({ view: "credit", lines: [line("a", "Plan", 100)] });
    check(el, "Plan").click();
    await settle(el);
    expect(el.querySelector<HTMLElement>(".ui-iv__issue-btn")!.hasAttribute("disabled")).toBe(true);
  });

  test("PDF and Pay online fire events; Pay online stays put unless pay-href is safe", async () => {
    const el = (await make()) as TcInvoiceCredit;
    const events: string[] = [];
    el.addEventListener("tc-pdf", () => events.push("pdf"));
    el.addEventListener("tc-pay", () => events.push("pay"));
    btn(el, "PDF")!.click();
    const pay = el.querySelector<HTMLAnchorElement>(".ui-iv__due a")!;
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    pay.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(events).toEqual(["pdf", "pay"]);
    el.payHref = "javascript:alert(1)";
    await settle(el);
    expect(pay.getAttribute("href")).toBe("#pay");
  });

  test("narrow: the sheets keep their content in view and the tax and rate columns give way", async () => {
    const w = await fixture(html`<div style="width: 360px"><tc-invoice-credit view="credit"></tc-invoice-credit></div>`);
    const el = w.querySelector("tc-invoice-credit")!;
    expect(getComputedStyle(el.querySelector(".ui-iv__table th:nth-child(3)")!).display).toBe("none");
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
    const input = el.querySelector<HTMLInputElement>(".ui-iv__amount input")!;
    expect(input.getBoundingClientRect().width).toBeGreaterThan(40);
  });

  test("React wrapper: an uncontrolled view survives parent re-renders; onViewChange reports it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(InvoiceCredit, { onViewChange: (v: string) => void seen.push(v), "data-n": n } as React.ComponentProps<typeof InvoiceCredit>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<HTMLElement>("tc-invoice-credit")!;
    btn(el, "Credit invoice")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.dataset.view).toBe("credit");
    expect(seen).toEqual(["credit"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled view reports Credit invoice without switching", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[] = [];
    await act(async () => root.render(React.createElement(InvoiceCredit, { view: "invoice", onViewChange: (v: string) => void asked.push(v) })));
    await settle();
    const el = host.querySelector<HTMLElement>("tc-invoice-credit")!;
    btn(el, "Credit invoice")!.click();
    await settle();
    expect(asked).toEqual(["credit"]);
    expect(el.dataset.view).toBe("invoice");
    await act(async () => root.unmount());
  });

  test("the block: className and DOM props reach the element, which is its ref; onIssue gets the credits", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const ref = React.createRef<HTMLElement>();
    const got: number[] = [];
    await act(async () =>
      root.render(React.createElement(InvoiceCreditBlock, { ref, className: "mine", ...({ "data-x": "1" } as object), defaultView: "credit", lines: [line("a", "Plan", 10)], onIssue: (_c: Record<string, number>, t: number) => void got.push(t) })),
    );
    await settle();
    const el = host.querySelector<HTMLElement>("tc-invoice-credit")!;
    expect(ref.current).toBe(el);
    expect(el.classList.contains("mine") && el.classList.contains("ui-iv")).toBe(true);
    expect(el.getAttribute("data-x")).toBe("1");
    btn(el, "Issue credit note")!.click();
    await settle();
    expect(got).toEqual([12]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="width: 760px; padding: 16px; background: var(--tc-surface-base)">
        <tc-invoice-credit></tc-invoice-credit>
        <tc-invoice-credit look="clean" view="credit"></tc-invoice-credit>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
