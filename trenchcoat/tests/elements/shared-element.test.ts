/* <tc-shared-element> in real browsers: switching, the growth, focus, Escape, controlled use, reduced motion, React and axe. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/shared-element";
import type { TcSharedElement } from "../../src/elements/shared-element";
import { SharedElement } from "../../src/elements/react/shared-element";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const shared = () =>
  fixture<TcSharedElement>(html`<tc-shared-element>
    <button data-shared="summary" data-shared-toggle>Trial 12</button>
    <div data-shared="detail" style="height: 100px"><p>Report</p><button class="close" data-shared-toggle>Close</button></div>
  </tc-shared-element>`);
const part = (el: Element, name: string) => el.querySelector<HTMLElement>(`[data-shared="${name}"]`)!;

describe("tc-shared-element", () => {
  test("starts on the summary, with toggles saying so", async () => {
    const el = await shared();
    expect(el.dataset.ui).toBe("sel");
    expect(part(el, "detail").hidden).toBe(true);
    expect(part(el, "summary").hidden).toBe(false);
    expect(part(el, "summary").getAttribute("aria-expanded")).toBe("false");
  });

  test("a toggle opens it, growing from the summary, with focus in the detail", async () => {
    const el = await shared();
    const events: boolean[] = [];
    el.addEventListener("tc-open-change", (e) => events.push((e as CustomEvent).detail.open));
    part(el, "summary").click();
    await settle();
    expect(events).toEqual([true]);
    expect(el.open).toBe(true);
    expect(part(el, "summary").hidden).toBe(true);
    expect(part(el, "detail").hidden).toBe(false);
    expect(part(el, "detail").getAnimations().length).toBe(1);
    expect(document.activeElement).toBe(el.querySelector(".close"));
  });

  test("closing returns focus to the summary, by toggle or Escape", async () => {
    const el = await shared();
    part(el, "summary").click();
    await settle();
    el.querySelector<HTMLElement>(".close")!.click();
    await settle();
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(part(el, "summary"));
    part(el, "summary").click();
    await settle();
    el.querySelector(".close")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await settle();
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(part(el, "summary"));
  });

  test("a detail with no controls takes focus itself", async () => {
    const el = await fixture<TcSharedElement>(html`<tc-shared-element><button data-shared="summary" data-shared-toggle>Open</button><div data-shared="detail">Text</div></tc-shared-element>`);
    el.open = true;
    await settle();
    expect(document.activeElement).toBe(part(el, "detail"));
    expect(part(el, "detail").tabIndex).toBe(-1);
  });

  test("preventDefault keeps it as it was", async () => {
    const el = await shared();
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    part(el, "summary").click();
    await settle();
    expect(el.open).toBe(false);
    expect(part(el, "detail").hidden).toBe(true);
  });

  test("with reduced motion it simply switches, and focus still moves", async () => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => (q.includes("reduced-motion") ? ({ matches: true } as MediaQueryList) : original.call(window, q)));
    const el = await shared();
    part(el, "summary").click();
    await settle();
    expect(part(el, "detail").getAnimations()).toHaveLength(0);
    expect(document.activeElement).toBe(el.querySelector(".close"));
  });

  test("starting open doesn't animate or take focus", async () => {
    const el = await fixture<TcSharedElement>(html`<tc-shared-element open><button data-shared="summary" data-shared-toggle>Open</button><div data-shared="detail"><button>Inside</button></div></tc-shared-element>`);
    expect(part(el, "summary").hidden).toBe(true);
    expect(part(el, "detail").getAnimations()).toHaveLength(0);
    expect(el.contains(document.activeElement)).toBe(false);
  });

  test("React: controlled stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const seen: boolean[] = [];
    const kids = [React.createElement("button", { key: "s", "data-shared": "summary", "data-shared-toggle": "" }, "Open"), React.createElement("div", { key: "d", "data-shared": "detail" }, "Text")];
    await act(async () => root.render(React.createElement(SharedElement, { open: false, onOpenChange: (o: boolean) => seen.push(o) }, kids)));
    await settle();
    const el = host.querySelector<TcSharedElement>("tc-shared-element")!;
    await act(async () => part(el, "summary").click());
    await settle();
    expect(seen).toEqual([true]);
    expect(el.open).toBe(false);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, shut and open", async () => {
    const el = await shared();
    expect((await axe.run(el)).violations.map((v) => v.id)).toEqual([]);
    el.open = true;
    await settle();
    await finish(el);
    expect((await axe.run(el)).violations.map((v) => v.id)).toEqual([]);
  });
});

describe("tc-shared-element visibility", () => {
  test("only one side shows, even when the page gives both a display", async () => {
    const el = await fixture<TcSharedElement>(html`<tc-shared-element>
      <button data-shared="summary" data-shared-toggle style="display: block">Summary</button>
      <div data-shared="detail" style="display: block">Detail</div>
    </tc-shared-element>`);
    const shown = (side: string) => getComputedStyle(el.querySelector(`[data-shared="${side}"]`)!).display !== "none";
    expect([shown("summary"), shown("detail")]).toEqual([true, false]);
    el.open = true;
    await settle();
    expect([shown("summary"), shown("detail")]).toEqual([false, true]);
  });
});
