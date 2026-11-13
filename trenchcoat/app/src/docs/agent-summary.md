---
pattern: none
status: new
related: agent-list, agent-monitor, version-history, trace-waterfall
---

## Overview

One agent's profile on a card: its status, model, tools, owner, and which version is live against a draft waiting to go out. Below that, two weeks of runs as a small daily chart of succeeded and failed runs, with the success rate, the median run time and the cost, and the recent failures with their errors. Edit, Run test and Pause or Resume sit at the bottom.

## When to use

- The top of an agent's page, opened from `agent-list`.
- A side panel that answers "is this agent healthy, and what broke?" at a glance.

## When not to use

- Every agent at once – use `agent-list`.
- One run as it happens – use `agent-monitor`; one run's calls and costs – use `trace-waterfall`.
- The history of an agent's versions – use `version-history`.

## Anatomy

1. **Facts** `.ui-agsm__facts` – `.ui-agsm__model`, `.ui-agsm__owner`, `.ui-agsm__version`s and the `.ui-agsm__tool` chips
2. **Figures** `.ui-agsm__figures` – `.ui-agsm__rate`, `.ui-agsm__median` and `.ui-agsm__cost`
3. **Chart** `.ui-agsm__chart` – a `.ui-agsm__bar` per day and kind, with `.ui-agsm__caption` holding the key and a summary
4. **Table** `.ui-agsm__table` – the same days as rows, shown by `.ui-agsm__toggle`
5. **Failures** `.ui-agsm__failure-list` – each `.ui-agsm__failure` with its `.ui-agsm__error`
6. **Actions** `.ui-agsm__actions` – Edit, Run test, and Pause or Resume

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-agsm-chart-h`, the chart's height, and `--tc-agsm-mark`, the status mark's size.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Show as table, then the actions |
| Enter / Space | Show or hide the table; press an action |

## Screen readers

The chart is drawn for the eye and hidden from screen readers; its caption says the totals in a sentence, and Show as table (a toggle button, `aria-pressed`) reveals the same days as a table with row and column headers. The facts are a description list. Failures are a list with the time in a `time` element. Status is a word beside its mark.

## Content

- `days` are oldest first, usually the last 14, with `succeeded` and `failed` counts each.
- A failure's `error` says what went wrong in a sentence a person can act on; `step` names where.
- `liveVersion` and `draftVersion` are short labels, such as "v12" and "v13".

## Do

- Listen for `tc-action` to really pause or resume the agent, and prevent it if that fails.
- Keep the tools to the words people use, not internal function names.

## Don't

- Don't rely on Edit or Run test to change anything on the card – they're the page's to act on.

## Example

```html
<tc-agent-summary id="agent" name="Invoice matcher" status="failing" model="Model M" owner="Finance operations"></tc-agent-summary>

<script type="module">
  import "@adamstavely/trenchcoat/agent-summary";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#agent");
  const day = 86400000;
  const start = Date.UTC(2026, 10, 1);
  card.tools = ["Ledger search", "Purchase orders"];
  card.days = [6, 7, 5, 8, 7, 6, 9].map((runs, i) => ({ date: start + i * day, succeeded: runs - (i % 3 ? 0 : 2), failed: i % 3 ? 0 : 2 }));
  card.failures = [{ id: "f1", at: start + 6 * day, step: "Fetch purchase orders", error: "The export timed out after 30 s." }];
  card.addEventListener("tc-action", (e) => console.log(e.detail.action));
</script>
```

```tsx
import { AgentSummary, type AgentSummaryDay, type AgentSummaryFailure } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Agent({ days, failures }: { days: AgentSummaryDay[]; failures: AgentSummaryFailure[] }) {
  return (
    <AgentSummary
      name="Invoice matcher"
      status="live"
      model="Model M"
      tools={["Ledger search", "Purchase orders"]}
      days={days}
      failures={failures}
      onAction={(action) => console.log(action)}
    />
  );
}
```
