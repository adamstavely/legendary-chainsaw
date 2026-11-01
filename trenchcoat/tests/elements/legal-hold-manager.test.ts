/*
 * <tc-legal-hold-manager> in real browsers: order, status and overdue, opening, adding items, releasing with a reason,
 * readonly, controlled use, keyboard, narrow width, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/legal-hold-manager";
import type { LegalHold, LegalHoldsChange, TcLegalHoldManager } from "../../src/elements/legal-hold-manager";
import { LegalHoldManager } from "../../src/elements/react/legal-hold-manager";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const HOLDS: LegalHold[] = [
  { id: "rel", name: "Old audit", placedBy: "Sam", placedAt: 1, reason: "Audit", status: "released", items: [] },
  { id: "ok", name: "Current", placedBy: "Sam", placedAt: 1, until: 2000, reason: "Keep", status: "active", items: [{ id: "i1", name: "One.pdf" }, { id: "i2", name: "Two.pdf" }] },
  { id: "late", name: "Late review", placedBy: "Sam", placedAt: 1, until: 500, reason: "Keep", status: "active", items: [{ id: "i3", name: "Three.pdf" }] },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const manager = (now?: number) => fixture<TcLegalHoldManager>(html`<tc-legal-hold-manager .holds=${HOLDS} .now=${now}></tc-legal-hold-manager>`);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-lhm__row-button[data-hold="${id}"]`)!;
const open = async (el: Element, id: string) => {
  row(el, id).click();
  await settle();
};
const order = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-lhm__row-button")].map((b) => b.dataset.hold);
const release = async (el: Element, note: string) => {
  el.querySelector<HTMLElement>(".ui-lhm__release")!.click();
  await settle();
  const t = el.querySelector<HTMLTextAreaElement>(".ui-lhm__note")!;
  t.value = note;
  t.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
  el.querySelector<HTMLElement>(".ui-lhm__confirm-release")!.click();
  await settle();
};

describe("tc-legal-hold-manager", () => {
  test("overdue comes first when now is given, with status in words", async () => {
    const el = await manager(1000);
    expect(el.dataset.ui).toBe("lhm");
    expect(order(el)).toEqual(["late", "ok", "rel"]);
    expect(text(row(el, "late"))).toContain("Review overdue");
    expect(text(row(el, "ok"))).not.toContain("Review overdue");
    expect(text(row(el, "rel"))).toContain("Released");
    expect(text(el.querySelector(".ui-lhm__count"))).toBe("2 on hold");
  });

  test("without now, nothing's overdue", async () => {
    const el = await manager();
    expect(el.querySelector(".ui-lhm__overdue")).toBeNull();
  });

  test("opening shows the facts and items, and arrow keys move with one tab stop", async () => {
    const el = await manager();
    expect([...el.querySelectorAll<HTMLElement>(".ui-lhm__row-button")].filter((b) => b.tabIndex === 0)).toHaveLength(1);
    await open(el, "ok");
    expect(row(el, "ok").getAttribute("aria-expanded")).toBe("true");
    expect(text(el.querySelector(".ui-lhm__items"))).toContain("One.pdf");
    row(el, "ok").focus();
    row(el, "ok").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    await settle();
    await expect.poll(() => document.activeElement).toBe(row(el, "late"));
  });

  test("adding an item reports it", async () => {
    const el = await manager();
    const seen: LegalHoldsChange[] = [];
    el.addEventListener("tc-holds-change", (e) => seen.push((e as CustomEvent<LegalHoldsChange>).detail));
    await open(el, "ok");
    const input = el.querySelector<HTMLInputElement>(".ui-lhm__input")!;
    expect(el.querySelector<HTMLButtonElement>(".ui-lhm__add-button")!.disabled).toBe(true);
    input.value = "Three.pdf";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    el.querySelector<HTMLElement>(".ui-lhm__add-button")!.click();
    await settle();
    expect(seen[0]!.change).toBe("add-item");
    expect(seen[0]!.item!.name).toBe("Three.pdf");
    expect(new Set(seen[0]!.hold.items.map((i) => i.id)).size).toBe(3);
    expect(text(el.querySelector(".ui-lhm__items"))).toContain("Three.pdf");
    expect(input.value).toBe("");
  });

  test("release says how many it frees, and needs a reason", async () => {
    const el = await manager();
    const seen: LegalHoldsChange[] = [];
    el.addEventListener("tc-holds-change", (e) => seen.push((e as CustomEvent<LegalHoldsChange>).detail));
    await open(el, "ok");
    el.querySelector<HTMLElement>(".ui-lhm__release")!.click();
    await settle();
    expect(text(el.querySelector(".ui-lhm__warning"))).toContain("frees 2 items");
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-lhm__note"));
    el.querySelector<HTMLElement>(".ui-lhm__confirm-release")!.click();
    await settle();
    expect(text(el.querySelector(".ui-lhm__error"))).toContain("Add a reason");
    expect(seen).toHaveLength(0);
    const t = el.querySelector<HTMLTextAreaElement>(".ui-lhm__note")!;
    t.value = "Settled";
    t.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    el.querySelector<HTMLElement>(".ui-lhm__confirm-release")!.click();
    await settle();
    expect(seen[0]!.change).toBe("release");
    expect(seen[0]!.reason).toBe("Settled");
    expect(el.holds.find((h) => h.id === "ok")!.status).toBe("released");
    expect(el.querySelector(".ui-lhm__release")).toBeNull();
    expect(text(el.querySelector(".ui-lhm__detail"))).toContain("Settled");
    expect(text(el.querySelector('[role="status"]'))).toContain("Released Current");
  });

  test("Keep on hold backs out and returns focus", async () => {
    const el = await manager();
    await open(el, "ok");
    el.querySelector<HTMLElement>(".ui-lhm__release")!.click();
    await settle();
    el.querySelector<HTMLElement>(".ui-lhm__keep")!.click();
    await settle();
    expect(el.querySelector(".ui-lhm__confirm")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-lhm__release"));
  });

  test("preventDefault keeps the holds and the form", async () => {
    const el = await manager();
    el.addEventListener("tc-holds-change", (e) => e.preventDefault());
    await open(el, "ok");
    await release(el, "No");
    expect(el.holds).toBe(HOLDS);
    expect(el.querySelector(".ui-lhm__confirm")).toBeTruthy();
  });

  test("preventDefault keeps the selection", async () => {
    const el = await manager();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    await open(el, "ok");
    expect(el.selected).toBeNull();
  });

  test("readonly and released holds offer no changes", async () => {
    const el = await fixture<TcLegalHoldManager>(html`<tc-legal-hold-manager readonly .holds=${HOLDS} selected="ok"></tc-legal-hold-manager>`);
    expect(el.querySelector(".ui-lhm__items")).toBeTruthy();
    expect(el.querySelector(".ui-lhm__add, .ui-lhm__release")).toBeNull();
    const other = await manager();
    await open(other, "rel");
    expect(other.querySelector(".ui-lhm__add, .ui-lhm__release")).toBeNull();
    expect(text(other.querySelector(".ui-lhm__none"))).toContain("Nothing held");
  });

  test("says so when there are none, and nothing overflows when narrow", async () => {
    const empty = await fixture<TcLegalHoldManager>(html`<tc-legal-hold-manager></tc-legal-hold-manager>`);
    expect(text(empty.querySelector(".ui-lhm__empty"))).toBe("No legal holds.");
    const wrap = await fixture<HTMLElement>(html`<div style="width: 280px"><tc-legal-hold-manager .holds=${HOLDS} selected="ok"></tc-legal-hold-manager></div>`);
    const el = wrap.firstElementChild as HTMLElement;
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });
});

describe("React", () => {
  const mount = async (node: React.ReactElement) => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    await act(async () => root.render(node));
    await settle();
    return { host, root };
  };

  test("the uncontrolled selection survives a re-render", async () => {
    const node = () => React.createElement(LegalHoldManager, { defaultHolds: HOLDS });
    const { host, root } = await mount(node());
    const el = host.querySelector<TcLegalHoldManager>("tc-legal-hold-manager")!;
    await act(async () => open(el, "ok"));
    await act(async () => root.render(node()));
    await settle();
    expect(el.selected).toBe("ok");
    await act(async () => root.unmount());
    host.remove();
  });

  test("controlled holds stay until the parent changes them", async () => {
    const seen: LegalHold[][] = [];
    const { host, root } = await mount(React.createElement(LegalHoldManager, { holds: HOLDS, defaultSelected: "ok", onHoldsChange: (h: LegalHold[]) => seen.push(h) }));
    const el = host.querySelector<TcLegalHoldManager>("tc-legal-hold-manager")!;
    await act(async () => release(el, "Done"));
    expect(seen).toHaveLength(1);
    expect(el.holds).toBe(HOLDS);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-legal-hold-manager .holds=${HOLDS} .now=${1000} selected="ok"></tc-legal-hold-manager></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
