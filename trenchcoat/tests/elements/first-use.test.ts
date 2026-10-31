/*
 * <tc-first-use> in real browsers: its words and name, decorative with neither, pausing off screen, finite loops, dark colours,
 * the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcFirstUse } from "../../src/elements/first-use";
import { FirstUse } from "../../src/elements/react/first-use";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-first-use", () => {
  test("says what's happened, in visible words and in its name", async () => {
    const el = await fixture<TcFirstUse>(html`<tc-first-use></tc-first-use>`);
    expect(el.dataset.ui).toBe("fus");
    expect(el.querySelector(".ui-fus-caption")!.textContent).toBe("Nothing here yet");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Nothing here yet");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
  });

  test("label says more, and with no words at all it's decorative", async () => {
    const el = await fixture<TcFirstUse>(html`<tc-first-use label="More detail"></tc-first-use>`);
    expect(el.getAttribute("aria-label")).toBe("More detail");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-fus-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the loop holds, and runs on when it's back", async () => {
    const el = await fixture<TcFirstUse>(html`<tc-first-use style="position: absolute; top: 5000px; width: 200px"></tc-first-use>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-fus-glow")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the loop is finite, and dark follows color-scheme", async () => {
    expect(TcFirstUse.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-first-use></tc-first-use></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-fus-frame")!).fill).toBe("rgb(35, 35, 38)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcFirstUse>();
    await act(async () => root.render(React.createElement(FirstUse, { className: "mine", caption: "Words", ref })));
    await settle();
    const el = host.querySelector<TcFirstUse>("tc-first-use")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-first-use></tc-first-use></div>`);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
});
