---
pattern: none
status: new
related: bar-chart, line-chart, pie-chart, generated-ui
---

## Overview

Any of the library's charts from a JSON spec – the kind a tool, a server or a model writes. A spec names the chart
(`type`: "bar", "line", "sankey"…), gives its data (rows, `{ values }`, `{ csv }` or `{ url }`), maps the chart's
channels to fields (`encoding`) and sets its options:

```json
{ "type": "bar", "title": "Samples processed", "data": [{ "lab": "Genomics", "samples": 182 }],
  "encoding": { "x": "lab", "y": "samples" }, "options": { "unit": " samples" } }
```

The spec is checked first: an unknown type, data in the wrong shape, or a channel naming a field the rows don't have is
shown as a list of what's wrong, and reported in `tc-spec-check`, instead of a chart. Then the chart the spec names is
loaded and drawn inside this element. Only properties the chart declares are set, so a spec from outside the page can't
reach anything else. `{ url }` data is fetched first. Specs written for ztd-charts draw as they are – its option names
(`showRates: false`, `animate: false`) are understood. Ported from ztd-charts (MIT).

Specs also draw the library's own Gauge, Heatmap, Radar Chart and Sparkline: their rows are reshaped into those
elements' properties (a heatmap's long rows into its matrix, say). The same specs draw as standalone SVG without a
browser – `renderChartToSVG` in `trenchcoat/charts`, `trenchcoat chart render` on the command line, or `render_chart`
in the MCP server – except those four, which are drawn in pages only. `suggestCharts` proposes specs for a table.

## When to use

- Charts described as data: from a server, a report definition, a tool, or a model's answer.
- One element that can become any chart, as the data or the reader's choice changes.

## When not to use

- A chart in your own code – use its element (`<tc-bar-chart>`, `<tc-line-chart>`…) directly, with its typed properties.
- A model's whole answer with text, tables and charts – use [Generated UI](#/generated-ui), whose component blocks place charts.

## Anatomy

1. **Chart** – the chart the spec names, drawn inside the element
2. **Problem** `.ui-cht__problem` – what's wrong with the spec, in place of the chart

## Looks

It has no look of its own: the chart inside takes the look from the page, or from `look` on this element. The problem
box is a dashed card in the text inks.

## Keyboard

The chart inside has its own keyboard model: Tab reaches its plot, arrows move through its marks. Nothing more here.

## Screen readers

- The chart inside is named and described as any chart is.
- A refused spec is an alert: "This bar chart can't be drawn", then each problem.

## Content

- Name the chart's fields in `encoding` rather than renaming columns to the channels' names.
- Give `title` and `description`; they become the chart's heading and description.
- Keep data inline where you can; `{ url }` is fetched every time the spec changes.

## Do

- Check specs from outside with `validateSpec` (or `tc-spec-check`) before showing them to people.
- Use `suggestCharts` to propose a first chart for a table someone has uploaded.

## Don't

- Put functions in a spec – a spec is JSON; use the chart's element for formatters and accessors.
- Trust a spec to have the fields you expect: the problem list is there for when it doesn't.

## Example

```html
<tc-chart></tc-chart>

<script type="module">
  import "trenchcoat/chart";
  import "trenchcoat/tokens.css";
  document.querySelector("tc-chart").spec = {
    type: "bar",
    title: "Samples processed",
    data: [{ lab: "Genomics", samples: 182 }, { lab: "Imaging", samples: 96 }],
    encoding: { x: "lab", y: "samples" },
  };
</script>
```

```tsx
import { Chart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const spec = { type: "bar", title: "Samples processed", data: [{ lab: "Genomics", samples: 182 }], encoding: { x: "lab", y: "samples" } };

export function Samples() {
  return <Chart spec={spec} onSpecCheck={(check) => console.log(check.valid)} />;
}
```
