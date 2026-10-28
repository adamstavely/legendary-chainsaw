---
pattern: radio
status: new
related: kpi-chart, data-table, ops-overview, sla-status
---

## Overview

The first screen for someone who oversees AI work. Each role gets its own home, and a switch at the top right moves
between them. A home has the day and the role, a headline that says what needs doing and a line on what it covers; the
one thing that needs this person first, in a tinted band with a way in; the library's KPI Chart for each number the role
watches, this week against the last; and the service posture – the library's Data Table, read only, with each
service's state, availability and last event, and a filter by state. Down and limited services sort to the top.

## When to use

- The landing page of a review, governance or operations tool with several roles.
- Giving each role one sentence on what needs doing before the detail.
- Showing the health of the services a role depends on next to its numbers.

## When not to use

- One dashboard for everyone, with no roles – use `ops-overview`.
- Service-level targets and breaches – use `sla-status`.
- A single trend – use `kpi-chart`.

## Anatomy

1. **Intro** `.ui-ovh__intro` – the eyebrow, headline and summary, with the role switch
2. **Headline** `.ui-ovh__headline` – what needs doing, as a sentence
3. **Focus** `.ui-ovh__focus` – the one thing first, with its action
4. **KPIs** `.ui-ovh__kpis` – a chart per number, this period against the last
5. **Posture** `.ui-ovh__posture` – the services, their filter and their table

## Looks

The home is a page section, not a card. Its charts and table carry the look – Standard trays with white cards, or
Clean single cards – and Clean sets the headline and section title in a lighter weight. The focus band is the same in
both: the warning tint with a boxed icon.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the role switch, the focus action, the charts, the filter and the table |
| ← / → | In the role switch or the filter, picks the previous or next option |
| Enter / Space | Presses the focus action |

The charts and table keep their own keys – reading points, sorting.

## Screen readers

The headline is the page's heading; the focus band and the posture are regions named by their titles. The role switch
is a radio group named “Role”, the filter one named “Filter services by state”, each option with its count. Each state
is a word in the table, never only a colour.

## Content

- Write the headline as a sentence about the person's work: “5 decisions are waiting for you.”
- Keep `eyebrow` to the day and the role's area: “Tuesday · 27 October · Review”.
- Give the focus a label, a detail with its urgency, and an action verb: “Start reviewing”.
- Mark numbers where a drop is good news with `lowerIsBetter`, so the change shows the right colour.
- Say in `servicesNote` what this role can and can't see.

## Do

- Keep three or four KPIs per role; the ones the role acts on.
- Order roles from the most to the least common.
- Open the focus's work on `tc-open-focus`.

## Don't

- Don't show every service to every role – give each role the ones it relies on.
- Don't use the focus band for something that doesn't need doing now.
- Don't put more than one headline sentence.

## Example

```html
<tc-oversight-home id="home" role-id="reviewer"></tc-oversight-home>

<script type="module">
  import "trenchcoat/oversight-home";
  import "trenchcoat/tokens.css";

  const home = document.querySelector("#home");
  home.roles = [
    {
      id: "reviewer",
      label: "Reviewer",
      headline: "5 decisions are waiting for you.",
      focus: { label: "5 decisions awaiting review", detail: "2 are past due", action: "Start reviewing" },
      kpis: [{ id: "pending", label: "Awaiting review", value: "5", delta: -28, lowerIsBetter: true, labels: ["Mon", "Tue", "Wed"], values: [9, 8, 5], previous: [7, 9, 9] }],
      services: [{ id: "review", name: "Review queue", state: "normal", availability: "99.95%" }],
    },
  ];
  home.addEventListener("tc-role-change", (e) => console.log(e.detail.roleId));
  home.addEventListener("tc-open-focus", (e) => console.log(e.detail.role.id));
</script>
```

```tsx
import { useState } from "react";
import { OversightHome, type OversightRole } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const roles: OversightRole[] = [
  {
    id: "reviewer",
    label: "Reviewer",
    headline: "5 decisions are waiting for you.",
    focus: { label: "5 decisions awaiting review", action: "Start reviewing" },
    kpis: [{ id: "pending", label: "Awaiting review", value: "5", delta: -28, lowerIsBetter: true, labels: ["Mon", "Tue", "Wed"], values: [9, 8, 5] }],
    services: [{ id: "review", name: "Review queue", state: "normal", availability: "99.95%" }],
  },
  { id: "lead", label: "Team lead", headline: "2 runs are paused for approval.", kpis: [], services: [] },
];

export function Home() {
  const [role, setRole] = useState("reviewer");
  return <OversightHome roles={roles} role={role} onRoleChange={setRole} onOpenFocus={(r) => console.log(r.id)} />;
}
```
