/*
 * <tc-fallback-chain> in real browsers: states in words, the summary, keys and detail, the light on the active connector,
 * reduced motion rules, the narrow layout, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/fallback-chain";
import { TcFallbackChain, type FallbackAttempt, type FallbackSelectedChange } from "../../src/elements/fallback-chain";
import { FallbackChain } from "../../src/elements/react/fallback-chain";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

const ATTEMPTS: FallbackAttempt[] = [
  { id: "a", model: "Model A", provider: "Primary", state: "failed", reason: "Timed out", latencyMs: 8000 },
  { id: "b", model: "Model B", state: "skipped", reason: "Not allowed" },
  { id: "c", model: "Model C", state: "answered", latencyMs: 450 },
];
const chain = (attempts = ATTEMPTS) => fixture<TcFallbackChain>(html`<tc-fallback-chain request="Summarise it" locale="en-GB" .attempts=${attempts}></tc-fallback-chain>`);
const model = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-attempt="${id}"]`)!;
const summary = (el: Element) => text(el.querySelector(".ui-fbc__summary"));

describe("tc-fallback-chain", () => {
  test("shows the request and each model's state in a word", async () => {
    const el = await chain();
    expect(el.dataset.ui).toBe("fbc");
    expect(text(el.querySelector(".ui-fbc__request"))).toContain("Summarise it");
    expect(text(model(el, "a"))).toBe("Model A Primary Failed");
    expect(text(model(el, "b"))).toContain("Skipped");
    expect(model(el, "c").querySelector("svg")).toBeTruthy();
  });

  test("the summary says which answered and after how many tries, or that all failed", async () => {
    expect(summary(await chain())).toBe("Model C answered after 2 tries.");
    expect(summary(await chain([{ id: "a", model: "A", state: "answered" }, { id: "b", model: "B", state: "waiting" }]))).toBe("A answered first try.");
    expect(summary(await chain([{ id: "a", model: "A", state: "failed" }, { id: "b", model: "B", state: "failed" }]))).toBe("All 2 models failed, so there's no answer.");
    expect(summary(await chain([{ id: "a", model: "A", state: "failed" }, { id: "b", model: "B", state: "trying" }]))).toBe("Trying B, try 2 of 2.");
    expect(summary(await chain([{ id: "a", model: "A", state: "waiting" }]))).toBe("Not started.");
    expect(summary(await chain([]))).toBe("No models to try.");
    expect((await chain()).querySelector(".ui-fbc__summary")!.getAttribute("role")).toBe("status");
  });

  test("selecting shows reason and latency, by click and by key", async () => {
    const el = await chain();
    const seen: FallbackSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<FallbackSelectedChange>).detail));
    model(el, "a").click();
    await settle();
    expect(seen[0]).toEqual({ selected: "a", attempt: ATTEMPTS[0] });
    expect(text(el.querySelector(".ui-fbc__reason"))).toBe("Reason: Timed out");
    expect(text(el.querySelector(".ui-fbc__took"))).toContain("8");
    const list = el.querySelector('[role="listbox"]')!;
    key(list, "End");
    await settle();
    await expect.poll(() => document.activeElement).toBe(model(el, "c"));
    key(list, "Enter");
    await settle();
    expect(el.selected).toBe("c");
    key(list, "Escape");
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector(".ui-fbc__detail")).toBeNull();
  });

  test("one tab stop, and preventDefault keeps the selection", async () => {
    const el = await chain();
    expect(el.querySelectorAll('[role="option"][tabindex="0"]')).toHaveLength(1);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    model(el, "a").click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("the light runs on the active connector, finitely, and reduced motion is honoured", async () => {
    expect(TcFallbackChain.css).not.toMatch(/\\binfinite\\b/);
    expect(TcFallbackChain.css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\.ui-fbc__link\[data-active="true"\]::after \{ animation: none/);
    const el = await chain([{ id: "a", model: "A", state: "failed" }, { id: "b", model: "B", state: "trying" }]);
    const links = el.querySelectorAll('.ui-fbc__link[data-active="true"]');
    expect(links).toHaveLength(1);
    expect(getComputedStyle(links[0]!, "::after").animationIterationCount).toBe("3");
  });

  test("across when wide, down with no overflow when narrow", async () => {
    const wide = await fixture<HTMLElement>(html`<div style="width: 800px"><tc-fallback-chain .attempts=${ATTEMPTS}></tc-fallback-chain></div>`);
    expect(getComputedStyle(wide.querySelector(".ui-fbc__models")!).flexDirection).toBe("row");
    const narrow = await fixture<HTMLElement>(html`<div style="width: 280px"><tc-fallback-chain request="A long request about something" .attempts=${ATTEMPTS}></tc-fallback-chain></div>`);
    expect(getComputedStyle(narrow.querySelector(".ui-fbc__models")!).flexDirection).toBe("column");
    expect(narrow.scrollWidth).toBeLessThanOrEqual(narrow.clientWidth);
  });
});

describe("React", () => {
  test("uncontrolled selection survives re-renders, and controlled waits for the parent", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = (props: object) => React.createElement(FallbackChain, { attempts: ATTEMPTS, ...props });
    await act(async () => root.render(node({})));
    await settle();
    const el = host.querySelector<TcFallbackChain>("tc-fallback-chain")!;
    await act(async () => model(el, "a").click());
    await act(async () => root.render(node({})));
    await settle();
    expect(el.selected).toBe("a");
    await act(async () => root.render(node({ selected: null })));
    await settle();
    await act(async () => model(el, "b").click());
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-fallback-chain request="Summarise it" .attempts=${ATTEMPTS} selected="a"></tc-fallback-chain></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
