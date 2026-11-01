/* <tc-progress-bar> in real browsers: known and unknown waits, done, the sweep ending, and axe. */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/progress-bar";
import type { TcProgressBar } from "../../src/elements/progress-bar";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const track = (el: Element) => el.querySelector('[role="progressbar"]')!;
const fill = (el: Element) => el.querySelector<HTMLElement>(".ui-pgb-fill")!;

describe("tc-progress-bar", () => {
  test("a known wait says how far along, clamped", async () => {
    const el = await fixture<TcProgressBar>(html`<tc-progress-bar label="Importing" value="0.62"></tc-progress-bar>`);
    expect(el.dataset.ui).toBe("pgb");
    expect(track(el).getAttribute("aria-label")).toBe("Importing");
    expect(track(el).getAttribute("aria-valuenow")).toBe("62");
    expect(fill(el).style.width).toBe("62%");
    el.value = 3;
    await settle();
    expect(track(el).getAttribute("aria-valuenow")).toBe("100");
  });

  test("an unknown wait has no value and sweeps", async () => {
    const el = await fixture<TcProgressBar>(html`<tc-progress-bar></tc-progress-bar>`);
    expect(track(el).hasAttribute("aria-valuenow")).toBe(false);
    expect(el.hasAttribute("data-unknown")).toBe(true);
    expect(fill(el).getAnimations().length).toBe(1);
  });

  test("done ends the sweep, fills the bar and fades it out", async () => {
    const el = await fixture<TcProgressBar>(html`<tc-progress-bar></tc-progress-bar>`);
    el.done = true;
    await settle();
    expect(el.hasAttribute("data-unknown")).toBe(false);
    expect(track(el).getAttribute("aria-valuenow")).toBe("100");
    expect(fill(el).getAnimations().filter((a) => a.effect!.getComputedTiming().iterations === Infinity)).toHaveLength(0);
    await finish(el);
    expect(getComputedStyle(el).visibility).toBe("hidden");
  });

  test("axe: no violations, known and unknown", async () => {
    const wrap = await fixture(html`<div><tc-progress-bar value="0.5"></tc-progress-bar><tc-progress-bar label="Loading results"></tc-progress-bar></div>`);
    const { violations } = await axe.run(wrap);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
