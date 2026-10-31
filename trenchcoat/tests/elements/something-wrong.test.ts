/*
 * <tc-something-wrong> in real browsers: decorative or labelled, pausing when hidden or off screen, finite loops, dark colours, the
 * React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcSomethingWrong } from "../../src/elements/something-wrong";
import { SomethingWrong } from "../../src/elements/react/something-wrong";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-something-wrong", () => {
  test("is decorative without a label, and an image with one", async () => {
    const el = await fixture<TcSomethingWrong>(html`<tc-something-wrong></tc-something-wrong>`);
    expect(el.dataset.ui).toBe("swr");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
    el.label = "Something went wrong";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Something went wrong");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
    el.label = "";
    await settle();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the loops hold, and run on when it's back", async () => {
    const el = await fixture<TcSomethingWrong>(html`<tc-something-wrong style="position: absolute; top: 5000px; width: 200px"></tc-something-wrong>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-swr-spark")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the loops are finite, and dark follows color-scheme alone", async () => {
    expect(TcSomethingWrong.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-something-wrong></tc-something-wrong></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-swr-tile")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: DOM props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcSomethingWrong>();
    await act(async () => root.render(React.createElement(SomethingWrong, { className: "mine", label: "Something went wrong", ref })));
    await settle();
    const el = host.querySelector<TcSomethingWrong>("tc-something-wrong")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Something went wrong");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, decorative and labelled", async () => {
    const wrap = await fixture(html`<div><tc-something-wrong></tc-something-wrong><tc-something-wrong label="Something went wrong"></tc-something-wrong></div>`);
    const { violations } = await axe.run(wrap);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
