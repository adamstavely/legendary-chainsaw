/* <tc-number-change> in real browsers: no highlight on load, direction, words, clearing, formatting and axe. */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import { TcNumberChange } from "../../src/elements/number-change";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const number = () => fixture<TcNumberChange>(html`<tc-number-change value="100" locale="en-US"></tc-number-change>`);

describe("tc-number-change", () => {
  test("doesn't highlight on first render", async () => {
    const el = await number();
    expect(el.dataset.ui).toBe("nch");
    expect(el.textContent!.trim()).toBe("100");
    expect(el.hasAttribute("data-change")).toBe(false);
  });

  test("going up and down highlights with a mark and a word, then clears", async () => {
    const el = await number();
    el.value = 120;
    await settle();
    expect(el.getAttribute("data-change")).toBe("up");
    expect(el.querySelector(".ui-nch-arrow")).toBeTruthy();
    expect(el.querySelector(".tc-sr-only")!.textContent).toContain("up");
    await finish(el);
    await expect.poll(() => el.hasAttribute("data-change")).toBe(false);
    el.value = 90;
    await settle();
    expect(el.getAttribute("data-change")).toBe("down");
    expect(el.querySelector(".tc-sr-only")!.textContent).toContain("down");
  });

  test("the same value, and direction none, don't highlight", async () => {
    const el = await number();
    el.value = 100;
    await settle();
    expect(el.hasAttribute("data-change")).toBe(false);
    el.direction = "none";
    el.value = 200;
    await settle();
    expect(el.hasAttribute("data-change")).toBe(false);
    expect(el.textContent!.trim()).toBe("200");
  });

  test("a set direction wins", async () => {
    const el = await number();
    el.direction = "down";
    el.value = 200;
    await settle();
    expect(el.getAttribute("data-change")).toBe("down");
  });

  test("formats with Intl, and survives bad options", async () => {
    const el = await fixture<TcNumberChange>(html`<tc-number-change value="1200" locale="en-US" .format=${{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}></tc-number-change>`);
    expect(el.textContent!.trim()).toBe("$1,200");
    el.format = { style: "currency" };
    await settle();
    expect(el.textContent!.trim()).toBe("1200");
  });

  test("the highlight is finite; axe: no violations", async () => {
    expect(TcNumberChange.css).not.toMatch(/\binfinite\b/);
    const el = await number();
    el.value = 150;
    await settle();
    expect(el.getAnimations()[0]!.effect!.getComputedTiming().iterations).toBe(1);
    await finish(el);
    const { violations } = await axe.run(el);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
