/*
 * <tc-experiment-card> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/experiment-card";
import type { ExperimentMetric, ExperimentVariant, TcExperimentCard } from "../../src/elements/experiment-card";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const variants: ExperimentVariant[] = [
  { id: "a", key: "A", name: "Current", control: true, values: { cr: 3.1 } },
  { id: "b", key: "B", name: "One-page", values: { cr: 3.6 } },
];
const metrics: ExperimentMetric[] = [{ id: "cr", label: "Conversion" }];
const twoMetrics: ExperimentMetric[] = [
  { id: "cr", label: "Conversion" },
  { id: "aov", label: "Order value" },
];
const twoValues: ExperimentVariant[] = [
  { id: "a", key: "A", name: "Current", control: true, values: { cr: 3.1, aov: 40 } },
  { id: "b", key: "B", name: "One-page", values: { cr: 3.6, aov: 52 } },
];
const rich: ExperimentVariant[] = [
  { id: "a", key: "A", name: "Current", control: true, visitors: 1200, values: { cr: 3.1 } },
  { id: "b", key: "B", name: "One-page", visitors: 1180, confidence: { cr: 94 }, values: { cr: 3.6 } },
];

const row = (el: Element, name: RegExp) => [...el.querySelectorAll<HTMLButtonElement>(".ui-xc__row")].find((b) => name.test(b.getAttribute("aria-label")!))!;
const toggle = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-xc__toggle")!;
const radio = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((b) => b.textContent === name)!;
const key = (t: Element, k: string) => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-experiment-card", () => {
  test("the host is the root; the toggle names the test, its status and the leader", async () => {
    const el = await fixture<TcExperimentCard>(html`<tc-experiment-card heading="Checkout" .variants=${variants} .metrics=${metrics} .status=${{ label: "Running", tone: "green" }} note="Day 9"></tc-experiment-card>`);
    expect(el.dataset.ui).toBe("xc");
    expect(el.dataset.look).toBe("standard");
    expect(toggle(el).getAttribute("aria-label")).toBe("Checkout, Running, One-page is ahead by 16.1 percent");
    expect(toggle(el).getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(toggle(el).getAttribute("aria-controls")!)!.hasAttribute("inert")).toBe(true);
    expect(el.querySelector(".ui-xc__lead")!.textContent).toBe("B+16.1%");
    expect(el.querySelector(".ui-xc__note")!.textContent).toBe("Day 9");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: controlled winner and open report changes without applying them`, async () => {
      const seen: unknown[] = [];
      const el = await fixture<TcExperimentCard>(html`<tc-experiment-card
        look=${look}
        heading="Checkout"
        open
        .variants=${variants}
        .metrics=${metrics}
        @tc-winner-change=${(e: CustomEvent) => (e.preventDefault(), seen.push(e.detail))}
        @tc-open-change=${(e: CustomEvent) => (e.preventDefault(), seen.push(e.detail))}
      ></tc-experiment-card>`);
      row(el, /^B One-page/).click();
      await settle();
      expect(row(el, /^B One-page/).getAttribute("aria-pressed")).toBe("false");
      toggle(el).click();
      await settle();
      expect(seen).toEqual([{ winner: "b" }, { open: false }]);
      expect(toggle(el).getAttribute("aria-expanded")).toBe("true");
    });

    test(`${look}: an action returning a promise waits, and a rejection can be retried`, async () => {
      let reject: (e: Error) => void = () => {};
      const onClick = vi.fn(() => new Promise((_, r) => (reject = r)));
      const el = await fixture<TcExperimentCard>(html`<tc-experiment-card look=${look} heading="Checkout" open winner="b" .variants=${variants} .metrics=${metrics} .action=${{ label: "Ship", onClick }}></tc-experiment-card>`);
      const button = el.querySelector<HTMLButtonElement>(".ui-xc__action")!;
      expect(button.textContent!.trim()).toBe("Ship");
      button.click();
      await settle();
      // aria-disabled (not disabled) while it runs, so it keeps focus
      expect(button.getAttribute("aria-disabled")).toBe("true");
      button.click();
      expect(onClick).toHaveBeenCalledTimes(1);
      reject(new Error("nope"));
      await settle();
      expect(button.getAttribute("aria-disabled")).toBeNull();
      expect(el.querySelector(".ui-xc__caption")!.textContent).toMatch(/Couldn’t finish – try again/);
      expect(el.querySelector('[role="status"]')!.textContent).toBe("Couldn’t finish One-page – try again");
      button.click();
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    test(`${look}: a press outside closes it`, async () => {
      const onOpen = vi.fn();
      const el = await fixture<TcExperimentCard>(html`<tc-experiment-card look=${look} heading="Checkout" open .variants=${variants} .metrics=${metrics} @tc-open-change=${(e: CustomEvent) => onOpen(e.detail.open)}></tc-experiment-card>`);
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await settle();
      expect(onOpen).toHaveBeenCalledWith(false);
      expect(el.hasAttribute("data-open")).toBe(false);
      // A press inside doesn't
      el.open = true;
      await settle();
      row(el, /^A/).dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await settle();
      expect(el.hasAttribute("data-open")).toBe(true);
    });

    test(`${look}: winner rows are toggle buttons in a group; picking twice clears; a status announces the pick`, async () => {
      const el = await fixture<TcExperimentCard>(html`<tc-experiment-card look=${look} heading="Checkout" open .variants=${rich} .metrics=${metrics}></tc-experiment-card>`);
      expect(el.querySelector('[role="radio"]')).toBeNull();
      expect(el.querySelector('[role="group"][aria-label="Winner"]')).toBeTruthy();
      const status = el.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("");
      const r = row(el, /^B One-page/);
      r.click();
      await settle();
      expect(r.getAttribute("aria-pressed")).toBe("true");
      expect(status.textContent).toBe("One-page picked");
      r.click();
      await settle();
      expect(r.getAttribute("aria-pressed")).toBe("false");
    });

    test(`${look}: the row name carries better/worse, visitors and confidence; the caption isn't a live region`, async () => {
      const el = await fixture<TcExperimentCard>(html`<tc-experiment-card look=${look} heading="Checkout" open .variants=${rich} .metrics=${metrics}></tc-experiment-card>`);
      const r = row(el, /^B One-page/);
      expect(r.getAttribute("aria-label")).toBe("B One-page 3.6 +16.1%, up 16.1 percent, better, 1,180 visitors, 94% confidence");
      expect(r.querySelector(".ui-xc__lift svg")).toBeTruthy();
      expect(el.querySelector(".ui-xc__caption")!.hasAttribute("aria-live")).toBe(false);
      // Focusing a row puts its numbers in the caption
      r.focus();
      await settle();
      expect(el.querySelector(".ui-xc__caption")!.textContent).toBe("B · 1,180 visitors · 94% confidence");
    });
  }

  test("for a lower-is-better metric a drop reads as better", async () => {
    const v: ExperimentVariant[] = [
      { id: "a", key: "A", name: "Current", control: true, values: { bounce: 40 } },
      { id: "b", key: "B", name: "Lean", values: { bounce: 30 } },
    ];
    const el = await fixture<TcExperimentCard>(html`<tc-experiment-card heading="Bounce" open .variants=${v} .metrics=${[{ id: "bounce", label: "Bounce", lowerIsBetter: true }]}></tc-experiment-card>`);
    expect(row(el, /^B Lean/).getAttribute("aria-label")).toMatch(/down 25.0 percent, better/);
  });

  test("metric radios move with all arrow keys, Home and End; focus follows the checked radio", async () => {
    const m3 = [...twoMetrics, { id: "x", label: "Third" }];
    const el = await fixture<TcExperimentCard>(html`<tc-experiment-card heading="Checkout" open .variants=${twoValues} .metrics=${m3}></tc-experiment-card>`);
    const checked = () => el.querySelector('[aria-checked="true"]')!.textContent;
    radio(el, "Conversion").focus();
    key(radio(el, "Conversion"), "ArrowDown");
    await settle();
    expect(checked()).toBe("Order value");
    expect(document.activeElement).toBe(radio(el, "Order value"));
    key(radio(el, "Order value"), "ArrowUp");
    await settle();
    expect(checked()).toBe("Conversion");
    key(radio(el, "Conversion"), "End");
    await settle();
    expect(checked()).toBe("Third");
    key(radio(el, "Third"), "ArrowRight");
    await settle();
    expect(checked()).toBe("Conversion");
    expect([...el.querySelectorAll('[role="radio"]')].map((r) => r.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
  });

  test("a metric switch rolls the values to their new numbers", async () => {
    const el = await fixture<TcExperimentCard>(html`<tc-experiment-card heading="Checkout" open .variants=${twoValues} .metrics=${twoMetrics}></tc-experiment-card>`);
    const value = () => el.querySelectorAll(".ui-xc__value")[1].textContent;
    expect(value()).toBe("3.6");
    radio(el, "Order value").click();
    await settle();
    expect(el.querySelector('[aria-checked="true"]')!.textContent).toBe("Order value");
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const seen = new Set<string | null>();
      for (let i = 0; i < 20 && value() !== "52"; i++) {
        seen.add(value());
        await new Promise((r) => requestAnimationFrame(r));
      }
      expect(seen.size).toBeGreaterThan(1);
    }
    await vi.waitFor(() => expect(value()).toBe("52"), { timeout: 2000 });
  });

  test("the pointer leaving doesn't fold the card while focus is on a row", async () => {
    const el = await fixture<TcExperimentCard>(html`<tc-experiment-card heading="Checkout" open .variants=${rich} .metrics=${metrics}></tc-experiment-card>`);
    const r = row(el, /^B One-page/);
    r.focus();
    el.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
    await new Promise((res) => setTimeout(res, 400));
    await settle();
    expect(el.hasAttribute("data-open")).toBe(true);
    expect(document.activeElement).toBe(r);
  });

  test("hover opens after a short delay and closes when the pointer leaves", async () => {
    const el = await fixture<TcExperimentCard>(html`<tc-experiment-card heading="Checkout" .variants=${rich} .metrics=${metrics}></tc-experiment-card>`);
    el.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    await vi.waitFor(() => expect(el.hasAttribute("data-open")).toBe(true));
    el.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
    await vi.waitFor(() => expect(el.hasAttribute("data-open")).toBe(false));
  });

  test("Escape closes and focus goes to the toggle", async () => {
    const el = await fixture<TcExperimentCard>(html`<tc-experiment-card heading="Checkout" open .variants=${rich} .metrics=${metrics}></tc-experiment-card>`);
    const r = row(el, /^A Current/);
    r.focus();
    key(r, "Escape");
    await settle();
    expect(el.hasAttribute("data-open")).toBe(false);
    expect(toggle(el).getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle(el));
  });

  test("a hint replaces the resting caption", async () => {
    const el = await fixture<TcExperimentCard>(html`<tc-experiment-card heading="Checkout" open hint="Choose one" .variants=${rich} .metrics=${metrics}></tc-experiment-card>`);
    expect(el.querySelector(".ui-xc__caption")!.textContent).toBe("Choose one");
    el.hint = undefined;
    await settle();
    expect(el.querySelector(".ui-xc__caption")!.textContent).toBe("Pick a winner");
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-experiment-card heading="Checkout" open winner="b" .action=${{ label: "Ship", onClick: () => {} }} .status=${{ label: "Running", tone: "green" }} .variants=${rich} .metrics=${twoMetrics}></tc-experiment-card>
      <tc-experiment-card look="clean" heading="Checkout" open .status=${{ label: "Running", tone: "green" }} .variants=${rich} .metrics=${twoMetrics}></tc-experiment-card>
    </div>`);
    // The chips and the caption pop in: check the colours once they're settled
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
