/* <tc-banner-stack> in real browsers: the gathered pile, spreading on hover and focus, Escape, dismissing (its own
 * button, dismiss(id), a page removing it), arrivals read out, the React wrapper and axe in both themes. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/banner-stack";
import type { BannerStackDismiss, BannerStackExpandedChange, TcBannerStack } from "../../src/elements/banner-stack";
import { BannerStack } from "../../src/elements/react/banner-stack";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOTICES = [
  ["export", "Nightly export finished", "4,812 records written to the archive."],
  ["sync", "Vendor sync resumed", "The register is current again."],
  ["review", "Case 2041 is ready for review", "Two reviewers assigned."],
  ["policy", "Retention policy updated", "Interview audio is kept for 18 months, up from 12, after the March review."],
] as const;
const banner = ([id, title, detail]: readonly [string, string, string]) =>
  html`<div data-id=${id} style="display: flex; gap: 8px; padding: 12px; border-radius: 12px; background: var(--tc-surface-raised); color: var(--tc-text-primary)">
    <div><strong>${title}</strong><div>${detail}</div></div>
    <button type="button" data-dismiss>Dismiss<span class="tc-sr-only"> ${title}</span></button>
  </div>`;
const make = (limit = 3, extra = html``) =>
  fixture<TcBannerStack>(html`<div style="width: 320px"><tc-banner-stack limit=${limit} label="System notices">${NOTICES.map(banner)}${extra}</tc-banner-stack></div>`).then(
    (wrap) => wrap.querySelector("tc-banner-stack")!,
  );
const item = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-id="${id}"]`)!;
const box = (el: Element) => el.getBoundingClientRect();
const enter = (el: Element) => el.dispatchEvent(new PointerEvent("pointerenter"));
const leave = (el: Element) => el.dispatchEvent(new PointerEvent("pointerleave"));
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-banner-stack", () => {
  test("a labelled region: the newest in front, the next ones peeking a step below it, the rest out of sight", async () => {
    const el = await make();
    await finish(el);
    expect(el.dataset.ui).toBe("bst");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("System notices");
    expect(el.banners.map((b) => b.dataset.id)).toEqual(["export", "sync", "review", "policy"]);
    const [front, second, third, fourth] = el.banners.map(box);
    const host = box(el);
    expect(front!.top).toBeCloseTo(host.top, 0);
    // Each one's bottom peeks 8px (--tc-space-2) below the one in front – within a pixel, as Firefox rounds scaled boxes
    const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1.5);
    near(second!.bottom - front!.bottom, 8);
    near(third!.bottom - second!.bottom, 8);
    near(host.height, front!.height + 16);
    // Past the limit it sits with the last one shown, out of sight
    near(fourth!.bottom, third!.bottom);
    expect(getComputedStyle(item(el, "policy")).opacity).toBe("0");
    expect(item(el, "sync").hasAttribute("data-bst-behind")).toBe(true);
    expect(item(el, "export").hasAttribute("data-bst-behind")).toBe(false);
    expect(getComputedStyle(item(el, "sync"), "::after").opacity).toBe("1");
  });

  test("hover spreads them into a list and leaving gathers them, each announced with tc-expanded-change", async () => {
    const el = await make();
    const seen: boolean[] = [];
    el.addEventListener("tc-expanded-change", (e) => seen.push((e as CustomEvent<BannerStackExpandedChange>).detail.expanded));
    enter(el);
    await settle();
    await finish(el);
    expect(el.expanded).toBe(true);
    const boxes = el.banners.map(box);
    for (let i = 1; i < boxes.length; i++) expect(boxes[i]!.top - boxes[i - 1]!.bottom).toBeCloseTo(8, 0);
    expect(box(el).height).toBeCloseTo(boxes.reduce((s, b) => s + b.height, 0) + 3 * 8, 0);
    expect(getComputedStyle(item(el, "policy")).opacity).toBe("1");
    leave(el);
    await settle();
    expect(el.expanded).toBe(false);
    expect(seen).toEqual([true, false]);
  });

  test("a prevented tc-expanded-change keeps it as it was", async () => {
    const el = await make();
    el.addEventListener("tc-expanded-change", (e) => e.preventDefault());
    enter(el);
    await settle();
    expect(el.expanded).toBe(false);
  });

  test("focus spreads it; Escape gathers it and it stays gathered while focus moves within, until focus leaves", async () => {
    const el = await make();
    const outside = document.createElement("button");
    document.body.append(outside);
    item(el, "export").querySelector("button")!.focus();
    await settle();
    expect(el.expanded).toBe(true);
    key(document.activeElement!, "Escape");
    await settle();
    expect(el.expanded).toBe(false);
    item(el, "sync").querySelector("button")!.focus();
    await settle();
    expect(el.expanded).toBe(false);
    outside.focus();
    await settle();
    item(el, "sync").querySelector("button")!.focus();
    await settle();
    expect(el.expanded).toBe(true);
  });

  test("its own Dismiss button fires tc-dismiss, slides it away, closes the gap and passes focus on", async () => {
    const el = await make();
    const ids: string[] = [];
    el.addEventListener("tc-dismiss", (e) => ids.push((e as CustomEvent<BannerStackDismiss>).detail.id));
    const button = item(el, "export").querySelector("button")!;
    button.focus();
    button.click();
    await settle();
    expect(ids).toEqual(["export"]);
    expect(item(el, "export").hasAttribute("data-leaving")).toBe(true);
    expect(el.banners.map((b) => b.dataset.id)).toEqual(["sync", "review", "policy"]);
    expect(document.activeElement).toBe(item(el, "sync").querySelector("button"));
    await finish(el);
    await expect.poll(() => item(el, "export").hasAttribute("data-dismissed")).toBe(true);
    expect(getComputedStyle(item(el, "export")).display).toBe("none");
    expect(item(el, "sync").hasAttribute("data-bst-behind")).toBe(false);
  });

  test("dismiss(id) works too; a prevented tc-dismiss keeps the banner", async () => {
    const el = await make();
    el.dismiss("review");
    await settle();
    expect(el.banners.map((b) => b.dataset.id)).toEqual(["export", "sync", "policy"]);
    el.addEventListener("tc-dismiss", (e) => e.preventDefault());
    el.dismiss("sync");
    await settle();
    expect(el.banners.map((b) => b.dataset.id)).toEqual(["export", "sync", "policy"]);
    el.dismiss("nope");
  });

  test("a banner the page removes leaves as an inert copy that slides away", async () => {
    const el = await make();
    item(el, "sync").remove();
    await settle();
    const ghost = el.querySelector<HTMLElement>("[data-bst-ghost]")!;
    expect(ghost).not.toBeNull();
    expect(ghost.getAttribute("aria-hidden")).toBe("true");
    expect(ghost.hasAttribute("inert")).toBe(true);
    expect(ghost.hasAttribute("data-leaving")).toBe(true);
    expect(el.banners).toHaveLength(3);
    await finish(el);
    await expect.poll(() => el.querySelector("[data-bst-ghost]")).toBeNull();
  });

  test("a banner added later drops in and is read out; quiet reads nothing", async () => {
    const el = await make();
    await expect.poll(() => el.hasAttribute("data-ready")).toBe(true);
    const fresh = document.createElement("div");
    fresh.dataset.id = "backup";
    fresh.textContent = "Weekly backup verified";
    el.prepend(fresh);
    await settle();
    expect(fresh.hasAttribute("data-arriving")).toBe(true);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Weekly backup verified");
    expect(el.banners[0]).toBe(fresh);
    expect(fresh.hasAttribute("data-bst-behind")).toBe(false);

    el.quiet = true;
    await settle();
    expect(el.querySelector('[role="status"]')).toBeNull();
  });

  test("empty, it takes no room; nothing loops; reduced motion turns the movement off", async () => {
    const el = await fixture<TcBannerStack>(html`<tc-banner-stack></tc-banner-stack>`);
    expect(el.getBoundingClientRect().height).toBe(0);
    expect(el.getAttribute("aria-label")).toBe("Notices");
    const css = (customElements.get("tc-banner-stack") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\binfinite\b/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^@]*transition: none;[^@]*animation: none;/);
  });

  test("React wrapper: onDismiss removes it from the page's data; expanded is controllable", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    function App() {
      const [ids, setIds] = React.useState(["a", "b", "c"]);
      return React.createElement(
        BannerStack,
        { label: "Notices", onDismiss: (id: string) => setIds((x) => x.filter((i) => i !== id)) },
        ids.map((id) => React.createElement("div", { key: id, "data-id": id }, `Notice ${id}`, React.createElement("button", { type: "button", "data-dismiss": "" }, "Dismiss"))),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-banner-stack")!;
    await act(async () => item(el, "a").querySelector("button")!.click());
    await settle();
    expect(item(el, "a")).toBeNull();
    expect(el.banners.map((b) => b.dataset.id)).toEqual(["b", "c"]);

    const asked: boolean[] = [];
    await act(async () => root.render(React.createElement("div", null, React.createElement(BannerStack, { expanded: false, onExpandedChange: (x: boolean) => void asked.push(x) }, React.createElement("div", { "data-id": "x" }, "X")))));
    await settle();
    const controlled = host.querySelector("tc-banner-stack")!;
    enter(controlled);
    await settle();
    expect(asked).toEqual([true]);
    expect(controlled.expanded).toBe(false);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations, gathered and spread (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 360px; background: var(--tc-surface-base)">
        <tc-banner-stack label="System notices">${NOTICES.map(banner)}</tc-banner-stack>
      </div>`);
      await finish(wrap);
      const run = () => axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect((await run()).violations.map((v) => v.id)).toEqual([]);
      enter(wrap.querySelector("tc-banner-stack")!);
      await settle();
      await finish(wrap);
      expect((await run()).violations.map((v) => v.id)).toEqual([]);
    });
  }
});
