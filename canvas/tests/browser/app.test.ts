import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp, nextTick, type App as VueApp } from "vue";
import App from "../../src/App.vue";
import "../../src/elements";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
let app: VueApp | undefined;
let host: HTMLElement;

const settle = (ms = 400) => new Promise((r) => setTimeout(r, ms));
async function violations() {
  const { violations } = await axe.run(host, { runOnly: { type: "tag", values: TAGS } });
  return violations.map(
    (v) =>
      `${v.id}: ${v.nodes
        .map((n) => n.target.join(" "))
        .slice(0, 3)
        .join(" | ")}`,
  );
}
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const segment = (label: string, value: string) =>
  [...host.querySelectorAll(`[aria-label="${label}"] [role="radio"]`)].find((r) => r.textContent?.includes(value)) as HTMLElement;
/** A native button by its accessible name (tc-buttons render one inside) */
const button = (name: string, within: ParentNode = host) =>
  [...within.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent)?.trim() === name)!;
const currentTitle = () => host.querySelector<HTMLButtonElement>('.card__title[tabindex="0"]')!;

beforeEach(async () => {
  localStorage.clear();
  host = document.createElement("div");
  host.style.cssText = "position: fixed; inset: 0;";
  document.body.append(host);
  app = createApp(App);
  app.mount(host);
  await settle(800);
});
afterEach(() => {
  app?.unmount();
  host.remove();
  delete document.documentElement.dataset.tcTheme;
});

describe("the canvas", () => {
  it("has one h1, the cards, and a count", () => {
    expect(host.querySelectorAll("h1")).toHaveLength(1);
    expect(host.querySelectorAll("[data-piece]").length).toBeGreaterThan(50);
    expect(host.querySelector(".foot__count")!.textContent).toMatch(/^\d+ of \d+ pieces · 3 libraries$/);
  });

  for (const theme of ["Light", "Dark"])
    for (const look of ["Standard", "Clean"])
      it(`passes axe in ${theme}, ${look}`, async () => {
        segment("Theme", theme).click();
        segment("Look", look).click();
        await settle();
        expect(await violations()).toEqual([]);
      });

  it("moves between cards with the arrow keys, one card in the Tab order", async () => {
    const first = currentTitle();
    first.focus();
    key(first, "ArrowRight");
    await settle();
    const next = currentTitle();
    expect(next).not.toBe(first);
    expect(document.activeElement).toBe(next);
    expect(host.querySelectorAll('.card__title[tabindex="0"]')).toHaveLength(1);
  });

  it("opens a piece live with Enter and goes back with Escape", async () => {
    const live = [...host.querySelectorAll<HTMLButtonElement>(".card__title")].find((b) => b.getAttribute("aria-expanded") === "false")!;
    live.focus();
    live.click();
    await settle(900);
    const card = live.closest("[data-piece]")!;
    expect(live.getAttribute("aria-expanded")).toBe("true");
    expect(card.querySelector<HTMLElement>(".live")!.inert).toBe(false);
    expect(await violations()).toEqual([]);
    key(card.querySelector(".live__piece")!, "Escape");
    await settle();
    expect(live.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(live);
  });

  it("keeps closed live pieces out of the Tab order", async () => {
    key(currentTitle(), "0");
    await settle(900);
    for (const live of host.querySelectorAll<HTMLElement>(".live")) expect(live.inert).toBe(true);
  });

  it("zooms with the buttons and announces where it settles", async () => {
    const before = host.querySelector(".foot__zoom")!.textContent;
    button("Zoom in").click();
    await settle(900);
    expect(host.querySelector(".foot__zoom")!.textContent).not.toBe(before);
    expect(host.querySelector("[data-announcer]")!.textContent).toMatch(/^Zoom \d+%$/);
  });

  it("moves a card in the Free layout with buttons and Alt+arrows", async () => {
    segment("Layout", "Free").click();
    await settle();
    const card = currentTitle().closest<HTMLElement>("[data-piece]")!;
    const x = () => new DOMMatrix(getComputedStyle(card).transform).m41;
    const start = x();
    button("Move right", card).click();
    await nextTick();
    expect(x()).toBe(start + 16);
    key(currentTitle(), "ArrowLeft", { altKey: true });
    await nextTick();
    expect(x()).toBe(start);
    expect(await violations()).toEqual([]);
  });
});

describe("the toolbar", () => {
  it("opens the filters as a disclosure; Escape closes them and returns focus", async () => {
    const button = host.querySelector<HTMLButtonElement>(".filter tc-button button")!;
    button.focus();
    button.click();
    await settle();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(await violations()).toEqual([]);
    key(host.querySelector(".filter__panel tc-filter-menu")!, "Escape");
    await settle();
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
  });

  it("filters the pieces by library", async () => {
    host.querySelector<HTMLButtonElement>(".filter tc-button button")!.click();
    await settle();
    const motion = [...host.querySelectorAll<HTMLElement>(".filter__panel [role='checkbox'], .filter__panel input[type='checkbox']")].find((el) =>
      (el.closest("label") ?? el.parentElement)?.textContent?.includes("Motion"),
    )!;
    motion.click();
    await settle();
    expect(host.querySelector(".foot__count")!.textContent).toMatch(/· 1 library$/);
  });

  it("shows the list view, which passes axe", async () => {
    segment("View", "List").click();
    await settle();
    expect(host.querySelectorAll(".item").length).toBeGreaterThan(50);
    expect(await violations()).toEqual([]);
  });
});
