/*
 * <tc-person-hovercard> in real browsers: the trigger (a link inside, or its own over text), opening on focus, hover
 * and tap, the card's contents and safe links, Escape, the actions, looking people up (resolve, the event, caching,
 * Retry), the time-zone helpers, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/person-hovercard";
import { personZoneDifference, personZoneOffset, type HovercardLookupDetail, type HovercardPerson, type TcPersonHovercard } from "../../src/elements/person-hovercard";
import { PersonHovercard } from "../../src/elements/react/person-hovercard";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 9, 28, 15, 12);
const MIRA: HovercardPerson = {
  id: "mira",
  name: "Mira Lindqvist",
  pronouns: "she/her",
  title: "Head of Operations",
  team: "Operations",
  email: "mira@northfield.example",
  location: "Stockholm",
  timezone: "UTC",
  status: { state: "busy", text: "In a review until 4" },
  manager: { name: "Ines Okafor" },
  links: [
    { label: "Team page", href: "https://northfield.example.org/teams/ops" },
    { label: "Bad", href: "javascript:alert(1)" },
  ],
};
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const card = () => document.querySelector<HTMLElement>(".ui-phc__pop");
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-person-hovercard", () => {
  test("time zones: a zone's offset, and how far it is from the viewer's", () => {
    expect(personZoneOffset("UTC", NOW)).toBe(0);
    expect(personZoneOffset("Asia/Kolkata", NOW)).toBe(330);
    expect(personZoneOffset("Not/AZone", NOW)).toBeNull();
    const mine = -new Date(NOW).getTimezoneOffset();
    const words = (diff: number) => {
      if (!diff) return "same time as you";
      const h = Math.abs(diff) / 60;
      return `${Number.isInteger(h) ? h : h % 1 === 0.5 ? `${Math.floor(h)}½` : h} h ${diff > 0 ? "ahead" : "behind"}`;
    };
    expect(personZoneDifference("Asia/Kolkata", NOW)).toBe(words(330 - mine));
    expect(personZoneDifference("UTC", NOW)).toBe(words(-mine));
    // Half an hour apart is "½ h", not "0½ h"
    const spy = vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(-300);
    try {
      expect(personZoneDifference("Asia/Kolkata", NOW)).toBe("½ h ahead");
    } finally {
      spy.mockRestore();
    }
  });

  test("a link inside is the trigger; focus opens the card beside it, named by the person, with all of them", async () => {
    const el = await fixture<TcPersonHovercard>(html`<p>Ask <tc-person-hovercard .person=${MIRA} .now=${NOW}><a href="#mira">Mira Lindqvist</a></tc-person-hovercard>.</p>`);
    const host = el.querySelector("tc-person-hovercard")!;
    const link = host.querySelector("a")!;
    expect(host.dataset.ui).toBe("phc");
    expect(host.querySelector(".ui-phc__hit")).toBeNull();
    expect(link.getAttribute("aria-haspopup")).toBe("dialog");
    expect(link.getAttribute("aria-expanded")).toBe("false");
    link.focus();
    await settle();
    const c = card()!;
    expect(c.getAttribute("role")).toBe("dialog");
    expect(c.getAttribute("aria-labelledby")).toBe(c.querySelector(".ui-phc__name")!.id);
    expect(link.getAttribute("aria-expanded")).toBe("true");
    expect(text(c.querySelector(".ui-phc__name"))).toBe("Mira Lindqvist (she/her)");
    expect(text(c.querySelector(".ui-phc__title"))).toBe("Head of Operations · Operations");
    expect(text(c.querySelector(".ui-phc__status"))).toBe("Busy – In a review until 4");
    expect(text(c)).toContain("3:12 PM local");
    expect(text(c)).toContain("Reports to Ines Okafor");
    expect(c.querySelector<HTMLAnchorElement>('a[href^="mailto:"]')!.href).toBe("mailto:mira@northfield.example");
    // A javascript: link from the data never becomes an href
    expect([...c.querySelectorAll(".ui-phc__link")].map((a) => [text(a), a.getAttribute("href")])).toEqual([["Team page", "https://northfield.example.org/teams/ops"]]);
  });

  test("plain text gets its own trigger, named by the text; a click pins it open and a second closes it", async () => {
    const host = await fixture<TcPersonHovercard>(html`<tc-person-hovercard .person=${MIRA} .now=${NOW}>Mira Lindqvist</tc-person-hovercard>`);
    const hit = host.querySelector<HTMLButtonElement>(".ui-phc__hit")!;
    expect(hit.getAttribute("aria-label")).toBe("Mira Lindqvist");
    expect(hit.getAttribute("aria-haspopup")).toBe("dialog");
    hit.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await settle();
    expect(card()).not.toBeNull();
    hit.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await settle();
    expect(card()).toBeNull();
    // Enter (a click with detail 0) opens it and moves focus in
    hit.focus();
    await settle();
    hit.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 }));
    await settle();
    await expect.poll(() => card()?.contains(document.activeElement)).toBe(true);
  });

  test("hover opens after the delay; Escape closes and focus goes back to the name", async () => {
    const host = await fixture<TcPersonHovercard>(html`<tc-person-hovercard hover-delay="40" .person=${MIRA} .now=${NOW}><a href="#m">Mira</a></tc-person-hovercard>`);
    const link = host.querySelector("a")!;
    link.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    expect(card()).toBeNull();
    await expect.poll(() => card()).not.toBeNull();
    link.focus();
    await settle();
    card()!.querySelector<HTMLButtonElement>("button")!.focus();
    key(card()!.querySelector("button")!, "Escape");
    await settle();
    await expect.poll(() => card()).toBeNull();
    expect(document.activeElement).toBe(link);
  });

  test("touch: the first tap on a link opens the card instead of following it", async () => {
    const host = await fixture<TcPersonHovercard>(html`<tc-person-hovercard .person=${MIRA}><a href="#m">Mira</a></tc-person-hovercard>`);
    const link = host.querySelector("a")!;
    link.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch", bubbles: true }));
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 });
    link.dispatchEvent(click);
    await settle();
    expect(click.defaultPrevented).toBe(true);
    expect(card()).not.toBeNull();
    // A second tap follows the link
    link.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch", bubbles: true }));
    const again = new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 });
    link.dispatchEvent(again);
    expect(again.defaultPrevented).toBe(false);
  });

  test("touch, as a phone does it: the tap focuses the link (opening the card) before the click – which still doesn't follow it", async () => {
    const host = await fixture<TcPersonHovercard>(html`<tc-person-hovercard .person=${MIRA}><a href="#m">Mira</a></tc-person-hovercard>`);
    const link = host.querySelector("a")!;
    link.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch", bubbles: true }));
    link.focus();
    await settle();
    expect(card()).not.toBeNull();
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  test("open on a new person-id, or after the cache is cleared: it asks, rather than loading for good", async () => {
    const calls: string[] = [];
    const resolve = (id: string) => {
      calls.push(id);
      return Promise.resolve(id === "mira" ? MIRA : { id, name: "Yusuf Kaya" });
    };
    const host = await fixture<TcPersonHovercard>(html`<tc-person-hovercard person-id="mira" .resolve=${resolve}><a href="#m">Mira</a></tc-person-hovercard>`);
    host.openCard();
    await expect.poll(() => text(card()?.querySelector(".ui-phc__name"))).toBe("Mira Lindqvist (she/her)");
    host.personId = "yusuf";
    await expect.poll(() => text(card()?.querySelector(".ui-phc__name"))).toBe("Yusuf Kaya");
    host.clearCache();
    await expect.poll(() => calls).toEqual(["mira", "yusuf", "yusuf"]);
    await expect.poll(() => card()?.getAttribute("aria-busy") ?? null).not.toBe("true");
  });

  test("Message fires tc-action, View profile tc-open; actions can be limited", async () => {
    const host = await fixture<TcPersonHovercard>(html`<tc-person-hovercard .person=${MIRA}><button>Mira</button></tc-person-hovercard>`);
    const got: string[] = [];
    host.addEventListener("tc-action", (e) => got.push(`action:${(e as CustomEvent).detail.id}:${(e as CustomEvent).detail.person.id}`));
    host.addEventListener("tc-open", (e) => got.push(`open:${(e as CustomEvent).detail.person.id}`));
    host.openCard();
    await settle();
    const buttons = [...card()!.querySelectorAll<HTMLButtonElement>(".ui-phc__btn")].filter((b) => b.tagName === "BUTTON");
    buttons.find((b) => text(b) === "Message")!.click();
    buttons.find((b) => text(b) === "View profile")!.click();
    expect(got).toEqual(["action:message:mira", "open:mira"]);
    host.actions = ["email"];
    await settle();
    expect([...card()!.querySelectorAll(".ui-phc__btn")].map(text)).toEqual(["Email"]);
  });

  test("lookup: resolve once per id (cached), the event's answer first; prevented without one, no details", async () => {
    const calls: string[] = [];
    let release: (p: HovercardPerson) => void = () => {};
    const resolve = (id: string) => {
      calls.push(id);
      return new Promise<HovercardPerson>((r) => (release = r));
    };
    const host = await fixture<TcPersonHovercard>(html`<tc-person-hovercard person-id="mira" .resolve=${resolve}><a href="#m">Mira</a></tc-person-hovercard>`);
    host.openCard();
    await settle();
    expect(card()!.getAttribute("aria-busy")).toBe("true");
    release(MIRA);
    await expect.poll(() => text(card()?.querySelector(".ui-phc__name"))).toBe("Mira Lindqvist (she/her)");
    host.closeCard();
    host.openCard();
    await settle();
    expect(calls).toEqual(["mira"]);
    host.closeCard();
    // The event answers first; prevented without an answer, there are no details
    const other = await fixture<TcPersonHovercard>(html`<tc-person-hovercard person-id="x" .resolve=${resolve}><a href="#x">X</a></tc-person-hovercard>`);
    other.addEventListener("tc-person-lookup", (e) => e.preventDefault(), { once: true });
    other.openCard();
    await expect.poll(() => text(other.querySelector(".ui-phc__msg"))).toBe("No profile for this person");
    other.closeCard();
    const third = await fixture<TcPersonHovercard>(html`<tc-person-hovercard person-id="y"><a href="#y">Y</a></tc-person-hovercard>`);
    third.addEventListener("tc-person-lookup", (e) => (e as CustomEvent<HovercardLookupDetail>).detail.respondWith({ id: "y", name: "Yusuf Kaya" }));
    third.openCard();
    await expect.poll(() => text(third.querySelector(".ui-phc__name"))).toBe("Yusuf Kaya");
    expect(calls).toEqual(["mira"]);
  });

  test("a failed lookup offers Retry, which asks again", async () => {
    let fail = true;
    const resolve = () => (fail ? Promise.reject(new Error("down")) : Promise.resolve(MIRA));
    const host = await fixture<TcPersonHovercard>(html`<tc-person-hovercard person-id="mira" .resolve=${resolve}><a href="#m">Mira</a></tc-person-hovercard>`);
    host.openCard();
    await expect.poll(() => text(card()?.querySelector(".ui-phc__msg"))).toBe("Couldn't load the profile.");
    fail = false;
    card()!.querySelector<HTMLButtonElement>(".ui-phc__btn")!.click();
    await expect.poll(() => text(card()?.querySelector(".ui-phc__name"))).toBe("Mira Lindqvist (she/her)");
  });

  test("leaving the page with the card open closes it cleanly", async () => {
    const host = await fixture<TcPersonHovercard>(html`<tc-person-hovercard .person=${MIRA}><a href="#m">Mira</a></tc-person-hovercard>`);
    host.openCard();
    await settle();
    host.remove();
    await settle();
    expect(document.querySelector(".ui-phc__pop:popover-open")).toBeNull();
  });

  test("React wrapper: children are the trigger; Message and View profile reach their callbacks", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const got: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(PersonHovercard, { person: MIRA, onMessage: (p) => void got.push(`m:${p.id}`), onViewProfile: (p) => void got.push(`v:${p.id}`) }, React.createElement("a", { href: "#m" }, "Mira")),
      ),
    );
    await settle();
    const el = host.querySelector("tc-person-hovercard")!;
    expect(el.querySelector("a")!.getAttribute("aria-haspopup")).toBe("dialog");
    el.openCard();
    await settle();
    [...card()!.querySelectorAll<HTMLButtonElement>("button.ui-phc__btn")].forEach((b) => b.click());
    expect(got).toEqual(["m:mira", "v:mira"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with the card open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); color: var(--tc-text-primary)">
        <p>Ask <tc-person-hovercard .person=${MIRA} .now=${NOW}><a href="#m" style="color: var(--tc-accent-text)">Mira Lindqvist</a></tc-person-hovercard> or
        <tc-person-hovercard look="clean" .person=${{ ...MIRA, id: "h", name: "Hana Sato", status: { state: "away" } }} .now=${NOW}>Hana Sato</tc-person-hovercard>.</p>
      </div>`);
      wrap.querySelector<TcPersonHovercard>("tc-person-hovercard")!.openCard();
      await finish(wrap);
      const result = await axe.run(document.body, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      const second = wrap.querySelectorAll<TcPersonHovercard>("tc-person-hovercard")[1];
      second.openCard();
      await finish(wrap);
      const again = await axe.run(document.body, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(again.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
