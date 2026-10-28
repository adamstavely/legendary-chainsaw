/*
 * <tc-account-list> in real browsers: rows, masked identifiers and revealing them, statuses, amounts and the stats
 * strip, View, the roving keyboard, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/account-list";
import type { AccountOpen, AccountRecord, AccountRevealedChange, AccountStat, TcAccountList } from "../../src/elements/account-list";
import { AccountList } from "../../src/elements/react/account-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ACCOUNTS: AccountRecord[] = [
  { id: "op", institution: "Banque Rhône", branch: "Lyon", country: "France", type: "Business operating", number: "FR7630006000011234567890189", status: "flagged", amount: { value: 298000, label: "Flagged · 90 days" }, note: "New payee" },
  { id: "pc", institution: "Crédit Saône", country: "France", type: "Personal current", number: "FR7614508000400556677881234", status: "monitored" },
  { id: "short", institution: "Petty", number: "1234", status: "review" },
  { id: "x", institution: "Limassol Trust", status: "frozen" },
];
const STATS: AccountStat[] = [
  { id: "vol", label: "Flagged volume", value: "€428K", detail: "last 90 days" },
  { id: "n", label: "Linked accounts", value: "4" },
];

const rowOf = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-id="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") => fixture<TcAccountList>(html`<tc-account-list look=${look} description="Review." .accounts=${ACCOUNTS} .stats=${STATS}></tc-account-list>`);

describe("tc-account-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a row per account with institution, place, type, identifier, amount, status and View`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("acl");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector(".ui-acl__list")!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Linked accounts");
      expect(list.querySelectorAll(".ui-acl__row")).toHaveLength(4);
      const op = rowOf(el, "op");
      expect(op.querySelector(".ui-acl__title")!.textContent).toBe("Banque Rhône · Lyon, France");
      expect(op.querySelector(".ui-acl__type")!.textContent).toBe("Business operating");
      expect(op.querySelector(".ui-acl__amount-value")!.textContent).toBe(new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(298000));
      expect(op.querySelector(".ui-acl__amount-label")!.textContent).toBe("Flagged · 90 days");
      expect(op.querySelector(".ui-acl__note")!.textContent).toBe("New payee");
      expect(el.querySelector(".ui-acl__count")!.textContent!.replace(/\s+/g, " ").trim()).toBe("4 accounts");
      // One tab stop: the first row's View
      expect(list.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
      expect(op.querySelector(".ui-acl__view")!.getAttribute("tabindex")).toBe("0");
    });
  }

  test("the stats strip: each value with its label and detail, as a description list", async () => {
    const el = await make();
    const stats = [...el.querySelectorAll(".ui-acl__stat")];
    expect(stats.map((s) => [s.querySelector("dt")!.textContent, s.querySelector(".ui-acl__stat-value")!.textContent])).toEqual([
      ["Flagged volume", "€428K"],
      ["Linked accounts", "4"],
    ]);
    expect(stats[0].querySelector(".ui-acl__stat-detail")!.textContent).toBe("last 90 days");
    el.stats = [];
    await settle();
    expect(el.querySelector(".ui-acl__stats")).toBeNull();
  });

  test("statuses: default names and tones, a mark in each pill, unknown statuses as neutral", async () => {
    const el = await make();
    const pill = (id: string) => rowOf(el, id).querySelector<HTMLElement>(".ui-acl__pill")!;
    expect(["op", "pc", "short", "x"].map((id) => [pill(id).dataset.tone, pill(id).textContent!.trim()])).toEqual([
      ["danger", "Flagged"],
      ["info", "Monitored"],
      ["warning", "Under review"],
      ["neutral", "Frozen"],
    ]);
    expect(pill("op").querySelector("svg")).toBeTruthy();
    el.statuses = { frozen: { label: "Frozen by court order", tone: "danger" } };
    await settle();
    expect([pill("x").dataset.tone, pill("x").textContent!.trim()]).toEqual(["danger", "Frozen by court order"]);
  });

  test("identifiers: masked IBAN-style to the country, check digits and last four; shown in groups; short ones never masked", async () => {
    const el = await make();
    const num = (id: string) => rowOf(el, id).querySelector<HTMLElement>(".ui-acl__number")!;
    expect(num("op").querySelector('[aria-hidden="true"]')!.textContent).toBe("FR76 •••• 0189");
    expect(num("op").textContent).toContain("ending 0189, hidden");
    expect(num("op").hasAttribute("data-masked")).toBe(true);
    // Four characters or fewer: nothing to mask, no Show button
    expect(num("short").hasAttribute("data-masked")).toBe(false);
    expect(rowOf(el, "short").querySelector(".ui-acl__reveal")).toBeNull();
    const seen: AccountRevealedChange[] = [];
    el.addEventListener("tc-revealed-change", (e) => seen.push((e as CustomEvent<AccountRevealedChange>).detail));
    const reveal = rowOf(el, "op").querySelector<HTMLButtonElement>(".ui-acl__reveal")!;
    expect(reveal.getAttribute("aria-label")).toBe("Show identifier, Banque Rhône, Business operating");
    reveal.click();
    await settle();
    expect(num("op").textContent).toBe("Identifier FR76 3000 6000 0112 3456 7890 189");
    expect(reveal.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Banque Rhône identifier shown");
    reveal.click();
    await settle();
    expect(num("op").hasAttribute("data-masked")).toBe(true);
    expect(seen).toEqual([
      { revealed: ["op"], id: "op", shown: true },
      { revealed: [], id: "op", shown: false },
    ]);
    el.masked = false;
    await settle();
    expect(el.querySelector(".ui-acl__reveal")).toBeNull();
  });

  test("controlled: preventDefault() keeps an identifier masked; View fires tc-open with the account", async () => {
    const el = await make();
    el.addEventListener("tc-revealed-change", (e) => e.preventDefault());
    rowOf(el, "pc").querySelector<HTMLButtonElement>(".ui-acl__reveal")!.click();
    await settle();
    expect(el.revealed).toEqual([]);
    expect(rowOf(el, "pc").querySelector(".ui-acl__number")!.hasAttribute("data-masked")).toBe(true);
    const opened: AccountOpen[] = [];
    el.addEventListener("tc-open", (e) => opened.push((e as CustomEvent<AccountOpen>).detail));
    rowOf(el, "x").querySelector<HTMLButtonElement>(".ui-acl__view")!.click();
    expect(opened.map((o) => o.account.id)).toEqual(["x"]);
  });

  test("keyboard: ↑ ↓ between rows, ← → between a row's buttons, Home / End; the tab stop follows", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-at");
    rowOf(el, "op").querySelector<HTMLButtonElement>(".ui-acl__view")!.focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('.ui-acl__list button[tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowLeft");
    expect(at()).toBe("0:0");
    await press("ArrowDown");
    expect(at()).toBe("1:0");
    // A row without Show identifier lands on View
    await press("ArrowDown");
    expect(at()).toBe("2:1");
    await press("End");
    expect(at()).toBe("3:1");
    await press("Home");
    expect(at()).toBe("0:1");
    await press("ArrowRight");
    expect(at()).toBe("0:1");
  });

  test("an empty list says so", async () => {
    const el = await fixture<TcAccountList>(html`<tc-account-list></tc-account-list>`);
    expect(el.querySelector(".ui-acl__empty")!.textContent).toBe("No linked accounts.");
    expect(el.querySelector(".ui-acl__count")).toBeNull();
  });

  test("React wrapper: uncontrolled reveals survive re-renders; onOpen gets the account; controlled stays put", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const opened: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(AccountList, { title: "Accounts", accounts: ACCOUNTS, onOpen: (a) => void opened.push(a.id), "data-n": n } as React.ComponentProps<typeof AccountList>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-account-list")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Accounts");
    rowOf(el, "op").querySelector<HTMLButtonElement>(".ui-acl__reveal")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.revealed).toEqual(["op"]);
    rowOf(el, "pc").querySelector<HTMLButtonElement>(".ui-acl__view")!.click();
    expect(opened).toEqual(["pc"]);
    const asked: string[][] = [];
    await act(async () => root.render(React.createElement(AccountList, { accounts: ACCOUNTS, revealed: [], onRevealedChange: (r) => void asked.push(r) })));
    await settle();
    // A different parent component: React mounts a new element
    const controlled = host.querySelector("tc-account-list")!;
    rowOf(controlled, "pc").querySelector<HTMLButtonElement>(".ui-acl__reveal")!.click();
    await settle();
    expect(asked).toEqual([["pc"]]);
    expect(controlled.revealed).toEqual([]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-account-list description="Review." .accounts=${ACCOUNTS} .stats=${STATS} .revealed=${["op"]}></tc-account-list>
        <tc-account-list look="clean" .accounts=${ACCOUNTS}></tc-account-list>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
