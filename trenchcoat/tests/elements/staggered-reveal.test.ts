/* <tc-staggered-reveal> in real browsers: the stagger and its cap, once only, replay, off screen, reduced motion and axe. */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/staggered-reveal";
import type { TcStaggeredReveal } from "../../src/elements/staggered-reveal";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const rows = (el: Element) => [...el.children].filter((c) => c.localName === "div");
const reveal = (delay = 100, max = 250) => fixture<TcStaggeredReveal>(html`<tc-staggered-reveal delay=${delay} max-delay=${max}><div>A</div><div>B</div><div>C</div><div>D</div><div>E</div></tc-staggered-reveal>`);
const delays = (el: Element) => rows(el).map((c) => c.getAnimations()[0]?.effect?.getTiming().delay);

describe("tc-staggered-reveal", () => {
  test("each child waits a little longer, up to the cap, and plays once in view", async () => {
    const el = await reveal();
    expect(el.dataset.ui).toBe("srv");
    expect(delays(el)).toEqual([0, 100, 200, 250, 250]);
    await expect.poll(() => rows(el)[0]!.getAnimations()[0]?.playState ?? "finished").not.toBe("paused");
  });

  test("off screen it waits, and plays when it comes into view", async () => {
    const el = await fixture<TcStaggeredReveal>(html`<tc-staggered-reveal style="position: absolute; top: 5000px"><div>A</div></tc-staggered-reveal>`);
    const a = rows(el)[0]!.getAnimations()[0]!;
    await settle();
    expect(a.playState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => a.playState).not.toBe("paused");
  });

  test("a new play-key plays it again; moving it doesn't", async () => {
    const el = await fixture<TcStaggeredReveal>(html`<tc-staggered-reveal play-key="1"><div>A</div></tc-staggered-reveal>`);
    const first = rows(el)[0]!.getAnimations()[0]!;
    await expect.poll(() => first.playState).not.toBe("paused");
    first.finish();
    await settle();
    const parent = el.parentElement!;
    el.remove();
    parent.append(el);
    await settle();
    expect(rows(el)[0]!.getAnimations().filter((a) => a.playState !== "finished")).toHaveLength(0);
    el.playKey = "2";
    await settle();
    expect(rows(el)[0]!.getAnimations().length).toBe(1);
  });

  test("with reduced motion, nothing hides or moves", async () => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => (q.includes("reduced-motion") ? ({ matches: true } as MediaQueryList) : original.call(window, q)));
    const el = await reveal();
    for (const r of rows(el)) expect(r.getAnimations()).toHaveLength(0);
    expect(getComputedStyle(rows(el)[0]!).opacity).toBe("1");
  });

  test("leaving the page cancels what's waiting; axe: no violations", async () => {
    const el = await reveal();
    const { violations } = await axe.run(el);
    expect(violations.map((v) => v.id)).toEqual([]);
    const a = rows(el)[0]!.getAnimations()[0];
    el.remove();
    expect(a?.playState === "idle" || a === undefined).toBe(true);
  });
});
