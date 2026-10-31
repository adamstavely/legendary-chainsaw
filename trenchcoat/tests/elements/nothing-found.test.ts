/*
 * <tc-nothing-found> in real browsers: decorative or labelled, pausing when hidden or off screen, finite loops, dark colours, the
 * React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcNothingFound } from "../../src/elements/nothing-found";
import { NothingFound } from "../../src/elements/react/nothing-found";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-nothing-found", () => {
  test("is decorative without a label, and an image with one", async () => {
    const el = await fixture<TcNothingFound>(html`<tc-nothing-found></tc-nothing-found>`);
    expect(el.dataset.ui).toBe("nfd");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
    el.label = "Nothing found";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Nothing found");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
    el.label = "";
    await settle();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the loops hold, and run on when it's back", async () => {
    const el = await fixture<TcNothingFound>(html`<tc-nothing-found style="position: absolute; top: 5000px; width: 200px"></tc-nothing-found>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-nfd-glass")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the loops are finite, and dark follows color-scheme alone", async () => {
    expect(TcNothingFound.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-nothing-found></tc-nothing-found></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-nfd-card")!).fill).toBe("rgb(35, 35, 38)");
  });

  test("React wrapper: DOM props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcNothingFound>();
    await act(async () => root.render(React.createElement(NothingFound, { className: "mine", label: "Nothing found", ref })));
    await settle();
    const el = host.querySelector<TcNothingFound>("tc-nothing-found")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Nothing found");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, decorative and labelled", async () => {
    const wrap = await fixture(html`<div><tc-nothing-found></tc-nothing-found><tc-nothing-found label="Nothing found"></tc-nothing-found></div>`);
    const { violations } = await axe.run(wrap);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
