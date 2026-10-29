---
pattern: grid
status: new
related: status-tracker, agent-lanes, work-item, activity-calendar
---

## Overview

Workstreams on a calendar, Gantt style. Each workstream is a lane, and its name and owner stay put on the left while
the chart scrolls. Each piece of work is a bar from its first day to its last, filled as far as it has got. Its status
shows as a mark and a word as well as a colour: Planned, Active, Done, At risk or Blocked. Milestones are diamonds on
their day, and a Today line runs down the chart. Elbow arrows run from each piece of work to the ones that wait for
it. An arrow turns red and dashed when the follower is planned to start before what it waits for ends.

Switch between Weeks, Months and Quarters in the header. The drawing keeps its size and scrolls sideways inside the
card. Select a piece of work to see its details under the chart: dates, length in days, status, progress, what it
waits for and what waits for it.

## When to use

- A plan across several teams or streams over weeks to quarters, where order and dependencies matter.
- Reviewing a portfolio's timing: what's late, what's blocked, what a slip would push back.

## When not to use

- One process moving through fixed steps – use [Status Tracker](#/status-tracker).
- Agents' work as it happens, minute by minute – use [Agent Lanes](#/agent-lanes).
- One task's details – use [Work Item](#/work-item).

## Anatomy

1. **Scale** `.ui-rdm__scale` – Weeks, Months, Quarters, in the header
2. **Lane** `.ui-rdm__lane` – the workstream and its owner, pinned on the left
3. **Axis** `.ui-rdm__axis` – months or quarters above, weeks or months below
4. **Bar** `.ui-rdm__item` – a piece of work: its status mark and name, filled to its progress
5. **Milestone** `.ui-rdm__diamond` – a single day that matters
6. **Dependency** `.ui-rdm__dep` – an arrow from what's waited for to what waits; red and dashed when the dates clash
7. **Today** `.ui-rdm__today` – today's line, labelled in the axis
8. **Details** `.ui-rdm__detail` – the selected piece of work's dates, length, progress and links
9. **Legend** `.ui-rdm__legend` – the statuses in use, with their marks

## Looks

Standard sets the header and scale on a gray tray above a white card; Clean is one white card with the header as its
first row. Statuses use the status tones: Active is info, Done is success, At risk is warning and Blocked is danger,
while Planned is neutral. Each bar also carries its status mark, and narrow bars keep the mark when the name won't fit.

A page can set `--tc-rdm-lane-w` (the lane column, 168px), `--tc-rdm-row` (a lane's height) and `--tc-rdm-bar-h`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Into the chart: one stop, on the selected piece of work or the first |
| ← / → | Previous / next piece of work in the lane |
| ↑ / ↓ | The nearest piece of work in the lane above / below |
| Home / End | A lane's first / last piece of work (with Ctrl, the chart's) |
| Enter or Space | Selects it (again to clear) and shows the details |
| Escape | Clears the selection |

## Screen readers

- The chart is a `grid`. Each lane is a `row` with its name as the `rowheader`, and each piece of work is a `gridcell`
  in date order. A grid suits this better than a list because both directions mean something: along a lane is time,
  across lanes is the plan.
- Each cell is named in full, for example "Ingest pipeline, 8 Mar to 21 May 2027, At risk, 30% done". The selected
  one is `aria-selected`.
- The arrows and the Today line are drawn for sight. The details panel says the same in words ("Waits for", "Blocks",
  and a warning when dates clash).
- Selection and scale changes are announced in a polite status line.

## Content

- Name pieces of work as outcomes ("Ingest pipeline"), and keep them short – the name rides on the bar.
- Give dates as calendar days, `YYYY-MM-DD`. A milestone needs only `start`.
- Set `progress` for work under way; Done counts as full without it.
- Pass `today` in stories, tests and reports so the line doesn't move.

## Do

- Use dependencies for real hand-offs, not for "after".
- Use At risk early and Blocked when something stops the work – both are worth a look.

## Don't

- Put more than a dozen lanes in one chart – split it by programme.
- Draw daily tasks at Quarter scale; use Weeks.

## Example

```html
<tc-roadmap-timeline heading="2027 roadmap" today="2027-04-07"></tc-roadmap-timeline>
<script type="module">
  const chart = document.querySelector("tc-roadmap-timeline");
  chart.lanes = [{ id: "data", label: "Open data portal", owner: "Data team" }];
  chart.items = [
    { id: "schema", lane: "data", label: "Dataset schema", start: "2027-01-18", end: "2027-03-12", status: "done" },
    { id: "launch", lane: "data", label: "Public launch", start: "2027-06-15", milestone: true, dependsOn: ["schema"] },
  ];
  chart.addEventListener("tc-selected-change", (e) => console.log(e.detail.item));
</script>
```

```tsx
import { RoadmapTimeline } from "trenchcoat/react";

export function Plan() {
  return (
    <RoadmapTimeline
      title="2027 roadmap"
      today="2027-04-07"
      lanes={[{ id: "data", label: "Open data portal" }]}
      items={[{ id: "schema", lane: "data", label: "Dataset schema", start: "2027-01-18", end: "2027-03-12", status: "done" }]}
      onSelectedChange={(id) => console.log(id)}
    />
  );
}
```
