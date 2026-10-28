/*
 * <tc-logo-marquee> in real browsers: a named region with the Pause button first; the strip moves, and Pause stops it
 * for good (cancelable); two rows split the logos and run opposite ways; only the first set is read and reachable by
 * Tab; links are safe; hover stops it; enough copies to fill the width; narrow width; the React wrapper with
 * React-node marks; axe in both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/logo-marquee";
import { marqueeRows, type MarqueeLogo, type MarqueePausedChange, type TcLogoMarquee } from "../../src/elements/logo-marquee";
import { LogoMarquee } from "../../src/elements/react/logo-marquee";
import { cleanup, finish, fixture, parkPointer, settle } from "./helpers";

afterEach(cleanup);

const mark = (d: string) => {
  const t = document.createElement("template");
  t.innerHTML = `<svg viewBox="0 0 32 32" fill="currentColor"><path d="${d}"></path></svg>`;
  return t.content.firstElementChild!;
};
const LOGOS: MarqueeLogo[] = [
  { name: "Northwind", color: "#2f6bff", svg: mark("M4 26 16 4l12 22h-6l-6-11-6 11z"), href: "#n" },
  { name: "Lumen", svg: mark("M16 1v30"), href: "#l" },
  { name: "Orbitly", svg: mark("M2 2h28v28H2z") },
  { name: "Fernway", svg: mark("M16 2c8 6 10 16 0 28C6 18 8 8 16 2z"), href: "javascript:alert(1)" },
];
const transforms = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-lm__track")].map((t) => t.style.transform).join("|");
const frames = (n: number) => new Promise<void>((r) => {
  let i = 0;
  const step = () => (++i >= n ? r() : requestAnimationFrame(step));
  requestAnimationFrame(step);
});

describe("tc-logo-marquee", () => {
  test("a named region; the Pause button comes first; only the first set is read and reachable", async () => {
    const el = await fixture<TcLogoMarquee>(html`<tc-logo-marquee label="Customers" .logos=${LOGOS}></tc-logo-marquee>`);
    expect(el.dataset.ui).toBe("lm");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Customers");
    const pause = el.querySelector<HTMLButtonElement>(".ui-lm__pause button")!;
    expect(pause.textContent).toContain("Pause logos");
    const links = [...el.querySelectorAll<HTMLAnchorElement>("a.ui-lm__link")];
    expect(pause.compareDocumentPosition(links[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const sets = el.querySelectorAll(".ui-lm__set");
    expect(sets.length).toBeGreaterThanOrEqual(2);
    expect(sets[0].hasAttribute("aria-hidden")).toBe(false);
    expect([...sets].slice(1).every((s) => s.getAttribute("aria-hidden") === "true" && s.hasAttribute("inert"))).toBe(true);
    // The names are read; the unsafe link is plain text
    expect(sets[0].querySelector(".ui-lm__sr")!.textContent).toBe("Northwind");
    expect([...sets[0].querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual(["#n", "#l"]);
    expect(el.querySelector('[href^="javascript"]')).toBeNull();
  });

  test("it moves; Pause stops it for good and Play starts it again; prevented, nothing changes", async () => {
    await parkPointer();
    const el = await fixture<TcLogoMarquee>(html`<tc-logo-marquee .speed=${200} .logos=${LOGOS}></tc-logo-marquee>`);
    const changes: MarqueePausedChange[] = [];
    el.addEventListener("tc-paused-change", (e) => changes.push((e as CustomEvent<MarqueePausedChange>).detail));
    await frames(5);
    const a = transforms(el);
    await expect.poll(() => transforms(el) !== a).toBe(true);
    const button = el.querySelector<HTMLButtonElement>(".ui-lm__pause button")!;
    button.click();
    await settle();
    expect(changes).toEqual([{ paused: true }]);
    expect(el.paused).toBe(true);
    expect(el.querySelector<HTMLButtonElement>(".ui-lm__pause button")).toBe(button);
    // Eases to a real stop
    await expect.poll(async () => {
      const t = transforms(el);
      await frames(3);
      return t === transforms(el);
    }, { timeout: 6000 }).toBe(true);
    button.click();
    await settle();
    expect(el.paused).toBe(false);
    const still = transforms(el);
    await expect.poll(() => transforms(el) !== still).toBe(true);

    el.addEventListener("tc-paused-change", (e) => e.preventDefault());
    button.click();
    await settle();
    expect(el.paused).toBe(false);
  });

  test("hovering eases it to a stop", async () => {
    const el = await fixture<TcLogoMarquee>(html`<tc-logo-marquee .speed=${200} .pauseButton=${false} .logos=${LOGOS}></tc-logo-marquee>`);
    expect(el.querySelector(".ui-lm__pause")).toBeNull();
    await userEvent.hover(el.querySelector(".ui-lm__row")!);
    await expect.poll(async () => {
      const t = transforms(el);
      await frames(3);
      return t === transforms(el);
    }, { timeout: 6000 }).toBe(true);
    await parkPointer();
  });

  test("two rows take alternate logos and run opposite ways", async () => {
    expect(marqueeRows(LOGOS, 2, "left").map((r) => [r.logos.map((l) => l.name), r.dir])).toEqual([
      [["Northwind", "Orbitly"], 1],
      [["Lumen", "Fernway"], -1],
    ]);
    expect(marqueeRows(LOGOS.slice(0, 1), 2, "right")).toEqual([{ logos: LOGOS.slice(0, 1), dir: -1 }]);
    const el = await fixture<TcLogoMarquee>(html`<tc-logo-marquee rows="2" labels="below" .logos=${LOGOS}></tc-logo-marquee>`);
    expect(el.querySelectorAll(".ui-lm__row")).toHaveLength(2);
    expect(el.dataset.labels).toBe("below");
    expect(el.querySelector(".ui-lm__name")!.textContent).toBe("Northwind");
  });

  test("enough copies to cover the width, also when narrow", async () => {
    const el = await fixture<TcLogoMarquee>(html`<div style="width: 1200px"><tc-logo-marquee .logos=${LOGOS.slice(0, 2)}></tc-logo-marquee></div>`).then((d) => d.firstElementChild as TcLogoMarquee);
    await expect.poll(() => {
      const row = el.querySelector<HTMLElement>(".ui-lm__row")!;
      const set = el.querySelector<HTMLElement>(".ui-lm__set")!;
      return el.querySelectorAll(".ui-lm__set").length * set.getBoundingClientRect().width >= row.clientWidth + set.getBoundingClientRect().width - 1;
    }).toBe(true);
    (el.parentElement as HTMLElement).style.width = "320px";
    await settle();
    await expect.poll(() => getComputedStyle(el.querySelector(".ui-lm__mark")!).height).toBe("22px");
  });

  test("React: React-node marks; paused is controllable", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const reports: boolean[] = [];
    const logos = [{ name: "Quanta", svg: React.createElement("svg", { className: "quanta", viewBox: "0 0 10 10" }, React.createElement("rect", { width: 10, height: 10 })) }];
    await act(async () => root.render(React.createElement(LogoMarquee, { logos, paused: false, onPausedChange: (p) => void reports.push(p) })));
    await settle();
    const el = host.querySelector("tc-logo-marquee")!;
    await expect.poll(() => el.querySelector(".ui-lm__mark svg.quanta")).not.toBeNull();
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-lm__pause button")!.click());
    await settle();
    expect(reports).toEqual([true]);
    expect(el.paused).toBe(false);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-logo-marquee label="Customers" labels="beside" .logos=${LOGOS}></tc-logo-marquee>
        <tc-logo-marquee label="More customers" rows="2" labels="below" .grayscale=${false} .logos=${LOGOS}></tc-logo-marquee>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
