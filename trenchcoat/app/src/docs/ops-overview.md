---
pattern: none
status: new
related: kpi-chart, sla-status, alert-feed, usage-meter
---

## Overview

An operations overview in one dense strip, for the top of a team's dashboard. The header has a title, a one-line
status – “All operations active · 3 analysts on watch” – and a health pill for the feeds or systems: Nominal,
Degraded or Down. Below it, a row of count tiles, each with:
- its label and value, and an optional sub-line;
- the change since the last period as a +/- badge, green when it went the right way and red when it didn't;
- an optional sparkline of recent values;
- an optional tone, such as red for “Critical risk”.

Whether a rise is good is each tile's call: more cases closed is good, more alerts is not. With `actionable` the tiles
open what they count.

## When to use

- The first row of an operations, support or security team's dashboard.
- A handful of counts people check several times a day, where the change matters as much as the number.
- A status strip above a live feed or a queue.

## When not to use

- One metric over time with a chart – use `kpi-chart`.
- How well service levels are met – use `sla-status`.
- The alerts themselves – use `alert-feed`.
- Use against a plan or a limit – use `usage-meter`.

## Anatomy

1. **Status** `.tc-head__sub` – one line on how things stand
2. **Health** `.ui-opo__health` – the feeds' or systems' health as a tint, a mark and a word
3. **Tile** `.ui-opo__tile` – one count
4. **Label** `.ui-opo__label` – what it counts
5. **Value** `.ui-opo__value` – the count, tinted when the tile has a tone
6. **Change** `.ui-opo__change` – the change since the last period, with its direction
7. **Sub-line** `.ui-opo__sub` – one quiet line of context
8. **Sparkline** `.ui-opo__spark` – recent values

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The tiles, badges and sparklines are the same in both. In a narrow container the tiles go two across.

## Keyboard

Without `actionable`, the strip has nothing to focus. With it, the tiles are one tab stop.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Moves to the previous or next tile |
| Home / End | Moves to the first or last tile |
| Enter / Space | Opens what the tile counts |
| Tab | Leaves the strip |

## Screen readers

The tiles are a list named by the heading. Each reads its label, value and change in words, “Alerts · 24h, 5, up 4
since last week”, then its sub-line; the arrows and sparklines are hidden. The health pill reads its word, “Feeds
degraded”. Actionable tiles are buttons with the same name.

## Content

- Keep labels to two or three words, and units in the value or sub-line: “1.8 d”, “was 2.2 days”.
- Set `goodWhen` on every tile where a rise is bad – alerts, risks, resolution time – so the badge colour tells the
  truth; use `none` for counts that are neither.
- Set `change-label` to the period you compare against: “since last week”.
- Write the status line as how things stand, not a greeting.

## Do

- Keep to five or six tiles; more belongs on a page of its own.
- Use a tone only for the one or two counts that need attention.
- Make tiles actionable when there's a list behind each count.

## Don't

- Don't leave `goodWhen` at its default for counts where up is bad – a green badge on rising alerts misleads.
- Don't use the health pill for anything but the feeds or systems the numbers come from.
- Don't put long text in tiles; they truncate.

## Example

```html
<tc-ops-overview id="ops" heading="Command overview" status="All operations active" health="nominal" change-label="since last week"></tc-ops-overview>

<script type="module">
  import "trenchcoat/ops-overview";
  import "trenchcoat/tokens.css";

  const ops = document.querySelector("#ops");
  ops.tiles = [
    { id: "cases", label: "Active cases", value: 12, change: 2, goodWhen: "none" },
    { id: "alerts", label: "Alerts · 24h", value: 5, change: 4, goodWhen: "down" },
  ];
  ops.actionable = true;
  ops.addEventListener("tc-action", (e) => console.log("open", e.detail.id));
</script>
```

```tsx
import { OpsOverview, type OpsTile } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const tiles: OpsTile[] = [
  { id: "cases", label: "Active cases", value: 12, change: 2, goodWhen: "none" },
  { id: "alerts", label: "Alerts · 24h", value: 5, change: 4, goodWhen: "down", trend: [2, 1, 3, 5] },
];

export function Ops() {
  return <OpsOverview title="Command overview" status="All operations active" health="nominal" tiles={tiles} actionable onAction={(id) => console.log(id)} />;
}
```
