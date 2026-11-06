/*
 * <tc-pr-link> in real browsers: the link's text and name, compact, without a href, the card on hover and focus (its
 * pill, title, author, lines and files, and the description it gives the link), Escape, touch, relative times, the
 * React wrapper and axe in both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/pr-link";
import type { PrLinkOpenChange, TcPrLink } from "../../src/elements/pr-link";
import { PrLink } from "../../src/elements/react/pr-link";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 10, 5, 16, 0);
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: EventTarget, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, composed: true }));

async function make(extra: Partial<TcPrLink> = {}) {
  const wrap = await fixture<HTMLElement>(html`<p style="font-size: 15px">
    Landed in <tc-pr-link
      repo="halden/atlas"
      number="74"
      pr-title="Add five workflow stage illustrations"
      state="merged"
      href="https://code.example/halden/atlas/pull/74"
      author="noor"
      additions="4080"
      deletions="42"
      files="60"
      hover-delay="0"
    ></tc-pr-link>.
  </p>`);
  const el = wrap.querySelector<TcPrLink>("tc-pr-link")!;
  el.now = NOW;
  el.updatedAt = NOW - HOUR;
  el.locale = "en-US";
  Object.assign(el, extra);
  await settle();
  return { wrap, el, link: el.querySelector<HTMLElement>(".ui-prk__link")! };
}

const card = (el: TcPrLink) => el.querySelector<HTMLElement>(".ui-prk__card");

describe("tc-pr-link", () => {
  test("the link: the mark, repo#number · title, and the state in its name", async () => {
    const { el, link } = await make();
    expect(el.dataset.ui).toBe("prk");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("https://code.example/halden/atlas/pull/74");
    expect(text(link.querySelector(".ui-prk__text"))).toBe("halden/atlas#74 · Add five workflow stage illustrations");
    expect(text(link)).toBe("halden/atlas#74 · Add five workflow stage illustrations, merged");
    expect(link.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(el).display).toBe("inline");
    expect(card(el)).toBeNull();
  });

  test("compact shows just #number; no href is focusable text, not a link", async () => {
    const { el, link } = await make({ compact: true });
    expect(text(link.querySelector(".ui-prk__text"))).toBe("#74");
    el.href = "";
    await settle();
    const t = el.querySelector<HTMLElement>(".ui-prk__link")!;
    expect(t.tagName).toBe("SPAN");
    expect(t.tabIndex).toBe(0);
    el.href = "javascript:alert(1)";
    await settle();
    expect(el.querySelector(".ui-prk__link")!.tagName).toBe("SPAN");
  });

  test("focus opens the card: pill, repo, number, time, title, author, lines and files, describing the link", async () => {
    const { el, link } = await make();
    const seen: boolean[] = [];
    el.addEventListener("tc-open-change", (e) => seen.push((e as CustomEvent<PrLinkOpenChange>).detail.open));
    link.focus();
    await settle();
    const c = card(el)!;
    expect(c).not.toBeNull();
    expect(c.getAttribute("role")).toBe("tooltip");
    expect(link.getAttribute("aria-describedby")).toBe(c.id);
    expect(text(c.querySelector(".ui-prk__pill"))).toBe("Merged");
    expect(text(c.querySelector(".ui-prk__repo"))).toBe("halden/atlas");
    expect(text(c.querySelector(".ui-prk__num"))).toBe("#74");
    expect(text(c.querySelector(".ui-prk__time"))).toBe("1 hr. ago");
    expect(text(c.querySelector(".ui-prk__title"))).toBe("Add five workflow stage illustrations");
    const author = c.querySelector(".ui-prk__author")!;
    expect(author.querySelector(".ui-prk__avatar")!.getAttribute("aria-hidden")).toBe("true");
    expect(text(author.querySelector(".tc-sr-only"))).toBe("by");
    expect(author.lastChild?.textContent).toBe("noor");
    const lines = c.querySelector(".ui-prk__lines")!;
    expect(text(lines.querySelector("[aria-hidden]"))).toBe("+4,080 −42");
    expect(text(lines.querySelector(".tc-sr-only"))).toBe("4,080 lines added, 42 removed");
    expect(text(c.querySelectorAll(".ui-prk__chip")[1])).toBe("60 files");
    expect(seen).toEqual([true]);
  });

  test("Escape closes the card and focus stays on the link", async () => {
    const { el, link } = await make();
    link.focus();
    await settle();
    expect(card(el)).not.toBeNull();
    key(link, "Escape");
    await settle();
    expect(card(el)).toBeNull();
    expect(document.activeElement).toBe(link);
    expect(link.hasAttribute("aria-describedby")).toBe(false);
  });

  test("leaves out what isn't given, and says one file", async () => {
    const { el, link } = await make({ author: "", additions: undefined, deletions: undefined, files: 1, state: "draft" });
    link.focus();
    await settle();
    const c = card(el)!;
    expect(c.querySelector(".ui-prk__author")).toBeNull();
    expect(c.querySelector(".ui-prk__lines")).toBeNull();
    expect(text(c.querySelector(".ui-prk__chip"))).toBe("1 file");
    expect(text(c.querySelector(".ui-prk__pill"))).toBe("Draft");
    expect(el.getAttribute("state")).toBe("draft");
  });

  test("times: minutes, days, then a date", async () => {
    const { el, link } = await make({ updatedAt: NOW - 5 * 60_000 });
    link.focus();
    await settle();
    expect(text(card(el)!.querySelector(".ui-prk__time"))).toBe("5 min. ago");
    el.updatedAt = NOW - 3 * 24 * HOUR;
    await settle();
    expect(text(card(el)!.querySelector(".ui-prk__time"))).toBe("3 days ago");
    el.updatedAt = Date.UTC(2026, 6, 1, 12);
    await settle();
    expect(text(card(el)!.querySelector(".ui-prk__time"))).toBe("Jul 1");
  });

  test("a tap opens the card instead of following the link", async () => {
    const { el, link } = await make();
    link.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch", bubbles: true }));
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    await settle();
    expect(click.defaultPrevented).toBe(true);
    expect(card(el)).not.toBeNull();
  });

  test("labels reword it", async () => {
    const { el, link } = await make({ labels: { merged: "Fusionnée", files: "{count} fichiers" } });
    expect(text(link)).toContain(", fusionnée");
    link.focus();
    await settle();
    expect(text(card(el)!.querySelector(".ui-prk__pill"))).toBe("Fusionnée");
    expect(text(card(el)!.querySelectorAll(".ui-prk__chip")[1])).toBe("60 fichiers");
  });

  test("React wrapper: props reach the element, and the open event", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const opens: boolean[] = [];
    await act(async () =>
      root.render(
        React.createElement(PrLink, {
          repo: "halden/atlas",
          number: 12,
          prTitle: "Words",
          state: "closed",
          href: "https://code.example/pull/12",
          now: NOW,
          onTcOpenChange: (e: CustomEvent<PrLinkOpenChange>) => opens.push(e.detail.open),
        }),
      ),
    );
    await settle();
    const el = host.querySelector<TcPrLink>("tc-pr-link")!;
    expect(text(el.querySelector(".ui-prk__text"))).toBe("halden/atlas#12 · Words");
    el.querySelector<HTMLElement>(".ui-prk__link")!.focus();
    await settle();
    expect(opens).toEqual([true]);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, closed and open, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const { wrap, link } = await make();
      wrap.style.background = "Canvas";
      wrap.style.colorScheme = scheme;
      wrap.style.color = "CanvasText";
      const closed = await axe.run(wrap);
      expect(closed.violations.flatMap((v) => v.nodes.map((n) => `${scheme} ${v.id} ${n.html.slice(0, 90)} ${n.any[0]?.message ?? ""}`))).toEqual([]);
      link.focus();
      await settle();
      // Contrast is measured on the card's settled colours, not mid fade-in
      await finish(document.body);
      // The whole page, as the card sits in the top layer – without "region", which is about the test page's landmarks
      const r = await axe.run(document.body, { rules: { region: { enabled: false } } });
      expect(r.violations.flatMap((v) => v.nodes.map((n) => `${scheme} ${v.id} ${n.html.slice(0, 90)} ${n.any[0]?.message ?? ""}`))).toEqual([]);
      cleanup();
    }
  });
});
