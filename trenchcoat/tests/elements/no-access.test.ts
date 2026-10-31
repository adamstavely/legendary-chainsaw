/*
 * <tc-no-access> in real browsers: decorative or labelled, pausing when hidden or off screen, finite loops, dark colours, the
 * React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcNoAccess } from "../../src/elements/no-access";
import { NoAccess } from "../../src/elements/react/no-access";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-no-access", () => {
  test("is decorative without a label, and an image with one", async () => {
    const el = await fixture<TcNoAccess>(html`<tc-no-access></tc-no-access>`);
    expect(el.dataset.ui).toBe("nac");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
    el.label = "You don't have access";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("You don't have access");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
    el.label = "";
    await settle();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the loops hold, and run on when it's back", async () => {
    const el = await fixture<TcNoAccess>(html`<tc-no-access style="position: absolute; top: 5000px; width: 200px"></tc-no-access>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-nac-lock")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the loops are finite, and dark follows color-scheme alone", async () => {
    expect(TcNoAccess.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-no-access></tc-no-access></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-nac-body")!).fill).toBe("rgb(201, 206, 214)");
  });

  test("React wrapper: DOM props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcNoAccess>();
    await act(async () => root.render(React.createElement(NoAccess, { className: "mine", label: "You don't have access", ref })));
    await settle();
    const el = host.querySelector<TcNoAccess>("tc-no-access")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("You don't have access");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, decorative and labelled", async () => {
    const wrap = await fixture(html`<div><tc-no-access></tc-no-access><tc-no-access label="You don't have access"></tc-no-access></div>`);
    const { violations } = await axe.run(wrap);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
