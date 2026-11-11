/*
 * <tc-radial-bar-chart> in real browsers: the shared chart behaviour (chart-kit), the rings filled towards max with
 * the largest emphasised, names where they start, a full circle's centre value, highlight and format, the entrance
 * and data changes, and the React wrapper; and the activity-rings variant – each ring towards its own target, the lap
 * past it, the glyphs, and the tiles that isolate their rings.
 */
import axe from "axe-core";
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/radial-bar-chart";
import type { TcRadialBarChart } from "../../src/elements/radial-bar-chart";
import { RadialBarChart } from "../../src/elements/react/radial-bar-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const LABS = [
  { label: "Genomics", value: 82 },
  { label: "Imaging", value: 64 },
  { label: "Proteomics", value: 91 },
  { label: "Neuro", value: 47 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcRadialBarChart>(
    html`<div style="width: 600px"><tc-radial-bar-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Grant milestones" .data=${o.data ?? LABS}></tc-radial-bar-chart></div>`,
  ).then((w) => w.querySelector("tc-radial-bar-chart")!);
const bars = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-rbr__bar")];
const values = (el: Element) => [...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent);

describe("tc-radial-bar-chart", () => {
  chartBasics({ tag: "tc-radial-bar-chart", ui: "rbr", kind: "Radial bar chart", make: make as never, marks: 4, firstRead: /^Genomics: 82%/ });

  test("rings fill towards max, outermost first; the largest in the accent; each named with its value", async () => {
    const el = await drawn(await make({ still: true }));
    const b = bars(el);
    expect(b.map((p) => p.style.stroke)).toEqual(["var(--tc-plot-rest)", "var(--tc-plot-rest)", "var(--tc-plot-accent)", "var(--tc-plot-rest)"]);
    expect(el.querySelectorAll(".ui-rbr__track")).toHaveLength(4);
    // Each ring's length over its track's: its share of 270° at its radius
    const tracks = [...el.querySelectorAll<SVGPathElement>(".ui-rbr__track")];
    tracks.forEach((t, i) => expect(b[i].getTotalLength() / t.getTotalLength()).toBeCloseTo(LABS[i].value / 100, 1));
    // Outermost first: the first track is the longest
    expect(tracks[0].getTotalLength()).toBeGreaterThan(tracks[1].getTotalLength());
    expect(values(el)).toEqual(["Genomics 82%", "Imaging 64%", "Proteomics 91%", "Neuro 47%"]);
    expect(el.querySelector(".tc-chart__value[data-strong]")!.textContent).toBe("Proteomics 91%");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Genomics 82%, Imaging 64%, Proteomics 91%, Neuro 47%");
  });

  test("max, format, highlight and the tooltip's share of the target", async () => {
    const el = await drawn(await make({ still: true }));
    el.max = 200;
    el.format = "integer";
    el.unit = " runs";
    el.highlight = "Imaging";
    await settle();
    expect(bars(el)[1].style.stroke).toBe("var(--tc-plot-accent)");
    key(plot(el), "ArrowRight");
    await settle();
    expect([...el.querySelectorAll(".tc-chart__tip-value")].map((v) => v.textContent)).toEqual(["82 runs", "41%"]);
    expect(el.querySelector(".ui-rbr__focus")).not.toBeNull();
    const t = el.querySelector<SVGPathElement>(".ui-rbr__track")!;
    expect(bars(el)[0].getTotalLength() / t.getTotalLength()).toBeCloseTo(0.41, 1);
  });

  test("a full circle writes the emphasised value in the middle instead of naming the rings", async () => {
    const el = await drawn(await make({ still: true, data: LABS.slice(0, 2) }));
    el.sweep = 360;
    await settle();
    expect(values(el)).toEqual(["82%"]);
    expect(el.querySelector(".ui-rbr__centre")).not.toBeNull();
    el.hideLabels = true;
    await settle();
    expect(values(el)).toEqual([]);
    expect(bars(el)[0].getTotalLength()).toBeGreaterThan(0);
  });

  test("the entrance sweeps round from the start, then a data change glides and a removed ring leaves", async () => {
    const el = await drawn(await make());
    const len = () => bars(el)[0]?.getTotalLength() ?? 0;
    await expect.poll(len, { timeout: 4000 }).toBeGreaterThan(300);
    const full = len();
    el.data = [{ label: "Genomics", value: 20 }, ...LABS.slice(1, 3)];
    await settle();
    await expect.poll(len, { timeout: 4000 }).toBeLessThan(full / 2);
    await expect.poll(() => el.querySelectorAll(".ui-rbr__track").length, { timeout: 4000 }).toBe(3);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    const props = { title: "Labs", data: LABS, still: true, sweep: 180, onMarkClick: (e: { label: string }) => clicks.push(e.label) };
    await act(async () => root.render(React.createElement(RadialBarChart, { ...props, view: "table" })));
    await settle();
    const el = host.querySelector<TcRadialBarChart>("tc-radial-bar-chart")!;
    expect(el.heading).toBe("Labs");
    expect(el.sweep).toBe(180);
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(RadialBarChart, props)));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Genomics"]);
    await act(async () => root.unmount());
    host.remove();
  });
});

const GOALS = [
  { label: "Reviews", value: 6, target: 8 },
  { label: "Interviews", value: 4, target: 3 },
  { label: "Hours logged", value: 5.5, target: 7 },
];
const rings = (o: { look?: "standard" | "clean"; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcRadialBarChart>(
    html`<div style="width: 480px"><tc-radial-bar-chart look=${o.look ?? "standard"} ?still=${o.still} heading="Today's goals" variant="rings" .target=${"target"} .data=${o.data ?? GOALS}></tc-radial-bar-chart></div>`,
  ).then((w) => w.querySelector("tc-radial-bar-chart")!);
const tiles = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-rbr__tile")];
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;

describe("tc-radial-bar-chart: activity rings", () => {
  test("full rings in the categorical inks, each filled towards its own target; past it, a darker lap; a glyph where each starts", async () => {
    const el = await drawn(await rings({ still: true }));
    expect(el.getAttribute("variant")).toBe("rings");
    const b = bars(el);
    expect(b.map((p) => p.style.stroke)).toEqual(["var(--tc-plot-ink-1)", "var(--tc-plot-ink-2)", "var(--tc-plot-ink-3)"]);
    const tracks = [...el.querySelectorAll<SVGPathElement>(".ui-rbr__track")];
    expect(b[0].getTotalLength() / tracks[0].getTotalLength()).toBeCloseTo(6 / 8, 1);
    expect(b[1].getTotalLength() / tracks[1].getTotalLength()).toBeCloseTo(1, 1);
    expect(b[2].getTotalLength() / tracks[2].getTotalLength()).toBeCloseTo(5.5 / 7, 1);
    // Interviews are past their target: a second lap of a third
    const laps = [...el.querySelectorAll<SVGPathElement>(".ui-rbr__lap")];
    expect(laps).toHaveLength(1);
    expect(laps[0].getTotalLength() / tracks[1].getTotalLength()).toBeCloseTo(1 / 3, 1);
    expect([...el.querySelectorAll(".ui-rbr__glyph")].map((t) => t.textContent)).toEqual(["R", "I", "H"]);
    // No names in the corner: the tiles name them
    expect(el.querySelectorAll(".tc-chart__value")).toHaveLength(0);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Reviews 6 of 8, Interviews 4 of 3, Hours logged 5.5 of 7");
  });

  test("a tile per ring: its name and its value against its target, with the unit; glyph and format can be set", async () => {
    const el = await drawn(await rings({ still: true }));
    expect(el.querySelector(".ui-rbr__tiles")!.getAttribute("aria-label")).toBe("Rings");
    expect(tiles(el).map((t) => t.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Reviews 6 / 8", "Interviews 4 / 3", "Hours logged 5.5 / 7"]);
    expect(tiles(el).map((t) => t.tabIndex)).toEqual([0, -1, -1]);
    el.unit = " h";
    el.glyph = (d: Record<string, unknown>) => String(d.label).slice(0, 2);
    await settle();
    expect(tiles(el)[2].textContent!.replace(/\s+/g, " ").trim()).toBe("Hours logged 5.5 / 7 h");
    expect([...el.querySelectorAll(".ui-rbr__glyph")].map((t) => t.textContent)).toEqual(["Re", "In", "Ho"]);
    // Without a target field, each ring's target is max
    el.target = undefined;
    el.max = 10;
    await settle();
    expect(tiles(el)[0].textContent!.replace(/\s+/g, " ").trim()).toBe("Reviews 6 / 10 h");
  });

  test("pointing at a tile isolates its ring; pointing at a ring marks its tile", async () => {
    const el = await drawn(await rings({ still: true }));
    tiles(el)[1].dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    const op = () => [...el.querySelectorAll(".ui-rbr__ring")].map((g) => Number(g.getAttribute("opacity")));
    expect(op()).toEqual([0.38, 1, 0.38]);
    expect(tiles(el)[1].hasAttribute("data-active")).toBe(true);
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("Interviews");
    expect([...el.querySelectorAll(".tc-chart__tip-value")].map((v) => v.textContent)).toEqual(["4", "3", "133%"]);
    tiles(el)[1].dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(op()).toEqual([1, 1, 1]);
    el.querySelectorAll(".ui-rbr__ring")[2].dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(tiles(el).map((t) => t.hasAttribute("data-active"))).toEqual([false, false, true]);
  });

  test("the tiles are one tab stop: arrows move, each ring announced; Enter picks it; Escape lets go; leaving lets go", async () => {
    const el = await drawn(await rings({ still: true }));
    const clicks: string[] = [];
    el.addEventListener("tc-mark-click", (e) => clicks.push((e as CustomEvent).detail.event.label));
    tiles(el)[0].focus();
    await settle();
    expect(status(el)).toMatch(/^Reviews: 6 of 8, 1 of 3/);
    expect(el.querySelector(".ui-rbr__focus")).not.toBeNull();
    tiles(el)[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    await expect.poll(() => document.activeElement).toBe(tiles(el)[1]);
    await settle();
    expect(status(el)).toMatch(/^Interviews: 4 of 3, 2 of 3/);
    expect(tiles(el).map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
    tiles(el)[1].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
    await expect.poll(() => document.activeElement).toBe(tiles(el)[2]);
    tiles(el)[2].click();
    expect(clicks).toEqual(["Hours logged"]);
    tiles(el)[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await settle();
    expect(el.querySelector(".tc-chart__tip")).toBeNull();
    tiles(el)[1].focus();
    await settle();
    expect(el.querySelector(".tc-chart__tip")).not.toBeNull();
    tiles(el)[1].blur();
    await settle();
    expect(el.querySelector(".tc-chart__tip")).toBeNull();
  });

  test("the default variant has no tiles, laps or glyphs and stays as it was", async () => {
    const el = await drawn(await make({ still: true }));
    expect(el.querySelector(".ui-rbr__tiles, .ui-rbr__lap, .ui-rbr__glyph")).toBeNull();
    expect(values(el)).toEqual(["Genomics 82%", "Imaging 64%", "Proteomics 91%", "Neuro 47%"]);
  });

  test("the entrance sweeps past the target into the lap; narrow, the tiles wrap", async () => {
    const el = await drawn(await rings());
    await expect.poll(() => el.querySelectorAll(".ui-rbr__lap").length, { timeout: 4000 }).toBe(1);
    el.parentElement!.style.width = "260px";
    await settle();
    const tops = tiles(el).map((t) => Math.round(t.getBoundingClientRect().top));
    expect(new Set(tops).size).toBeGreaterThan(1);
  });

  test("React wrapper: variant and target reach the element; picking a tile fires onMarkClick", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "480px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(RadialBarChart, { title: "Goals", variant: "rings", data: GOALS, target: "target", still: true, onMarkClick: (e: { label: string }) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcRadialBarChart>("tc-radial-bar-chart")!;
    await drawn(el);
    expect(el.variant).toBe("rings");
    tiles(el)[1].click();
    expect(clicks).toEqual(["Interviews"]);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const look of ["standard", "clean"] as const)
    test(`axe: ${look}, light and dark, with a tile focused`, async () => {
      for (const scheme of ["light", "dark"]) {
        const el = await drawn(await rings({ look, still: true }));
        const wrap = el.parentElement!;
        wrap.style.colorScheme = scheme;
        tiles(el)[1].focus();
        await finish(wrap);
        const r = await axe.run(wrap);
        expect(r.violations.flatMap((v) => v.nodes.map((n) => `${scheme} ${v.id} ${n.html.slice(0, 90)}`))).toEqual([]);
        wrap.remove();
      }
    });
});
