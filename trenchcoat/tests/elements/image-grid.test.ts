/*
 * <tc-image-grid> in real browsers: tiles in every state, the actions as events, alt text, compare with its slider,
 * the grid keyboard, focus management, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/image-grid";
import type { ImageGridTile, TcImageGrid } from "../../src/elements/image-grid";
import { ImageGrid } from "../../src/elements/react/image-grid";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const pic = (color: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="${color}"/></svg>`)}`;
const TILES: ImageGridTile[] = [
  { id: "a", src: pic("#f2945f"), alt: "Orange dusk over the sea" },
  { id: "b", src: pic("#3b1f5e"), alt: "" },
  { id: "c", alt: "", status: "failed", error: "The model timed out" },
  { id: "d", src: pic("#0d1528"), alt: "Night sky with stars", upscaled: true },
];

const grid = (tiles: ImageGridTile[] = TILES, attrs = html``) =>
  fixture<TcImageGrid>(html`<tc-image-grid heading="Lighthouse at dusk" prompt="A lighthouse on a cliff" .tiles=${tiles}>${attrs}</tc-image-grid>`);
const cells = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="gridcell"]')];
const btn = (el: Element, label: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === label)!;
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const active = () => document.activeElement as HTMLElement;
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
/** Finishes every finite animation, so axe measures text at its resting colour */
const finishAnimations = () => document.getAnimations().forEach((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.finish());

describe("tc-image-grid", () => {
  test("the host is the root, in both looks; Clean puts the summary inside the card", async () => {
    const el = await grid();
    expect(el.dataset.ui).toBe("igrid");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(":scope > .ui-igrid__foot")).not.toBeNull();
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(":scope > .ui-igrid__card > .ui-igrid__foot")).not.toBeNull();
    const provided = await fixture(html`<tc-look-provider look="clean"><tc-image-grid .tiles=${TILES}></tc-image-grid></tc-look-provider>`);
    expect(provided.querySelector("tc-image-grid")!.dataset.look).toBe("clean");
  });

  test("a grid of rows and cells named by the heading; every tile state", async () => {
    const el = await grid([...TILES, { id: "e", alt: "", status: "pending", progress: 0.42, activity: "Upscaling" }]);
    const g = el.querySelector('[role="grid"]')!;
    expect(document.getElementById(g.getAttribute("aria-labelledby")!)!.textContent).toBe("Lighthouse at dusk");
    expect(document.getElementById(g.getAttribute("aria-describedby")!)!.textContent).toBe("A lighthouse on a cliff");
    expect(el.querySelectorAll('[role="row"]')).toHaveLength(3);
    expect(cells(el)).toHaveLength(5);
    // Done: the image with its alt text, its number, Upscaled on the upscaled one
    expect(el.querySelector<HTMLImageElement>('[data-id="a"] img')!.alt).toBe("Orange dusk over the sea");
    expect(cells(el)[0].getAttribute("aria-label")).toBe("Variation 1: Orange dusk over the sea");
    expect(el.querySelector('[data-id="d"] .ui-igrid__chip-hd')!.getAttribute("data-text")).toBe("Upscaled");
    // A missing alt text asks for one
    expect(el.querySelector('[data-id="b"] .ui-igrid__alt-text')!.textContent).toContain("No alt text");
    expect(cells(el)[1].getAttribute("aria-label")).toBe("Variation 2: No alt text");
    expect(cells(el)[2].getAttribute("aria-label")).toBe("Variation 3: The model timed out, Try again");
    // Failed: the error and Try again
    expect(el.querySelector('[data-id="c"]')!.textContent).toContain("The model timed out");
    expect(btn(el, "Try again")).toBeTruthy();
    // Pending: a progress bar with its value and what it is doing
    const bar = el.querySelector('[data-id="e"] [role="progressbar"]')!;
    expect(bar.getAttribute("aria-valuenow")).toBe("42");
    expect(el.querySelector('[data-id="e"]')!.textContent).toContain("Upscaling");
    expect(cells(el)[4].getAttribute("aria-label")).toBe("Variation 5: Upscaling 42%");
    // The summary counts, and says what still needs alt text
    expect(el.querySelector(".ui-igrid__foot")!.textContent).toContain("Generating 1 of 5");
    el.tiles = TILES;
    await settle();
    expect(el.querySelector(".ui-igrid__foot")!.textContent).toMatch(/4 images · 1 failed\s*·\s*1 needs alt text/);
  });

  test("an indeterminate pending tile has no value; no tiles shows the empty state", async () => {
    const el = await grid([{ id: "p", alt: "", status: "pending" }]);
    const bar = el.querySelector('[role="progressbar"]')!;
    expect(bar.hasAttribute("aria-valuenow")).toBe(false);
    expect(bar.hasAttribute("data-indeterminate")).toBe(true);
    el.tiles = [];
    await settle();
    expect(el.querySelector('[role="grid"]')).toBeNull();
    expect(el.textContent).toContain("No images yet");
  });

  test("columns, ratio, labels and actions", async () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, src: pic("#888"), alt: `Image ${i}`, label: `Seed ${i}` }));
    const el = await fixture<TcImageGrid>(html`<tc-image-grid columns="3" ratio="1.5" .tiles=${five} .actions=${["download"]}></tc-image-grid>`);
    expect(el.querySelectorAll('[role="row"]')).toHaveLength(2);
    expect(el.querySelector('[role="grid"]')!.getAttribute("aria-colcount")).toBe("3");
    expect(el.querySelector<HTMLElement>('[role="grid"]')!.style.getPropertyValue("--tc-image-grid-ratio")).toBe("1.5");
    expect(cells(el)[2].getAttribute("aria-label")).toMatch(/^Seed 2:/);
    expect([...cells(el)[0].querySelectorAll(".ui-igrid__tools button")].map((b) => b.getAttribute("aria-label"))).toEqual(["Download Seed 0"]);
    // Fewer tiles than columns: one row of what there is
    el.tiles = five.slice(0, 2);
    await settle();
    expect(el.querySelector('[role="grid"]')!.getAttribute("aria-colcount")).toBe("2");
  });

  test("regenerate and upscale are requests: buttons, Try again and the R / U keys", async () => {
    const el = await grid();
    const regen = listen<{ tile: ImageGridTile; index: number }>(el, "tc-regenerate");
    const up = listen<{ tile: ImageGridTile; index: number }>(el, "tc-upscale");
    btn(el, "Regenerate Variation 1").click();
    btn(el, "Try again").click();
    await key(cells(el)[1], "r");
    expect(regen.map((d) => [d.tile.id, d.index])).toEqual([
      ["a", 0],
      ["c", 2],
      ["b", 1],
    ]);
    btn(el, "Upscale Variation 1").click();
    await key(cells(el)[1], "u");
    // Already upscaled: the button is off and the key does nothing
    const done = btn(el, "Variation 4 is upscaled");
    expect(done.getAttribute("aria-disabled")).toBe("true");
    done.click();
    await key(cells(el)[3], "u");
    expect(up.map((d) => d.tile.id)).toEqual(["a", "b"]);
    // The status region says what happened
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Upscaling Variation 2");
    // A pending tile can't be regenerated again
    el.tiles = TILES.map((t) => (t.id === "a" ? { ...t, status: "pending" as const } : t));
    await settle();
    await key(cells(el)[0], "r");
    expect(regen).toHaveLength(3);
  });

  test("the app answers: pending, then done – the status region says it is ready", async () => {
    const el = await grid();
    el.tiles = TILES.map((t) => (t.id === "a" ? { ...t, status: "pending" as const, progress: 0.2 } : t));
    await settle();
    expect(el.querySelector('[data-id="a"]')!.getAttribute("data-status")).toBe("pending");
    el.tiles = TILES.map((t) => (t.id === "a" ? { ...t, src: pic("#123456") } : t));
    await settle();
    expect(el.querySelector<HTMLImageElement>('[data-id="a"] img')!.src).toContain("123456");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Variation 1 is ready");
    el.tiles = TILES.map((t) => (t.id === "b" ? { ...t, status: "pending" as const } : t));
    await settle();
    el.tiles = TILES.map((t) => (t.id === "b" ? { ...t, status: "failed" as const, error: "Out of credits" } : t));
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Variation 2 failed: Out of credits");
  });

  test("download: a cancelable event, then the image is saved under a name from the heading", async () => {
    const el = await grid();
    const clicks: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push(this);
    });
    const seen = listen<{ tile: ImageGridTile }>(el, "tc-download");
    btn(el, "Download Variation 1").click();
    await settle();
    expect(seen.map((d) => d.tile.id)).toEqual(["a"]);
    expect(clicks).toHaveLength(1);
    expect(clicks[0].download).toBe("lighthouse-at-dusk-1.svg");
    expect(clicks[0].href).toBe(TILES[0].src);
    expect(clicks[0].isConnected).toBe(false);
    // A filename of its own; the D key
    el.tiles = TILES.map((t) => (t.id === "d" ? { ...t, filename: "night.svg" } : t));
    await settle();
    await key(cells(el)[3], "d");
    expect(clicks[1].download).toBe("night.svg");
    // Prevented: the app saves it its own way
    el.addEventListener("tc-download", (e) => e.preventDefault());
    btn(el, "Download Variation 2").click();
    await settle();
    expect(clicks).toHaveLength(2);
    expect(seen).toHaveLength(3);
  });

  test("alt text: F2 edits, Enter saves through tc-tiles-change, Escape cancels, empty is refused", async () => {
    const el = await grid();
    const changes = listen<{ tiles: ImageGridTile[] }>(el, "tc-tiles-change");
    cells(el)[1].focus();
    await key(cells(el)[1], "F2");
    const input = active() as HTMLInputElement;
    expect(input.tagName).toBe("INPUT");
    expect(input.getAttribute("aria-label")).toBe("Alt text for Variation 2");
    // Empty: refused, the field says why
    await key(input, "Enter");
    expect(changes).toHaveLength(0);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.placeholder).toBe("Alt text is required");
    expect(document.getElementById(input.getAttribute("aria-describedby")!)!.textContent).toContain("Alt text is required");
    input.value = "Purple dusk over the lighthouse";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(input.getAttribute("aria-invalid")).toBe("false");
    await key(input, "Enter");
    expect(changes[0].tiles.find((t) => t.id === "b")!.alt).toBe("Purple dusk over the lighthouse");
    expect(el.tiles[1].alt).toBe("Purple dusk over the lighthouse");
    // Started on the tile: focus goes back to the tile
    expect(active()).toBe(cells(el)[1]);
    expect(cells(el)[1].getAttribute("aria-label")).toBe("Variation 2: Purple dusk over the lighthouse");
    // The edit button; Escape cancels and returns to it
    btn(el, "Edit alt text for Variation 1").click();
    await settle();
    const again = active() as HTMLInputElement;
    expect(again.value).toBe("Orange dusk over the sea");
    again.value = "Something else";
    again.dispatchEvent(new Event("input", { bubbles: true }));
    await key(again, "Escape");
    expect(el.tiles[0].alt).toBe("Orange dusk over the sea");
    expect(active().getAttribute("aria-label")).toBe("Edit alt text for Variation 1");
    expect(changes).toHaveLength(1);
  });

  test("alt text, controlled: preventDefault keeps the tiles until the app passes them back", async () => {
    const el = await grid();
    el.addEventListener("tc-tiles-change", (e) => e.preventDefault());
    btn(el, "Add alt text for Variation 2").click();
    await settle();
    const input = active() as HTMLInputElement;
    input.value = "New";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await key(input, "Enter");
    expect(el.tiles[1].alt).toBe("");
    // Leaving the field with text in it saves too
    btn(el, "Edit alt text for Variation 1").click();
    await settle();
    const field = active() as HTMLInputElement;
    const seen = listen<{ tiles: ImageGridTile[] }>(el, "tc-tiles-change");
    field.value = "Blurred away";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.blur();
    await settle();
    expect(seen[0].tiles[0].alt).toBe("Blurred away");
  });

  test("the grid keyboard: arrows, Home/End, Ctrl+Home/End and one tab stop", async () => {
    const six = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, src: pic("#888"), alt: `Image ${i}` }));
    const el = await fixture<TcImageGrid>(html`<tc-image-grid columns="3" .tiles=${six}></tc-image-grid>`);
    const at = () => Number(active().dataset.index);
    expect(cells(el).map((c) => c.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    cells(el)[0].focus();
    await key(active(), "ArrowRight");
    expect(at()).toBe(1);
    await key(active(), "ArrowDown");
    expect(at()).toBe(4);
    await key(active(), "ArrowRight"); // the row's last tile: stays
    expect(at()).toBe(4);
    await key(active(), "ArrowUp");
    expect(at()).toBe(1);
    await key(active(), "End");
    expect(at()).toBe(2);
    await key(active(), "ArrowRight"); // no wrap to the next row
    expect(at()).toBe(2);
    await key(active(), "Home");
    expect(at()).toBe(0);
    await key(active(), "ArrowLeft");
    expect(at()).toBe(0);
    await key(active(), "End", { ctrlKey: true });
    expect(at()).toBe(4);
    await key(active(), "Home", { ctrlKey: true });
    expect(at()).toBe(0);
    await key(active(), "ArrowDown");
    expect(cells(el).map((c) => c.tabIndex)).toEqual([-1, -1, -1, 0, -1]);
    // Buttons inside tiles are never tab stops of their own
    expect([...el.querySelectorAll<HTMLElement>(".ui-igrid__grid button")].every((b) => b.tabIndex === -1)).toBe(true);
  });

  test("Enter moves into a tile's actions; Tab cycles them; Escape goes back to the tile", async () => {
    const el = await grid();
    cells(el)[0].focus();
    await key(cells(el)[0], "Enter");
    expect(active().getAttribute("aria-label")).toBe("Regenerate Variation 1");
    await key(active(), "Tab");
    expect(active().getAttribute("aria-label")).toBe("Upscale Variation 1");
    await key(active(), "Tab", { shiftKey: true });
    await key(active(), "Tab", { shiftKey: true });
    expect(active().getAttribute("aria-label")).toBe("Edit alt text for Variation 1");
    await key(active(), "Tab");
    expect(active().getAttribute("aria-label")).toBe("Regenerate Variation 1");
    await key(active(), "Escape");
    expect(active()).toBe(cells(el)[0]);
    // Clicking a control inside another tile moves the tab stop there
    btn(el, "Download Variation 4").focus();
    await settle();
    expect(cells(el)[3].tabIndex).toBe(0);
  });

  test("focus: a control that goes away moves focus to its tile; a removed tile to another tile", async () => {
    const el = await grid();
    btn(el, "Regenerate Variation 1").focus();
    el.tiles = TILES.map((t) => (t.id === "a" ? { ...t, status: "pending" as const } : t));
    await settle();
    await new Promise((r) => setTimeout(r, 0));
    expect(active()).toBe(el.querySelector('[data-id="a"]'));
    cells(el)[3].focus();
    el.tiles = TILES.slice(0, 3);
    await settle();
    await new Promise((r) => setTimeout(r, 0));
    expect(el.contains(active())).toBe(true);
    expect(active().getAttribute("role")).toBe("gridcell");
    expect(cells(el).map((c) => c.tabIndex)).toEqual([-1, -1, 0]);
  });

  test("compare: pick two tiles, the divider is a slider, Escape goes back to the first tile", async () => {
    const el = await grid();
    const compares = listen<{ compare: [string, string] | null }>(el, "tc-compare-change");
    const splits = listen<{ split: number }>(el, "tc-split-change");
    cells(el)[0].focus();
    await key(cells(el)[0], "c");
    expect(cells(el)[0].hasAttribute("data-picked")).toBe(true);
    expect(btn(el, "Compare Variation 1").getAttribute("aria-pressed")).toBe("true");
    expect(btn(el, "Compare Variation 2 with Variation 1")).toBeTruthy();
    expect(el.querySelector(".ui-igrid__foot")!.textContent).toContain("Pick a second image to compare with Variation 1");
    // A failed tile can't be compared
    await key(cells(el)[2], "c");
    expect(compares).toHaveLength(0);
    await key(cells(el)[1], "c");
    expect(compares).toEqual([{ compare: ["a", "b"] }]);
    expect(el.querySelector('[role="grid"]')).toBeNull();
    const handle = el.querySelector<HTMLElement>('[role="slider"]')!;
    expect(active()).toBe(handle);
    expect(el.querySelector('[role="group"]')!.getAttribute("aria-label")).toBe("Compare Variation 1 and Variation 2");
    expect(handle.getAttribute("aria-valuenow")).toBe("50");
    expect(handle.getAttribute("aria-valuetext")).toBe("50% Variation 1, 50% Variation 2");
    expect([...el.querySelectorAll<HTMLImageElement>(".ui-igrid__compare img")].map((i) => i.alt)).toEqual(["Orange dusk over the sea", ""]);
    await key(handle, "ArrowRight");
    await key(handle, "ArrowLeft", { shiftKey: true });
    await key(handle, "PageUp");
    await key(handle, "End");
    await key(handle, "Home");
    await key(handle, "ArrowDown");
    expect(splits.map((s) => s.split)).toEqual([51, 41, 51, 100, 0]);
    expect(handle.getAttribute("aria-valuenow")).toBe("0");
    expect(el.querySelector<HTMLElement>(".ui-igrid__stage")!.style.getPropertyValue("--tc-image-grid-split")).toBe("0%");
    // Swap
    btn(el, "Swap").click();
    await settle();
    expect(el.compare).toEqual(["b", "a"]);
    // Escape closes it; focus goes back to the first compared tile
    await key(el.querySelector('[role="slider"]')!, "Escape");
    expect(compares.at(-1)).toEqual({ compare: null });
    expect(el.querySelector('[role="grid"]')).not.toBeNull();
    expect(active()).toBe(el.querySelector('[data-id="b"]'));
  });

  test("compare, controlled: preventDefault keeps the grid and the divider; dragging moves the divider", async () => {
    const el = await grid();
    el.addEventListener("tc-compare-change", (e) => e.preventDefault(), { once: true });
    btn(el, "Compare Variation 1").click();
    await settle();
    btn(el, "Compare Variation 4 with Variation 1").click();
    await settle();
    expect(el.querySelector('[role="grid"]')).not.toBeNull();
    expect(el.compare).toBeNull();
    // Set from outside
    el.compare = ["a", "d"];
    el.split = 30;
    await settle();
    const handle = el.querySelector<HTMLElement>('[role="slider"]')!;
    expect(handle.getAttribute("aria-valuenow")).toBe("30");
    const prevent = (e: Event) => e.preventDefault();
    el.addEventListener("tc-split-change", prevent);
    await key(handle, "ArrowRight");
    expect(handle.getAttribute("aria-valuenow")).toBe("30");
    el.removeEventListener("tc-split-change", prevent);
    // Pointer: the divider follows the pointer across the stage
    const stage = el.querySelector<HTMLElement>(".ui-igrid__stage")!;
    const box = stage.getBoundingClientRect();
    stage.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1, clientX: box.left + box.width * 0.75, clientY: box.top + 10 }));
    await settle();
    expect(Math.round(el.split)).toBe(75);
    stage.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 1, clientX: box.left + box.width * 0.25, clientY: box.top + 10 }));
    await settle();
    expect(Math.round(el.split)).toBe(25);
    stage.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
    stage.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 1, clientX: box.left + box.width * 0.9, clientY: box.top + 10 }));
    await settle();
    expect(Math.round(el.split)).toBe(25);
    // A compared tile that starts generating ends the comparison view
    el.tiles = TILES.map((t) => (t.id === "d" ? { ...t, status: "pending" as const } : t));
    await settle();
    expect(el.querySelector('[role="grid"]')).not.toBeNull();
  });

  test("timers and object URLs are cleared when the element goes away", async () => {
    const el = await grid([{ id: "x", src: "/missing-image-for-test.png", alt: "Remote" }]);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(window, "fetch").mockResolvedValue(new Response(new Blob(["x"], { type: "image/png" })));
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    btn(el, "Download Variation 1").click();
    await new Promise((r) => setTimeout(r, 20));
    el.remove();
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  test("React wrapper: title, uncontrolled tiles survive a parent re-render, callbacks fire", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onRegenerate = vi.fn();
    const onTilesChange = vi.fn();
    const onDownload = vi.fn((_t: ImageGridTile, _i: number, e: Event) => e.preventDefault());
    const onCompareChange = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const draw = (n: number) =>
      root.render(React.createElement(ImageGrid, { title: `Run ${n}`, defaultTiles: TILES, onRegenerate, onTilesChange, onDownload, onCompareChange, className: "consumer" }));
    await act(async () => draw(1));
    await settle();
    const el = host.querySelector("tc-image-grid")!;
    expect(el.classList.contains("consumer")).toBe(true);
    expect(el.querySelector(".ui-igrid__title")!.textContent).toBe("Run 1");
    btn(el, "Add alt text for Variation 2").click();
    await settle();
    const input = active() as HTMLInputElement;
    input.value = "Kept";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await act(async () => key(input, "Enter"));
    expect(onTilesChange).toHaveBeenCalledTimes(1);
    await act(async () => draw(2));
    await settle();
    expect(el.tiles[1].alt).toBe("Kept");
    expect(el.querySelector(".ui-igrid__title")!.textContent).toBe("Run 2");
    btn(el, "Regenerate Variation 2").click();
    expect(onRegenerate).toHaveBeenCalledWith(expect.objectContaining({ id: "b", alt: "Kept" }), 1);
    btn(el, "Download Variation 1").click();
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(click).not.toHaveBeenCalled();
    btn(el, "Compare Variation 1").click();
    await settle();
    await act(async () => btn(el, "Compare Variation 2 with Variation 1").click());
    await settle();
    expect(onCompareChange).toHaveBeenCalledWith(["a", "b"]);
    expect(el.querySelector('[role="slider"]')).not.toBeNull();
    await act(async () => root.unmount());
  });

  test("React wrapper, controlled: the compare pair and the split stay with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onSplitChange = vi.fn();
    await act(async () => root.render(React.createElement(ImageGrid, { tiles: TILES, compare: ["a", "d"], split: 20, onSplitChange })));
    await settle();
    const el = host.querySelector("tc-image-grid")!;
    const handle = el.querySelector<HTMLElement>('[role="slider"]')!;
    await act(async () => key(handle, "ArrowRight"));
    expect(onSplitChange).toHaveBeenCalledWith(21);
    expect(handle.getAttribute("aria-valuenow")).toBe("20");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-image-grid look=${look} heading="Lighthouse" prompt="A lighthouse at dusk" .tiles=${[...TILES, { id: "p", alt: "", status: "pending", progress: 0.3 }]}></tc-image-grid>
            <tc-image-grid look=${look} heading="Compared" .tiles=${TILES} .compare=${["a", "d"]}></tc-image-grid>
          </div>`,
        );
        const first = wrap.querySelector("tc-image-grid")!;
        btn(first, "Compare Variation 1").click();
        await settle();
        finishAnimations();
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
