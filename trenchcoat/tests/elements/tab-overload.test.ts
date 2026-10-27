/*
 * <tc-tab-overload> in real browsers – the illustration's contract checks, ported, plus its theme, motion and
 * accessibility behaviour.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/tab-overload";
import { TcTabOverload } from "../../src/elements/tab-overload";
import { TabOverload } from "../../src/elements/react/tab-overload";
import { cleanup, fixture, parkPointer, settle } from "./helpers";

afterEach(cleanup);

describe("tc-tab-overload", () => {
  test("the host is the root; decorative without a label", async () => {
    const el = await fixture<TcTabOverload>(html`<tc-tab-overload></tc-tab-overload>`);
    expect(el.dataset.ui).toBe("to");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.querySelectorAll(".ui-to-tab")).toHaveLength(3);
    expect(getComputedStyle(el).display).toBe("block");
  });

  test("a label makes it an image named by the label, and taking it away makes it decorative again", async () => {
    const el = await fixture<TcTabOverload>(html`<tc-tab-overload label="Three browser windows"></tc-tab-overload>`);
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Three browser windows");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
    el.label = undefined;
    await settle();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.hasAttribute("aria-label")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("each instance has its own gradient and filter ids, and every reference stays inside it", async () => {
    const wrap = await fixture(html`<div><tc-tab-overload></tc-tab-overload><tc-tab-overload></tc-tab-overload></div>`);
    const [a, b] = [...wrap.querySelectorAll("tc-tab-overload")];
    const ids = (el: Element) => [...el.querySelectorAll("[id]")].map((n) => n.id);
    expect(ids(a)).toHaveLength(4);
    expect(ids(a).filter((id) => ids(b).includes(id))).toEqual([]);
    for (const el of [a, b]) {
      const refs = [...el.querySelectorAll("[fill^='url('], [filter^='url('], [stroke^='url(']")].flatMap((n) =>
        ["fill", "filter", "stroke"].map((attr) => n.getAttribute(attr)?.match(/^url\(#(.+)\)$/)?.[1]).filter(Boolean),
      );
      expect(refs.length).toBeGreaterThan(0);
      for (const ref of refs) expect(el.querySelector(`[id="${ref}"]`), ref).toBeTruthy();
    }
  });

  test("hovering a window behind moves the highlight onto it", async () => {
    const el = await fixture<TcTabOverload>(html`<tc-tab-overload style="width: 360px"></tc-tab-overload>`);
    const opacity = (sel: string) => getComputedStyle(el.querySelector(sel)!).opacity;
    expect(opacity(".ui-to-front-3")).toBe("1");
    // 1 unit of the viewBox is 1px here; (70, 148) is on the first window only
    await userEvent.hover(el.querySelector(".ui-to-tab-1")!, { position: { x: 40, y: 80 } });
    await expect.poll(() => opacity(".ui-to-front-1"), { timeout: 2000 }).toBe("1");
    await expect.poll(() => opacity(".ui-to-front-3"), { timeout: 2000 }).toBe("0");
    await expect.poll(() => opacity(".ui-to-content-3"), { timeout: 2000 }).toBe("0.2");
    await parkPointer();
  });

  test("off screen the shimmer holds (data-paused), and runs on when it's back", async () => {
    const el = await fixture<TcTabOverload>(html`<tc-tab-overload style="position: absolute; top: 5000px; width: 200px"></tc-tab-overload>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-to-bar")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("dark follows color-scheme alone (no theme-scoped rules below the root); the shimmer is finite; reduced motion stills it", () => {
    const css = TcTabOverload.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    expect(css).not.toMatch(/\binfinite\b/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.ui-to-bar \{ animation: none; \}/);
  });

  test("dark theme: the frames take their dark colours from light-dark()", async () => {
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-tab-overload></tc-tab-overload></div>`);
    const page = wrap.querySelector(".ui-to-page")!;
    expect(getComputedStyle(page).fill).toBe("rgb(35, 35, 38)");
  });

  test("React wrapper: className is merged, DOM props reach the host, and the ref gets the host", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcTabOverload>();
    await act(async () =>
      root.render(React.createElement(TabOverload, { className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", ref } as React.ComponentProps<typeof TabOverload>)),
    );
    await settle();
    const el = host.querySelector<TcTabOverload>("tc-tab-overload")!;
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.ui).toBe("to");
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
  });

  test("axe: no violations, decorative and labelled", async () => {
    const wrap = await fixture(html`<div>
      <tc-tab-overload></tc-tab-overload>
      <tc-tab-overload label="Three overlapping browser windows"></tc-tab-overload>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
