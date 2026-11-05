/*
 * <tc-preview-unavailable> in real browsers: its words and name, decorative with neither, pausing off screen, finite loops, dark colours,
 * the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcPreviewUnavailable } from "../../src/elements/preview-unavailable";
import { PreviewUnavailable } from "../../src/elements/react/preview-unavailable";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-preview-unavailable", () => {
  test("says what's happened, in visible words and in its name", async () => {
    const el = await fixture<TcPreviewUnavailable>(html`<tc-preview-unavailable></tc-preview-unavailable>`);
    expect(el.dataset.ui).toBe("pvu");
    expect(el.querySelector(".ui-pvu-caption")!.textContent).toBe("Preview not available");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Preview not available");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
  });

  test("label says more, and with no words at all it's decorative", async () => {
    const el = await fixture<TcPreviewUnavailable>(html`<tc-preview-unavailable label="More detail"></tc-preview-unavailable>`);
    expect(el.getAttribute("aria-label")).toBe("More detail");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-pvu-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the loop holds, and runs on when it's back", async () => {
    const el = await fixture<TcPreviewUnavailable>(html`<tc-preview-unavailable style="position: absolute; top: 5000px; width: 200px"></tc-preview-unavailable>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-pvu-mark")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the loop is finite, and dark follows color-scheme", async () => {
    expect(TcPreviewUnavailable.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-preview-unavailable></tc-preview-unavailable></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-pvu-page")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcPreviewUnavailable>();
    await act(async () => root.render(React.createElement(PreviewUnavailable, { className: "mine", caption: "Words", ref })));
    await settle();
    const el = host.querySelector<TcPreviewUnavailable>("tc-preview-unavailable")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-preview-unavailable></tc-preview-unavailable></div>`);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
});
