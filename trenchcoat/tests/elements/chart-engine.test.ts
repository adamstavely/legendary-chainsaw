/*
 * The chart engine (internal/chart, ported from ztd-charts): CSV and data shapes, number and date formats, scales and
 * ticks, text widths, series, highlight, the lazy array, the layouts (treemap, sunburst, Sankey, chord, stack,
 * statistics) and the motion engine. Ported from ztd-charts' own tests, without the React and Korean cases.
 */
import { describe, expect, it } from "vitest";
import { getter, strGetter, toNumber } from "../../src/elements/internal/chart/accessor";
import { chordLayout } from "../../src/elements/internal/chart/chord";
import { formatCompact, formatCurrency, formatNumber, formatPercent, makeFormatter, toDate } from "../../src/elements/internal/chart/format";
import { TAU } from "../../src/elements/internal/chart/geometry";
import { buildTree, leaves, partitionAngles, squarify } from "../../src/elements/internal/chart/hierarchy";
import { resolveHighlight } from "../../src/elements/internal/chart/highlight";
import { lazyArray } from "../../src/elements/internal/chart/lazy";
import { MotionEngine, resample } from "../../src/elements/internal/chart/motion";
import { dataSignature, fromObjects, fromRows, lttb, melt, normalizeData, parseCSV, pluck, toCSV } from "../../src/elements/internal/chart/parse";
import { sankeyLayout } from "../../src/elements/internal/chart/sankey";
import { fitDomain, niceStep, robustMax, scaleLinear, ticksFor, timeTicks } from "../../src/elements/internal/chart/scale";
import { prepSeries } from "../../src/elements/internal/chart/series";
import { insideOut, stack } from "../../src/elements/internal/chart/stack";
import { beeswarm, boxStats, kde, ranks } from "../../src/elements/internal/chart/stats";
import { dodgeVertical, textWidth, truncate, wrapLines } from "../../src/elements/internal/chart/text";

const treemapRows = [
  { category: "Running shoes", product: "Cushion Run", share: 22 },
  { category: "Running shoes", product: "Race X", share: 14 },
  { category: "Running shoes", product: "Daily Run", share: 10 },
  { category: "Outdoor", product: "Trail", share: 14 },
  { category: "Outdoor", product: "Hiking boots", share: 10 },
  { category: "Apparel", product: "Jacket", share: 11 },
  { category: "Apparel", product: "T-shirt", share: 7 },
  { category: "Gear", product: "Socks", share: 7 },
  { category: "Gear", product: "Insoles", share: 5 },
];
const sunburstRows = [
  { channel: "Search", campaign: "Brand", spend: 18 },
  { channel: "Search", campaign: "Generic", spend: 30 },
  { channel: "Display", campaign: "All products", spend: 25 },
  { channel: "Display", campaign: "Bestsellers", spend: 12 },
  { channel: "Video", campaign: "Remarketing", spend: 9 },
  { channel: "Video", campaign: "New users", spend: 6 },
];
const sankeyRows = [
  { source: "Search", target: "Product page", value: 4200 },
  { source: "Social", target: "Product page", value: 2600 },
  { source: "Social", target: "Promo page", value: 1400 },
  { source: "Direct", target: "Product page", value: 1800 },
  { source: "Direct", target: "Promo page", value: 600 },
  { source: "Product page", target: "Cart", value: 3900 },
  { source: "Product page", target: "Drop-off", value: 4700 },
  { source: "Promo page", target: "Cart", value: 900 },
  { source: "Promo page", target: "Drop-off", value: 1100 },
  { source: "Cart", target: "Purchase", value: 2900 },
  { source: "Cart", target: "Drop-off ", value: 1900 },
];

describe("parseCSV", () => {
  it("reads numbers, empty cells and quotes", () => {
    expect(parseCSV('month,sales,note\nJan,"1,200",\nFeb,1350,"has, comma"\n')).toEqual([
      { month: "Jan", sales: 1200, note: null },
      { month: "Feb", sales: 1350, note: "has, comma" },
    ]);
  });
  it("line breaks in cells and escaped quotes", () => {
    expect(parseCSV('a,b\n"line\nbreak","she said ""hi"""')[0]).toEqual({ a: "line\nbreak", b: 'she said "hi"' });
  });
  it("BOM, CRLF, tab and semicolon delimiters", () => {
    expect(parseCSV("﻿x,y\r\n1,2\r\n")).toEqual([{ x: 1, y: 2 }]);
    expect(parseCSV("x\ty\n1\t2")).toEqual([{ x: 1, y: 2 }]);
    expect(parseCSV("x;y\n1;2")).toEqual([{ x: 1, y: 2 }]);
  });
  it("percentages and currency are numbers; codes with leading zeros stay strings", () => {
    expect(parseCSV('rate,price,zip,neg\n12%,"$5,000",01234,(42)')[0]).toEqual({ rate: 12, price: 5000, zip: "01234", neg: -42 });
  });
  it("renames repeated headers; header: false keys by index", () => {
    expect(Object.keys(parseCSV("a,a,\n1,2,3")[0])).toEqual(["a", "a_2", "col3"]);
    expect(parseCSV("1,2", { header: false })).toEqual([{ "0": 1, "1": 2 }]);
  });
  it("typed: false keeps strings", () => {
    expect(parseCSV("a\n007", { typed: false })).toEqual([{ a: "007" }]);
  });
  it("round-trips through toCSV", () => {
    const rows = [{ name: 'quote " and, comma', value: 1 }];
    expect(parseCSV(toCSV(rows))).toEqual(rows);
  });
  it("headers a,a,a_2 don't lose a column", () => {
    expect(parseCSV("a,a,a_2\n1,2,3")).toEqual([{ a: 1, a_2: 2, a_2_2: 3 }]);
    expect(parseCSV(",col1\n1,2")).toEqual([{ col1: 1, col1_2: 2 }]);
  });
  it('a quote after leading spaces (a, "b, c") is a quoted cell', () => {
    expect(parseCSV('name,desc\na, "b, c"')).toEqual([{ name: "a", desc: "b, c" }]);
    expect(parseCSV('a,b\n"x" , "y"', { typed: false })).toEqual([{ a: "x ", b: "y" }]);
  });
});

describe("data shapes", () => {
  it("fromRows: a header row, or names given", () => {
    expect(fromRows([["month", "sales"], ["Jan", "1200"]])).toEqual([{ month: "Jan", sales: 1200 }]);
    expect(fromRows([["Jan", 10]], ["month", "sales"])).toEqual([{ month: "Jan", sales: 10 }]);
  });
  it("fromObjects: a key–value map and columns", () => {
    expect(fromObjects({ Mobile: 72, Desktop: 23 })).toEqual([
      { label: "Mobile", value: 72 },
      { label: "Desktop", value: 23 },
    ]);
    expect(fromObjects({ month: ["Jan", "Feb"], sales: [1, 2] })).toEqual([
      { month: "Jan", sales: 1 },
      { month: "Feb", sales: 2 },
    ]);
  });
  it("melt: wide to long", () => {
    expect(melt([{ month: "Jan", search: 1, social: 2 }], ["month"])).toEqual([
      { month: "Jan", series: "search", value: 1 },
      { month: "Jan", series: "social", value: 2 },
    ]);
  });
  it("normalizeData: many response shapes", () => {
    expect(normalizeData({ data: [{ a: 1 }] })).toEqual([{ a: 1 }]);
    expect(normalizeData({ rows: [[1]], columns: [{ name: "a" }] })).toEqual([{ a: 1 }]);
    expect(normalizeData({ values: [["a"], ["2"]] })).toEqual([{ a: 2 }]);
    expect(normalizeData("a,b\n1,2")).toEqual([{ a: 1, b: 2 }]);
    expect(normalizeData('[{"a":1}]')).toEqual([{ a: 1 }]);
    expect(normalizeData([3, 4])).toEqual([
      { label: "1", value: 3 },
      { label: "2", value: 4 },
    ]);
    expect(normalizeData(null)).toEqual([]);
  });
  it("pluck and dataSignature", () => {
    expect(pluck({ a: { b: [1] } }, "a.b")).toEqual([1]);
    const big = Array.from({ length: 5000 }, (_, i) => ({ i }));
    expect(dataSignature(big)).toBe(dataSignature(big.slice()));
    expect(dataSignature([{ a: 1 }])).not.toBe(dataSignature([{ a: 2 }]));
  });
});

describe("toNumber and accessors", () => {
  it.each([
    ["1,234", 1234],
    [" 3.5 ", 3.5],
    ["12%", 12],
    ["₩5,000", 5000],
    ["+7", 7],
    ["(12)", -12],
    ["1234.50", 1234.5],
    [true, 1],
  ])("%s → %s", (input, out) => expect(toNumber(input)).toBe(out));
  it.each([["abc"], [""], [undefined], ["$"], ["%"], [","], ["()"], ["1,2,3"], ["12,34"], ["1.234,56"]])("toNumber(%j) is NaN", (s) => expect(toNumber(s)).toBeNaN());
  it("reads correct thousands commas and signs", () => {
    expect(toNumber("1,234,567.5")).toBe(1234567.5);
    expect(toNumber("(1,234)")).toBe(-1234);
    expect(toNumber("$0")).toBe(0);
  });
  it("a Date category is its local date (not a day off through UTC)", () => {
    const g = strGetter<{ d: Date }>("d", "d");
    expect(g({ d: new Date(2024, 2, 15) }, 0)).toBe("2024-03-15");
    expect(g({ d: new Date(2024, 2, 15, 23, 59) }, 0)).toBe("2024-03-15");
  });
  it("Object.prototype names aren't fields; class getters and an own constructor are", () => {
    class Item {
      constructor(private readonly v: number) {}
      get value() {
        return this.v;
      }
    }
    expect(getter(undefined, "constructor")({ a: 1 }, 0)).toBeUndefined();
    expect(getter(undefined, "toString")({ a: 1 }, 0)).toBeUndefined();
    expect(getter(undefined, "a.constructor")({ a: { b: 1 } }, 0)).toBeUndefined();
    expect(getter(undefined, "value")(new Item(7), 0)).toBe(7);
    expect(getter(undefined, "constructor")({ constructor: "x" }, 0)).toBe("x");
  });
});

describe("LTTB", () => {
  it("keeps the ends and the count", () => {
    const pts = Array.from({ length: 10_000 }, (_, i) => ({ x: i, y: Math.sin(i / 50) + (i === 5000 ? 10 : 0) }));
    const out = lttb(pts, 500);
    expect(out).toHaveLength(500);
    expect(out[0]).toBe(pts[0]);
    expect(out[out.length - 1]).toBe(pts[pts.length - 1]);
    expect(out.some((p) => p.x === 5000)).toBe(true);
  });
});

describe("number and date formats", () => {
  it("compact numbers are K, M, B", () => {
    expect(formatCompact(12345)).toBe("12.3K");
    expect(formatCompact(3_400_000)).toBe("3.4M");
    expect(formatCompact(1_200_000_000)).toBe("1.2B");
    expect(formatCompact(-0.03)).toBe("0");
    expect(makeFormatter("compact")(1234)).toBe("1.2K");
  });
  it("percentages have a decimal only under 1%", () => {
    expect(formatPercent(8.06)).toBe("8%");
    expect(formatPercent(0.42)).toBe("0.4%");
    expect(formatPercent(NaN)).toBe("-");
    expect(makeFormatter("ratio")(NaN)).toBe("-");
  });
  it("currency and format names", () => {
    expect(formatCurrency(5000)).toBe("$5,000.00");
    expect(formatCurrency(5000, { currency: "JPY" })).toBe("¥5,000");
    expect(makeFormatter("integer")(1234.6)).toBe("1,235");
    expect(makeFormatter("ratio")(0.25)).toBe("25%");
    expect(makeFormatter({ suffix: " people", maximumFractionDigits: 0 })(1234)).toBe("1,234 people");
    expect(makeFormatter({ style: "currency", currency: "USD" })(1.5)).toBe("$1.50");
    expect(formatNumber(1.5, { style: "currency", currency: "USD" })).toBe("$1.50");
  });
  it("minimumFractionDigits above 1 doesn't throw", () => {
    expect(formatNumber(1.5, { minimumFractionDigits: 2 })).toBe("1.50");
    expect(formatCompact(12345, { minimumFractionDigits: 2 })).toBe("12.35K");
    expect(makeFormatter({ minimumFractionDigits: 3 })(1)).toBe("1.000");
  });
  it("date strings", () => {
    expect(toDate("2025-03")?.getMonth()).toBe(2);
    expect(toDate("2025-03-15")?.getDate()).toBe(15);
    expect(toDate("2025.03.15")?.getDate()).toBe(15);
    expect(toDate(2024)?.getFullYear()).toBe(2024);
    expect(toDate("unknown")).toBeNull();
  });
  it("eight digits 19000101–21001231 are dates; real ms timestamps stay as they are", () => {
    expect(toDate(20240315)?.toDateString()).toBe(new Date(2024, 2, 15).toDateString());
    expect(toDate("20240315")?.getDate()).toBe(15);
    expect(toDate(1_700_000_000_000)?.toISOString()).toBe("2023-11-14T22:13:20.000Z");
    expect(toDate(30_000_101)?.getTime()).toBe(30_000_101);
  });
  it("a day that doesn't exist is null, not next month", () => {
    for (const v of ["2024-02-30", "2024-13-45", "2024-13", "2024.02.30", 20240230, "20241301"]) expect(toDate(v)).toBeNull();
    expect(toDate("2024-02-29")?.getDate()).toBe(29);
  });
});

describe("scales and ticks", () => {
  it("niceStep steps by 1, 2 and 5", () => {
    expect(niceStep(100, 4)).toBe(20);
    expect(niceStep(4346, 3)).toBe(2000);
    expect(niceStep(0.9, 4)).toBe(0.2);
  });
  it("fitDomain leaves no empty tick band", () => {
    expect(fitDomain(0, 4100, 3)).toEqual([0, 4100 + 4100 * 0.07]);
    expect(fitDomain(0, 98, 4)).toEqual([0, 100]);
    expect(fitDomain(12, 30, 4, { zero: false })[0]).toBeLessThanOrEqual(12);
  });
  it("fitDomain's step matches the ticks' step: fitDomain(0, 5.5)", () => {
    const d = fitDomain(0, 5.5);
    expect(d).toEqual([0, 6]);
    expect(scaleLinear(d, [0, 1]).ticks(4)).toEqual([0, 2, 4, 6]);
  });
  it("the top is a tick, or the value plus margin when more than 30% of a step from one (0–1000)", () => {
    for (let hi = 1; hi <= 1000; hi += 0.5) {
      const [a, b] = fitDomain(0, hi, 4);
      const s = niceStep(b - a, 4);
      const nHi = Math.ceil(hi / s - 1e-9) * s;
      expect(b === nHi || nHi - hi > s * 0.3, `hi=${hi} → [${a}, ${b}], step ${s}`).toBe(true);
    }
  });
  it("ticksFor", () => {
    expect(ticksFor(0, 100, 4)).toEqual([0, 20, 40, 60, 80, 100]);
  });
  it("timeTicks picks a unit for the span", () => {
    const ticks = timeTicks(new Date(2025, 0, 1).getTime(), new Date(2025, 11, 1).getTime(), 6);
    expect(ticks.length).toBeGreaterThanOrEqual(4);
    expect(ticks[0].label).toBe("Jan");
  });
  it("month ticks across a new year write the year in four digits", () => {
    const labels = timeTicks(new Date(2023, 9, 1).getTime(), new Date(2024, 5, 1).getTime(), 6).map((t) => t.label);
    expect(labels).toContain("Jan 2024");
    expect(labels.some((l) => /\b\d{2}$/.test(l) && !/\d{4}$/.test(l))).toBe(false);
  });
  it("robustMax ignores an outlier", () => {
    expect(robustMax(Array.from({ length: 100 }, (_, i) => (i === 99 ? 1000 : i)))).toBeLessThan(100);
  });
});

describe("text widths", () => {
  it("within 10% of widths measured in Chrome", () => {
    const real: [string, number, number][] = [
      ["10,000", 700, 3.34],
      ["PMax", 400, 2.5],
      ["−380", 400, 2.384],
    ];
    for (const [s, w, em] of real) expect(Math.abs(textWidth(s, 100, w) / 100 - em) / em).toBeLessThan(0.1);
  });
  it("truncate fits the width", () => {
    const t = truncate("A very long campaign name indeed", 60, 12);
    expect(t.endsWith("…")).toBe(true);
    expect(textWidth(t, 12)).toBeLessThanOrEqual(60);
  });
  it("truncate gives \"\" rather than an unreadable stub, and measures without trailing spaces", () => {
    expect(truncate("T-shirt", textWidth("T…", 11), 11)).toBe("");
    expect(truncate("Daily Run", textWidth("Dai…", 11) + 0.1, 11)).toBe("Dai…");
    expect(truncate("Drop-off ", textWidth("Drop-off", 11), 11)).toBe("Drop-off");
  });
  it("truncate never cuts a surrogate pair", () => {
    const lone = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
    for (const s of ["Ab😀😀😀😀😀", "😀😀😀😀😀😀abc", "abc😀😀😀😀"]) {
      for (let w = 10; w <= 80; w += 1) expect(lone.test(truncate(s, w, 11)), `${s} @${w}`).toBe(false);
    }
  });
  it("wrapLines splits at spaces and only the last line gets an ellipsis", () => {
    const w = textWidth("profit (100M)", 11, 700) + 1;
    expect(wrapLines("Operating profit (100M)", w, 11, 2, 700)).toEqual(["Operating", "profit (100M)"]);
    expect(wrapLines("Sales", w, 11, 2, 700)).toEqual(["Sales"]);
    const one = wrapLines("Operating profit (100M)", w, 11, 1, 700);
    expect(one).toHaveLength(1);
    expect(one[0].endsWith("…")).toBe(true);
  });
  it("dodgeVertical keeps the minimum gap", () => {
    const ys = [...dodgeVertical([10, 11, 12, 50], 14, 0, 200)].sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(13.99);
  });
});

describe("series and highlight", () => {
  it("long tables, wide tables and date x", () => {
    const long = prepSeries([{ m: "2025-01", s: "a", v: 1 }, { m: "2025-02", s: "a", v: 2 }, { m: "2025-01", s: "b", v: 3 }], "m", "v", "s");
    expect(long.type).toBe("date");
    expect(long.series).toEqual(["a", "b"]);
    expect(long.values[1][1]).toBeNaN();
    const wide = prepSeries([{ m: "Jan", a: 1, b: 2 }], "m", ["a", "b"], undefined);
    expect(wide.series).toEqual(["a", "b"]);
    expect(wide.values[1][0]).toBe(2);
  });
  it("small decimals don't collapse to the same label", () => {
    expect(prepSeries([{ x: 0.001, y: 1 }, { x: 0.002, y: 2 }, { x: 0.25, y: 3 }], "x", "y", undefined).labels).toEqual(["0.001", "0.002", "0.25"]);
  });
  it("four-digit integers only are years, without grouping", () => {
    expect(prepSeries([{ x: 2019, y: 1 }, { x: 2020, y: 2 }], "x", "y", undefined).labels).toEqual(["2019", "2020"]);
    expect(prepSeries([{ x: 2019, y: 1 }, { x: 12000, y: 2 }], "x", "y", undefined).labels).toEqual(["2,019", "12,000"]);
  });
  it("resolveHighlight", () => {
    const labels = ["a", "b", "c"];
    const values = [3, 9, 1];
    expect([...resolveHighlight(undefined, labels, labels, values)]).toEqual([1]);
    expect([...resolveHighlight("c", labels, labels, values)]).toEqual([2]);
    expect([...resolveHighlight(["a", 2], labels, labels, values)].sort()).toEqual([0, 2]);
    expect([...resolveHighlight("none", labels, labels, values)]).toEqual([]);
    expect([...resolveHighlight((d: string) => d !== "b", labels, labels, values)]).toEqual([0, 2]);
  });
});

describe("lazyArray", () => {
  it("makes only the slots read, and array methods see no holes", () => {
    const made: number[] = [];
    const a = lazyArray(5, (i) => (made.push(i), i * 10));
    expect(a.length).toBe(5);
    expect(a[3]).toBe(30);
    expect(made).toEqual([3]);
    expect(a.slice(0, 2)).toEqual([0, 10]);
    expect(a.map((v) => v + 1)).toEqual([1, 11, 21, 31, 41]);
    expect(a.indexOf(40)).toBe(4);
    expect(1 in a).toBe(true);
    expect(5 in a).toBe(false);
    expect((a as unknown as Record<string, unknown>)[""]).toBeUndefined();
    expect(made.sort()).toEqual([0, 1, 2, 3, 4]);
  });
  it("string highlights work on lazy labels", () => {
    const labels = lazyArray(3, (i) => ["a", "b", "c"][i]);
    expect([...resolveHighlight("b", labels, labels, [1, 2, 3])]).toEqual([1]);
  });
});

describe("squarify", () => {
  it("areas are proportional to values and fill the box", () => {
    const vals = [22, 14, 10, 14, 10, 11, 7, 7, 5];
    const rects = squarify(vals, { x: 0, y: 0, w: 400, h: 300 });
    const total = vals.reduce((a, b) => a + b, 0);
    rects.forEach((r, i) => expect(r.w * r.h).toBeCloseTo((vals[i] / total) * 400 * 300, 3));
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(-1e-9);
      expect(r.y + r.h).toBeLessThanOrEqual(300 + 1e-6);
    }
    expect(Math.max(...rects.map((r) => Math.max(r.w / r.h, r.h / r.w)))).toBeLessThan(4);
  });
});

describe("hierarchy", () => {
  it("flat tables (group), paths and nested children", () => {
    const flat = buildTree(treemapRows, { group: "category", label: "product", value: "share" });
    expect(flat.value).toBe(100);
    expect(flat.children.map((c) => c.label)).toEqual(["Running shoes", "Outdoor", "Apparel", "Gear"]);
    const path = buildTree([{ a: "x", b: "y", c: "z", v: 2 }], { path: ["a", "b"], label: "c", value: "v" });
    expect(leaves(path)[0].id).toBe("x/y/z");
    const nested = buildTree([{ label: "a", children: [{ label: "b", value: 3 }, { label: "c", value: 1 }] }], {});
    expect(nested.children[0].value).toBe(4);
  });
  it("partitionAngles divides a full turn", () => {
    const arcs = partitionAngles(buildTree(sunburstRows, { group: "channel", label: "campaign", value: "spend" }));
    const top = arcs.filter((a) => a.depth === 1);
    expect(top[top.length - 1].a1).toBeCloseTo(TAU, 9);
    expect(arcs.filter((a) => a.depth === 2).reduce((s, a) => s + (a.a1 - a.a0), 0)).toBeCloseTo(TAU, 9);
  });
});

describe("sankey", () => {
  const lay = sankeyLayout([], sankeyRows, { width: 600, height: 300, nodeWidth: 10, nodePadding: 12 });
  it("nodes stay inside and don't overlap", () => {
    for (const n of lay.nodes) {
      expect(n.y0).toBeGreaterThanOrEqual(-0.5);
      expect(n.y1).toBeLessThanOrEqual(300.5);
      expect(n.x1).toBeLessThanOrEqual(600.01);
    }
    const byLayer = new Map<number, typeof lay.nodes>();
    lay.nodes.forEach((n) => byLayer.set(n.layer, [...(byLayer.get(n.layer) ?? []), n]));
    for (const col of byLayer.values()) {
      const s = [...col].sort((a, b) => a.y0 - b.y0);
      for (let i = 1; i < s.length; i++) expect(s[i].y0).toBeGreaterThanOrEqual(s[i - 1].y1 - 1e-6);
    }
  });
  it("what flows in flows out", () => {
    const mid = lay.nodes.find((n) => n.id === "Product page")!;
    expect(mid.inLinks.reduce((a, l) => a + l.value, 0)).toBe(mid.outLinks.reduce((a, l) => a + l.value, 0));
    expect(lay.nodes.find((n) => n.id === "Purchase")!.layer).toBe(Math.max(...lay.nodes.map((n) => n.layer)));
  });
});

describe("chord", () => {
  it("group angles plus gaps make a full turn", () => {
    const { groups, chords } = chordLayout(
      [
        [0, 5, 3],
        [2, 0, 4],
        [1, 1, 0],
      ],
      0.05,
    );
    expect(groups.reduce((a, g) => a + (g.a1 - g.a0), 0) + 0.05 * 3).toBeCloseTo(TAU, 9);
    expect(chords).toHaveLength(3);
  });
});

describe("stack", () => {
  it("zero and expand", () => {
    const v = [
      [1, 2],
      [3, 2],
    ];
    expect(stack(v, "zero").y1[1]).toEqual([4, 4]);
    expect(stack(v, "expand").y1[1]).toEqual([100, 100]);
    expect(stack(v, "expand").y1[0]).toEqual([25, 50]);
  });
  it("wiggle keeps the thickness, and insideOut is a permutation", () => {
    const vals = [
      [1, 4, 9, 4, 1],
      [5, 5, 5, 5, 5],
      [9, 4, 1, 4, 9],
    ];
    const s = stack(vals, "wiggle");
    for (let k = 0; k < 5; k++) expect(s.y1[2][k] - s.y0[0][k]).toBeCloseTo(vals[0][k] + vals[1][k] + vals[2][k], 9);
    expect([...insideOut(vals)].sort()).toEqual([0, 1, 2]);
  });
});

describe("statistics", () => {
  it("boxStats", () => {
    const st = boxStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 100]);
    expect(st.median).toBe(5.5);
    expect(st.outliers).toEqual([100]);
    expect(st.hi).toBe(9);
  });
  it("kde's area is close to 1", () => {
    const vals = Array.from({ length: 400 }, (_, i) => Math.sin(i) * 10 + 50);
    const xs = Array.from({ length: 400 }, (_, i) => i * 0.25);
    const area = kde(vals, xs).reduce((a, v) => a + v * 0.25, 0);
    expect(area).toBeGreaterThan(0.95);
    expect(area).toBeLessThan(1.05);
  });
  it("beeswarm circles don't overlap", () => {
    const xs = Array.from({ length: 200 }, (_, i) => (i * 37) % 120);
    const r = 3;
    const ys = beeswarm(xs, r);
    for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) expect(Math.hypot(xs[i] - xs[j], ys[i] - ys[j])).toBeGreaterThan(2 * r - 1e-6);
  });
  const dense = Array.from({ length: 1500 }, (_, i) => Math.round(((Math.sin(i * 12.9898) * 43758.5453) % 1) * 50 + 50) * 2);
  it("beeswarm circles don't overlap when many share an x (including spots touching two)", () => {
    const r = 2;
    const ys = beeswarm(dense, r);
    const d = 2 * (r + 0.6);
    const idx = dense.map((_, i) => i).sort((a, b) => dense[a] - dense[b]);
    for (let a = 0; a < idx.length; a++)
      for (let b = a + 1; b < idx.length && dense[idx[b]] - dense[idx[a]] < d; b++) {
        const p = idx[a];
        const q = idx[b];
        expect(Math.hypot(dense[p] - dense[q], ys[p] - ys[q])).toBeGreaterThan(d - 1e-3);
      }
  });
  it("a full beeswarm band spreads overflow inside it rather than stacking it at the limit", () => {
    const spread = 18;
    const ys = beeswarm(dense, 2, { maxSpread: spread });
    for (const y of ys) expect(Math.abs(y)).toBeLessThanOrEqual(spread + 1e-9);
    expect(ys.filter((y) => Math.abs(Math.abs(y) - spread) < 1e-6).length).toBeLessThan(ys.length * 0.01);
    expect(ys.filter((y) => y > spread / 2).length).toBeGreaterThan(100);
    expect(ys.filter((y) => y < -spread / 2).length).toBeGreaterThan(100);
  });
  it("ranks give equal values the same rank", () => {
    expect(ranks([10, 30, 30, 5])).toEqual([3, 1, 1, 4]);
  });
});

describe("MotionEngine", () => {
  const mk = (to: number[], from?: number[]) => [{ key: "a", to, from, data: null }];
  it("a spring reaches its target within the duration without overshooting", () => {
    const e = new MotionEngine<null>();
    e.configure("spring", 900);
    e.hold(mk([100], [0]));
    e.start(0);
    let prev = 0;
    for (let t = 16; t <= 1100; t += 16) {
      e.step(t);
      const v = e.get("a")![0];
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(v).toBeLessThanOrEqual(100 + 1e-9);
      prev = v;
    }
    expect(e.get("a")![0]).toBe(100);
    expect(e.animating).toBe(false);
  });
  it("a target changed midway keeps position and velocity", () => {
    const e = new MotionEngine<null>();
    e.configure("spring", 900);
    e.hold(mk([100], [0]));
    e.start(0);
    e.step(200);
    const before = e.get("a")![0];
    e.step(216);
    const v1 = e.get("a")![0] - before;
    e.update(mk([20]), 216);
    e.step(216);
    expect(e.get("a")![0]).toBeCloseTo(before + v1, 6);
    e.step(232);
    const v2 = e.get("a")![0] - (before + v1);
    // The direction turns, but the first frame's speed carries on (no sudden stop)
    expect(Math.abs(v2 - v1)).toBeLessThan(Math.abs(v1) * 0.6 + 1);
  });
  it("easeOut ends on time", () => {
    const e = new MotionEngine<null>();
    e.configure("easeOut", 500);
    e.hold(mk([10], [0]));
    e.start(0);
    e.step(250);
    expect(e.get("a")![0]).toBeGreaterThan(5);
    e.step(500);
    expect(e.get("a")![0]).toBe(10);
  });
  it("delay, new items (enter) and removed items (exit)", () => {
    const e = new MotionEngine<string>();
    e.configure("easeOut", 100);
    e.hold([
      { key: "a", to: [1], from: [0], data: "a" },
      { key: "b", to: [1], from: [0], delay: 100, data: "b" },
    ]);
    e.start(0);
    e.step(50);
    expect(e.get("b")![0]).toBe(0);
    e.step(300);
    e.update([{ key: "b", to: [2], data: "b" }, { key: "c", to: [5], enter: [0], data: "c" }], 300);
    expect(e.items().find((i) => i.key === "a")?.exiting).toBe(true);
    e.step(600);
    expect(e.get("a")).toBeUndefined();
    expect(e.get("c")![0]).toBe(5);
  });
  it("sameTargets and resample", () => {
    const e = new MotionEngine<null>();
    e.snap(mk([1, 2]));
    expect(e.sameTargets(mk([1, 2]))).toBe(true);
    expect(e.sameTargets(mk([1, 3]))).toBe(false);
    expect(resample([0, 10], 3)).toEqual([0, 5, 10]);
  });
  it("items() keeps the order items first arrived in", () => {
    const e = new MotionEngine<null>();
    e.snap(["b", "a", "c"].map((key) => ({ key, to: [1], data: null })));
    e.update(["c", "a", "b", "d"].map((key) => ({ key, to: [2], data: null })), 0);
    expect(e.items().map((i) => i.key)).toEqual(["b", "a", "c", "d"]);
  });
  it("a spring doesn't visibly jump at the end of a long move", () => {
    const e = new MotionEngine<null>();
    e.configure("spring", 900);
    e.snap([{ key: "a", to: [0], data: null }]);
    e.update([{ key: "a", to: [500], data: null }], 0);
    let prev = 0;
    let t = 0;
    for (; t <= 5000 && e.animating; t += 1000 / 60) {
      prev = e.get("a")![0];
      e.step(t);
    }
    expect(e.animating).toBe(false);
    expect(e.get("a")![0]).toBe(500);
    expect(500 - prev).toBeLessThan(0.2);
    expect(t).toBeLessThan(900 * 2);
  });
});
