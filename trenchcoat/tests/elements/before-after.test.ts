/*
 * <tc-before-after> in real browsers: the edit clipped to its side of the divider, the divider as a slider (keys,
 * pointer drag), cancelable position and mode changes, vertical, side by side, labels with no room, the React wrapper
 * and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/before-after";
import type { BeforeAfterImage, BeforeAfterPositionChange, TcBeforeAfter } from "../../src/elements/before-after";
import { BeforeAfter } from "../../src/elements/react/before-after";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const image = (fill: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="${fill}"/></svg>`)}`;
const BEFORE: BeforeAfterImage = { src: image("#e9e4d8"), alt: "The original chart" };
const AFTER: BeforeAfterImage = { src: image("#dfe7f3"), alt: "The edited chart" };

const compare = (position = 50) =>
  fixture<TcBeforeAfter>(html`<div style="width: 600px"><tc-before-after heading="Chart" .beforeImage=${BEFORE} .afterImage=${AFTER} position=${position}></tc-before-after></div>`).then(
    (w) => w.querySelector("tc-before-after")!,
  );
const handle = (el: Element) => el.querySelector<HTMLElement>('[role="slider"]')!;
const clip = (el: Element) => el.querySelector<HTMLElement>(".ui-bfa__after")!.style.clipPath;
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const pointer = (target: Element, type: string, x: number, y: number) =>
  target.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, button: 0, pointerId: 1, bubbles: true, cancelable: true }));
const imagesLoaded = (el: Element) => expect.poll(() => [...el.querySelectorAll("img")].every((i) => i.complete && i.naturalWidth > 0)).toBe(true);

describe("tc-before-after", () => {
  test("the host is the root, in both looks; Clean puts the header inside the card", async () => {
    const el = await compare();
    expect(el.dataset.ui).toBe("bfa");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(":scope > .tc-head")).not.toBeNull();
    el.look = "clean";
    await settle();
    expect(el.querySelector(":scope > .ui-bfa__card > .tc-head")).not.toBeNull();
  });

  test("both images with their alt text; the edit is clipped to its side of the divider", async () => {
    const el = await compare(40);
    const imgs = [...el.querySelectorAll("img")];
    expect(imgs.map((i) => i.alt)).toEqual(["The original chart", "The edited chart"]);
    expect(clip(el)).toBe("inset(0px 0px 0px 40%)");
    expect(el.querySelector<HTMLElement>(".ui-bfa__line")!.style.left).toBe("40%");
    expect([...el.querySelectorAll(".ui-bfa__label")].map((l) => l.textContent)).toEqual(["Before", "After"]);
  });

  test("the divider is a named slider with a value text for both sides", async () => {
    const el = await compare(42);
    const h = handle(el);
    expect(h.tabIndex).toBe(0);
    expect(h.getAttribute("aria-valuenow")).toBe("42");
    expect(h.getAttribute("aria-valuemin")).toBe("0");
    expect(h.getAttribute("aria-valuemax")).toBe("100");
    expect(h.getAttribute("aria-orientation")).toBe("horizontal");
    expect(h.getAttribute("aria-valuetext")).toBe("42% before, 58% after");
    expect(document.getElementById(h.getAttribute("aria-labelledby")!)!.textContent).toBe("Divider between before and after");
    el.beforeImage = { ...BEFORE, label: "Original" };
    el.afterImage = { ...AFTER, label: "AI edit" };
    await settle();
    expect(h.getAttribute("aria-valuetext")).toBe("42% original, 58% ai edit");
    expect([...el.querySelectorAll(".ui-bfa__label")].map((l) => l.textContent)).toEqual(["Original", "AI edit"]);
  });

  test("keys: arrows 1%, Shift 10%, Page keys 10%, Home / End; each a tc-position-change", async () => {
    const el = await compare(50);
    const seen = listen<BeforeAfterPositionChange>(el, "tc-position-change");
    const h = handle(el);
    h.focus();
    await key(h, "ArrowRight");
    expect(el.position).toBe(51);
    await key(h, "ArrowLeft", { shiftKey: true });
    expect(el.position).toBe(41);
    await key(h, "ArrowUp");
    expect(el.position).toBe(42);
    await key(h, "ArrowDown");
    expect(el.position).toBe(41);
    await key(h, "PageUp");
    expect(el.position).toBe(51);
    await key(h, "PageDown");
    expect(el.position).toBe(41);
    await key(h, "End");
    expect(el.position).toBe(100);
    await key(h, "ArrowRight");
    expect(el.position).toBe(100);
    await key(h, "Home");
    expect(el.position).toBe(0);
    expect(seen.map((s) => s.position)).toEqual([51, 41, 42, 41, 51, 41, 100, 0]);
    expect(h.getAttribute("aria-valuenow")).toBe("0");
  });

  test("preventDefault() keeps the divider where it is", async () => {
    const el = await compare(50);
    listen(el, "tc-position-change", true);
    await key(handle(el), "End");
    expect(el.position).toBe(50);
    expect(clip(el)).toBe("inset(0px 0px 0px 50%)");
  });

  test("pressing in the frame and dragging moves the divider, and focuses the handle", async () => {
    const el = await compare(50);
    await imagesLoaded(el);
    const frame = el.querySelector<HTMLElement>(".ui-bfa__frame")!;
    const r = frame.getBoundingClientRect();
    pointer(frame, "pointerdown", r.left + r.width * 0.25, r.top + 10);
    await settle();
    expect(el.position).toBeCloseTo(25, 0);
    expect(document.activeElement).toBe(handle(el));
    expect(frame.hasAttribute("data-dragging")).toBe(true);
    pointer(frame, "pointermove", r.left + r.width * 0.8, r.top + 10);
    await settle();
    expect(el.position).toBeCloseTo(80, 0);
    pointer(frame, "pointerup", r.left + r.width * 0.8, r.top + 10);
    await settle();
    expect(frame.hasAttribute("data-dragging")).toBe(false);
    pointer(frame, "pointermove", r.left + r.width * 0.1, r.top + 10);
    await settle();
    expect(el.position).toBeCloseTo(80, 0);
  });

  test("vertical: the original above, the divider moves up and down", async () => {
    const el = await compare(30);
    el.orientation = "vertical";
    await settle();
    expect(clip(el)).toBe("inset(30% 0px 0px)");
    expect(el.querySelector<HTMLElement>(".ui-bfa__line")!.style.top).toBe("30%");
    const h = handle(el);
    expect(h.getAttribute("aria-orientation")).toBe("vertical");
    await key(h, "ArrowDown");
    expect(el.position).toBe(31);
    await key(h, "ArrowUp", { shiftKey: true });
    expect(el.position).toBe(21);
    await key(h, "PageDown");
    expect(el.position).toBe(31);
  });

  test("a label is hidden when its side has no room", async () => {
    const el = await compare(5);
    const [before, after] = [...el.querySelectorAll<HTMLElement>(".ui-bfa__label")];
    expect(before.hidden).toBe(true);
    expect(after.hidden).toBe(false);
    el.position = 95;
    await settle();
    expect(before.hidden).toBe(false);
    expect(after.hidden).toBe(true);
  });

  test("Side by side: a toggle that switches to two labelled figures; prevented, it stays", async () => {
    const el = await compare();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-bfa__mode")!;
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.textContent!.trim()).toBe("Side by side");
    const seen = listen<{ mode: string }>(el, "tc-mode-change");
    toggle.click();
    await settle();
    expect(seen[0]).toEqual({ mode: "side-by-side" });
    expect(el.querySelector('[role="slider"]')).toBeNull();
    expect([...el.querySelectorAll("figure figcaption")].map((c) => c.textContent)).toEqual(["Before", "After"]);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    const stop = listen(el, "tc-mode-change", true);
    toggle.click();
    await settle();
    expect(stop).toHaveLength(1);
    expect(el.mode).toBe("side-by-side");
  });

  test("hide-mode takes the toggle away; missing images leave a placeholder", async () => {
    const el = await fixture<TcBeforeAfter>(html`<tc-before-after hide-mode></tc-before-after>`);
    expect(el.querySelector(".ui-bfa__mode")).toBeNull();
    expect(el.querySelectorAll(".ui-bfa__missing")).toHaveLength(2);
    expect(handle(el).getAttribute("aria-valuenow")).toBe("50");
  });

  test("an out-of-range position is clamped", async () => {
    const el = await compare(140);
    expect(handle(el).getAttribute("aria-valuenow")).toBe("100");
    expect(clip(el)).toBe("inset(0px 0px 0px 100%)");
  });

  test("React wrapper: title, uncontrolled position survives a parent re-render, callbacks fire", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onPositionChange = vi.fn();
    const onModeChange = vi.fn();
    const draw = (n: number) => root.render(React.createElement(BeforeAfter, { title: `Run ${n}`, beforeImage: BEFORE, afterImage: AFTER, defaultPosition: 30, onPositionChange, onModeChange, className: "consumer" }));
    await act(async () => draw(1));
    await settle();
    const el = host.querySelector("tc-before-after")!;
    expect(el.classList.contains("consumer")).toBe(true);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Run 1");
    await act(async () => key(handle(el), "ArrowRight"));
    expect(onPositionChange).toHaveBeenCalledWith(31);
    await act(async () => draw(2));
    await settle();
    expect(el.position).toBe(31);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Run 2");
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-bfa__mode")!.click());
    expect(onModeChange).toHaveBeenCalledWith("side-by-side");
    await act(async () => root.unmount());
  });

  test("React wrapper, controlled: the position stays with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onPositionChange = vi.fn();
    await act(async () => root.render(React.createElement(BeforeAfter, { beforeImage: BEFORE, afterImage: AFTER, position: 60, onPositionChange })));
    await settle();
    const el = host.querySelector("tc-before-after")!;
    await act(async () => key(handle(el), "Home"));
    await settle();
    expect(onPositionChange).toHaveBeenCalledWith(0);
    expect(el.position).toBe(60);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-before-after look=${look} heading="Chart" description="Asked: tidy it" .beforeImage=${BEFORE} .afterImage=${AFTER}></tc-before-after>
            <div style="width: 360px"><tc-before-after look=${look} mode="side-by-side" .beforeImage=${BEFORE} .afterImage=${AFTER}></tc-before-after></div>
            <tc-before-after look=${look} orientation="vertical" hide-mode .beforeImage=${BEFORE} .afterImage=${AFTER}></tc-before-after>
          </div>`,
        );
        handle(wrap.querySelector("tc-before-after")!).focus();
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
