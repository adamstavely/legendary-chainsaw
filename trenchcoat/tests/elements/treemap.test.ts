/*
 * <tc-treemap> in real browsers: the shared chart behaviour (chart-kit), the squarified tiles and their emphasis,
 * the chips and group headers, highlight, label modes and sort, nested rows, the entrance, data changes, the React
 * wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/treemap";
import type { TcTreemap } from "../../src/elements/treemap";
import { Treemap } from "../../src/elements/react/treemap";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const LABS = [
  { group: "Life sciences", label: "Proteomics", value: 150 },
  { group: "Physical sciences", label: "Climate", value: 250 },
  { group: "Life sciences", label: "Genomics", value: 300 },
  { group: "Shared", label: "Training", value: 50 },
  { group: "Physical sciences", label: "Materials", value: 100 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcTreemap>(
    html`<div style="width: 600px"><tc-treemap look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Compute hours" .group=${"group"} .data=${o.data ?? LABS}></tc-treemap></div>`,
  ).then((w) => w.querySelector("tc-treemap")!);
const tiles = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-tmp__tile")];
const area = (p: SVGPathElement) => {
  const b = p.getBBox();
  return b.width * b.height;
};
const chips = (el: Element) => [...el.querySelectorAll(".ui-tmp__chip")].map((c) => [...c.parentElement!.querySelectorAll("text")].map((t) => t.textContent));
const rows = (el: Element) => [...el.querySelectorAll(".tc-sr-only tbody th")].map((t) => t.textContent!.split(" · ")[0]);

describe("tc-treemap", () => {
  chartBasics({ tag: "tc-treemap", ui: "tmp", kind: "Treemap", make: make as never, marks: 5, firstRead: /^Genomics Life sciences: 300 · 35%/ });

  test("tiles sized by value, grouped and largest first; the largest takes the accent; chips and group headers", async () => {
    const el = await drawn(await make({ still: true }));
    expect(rows(el)).toEqual(["Genomics", "Proteomics", "Climate", "Materials", "Training"]);
    const t = tiles(el);
    expect(t.map((p) => p.style.fill)).toEqual(["var(--tc-plot-accent)", ...Array(4).fill("var(--tc-plot-rest)")]);
    // Areas follow the values (gaps and the group headers take a little off each)
    const a = t.map(area);
    expect(a[0] / a[1]).toBeGreaterThan(1.6);
    expect(a[0] / a[1]).toBeLessThan(2.4);
    expect(a[2] / a[3]).toBeGreaterThan(2);
    // The big tiles carry their name and share on a chip of the card's colour
    expect(chips(el)[0]).toEqual(["Genomics", "35%"]);
    // The chip is the card's own colour (Standard: the white card on the tray), so its words are text on the card
    expect(getComputedStyle(el.querySelector(".ui-tmp__chip")!).fill).toBe(getComputedStyle(el.querySelector(".tc-chart__card")!).backgroundColor);
    const heads = [...el.querySelectorAll(".tc-chart__tick")].map((x) => x.textContent);
    expect(heads).toContain("Life sciences 53%");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("5 items, total 850. Largest: Genomics 35%, Climate 29%, Proteomics 18%");
  });

  test("highlight, label modes, hide-labels and the data's order", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "Climate";
    el.labelMode = "value";
    await settle();
    expect(tiles(el)[2].style.fill).toBe("var(--tc-plot-accent)");
    expect(tiles(el)[0].style.fill).toBe("var(--tc-plot-rest)");
    expect(chips(el)[0]).toEqual(["35%"]);
    el.labelMode = "name";
    await settle();
    expect(chips(el)[0]).toEqual(["Genomics"]);
    el.hideLabels = true;
    await settle();
    expect(el.querySelector(".ui-tmp__chip")).toBeNull();
    el.sort = false;
    await settle();
    expect(rows(el)).toEqual(["Proteomics", "Genomics", "Climate", "Materials", "Training"]);
    el.setAttribute("sort", "true");
    await settle();
    expect(el.sort).toBe(true);
  });

  test("nested rows with a children field; the tooltip names the parent", async () => {
    const el = await drawn(await make({ still: true }));
    el.group = undefined;
    el.childrenField = "labs";
    el.data = [
      { label: "Life sciences", labs: [{ label: "Genomics", value: 30 }, { label: "Proteomics", value: 10 }] },
      { label: "Physical sciences", labs: [{ label: "Optics", value: 20 }] },
    ];
    await settle();
    expect(rows(el)).toEqual(["Genomics", "Proteomics", "Optics"]);
    key(plot(el), "ArrowRight");
    await settle();
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("Life sciences › Genomics");
    expect([...el.querySelectorAll(".tc-chart__tip-value")].map((v) => v.textContent)).toEqual(["30", "50%"]);
  });

  test("the entrance: tiles grow once on screen, then a data change glides them", async () => {
    const el = await drawn(await make());
    const g = () => area(tiles(el)[0]);
    await expect.poll(g, { timeout: 4000 }).toBeGreaterThan(20000);
    const before = g();
    el.data = LABS.map((d) => (d.label === "Genomics" ? { ...d, value: 60 } : d));
    await settle();
    // Genomics is now small: its tile (the first drawn – tiles keep the order they were first seen in) shrinks
    await expect.poll(g, { timeout: 4000 }).toBeLessThan(before / 3);
    expect(tiles(el)[0].style.fill).toBe("var(--tc-plot-rest)");
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(Treemap, { title: "Labs", data: LABS, group: "group", still: true, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcTreemap>("tc-treemap")!;
    expect(el.heading).toBe("Labs");
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(Treemap, { title: "Labs", data: LABS, group: "group", still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Genomics"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
