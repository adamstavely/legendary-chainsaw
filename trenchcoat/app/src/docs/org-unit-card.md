---
pattern: disclosure
status: new
related: work-item, person-links, profile-header, usage-meter
---

## Overview

An organisational unit at a glance: a centre, a department or a division. The header shows a short code badge, the
unit's name and one line about it, with the page's actions at the right. Below it:

- **Lead and health.** Who leads the unit, and how much of its work is On track, on Watch or At risk, in words and
  marks.
- **Stats.** A strip of the page's own figures. Each stat has a label, a value and a quiet line, and the budget can
  show a spent-of-allocated bar.
- **Teams.** The unit's sub-units as rows that fold open. A row shows the team's lead, people, health, coverage,
  open gaps and effort. Opening it lists the team's items: topics or programmes, each with a priority, a tag, what's
  in work, coverage, what's open and its momentum.

## When to use

- A directorate or portfolio page that compares centres side by side.
- The top of a department's page, before its detailed work.
- Any unit whose figures roll up from teams that people want to drill into.

## When not to use

- One piece of work – use `work-item`.
- The people linked to someone – use `person-links`.
- The top of a person's or an account's page – use `profile-header`.
- Use against a limit or a plan – use `usage-meter`.

## Anatomy

1. **Code** `.ui-orgu__code` – the unit's short code in the header's badge
2. **Actions** `.ui-orgu__action` – the page's buttons, at the header's right
3. **Lead** `.ui-orgu__lead` – who leads the unit, with their role
4. **Health** `.ui-orgu__healths` – how many items are On track, on Watch and At risk
5. **Stat** `.ui-orgu__stat` – a label, a value, an optional bar and a quiet line
6. **Team** `.ui-orgu__team-row` – a sub-unit: lead, people, health, coverage, gaps and effort; opens onto its items
7. **Item** `.ui-orgu__item` – a team's topic: priority, tag, what's in work, coverage, what's open and momentum

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. The stats, health and team rows are the same in both.

## Keyboard

The team rows and any open team's items are one tab stop; the header's actions are their own stops.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row – teams and the items of open teams |
| Home / End | Moves to the first or last row |
| → | Opens a closed team; on an open team, moves to its first item |
| ← | Closes an open team; on an item, moves back to its team |
| Enter / Space | Opens or closes a team; opens an item (tc-open) |
| Tab | Leaves the rows |

## Screen readers

The card's heading is the unit's name. The lead and stats are a definition list: each stat reads its label then its
value, and a bar adds its share in words, “$9.2M (55%)”. The health strip is labelled “Health” and reads “2 On track,
1 Watch, 1 At risk”. Teams are a list under a “Teams” heading; each team is a button with `aria-expanded` that
controls its list of items, named “Cognitive Systems: Topics”. A team's health reads in words. Each item reads its
priority, its name and health, “Priority 1, Neuromorphic Computing, At risk”, then its coverage, what's open and its
momentum, “Down 8%”. The marks, arrows and bars are hidden; their meaning is always in words.

## Content

- Use a code people already know for the unit, two to four capitals: “CIS”, “R&D”.
- Keep stats to about six, each a figure people compare between units.
- Put the denominator in the sub-line: “$5.1M spent” under “$9.2M”, “13 in work” under “4”.
- Give momentum as a fraction of the period's change: -0.08 shows “▼ 8%”.

## Do

- Open the team the page is about, or none – let people choose.
- Use the same stats in the same order on every card of a page, so the eye can compare.
- Rename the health states when your organisation has its own words for them.

## Don't

- Don't use colour alone for health – the counts always come with their words.
- Don't nest teams inside items; this card is two levels deep by design.
- Don't put more than two actions in the header; move the rest to the page.

## Example

```html
<tc-org-unit-card id="unit" code="CIS" heading="Intelligent Systems"></tc-org-unit-card>

<script type="module">
  import "trenchcoat/org-unit-card";
  import "trenchcoat/tokens.css";

  const unit = document.querySelector("#unit");
  unit.lead = { name: "Marcus Okonkwo", title: "Principal Investigator" };
  unit.health = { "on-track": 2, watch: 1, "at-risk": 1 };
  unit.stats = [
    { id: "coverage", label: "Coverage", value: "66%", sub: "gap coverage" },
    { id: "budget", label: "Budget", value: "$9.2M", sub: "$5.1M spent", meter: 0.55 },
  ];
  unit.teams = [
    {
      id: "cognitive",
      name: "Cognitive Systems",
      people: 3,
      coverage: 0.61,
      items: [{ id: "neuro", label: "Neuromorphic Computing", priority: 1, coverage: 0.42, open: 4, momentum: -0.08 }],
    },
  ];
  unit.addEventListener("tc-expanded-change", (e) => console.log(e.detail.expanded));
  unit.addEventListener("tc-open", (e) => console.log(e.detail.item.label));
</script>
```

```tsx
import { useState } from "react";
import { OrgUnitCard, type OrgTeam } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const teams: OrgTeam[] = [
  {
    id: "cognitive",
    name: "Cognitive Systems",
    people: 3,
    coverage: 0.61,
    items: [{ id: "neuro", label: "Neuromorphic Computing", priority: 1, coverage: 0.42, open: 4, momentum: -0.08 }],
  },
];

export function Centre() {
  const [expanded, setExpanded] = useState<string[]>([]);
  return (
    <OrgUnitCard
      code="CIS"
      title="Intelligent Systems"
      lead={{ name: "Marcus Okonkwo", title: "Principal Investigator" }}
      health={{ "on-track": 2, watch: 1, "at-risk": 1 }}
      stats={[{ id: "budget", label: "Budget", value: "$9.2M", sub: "$5.1M spent", meter: 0.55 }]}
      teams={teams}
      expanded={expanded}
      onExpandedChange={setExpanded}
      onOpen={(team, item) => console.log(team, item.label)}
    />
  );
}
```
