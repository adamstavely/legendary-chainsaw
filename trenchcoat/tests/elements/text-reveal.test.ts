/*
 * <tc-text-reveal> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/text-reveal";
import { TcTextReveal } from "../../src/elements/text-reveal";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const until = async (check: () => boolean, ms = 2000) => {
  const end = performance.now() + ms;
  while (!check() && performance.now() < end) await new Promise((r) => setTimeout(r, 16));
};

describe("tc-text-reveal", () => {
  test("the host is the root; DOM attributes and classes stay on it", async () => {
    const el = await fixture<TcTextReveal>(html`<tc-text-reveal class="mine" data-consumer="yes" aria-describedby="x" text="Meet your new teammate."></tc-text-reveal>`);
    expect(el.dataset.ui).toBe("trv");
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("x");
    expect(el.getAttribute("as")).toBe("p");
    expect(el.style.getPropertyValue("--tc-text-reveal-stagger")).toBe("40ms");
    expect(el.style.getPropertyValue("--tc-text-reveal-duration")).toBe("700ms");
  });

  test("screen readers get the sentence once; the moving pieces are hidden", async () => {
    const el = await fixture<TcTextReveal>(html`<tc-text-reveal text="Meet your new teammate."></tc-text-reveal>`);
    expect(el.querySelector(".ui-trv__sr")!.textContent).toBe("Meet your new teammate.");
    expect(el.querySelector(".ui-trv__p")!.closest("[aria-hidden='true']")).not.toBeNull();
    expect([...el.querySelectorAll(".ui-trv__p")].map((p) => p.textContent)).toEqual(["Meet", "your", "new", "teammate."]);
  });

  test("letter by letter: each word's letters sit in one unbreakable group, numbered in order", async () => {
    const el = await fixture<TcTextReveal>(html`<tc-text-reveal by="char" text="Hi you"></tc-text-reveal>`);
    const words = el.querySelectorAll(".ui-trv__w");
    expect(words.length).toBe(2);
    const pieces = [...el.querySelectorAll<HTMLElement>(".ui-trv__p")];
    expect(pieces.map((p) => p.style.getPropertyValue("--tc-text-reveal-i"))).toEqual(["0", "1", "2", "3", "4"]);
    expect(getComputedStyle(words[0]).whiteSpace).toBe("nowrap");
  });

  test("it reveals once it is in view", async () => {
    const el = await fixture<TcTextReveal>(html`<tc-text-reveal text="Hello there"></tc-text-reveal>`);
    await until(() => el.hasAttribute("data-shown"));
    expect(el.hasAttribute("data-shown")).toBe(true);
  });

  test("once=false hides it again when it leaves the view; once (default) keeps it", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="height: 200px; overflow: auto">
      <tc-text-reveal .once=${false} text="Again"></tc-text-reveal>
      <tc-text-reveal text="Once"></tc-text-reveal>
      <div style="height: 2000px"></div>
    </div>`);
    const [again, once] = wrap.querySelectorAll<TcTextReveal>("tc-text-reveal");
    await until(() => again.hasAttribute("data-shown") && once.hasAttribute("data-shown"));
    expect(again.hasAttribute("data-shown") && once.hasAttribute("data-shown")).toBe(true);
    wrap.scrollTop = 1500;
    await until(() => !again.hasAttribute("data-shown"));
    expect(again.hasAttribute("data-shown")).toBe(false);
    expect(once.hasAttribute("data-shown")).toBe(true);
  });

  test("the attribute once=\"false\" turns repeat on", async () => {
    const el = await fixture<TcTextReveal>(html`<tc-text-reveal once="false" text="x"></tc-text-reveal>`);
    expect(el.once).toBe(false);
  });

  test("as h1–h3 makes the host a heading of that level, with the tag's size; span is inline", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="font-size: 20px">
      <tc-text-reveal as="h2" text="Title"></tc-text-reveal>
      <tc-text-reveal as="span" text="Inline"></tc-text-reveal>
    </div>`);
    const [h2, span] = wrap.querySelectorAll<TcTextReveal>("tc-text-reveal");
    expect(h2.getAttribute("role")).toBe("heading");
    expect(h2.getAttribute("aria-level")).toBe("2");
    expect(getComputedStyle(h2).fontSize).toBe("30px");
    expect(getComputedStyle(h2).fontWeight).toBe("700");
    expect(getComputedStyle(span).display).toBe("inline");
    expect(span.hasAttribute("role")).toBe(false);
    h2.as = "p";
    await settle();
    expect(h2.hasAttribute("role")).toBe(false);
  });

  test("no theme-scoped overrides and no permanent will-change on the pieces", () => {
    const css = TcTextReveal.css;
    expect(css).not.toMatch(/\[data-theme="dark"\]\) \[data-ui="trv"\]/);
    expect(css).not.toMatch(/will-change/);
    expect(css).toMatch(/\[data-tc-theme="dark"\]\) \{ color-scheme: dark; \}/);
  });

  test("reduced motion shows the text at once (the rule is there)", () => {
    expect(TcTextReveal.css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\[data-ui="trv"\] \.ui-trv__p,/);
  });

  test("axe: no violations, once the pieces have arrived", async () => {
    const wrap = await fixture(html`<div>
      <tc-text-reveal as="h2" by="char" duration="1" stagger="0" text="Meet your new teammate."></tc-text-reveal>
      <tc-text-reveal duration="1" stagger="0" text="It reads the brief."></tc-text-reveal>
    </div>`);
    await until(() => [...wrap.querySelectorAll("tc-text-reveal")].every((e) => e.hasAttribute("data-shown")));
    await new Promise((r) => setTimeout(r, 100));
    await finish(wrap);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
