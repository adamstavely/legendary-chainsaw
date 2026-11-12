/*
 * <tc-image-generation> in real browsers: every state, the frame's shape, the field resolving with the progress, the
 * announcements, the actions as events, Show more, narrow width, the React wrapper and axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/image-generation";
import { formatEta, parseAspectRatio, TcImageGeneration } from "../../src/elements/image-generation";
import { ImageGeneration } from "../../src/elements/react/image-generation";
import { cleanup, finish, fixture, pageStyles, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const pic = (color: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 12"><rect width="8" height="12" fill="${color}"/></svg>`)}`;
const LONG = "A calm, editorial cover illustration for an annual audit report: ledger bars rising like a skyline under a large magnifying glass, deep teal and warm amber";

const card = (attrs = html``) => fixture<TcImageGeneration>(html`<tc-image-generation heading="Report cover" prompt="Ledger bars under a magnifier">${attrs}</tc-image-generation>`);
const btn = (el: Element, text: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent!.trim() === text);
const said = (el: Element) => el.querySelector(".ui-igen__sr")!.textContent;
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const set = async (el: TcImageGeneration, props: Partial<TcImageGeneration>) => {
  Object.assign(el, props);
  await el.updateComplete;
};

describe("tc-image-generation", () => {
  test("helpers: the aspect ratio and the time left", () => {
    expect(parseAspectRatio("16:9")).toBe("16 / 9");
    expect(parseAspectRatio("2/3")).toBe("2 / 3");
    expect(parseAspectRatio("1.5")).toBe("1.5 / 1");
    expect(parseAspectRatio("wide")).toBe("1 / 1");
    expect(parseAspectRatio("0:4")).toBe("1 / 1");
    expect(formatEta(12.4)).toBe("about 12 s left");
    expect(formatEta(0.3)).toBe("about 1 s left");
    expect(formatEta(130)).toBe("about 2 min left");
    expect(formatEta(0)).toBe("a moment left");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a group named by the heading; Clean puts the header and actions in the card`, async () => {
      const el = await card(html``);
      await set(el, { look });
      expect(el.dataset.ui).toBe("igen");
      expect(el.dataset.look).toBe(look);
      const group = el.querySelector('[role="group"]')!;
      expect(document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent).toBe("Report cover");
      if (look === "clean") {
        expect(el.querySelector(".ui-igen__card > .tc-head:first-child")).not.toBeNull();
        expect(el.querySelector(".ui-igen__card > .ui-igen__foot")).not.toBeNull();
      } else {
        expect(el.querySelector(".ui-igen__root > .tc-head:first-child + .ui-igen__card")).not.toBeNull();
        expect(el.querySelector(".ui-igen__root > .ui-igen__foot")).not.toBeNull();
      }
    });
  }

  test("the frame has the image's shape from the start, and keeps it when the image arrives", async () => {
    const el = await card();
    await set(el, { aspectRatio: "2:3" });
    const frame = el.querySelector<HTMLElement>(".ui-igen__frame")!;
    const before = frame.getBoundingClientRect();
    expect(before.height / before.width).toBeCloseTo(1.5, 1);
    await set(el, { status: "done", src: pic("#0f3b44"), alt: "A teal cover" });
    const after = el.querySelector<HTMLElement>(".ui-igen__frame")!.getBoundingClientRect();
    expect(after.height).toBeCloseTo(before.height, 0);
    expect(el.querySelector<HTMLImageElement>(".ui-igen__img")!.alt).toBe("A teal cover");
    expect(el.querySelector(".ui-igen__field")).toBeNull();
  });

  test("queued: its place in line, a Cancel, no bar", async () => {
    const el = await card();
    await set(el, { status: "queued", position: 2 });
    expect(el.querySelector(".ui-igen__aside")!.textContent).toBe("Queued · 2nd in line");
    expect(el.querySelector(".ui-igen__pill")!.textContent!.trim()).toBe("2nd in line");
    expect(el.querySelector('[role="progressbar"]')).toBeNull();
    await set(el, { position: 1 });
    expect(el.querySelector(".ui-igen__pill")!.textContent!.trim()).toBe("Next in line");
    expect(btn(el, "Cancel")).toBeTruthy();
  });

  test("generating: step, percentage and time left; a progressbar with its value; the field resolves", async () => {
    const el = await card();
    await set(el, { status: "generating", step: 6, steps: 30, eta: 12, phase: "Generating" });
    const bar = el.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute("aria-label")).toBe("Report cover: Generating");
    expect(bar.getAttribute("aria-valuenow")).toBe("20");
    expect(bar.getAttribute("aria-valuetext")).toBe("Step 6 of 30, 20%, about 12 s left");
    expect(el.querySelector(".ui-igen__aside")!.textContent).toBe("Generating · Step 6 of 30 · 20%");
    expect(el.querySelector(".ui-igen__meta")!.textContent).toBe("Step 6 of 30 · about 12 s left");
    expect(el.querySelector(".ui-igen__summary")!.textContent).toBe("about 12 s left");
    const frame = el.querySelector<HTMLElement>(".ui-igen__frame")!;
    expect(frame.style.getPropertyValue("--tc-igen-left")).toBe("0.800");
    // progress wins over the step when both are given
    await set(el, { progress: 0.75 });
    expect(frame.style.getPropertyValue("--tc-igen-left")).toBe("0.250");
    expect(bar.getAttribute("aria-valuenow")).toBe("75");
    // A preview shows blurred; without one, the colour field
    expect(el.querySelector(".ui-igen__blobs")).not.toBeNull();
    await set(el, { preview: pic("#7fc8b8") });
    expect(el.querySelector(".ui-igen__preview")).not.toBeNull();
    expect(el.querySelector(".ui-igen__blobs")).toBeNull();
    const blur = getComputedStyle(el.querySelector(".ui-igen__preview")!).filter;
    expect(blur).toMatch(/blur\(6\.5px\)/);
  });

  test("no progress: the bar sweeps with no value", async () => {
    const el = await card();
    const bar = el.querySelector('[role="progressbar"]')!;
    expect(bar.hasAttribute("data-indeterminate")).toBe(true);
    expect(bar.hasAttribute("aria-valuenow")).toBe(false);
    expect(el.querySelector(".ui-igen__aside")!.textContent).toBe("Generating");
  });

  test("announces each change of state once, progress by the quarter, and the alt text when done", async () => {
    const el = await card();
    await set(el, { status: "queued", position: 3 });
    expect(said(el)).toBe("Queued · 3rd in line");
    await set(el, { status: "generating", progress: 0.1 });
    expect(said(el)).toBe("Generating · 10%");
    await set(el, { progress: 0.2 });
    expect(said(el)).toBe("Generating · 10%");
    await set(el, { progress: 0.3 });
    expect(said(el)).toBe("Generating 25%");
    await set(el, { progress: 0.55, phase: "Refining" });
    expect(said(el)).toBe("Refining 50%");
    await set(el, { status: "done", src: pic("#123"), alt: "Ledger bars under a magnifier" });
    expect(said(el)).toBe("Ready: Ledger bars under a magnifier");
    await set(el, { alt: "Changed later" });
    expect(said(el)).toBe("Ready: Ledger bars under a magnifier");
    await set(el, { status: "failed", error: "The model timed out" });
    expect(said(el)).toBe("Couldn't generate the image: The model timed out");
    // A card that starts done says nothing
    const quiet = await fixture<TcImageGeneration>(html`<tc-image-generation status="done" .src=${pic("#123")} alt="x"></tc-image-generation>`);
    expect(said(quiet)).toBe("");
  });

  test("Cancel fires tc-cancel and shows the card cancelled, unless prevented; Start again regenerates", async () => {
    const el = await card();
    const prevented = listen<{ status: string }>(el, "tc-cancel", true);
    btn(el, "Cancel")!.click();
    await el.updateComplete;
    expect(prevented).toEqual([{ status: "generating" }]);
    expect(el.status).toBe("generating");
    const el2 = await card();
    const seen = listen<{ status: string }>(el2, "tc-cancel");
    const again = listen<{ prompt: string }>(el2, "tc-regenerate");
    btn(el2, "Cancel")!.click();
    await el2.updateComplete;
    expect(seen).toHaveLength(1);
    expect(el2.status).toBe("cancelled");
    expect(el2.querySelector(".ui-igen__state-text")!.textContent).toBe("Cancelled");
    btn(el2, "Start again")!.click();
    expect(again).toEqual([{ prompt: "Ledger bars under a magnifier" }]);
  });

  test("failed: why, and Try again fires tc-retry", async () => {
    const el = await card();
    await set(el, { status: "failed", error: "The prompt was declined" });
    expect(el.querySelector(".ui-igen__state-text")!.textContent).toBe("The prompt was declined");
    expect(el.querySelector(".ui-igen__aside")!.textContent).toBe("The prompt was declined");
    const seen = listen<{ prompt: string }>(el, "tc-retry");
    btn(el, "Try again")!.click();
    expect(seen).toEqual([{ prompt: "Ledger bars under a magnifier" }]);
    expect(btn(el, "Cancel")).toBeUndefined();
  });

  test("done: Download (cancelable), Regenerate and Copy prompt", async () => {
    const el = await card();
    await set(el, { status: "done", src: pic("#0f3b44"), alt: "Cover" });
    expect(btn(el, "Cancel")).toBeUndefined();
    const downloads = listen<{ src: string; filename: string }>(el, "tc-download", true);
    const clicked = vi.spyOn(HTMLAnchorElement.prototype, "click");
    btn(el, "Download")!.click();
    expect(downloads[0].filename).toBe("report-cover.svg");
    expect(clicked).not.toHaveBeenCalled();
    await set(el, { filename: "cover-final.svg" });
    btn(el, "Download")!.click();
    expect(downloads[1].filename).toBe("cover-final.svg");
    const regen = listen<{ prompt: string }>(el, "tc-regenerate");
    btn(el, "Regenerate")!.click();
    expect(regen).toHaveLength(1);
    // Copy prompt, prevented: nothing copied, the label stays
    const copies = listen<{ prompt: string }>(el, "tc-copy-prompt", true);
    btn(el, "Copy prompt")!.click();
    await el.updateComplete;
    expect(copies).toEqual([{ prompt: "Ledger bars under a magnifier" }]);
    expect(btn(el, "Copy prompt")).toBeTruthy();
  });

  test("Copy prompt copies and says Copied", async () => {
    const write = vi.fn(() => Promise.resolve());
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue({ writeText: write } as unknown as Clipboard);
    const el = await card();
    btn(el, "Copy prompt")!.click();
    await expect.poll(() => btn(el, "Copied")).toBeTruthy();
    expect(write).toHaveBeenCalledWith("Ledger bars under a magnifier");
  });

  test("a long prompt clamps to two lines with Show more, a disclosure; preventDefault keeps it", async () => {
    const el = await card();
    expect(el.querySelector(".ui-igen__more")).toBeNull();
    await set(el, { prompt: LONG });
    const more = el.querySelector<HTMLButtonElement>(".ui-igen__more")!;
    const prompt = el.querySelector(".ui-igen__prompt")!;
    expect(more.textContent!.trim()).toBe("Show more");
    expect(more.getAttribute("aria-expanded")).toBe("false");
    expect(more.getAttribute("aria-controls")).toBe(prompt.id);
    expect(prompt.hasAttribute("data-clamped")).toBe(true);
    const seen = listen<{ expanded: boolean }>(el, "tc-expanded-change");
    more.click();
    await el.updateComplete;
    expect(seen).toEqual([{ expanded: true }]);
    expect(el.expanded).toBe(true);
    expect(prompt.hasAttribute("data-clamped")).toBe(false);
    expect(more.textContent!.trim()).toBe("Show less");
    el.addEventListener("tc-expanded-change", (e) => e.preventDefault());
    more.click();
    await el.updateComplete;
    expect(el.expanded).toBe(true);
  });

  test("model and size chips; renamed labels", async () => {
    const el = await card();
    await set(el, { model: "Studio model", size: "1024 × 1536", labels: { cancel: "Stop" } });
    expect([...el.querySelectorAll(".ui-igen__chip")].map((c) => c.textContent)).toEqual(["Studio model", "1024 × 1536"]);
    expect(btn(el, "Stop")).toBeTruthy();
  });

  test("an unsafe src is never loaded", async () => {
    const el = await card();
    await set(el, { status: "done", src: "javascript:alert(1)", alt: "x" });
    expect(el.querySelector(".ui-igen__img")).toBeNull();
    expect(btn(el, "Download")).toBeUndefined();
  });

  test("reduced motion turns the drift, grain and sweep off in CSS", () => {
    const css = (TcImageGeneration as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^@]*animation: none !important;/);
  });

  test("narrow: the card and its actions stay inside the width", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 280px"><tc-image-generation heading="Report cover" status="done" .src=${pic("#123")} alt="x" prompt="A cover"></tc-image-generation></div>`);
    await settle(wrap);
    const el = wrap.querySelector("tc-image-generation")!;
    const right = el.getBoundingClientRect().right;
    expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(281);
    for (const b of el.querySelectorAll("button")) expect(b.getBoundingClientRect().right).toBeLessThanOrEqual(right + 1);
  });

  test("React: props reach the element, callbacks get their details, expanded stays uncontrolled across re-renders", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const onCancel = vi.fn((_s: string, e: Event) => e.preventDefault());
    const onExpandedChange = vi.fn();
    const render = (step: number) =>
      act(async () =>
        root.render(React.createElement(ImageGeneration, { title: "Report cover", prompt: LONG, status: "generating", step, steps: 30, aspectRatio: "2:3", onCancel, onExpandedChange })),
      );
    await render(6);
    const el = wrap.querySelector<TcImageGeneration>("tc-image-generation")!;
    await settle(wrap);
    expect(el.heading).toBe("Report cover");
    expect(el.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow")).toBe("20");
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-igen__more")!.click());
    await settle(wrap);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    await render(9);
    await settle(wrap);
    expect(el.expanded).toBe(true);
    await act(async () => btn(el, "Cancel")!.click());
    expect(onCancel).toHaveBeenCalledWith("generating", expect.anything());
    expect(el.status).toBe("generating");
    await act(async () => root.unmount());
    wrap.remove();
  });

  test("React: a controlled expanded stays until the parent changes it", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    await act(async () => root.render(React.createElement(ImageGeneration, { prompt: LONG, expanded: false })));
    const el = wrap.querySelector<TcImageGeneration>("tc-image-generation")!;
    await settle(wrap);
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-igen__more")!.click());
    await settle(wrap);
    expect(el.expanded).toBe(false);
    await act(async () => root.unmount());
    wrap.remove();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, in every state`, async () => {
      const wrap = await fixture<HTMLElement>(html`<div data-tc-page data-tc-theme=${theme} style="padding: 16px; display: grid; gap: 16px">${pageStyles}
        <tc-image-generation look="standard" heading="Queued" status="queued" position="2" prompt="A cover"></tc-image-generation>
        <tc-image-generation look="clean" heading="Working" status="generating" step="12" steps="30" eta="8" model="Studio model" size="1024 × 1536" .prompt=${LONG}></tc-image-generation>
        <tc-image-generation look="standard" heading="Indeterminate" status="generating" .preview=${pic("#7fc8b8")} prompt="A cover"></tc-image-generation>
        <tc-image-generation look="clean" heading="Done" status="done" .src=${pic("#0f3b44")} alt="A teal cover" prompt="A cover"></tc-image-generation>
        <tc-image-generation look="standard" heading="Failed" status="failed" error="The model timed out" prompt="A cover"></tc-image-generation>
        <tc-image-generation look="clean" heading="Cancelled" status="cancelled" prompt="A cover"></tc-image-generation>
      </div>`);
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
