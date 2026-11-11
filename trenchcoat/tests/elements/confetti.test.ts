/* <tc-confetti> in real browsers: no burst on load, fire() and fire-key, trigger="click", the canvas going once the last
 * piece settles, the cap, seeded patterns, reduced motion, the announcement, the React ref and axe. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/confetti";
import type { ConfettiDone, TcConfetti } from "../../src/elements/confetti";
import { Confetti } from "../../src/elements/react/confetti";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const canvas = () => document.querySelector<HTMLCanvasElement>(".ui-cft__canvas");
const wrapped = (trigger: "none" | "click" = "none") =>
  fixture<TcConfetti>(html`<tc-confetti fire-key="1" announce="Review closed" trigger=${trigger}><button type="button">Close review</button></tc-confetti>`);
const reduce = () => {
  const real = window.matchMedia.bind(window);
  vi.spyOn(window, "matchMedia").mockImplementation((q: string) => (q.includes("prefers-reduced-motion") ? ({ matches: true, media: q } as MediaQueryList) : real(q)));
};

describe("tc-confetti", () => {
  test("nothing falls when first shown, and nothing runs at rest", async () => {
    const el = await wrapped();
    expect(el.dataset.ui).toBe("cft");
    expect(el.active).toBe(0);
    expect(canvas()).toBeNull();
  });

  test("fire() puts the pieces in the air on one canvas, which goes when they've settled", async () => {
    const el = await wrapped();
    const done = vi.fn<(e: CustomEvent<ConfettiDone>) => void>();
    el.addEventListener("tc-confetti-done", done as unknown as EventListener);
    el.fire({ count: 40 });
    expect(el.active).toBe(40);
    const c = canvas()!;
    expect(c).not.toBeNull();
    expect(c.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(c).pointerEvents).toBe("none");
    expect(c.width).toBe(Math.round(window.innerWidth * (window.devicePixelRatio || 1)));
    await expect.poll(() => el.active, { timeout: 4000 }).toBe(0);
    await expect.poll(() => canvas(), { timeout: 1000 }).toBeNull();
    expect(done).toHaveBeenCalledTimes(1);
    expect(done.mock.calls[0]![0].detail).toEqual({ bursts: 1 });
  });

  test("bursts overlap on the same canvas, and the count is capped", async () => {
    const el = await wrapped();
    el.fire({ count: 30 });
    el.fire({ count: 1000 });
    expect(el.active).toBe(330);
    expect(document.querySelectorAll(".ui-cft__canvas")).toHaveLength(1);
  });

  test("a new fire-key fires; the same one doesn't", async () => {
    const el = await wrapped();
    el.fireKey = "1";
    await settle();
    expect(el.active).toBe(0);
    el.fireKey = "2";
    await settle();
    expect(el.active).toBe(80);
  });

  test('trigger="click" fires when the content is clicked', async () => {
    const el = await wrapped("click");
    el.querySelector("button")!.click();
    expect(el.active).toBe(80);
  });

  test("without a trigger, a click does nothing", async () => {
    const el = await wrapped();
    el.querySelector("button")!.click();
    expect(el.active).toBe(0);
  });

  test("the same seed falls the same way", async () => {
    const a = await fixture<TcConfetti>(html`<tc-confetti seed="7"><button type="button">A</button></tc-confetti>`);
    a.fire({ count: 12 });
    const first = (a as unknown as { pieces: { vx: number; vy: number }[] }).pieces.map((p) => [p.vx, p.vy]);
    cleanup();
    const b = await fixture<TcConfetti>(html`<tc-confetti seed="7"><button type="button">A</button></tc-confetti>`);
    b.fire({ count: 12 });
    const second = (b as unknown as { pieces: { vx: number; vy: number }[] }).pieces.map((p) => [p.vx, p.vy]);
    expect(second).toEqual(first);
  });

  test("bare, it rains from above the viewport; with content it starts from the content", async () => {
    const bare = await fixture<TcConfetti>(html`<tc-confetti></tc-confetti>`);
    bare.fire({ count: 10 });
    const rain = (bare as unknown as { pieces: { y: number; vy: number }[] }).pieces;
    expect(rain.every((p) => p.y < 0 && p.vy > 0)).toBe(true);
    cleanup();
    const el = await wrapped();
    const r = el.querySelector("button")!.getBoundingClientRect();
    el.fire({ count: 10 });
    const burst = (el as unknown as { pieces: { x: number; y: number; vy: number }[] }).pieces;
    expect(burst.every((p) => Math.abs(p.x - (r.left + r.width / 2)) < 1 && p.vy < 0)).toBe(true);
  });

  test("colours are resolved from tokens to real colours", async () => {
    const el = await wrapped();
    el.fire({ count: 7 });
    const colours = (el as unknown as { pieces: { color: string }[] }).pieces.map((p) => p.color);
    expect(colours.every((c) => /^(rgb|color|oklch|lab)/.test(c))).toBe(true);
  });

  test("announce is said once per burst", async () => {
    const el = await wrapped();
    const status = el.querySelector(".ui-cft__status")!;
    expect(status.getAttribute("role")).toBe("status");
    expect(status.textContent).toBe("");
    el.fire({ count: 1 });
    await expect.poll(() => status.textContent).toBe("Review closed");
  });

  test("reduced motion: no pieces or canvas, a brief tint, and the words", async () => {
    reduce();
    const el = await wrapped();
    const done = vi.fn();
    el.addEventListener("tc-confetti-done", done);
    el.fire();
    expect(el.active).toBe(0);
    expect(canvas()).toBeNull();
    expect(el.hasAttribute("data-celebrating")).toBe(true);
    expect(done).toHaveBeenCalledTimes(1);
    await expect.poll(() => el.querySelector(".ui-cft__status")!.textContent).toBe("Review closed");
    await expect.poll(() => el.hasAttribute("data-celebrating"), { timeout: 3000 }).toBe(false);
  });

  test("disconnecting stops it and removes the canvas", async () => {
    const el = await wrapped();
    el.fire({ count: 20 });
    expect(canvas()).not.toBeNull();
    el.remove();
    expect(canvas()).toBeNull();
    expect(el.active).toBe(0);
  });

  test("React: the ref fires it, and onConfettiDone hears the end", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const ref = React.createRef<TcConfetti>();
    const done = vi.fn();
    await act(async () => root.render(React.createElement(Confetti, { ref, onConfettiDone: done }, React.createElement("button", { type: "button" }, "Close review"))));
    await settle();
    ref.current!.fire({ count: 5 });
    expect(ref.current!.active).toBe(5);
    await expect.poll(() => done.mock.calls.length, { timeout: 4000 }).toBe(1);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations, at rest and mid-burst`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); color: var(--tc-text-primary)">
        <tc-confetti announce="Review closed"><button type="button" style="color: var(--tc-text-primary); background: var(--tc-surface-raised); border: 1px solid var(--tc-border-default)">Close review</button></tc-confetti>
      </div>`);
      expect((await axe.run(wrap)).violations.map((v) => v.id)).toEqual([]);
      wrap.querySelector<TcConfetti>("tc-confetti")!.fire({ count: 10 });
      expect((await axe.run(wrap)).violations.map((v) => v.id)).toEqual([]);
    });
  }
});
