/*
 * trenchcoat/charts – the charts as data, for pages, servers and agents: the chart types a spec can draw, checking a
 * spec, turning one into a chart's tag and properties, fetching { url } data, suggesting charts for a table, and
 * drawing a spec as a standalone SVG string without a browser (in Node, call installDomShim() first).
 *
 *   import { renderChartToSVG } from "trenchcoat/charts";
 *   const svg = await renderChartToSVG({ type: "bar", data: rows, encoding: { x: "lab", y: "samples" } }, { tokensCss });
 *
 * In a page, <tc-chart .spec=${…}> draws the same specs as live charts.
 */
import { chartLoader } from "../elements/internal/chart/loaders";
import { renderChartToSVG as render, type RenderOptions } from "../elements/internal/chart/render";
import type { ChartSpec } from "../elements/internal/chart/spec";

export { chartTypes, chartType, inlineRows, resolveSpecData, specToElement, validateSpec } from "../elements/internal/chart/spec";
export type { ChannelDef, ChartGroup, ChartLevel, ChartSpec, ChartTypeDef, FieldType, SpecCheck, SpecData, SpecElement, SpecIssue } from "../elements/internal/chart/spec";
export { profileData, suggestCharts } from "../elements/internal/chart/suggest";
export type { ColumnKind, ColumnProfile, DataProfile, Suggestion } from "../elements/internal/chart/suggest";
export { installDomShim, templateToString, tokenValues } from "../elements/internal/chart/render";
export type { RenderLook, RenderOptions, RenderTheme } from "../elements/internal/chart/render";

/** A spec as a standalone SVG string – checked first; throws with its problems when it isn't valid */
export function renderChartToSVG(spec: ChartSpec, options: RenderOptions = {}) {
  return render(spec, chartLoader, options);
}
