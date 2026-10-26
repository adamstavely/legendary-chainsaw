/*
 * <tc-tilt-card> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/tilt-card";
import type { TcTiltCard } from "../../src/elements/tilt-card";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const move = (el: Element, x: number, y: number, pointerType = "mouse") =>
  el.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, pointerType, bubbles: true }));
const card = (perspective = "") =>
  fixture<TcTiltCard>(html`<tc-tilt-card class="mine" data-consumer="yes" perspective=${perspective || 900}><div style="width: 200px; height: 100px">Pro</div></tc-tilt-card>`);

describe("tc-tilt-card", () => {
  test("the host is the untransformed root; classes and DOM attributes stay on it", async () => {
    const el = await card();
    expect(el.dataset.ui).toBe("tlt");
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(getComputedStyle(el).transform).toBe("none");
    expect(el.style.getPropertyValue("--tc-tilt-card-perspective")).toBe("900px");
    expect(el.querySelector(".ui-tlt-glare")!.getAttribute("aria-hidden")).toBe("true");
    // The content stays where it was put, and every layer shares its box
    const content = el.querySelector(":scope > div")!;
    const shadow = el.querySelector(".ui-tlt-card")!;
    expect(shadow.getBoundingClientRect().width).toBe(content.getBoundingClientRect().width);
    expect(shadow.getBoundingClientRect().height).toBe(content.getBoundingClientRect().height);
  });

  test("the pointer tilts every layer the same; leaving springs it back", async () => {
    const el = await card();
    const box = el.getBoundingClientRect();
    move(el, box.left, box.top);
    expect(el.hasAttribute("data-active")).toBe(true);
    await frame();
    await frame();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      expect(el.style.getPropertyValue("--tc-tilt-card-rx")).toBe("10.00deg");
      expect(el.style.getPropertyValue("--tc-tilt-card-ry")).toBe("-10.00deg");
      expect(el.style.getPropertyValue("--tc-tilt-card-gx")).toBe("0.0%");
    }
    // Compare the layers at rest of their transitions
    const content = el.querySelector<HTMLElement>(":scope > div")!;
    const shadow = el.querySelector<HTMLElement>(".ui-tlt-card")!;
    content.style.transition = shadow.style.transition = "none";
    expect(getComputedStyle(content).transform).toBe(getComputedStyle(shadow).transform);
    el.dispatchEvent(new PointerEvent("pointerleave"));
    expect(el.hasAttribute("data-active")).toBe(false);
    expect(el.style.getPropertyValue("--tc-tilt-card-rx")).toBe("0deg");
  });

  test("touch pointers don't tilt", async () => {
    const el = await card();
    move(el, 1, 1, "touch");
    expect(el.hasAttribute("data-active")).toBe(false);
  });

  test("the caller's pointer listeners run alongside the tilt", async () => {
    const el = await card();
    const onMove = vi.fn();
    const onLeave = vi.fn();
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    move(el, 10, 10);
    expect(onMove).toHaveBeenCalledTimes(1);
    el.dispatchEvent(new PointerEvent("pointerleave"));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  test("reduced motion turned on mid-tilt drops the tilt and the pending frame", async () => {
    let reduce = false;
    const listeners = new Set<() => void>();
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      get matches() {
        return reduce && query.includes("reduce");
      },
      media: query,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    })) as unknown as typeof window.matchMedia;
    try {
      const raf = vi.spyOn(window, "cancelAnimationFrame");
      const el = await card();
      move(el, 0, 0);
      await frame();
      move(el, 5, 5);
      reduce = true;
      listeners.forEach((fn) => fn());
      expect(raf).toHaveBeenCalled();
      await frame();
      expect(el.style.getPropertyValue("--tc-tilt-card-rx")).toBe("0deg");
      expect(el.style.getPropertyValue("--tc-tilt-card-ry")).toBe("0deg");
      // Still: moves only lift the shadow
      move(el, 0, 0);
      await frame();
      expect(el.style.getPropertyValue("--tc-tilt-card-rx")).toBe("0deg");
      expect(el.hasAttribute("data-active")).toBe(true);
      el.remove();
      expect(listeners.size).toBe(0);
    } finally {
      window.matchMedia = original;
    }
  });

  test("glare can be turned off; the attribute glare=\"false\" does it too", async () => {
    const el = await fixture<TcTiltCard>(html`<tc-tilt-card glare="false"><div>Pro</div></tc-tilt-card>`);
    expect(el.glare).toBe(false);
    expect(el.querySelector(".ui-tlt-glare")).toBeNull();
    el.glare = true;
    await settle();
    expect(el.querySelector(".ui-tlt-glare")).not.toBeNull();
  });

  test("the shadow layer doesn't take clicks meant for the content", async () => {
    const el = await fixture<TcTiltCard>(html`<tc-tilt-card><button style="width: 200px; height: 80px">Buy</button></tc-tilt-card>`);
    const b = el.querySelector("button")!.getBoundingClientRect();
    expect(document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)).toBe(el.querySelector("button"));
  });

  test("axe: no violations", async () => {
    const wrap = await fixture(html`<div><tc-tilt-card><div style="padding: 24px">Pro <a href="#x">Upgrade</a></div></tc-tilt-card></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
