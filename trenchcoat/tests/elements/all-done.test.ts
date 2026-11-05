/*
 * <tc-all-done> in real browsers: its words and name, decorative with neither, pausing off screen, finite loops, dark colours,
 * the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcAllDone } from "../../src/elements/all-done";
import { AllDone } from "../../src/elements/react/all-done";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-all-done", () => {
  test("says what's happened, in visible words and in its name", async () => {
    const el = await fixture<TcAllDone>(html`<tc-all-done></tc-all-done>`);
    expect(el.dataset.ui).toBe("ald");
    expect(el.querySelector(".ui-ald-caption")!.textContent).toBe("You're all caught up");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("You're all caught up");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
  });

  test("label says more, and with no words at all it's decorative", async () => {
    const el = await fixture<TcAllDone>(html`<tc-all-done label="More detail"></tc-all-done>`);
    expect(el.getAttribute("aria-label")).toBe("More detail");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-ald-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the loop holds, and runs on when it's back", async () => {
    const el = await fixture<TcAllDone>(html`<tc-all-done style="position: absolute; top: 5000px; width: 200px"></tc-all-done>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-ald-mark")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the loop is finite, and dark follows color-scheme", async () => {
    expect(TcAllDone.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-all-done></tc-all-done></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-ald-tray")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcAllDone>();
    await act(async () => root.render(React.createElement(AllDone, { className: "mine", caption: "Words", ref })));
    await settle();
    const el = host.querySelector<TcAllDone>("tc-all-done")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-all-done></tc-all-done></div>`);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
});
