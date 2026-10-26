/*
 * <tc-integration-grid> in real browsers – the illustration's contract checks, ported, plus layout, theme and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcIntegrationGrid, integrationGridDefaults, type IntegrationGridLogo } from "../../src/elements/integration-grid";
import { IntegrationGrid } from "../../src/elements/react/integration-grid";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const logos: IntegrationGridLogo[] = [
  { name: "Square", path: "M2 2h20v20H2z", color: "#ff0000" },
  { name: "Dot", path: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z" },
];

describe("tc-integration-grid", () => {
  test("the host is the root and an image named by the logos it shows", async () => {
    const el = await fixture<TcIntegrationGrid>(html`<tc-integration-grid></tc-integration-grid>`);
    expect(el.dataset.ui).toBe("ig");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe(`Integrates with ${integrationGridDefaults.slice(0, 22).map((l) => l.name).join(", ")}`);
    // 7 · 9 · 7 tiles, one of them the centre
    expect(el.querySelectorAll(".ui-ig-tile")).toHaveLength(23);
    expect(el.querySelectorAll(".ui-ig-tile--center .ui-ig-mark")).toHaveLength(1);
    expect(el.querySelectorAll(".ui-ig-tile[aria-hidden='true']")).toHaveLength(23);
  });

  test("a label replaces the description", async () => {
    const el = await fixture<TcIntegrationGrid>(html`<tc-integration-grid label="Works with your stack"></tc-integration-grid>`);
    expect(el.getAttribute("aria-label")).toBe("Works with your stack");
  });

  test("fewer logos repeat around the centre; colours reach the tiles", async () => {
    const el = await fixture<TcIntegrationGrid>(html`<tc-integration-grid .logos=${logos}></tc-integration-grid>`);
    expect(el.getAttribute("aria-label")).toBe("Integrates with Square, Dot");
    const tiles = [...el.querySelectorAll<HTMLElement>(".ui-ig-tile:not(.ui-ig-tile--center)")];
    expect(tiles).toHaveLength(22);
    expect(tiles.map((t) => t.querySelector("path")!.getAttribute("d"))).toEqual(tiles.map((_, i) => logos[i % 2].path));
    expect(tiles[0].style.getPropertyValue("--tc-integration-grid-c")).toBe("#ff0000");
    expect(getComputedStyle(tiles[0].querySelector("svg")!).fill).toBe("rgb(255, 0, 0)");
  });

  test("columns: 7 and 5 make a tighter grid and a narrower frame", async () => {
    const el = await fixture<TcIntegrationGrid>(html`<tc-integration-grid columns="7" style="width: 600px"></tc-integration-grid>`);
    expect(el.querySelectorAll(".ui-ig-tile")).toHaveLength(17);
    expect(el.style.getPropertyValue("--tc-integration-grid-w")).toBe("1200");
    expect(el.getBoundingClientRect().height).toBeCloseTo(600 * (560 / 1200), 0);
    el.columns = 5;
    await settle();
    expect(el.querySelectorAll(".ui-ig-tile")).toHaveLength(11);
    el.columns = 9;
    await settle();
    expect(el.style.getPropertyValue("--tc-integration-grid-w")).toBe("");
  });

  test("a custom mark is cloned into the centre", async () => {
    const mark = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    mark.setAttribute("data-mine", "");
    const el = await fixture<TcIntegrationGrid>(html`<tc-integration-grid .mark=${mark}></tc-integration-grid>`);
    expect(el.querySelector(".ui-ig-tile--center svg[data-mine]")).toBeTruthy();
    expect(el.querySelector(".ui-ig-mark")).toBeNull();
    expect(mark.isConnected).toBe(false);
  });

  test("dark follows color-scheme alone (no theme-scoped rules below the root); no endless loops", async () => {
    const css = TcIntegrationGrid.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    expect(css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-integration-grid></tc-integration-grid></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-ig-tile--center")!).backgroundColor).toBe("rgb(42, 42, 45)");
  });

  test("React wrapper: className is merged, DOM props reach the host, the ref gets the host, a React mark shows", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcIntegrationGrid>();
    const mark = React.createElement("svg", { "data-react-mark": "" });
    await act(async () =>
      root.render(React.createElement(IntegrationGrid, { className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", mark, ref } as React.ComponentProps<typeof IntegrationGrid>)),
    );
    await settle();
    const el = host.querySelector<TcIntegrationGrid>("tc-integration-grid")!;
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.ui).toBe("ig");
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    expect(ref.current).toBe(el);
    expect(el.querySelector(".ui-ig-tile--center svg[data-react-mark]")).toBeTruthy();
    await act(async () => root.unmount());
  });

  test("axe: no violations", async () => {
    const wrap = await fixture(html`<div><tc-integration-grid></tc-integration-grid><tc-integration-grid columns="5" label="Five tools"></tc-integration-grid></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
