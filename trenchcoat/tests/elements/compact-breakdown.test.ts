/*
 * <tc-compact-breakdown> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/compact-breakdown";
import type { BreakdownItem, BreakdownPeriodChange, TcCompactBreakdown } from "../../src/elements/compact-breakdown";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const periods = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
];
const items: BreakdownItem[] = [
  { label: "Search", value: 40 },
  { label: "A very long referral source name", value: 10 },
];
const radios = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
const checked = (el: Element) => el.querySelector('[role="radio"][aria-checked="true"]')?.textContent;

describe("tc-compact-breakdown", () => {
  test("the host is the root and the group, named by the heading", async () => {
    const el = await fixture<TcCompactBreakdown>(html`<tc-compact-breakdown heading="Revenue" .items=${items}></tc-compact-breakdown>`);
    expect(el.dataset.ui).toBe("cb");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("group");
    const title = document.getElementById(el.getAttribute("aria-labelledby")!);
    expect(title?.textContent).toBe("Revenue");
    expect(el.querySelector(".ui-cb__card")).toBeTruthy();
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-cb__body")).toBeTruthy();
  });

  test("the total and the delta are said in words", async () => {
    const el = await fixture<TcCompactBreakdown>(html`<tc-compact-breakdown .items=${items} .delta=${-3.1} total-label="Total revenue"></tc-compact-breakdown>`);
    expect(el.querySelector(".ui-cb__sr")!.textContent).toBe("Total revenue: 50, down 3.1% against the previous period");
    expect(el.querySelector(".ui-cb__delta")!.textContent!.trim()).toBe("3.1%");
  });

  test("a controlled period reports a pick without applying it; uncontrolled applies and reports", async () => {
    const seen: string[] = [];
    const el = await fixture<TcCompactBreakdown>(html`<tc-compact-breakdown .items=${items} .periods=${periods} period="7d"></tc-compact-breakdown>`);
    el.addEventListener("tc-period-change", (e) => {
      seen.push((e as CustomEvent<BreakdownPeriodChange>).detail.period);
      e.preventDefault();
    });
    radios(el)[1].click();
    await settle();
    expect(seen).toEqual(["30d"]);
    expect(checked(el)).toBe("7 days");

    const free = await fixture<TcCompactBreakdown>(html`<tc-compact-breakdown .items=${items} .periods=${periods}></tc-compact-breakdown>`);
    free.addEventListener("tc-period-change", (e) => seen.push((e as CustomEvent<BreakdownPeriodChange>).detail.period));
    expect(checked(free)).toBe("7 days");
    radios(free)[1].click();
    await settle();
    expect(checked(free)).toBe("30 days");
    expect(free.period).toBe("30d");
    expect(seen).toEqual(["30d", "30d"]);
  });

  test("parts that arrive later join the list and keep their first-seen color", async () => {
    const el = await fixture<TcCompactBreakdown>(html`<tc-compact-breakdown .items=${[{ label: "Search", value: 40 }]}></tc-compact-breakdown>`);
    const first = el.querySelector<HTMLElement>(".ui-cb__row .ui-cb__swatch")!.style.background;
    el.items = [
      { label: "Search", value: 10 },
      { label: "Direct", value: 30 },
    ];
    await settle();
    expect([...el.querySelectorAll(".ui-cb__label")].map((n) => n.textContent).sort()).toEqual(["Direct", "Search"]);
    const search = [...el.querySelectorAll(".ui-cb__row")].find((r) => r.textContent?.includes("Search"))!;
    expect(search.querySelector<HTMLElement>(".ui-cb__swatch")!.style.background).toBe(first);
  });

  test("rows are plain list items, not focusable, and long labels keep a title (4.1.2)", async () => {
    const el = await fixture<TcCompactBreakdown>(html`<tc-compact-breakdown .items=${items}></tc-compact-breakdown>`);
    expect(el.querySelectorAll("[tabindex]")).toHaveLength(0);
    expect(el.querySelectorAll("li")).toHaveLength(2);
    expect(el.querySelector('.ui-cb__label[title="A very long referral source name"]')).toBeTruthy();
  });

  test("parts that leave the period are inert while they fold away", async () => {
    const el = await fixture<TcCompactBreakdown>(html`<tc-compact-breakdown .items=${items}></tc-compact-breakdown>`);
    // Let the first roll finish
    await new Promise((r) => setTimeout(r, 1000));
    el.items = items.slice(0, 1);
    await settle();
    const leaving = el.querySelector("li[data-leaving]");
    if (leaving) expect(leaving.hasAttribute("inert")).toBe(true);
  });

  test("the period switch is a radio group with arrow keys and one tab stop (2.1.1)", async () => {
    const el = await fixture<TcCompactBreakdown>(html`<tc-compact-breakdown .items=${items} .periods=${periods}></tc-compact-breakdown>`);
    const [a, b] = radios(el);
    expect([a.tabIndex, b.tabIndex]).toEqual([0, -1]);
    a.focus();
    a.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    await settle();
    expect(b.getAttribute("aria-checked")).toBe("true");
    expect([a.tabIndex, b.tabIndex]).toEqual([-1, 0]);
    expect(document.activeElement).toBe(b);
    b.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
    await settle();
    expect(a.getAttribute("aria-checked")).toBe("true");
    b.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
    await settle();
    expect(b.getAttribute("aria-checked")).toBe("true");
  });

  test("hovering a part shows it in the caption; leaving goes back to the total", async () => {
    const el = await fixture<TcCompactBreakdown>(html`<tc-compact-breakdown .items=${items}></tc-compact-breakdown>`);
    el.querySelector(".ui-cb__item")!.dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(el.querySelector(".ui-cb__list")!.hasAttribute("data-active")).toBe(true);
    expect(el.querySelector(".ui-cb__caption")!.textContent).toMatch(/Search · \d+%/);
    el.querySelector(".ui-cb__list")!.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(el.querySelector(".ui-cb__caption")!.textContent!.trim()).toBe("Total");
  });

  test("the footer: the largest part by default, text or a cloned element in its place, null hides it", async () => {
    const el = await fixture<TcCompactBreakdown>(html`<tc-compact-breakdown .items=${items}></tc-compact-breakdown>`);
    expect(el.querySelector(".ui-cb__foot")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Largest: Search");
    el.footer = "Updated hourly";
    await settle();
    expect(el.querySelector(".ui-cb__foot")!.textContent).toBe("Updated hourly");
    const mine = document.createElement("em");
    mine.textContent = "Mine";
    el.footer = mine;
    await settle();
    expect(el.querySelector(".ui-cb__foot em")!.textContent).toBe("Mine");
    expect(mine.isConnected).toBe(false);
    el.footer = null;
    await settle();
    expect(el.querySelector(".ui-cb__foot")).toBeNull();
  });

  test("numbers roll to their values", async () => {
    const el = await fixture<TcCompactBreakdown>(html`<tc-compact-breakdown .items=${items} .format=${(n: number) => `$${Math.round(n)}`}></tc-compact-breakdown>`);
    await new Promise((r) => setTimeout(r, 1100));
    await settle();
    expect(el.querySelector(".ui-cb__big")!.textContent).toBe("$50");
    expect([...el.querySelectorAll(".ui-cb__value")].map((n) => n.textContent)).toEqual(["$40", "$10"]);
    expect([...el.querySelectorAll(".ui-cb__share")].map((n) => n.textContent)).toEqual(["80%", "20%"]);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-compact-breakdown .items=${items} .periods=${periods} .delta=${12.4}></tc-compact-breakdown>
      <tc-compact-breakdown look="clean" heading="Clean" .items=${items} .periods=${periods} .delta=${12.4}></tc-compact-breakdown>
    </div>`);
    // Entry animations fade in – measure contrast once they've finished
    await Promise.all(document.getAnimations().map((a) => a.finished));
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
