/* <tc-status-morph> in real browsers: marks and words, the crossfade, no loops, announcing, reduced motion and axe. */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TcStatusMorph } from "../../src/elements/status-morph";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const morph = (status = "pending") => fixture<TcStatusMorph>(html`<tc-status-morph status=${status}></tc-status-morph>`);
const word = (el: Element) => el.querySelector(".ui-smo-word")!.textContent;

describe("tc-status-morph", () => {
  test("shows the status's mark and word, without moving on first render", async () => {
    const el = await morph("done");
    expect(el.dataset.ui).toBe("smo");
    expect(word(el)).toBe("Done");
    expect(el.querySelector<HTMLElement>(".ui-smo-icon")!.dataset.status).toBe("done");
    expect(el.querySelector("[data-enter]")).toBeNull();
    expect(el.querySelector(".ui-smo-mark")!.getAttribute("aria-hidden")).toBe("true");
  });

  test("a change crossfades the marks, and the old one goes", async () => {
    const el = await morph("checking");
    el.status = "done";
    await el.updateComplete;
    expect(el.querySelector<HTMLElement>("[data-exit]")!.dataset.status).toBe("checking");
    expect(el.querySelector<HTMLElement>(".ui-smo-icon[data-enter]")!.dataset.status).toBe("done");
    expect(word(el)).toBe("Done");
    await finish(el);
    await expect.poll(() => el.querySelector("[data-exit]")).toBeNull();
  });

  test("words can be renamed, and an unknown status falls back", async () => {
    const el = await fixture<TcStatusMorph>(html`<tc-status-morph status="checking" .labels=${{ checking: "Looking" }}></tc-status-morph>`);
    expect(word(el)).toBe("Looking");
    el.label = "Checking access";
    await settle();
    expect(word(el)).toBe("Checking access");
    const odd = await morph("nope");
    expect(odd.querySelector<HTMLElement>(".ui-smo-icon")!.dataset.status).toBe("pending");
  });

  test("announces changes only when asked", async () => {
    const quiet = await morph();
    expect(quiet.querySelector('[role="status"]')).toBeNull();
    const el = await fixture<TcStatusMorph>(html`<tc-status-morph status="checking" announce></tc-status-morph>`);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("");
    el.status = "failed";
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Failed");
  });

  test("nothing loops, and reduced motion leaves no leaving mark", async () => {
    expect(TcStatusMorph.css).not.toMatch(/\binfinite\b/);
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => (q.includes("reduced-motion") ? ({ matches: true } as MediaQueryList) : original.call(window, q)));
    const el = await morph("checking");
    el.status = "done";
    await settle();
    expect(el.querySelector("[data-exit]")).toBeNull();
  });

  test("axe: no violations", async () => {
    const el = await morph("warning");
    const { violations } = await axe.run(el);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
