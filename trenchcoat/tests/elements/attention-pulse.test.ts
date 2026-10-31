/* <tc-attention-pulse> in real browsers: no pulse on load, one pulse per change, it clears itself, and axe. */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import { TcAttentionPulse } from "../../src/elements/attention-pulse";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const pulse = () => fixture<TcAttentionPulse>(html`<tc-attention-pulse pulse-key="1"><p>Notice</p></tc-attention-pulse>`);

describe("tc-attention-pulse", () => {
  test("doesn't pulse when first shown", async () => {
    const el = await pulse();
    expect(el.dataset.ui).toBe("atp");
    expect(el.hasAttribute("data-pulsing")).toBe(false);
  });

  test("a new key pulses once, then it clears", async () => {
    expect(TcAttentionPulse.css).not.toMatch(/\binfinite\b/);
    const el = await pulse();
    el.pulseKey = "2";
    await settle();
    expect(el.hasAttribute("data-pulsing")).toBe(true);
    const [animation] = el.getAnimations();
    expect(animation!.effect!.getComputedTiming().iterations).toBe(1);
    await finish(el);
    await expect.poll(() => el.hasAttribute("data-pulsing")).toBe(false);
  });

  test("the same key doesn't pulse", async () => {
    const el = await pulse();
    el.pulseKey = "1";
    await settle();
    expect(el.hasAttribute("data-pulsing")).toBe(false);
  });

  test("axe: no violations", async () => {
    const el = await pulse();
    const { violations } = await axe.run(el);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
