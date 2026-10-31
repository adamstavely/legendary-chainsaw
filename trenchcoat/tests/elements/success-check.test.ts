/* <tc-success-check> in real browsers: decorative or labelled, one finite draw, drawing again, and axe. */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import { TcSuccessCheck } from "../../src/elements/success-check";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-success-check", () => {
  test("is decorative without a label, and an image with one", async () => {
    const el = await fixture<TcSuccessCheck>(html`<tc-success-check></tc-success-check>`);
    expect(el.dataset.ui).toBe("sck");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    el.label = "Saved";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Saved");
  });

  test("draws once and never loops", async () => {
    expect(TcSuccessCheck.css).not.toMatch(/\binfinite\b/);
    const el = await fixture<TcSuccessCheck>(html`<tc-success-check></tc-success-check>`);
    const animations = el.getAnimations({ subtree: true });
    expect(animations.length).toBe(2);
    for (const a of animations) expect(a.effect!.getComputedTiming().iterations).toBe(1);
  });

  test("a new play-key draws it again", async () => {
    const el = await fixture<TcSuccessCheck>(html`<tc-success-check play-key="1"></tc-success-check>`);
    await finish(el);
    expect(el.getAnimations({ subtree: true }).filter((a) => a.playState === "running")).toHaveLength(0);
    el.playKey = "2";
    await settle();
    expect(el.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length).toBeGreaterThan(0);
  });

  test("axe: no violations", async () => {
    const el = await fixture<TcSuccessCheck>(html`<tc-success-check label="Saved"></tc-success-check>`);
    const { violations } = await axe.run(el);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
