/*
 * <tc-retrieval-inspector> in real browsers: the numbers, the rows (score against the cutoff, freshness through
 * tc-validity-badge, used with its citation), the listbox keyboard (APG, selection follows focus), the open chunk, the
 * filter (controlled and not), the misses, 10,000 chunks windowed, the wrapper, axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/retrieval-inspector";
import type { RetrievalChunk, RetrievalMiss, RetrievalOpenSource, RetrievalSelectedChange, RetrievalShowChange, TcRetrievalInspector } from "../../src/elements/retrieval-inspector";
import { RetrievalInspector } from "../../src/elements/react/retrieval-inspector";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.parse("2026-10-24T12:00:00Z");
const DAY = 86_400_000;
const CHUNKS: RetrievalChunk[] = [
  { id: "a", source: "Returns policy", location: "§2.1", position: { index: 3, count: 24 }, score: 0.91, observed: NOW - 10 * DAY, used: true, citation: 1, url: "https://example.com/returns", text: "Damaged items can be returned within 30 days." },
  { id: "b", source: "Holiday returns", score: 0.62, observed: NOW - 700 * DAY, superseded: true, text: "Holiday purchases can be returned until January." },
  { id: "c", source: "Shipping FAQ", score: 0.31, text: "Open a trace after five days." },
];
const MISSES: RetrievalMiss[] = [{ id: "m", source: "Damaged deliveries", location: "Step 3", score: 0.47, reason: "Marked relevant in the eval set", text: "No return is needed under $100." }];
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const list = (el: Element) => el.querySelector<HTMLElement>('[role="listbox"]')!;
const options = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
const pair = (f: Element) => `${text(f.querySelector("dt"))} ${text(f.querySelector("dd"))}`;
const active = (el: Element) => document.getElementById(list(el).getAttribute("aria-activedescendant") ?? "");

describe("tc-retrieval-inspector", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is the root; the numbers; a row per chunk with its score, freshness and use`, async () => {
      const el = await fixture<TcRetrievalInspector>(html`<tc-retrieval-inspector look=${look} query="refund window" cutoff="0.5" .now=${NOW} .chunks=${CHUNKS} .misses=${MISSES}></tc-retrieval-inspector>`);
      expect(el.dataset.ui).toBe("rti");
      expect(el.dataset.look).toBe(look);
      expect(getComputedStyle(el).display).toBe("block");
      expect(text(el.querySelector(".tc-head__title"))).toBe("Retrieval");
      expect(text(el.querySelector(".ui-rti__query"))).toBe("“refund window”");
      expect([...el.querySelectorAll(".ui-rti__stat")].map(pair)).toEqual(["Retrieved 3", "Used 1", "Below cutoff 1", "Missed 1"]);
      expect(list(el).getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      const opts = options(el);
      expect(opts).toHaveLength(3);
      expect(opts.map((o) => [o.getAttribute("aria-posinset"), o.getAttribute("aria-setsize")])).toEqual([["1", "3"], ["2", "3"], ["3", "3"]]);
      // What a screen reader hears for a row
      expect(text(opts[0])).toMatch(/^Rank 1: Returns policy, §2\.1, score 0\.91\. Damaged items can be returned within 30 days\. Used as 1/);
      expect(text(opts[2])).toContain("0.31, below the cutoff");
      expect(opts[2].hasAttribute("data-below")).toBe(true);
      // Score bars on a 0–1 scale, the cutoff marked halfway
      expect(opts[0].querySelector<HTMLElement>(".ui-rti__fill")!.style.width).toBe("91%");
      expect(opts[0].querySelector<HTMLElement>(".ui-rti__cut")!.style.left).toBe("50%");
      // Freshness: the validity badge, counted to `now`; none without a date
      await settle();
      const badges = opts.map((o) => o.querySelector("tc-validity-badge"));
      expect(badges[0]!.compact).toBe(true);
      expect(badges[0]!.querySelector(".ui-vb__mark")!.getAttribute("data-band")).toBe("high");
      expect(badges[1]!.superseded).toBe(true);
      expect(badges[1]!.querySelector(".ui-vb__mark")!.getAttribute("data-band")).toBe("stale");
      expect(badges[2]).toBeNull();
      expect(text(opts[0].querySelector(".ui-rti__used"))).toBe("Used as 1");
      expect(opts[1].querySelector(".ui-rti__used")).toBeNull();
      // The misses the app reports
      const misses = el.querySelector(".ui-rti__misses")!;
      expect(text(misses.querySelector("h4"))).toBe("Missed, 1");
      expect(text(misses.querySelector(".ui-rti__miss"))).toContain("Marked relevant in the eval set");
    });

    test(`${look}: listbox keyboard – focus marks the first; arrows, Home, End and Page keys pick; Esc closes`, async () => {
      const el = await fixture<TcRetrievalInspector>(html`<tc-retrieval-inspector look=${look} .chunks=${CHUNKS}></tc-retrieval-inspector>`);
      const picks: (string | null)[] = [];
      el.addEventListener("tc-selected-change", (e) => picks.push((e as CustomEvent<RetrievalSelectedChange>).detail.selected));
      const box = list(el);
      box.focus();
      await settle();
      expect(active(el)).toBe(options(el)[0]);
      expect(el.selected).toBeNull();
      key(box, "ArrowDown");
      await settle();
      expect(picks).toEqual(["b"]);
      expect(active(el)).toBe(options(el)[1]);
      expect(options(el)[1].getAttribute("aria-selected")).toBe("true");
      expect(text(el.querySelector(".ui-rti__detail-title"))).toBe("Rank 2: Holiday returns");
      key(box, "End");
      await settle();
      key(box, "ArrowDown");
      await settle();
      key(box, "PageUp");
      await settle();
      key(box, "Home");
      await settle();
      expect(picks).toEqual(["b", "c", "a"]);
      key(box, "Escape");
      await settle();
      expect(picks).toEqual(["b", "c", "a", null]);
      expect(el.querySelector(".ui-rti__detail")).toBeNull();
      options(el)[2].click();
      await settle();
      expect(el.selected).toBe("c");
    });
  }

  test("the open chunk: score against the cutoff, use, place and freshness; the query's words marked; Open source; Close", async () => {
    const el = await fixture<TcRetrievalInspector>(html`<tc-retrieval-inspector open-handled query="How do I return damaged items?" cutoff="0.5" .now=${NOW} .chunks=${CHUNKS} selected="a"></tc-retrieval-inspector>`);
    const opened: RetrievalOpenSource[] = [];
    el.addEventListener("tc-open-source", (e) => opened.push((e as CustomEvent<RetrievalOpenSource>).detail));
    const detail = el.querySelector<HTMLElement>(".ui-rti__detail")!;
    expect(detail.getAttribute("aria-labelledby")).toBe(el.querySelector(".ui-rti__detail-title")!.id);
    expect([...detail.querySelectorAll(".ui-rti__fact")].map(pair)).toEqual(["Score 0.91 above the 0.50 cutoff", "In the answer Cited as 1", "Where §2.1 · chunk 4 of 24", expect.stringMatching(/^Freshness High source, observed 10 days ago/)]);
    expect(detail.querySelector<HTMLElement>(".ui-rti__pos > span")!.style.left).toBe(`${(3 / 24) * 100}%`);
    // "return", "damaged" and "items", and words that start with them; "How" and "do" are too short
    expect([...detail.querySelectorAll("mark")].map((m) => m.textContent)).toEqual(["Damaged", "items", "returned"]);
    const link = detail.querySelector<HTMLAnchorElement>("a.ui-rti__open")!;
    expect(link.href).toBe("https://example.com/returns");
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(opened.map((o) => o.chunk.id)).toEqual(["a"]);
    // Enter in the list opens the active chunk's source too
    list(el).focus();
    await settle();
    key(list(el), "Enter");
    expect(opened.map((o) => o.chunk.id)).toEqual(["a", "a"]);
    // Without a url, open-handled gives a button
    el.selected = "c";
    await settle();
    expect(el.querySelector("button.ui-rti__open")).toBeTruthy();
    expect(text(el.querySelector(".ui-rti__vs"))).toBe("below the 0.50 cutoff");
    el.querySelector<HTMLButtonElement>(".ui-rti__close")!.focus();
    el.querySelector<HTMLButtonElement>(".ui-rti__close")!.click();
    await settle();
    expect(el.selected).toBeNull();
    expect(document.activeElement).toBe(list(el));
    // Without open-handled, a chunk without a url has no Open source
    el.openHandled = false;
    el.selected = "c";
    await settle();
    expect(el.querySelector(".ui-rti__open")).toBeNull();
  });

  test("filter: All / Used / Not used as a radio group; the status says how many; controlled with preventDefault", async () => {
    const el = await fixture<TcRetrievalInspector>(html`<tc-retrieval-inspector .chunks=${CHUNKS}></tc-retrieval-inspector>`);
    const shows: string[] = [];
    el.addEventListener("tc-show-change", (e) => shows.push((e as CustomEvent<RetrievalShowChange>).detail.show));
    const radios = () => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    expect(radios().map((r) => text(r))).toEqual(["All, 3 chunks", "Used, 1 chunk", "Not used, 2 chunks"]);
    radios()[0].focus();
    key(radios()[0], "ArrowRight");
    await settle();
    expect(shows).toEqual(["used"]);
    expect(document.activeElement).toBe(radios()[1]);
    expect(options(el).map((o) => o.querySelector(".ui-rti__source")!.textContent)).toEqual(["Returns policy"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Used: 1 chunk");
    // The rank stays the chunk's rank in the whole list
    radios()[2].click();
    await settle();
    expect(options(el).map((o) => text(o.querySelector(".ui-rti__rank")))).toEqual(["Rank 2:", "Rank 3:"]);
    el.chunks = CHUNKS.map((c) => ({ ...c, used: false }));
    el.show = "used";
    await settle();
    expect(text(el.querySelector(".ui-rti__empty"))).toBe("No used chunks");
    el.addEventListener("tc-show-change", (e) => e.preventDefault());
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    radios()[0].click();
    await settle();
    expect(el.show).toBe("used");
    el.show = "all";
    await settle();
    options(el)[0].click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("10,000 chunks: only the rows near the scroll position render; the keyboard reaches the last one", async () => {
    const many: RetrievalChunk[] = Array.from({ length: 10_000 }, (_, i) => ({ id: `c${i}`, source: `Doc ${i + 1}`, score: 1 - i / 10_000, text: `Passage ${i + 1}`, used: i % 50 === 0 }));
    const el = await fixture<TcRetrievalInspector>(html`<tc-retrieval-inspector .chunks=${many}></tc-retrieval-inspector>`);
    expect(options(el).length).toBeLessThan(100);
    expect(options(el)[0].getAttribute("aria-setsize")).toBe("10000");
    const box = list(el);
    box.focus();
    await settle();
    key(box, "End");
    await settle();
    await settle();
    expect(el.selected).toBe("c9999");
    expect(active(el)!.getAttribute("aria-posinset")).toBe("10000");
    expect(options(el).length).toBeLessThan(100);
    expect([...el.querySelectorAll<HTMLElement>(".ui-rti__spacer")][0].offsetHeight).toBeGreaterThan(500_000);
    el.show = "used";
    await settle();
    expect(options(el)[0].getAttribute("aria-setsize")).toBe("200");
  });

  test("styles: reduced motion turns motion off; no endless loop; no theme-scoped colours", async () => {
    await fixture(html`<tc-retrieval-inspector></tc-retrieval-inspector>`);
    const css = (customElements.get("tc-retrieval-inspector") as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    expect(css).not.toMatch(/infinite/);
    expect(css).not.toMatch(/\.dark\b|data-tc-theme="dark"/);
  });

  test("React wrapper: an uncontrolled filter and pick survive a parent re-render; title, onShowChange, onSelectedChange, onOpenSource", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RetrievalInspector, {
        title: "Chunks",
        chunks: CHUNKS,
        onShowChange: (s) => seen.push(s),
        onSelectedChange: (id, chunk) => seen.push([id, chunk?.source]),
        onOpenSource: (c) => seen.push(`open ${c.id}`),
        "data-n": n,
      } as React.ComponentProps<typeof RetrievalInspector>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-retrieval-inspector")!;
    expect(el.heading).toBe("Chunks");
    expect(el.openHandled).toBe(true);
    el.querySelectorAll<HTMLButtonElement>('[role="radio"]')[2].click();
    await settle();
    options(el)[0].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.show).toBe("unused");
    expect(el.selected).toBe("b");
    el.querySelector<HTMLButtonElement>("button.ui-rti__open")!.click();
    expect(seen).toEqual(["unused", ["b", "Holiday returns"], "open b"]);
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme, with a chunk open, wide and narrow", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <div style="width: 960px"><tc-retrieval-inspector query="returns" cutoff="0.5" .now=${NOW} .chunks=${CHUNKS} .misses=${MISSES} selected="a"></tc-retrieval-inspector></div>
        <div style="width: 960px"><tc-retrieval-inspector look="clean" open-handled cutoff="0.5" .now=${NOW} .chunks=${CHUNKS} .misses=${MISSES} selected="b"></tc-retrieval-inspector></div>
        <div style="width: 320px"><tc-retrieval-inspector look="clean" query="returns" .now=${NOW} .chunks=${CHUNKS} selected="a"></tc-retrieval-inspector></div>
        <div style="width: 320px"><tc-retrieval-inspector></tc-retrieval-inspector></div>
      </div>`);
      wrap.querySelector<HTMLElement>('[role="listbox"]')!.focus();
      await settle();
      wrap.getAnimations({ subtree: true }).forEach((a) => a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
