/*
 * <tc-footnotes> in real browsers: numbered and bulleted notes in a region named by the heading, links with a
 * cancelable tc-navigate, unsafe links dropped, nothing at all with no notes, and axe. Kept light – one fixture per test.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/footnotes";
import type { FootnoteNote, FootnotesNavigate, TcFootnotes } from "../../src/elements/footnotes";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOTES: FootnoteNote[] = [
  { id: "count", text: "Papers are counted by the first author's centre.", href: "/method", linkLabel: "Method" },
  { id: "lag", text: "The last month is provisional.", href: "/lag" },
  { id: "bad", text: "Ask the registry team.", href: "javascript:alert(1)" },
];
const click = (el: Element, init: MouseEventInit = {}) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init }));
const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, " ").trim();

describe("tc-footnotes", () => {
  for (const look of ["standard", "clean"] as const)
    test(`${look}: a region named by the heading, the notes numbered in order, each link with its words`, async () => {
      const el = await fixture<TcFootnotes>(html`<tc-footnotes look=${look} description="About the charts" .notes=${NOTES}></tc-footnotes>`);
      expect(el.dataset.ui).toBe("fnt");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Notes");
      expect(text(el.querySelector(".tc-head__sub"))).toBe("About the charts");
      expect(el.querySelector("ol.ui-fnt__list")).toBeTruthy();
      expect([...el.querySelectorAll(".ui-fnt__text")].map((t) => t.textContent)).toEqual(NOTES.map((n) => n.text));
      expect([...el.querySelectorAll(".ui-fnt__link")].map((a) => a.textContent)).toEqual(["Method", "More"]);
    });

  test('numbered="false" gives a bulleted list', async () => {
    const el = await fixture<TcFootnotes>(html`<tc-footnotes numbered="false" .notes=${NOTES}></tc-footnotes>`);
    expect(el.numbered).toBe(false);
    expect(el.querySelector("ol")).toBeNull();
    expect(el.querySelectorAll("ul.ui-fnt__list > li")).toHaveLength(3);
    el.numbered = true;
    await settle();
    expect(el.querySelector("ol.ui-fnt__list")).toBeTruthy();
  });

  test("a link fires a cancelable tc-navigate with its href and id; prevented, it isn't followed; a modifier click is the browser's", async () => {
    const seen: FootnotesNavigate[] = [];
    const el = await fixture<TcFootnotes>(html`<tc-footnotes .notes=${NOTES} @tc-navigate=${(e: CustomEvent<FootnotesNavigate>) => (seen.push(e.detail), e.preventDefault())}></tc-footnotes>`);
    const link = el.querySelector(".ui-fnt__link")!;
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(seen).toEqual([{ href: "/method", id: "count" }]);
    link.addEventListener("click", (e) => e.preventDefault(), { once: true });
    click(link, { metaKey: true });
    expect(seen).toHaveLength(1);
  });

  test("an unsafe href is dropped: the note shows without a link", async () => {
    const el = await fixture<TcFootnotes>(html`<tc-footnotes .notes=${NOTES}></tc-footnotes>`);
    const last = el.querySelectorAll(".ui-fnt__note")[2];
    expect(text(last)).toBe("Ask the registry team.");
    expect(last.querySelector("a")).toBeNull();
    expect(el.querySelector('a[href^="javascript"]')).toBeNull();
  });

  test("no notes renders nothing – no card with only a heading – and isn't a region", async () => {
    const el = await fixture<TcFootnotes>(html`<tc-footnotes .notes=${[]}></tc-footnotes>`);
    expect(el.querySelector(".tc-head")).toBeNull();
    expect(el.querySelector(".ui-fnt__card")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getBoundingClientRect().height).toBe(0);
    el.notes = NOTES.slice(0, 1);
    await settle();
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getBoundingClientRect().height).toBeGreaterThan(0);
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="display: grid; gap: 16px; padding: 16px; background: var(--tc-surface-base)">
        <tc-footnotes description="About the charts" .notes=${NOTES}></tc-footnotes>
        <tc-footnotes look="clean" numbered="false" .notes=${NOTES}></tc-footnotes>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
});
