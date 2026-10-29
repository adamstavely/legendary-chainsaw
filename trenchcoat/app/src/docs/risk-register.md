---
pattern: grid
status: new
related: coverage-matrix, gap-exposure, status-tracker, priority-list
---

## Overview

A programme's risks in two views at once. On the left is a 5 × 5 heat grid, likelihood across and impact up. Each
cell is shaded by its band (low, medium, high or critical), and the band is named as well as coloured. Each cell
shows how many risks sit in it, and a risk that has moved since the last review leaves a dashed arrow from its old
cell. On the right is the register: every risk with its score (likelihood × impact), owner, status and trend,
sortable by any of them. Pick a cell to show only its risks. Open a risk for its mitigation and two 1–5 pickers to
rescore it.

## When to use

- A project, programme or portfolio keeps a risk register and reviews it regularly.
- People need to see where the serious risks sit at a glance, and what's being done about each.

## When not to use

- Coverage of checks against parts, with gaps – use [Coverage Matrix](#/coverage-matrix).
- Where exposure is unaddressed across a portfolio – use [Gap Exposure](#/gap-exposure).
- A ranked list of things to do – use [Priority List](#/priority-list).

## Anatomy

1. **Legend** `.ui-rrg__legend` – how many risks are in each band, in the header
2. **Grid** `.ui-rrg__grid` – 5 × 5 cells, each shaded by band with its count
3. **Moves** `.ui-rrg__moves` – dashed arrows from where risks sat at the last review
4. **Filter** `.ui-rrg__chip` – the cell the register is showing, with a button to show all
5. **Register** `.ui-rrg__table` – score, risk, owner, status and trend, sortable
6. **Detail** `.ui-rrg__detail` – the mitigation and the likelihood and impact pickers

## Looks

Standard sets the header and legend on a gray tray above a white card; Clean is one white card with the header as
its first row. Bands use the theme's status and tone fills. A page can recolour them with `--tc-rrg-low`,
`--tc-rrg-medium`, `--tc-rrg-high` and `--tc-rrg-critical`, and resize the cells with `--tc-rrg-cell` (44px). Narrow,
the grid sits above the register; narrower still, the register's rows become cards.

## Keyboard

| Key | Does |
| --- | --- |
| ← → ↑ ↓ in the grid | Move between cells |
| Home / End | The row's first / last cell |
| ⌘ / Ctrl + Home / End | Top-left / bottom-right cell |
| Enter or Space on a cell | Shows only its risks; again shows all |
| Escape in the grid | Shows all risks |
| Enter on a risk | Opens or closes its detail |
| ← / → in a picker | A lower / higher level |

## Screen readers

- The grid is a `grid` named by the heading. Each cell says its levels in words, its count and its band ("Likelihood 2
  Unlikely, impact 4 Major: 2 risks, Medium"), and the filtered cell is selected.
- The register is a table whose sortable columns carry `aria-sort`. A risk's title is a button with `aria-expanded`
  pointing at its detail.
- Trends are arrows with words ("Getting worse"). The pickers are radio groups named "Likelihood" and "Impact", each
  option with its number and word.
- Filtering and rescoring are announced in a polite status line.

## Content

- Write a risk as what might happen: "Storm season damages nursery frames", not "Storms".
- Put the mitigation in one or two sentences of what's actually being done.
- Set `previous` after each review, so the grid shows what moved.
- Rename the levels with `labels` to match your organisation's scale.

## Do

- Keep owners on every open risk.
- Store the list where the team reviews it (`tc-risks-change` gives you the whole list).

## Don't

- Use colour alone to rank risks – the bands are named for a reason; keep them visible.
- Leave closed risks on the grid for ever – archive them after a review or two.

## Example

```html
<tc-risk-register heading="Field risks"></tc-risk-register>
<script type="module">
  const reg = document.querySelector("tc-risk-register");
  reg.risks = [{ id: "storm", title: "Storm season damages nursery frames", likelihood: 4, impact: 4, owner: "M. Okafor" }];
  reg.addEventListener("tc-risks-change", (e) => console.log("save", e.detail.risks));
</script>
```

```tsx
import { useState } from "react";
import { RiskRegister, type Risk } from "trenchcoat/react";

export function FieldRisks() {
  const [risks, setRisks] = useState<Risk[]>([{ id: "storm", title: "Storm season damages nursery frames", likelihood: 4, impact: 4 }]);
  return <RiskRegister title="Field risks" risks={risks} onRisksChange={setRisks} />;
}
```
