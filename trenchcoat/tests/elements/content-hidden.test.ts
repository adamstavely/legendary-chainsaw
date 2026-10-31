/*
 * <tc-content-hidden> in real browsers: its words and name, decorative with neither, pausing off screen, finite loops, dark colours,
 * the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcContentHidden } from "../../src/elements/content-hidden";
import { ContentHidden } from "../../src/elements/react/content-hidden";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-content-hidden", () => {
  test("says what's happened, in visible words and in its name", async () => {
    const el = await fixture<TcContentHidden>(html`<tc-content-hidden></tc-content-hidden>`);
    expect(el.dataset.ui).toBe("chd");
    expect(el.querySelector(".ui-chd-caption")!.textContent).toBe("Content hidden");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Content hidden");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
  });

  test("label says more, and with no words at all it's decorative", async () => {
    const el = await fixture<TcContentHidden>(html`<tc-content-hidden label="More detail"></tc-content-hidden>`);
    expect(el.getAttribute("aria-label")).toBe("More detail");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-chd-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the loop holds, and runs on when it's back", async () => {
    const el = await fixture<TcContentHidden>(html`<tc-content-hidden style="position: absolute; top: 5000px; width: 200px"></tc-content-hidden>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-chd-mark")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the loop is finite, and dark follows color-scheme", async () => {
    expect(TcContentHidden.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-content-hidden></tc-content-hidden></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-chd-card")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcContentHidden>();
    await act(async () => root.render(React.createElement(ContentHidden, { className: "mine", caption: "Words", ref })));
    await settle();
    const el = host.querySelector<TcContentHidden>("tc-content-hidden")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-content-hidden></tc-content-hidden></div>`);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
});
