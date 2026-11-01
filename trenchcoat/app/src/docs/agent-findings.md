---
pattern: list
status: new
related: fan-out-grid, verification-queue, alert-feed, red-team-finding
---

## Overview

A group of agents checking something. One row per agent shows its progress in numbers and a bar, beside a feed of what they've found, newest first, each with its severity in words and a mark. New findings glide in and are announced politely. A line above totals the checks and what's been found so far, and `layout="stacked"` puts the agents above the feed.

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
5. **Summary** `.ui-agf__summary` – `.ui-agf__checks` across all the agents, and `.ui-agf__totals` by severity
6. **Agent extras** `.ui-agf__activity`, `.ui-agf__fraction` and `.ui-agf__counts` – what it's doing now, how far along, and its findings
7. **Where and when** `.ui-agf__location` and `.ui-agf__when` – on each finding

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. When narrow, the agents sit above the feed. With `layout="stacked"` they always do, and findings take one line when there's room. A page can set `--tc-agf-bar`.

## Keyboard

| Key | What it does |
|---|---|
| ↑ ↓ | Move between findings |
| Home / End | Go to the first or last finding |
| Enter / Space | Open or close a finding |
| Escape | Close the open finding |
| Tab | Moves through the filters, then the feed |

## Screen readers

Each progress bar is a `progressbar` named for its agent. The findings are one tab stop, and each is a button with `aria-expanded`. Severity is a word as well as a shape and a colour. The totals are a list named "Found so far", and each agent's counts include the severity's word for screen readers. `role="status"` announces new findings, several at once as a count, and never the ones there at the start.

## Content

Write `title` as what's wrong, in a line, and keep the evidence for `detail`. Use `high` sparingly, so it stays meaningful. Give `checked` and `total` as numbers to get a fraction, a bar and the overall line, or `checked` in words, such as "31 of 50 lines". `location` is a file and line or similar, shown in mono. Each agent counts the two most severe levels: critical and high when anything is critical, otherwise high and medium.

## Do

- Give `at`, so the newest come first, and `now` to show how long ago. The element doesn't read the clock, so update `now` yourself to keep it fresh.
- Keep ids stable between updates, so only new findings are announced.

## Don't

- Don't treat an empty feed as all clear until every agent is done.
- Don't use `critical` as a stronger `high`. Keep it for what must stop the work.

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
