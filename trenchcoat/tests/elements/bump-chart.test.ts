/*
 * <tc-bump-chart> in real browsers: the shared chart behaviour (chart-kit), ranks placed top to bottom with the biggest
 * climber emphasised, names at both ends, ranks worked out from values, highlight and hide-labels, the entrance and a
 * data change, and the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/bump-chart";
import type { TcBumpChart } from "../../src/elements/bump-chart";
import { BumpChart } from "../../src/elements/react/bump-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const RANKS: Record<string, number[]> = {
  Genomics: [1, 2, 3],
  Imaging: [4, 3, 1],
  Proteomics: [2, 1, 2],
  Neuro: [3, 4, 4],
};
const YEARS = ["2024", "2025", "2026"];
const toRows = (r: Record<string, number[]>) => Object.entries(r).flatMap(([series, rs]) => rs.map((rank, k) => ({ x: YEARS[k], series, rank })));
const make = (
  o: {
    look?: "standard" | "clean";
    bare?: boolean;
    still?: boolean;
    data?: Record<string, unknown>[];
  } = {},
) =>
  fixture<TcBumpChart>(
    html`<div style="width: 600px">
      <tc-bump-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Grant ranking" .data=${o.data ?? toRows(RANKS)}></tc-bump-chart>
    </div>`,
  ).then((w) => w.querySelector("tc-bump-chart")!);
const lines = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-bmp__line")];
const texts = (el: Element) => [...el.querySelectorAll(".tc-chart__tick")].map((t) => t.textContent);
/** Each line's dots' y, by the line's last-column name */
const dotYs = (el: Element) => [...el.querySelectorAll(".ui-bmp__item")].map((g) => [...g.querySelectorAll("circle")].map((c) => Math.round(Number(c.getAttribute("cy")))));

describe("tc-bump-chart", () => {
  chartBasics({
    tag: "tc-bump-chart",
    ui: "bmp",
    kind: "Bump chart",
    make: make as never,
    marks: 3,
    firstRead: /^2024: #1 Genomics, #2 Proteomics, #3 Neuro, #4 Imaging/,
  });

  test("ranks top to bottom; the biggest climber emphasised and drawn last; names at both ends", async () => {
    const el = await drawn(await make({ still: true }));
    // Imaging climbs from 4th to 1st: emphasised, in the accent, on top
    const ls = lines(el);
    expect(ls).toHaveLength(4);
    expect(ls.at(-1)!.hasAttribute("data-hi")).toBe(true);
    expect(ls.filter((l) => l.hasAttribute("data-hi"))).toHaveLength(1);
    expect((ls.at(-1)!.parentElement as HTMLElement).style.getPropertyValue("--tc-bmp-ink")).toBe("var(--tc-plot-accent)");
    // Its dots go from the bottom row to the top one
    const ys = dotYs(el).at(-1)!;
    expect(ys[0]).toBeGreaterThan(ys[1]);
    expect(ys[1]).toBeGreaterThan(ys[2]);
    expect(ys[2]).toBe(12);
    expect(texts(el)).toEqual(expect.arrayContaining(["Imaging", "#1 Imaging", "#4 Neuro", "2024", "2026"]));
    expect(el.querySelector(".tc-chart__tick[data-strong]")!.textContent).toBe("Imaging");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Rank changes of 4 items, from 2024 to 2026");
  });

  test("without a rank field, ranks come from the values, the largest first", async () => {
    const el = await drawn(await make({ still: true }));
    el.data = [
      { x: "Q1", series: "Genomics", score: 40 },
      { x: "Q1", series: "Imaging", score: 70 },
      { x: "Q2", series: "Genomics", score: 90 },
      { x: "Q2", series: "Imaging", score: 50 },
    ];
    el.value = "score";
    await settle();
    key(plot(el), "End");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^Q2: #1 Genomics, #2 Imaging, 2 of 2/);
    expect([...el.querySelectorAll(".tc-chart__tip-value")].map((t) => t.textContent)).toEqual(["#1", "#2"]);
  });

  test("highlight picks another line; hide-labels leaves the names off", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "Neuro";
    await settle();
    const hi = lines(el).filter((l) => l.hasAttribute("data-hi"));
    expect(hi).toHaveLength(1);
    expect(dotYs(el).at(-1)![2]).toBeGreaterThan(100);
    el.hideLabels = true;
    await settle();
    expect(texts(el)).toEqual(YEARS);
  });

  test("the lines draw in once on screen; new ranks glide", async () => {
    const el = await drawn(await make());
    const last = () => lines(el).at(-1)!;
    await expect.poll(() => last().hasAttribute("stroke-dasharray"), { timeout: 4000 }).toBe(false);
    // Neuro becomes the climber: emphasised, drawn on top, rising from 4th to 1st
    el.data = toRows({ ...RANKS, Imaging: [4, 3, 4], Neuro: [3, 4, 1] });
    await settle();
    await expect
      .poll(
        () => {
          const ys = dotYs(el).at(-1)!;
          return ys[0] < ys[1] && ys[2] === 12;
        },
        { timeout: 4000 },
      )
      .toBe(true);
  });

  test("React wrapper: props reach the element; a click on the plot picks the step", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(BumpChart, {
          title: "Ranks",
          data: toRows(RANKS),
          still: true,
          onMarkClick: (e) => clicks.push(e.label),
        }),
      ),
    );
    const el = await drawn(host.querySelector<TcBumpChart>("tc-bump-chart")!);
    expect(el.heading).toBe("Ranks");
    key(plot(el), "ArrowRight");
    key(plot(el), "ArrowRight");
    await settle();
    el.querySelector<SVGRectElement>(".tc-chart__hit")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(clicks).toEqual(["2025"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
