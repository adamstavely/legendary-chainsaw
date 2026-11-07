// @vitest-environment node
/*
 * Charts as SVG text in Node, with no DOM: templates to markup, tokens resolved for a look and theme, every chart type
 * drawn from its own example spec, and bad specs refused with their problems.
 */
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { html, nothing, svg } from "lit";

describe("chart rendering without a browser", async () => {
  const { installDomShim, renderChartToSVG, templateToString, tokenValues } = await import("../../src/elements/internal/chart/render");
  await installDomShim();
  const { chartLoader } = await import("../../src/elements/internal/chart/loaders");
  const { chartTypes } = await import("../../src/elements/internal/chart/spec");
  const tokensCss = readFileSync(new URL("../../tokens/tokens.css", import.meta.url), "utf8");

  test("templates: attributes, booleans, events and properties, nested and escaped", () => {
    const inner = svg`<circle r=${3} ?data-hi=${true} ?data-lo=${false} @click=${() => 0} .foo=${1}></circle>`;
    const t = html`<g class="a ${"b"}" opacity=${nothing} style=${"fill: red"}>${[inner, "<x>"]}</g>`;
    expect(templateToString(t).replace(/\s+/g, " ")).toBe('<g class="a b" style="fill: red"><circle r="3" data-hi ></circle>&lt;x&gt;</g>');
  });

  test("tokens: the look's block over the base, light-dark settled for the theme", () => {
    const light = tokenValues(tokensCss, "standard", "light");
    const dark = tokenValues(tokensCss, "standard", "dark");
    expect(light.get("--tc-chart-1")).not.toContain("light-dark");
    expect(light.get("--tc-chart-1")).not.toBe(dark.get("--tc-chart-1"));
    expect(tokenValues(tokensCss, "clean", "light").get("--tc-chart-1")).not.toBe(light.get("--tc-chart-1"));
  });

  test("a bar chart as standalone SVG: no var() left, the heading as its name, the data in words", async () => {
    const out = await renderChartToSVG(
      { type: "bar", title: "Samples processed", data: [{ lab: "Genomics", n: 182 }, { lab: "Imaging", n: 96 }], encoding: { x: "lab", y: "n" } },
      chartLoader,
      { width: 600, tokensCss },
    );
    expect(out).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" id="tc-chart-svg-\d+" viewBox="0 0 600 /);
    expect(out).toContain("<title>Samples processed</title>");
    expect(out).toContain("Genomics 182, Imaging 96");
    expect([...new Set(out.match(/var\(--[\w-]+/g) ?? [])]).toEqual([]);
    expect(out.match(/class="ui-brc__bar"/g)).toHaveLength(2);
  });

  test("every chart type draws from a small spec", async () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({
      label: `L${i % 4}`, value: 10 + ((i * 37) % 50), x: `2026-${String((i % 6) + 1).padStart(2, "0")}-01`, y: 5 + ((i * 13) % 20), series: `S${i % 3}`,
      group: `G${i % 2}`, source: `A${i % 3}`, target: `B${i % 2}`, start: 40 + i, end: 50 + ((i * 7) % 20), date: `2026-03-${String(i + 1).padStart(2, "0")}`,
      open: 10 + i, high: 14 + i, low: 8 + i, close: 11 + i, size: 1 + i, rank: (i % 3) + 1, target2: 60,
    }));
    for (const t of chartTypes.filter((d) => !d.pageOnly)) {
      const encoding: Record<string, Record<string, string | string[]>> = { bullet: { target: "target2" }, bubble: { x: "value", y: "y" }, combo: { x: "label", bars: ["value"], lines: ["y"] }, hexbin: { x: "value", y: "y" } };
      // A Venn diagram's rows name sets, not fields
      const venn = [{ sets: ["A"], size: 12 }, { sets: ["B"], size: 9 }, { sets: ["A", "B"], size: 4 }];
      const spec = { type: t.type, data: t.type === "venn" ? venn : rows, encoding: encoding[t.type], options: t.type === "parallel" ? { dimensions: ["value", "y", "start"] } : undefined };
      const out = await renderChartToSVG(spec, chartLoader, { width: 520, tokensCss });
      expect(out, t.type).toMatch(/^<svg [^>]*viewBox="0 0 520 \d+(\.\d+)?"/);
      expect(out.length, t.type).toBeGreaterThan(800);
      // The drawing itself (the shared sheets also style parts other charts draw) – left only with properties it sets
      // on an element itself, like a dot's own ink, which any browser resolves
      const drawing = out.replace(/<style>[\s\S]*<\/style>/, "");
      const inline = new Set([...drawing.matchAll(/(--[\w-]+):/g)].map((m) => m[1]));
      expect([...new Set([...drawing.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))].filter((v) => !inline.has(v)), t.type).toEqual([]);
    }
  });

  test("a bad spec is refused with what's wrong", async () => {
    await expect(renderChartToSVG({ type: "bar", data: [{ a: 1 }], encoding: { x: "lab" } }, chartLoader)).rejects.toThrow(/No field "lab"/);
    await expect(renderChartToSVG({ type: "gauge", data: [{ value: 3 }] }, chartLoader)).rejects.toThrow(/pages only.*tc-gauge/);
  });
});
