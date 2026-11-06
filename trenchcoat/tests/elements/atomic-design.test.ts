/*
 * <tc-atomic-design> in real browsers: each stage's drawing and name, the scale, labels, decorative, pausing off screen,
 * finite loops, dark colours, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcAtomicDesign, type AtomicDesignStage } from "../../src/elements/atomic-design";
import { AtomicDesign } from "../../src/elements/react/atomic-design";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const words = (el: Element) => [...el.querySelectorAll("text")].map((t) => t.textContent);

describe("tc-atomic-design", () => {
  test("the overview draws the five stages, from abstract to concrete", async () => {
    const el = await fixture<TcAtomicDesign>(html`<tc-atomic-design></tc-atomic-design>`);
    expect(el.dataset.ui).toBe("atd");
    expect(el.stage).toBe("overview");
    expect(words(el)).toEqual(["Abstract", "Concrete", "Atoms", "Molecules", "Organisms", "Templates", "Pages"]);
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Atomic design: atoms, molecules, organisms, templates, pages, from abstract to concrete.");
    expect(getComputedStyle(el.querySelector(".ui-atd-art")!).aspectRatio).toBe("4 / 3");
    el.scale = false;
    await settle();
    expect(words(el)).not.toContain("Abstract");
    expect(el.getAttribute("aria-label")).toBe("Atomic design: atoms, molecules, organisms, templates, pages.");
  });

  test("atoms, molecule and organism name their parts", async () => {
    const el = await fixture<TcAtomicDesign>(html`<tc-atomic-design stage="atoms"></tc-atomic-design>`);
    expect(words(el)).toEqual(["Search the archive", "Label", "Enter a keyword", "Input", "Search", "Button"]);
    expect(el.getAttribute("aria-label")).toBe("Atoms: a label, an input and a button.");
    el.stage = "molecule";
    await settle();
    expect(words(el)).toEqual(["Label", "Search the archive", "Input", "Enter a keyword", "Button", "Search"]);
    expect(el.querySelectorAll(".ui-atd-dash")).toHaveLength(3);
    el.stage = "organism";
    await settle();
    expect(words(el)).toEqual(["Logo", "Navigation", "Search", "Home", "About", "Research", "Contact", "keyword"]);
    expect(el.getAttribute("aria-label")).toMatch(/^An organism: a site header/);
  });

  test("the template is placeholders, and the page fills the same layout with content", async () => {
    const el = await fixture<TcAtomicDesign>(html`<tc-atomic-design stage="template"></tc-atomic-design>`);
    expect(el.querySelectorAll(".ui-atd-sky")).toHaveLength(0);
    expect(el.querySelectorAll(".ui-atd-dash").length).toBeGreaterThan(5);
    el.stage = "page";
    await settle();
    expect(el.querySelectorAll(".ui-atd-sky")).toHaveLength(6);
    expect(words(el)).toContain("Field notes");
    // each picture clips to its own frame, with ids unique to this instance
    const ids = [...el.querySelectorAll("clipPath")].map((c) => c.id);
    expect(new Set(ids).size).toBe(6);
    const other = await fixture<TcAtomicDesign>(html`<tc-atomic-design stage="page"></tc-atomic-design>`);
    expect(ids).not.toContain(other.querySelector("clipPath")!.id);
  });

  test("an unknown stage draws the overview", async () => {
    const el = await fixture<TcAtomicDesign>(html`<tc-atomic-design></tc-atomic-design>`);
    el.stage = "nope" as AtomicDesignStage;
    await settle();
    expect(el.querySelector(".ui-atd-art")!.getAttribute("data-stage")).toBe("overview");
  });

  test("labels change the words drawn; label, caption and decorative", async () => {
    const el = await fixture<TcAtomicDesign>(html`<tc-atomic-design caption="From parts to pages"></tc-atomic-design>`);
    el.labels = { ...el.labels, atoms: "Atome" };
    await settle();
    expect(words(el)).toContain("Atome");
    expect(el.getAttribute("aria-label")).toMatch(/^Atomic design: atome/);
    expect(el.querySelector(".ui-atd-caption")!.textContent).toBe("From parts to pages");
    el.label = "Five stages";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Five stages");
    el.decorative = true;
    await settle();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen it holds still, and runs on when it's back", async () => {
    const el = await fixture<TcAtomicDesign>(html`<tc-atomic-design style="position: absolute; top: 5000px; width: 200px"></tc-atomic-design>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-atd-glow")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the loop is finite, and dark follows color-scheme", async () => {
    expect(TcAtomicDesign.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-atomic-design></tc-atomic-design></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-atd-tile")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcAtomicDesign>();
    await act(async () => root.render(React.createElement(AtomicDesign, { className: "mine", stage: "page", ref })));
    await settle();
    const el = host.querySelector<TcAtomicDesign>("tc-atomic-design")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.stage).toBe("page");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, on every stage in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      for (const stage of ["overview", "atoms", "molecule", "organism", "template", "page"]) {
        const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-atomic-design stage=${stage}></tc-atomic-design></div>`);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => v.id)).toEqual([]);
      }
    }
  });
});
