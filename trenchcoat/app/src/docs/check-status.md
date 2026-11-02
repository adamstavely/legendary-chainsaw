---
pattern: list
status: new
related: change-list, status-tracker, eval-scorecard, scan-status
---

## Overview

The automated checks on a change, from any system that runs them. A summary says how it went in words, such as "5 of 11
passed, 1 failed", and each check is a row with a mark and a word, the failing ones first. `compact` draws only a mark and
"5/11", to sit in a list row. Skipped checks aren't in the total.

## When to use

- Showing whether a change, build or release is ready, with what went wrong.
- A small indicator in a row, with `compact`, when the details are a click away.

## When not to use

- Steps that happen in a fixed order – use `status-tracker`.
- Test cases compared across prompt or model versions – use `eval-scorecard`.
- Malware scanning of a file – use `scan-status`.

## Anatomy

1. **Summary** `.ui-cks__summary` – how it went, in words
2. **Row** `.ui-cks__row` – one check
3. **Mark** `.ui-cks__mark` – the state's shape
4. **Word** `.ui-cks__word` – the state's name
5. **Re-run** `.ui-cks__retry` – on failing checks, with `retryable`
6. **Compact** `.ui-cks__compact` – the mark and `.ui-cks__tally`, in place of the rest

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card, for a place that already has one.

## Keyboard

The rows' buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Move between rows |
| ← / → | Move between a row and its Re-run |
| Home / End | Go to the first or last row |
| Enter / Space | Open the check, or re-run it |

## Screen readers

The rows are a list named by the heading. Each row's button says the check's name and state. `compact` reads the whole
summary, not "5/11". Pressing Re-run is announced through `role="status"`.

## Content

- Name checks for what they check: "Unit tests", not a job's internal id.
- Keep `detail` to one line about what went wrong.
- Use `counts` only when there are no details to show.

## Do

- Update the data after `tc-retry`: the element doesn't change a check's state itself.
- Use `countChecks()` to feed a compact view from the same data.

## Don't

- Don't rely on `retryable` for permission: the server still has to check who may re-run.
- Don't count skipped checks as passed; the total leaves them out on purpose.

## Example

```html
<tc-check-status id="checks" retryable></tc-check-status>

<script type="module">
  import "trenchcoat/check-status";
  import "trenchcoat/tokens.css";

  const el = document.querySelector("#checks");
  el.checks = [
    { id: "unit", name: "Unit tests", state: "failing", detail: "2 of 480 failed" },
    { id: "lint", name: "Lint", state: "passing" },
  ];
  el.addEventListener("tc-retry", (e) => console.log("Re-run", e.detail.id));
</script>
```

```tsx
import { CheckStatus, type CheckItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const checks: CheckItem[] = [
  { id: "unit", name: "Unit tests", state: "failing", detail: "2 of 480 failed" },
  { id: "lint", name: "Lint", state: "passing" },
];

export function Checks({ onRetry }: { onRetry: (id: string) => void }) {
  return <CheckStatus checks={checks} retryable onTcRetry={(e) => onRetry(e.detail.id)} />;
}
```
