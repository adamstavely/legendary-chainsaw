/* Each chart's module by tag, imported when a spec first asks for it – by <tc-chart> and the server renderer */
const LOADERS: Record<string, () => Promise<unknown>> = {
  "tc-bar-chart": () => import("../../bar-chart"),
  "tc-line-chart": () => import("../../line-chart"),
  "tc-area-chart": () => import("../../area-chart"),
  "tc-pie-chart": () => import("../../pie-chart"),
  "tc-donut-chart": () => import("../../donut-chart"),
  "tc-lollipop-chart": () => import("../../lollipop-chart"),
  "tc-dumbbell-chart": () => import("../../dumbbell-chart"),
  "tc-slope-chart": () => import("../../slope-chart"),
  "tc-bump-chart": () => import("../../bump-chart"),
  "tc-bullet-chart": () => import("../../bullet-chart"),
  "tc-segmented-bar": () => import("../../segmented-bar"),
  "tc-waterfall-chart": () => import("../../waterfall-chart"),
  "tc-pareto-chart": () => import("../../pareto-chart"),
  "tc-waffle-chart": () => import("../../waffle-chart"),
  "tc-funnel-chart": () => import("../../funnel-chart"),
  "tc-marimekko-chart": () => import("../../marimekko-chart"),
  "tc-treemap": () => import("../../treemap"),
  "tc-sunburst-chart": () => import("../../sunburst-chart"),
  "tc-sankey-chart": () => import("../../sankey-chart"),
  "tc-chord-chart": () => import("../../chord-chart"),
  "tc-beeswarm-chart": () => import("../../beeswarm-chart"),
  "tc-bubble-chart": () => import("../../bubble-chart"),
  "tc-calendar-heatmap": () => import("../../calendar-heatmap"),
  "tc-parallel-chart": () => import("../../parallel-chart"),
  "tc-box-plot": () => import("../../box-plot"),
  "tc-ridgeline-chart": () => import("../../ridgeline-chart"),
  "tc-candlestick-chart": () => import("../../candlestick-chart"),
  "tc-stream-graph": () => import("../../stream-graph"),
  "tc-radial-bar-chart": () => import("../../radial-bar-chart"),
  "tc-gauge": () => import("../../gauge"),
  "tc-heatmap": () => import("../../heatmap"),
  "tc-radar-chart": () => import("../../radar-chart"),
  "tc-sparkline": () => import("../../sparkline"),
};

/** Loads the module that defines a chart's tag; nothing for a tag that isn't a chart */
export async function chartLoader(tag: string) {
  await LOADERS[tag]?.();
}
