/*
 * <tc-project-flow> in real browsers – the illustration's contract and regression checks, ported: resizing rescales
 * the artboard without a render (and it stays hidden until it has a size); the build-up holds off screen; without a
 * theme it follows the page and shows a swapped-in scene finished; theme pins the scene; colours are light-dark()
 * tokens with readable secondary text. Plus ids, description and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/project-flow";
import { TcProjectFlow } from "../../src/elements/project-flow";
import { ProjectFlow } from "../../src/elements/react/project-flow";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const stageOf = (el: Element) => el.querySelector<HTMLElement>(":scope > .pf-stage")!;
/** Counts the element's renders from now on */
const countUpdates = (el: TcProjectFlow) => {
  const counter = { n: 0 };
  const own = el as unknown as { update: (changed: unknown) => void };
  const update = own.update.bind(el);
  own.update = (changed) => {
    counter.n++;
    update(changed);
  };
  return counter;
};

describe("tc-project-flow", () => {
  test("the host is the root; decorative without a label, an image with one", async () => {
    const el = await fixture<TcProjectFlow>(html`<tc-project-flow></tc-project-flow>`);
    expect(el.dataset.ui).toBe("pf");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.querySelectorAll(".pf-card").length).toBeGreaterThan(3);
    el.label = "A task and its subtasks";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("A task and its subtasks");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
  });

  test("the avatars and logos are inlined WebP images", async () => {
    const el = await fixture<TcProjectFlow>(html`<tc-project-flow></tc-project-flow>`);
    const srcs = [...el.querySelectorAll("img")].map((img) => img.getAttribute("src")!);
    expect(srcs.length).toBeGreaterThan(0);
    expect(srcs.every((s) => s.startsWith("data:image/"))).toBe(true);
    expect(srcs.some((s) => s.startsWith("data:image/webp"))).toBe(true);
    await expect.poll(() => [...el.querySelectorAll("img")].every((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  });

  test("resizing rescales the artboard without a render; the stage stays hidden until it has a size", async () => {
    const el = await fixture<TcProjectFlow>(html`<tc-project-flow style="width: 0"></tc-project-flow>`);
    expect(stageOf(el).style.visibility, "hidden until it has a size").toBe("hidden");
    const renders = countUpdates(el);
    el.style.width = "1156px";
    await expect.poll(() => stageOf(el).style.transform).toBe("scale(0.5)");
    expect(stageOf(el).style.visibility).toBe("");
    expect(renders.n).toBe(0);
  });

  test("each instance has its own mask id", async () => {
    const wrap = await fixture(html`<div><tc-project-flow></tc-project-flow><tc-project-flow></tc-project-flow></div>`);
    const [a, b] = [...wrap.querySelectorAll("tc-project-flow")];
    const id = (el: Element) => el.querySelector("mask")!.id;
    expect(id(a)).not.toBe(id(b));
    for (const el of [a, b]) for (const g of el.querySelectorAll("[mask]")) expect(g.getAttribute("mask")).toBe(`url(#${id(el)})`);
  });

  test("the build-up is held while off screen", async () => {
    const el = await fixture<TcProjectFlow>(html`<tc-project-flow style="position: absolute; top: 5000px; width: 400px"></tc-project-flow>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".pf-g-task")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("without a theme it follows the page and shows the new scene finished", async () => {
    const page = await fixture<HTMLDivElement>(html`<div><tc-project-flow></tc-project-flow></div>`);
    const el = page.querySelector<TcProjectFlow>("tc-project-flow")!;
    expect(el.getAttribute("data-scene")).toBe("light");
    expect(el.hasAttribute("data-theme")).toBe(false);
    expect(el.hasAttribute("data-settled")).toBe(false);
    page.classList.add("dark");
    await expect.poll(() => el.getAttribute("data-scene")).toBe("dark");
    expect(el.hasAttribute("data-settled"), "no replay of the build-up").toBe(true);
    expect(getComputedStyle(el.querySelector(".pf-g-task")!).animationDuration).toBe("0.001s");
    page.removeAttribute("class");
    page.setAttribute("data-tc-theme", "dark");
    await expect.poll(() => el.getAttribute("data-scene")).toBe("dark");
    page.setAttribute("data-tc-theme", "light");
    await expect.poll(() => el.getAttribute("data-scene")).toBe("light");
  });

  test("a dark page shows the dark scene from the first paint, with the build-up", async () => {
    const page = await fixture<HTMLDivElement>(html`<div class="dark"><tc-project-flow></tc-project-flow></div>`);
    const el = page.querySelector<TcProjectFlow>("tc-project-flow")!;
    expect(el.getAttribute("data-scene")).toBe("dark");
    expect(el.hasAttribute("data-settled")).toBe(false);
  });

  test("theme pins the scene", async () => {
    const el = await fixture<TcProjectFlow>(html`<tc-project-flow theme="dark"></tc-project-flow>`);
    expect(el.getAttribute("data-scene")).toBe("dark");
    expect(el.getAttribute("data-theme")).toBe("dark");
    expect(getComputedStyle(el.querySelector(".pf-card")!).backgroundColor).toBe("rgb(26, 26, 26)");
    el.theme = undefined;
    await settle();
    expect(el.getAttribute("data-scene")).toBe("light");
    expect(el.hasAttribute("data-theme")).toBe(false);
  });

  test("scene colours are light-dark() tokens, and the secondary text meets 4.5 : 1; reduced motion shows it finished", () => {
    const css = TcProjectFlow.css;
    expect(css).not.toMatch(/\[data-theme="dark"\] \./);
    expect(css).toContain("--tc-project-flow-sub: light-dark(#737373");
    expect(css).toContain("--tc-project-flow-pill-text: light-dark(#8a6510");
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\[data-ui="pf"\] \.pf-stage :is\([^)]*\) \{ animation-duration: 0\.001s !important; animation-delay: 0s !important; \}/);
  });

  test("React wrapper: className is merged, DOM props reach the host, and the ref gets the host", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcProjectFlow>();
    await act(async () =>
      root.render(React.createElement(ProjectFlow, { theme: "dark", className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", ref } as React.ComponentProps<typeof ProjectFlow>)),
    );
    await settle();
    const el = host.querySelector<TcProjectFlow>("tc-project-flow")!;
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.ui).toBe("pf");
    expect(el.dataset.scene).toBe("dark");
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
  });

  test("axe: no violations, decorative and labelled", async () => {
    const wrap = await fixture(html`<div>
      <tc-project-flow></tc-project-flow>
      <tc-project-flow label="A task, its subtasks and the roles on it"></tc-project-flow>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
