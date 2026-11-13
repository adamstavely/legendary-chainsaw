/*
 * <tc-downloading> in real browsers: its words and name, decorative with neither, pausing off screen, finite motion, dark
 * colours, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcDownloading } from "../../src/elements/downloading";
import { Downloading } from "../../src/elements/react/downloading";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-downloading", () => {
  test("says where it stands, in visible words and in its name", async () => {
    const el = await fixture<TcDownloading>(html`<tc-downloading></tc-downloading>`);
    expect(el.dataset.ui).toBe("dnl");
    expect(el.querySelector(".ui-dnl-caption")!.textContent).toBe("Downloading");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Downloading");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
  });

  test("label says more, and with no words at all it's decorative", async () => {
    const el = await fixture<TcDownloading>(html`<tc-downloading label="More detail"></tc-downloading>`);
    expect(el.getAttribute("aria-label")).toBe("More detail");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-dnl-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the motion holds, and runs on when it's back", async () => {
    const el = await fixture<TcDownloading>(html`<tc-downloading style="position: absolute; top: 5000px; width: 200px"></tc-downloading>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-dnl-arrow")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the motion is finite, and dark follows color-scheme", async () => {
    expect(TcDownloading.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-downloading></tc-downloading></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-dnl-page")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("the arrow drops into the tray and settles, and reduced motion keeps it still", async () => {
    const el = await fixture<TcDownloading>(html`<tc-downloading></tc-downloading>`);
    const arrow = getComputedStyle(el.querySelector(".ui-dnl-arrow")!);
    expect(arrow.animationIterationCount).toBe("3");
    expect(arrow.animationName).not.toBe("none");
    expect(TcDownloading.css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.ui-dnl-arrow, \.ui-dnl-glow \{ animation: none; \}/);
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcDownloading>();
    await act(async () => root.render(React.createElement(Downloading, { className: "mine", caption: "Words", ref })));
    await settle();
    const el = host.querySelector<TcDownloading>("tc-downloading")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-downloading></tc-downloading></div>`);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
});
