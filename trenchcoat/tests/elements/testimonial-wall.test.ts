/*
 * <tc-testimonial-wall> in real browsers: a named region with the Pause button first; quotes dealt into columns by
 * the wall's own width; only the real set is read and reachable by Tab; ratings, verified marks, initials and safe
 * avatars; the columns move, and Pause stops them for good (cancelable); the React wrapper; axe in both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/testimonial-wall";
import { dealTestimonials, testimonialColumns, type TcTestimonialWall, type Testimonial, type TestimonialPausedChange } from "../../src/elements/testimonial-wall";
import { TestimonialWall } from "../../src/elements/react/testimonial-wall";
import { cleanup, finish, fixture, parkPointer, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: Testimonial[] = Array.from({ length: 9 }, (_, i) => ({
  quote: i % 2 ? `Short quote ${i}.` : `A longer quote number ${i}, so the columns get different heights and the masonry looks natural.`,
  name: `Person ${String.fromCharCode(65 + i)} Example`,
  role: "Engineer",
  company: i % 3 ? "Northwind" : undefined,
  rating: (i % 5) + 1,
  verified: i % 2 === 0,
}));
const transforms = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-twl__track")].map((t) => t.style.transform).join("|");
const frames = (n: number) => new Promise<void>((r) => {
  let i = 0;
  const step = () => (++i >= n ? r() : requestAnimationFrame(step));
  requestAnimationFrame(step);
});
const make = (width: number) =>
  fixture<HTMLElement>(html`<div style=${`width: ${width}px`}><tc-testimonial-wall label="Customer testimonials" .items=${ITEMS} .speed=${120}></tc-testimonial-wall></div>`).then(
    (d) => d.firstElementChild as TcTestimonialWall,
  );

describe("tc-testimonial-wall", () => {
  test("columns follow the wall's width; quotes are dealt round-robin", async () => {
    expect([1200, 600, 400].map((w) => testimonialColumns(w, 3))).toEqual([3, 2, 1]);
    expect(testimonialColumns(1200, 2)).toBe(2);
    expect(dealTestimonials([1, 2, 3, 4, 5], 2)).toEqual([[1, 3, 5], [2, 4]]);
    const el = await make(1000);
    expect(el.dataset.ui).toBe("twl");
    expect(el.querySelectorAll(":scope > .ui-twl__col")).toHaveLength(3);
    (el.parentElement as HTMLElement).style.width = "600px";
    await expect.poll(() => el.querySelectorAll(":scope > .ui-twl__col").length).toBe(2);
    (el.parentElement as HTMLElement).style.width = "360px";
    await expect.poll(() => el.querySelectorAll(":scope > .ui-twl__col").length).toBe(1);
  });

  test("a named region, the Pause button first, and only the real set read and reachable", async () => {
    const el = await make(1000);
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Customer testimonials");
    const pause = el.querySelector<HTMLButtonElement>(".ui-twl__pause button")!;
    const card = el.querySelector<HTMLElement>(".ui-twl__card[tabindex='0']")!;
    expect(pause.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(el.querySelectorAll(".ui-twl__card[tabindex='0']")).toHaveLength(ITEMS.length);
    const copies = el.querySelectorAll(".ui-twl__set:not([data-real])");
    expect(copies.length).toBeGreaterThan(0);
    expect([...copies].every((s) => s.getAttribute("aria-hidden") === "true" && s.hasAttribute("inert"))).toBe(true);
  });

  test("a card: stars named by the rating, the quote, initials, a verified mark and the role · company", async () => {
    const items: Testimonial[] = [
      { quote: "Fast.", name: "Leo Brandt", role: "Staff Engineer", company: "Northwind", rating: 4.6, verified: true },
      { quote: "Good.", name: "Ana", avatar: "javascript:alert(1)", rating: 9 },
    ];
    const el = await fixture<TcTestimonialWall>(html`<tc-testimonial-wall .columns=${1} .items=${items}></tc-testimonial-wall>`);
    const [a, b] = [...el.querySelectorAll(".ui-twl__set[data-real] .ui-twl__card")];
    expect(a.querySelector(".ui-twl__stars")!.getAttribute("aria-label")).toBe("Rated 5 out of 5");
    expect(a.querySelector("blockquote")!.textContent!.trim()).toBe("Fast.");
    expect(a.querySelector(".ui-twl__avatar--initials")!.textContent).toBe("LB");
    expect(a.querySelector(".ui-twl__verified")!.getAttribute("aria-label")).toBe("Verified customer");
    expect(a.querySelector(".ui-twl__meta")!.textContent).toBe("Staff Engineer · Northwind");
    expect(b.querySelector(".ui-twl__stars")!.getAttribute("aria-label")).toBe("Rated 5 out of 5");
    expect(b.querySelector("img")).toBeNull();
  });

  test("the columns move; Pause stops them for good; Play starts them; prevented, nothing changes", async () => {
    await parkPointer();
    const el = await make(1000);
    const changes: TestimonialPausedChange[] = [];
    el.addEventListener("tc-paused-change", (e) => changes.push((e as CustomEvent<TestimonialPausedChange>).detail));
    await frames(4);
    const a = transforms(el);
    await expect.poll(() => transforms(el) !== a).toBe(true);
    const button = el.querySelector<HTMLButtonElement>(".ui-twl__pause button")!;
    button.click();
    await settle();
    expect(changes).toEqual([{ paused: true }]);
    await expect.poll(async () => {
      const t = transforms(el);
      await frames(3);
      return t === transforms(el);
    }, { timeout: 6000 }).toBe(true);
    button.click();
    await settle();
    const still = transforms(el);
    await expect.poll(() => transforms(el) !== still).toBe(true);
    el.addEventListener("tc-paused-change", (e) => e.preventDefault());
    button.click();
    await settle();
    expect(el.paused).toBe(false);
  });

  test("React: paused starts from defaultPaused and is controllable", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const reports: boolean[] = [];
    await act(async () => root.render(React.createElement(TestimonialWall, { items: ITEMS, defaultPaused: true, onPausedChange: (p) => void reports.push(p) })));
    await settle();
    const el = host.querySelector("tc-testimonial-wall")!;
    expect(el.paused).toBe(true);
    expect(el.querySelector(".ui-twl__pause button")!.textContent).toContain("Play testimonials");
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-twl__pause button")!.click());
    await settle();
    expect(reports).toEqual([false]);
    expect(el.paused).toBe(false);
    await act(async () => root.render(React.createElement(TestimonialWall, { items: ITEMS, paused: true, onPausedChange: (p) => void reports.push(p) })));
    await settle();
    const el2 = host.querySelector("tc-testimonial-wall")!;
    await act(async () => el2.querySelector<HTMLButtonElement>(".ui-twl__pause button")!.click());
    await settle();
    expect(reports).toEqual([false, false]);
    expect(el2.paused).toBe(true);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="width: 900px; padding: 16px; background: var(--tc-surface-base)">
        <tc-testimonial-wall label="Customer testimonials" paused .items=${ITEMS}></tc-testimonial-wall>
      </div>`);
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
