---
pattern: list
status: new
related: fan-out-grid, verification-queue, alert-feed, red-team-finding
---

## Overview

A group of agents checking something. One row per agent shows its progress in numbers and a bar, beside a feed of what they've found, newest first, each with its severity in words and a mark. New findings glide in and are announced politely.

## When to use

- Several agents reviewing a document, a dataset or a change at once.
- Watching results arrive before the whole check has finished.

## When not to use

- Many workers with no findings to show – use `fan-out-grid`.
- Claims a person must verify one by one – use `verification-queue`.
- Alerts someone must act on – use `alert-feed`.

## Anatomy

1. **Agents** `.ui-agf__agents` – each `.ui-agf__agent` with `.ui-agf__status`, `.ui-agf__track` and `.ui-agf__pct`
2. **Filters** `.ui-agf__filters` – by agent and by severity
3. **Feed** `.ui-agf__feed` – each `.ui-agf__finding` with `.ui-agf__severity`
4. **Detail** `.ui-agf__detail` – more about the open finding

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. When narrow, the agents sit above the feed. A page can set `--tc-agf-bar`.

## Keyboard

| Key | What it does |
|---|---|
| ↑ ↓ | Move between findings |
| Home / End | Go to the first or last finding |
| Enter / Space | Open or close a finding |
| Escape | Close the open finding |
| Tab | Moves through the filters, then the feed |

## Screen readers

Each progress bar is a `progressbar` named for its agent. The findings are one tab stop, and each is a button with `aria-expanded`. Severity is a word as well as a shape and a colour. `role="status"` announces new findings, several at once as a count, and never the ones there at the start.

## Content

Write `title` as what's wrong, in a line, and keep the evidence for `detail`. Use `high` sparingly, so it stays meaningful. `checked` says what's been covered in words, such as "31 of 50 lines".

## Do

- Give `at`, so the newest come first.
- Keep ids stable between updates, so only new findings are announced.

## Don't

- Don't treat an empty feed as all clear until every agent is done.

## Example

```html
<tc-agent-findings id="check"></tc-agent-findings>

<script type="module">
  import "trenchcoat/agent-findings";
  import "trenchcoat/tokens.css";

  const check = document.querySelector("#check");
  check.agents = [{ id: "a", name: "Budget checker", status: "running", progress: 0.6 }];
  check.findings = [{ id: "f", agent: "a", severity: "high", title: "Totals don't match" }];
</script>
```

```tsx
import { AgentFindings, type AgentFinding, type AgentFindingsAgent } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const agents: AgentFindingsAgent[] = [{ id: "a", name: "Budget checker", status: "running", progress: 0.6 }];
const findings: AgentFinding[] = [{ id: "f", agent: "a", severity: "high", title: "Totals don't match" }];

export function Check() {
  return <AgentFindings agents={agents} findings={findings} />;
}
```
