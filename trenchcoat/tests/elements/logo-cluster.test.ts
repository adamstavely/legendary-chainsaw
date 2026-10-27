/*
 * <tc-logo-cluster> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/logo-cluster";
import { TcLogoCluster } from "../../src/elements/logo-cluster";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const until = async (check: () => boolean, ms = 2000) => {
  const end = performance.now() + ms;
  while (!check() && performance.now() < end) await new Promise((r) => setTimeout(r, 16));
};

describe("tc-logo-cluster", () => {
  test("the host is the root (no data-look: one look); classes and attributes stay on it; it is square", async () => {
    const el = await fixture<TcLogoCluster>(html`<tc-logo-cluster class="mine" data-x="1" style="width: 320px"></tc-logo-cluster>`);
    expect(el.dataset.ui).toBe("lc");
    expect(el.hasAttribute("data-look")).toBe(false);
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("data-x")).toBe("1");
    const box = el.getBoundingClientRect();
    expect(box.width).toBe(box.height);
    expect(el.querySelectorAll(".ui-lc-bubble").length).toBe(7);
  });

  test("decorative by default, an image when labelled", async () => {
    const el = await fixture<TcLogoCluster>(html`<tc-logo-cluster></tc-logo-cluster>`);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    el.label = "Works with your tools";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Works with your tools");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
  });

  test("brand colours on their bubbles; dark marks follow the text colour", async () => {
    const el = await fixture<TcLogoCluster>(html`<tc-logo-cluster></tc-logo-cluster>`);
    const [notion, spotify] = el.querySelectorAll<HTMLElement>(".ui-lc-bubble");
    expect(spotify.style.color).toBe("rgb(30, 215, 96)");
    expect(notion.style.color).toBe("");
    expect(getComputedStyle(notion).color).toBe("rgb(23, 23, 23)");
  });

  test("the entrance plays once it is in view; off screen the ring pauses", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="height: 300px; overflow: auto"><tc-logo-cluster style="width: 200px"></tc-logo-cluster><div style="height: 2000px"></div></div>`);
    const el = wrap.querySelector("tc-logo-cluster")!;
    await until(() => el.hasAttribute("data-shown"));
    expect(el.hasAttribute("data-shown")).toBe(true);
    wrap.scrollTop = 1500;
    await until(() => el.hasAttribute("data-paused"));
    expect(el.hasAttribute("data-paused")).toBe(true);
  });

  test("dark follows data-tc-theme; the ring turns once and rests – no endless loop", () => {
    const css = TcLogoCluster.css;
    expect(css).toContain('[data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    expect(css).not.toMatch(/\binfinite\b/);
    expect(css).toMatch(/ui-lc-spin var\(--tc-logo-cluster-spin\) linear [^;]* 1;/);
  });

  test("axe: no violations once the entrance has played", async () => {
    const wrap = await fixture(html`<div><tc-logo-cluster style="width: 200px"></tc-logo-cluster><tc-logo-cluster label="Integrations" style="width: 200px"></tc-logo-cluster></div>`);
    await new Promise((r) => setTimeout(r, 1200));
    await finish(wrap);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
