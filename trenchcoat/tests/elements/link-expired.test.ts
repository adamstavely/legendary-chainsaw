/*
 * <tc-link-expired> in real browsers: its words and name, decorative with neither, pausing off screen, finite loops, dark colours,
 * the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcLinkExpired } from "../../src/elements/link-expired";
import { LinkExpired } from "../../src/elements/react/link-expired";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-link-expired", () => {
  test("says what's happened, in visible words and in its name", async () => {
    const el = await fixture<TcLinkExpired>(html`<tc-link-expired></tc-link-expired>`);
    expect(el.dataset.ui).toBe("lex");
    expect(el.querySelector(".ui-lex-caption")!.textContent).toBe("This link has expired");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("This link has expired");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
  });

  test("label says more, and with no words at all it's decorative", async () => {
    const el = await fixture<TcLinkExpired>(html`<tc-link-expired label="More detail"></tc-link-expired>`);
    expect(el.getAttribute("aria-label")).toBe("More detail");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-lex-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the loop holds, and runs on when it's back", async () => {
    const el = await fixture<TcLinkExpired>(html`<tc-link-expired style="position: absolute; top: 5000px; width: 200px"></tc-link-expired>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-lex-hand")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the loop is finite, and dark follows color-scheme", async () => {
    expect(TcLinkExpired.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-link-expired></tc-link-expired></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-lex-tile")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcLinkExpired>();
    await act(async () => root.render(React.createElement(LinkExpired, { className: "mine", caption: "Words", ref })));
    await settle();
    const el = host.querySelector<TcLinkExpired>("tc-link-expired")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-link-expired></tc-link-expired></div>`);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
});
