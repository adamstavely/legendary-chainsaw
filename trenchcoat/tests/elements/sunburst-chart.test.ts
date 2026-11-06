/*
 * <tc-sunburst-chart> in real browsers: the shared chart behaviour (chart-kit), the rings and their angles, the
 * emphasised leaf and its path, the outer labels and inner chips, highlight, sort, hole and path fields, the sweep,
 * data changes, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/sunburst-chart";
import type { TcSunburstChart } from "../../src/elements/sunburst-chart";
import { labelRoom } from "../../src/elements/sunburst-chart";
import { SunburstChart } from "../../src/elements/react/sunburst-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const SPEND = [
  { group: "Life sciences", label: "Genomics", value: 300 },
  { group: "Life sciences", label: "Proteomics", value: 150 },
  { group: "Physical sciences", label: "Climate", value: 250 },
  { group: "Physical sciences", label: "Materials", value: 100 },
  { group: "Shared", label: "Training", value: 50 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcSunburstChart>(
    html`<div style="width: 600px"><tc-sunburst-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Grant spend" .group=${"group"} .data=${o.data ?? SPEND}></tc-sunburst-chart></div>`,
  ).then((w) => w.querySelector("tc-sunburst-chart")!);
const arcs = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-sbr__arc")];
const rows = (el: Element) => [...el.querySelectorAll(".tc-sr-only tbody th")].map((t) => t.textContent!.split(" · ")[0]);
const outer = (el: Element) => [...el.querySelectorAll(".tc-chart__value")].filter((t) => !t.parentElement!.querySelector(":scope > .ui-sbr__chip")).map((t) => t.textContent);
const chipNames = (el: Element) => [...el.querySelectorAll(".ui-sbr__chip")].map((c) => c.parentElement!.querySelector("text")!.textContent);

describe("tc-sunburst-chart", () => {
  chartBasics({ tag: "tc-sunburst-chart", ui: "sbr", kind: "Sunburst chart", make: make as never, marks: 8, firstRead: /^Life sciences: 450 · 53%/ });

  test("rings: groups inside, leaves outside, in data order; the largest leaf in the accent, its path darker", async () => {
    const el = await drawn(await make({ still: true }));
    expect(rows(el)).toEqual(["Life sciences", "Genomics", "Proteomics", "Physical sciences", "Climate", "Materials", "Shared", "Training"]);
    expect(arcs(el).map((a) => a.style.fill)).toEqual([
      "var(--tc-sbr-path)",
      "var(--tc-plot-accent)",
      "var(--tc-plot-rest)",
      "var(--tc-sbr-branch)",
      "var(--tc-plot-rest)",
      "var(--tc-plot-rest)",
      "var(--tc-sbr-branch)",
      "var(--tc-plot-rest)",
    ]);
    // The outer ring lies outside the inner one
    const box = (i: number) => arcs(el)[i].getBBox();
    expect(box(1).width * box(1).height).toBeGreaterThan(0);
    // Outer names and shares sit beside the circle; inner names on chips of the card's colour
    expect(outer(el)).toEqual(["Genomics 35%", "Proteomics 18%", "Climate 29%", "Materials 12%", "Training 6%"]);
    // Cut to the room a level box has in the arc – at three o'clock that is the ring's thickness
    expect(chipNames(el)[0]).toMatch(/^Lif/);
    expect(getComputedStyle(el.querySelector(".ui-sbr__chip")!).fill).toBe(getComputedStyle(el.querySelector(".tc-chart__card")!).backgroundColor);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("2 levels, total 850. Innermost ring: Life sciences 53%, Physical sciences 41%, Shared 6%");
  });

  test("highlight moves the accent and the path; sort orders the rings; hide-labels drops the words", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "Training";
    el.sort = true;
    await settle();
    expect(rows(el)).toEqual(["Life sciences", "Genomics", "Proteomics", "Physical sciences", "Climate", "Materials", "Shared", "Training"]);
    const fills = arcs(el).map((a) => a.style.fill);
    expect(fills[7]).toBe("var(--tc-plot-accent)");
    expect(fills[6]).toBe("var(--tc-sbr-path)");
    expect(fills[0]).toBe("var(--tc-sbr-branch)");
    el.data = [...SPEND].reverse();
    await settle();
    // Sorted from the largest whatever the data's order
    expect(rows(el)[0]).toBe("Life sciences");
    el.hideLabels = true;
    await settle();
    expect(el.querySelectorAll(".tc-chart__value").length).toBe(0);
  });

  test("path fields make three rings; the hole sets the centre; the tooltip names the parent", async () => {
    const el = await drawn(await make({ still: true }));
    el.group = undefined;
    el.path = ["division", "lab"];
    el.data = [
      { division: "Life", lab: "Genomics", label: "Reagents", value: 40 },
      { division: "Life", lab: "Genomics", label: "Sequencing", value: 20 },
      { division: "Physical", lab: "Climate", label: "Compute", value: 40 },
    ];
    await settle();
    expect(rows(el)).toEqual(["Life", "Genomics", "Reagents", "Sequencing", "Physical", "Climate", "Compute"]);
    const inner = () => arcs(el)[0].getBBox().width;
    const w30 = inner();
    el.hole = 0.6;
    await settle();
    // A bigger hole pushes the inner ring out: its box grows
    expect(inner()).toBeGreaterThan(w30);
    key(plot(el), "End");
    await settle();
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("Climate › Compute");
    expect([...el.querySelectorAll(".tc-chart__tip-value")].map((v) => v.textContent)).toEqual(["40", "40%"]);
  });

  test("labelRoom: a level box fits across a ring's top, not its thin side; the rings sweep in, then glide", async () => {
    // At twelve o'clock a 60° piece of a 40–80 ring holds a wide box; a 10° piece at three o'clock barely any
    expect(labelRoom(40, 80, -Math.PI / 6, Math.PI / 6, 16, 3)).toBeGreaterThan(30);
    expect(labelRoom(40, 80, Math.PI / 2 - 0.09, Math.PI / 2 + 0.09, 16, 3)).toBeLessThan(15);
    const el = await drawn(await make());
    const len = () => arcs(el).length;
    await expect.poll(len, { timeout: 4000 }).toBe(8);
    const w = () => arcs(el)[0].getBBox().width;
    await expect.poll(w, { timeout: 4000 }).toBeGreaterThan(90);
    el.data = SPEND.map((d) => (d.group === "Life sciences" ? { ...d, value: d.value / 10 } : d));
    await settle();
    // Life sciences shrinks to a sliver
    await expect.poll(w, { timeout: 4000 }).toBeLessThan(70);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(SunburstChart, { title: "Spend", data: SPEND, group: "group", still: true, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcSunburstChart>("tc-sunburst-chart")!;
    expect(el.heading).toBe("Spend");
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(SunburstChart, { title: "Spend", data: SPEND, group: "group", still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Genomics"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
