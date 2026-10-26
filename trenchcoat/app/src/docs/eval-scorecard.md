---
pattern: grid
status: new
related: run-compare, data-table, kpi-chart, feedback-rubric
---

## Overview

A set of test cases run against several versions of a prompt or model, read at three distances. The trend gives each
version its pass rate, the change from the version before and a line through them. The grid gives every case a row
and every version a column, marked pass, fail, error or still running – a failure where the version before passed is
marked regressed. Open a cell and the case's input, the grader's reason and the output sit beside the expected
answer, the differences marked word by word. Filters by tag and by outcome narrow all three, so “how did billing
cases do across versions?” is one click. It answers “is the new version better, and where did it get worse?” before
a change ships, and it stays fast with 10,000 cases.

## When to use

- Reviewing an eval run before promoting a new prompt or model.
- Finding regressions: cases the latest version fails that the one before passed.
- Comparing pass rates for one slice of the set – a tag such as “billing” or “multilingual”.

## When not to use

- Two runs of one task side by side, step by step – use `run-compare`.
- Editing case data or labels in a spreadsheet-like table – use `data-table`.
- One metric over time, without cases behind it – use `kpi-chart`.
- Rating a single answer so it can become a case – use `feedback-rubric`.

## Anatomy

1. **Trend** `.ui-evs__trend` – each version's pass rate, its change, and a line through them
2. **Filters** `.ui-evs__filters` – All, Failing or Regressed, and the tags with their counts
3. **Grid** `.ui-evs__grid` – a row per case, a column per version, an outcome in each cell
4. **Open case** `.ui-evs__detail` – the version buttons, the grader's verdict and the case's input
5. **Comparison** `.ui-evs__pair` – the expected answer beside the output, differences marked

## Looks

Standard puts the heading on a gray tray and the scorecard on a white card inside it. Clean is one white card with
hairline dividers, uppercase captions on the grid and the open case, and plain text on its marked words. Wide (from
860 px), the open case sits beside the grid; narrower, it opens below, the columns tighten and the case's tags give
way.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the outcome filter, each tag, the grid, then the open case's Close and its version buttons |
| ← / → / ↑ / ↓ | In the outcome filter, picks the previous or next option, wrapping round |
| ↑ / ↓ / ← / → | In the grid, moves the active cell |
| Home / End | In the grid, moves to the first or last cell of the row |
| Ctrl + Home / Ctrl + End | In the grid, moves to the first or last cell of the grid (⌘ on a Mac also works) |
| Page Up / Page Down | In the grid, moves ten rows |
| Enter / Space | In the grid, opens the active cell's case for that version – the case column opens the latest version |
| Escape | Closes the open case; from inside the open case, focus goes back to the grid |
| ← / → / Home / End | In the version buttons, moves between them; Enter or Space shows that version's run |

## Screen readers

The grid is a `grid` named by the heading, with `aria-rowcount` and `aria-colcount` for every case, rendered or not.
Focus stays on the grid; `aria-activedescendant` points at the active cell. Each outcome is said in words – “Pass”,
“Fail, regressed from v3”, “Running”, “Not run”. The trend is a list named “Pass rate by version”, each item read as
“v4 · Opus 84%, +9 points, 2.0k / 2.4k passed”. The outcome filter is a `radiogroup` named “Show”, the tags a
`group` named “Tags” of toggle buttons with `aria-pressed`, each with its count (“refunds, 800 cases”). After a
filter changes, a status region says what is left: “312 cases of 10,000” or “Failing: 38 cases”. The open case is a
region named by the case; its version buttons are a `toolbar` named “Versions”, the shown one pressed and each named
with its outcome (“Fail, v4”). Words only the expected answer has are `<del>` and words only the output has are
`<ins>`.

## Content

- Name cases by what they test, in a few words – “Refund for a damaged item”, not an id.
- Keep version labels short (“v4”, “Prompt 12”) – they head narrow columns – and put the model in `detail`.
- Give failures a `reason` in one line: what the grader saw, not the score again.
- Use a handful of tags people would filter by – the topic, the language, the risk.

## Do

- List versions oldest first: Failing and Regressed judge the last one.
- Set `status: "running"` on a version whose results are still arriving, and mark its unfinished cases `pending`.
- Fill in `expected` and each result's `output`, so a failure can be read, not only counted.

## Don't

- Don't show more than six or seven versions at once – the columns get too narrow to scan.
- Don't count pending results as failures; leave them pending until they finish.
- Don't use the scorecard for live traffic – it is for a fixed set of cases.

## Example

```html
<tc-eval-scorecard id="evals" heading="Support replies"></tc-eval-scorecard>

<script type="module">
  import "trenchcoat/eval-scorecard";
  import "trenchcoat/tokens.css";

  const evals = document.querySelector("#evals");
  evals.versions = [{ id: "v3", label: "v3" }, { id: "v4", label: "v4", detail: "Opus" }];
  evals.cases = [
    {
      id: "refund-1",
      name: "Refund for a damaged blender",
      tags: ["refunds"],
      expected: "I've refunded $89.00 – no need to send it back.",
      results: { v3: { outcome: "pass" }, v4: { outcome: "fail", output: "Please send it back first.", reason: "Asked for a return" } },
    },
  ];
  evals.addEventListener("tc-open-change", (e) => console.log(e.detail.open));
</script>
```

```tsx
import { EvalScorecard, type EvalCase, type EvalVersion } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const versions: EvalVersion[] = [{ id: "v3", label: "v3" }, { id: "v4", label: "v4", detail: "Opus" }];

export function EvalReview({ cases }: { cases: EvalCase[] }) {
  return <EvalScorecard title="Support replies" versions={versions} cases={cases} defaultShow="regressed" onOpenChange={(open) => console.log(open)} />;
}
```
