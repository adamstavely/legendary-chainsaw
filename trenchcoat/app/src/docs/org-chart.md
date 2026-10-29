---
pattern: tree
status: new
related: profile-header, person-links, org-unit-card, agent-tree
---

## Overview

Who reports to whom. Cards for people – a picture or initials, the name, title and team – joined by reporting lines,
top-down. Each manager's "6 reports" button folds their branch away or opens it again, and only open branches are
drawn, so a large organisation stays light. People without a manager start trees of their own, side by side.

Search by name, title or team: matches are marked, the branches above them open, the count shows, and Enter goes to
the next one. Pick a person and a strip under the chart shows their manager, them and their reports, each a button
that moves there. The drawing scrolls inside the card – drag empty space to pan, and zoom with − / + / Fit. In a
narrow container, or with `layout="list"`, it becomes an indented outline.

## When to use

- Showing a team, a department or a whole organisation's reporting lines.
- Helping people find who someone works for, or who works for them.

## When not to use

- One unit's summary with its head and numbers – use [Org Unit Card](#/org-unit-card).
- A person's own page – use [Profile Header](#/profile-header).
- Agents starting sub-agents – use [Agent Tree](#/agent-tree).

## Anatomy

1. **Search** `.ui-org__search` – find a person, title or team, with the match count
2. **Zoom** `.ui-org__zoom` – zoom out, the scale, zoom in, Fit
3. **Card** `.ui-org__card` – picture or initials, name, title, team, and away or vacant
4. **Reports** `.ui-org__fold` – how many report to them; folds or opens the branch
5. **Lines** `.ui-org__group` – from a manager to a bar over their reports
6. **Strip** `.ui-org__strip` – the picked person's manager, them, and their reports

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row.
People's cards are raised; a vacant role is a dashed outline with a plus where the picture would be; the picked person
is tinted; search matches get an amber ring. A page can set `--tc-org-card-w` (196px), `--tc-org-gap` (the space a
reporting line crosses), `--tc-org-line` (its colour) and `--tc-org-view-h` (how tall the drawing grows before it
scrolls).

## Keyboard

| Key | Does |
| --- | --- |
| ↓ / ↑ | Next / previous person shown |
| → | Opens a folded branch, or moves to the first report |
| ← | Folds an open branch, or moves to the manager |
| Home / End | First / last person shown |
| * | Opens every sibling's branch |
| Enter or Space | Picks the person |
| Enter / Shift + Enter in the search | Next / previous match |
| Escape in the search | Clears it |

## Screen readers

- The chart is a `tree` named by the heading. Each person is a `treeitem` with their level, place among siblings,
  open or folded state and whether they're picked. Each is named by name and title, plus "vacant" or "away".
- One person is in the tab order at a time; the reports buttons are for the pointer, as → and ← do the same.
- The search's count is the field's description. Opening, folding, picking, matches and zoom are announced in a
  polite status line.
- The strip is a group named after the picked person, and its people are buttons.

## Content

- List people in the order their manager would; reports are drawn in that order.
- Keep titles short ("Head of Data", not "Head of the Data and Analytics Function").
- Name vacant roles for the role ("Postdoctoral fellow"), with `status: "vacant"`.

## Do

- Open the branches people came for with `expanded`, and pick the person with `selected`, when you link to the chart
  from someone's profile.
- Let the outline take over on phones – it reads better than a pinched tree.

## Don't

- Put the whole company open at once – start folded and let search open the way.
- Use colour alone for status – away and vacant also say so in words.

## Example

```html
<tc-org-chart heading="Research"></tc-org-chart>
<script type="module">
  const chart = document.querySelector("tc-org-chart");
  chart.people = [
    { id: "res", name: "Tomás Reyes", title: "Head of Research" },
    { id: "r1", name: "Hana Sato", title: "Principal scientist", manager: "res" },
    { id: "r2", name: "Open role", title: "Postdoctoral fellow", manager: "r1", status: "vacant" },
  ];
  chart.addEventListener("tc-selected-change", (e) => console.log("picked", e.detail.person?.name));
</script>
```

```tsx
import { OrgChart, type OrgChartPerson } from "trenchcoat/react";

export function Team({ people }: { people: OrgChartPerson[] }) {
  return <OrgChart title="Research" people={people} defaultSelected="r1" onSelectedChange={(id) => console.log(id)} />;
}
```
