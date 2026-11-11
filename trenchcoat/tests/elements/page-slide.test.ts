/* <tc-page-slide> in real browsers: data-view children, views swapped by the page, direction, the height glide, focus, reduced motion, React and axe. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/page-slide";
import type { TcPageSlide } from "../../src/elements/page-slide";
import { PageSlide } from "../../src/elements/react/page-slide";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const wizard = (view = "scope", attrs: { focusHeading?: boolean; duration?: number } = {}) =>
  fixture<TcPageSlide>(html`<tc-page-slide view=${view} ?focus-heading=${!!attrs.focusHeading} duration=${attrs.duration ?? 200}>
    <section data-view="scope" style="height: 60px"><h3>Scope</h3><button type="button">Edit scope</button></section>
    <section data-view="evidence" style="height: 140px"><h3>Evidence</h3><button type="button">Add evidence</button></section>
    <section data-view="sign-off" style="height: 80px"><h3>Sign-off</h3></section>
  </tc-page-slide>`);
const view = (el: Element, key: string) => el.querySelector<HTMLElement>(`[data-view="${key}"]:not(.ui-pgsl__copy)`)!;
const shown = (el: Element) => [...el.querySelectorAll<HTMLElement>("[data-view]")].filter((v) => !v.hidden && !v.classList.contains("ui-pgsl__out")).map((v) => v.dataset.view);
const reduce = () => {
  const original = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation((q: string) => (q.includes("reduced-motion") ? ({ matches: true } as MediaQueryList) : original.call(window, q)));
};
/** The translateX a running animation starts from, in % */
const startX = (el: Element) => {
  const kf = el.getAnimations()[0]?.effect as KeyframeEffect | undefined;
  const m = String(kf?.getKeyframes()[0]?.transform ?? "").match(/translateX\((-?[\d.]+)%\)/);
  return m ? Number(m[1]) : 0;
};

describe("tc-page-slide", () => {
  test("shows only the view named by `view`", async () => {
    const el = await wizard();
    expect(el.dataset.ui).toBe("pgsl");
    expect(shown(el)).toEqual(["scope"]);
    expect(view(el, "evidence").hidden).toBe(true);
  });

  test("forward: the new view comes in from the end while the old one slides out, inert and hidden from assistive tech", async () => {
    const el = await wizard();
    el.view = "evidence";
    await settle();
    expect(shown(el)).toEqual(["evidence"]);
    const out = el.querySelector<HTMLElement>(".ui-pgsl__out")!;
    expect(out.dataset.view).toBe("scope");
    expect(out.getAttribute("aria-hidden")).toBe("true");
    expect(out.hasAttribute("inert")).toBe(true);
    expect(el.hasAttribute("data-busy")).toBe(true);
    expect(startX(view(el, "evidence"))).toBe(100);
    await expect.poll(() => el.querySelector(".ui-pgsl__out"), { timeout: 3000 }).toBeNull();
    expect(view(el, "scope").hidden).toBe(true);
    expect(view(el, "scope").hasAttribute("inert")).toBe(false);
    expect(el.hasAttribute("data-busy")).toBe(false);
  });

  test("back: going to an earlier view brings it in from the start; `direction` overrides the order", async () => {
    const el = await wizard("sign-off");
    el.view = "scope";
    await settle();
    expect(startX(view(el, "scope"))).toBe(-100);
    await finish(el);
    el.direction = "back";
    el.view = "evidence";
    await settle();
    expect(startX(view(el, "evidence"))).toBe(-100);
  });

  test("`order` decides the direction when it's given", async () => {
    const el = await wizard("evidence");
    el.order = ["sign-off", "evidence", "scope"];
    el.view = "scope";
    await settle();
    expect(startX(view(el, "scope"))).toBe(100);
  });

  test("the height glides from the old view's to the new one's", async () => {
    const el = await wizard();
    expect(el.getBoundingClientRect().height).toBe(60);
    el.view = "evidence";
    await settle();
    const anim = el.getAnimations().find((a) => (a.effect as KeyframeEffect).getKeyframes().some((k) => k.height));
    expect(anim).toBeDefined();
    expect((anim!.effect as KeyframeEffect).getKeyframes().map((k) => k.height)).toEqual(["60px", "140px"]);
    await finish(el);
    await settle();
    expect(el.getBoundingClientRect().height).toBe(140);
  });

  test("focus in the old view moves into the new one, not to <body>", async () => {
    const el = await wizard();
    view(el, "scope").querySelector("button")!.focus();
    el.view = "evidence";
    await settle();
    expect(document.activeElement!.textContent).toBe("Add evidence");
  });

  test("focus-heading: the new view's heading takes focus after every change", async () => {
    const el = await wizard("scope", { focusHeading: true });
    el.view = "sign-off";
    await settle();
    const h = view(el, "sign-off").querySelector("h3")!;
    expect(document.activeElement).toBe(h);
    expect(h.tabIndex).toBe(-1);
  });

  test("a change doesn't take focus from outside without focus-heading", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div><button id="next">Next</button><tc-page-slide view="a"><div data-view="a">A</div><div data-view="b">B</div></tc-page-slide></div>`);
    const next = wrap.querySelector<HTMLButtonElement>("#next")!;
    next.focus();
    wrap.querySelector<TcPageSlide>("tc-page-slide")!.view = "b";
    await settle();
    expect(document.activeElement).toBe(next);
  });

  test("a change mid-slide finishes the first slide before starting the next", async () => {
    const el = await wizard();
    el.view = "evidence";
    await settle();
    el.view = "sign-off";
    await settle();
    expect(el.querySelectorAll(".ui-pgsl__out")).toHaveLength(1);
    expect(el.querySelector<HTMLElement>(".ui-pgsl__out")!.dataset.view).toBe("evidence");
    expect(shown(el)).toEqual(["sign-off"]);
    await expect.poll(() => el.querySelector(".ui-pgsl__out"), { timeout: 3000 }).toBeNull();
    expect(shown(el)).toEqual(["sign-off"]);
  });

  test("views swapped by the page: a copy of the one that left slides out, then goes", async () => {
    const el = await fixture<TcPageSlide>(html`<tc-page-slide view="one" duration="150"><div><p>First</p></div></tc-page-slide>`);
    const next = document.createElement("div");
    next.innerHTML = "<p>Second</p>";
    el.firstElementChild!.replaceWith(next);
    el.view = "two";
    await settle();
    const copy = el.querySelector<HTMLElement>(".ui-pgsl__copy")!;
    expect(copy.textContent).toBe("First");
    expect(copy.getAttribute("aria-hidden")).toBe("true");
    await expect.poll(() => el.querySelector(".ui-pgsl__copy"), { timeout: 3000 }).toBeNull();
    expect(el.textContent!.trim()).toBe("Second");
  });

  test("with reduced motion the views switch at once", async () => {
    reduce();
    const el = await wizard();
    el.view = "evidence";
    await settle();
    expect(el.querySelector(".ui-pgsl__out")).toBeNull();
    expect(view(el, "evidence").getAnimations()).toHaveLength(0);
    expect(shown(el)).toEqual(["evidence"]);
  });

  test("removed mid-slide, it leaves nothing behind", async () => {
    const el = await wizard();
    el.view = "evidence";
    await settle();
    el.remove();
    expect(el.querySelector(".ui-pgsl__out")).toBeNull();
    expect(el.hasAttribute("data-busy")).toBe(false);
  });

  test("React: renders the current view in a keyed layer; the old one slides out as a copy", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const render = (v: string) => root.render(React.createElement(PageSlide, { view: v, order: ["scope", "evidence"], focusHeading: true }, React.createElement("h3", null, v)));
    await act(async () => render("scope"));
    await settle();
    const el = host.querySelector<TcPageSlide>("tc-page-slide")!;
    expect(el.querySelector('[data-view="scope"]')).not.toBeNull();
    await act(async () => render("evidence"));
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-pgsl__copy")?.textContent).toBe("scope");
    expect(document.activeElement!.textContent).toBe("evidence");
    await expect.poll(() => el.querySelector(".ui-pgsl__copy"), { timeout: 3000 }).toBeNull();
    await act(async () => root.unmount());
    host.remove();
  });

  for (const theme of ["light", "dark"]) {
    test(`axe (${theme}): no violations mid-slide (contrast aside) and after it`, async () => {
      const wrap = await fixture<HTMLDivElement>(html`<div data-tc-theme=${theme}><tc-page-slide view="scope" duration="150">
        <section data-view="scope"><h3>Scope</h3><button type="button">Edit</button></section>
        <section data-view="evidence"><h3>Evidence</h3><button type="button">Add</button></section>
      </tc-page-slide></div>`);
      wrap.querySelector<TcPageSlide>("tc-page-slide")!.view = "evidence";
      await settle();
      const run = async (rules?: Record<string, { enabled: boolean }>) => (await axe.run(wrap, { rules })).violations.map((v) => v.id);
      expect(await run({ "color-contrast": { enabled: false } })).toEqual([]);
      await finish(wrap);
      await expect.poll(() => wrap.querySelector(".ui-pgsl__out"), { timeout: 3000 }).toBeNull();
      expect(await run()).toEqual([]);
    });
  }
});
