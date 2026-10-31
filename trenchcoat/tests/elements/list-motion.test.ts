/*
 * <tc-list-motion> and its controller in real browsers: rows animate from where they were, new rows fade in, removed rows
 * leave as an inert copy, reduced motion, the team flag editor using it, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/list-motion";
import "../../src/elements/team-flag-editor";
import type { TcListMotion } from "../../src/elements/list-motion";
import { ListMotion } from "../../src/elements/react/list-motion";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const rows = (el: Element) => [...el.children].filter((c) => !c.hasAttribute("data-list-motion-ghost")) as HTMLElement[];
const ghost = (el: Element) => el.querySelector<HTMLElement>("[data-list-motion-ghost]");
const list = () => fixture<TcListMotion>(html`<tc-list-motion duration="200"><div id="a" style="height: 20px">A</div><div id="b" style="height: 20px">B</div></tc-list-motion>`);
const nextMutation = () => new Promise((r) => setTimeout(r));

describe("tc-list-motion", () => {
  test("a moved row animates from where it was", async () => {
    const el = await list();
    expect(el.dataset.ui).toBe("lsm");
    const [a, b] = rows(el);
    el.insertBefore(b!, a!);
    await nextMutation();
    const running = b!.getAnimations();
    expect(running.length).toBe(1);
    const first = (running[0]!.effect as KeyframeEffect).getKeyframes()[0]!;
    expect(String(first.transform)).toContain("20px");
    expect(rows(el).map((r) => r.id)).toEqual(["b", "a"]);
  });

  test("a new row fades in", async () => {
    const el = await list();
    const c = document.createElement("div");
    c.textContent = "C";
    el.append(c);
    await nextMutation();
    expect(Number((c.getAnimations()[0]!.effect as KeyframeEffect).getKeyframes()[0]!.opacity)).toBe(0);
    expect(el.rowCount).toBe(3);
  });

  test("a removed row leaves as an inert copy, which then goes", async () => {
    const el = await list();
    rows(el)[0]!.remove();
    await nextMutation();
    const copy = ghost(el)!;
    expect(copy.getAttribute("aria-hidden")).toBe("true");
    expect(copy.hasAttribute("inert")).toBe(true);
    expect(copy.id).toBe("");
    expect(el.rowCount).toBe(1);
    await expect.poll(() => ghost(el), { timeout: 3000 }).toBeNull();
  });

  test('exits="false" removes a row at once', async () => {
    const el = await fixture<TcListMotion>(html`<tc-list-motion exits="false"><div>A</div><div>B</div></tc-list-motion>`);
    rows(el)[0]!.remove();
    await nextMutation();
    expect(ghost(el)).toBeNull();
  });

  test("with reduced motion, nothing animates", async () => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => (q.includes("reduced-motion") ? ({ matches: true } as MediaQueryList) : original.call(window, q)));
    const el = await list();
    const [a, b] = rows(el);
    el.insertBefore(b!, a!);
    await nextMutation();
    expect(b!.getAnimations()).toHaveLength(0);
  });

  test("the team flag editor's rows glide when moved", async () => {
    const flags = [{ id: "a", label: "A", color: "#DC2626" }, { id: "b", label: "B", color: "#2563EB" }];
    const el = await fixture(html`<tc-team-flag-editor .flags=${flags}></tc-team-flag-editor>`);
    el.querySelector<HTMLElement>('[data-flag="a"] [data-move="down"]')!.click();
    await settle();
    expect(el.querySelector('[data-flag="a"]')!.getAnimations().length + el.querySelector('[data-flag="b"]')!.getAnimations().length).toBeGreaterThan(0);
  });

  test("React: the wrapper's rows move", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = (ids: string[]) => React.createElement(ListMotion, null, ids.map((id) => React.createElement("div", { key: id, id, style: { height: 20 } }, id)));
    await act(async () => root.render(node(["a", "b"])));
    await settle();
    const el = host.querySelector<TcListMotion>("tc-list-motion")!;
    await act(async () => root.render(node(["b", "a"])));
    await nextMutation();
    expect(rows(el).map((r) => r.id)).toEqual(["b", "a"]);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations", async () => {
    const el = await list();
    const { violations } = await axe.run(el);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
