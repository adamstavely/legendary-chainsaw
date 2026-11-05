/*
 * <tc-upload-failed> in real browsers: its words and name, decorative with neither, pausing off screen, finite loops, dark colours,
 * the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcUploadFailed } from "../../src/elements/upload-failed";
import { UploadFailed } from "../../src/elements/react/upload-failed";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-upload-failed", () => {
  test("says what's happened, in visible words and in its name", async () => {
    const el = await fixture<TcUploadFailed>(html`<tc-upload-failed></tc-upload-failed>`);
    expect(el.dataset.ui).toBe("upf");
    expect(el.querySelector(".ui-upf-caption")!.textContent).toBe("Upload failed");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Upload failed");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
  });

  test("label says more, and with no words at all it's decorative", async () => {
    const el = await fixture<TcUploadFailed>(html`<tc-upload-failed label="More detail"></tc-upload-failed>`);
    expect(el.getAttribute("aria-label")).toBe("More detail");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-upf-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the loop holds, and runs on when it's back", async () => {
    const el = await fixture<TcUploadFailed>(html`<tc-upload-failed style="position: absolute; top: 5000px; width: 200px"></tc-upload-failed>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-upf-file")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the loop is finite, and dark follows color-scheme", async () => {
    expect(TcUploadFailed.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-upload-failed></tc-upload-failed></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-upf-tile")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcUploadFailed>();
    await act(async () => root.render(React.createElement(UploadFailed, { className: "mine", caption: "Words", ref })));
    await settle();
    const el = host.querySelector<TcUploadFailed>("tc-upload-failed")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-upload-failed></tc-upload-failed></div>`);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
});
