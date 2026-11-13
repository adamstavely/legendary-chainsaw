/*
 * <tc-region-overlay> in real browsers: boxes on the image linked to the list, confidence in words, the kind chips,
 * the threshold slider and Show boxes as cancelable changes, the listbox keyboard, the narrow layout, the React wrapper
 * and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/region-overlay";
import type { OverlayRegion, RegionSelectedChange, TcRegionOverlay } from "../../src/elements/region-overlay";
import { RegionOverlay } from "../../src/elements/react/region-overlay";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#fff"/></svg>')}`;
const REGIONS: OverlayRegion[] = [
  { id: "case", label: "Case number", kind: "text", box: { x: 0.05, y: 0.05, width: 0.4, height: 0.1 }, confidence: 0.96, text: "AUD-2026-0412" },
  { id: "table", label: "Claims table", kind: "table", box: { x: 0.05, y: 0.3, width: 0.9, height: 0.3 }, confidence: 0.7, text: "Travel · £412.80" },
  { id: "face", label: "ID photo", kind: "face-blurred", box: { x: 0.05, y: 0.7, width: 0.2, height: 0.25 }, confidence: 0.9 },
  { id: "sign", label: "Signature", kind: "text", box: { x: 0.4, y: 0.8, width: 0.4, height: 0.1 }, confidence: 0.45, text: "M. 0kafor" },
];

const overlay = (regions: OverlayRegion[] = REGIONS) =>
  fixture<TcRegionOverlay>(html`<tc-region-overlay heading="Scan" src=${SRC} alt="Scanned form" .regions=${regions}></tc-region-overlay>`);
const options = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
const option = (el: Element, id: string) => el.querySelector<HTMLElement>(`[role="option"][data-id="${id}"]`)!;
const boxes = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-rgo__box")];
const chip = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-rgo__chip")].find((b) => b.textContent!.includes(name))!;
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const slide = async (el: Element, value: number) => {
  const input = el.querySelector<HTMLInputElement>('.ui-rgo__slider input[type="range"]')!;
  input.value = String(value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};

describe("tc-region-overlay", () => {
  test("the host is the root, in both looks; Clean puts the header inside the card", async () => {
    const el = await overlay();
    expect(el.dataset.ui).toBe("rgo");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(":scope > .tc-head")).not.toBeNull();
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(":scope > .ui-rgo__card > .tc-head")).not.toBeNull();
  });

  test("a numbered box per region on the image, and a listbox with one tab stop", async () => {
    const el = await overlay();
    expect(el.querySelector<HTMLImageElement>(".ui-rgo__img")!.alt).toBe("Scanned form");
    expect(boxes(el)).toHaveLength(4);
    expect(boxes(el).every((b) => b.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(boxes(el).map((b) => b.querySelector(".ui-rgo__num")!.textContent)).toEqual(["1", "2", "3", "4"]);
    expect(boxes(el)[1].style.left).toBe("5%");
    expect(boxes(el)[1].style.width).toBe("90%");
    const list = el.querySelector('[role="listbox"]')!;
    expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Regions");
    expect(options(el)).toHaveLength(4);
    expect(options(el).filter((o) => o.tabIndex === 0)).toHaveLength(1);
    expect(el.querySelector(".ui-rgo__total")!.textContent).toBe("4 regions");
  });

  test("confidence reads as a word and a percentage; Low boxes are dashed", async () => {
    const el = await overlay();
    expect(option(el, "case").textContent).toContain("High 96% confidence");
    expect(option(el, "table").textContent).toContain("Medium 70% confidence");
    expect(option(el, "sign").textContent).toContain("Low 45% confidence");
    expect(option(el, "face").textContent).toContain("Face (blurred)");
    expect(boxes(el)[3].dataset.level).toBe("low");
    expect(getComputedStyle(boxes(el)[3]).borderTopStyle).toBe("dashed");
    expect(getComputedStyle(boxes(el)[0]).borderTopStyle).toBe("solid");
  });

  test("renamed labels and kinds", async () => {
    const el = await overlay();
    el.labels = { list: "Gefunden", confidence: { low: "Niedrig" }, kindNames: { table: "Tabelle" } };
    await settle();
    expect(option(el, "sign").textContent).toContain("Niedrig");
    expect(option(el, "table").textContent).toContain("Tabelle");
    expect(option(el, "case").textContent).toContain("High");
    expect(document.getElementById(el.querySelector('[role="listbox"]')!.getAttribute("aria-labelledby")!)!.textContent).toBe("Gefunden");
  });

  test("clicking a region selects it, shows its read text and lights its box; again clears it", async () => {
    const el = await overlay();
    const seen = listen<RegionSelectedChange>(el, "tc-selected-change");
    option(el, "table").click();
    await settle();
    expect(seen[0]).toEqual({ selected: "table", region: REGIONS[1] });
    expect(el.selected).toBe("table");
    expect(option(el, "table").getAttribute("aria-selected")).toBe("true");
    expect(option(el, "table").querySelector(".ui-rgo__text")!.textContent).toBe("Travel · £412.80");
    expect(boxes(el)[1].hasAttribute("data-selected")).toBe(true);
    expect(boxes(el)[1].querySelector(".ui-rgo__tag")!.textContent).toBe("Claims table");
    option(el, "table").click();
    await settle();
    expect(seen[1].selected).toBeNull();
    expect(el.selected).toBeNull();
  });

  test("a region with no text says so when selected", async () => {
    const el = await overlay();
    option(el, "face").click();
    await settle();
    expect(option(el, "face").querySelector(".ui-rgo__text")!.textContent).toBe("No text read");
  });

  test("clicking a box selects its region", async () => {
    const el = await overlay();
    boxes(el)[3].click();
    await settle();
    expect(el.selected).toBe("sign");
    expect(option(el, "sign").tabIndex).toBe(0);
  });

  test("preventDefault() keeps the selection", async () => {
    const el = await overlay();
    listen(el, "tc-selected-change", true);
    option(el, "case").click();
    await settle();
    expect(el.selected).toBeNull();
    expect(option(el, "case").getAttribute("aria-selected")).toBe("false");
  });

  test("keyboard: arrows move and light the box, Home / End, Enter selects, Escape clears", async () => {
    const el = await overlay();
    const first = options(el)[0];
    first.focus();
    await key(first, "ArrowDown");
    expect(document.activeElement).toBe(option(el, "table"));
    expect(option(el, "table").hasAttribute("data-lit")).toBe(true);
    expect(boxes(el)[1].hasAttribute("data-lit")).toBe(true);
    await key(document.activeElement!, "End");
    expect(document.activeElement).toBe(option(el, "sign"));
    await key(document.activeElement!, "Home");
    expect(document.activeElement).toBe(option(el, "case"));
    await key(document.activeElement!, "ArrowUp");
    expect(document.activeElement).toBe(option(el, "case"));
    await key(document.activeElement!, "Enter");
    expect(el.selected).toBe("case");
    await key(document.activeElement!, " ");
    expect(el.selected).toBeNull();
    await key(document.activeElement!, "Enter");
    await key(document.activeElement!, "Escape");
    expect(el.selected).toBeNull();
  });

  test("pointing at a box lights its row", async () => {
    const el = await overlay();
    boxes(el)[2].dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(option(el, "face").hasAttribute("data-lit")).toBe(true);
    boxes(el)[2].dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(option(el, "face").hasAttribute("data-lit")).toBe(false);
  });

  test("kind chips filter, with counts; turning every kind back on clears the filter", async () => {
    const el = await overlay();
    const seen = listen<{ kinds: string[] | null }>(el, "tc-kinds-change");
    expect(chip(el, "Text").getAttribute("aria-pressed")).toBe("true");
    expect(chip(el, "Text").querySelector(".ui-rgo__count")!.textContent).toBe("2");
    expect(el.querySelector('.ui-rgo__chips[role="group"]')!.getAttribute("aria-label")).toBe("Kinds");
    chip(el, "Text").click();
    await settle();
    expect(seen[0].kinds).toEqual(["table", "face-blurred"]);
    expect(options(el).map((o) => o.dataset.id)).toEqual(["table", "face"]);
    expect(boxes(el)).toHaveLength(2);
    expect(el.querySelector(".ui-rgo__total")!.textContent).toBe("2 of 4 regions");
    expect(chip(el, "Text").getAttribute("aria-pressed")).toBe("false");
    chip(el, "Text").click();
    await settle();
    expect(seen[1].kinds).toBeNull();
    expect(options(el)).toHaveLength(4);
  });

  test("the threshold slider hides regions under it; prevented, it stays", async () => {
    const el = await overlay();
    const seen = listen<{ threshold: number }>(el, "tc-threshold-change");
    await slide(el, 75);
    expect(seen[0]).toEqual({ threshold: 0.75 });
    expect(el.threshold).toBe(0.75);
    expect(options(el).map((o) => o.dataset.id)).toEqual(["case", "face"]);
    expect(el.querySelector(".ui-rgo__value")!.textContent).toBe("75%");
    expect(el.querySelector('.ui-rgo__slider input')!.getAttribute("aria-valuetext")).toBe("75%");
    await slide(el, 100);
    expect(el.querySelector(".ui-rgo__empty")!.textContent).toBe("No regions at this confidence");
    el.threshold = 0;
    await settle();
    listen(el, "tc-threshold-change", true);
    await slide(el, 50);
    expect(el.threshold).toBe(0);
    expect(el.querySelector<HTMLInputElement>('.ui-rgo__slider input')!.value).toBe("0");
  });

  test("a selected region filtered out stays selected but isn't shown; the tab stop moves", async () => {
    const el = await overlay();
    el.selected = "sign";
    await settle();
    el.threshold = 0.6;
    await settle();
    expect(el.selected).toBe("sign");
    expect(option(el, "sign")).toBeNull();
    expect(options(el).filter((o) => o.tabIndex === 0)).toHaveLength(1);
  });

  test("Show boxes is a switch that takes the boxes off", async () => {
    const el = await overlay();
    const sw = el.querySelector<HTMLButtonElement>('[role="switch"]')!;
    expect(sw.getAttribute("aria-checked")).toBe("true");
    expect(sw.textContent!.trim()).toBe("Show boxes");
    const seen = listen<{ showBoxes: boolean }>(el, "tc-show-boxes-change");
    sw.click();
    await settle();
    expect(seen[0]).toEqual({ showBoxes: false });
    expect(boxes(el)).toHaveLength(0);
    expect(options(el)).toHaveLength(4);
    expect(sw.getAttribute("aria-checked")).toBe("false");
  });

  test("empty: no regions, no image", async () => {
    const el = await fixture<TcRegionOverlay>(html`<tc-region-overlay></tc-region-overlay>`);
    expect(el.querySelector(".ui-rgo__noimg")).not.toBeNull();
    expect(el.querySelector(".ui-rgo__empty")).not.toBeNull();
    expect(el.querySelector(".ui-rgo__total")).toBeNull();
    expect(el.querySelector(".ui-rgo__chips")).toBeNull();
  });

  test("regions that go away while active: the tab stop moves to one still there", async () => {
    const el = await overlay();
    option(el, "sign").click();
    await settle();
    el.regions = REGIONS.slice(0, 2);
    await settle();
    expect(options(el)).toHaveLength(2);
    expect(options(el).filter((o) => o.tabIndex === 0)).toHaveLength(1);
  });

  test("narrow: the list goes below the image", async () => {
    const wrap = await fixture(html`<div style="width: 400px"><tc-region-overlay src=${SRC} alt="Scan" .regions=${REGIONS}></tc-region-overlay></div>`);
    const el = wrap.querySelector("tc-region-overlay")!;
    const stage = el.querySelector(".ui-rgo__stage")!.getBoundingClientRect();
    const side = el.querySelector(".ui-rgo__side")!.getBoundingClientRect();
    expect(side.top).toBeGreaterThanOrEqual(stage.bottom - 1);
  });

  test("React wrapper: title, uncontrolled selection survives a parent re-render, callbacks fire", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onSelectedChange = vi.fn();
    const onThresholdChange = vi.fn();
    const draw = (n: number) =>
      root.render(React.createElement(RegionOverlay, { title: `Run ${n}`, src: SRC, alt: "Scan", regions: REGIONS, onSelectedChange, onThresholdChange, className: "consumer" }));
    await act(async () => draw(1));
    await settle();
    const el = host.querySelector("tc-region-overlay")!;
    expect(el.classList.contains("consumer")).toBe(true);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Run 1");
    await act(async () => option(el, "table").click());
    expect(onSelectedChange).toHaveBeenCalledWith("table", REGIONS[1]);
    await act(async () => draw(2));
    await settle();
    expect(el.selected).toBe("table");
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Run 2");
    await act(async () => slide(el, 50));
    expect(onThresholdChange).toHaveBeenCalledWith(0.5);
    expect(el.threshold).toBe(0.5);
    await act(async () => root.unmount());
  });

  test("React wrapper, controlled: the selection stays with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onSelectedChange = vi.fn();
    await act(async () => root.render(React.createElement(RegionOverlay, { src: SRC, alt: "Scan", regions: REGIONS, selected: "case", onSelectedChange })));
    await settle();
    const el = host.querySelector("tc-region-overlay")!;
    await act(async () => option(el, "table").click());
    await settle();
    expect(onSelectedChange).toHaveBeenCalledWith("table", REGIONS[1]);
    expect(el.selected).toBe("case");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-region-overlay look=${look} heading="Scan" description="form.png" src=${SRC} alt="Scanned form" .regions=${REGIONS} selected="table"></tc-region-overlay>
            <div style="width: 360px"><tc-region-overlay look=${look} src=${SRC} alt="Scanned form" .regions=${REGIONS} threshold="0.6"></tc-region-overlay></div>
          </div>`,
        );
        const first = wrap.querySelector("tc-region-overlay")!;
        option(first, "sign").focus();
        await settle();
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
