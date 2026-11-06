/*
 * <tc-soup-cans> in real browsers: decorative by default, named by its words, pausing off screen, finite motion, dark
 * colours, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcSoupCans } from "../../src/elements/soup-cans";
import { SoupCans } from "../../src/elements/react/soup-cans";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-soup-cans", () => {
  test("draws three cans and is decorative with no words", async () => {
    const el = await fixture<TcSoupCans>(html`<tc-soup-cans></tc-soup-cans>`);
    expect(el.dataset.ui).toBe("sop");
    expect(el.querySelectorAll(".ui-sop-can")).toHaveLength(3);
    expect(el.querySelector(".ui-sop-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
  });

  test("a caption shows and names it; a label names it alone", async () => {
    const el = await fixture<TcSoupCans>(html`<tc-soup-cans caption="Nothing sorted yet"></tc-soup-cans>`);
    expect(el.querySelector(".ui-sop-caption")!.textContent).toBe("Nothing sorted yet");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Nothing sorted yet");
    el.caption = "";
    el.label = "Unlabeled cans";
    await settle();
    expect(el.querySelector(".ui-sop-caption")).toBeNull();
    expect(el.getAttribute("aria-label")).toBe("Unlabeled cans");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
  });

  test("off screen the motion holds, and runs on when it's back", async () => {
    const el = await fixture<TcSoupCans>(html`<tc-soup-cans style="position: absolute; top: 5000px; width: 200px"></tc-soup-cans>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-sop-front")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the motion is finite, and dark follows color-scheme", async () => {
    expect(TcSoupCans.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-soup-cans></tc-soup-cans></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-sop-body")!).fill).toBe("rgb(47, 56, 70)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcSoupCans>();
    await act(async () => root.render(React.createElement(SoupCans, { className: "mine", caption: "Words", ref })));
    await settle();
    const el = host.querySelector<TcSoupCans>("tc-soup-cans")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-soup-cans caption="Nothing sorted yet"></tc-soup-cans></div>`);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
});
