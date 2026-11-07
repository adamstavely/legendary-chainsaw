// @vitest-environment node
/*
 * Chart specs: checking one without drawing it, turning it into a chart's tag and properties (ztd's option names
 * included), data as rows, { values }, { csv } and { url }, and suggesting charts from the shape of some data.
 */
import { describe, expect, test } from "vitest";
import { chartType, chartTypes, resolveSpecData, specToElement, validateSpec } from "../../src/elements/internal/chart/spec";
import { profileData, suggestCharts } from "../../src/elements/internal/chart/suggest";

const LABS = [
  { lab: "Genomics", samples: 182 },
  { lab: "Imaging", samples: 96 },
  { lab: "Proteomics", samples: 124 },
];

describe("chart specs", () => {
  test("every type maps to a chart tag, by name or tag, with ztd's aliases", () => {
    expect(chartTypes.length).toBe(39);
    expect(new Set(chartTypes.map((t) => t.tag)).size).toBe(39);
    expect(chartType("bar")?.tag).toBe("tc-bar-chart");
    expect(chartType("tc-sankey-chart")?.type).toBe("sankey");
    expect(chartType("radialBar")?.tag).toBe("tc-radial-bar-chart");
    expect(chartType("scatter")?.tag).toBe("tc-bubble-chart");
    expect(chartType("gauge")?.tag).toBe("tc-gauge");
    expect(chartType("nope")).toBeUndefined();
  });

  test("a valid spec; and what's wrong with bad ones", () => {
    expect(validateSpec({ type: "bar", data: LABS, encoding: { x: "lab", y: "samples" } })).toEqual({ valid: true, errors: [], warnings: [] });
    const bad = validateSpec({ type: "bar", data: LABS, encoding: { x: "group", y: "lab", colour: "lab" } });
    expect(bad.valid).toBe(false);
    expect(bad.errors.map((e) => e.code)).toEqual(["missing-field", "not-numeric"]);
    expect(bad.warnings.map((w) => w.code)).toEqual(["unknown-channel"]);
    expect(validateSpec({ type: "pie", data: LABS }).errors[0].message).toMatch(/No field "label".*set encoding\.label/);
    expect(validateSpec({ type: "nope", data: [] }).errors[0].code).toBe("unknown");
    expect(validateSpec({ type: "bar", data: "x" }).errors[0].code).toBe("invalid");
    expect(validateSpec({ type: "bar", data: { url: "https://example.test/rows.json" }, encoding: { x: "lab", y: "samples" } }).valid).toBe(true);
    expect(validateSpec({ type: "line", data: [], encoding: {} }).warnings[0].code).toBe("empty");
  });

  test("a spec as a tag and properties: encoding, options, title; ztd's option names", () => {
    const { tag, props } = specToElement({
      type: "funnel",
      title: "Grant proposals",
      data: { values: [{ stage: "Drafted", n: 120 }] },
      encoding: { label: "stage", value: "n" },
      options: { showRates: false, animate: false, showLabels: false, tooltip: false, highlight: "max", width: 400 },
    });
    expect(tag).toBe("tc-funnel-chart");
    expect(props).toEqual({ hideRates: true, still: true, hideLabels: true, hideTooltip: true, highlight: "max", label: "stage", value: "n", heading: "Grant proposals", data: [{ stage: "Drafted", n: 120 }] });
    expect(specToElement({ type: "dumbbell", data: [], options: { labels: ["2025", "2026"] } }).props).toMatchObject({ startLabel: "2025", endLabel: "2026" });
    expect(specToElement({ type: "line", data: [], options: { brush: true } }).props.brush).toBe("select");
    expect(() => specToElement({ type: "bar", data: { url: "x" } })).toThrow(/resolveSpecData/);
  });

  test("gauge, heatmap, radar and sparkline: rows reshaped into their properties", () => {
    expect(specToElement({ type: "gauge", data: [{ uptime: 97.2, goal: 99 }], encoding: { value: "uptime", target: "goal" }, options: { max: 100 } }).props).toEqual({ value: 97.2, target: 99, max: 100 });
    const heat = specToElement({ type: "heatmap", data: [{ day: "Mon", hour: "9", runs: 3 }, { day: "Mon", hour: "10", runs: 5 }, { day: "Tue", hour: "9", runs: 2 }], encoding: { x: "hour", y: "day", value: "runs" } }).props;
    expect(heat).toEqual({ rows: ["Mon", "Tue"], columns: ["9", "10"], values: [[3, 5], [2, null]] });
    const long = specToElement({ type: "radar", data: [{ m: "Speed", v: 4, team: "A" }, { m: "Care", v: 3, team: "A" }, { m: "Speed", v: 2, team: "B" }], encoding: { axis: "m", value: "v", series: "team" } }).props;
    expect(long).toEqual({ axes: ["Speed", "Care"], series: [{ name: "A", values: [4, 3] }, { name: "B", values: [2, null] }] });
    const wide = specToElement({ type: "radar", data: [{ m: "Speed", a: 4, b: 2 }, { m: "Care", a: 3, b: 5 }], encoding: { axis: "m", value: ["a", "b"] } }).props;
    expect(wide.series).toEqual([{ name: "a", values: [4, 3] }, { name: "b", values: [2, 5] }]);
    expect(specToElement({ type: "sparkline", data: [{ d: "Mon", n: 3 }, { d: "Tue", n: 5 }], encoding: { x: "d", y: "n" } }).props).toEqual({ values: [3, 5], labels: ["Mon", "Tue"] });
  });

  test("data: CSV inline, and { url } fetched as JSON (with select) or CSV", async () => {
    expect(specToElement({ type: "bar", data: { csv: "lab,samples\nGenomics,182\nImaging,96" } }).props.data).toEqual([{ lab: "Genomics", samples: 182 }, { lab: "Imaging", samples: 96 }]);
    const fake = (body: string, type: string) => async () => new Response(body, { headers: { "content-type": type } });
    const json = await resolveSpecData({ type: "bar", data: { url: "u", select: "result.rows" } }, fake(JSON.stringify({ result: { rows: LABS } }), "application/json"));
    expect(json.data).toEqual(LABS);
    const csv = await resolveSpecData({ type: "bar", data: { url: "u" } }, fake("lab,samples\nNeuro,141", "text/csv"));
    expect(csv.data).toEqual([{ lab: "Neuro", samples: 141 }]);
    await expect(resolveSpecData({ type: "bar", data: { url: "u" } }, async () => new Response("", { status: 404 }))).rejects.toThrow(/404/);
  });
});

describe("suggesting charts", () => {
  test("a profile of each column", () => {
    const p = profileData([{ month: "2026-01-01", lab: "A", runs: 3 }, { month: "2026-01-02", lab: "B", runs: 5 }]);
    expect(p.columns.map((c) => [c.name, c.kind])).toEqual([["month", "date"], ["lab", "category"], ["runs", "number"]]);
  });

  test("each suggestion's spec is valid, best first", () => {
    const shapes = [
      LABS,
      Array.from({ length: 30 }, (_, i) => ({ month: `2026-${String((i % 10) + 1).padStart(2, "0")}-01`, partition: ["GPU", "CPU", "Memory"][i % 3], minutes: 10 + i })),
      [{ source: "Federal", target: "Genomics", amount: 6 }, { source: "Industry", target: "Genomics", amount: 2 }, { source: "Federal", target: "Imaging", amount: 4 }],
      [{ lab: "Genomics", before: 64, after: 81 }, { lab: "Imaging", before: 70, after: 72 }, { lab: "Climate", before: 58, after: 66 }],
    ];
    for (const rows of shapes) {
      const { suggestions } = suggestCharts(rows);
      expect(suggestions.length).toBeGreaterThan(0);
      expect([...suggestions].sort((a, b) => b.score - a.score)).toEqual(suggestions);
      for (const s of suggestions) expect(validateSpec(s.spec), `${s.type} for ${Object.keys(rows[0])}`).toMatchObject({ valid: true });
    }
    expect(suggestCharts(shapes[2]).suggestions[0].type).toBe("sankey");
    expect(suggestCharts(shapes[3]).suggestions.map((s) => s.type)).toContain("dumbbell");
    expect(suggestCharts(shapes[1]).suggestions[0].type).toBe("line");
  });

  test("the later charts are suggested where they fit, each with a valid spec", () => {
    const has = (rows: Record<string, unknown>[], type: string) => {
      const s = suggestCharts(rows).suggestions.find((x) => x.type === type);
      expect(s, type).toBeDefined();
      expect(validateSpec(s!.spec), type).toMatchObject({ valid: true });
    };
    // One measure, no groups
    has(Array.from({ length: 40 }, (_, i) => ({ hours: 10 + ((i * 7) % 23) })), "histogram");
    // Two measures far apart in scale along one x
    has(Array.from({ length: 12 }, (_, i) => ({ month: `2026-${String(i + 1).padStart(2, "0")}-01`, samples: 150 + i * 9, hours: 20 + (i % 5) })), "combo");
    // Too many points for a scatter plot
    has(Array.from({ length: 4000 }, (_, i) => ({ temp: (i * 37) % 100, drift: (i * 53) % 70 })), "hexbin");
    // A month cycle
    has(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, i) => ({ month, applications: 20 + ((i * 11) % 30) })), "rose");
    // Links that close loops among many nodes
    const people = ["Ada", "Ben", "Cy", "Di", "Ed", "Flo", "Gus", "Hal", "Ivy"];
    has(people.flatMap((p, i) => [{ source: p, target: people[(i + 1) % 9], weight: 1 + (i % 3) }, { source: p, target: people[(i + 3) % 9], weight: 1 }]), "network");
  });
});
