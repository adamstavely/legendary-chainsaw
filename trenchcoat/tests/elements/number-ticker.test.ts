/*
 * <tc-number-ticker> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/number-ticker";
import type { TcNumberTicker } from "../../src/elements/number-ticker";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  delete (document as { visibilityState?: unknown }).visibilityState;
});

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const until = async (check: () => boolean, ms = 3000) => {
  const end = performance.now() + ms;
  while (!check() && performance.now() < end) await wait(16);
};
/** Each column's offset in % (rounded: browsers shorten the transform they keep) */
const offsets = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>(".ui-nt__stack")].map((s) => Number(/translateY\((-?[\d.]+)%\)/.exec(s.style.transform)?.[1] ?? NaN).toFixed(2));
const at = (digits: number[]) => digits.map((d) => ((-d / 11) * 100).toFixed(2));
/** Counts the element's renders */
const countUpdates = (el: TcNumberTicker) => {
  const counter = { n: 0 };
  const original = (el as unknown as { update(c: unknown): void }).update.bind(el);
  (el as unknown as { update(c: unknown): void }).update = (c) => {
    counter.n++;
    original(c);
  };
  return counter;
};

describe("tc-number-ticker", () => {
  test("the host is the root and a polite live region; screen readers read the formatted number", async () => {
    const el = await fixture<TcNumberTicker>(html`<tc-number-ticker class="mine" value="48240" locale="en-US"></tc-number-ticker>`);
    expect(el.dataset.ui).toBe("nt");
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.querySelector(".ui-nt__sr")!.textContent).toBe("48,240");
    expect(el.querySelector(".ui-nt__track")!.getAttribute("aria-hidden")).toBe("true");
    expect(el.querySelectorAll(".ui-nt__col").length).toBe(5);
    expect(el.querySelector(".ui-nt__static")!.textContent).toBe(",");
  });

  test("callers can turn the announcements off (4.1.3)", async () => {
    const el = await fixture<TcNumberTicker>(html`<tc-number-ticker aria-live="off" value="5" locale="en-US"></tc-number-ticker>`);
    expect(el.getAttribute("aria-live")).toBe("off");
  });

  test("formatting comes from Intl.NumberFormat; only digits roll", async () => {
    const el = await fixture<TcNumberTicker>(html`<tc-number-ticker value="1234" locale="en-US" .format=${{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}></tc-number-ticker>`);
    expect(el.querySelector(".ui-nt__sr")!.textContent).toBe("$1,234");
    expect([...el.querySelectorAll(".ui-nt__static")].map((s) => s.textContent)).toEqual(["$", ","]);
  });

  test("the count-in and every new value cost one render each, never one per frame", async () => {
    const el = await fixture<TcNumberTicker>(html`<tc-number-ticker value="42" locale="en-US" duration="150"></tc-number-ticker>`);
    const renders = countUpdates(el);
    await until(() => offsets(el).join() === at([4, 2]).join());
    expect(offsets(el)).toEqual(at([4, 2]));
    expect(renders.n, "the count-in itself renders nothing").toBe(0);
    el.value = 57;
    await settle();
    await until(() => offsets(el).join() === at([5, 7]).join());
    expect(offsets(el)).toEqual(at([5, 7]));
    expect(renders.n).toBe(1);
  });

  test("a column that appears later slides in; the others don't", async () => {
    const el = await fixture<TcNumberTicker>(html`<tc-number-ticker value="99" locale="en-US" duration="100"></tc-number-ticker>`);
    await until(() => offsets(el).join() === at([9, 9]).join());
    const ones = el.querySelectorAll(".ui-nt__col")[1];
    el.value = 100;
    await settle();
    const cols = [...el.querySelectorAll(".ui-nt__col")];
    expect(cols.map((c) => c.hasAttribute("data-enter"))).toEqual([true, false, false]);
    // Columns keep their identity, keyed from the right
    expect(cols[2]).toBe(ones);
    await until(() => offsets(el).join() === at([1, 0, 0]).join());
    expect(offsets(el)).toEqual(at([1, 0, 0]));
  });

  test("in a hidden tab a roll jumps to its end; hiding it mid-roll finishes it", async () => {
    let visibility: DocumentVisibilityState = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
    const el = await fixture<TcNumberTicker>(html`<tc-number-ticker value="10" locale="en-US" duration="2000"></tc-number-ticker>`);
    await until(() => offsets(el)[0] !== at([0])[0]);
    // mid count-in
    visibility = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    expect(offsets(el)).toEqual(at([1, 0]));
    el.value = 34;
    await settle();
    expect(offsets(el)).toEqual(at([3, 4]));
  });

  test("it waits for delay before the count-in", async () => {
    const el = await fixture<TcNumberTicker>(html`<tc-number-ticker value="7" locale="en-US" delay="300" duration="0"></tc-number-ticker>`);
    await wait(100);
    expect(offsets(el)).toEqual(at([0]));
    await until(() => offsets(el).join() === at([7]).join());
    expect(offsets(el)).toEqual(at([7]));
  });

  test("removed mid-roll, the roll jumps to its end and stops", async () => {
    const el = await fixture<TcNumberTicker>(html`<tc-number-ticker value="5" locale="en-US" duration="2000"></tc-number-ticker>`);
    await wait(150);
    el.remove();
    expect(offsets(el)).toEqual(at([5]));
  });

  test("axe: no violations", async () => {
    const wrap = await fixture(html`<div><tc-number-ticker value="128450" locale="en-US" duration="0"></tc-number-ticker></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
