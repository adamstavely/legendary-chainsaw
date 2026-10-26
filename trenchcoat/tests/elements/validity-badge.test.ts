/*
 * <tc-validity-badge> in real browsers – bands from age and profile, contested and superseded, the strip and its keys.
 */
import { html } from "lit";
import axe from "axe-core";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/validity-badge";
import { validityAge, validityBand, type TcValidityBadge, type ValidityInfo, type ValidityLocateDetail } from "../../src/elements/validity-badge";
import { ValidityBadge } from "../../src/elements/react/validity-badge";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.parse("2026-10-24T12:00:00Z");
const DAY = 86_400_000;
const ago = (days: number) => NOW - days * DAY;
const text = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

describe("validityBand()", () => {
  test("the band follows the age through the profile's boundaries", () => {
    expect(validityBand(ago(3), NOW)).toBe("high");
    expect(validityBand(ago(40), NOW)).toBe("good");
    expect(validityBand(ago(200), NOW)).toBe("aging");
    expect(validityBand(ago(400), NOW)).toBe("stale");
    expect(validityBand(ago(3), NOW, "fast")).toBe("good");
    expect(validityBand(ago(400), NOW, "slow")).toBe("good");
    expect(validityBand(ago(9000), NOW, "lasting")).toBe("high");
    expect(validityBand(ago(5), NOW, { high: 2, good: 4, aging: 6 })).toBe("aging");
  });

  test("evidence from the future counts as new; an unreadable date as stale", () => {
    expect(validityBand(NOW + 5 * DAY, NOW)).toBe("high");
    expect(validityBand(NaN, NOW)).toBe("stale");
  });

  test("ages read short and long", () => {
    expect(validityAge(0, "long", "en")).toBe("today");
    expect(validityAge(3 * DAY, "long", "en")).toBe("3 days ago");
    expect(validityAge(21 * DAY, "long", "en")).toBe("3 weeks ago");
    expect(validityAge(250 * DAY, "long", "en")).toBe("8 months ago");
    expect(validityAge(1000 * DAY, "long", "en")).toBe("2 years ago");
  });
});

describe("tc-validity-badge – badge", () => {
  test("the host is the root; the band, the age and its words", async () => {
    const el = await fixture<TcValidityBadge>(html`<tc-validity-badge lang="en" .now=${NOW} .observed=${ago(250)}></tc-validity-badge>`);
    expect(el.dataset.ui).toBe("vb");
    expect(el.dataset.look).toBe("standard");
    expect(el.currentBand).toBe("aging");
    expect(el.querySelector(".ui-vb__mark")!.getAttribute("data-band")).toBe("aging");
    expect(text(el.querySelector(".ui-vb__text"))).toBe("Aging·8 mo. ago");
    expect(text(el.querySelector(".ui-vb__sr"))).toBe("Aging evidence, observed 8 months ago");
    expect(el.getAttribute("title")).toBe("Aging evidence, observed 8 months ago");
    // Two bars of four are filled
    const bars = [...el.querySelectorAll(".ui-vb__mark line")].map((l) => l.getAttribute("opacity"));
    expect(bars).toEqual(["1", "1", "0.28", "0.28"]);
  });

  test("observed as an ISO string or a Date; the profile changes the band; now moves it", async () => {
    const el = await fixture<TcValidityBadge>(html`<tc-validity-badge observed="2026-10-20" .now=${NOW}></tc-validity-badge>`);
    expect(el.currentBand).toBe("high");
    el.profile = "fast";
    await settle();
    expect(el.currentBand).toBe("good");
    el.observed = new Date(ago(20));
    await settle();
    expect(el.currentBand).toBe("aging");
    el.now = NOW + 30 * DAY;
    await settle();
    expect(el.currentBand).toBe("stale");
    expect(el.querySelector(".ui-vb__mark")!.getAttribute("data-band")).toBe("stale");
  });

  test("without now, the age counts from when it connected", async () => {
    const el = await fixture<TcValidityBadge>(html`<tc-validity-badge lang="en" .observed=${Date.now() - 2 * DAY}></tc-validity-badge>`);
    expect(el.currentBand).toBe("high");
    expect(text(el.querySelector(".ui-vb__age"))).toBe("2 days ago");
  });

  test("band set outright; no age shown", async () => {
    const el = await fixture<TcValidityBadge>(html`<tc-validity-badge band="good"></tc-validity-badge>`);
    expect(el.currentBand).toBe("good");
    expect(el.querySelector(".ui-vb__age")).toBeNull();
    expect(text(el.querySelector(".ui-vb__sr"))).toBe("Good evidence");
  });

  test("contested and superseded: marks, words and the gray mark", async () => {
    const el = await fixture<TcValidityBadge>(html`<tc-validity-badge lang="en" .now=${NOW} .observed=${ago(10)} contested superseded></tc-validity-badge>`);
    expect(text(el.querySelector(".ui-vb__text"))).toBe("Superseded·High·10 days ago·Contested");
    expect(text(el.querySelector(".ui-vb__sr"))).toBe("High evidence, observed 10 days ago, superseded, contested");
    const mark = el.querySelector<HTMLElement>(".ui-vb__mark")!;
    expect(mark.hasAttribute("data-contested")).toBe(true);
    expect(getComputedStyle(mark).outlineStyle).toBe("dashed");
    expect(getComputedStyle(el.querySelector(".ui-vb__band")!).textDecorationLine).toBe("line-through");
  });

  test("labels are properties: bands, marks and the subject", async () => {
    const el = await fixture<TcValidityBadge>(html`<tc-validity-badge
      band="stale"
      contested
      .bandLabels=${{ stale: "Expired" }}
      contested-label="Disputed"
      subject-label="source"
    ></tc-validity-badge>`);
    expect(text(el.querySelector(".ui-vb__text"))).toBe("Expired·Disputed");
    expect(text(el.querySelector(".ui-vb__sr"))).toBe("Expired source, disputed");
  });

  test("compact: only the mark, the words for screen readers and in the tooltip", async () => {
    const el = await fixture<TcValidityBadge>(html`<tc-validity-badge compact band="high"></tc-validity-badge>`);
    expect(el.querySelector(".ui-vb__text")).toBeNull();
    expect(text(el.querySelector(".ui-vb__sr"))).toBe("High evidence");
    expect(el.getAttribute("title")).toBe("High evidence");
  });

  test("hide-age leaves the age out", async () => {
    const el = await fixture<TcValidityBadge>(html`<tc-validity-badge hide-age .now=${NOW} .observed=${ago(3)}></tc-validity-badge>`);
    expect(el.querySelector(".ui-vb__age")).toBeNull();
  });

  test("clean: the look reaches the mark", async () => {
    const el = await fixture<TcValidityBadge>(html`<tc-validity-badge look="clean" band="good"></tc-validity-badge>`);
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector<HTMLElement>(".ui-vb__mark")!.offsetWidth).toBe(18);
  });
});

const ITEMS: ValidityInfo[] = [
  { observed: ago(2), label: "Summary" },
  { observed: ago(120) },
  { observed: ago(500), contested: true },
  { observed: ago(30), superseded: true },
];

describe("tc-validity-badge – strip", () => {
  test("stacked on its own: one bar per item, named for screen readers", async () => {
    const el = await fixture<TcValidityBadge>(html`<tc-validity-badge lang="en" mode="strip" .now=${NOW} .items=${ITEMS}></tc-validity-badge>`);
    const list = el.querySelector(".ui-vb__strip")!;
    expect(list.getAttribute("role")).toBe("list");
    expect(list.getAttribute("aria-label")).toBe("Evidence freshness");
    const segs = [...el.querySelectorAll<HTMLElement>(".ui-vb__seg")];
    expect(segs.map((s) => s.dataset.band)).toEqual(["high", "aging", "stale", "good"]);
    expect(segs[0].getAttribute("aria-label")).toBe("Summary: High evidence, observed 2 days ago");
    expect(segs[2].getAttribute("aria-label")).toBe("Paragraph 3: Stale evidence, observed 16 months ago, contested");
    expect(segs.map((s) => s.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(el.hasAttribute("title")).toBe(false);
  });

  test("lines the bars up with the paragraphs of the document `for` names", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="display: flex; gap: 8px; width: 400px">
      <tc-validity-badge mode="strip" for="doc-under-test" .now=${NOW} .items=${ITEMS.slice(0, 3)}></tc-validity-badge>
      <article id="doc-under-test" style="flex: 1">
        <h2 style="margin: 0; height: 30px">Title</h2>
        <p style="margin: 0 0 10px; height: 40px">One</p>
        <p style="margin: 0 0 10px; height: 60px">Two</p>
        <p style="margin: 0; height: 20px">Three</p>
      </article>
    </div>`);
    const el = wrap.querySelector<TcValidityBadge>("tc-validity-badge")!;
    el.selector = "p";
    await settle();
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await settle();
    const items = [...el.querySelectorAll<HTMLElement>(".ui-vb__item")];
    expect(items.map((i) => [i.offsetTop, i.offsetHeight])).toEqual([[30, 40], [80, 60], [150, 20]]);
    // A paragraph that grows moves the bars after it
    wrap.querySelectorAll<HTMLElement>("p")[0].style.height = "100px";
    await new Promise((r) => setTimeout(r, 50));
    await settle();
    expect([...el.querySelectorAll<HTMLElement>(".ui-vb__item")].map((i) => i.offsetTop)).toEqual([30, 140, 210]);
  });

  test("keyboard: one tab stop, arrows Home End move, Enter locates, Escape hides the tooltip", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="display: flex">
      <tc-validity-badge mode="strip" for="doc-keys" .now=${NOW} .items=${ITEMS.slice(0, 3)}></tc-validity-badge>
      <article id="doc-keys"><p>One</p><p>Two</p><p>Three</p></article>
    </div>`);
    const el = wrap.querySelector<TcValidityBadge>("tc-validity-badge")!;
    const located: ValidityLocateDetail[] = [];
    el.addEventListener("tc-locate", (e) => located.push((e as CustomEvent<ValidityLocateDetail>).detail));
    const segs = () => [...el.querySelectorAll<HTMLElement>(".ui-vb__seg")];
    const key = async (k: string) => {
      (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
      await settle();
    };
    segs()[0].focus();
    await settle();
    expect(el.querySelector(".ui-vb__tip")).toBeTruthy();
    await key("ArrowDown");
    expect(document.activeElement).toBe(segs()[1]);
    expect(segs().map((s) => s.tabIndex)).toEqual([-1, 0, -1]);
    await key("End");
    expect(document.activeElement).toBe(segs()[2]);
    expect(text(el.querySelector(".ui-vb__tip"))).toContain("Stale");
    await key("Home");
    expect(document.activeElement).toBe(segs()[0]);
    await key("ArrowUp");
    expect(document.activeElement).toBe(segs()[0]);
    await key("Escape");
    expect(el.querySelector(".ui-vb__tip")).toBeNull();
    segs()[1].click();
    expect(located).toHaveLength(1);
    expect(located[0].index).toBe(1);
    expect(located[0].target).toBe(wrap.querySelectorAll("p")[1]);
  });

  test("hovering a bar shows its tooltip", async () => {
    const el = await fixture<TcValidityBadge>(html`<tc-validity-badge mode="strip" .now=${NOW} .items=${ITEMS}></tc-validity-badge>`);
    el.querySelectorAll(".ui-vb__seg")[3].dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    await settle();
    expect(text(el.querySelector(".ui-vb__tip"))).toContain("Superseded · Good");
    el.querySelector(".ui-vb__strip")!.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
    await settle();
    expect(el.querySelector(".ui-vb__tip")).toBeNull();
  });

  test("bars say more than colour: aging dashed, stale dotted, superseded hatched", async () => {
    const el = await fixture<TcValidityBadge>(html`<tc-validity-badge mode="strip" .now=${NOW} .items=${ITEMS}></tc-validity-badge>`);
    const img = (i: number) => getComputedStyle(el.querySelectorAll(".ui-vb__bar")[i]).backgroundImage;
    expect(img(1)).toMatch(/repeating-linear-gradient/);
    expect(img(2)).toMatch(/repeating-linear-gradient/);
    expect(img(3)).toMatch(/repeating-linear-gradient/);
    expect(img(1)).not.toBe(img(2));
  });

  test("observers and frames stop on disconnect", async () => {
    const wrap = await fixture<HTMLElement>(html`<div><tc-validity-badge mode="strip" for="doc-gone" .items=${ITEMS}></tc-validity-badge><div id="doc-gone"><p>a</p></div></div>`);
    const el = wrap.querySelector("tc-validity-badge")!;
    el.remove();
    wrap.querySelector("p")!.textContent = "changed";
    await new Promise((r) => setTimeout(r, 30));
    expect(el.isConnected).toBe(false);
  });
});

describe("tc-validity-badge – React", () => {
  test("props reach the element; onLocate fires; htmlFor is the strip's for", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: number[] = [];
    await act(async () => {
      root.render(
        createElement("div", null,
          createElement(ValidityBadge, { band: "aging", contested: true }),
          createElement(ValidityBadge, { mode: "strip", htmlFor: "react-doc", items: ITEMS.slice(0, 1), onLocate: (d) => seen.push(d.index) }),
          createElement("div", { id: "react-doc" }, createElement("p", null, "x")),
        ),
      );
    });
    await settle();
    const [badge, strip] = [...host.querySelectorAll<TcValidityBadge>("tc-validity-badge")];
    expect(badge.currentBand).toBe("aging");
    expect(badge.contested).toBe(true);
    expect(strip.for).toBe("react-doc");
    strip.querySelector<HTMLElement>(".ui-vb__seg")!.click();
    expect(seen).toEqual([0]);
    await act(async () => root.unmount());
  });
});

for (const theme of ["light", "dark"] as const) {
  test(`axe: no violations in either look (${theme})`, async () => {
    const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 8px">
      ${(["standard", "clean"] as const).map(
        (look) => html`<div>
          <tc-validity-badge look=${look} .now=${NOW} .observed=${ago(3)}></tc-validity-badge>
          <tc-validity-badge look=${look} .now=${NOW} .observed=${ago(60)} contested></tc-validity-badge>
          <tc-validity-badge look=${look} .now=${NOW} .observed=${ago(200)}></tc-validity-badge>
          <tc-validity-badge look=${look} .now=${NOW} .observed=${ago(900)} superseded></tc-validity-badge>
          <tc-validity-badge look=${look} compact band="stale"></tc-validity-badge>
          <tc-validity-badge look=${look} mode="strip" .now=${NOW} .items=${ITEMS}></tc-validity-badge>
        </div>`,
      )}
    </div>`);
    wrap.querySelector<HTMLElement>(".ui-vb__seg")!.focus();
    await settle();
    await Promise.all(document.getAnimations().map((x) => (x.finish(), x.finished)));
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
