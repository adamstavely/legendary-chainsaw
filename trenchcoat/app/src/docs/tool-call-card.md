---
pattern: disclosure
status: react-twin
related: sandbox-log, trace-waterfall, agent-plan, permission-request
---

## Overview

One tool call of an AI agent in a single line: the tool's name, a plain summary of what it did, and its status – a
spinner with a live timer, a check with the duration, or “Failed”. People who want the details open it to see the
arguments and the result as highlighted JSON, each with a copy button; a failed call shows its error and, if you
allow it, a Retry button. `tc-tool-call-group` folds several calls into one line – “Used 3 tools · 5.2s” – so a chat
transcript stays readable.

## When to use

- Showing what an agent did between two messages, in a chat or a run log.
- Letting people check the exact arguments and output of a call without leaving the conversation.
- Several calls in a row – wrap them in `tc-tool-call-group` so they read as one step.

## When not to use

- Long command output from a sandbox, streamed line by line – use `sandbox-log`.
- Timing a whole run step by step – use `trace-waterfall`.
- Asking permission before a tool runs – use `permission-request`.
- The plan of steps an agent is working through – use `agent-plan`.

## Anatomy

1. **Header** `.ui-tc__head` – the whole line; opens and closes the card
2. **Icon** `.ui-tc__icon` – the tool's mark in a tile, a wrench by default
3. **Name** `.ui-tc__name` – the tool name as the agent calls it, in mono
4. **Summary** `.ui-tc__summary` – what the call did, in plain words
5. **Status** `.ui-tc__status` – spinner and live timer, check and duration, or “Failed”
6. **Code** `.ui-tc__code` – the arguments or the result, highlighted, capped with “Show all” when long
7. **Group header** `.ui-tc-group__head` – the stacked icons, “Used 3 tools” and the total time

## Looks

Standard puts the tool's icon in a small bordered gray tile and divides the details from the header with a 1px
line. Clean drops the tile – a bare, muted 16px icon – and uses hairline dividers and a slightly taller header.
Both use the same status marks, timers and JSON colours, and the group's label shimmers while any call is running.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On a header: opens or closes the card or the group |
| Tab | Moves to the next header; in an open card, through Copy, “Show all” and Retry |

A closed card's details are inert, so Tab skips them.

## Screen readers

The header is a button with `aria-expanded` and `aria-controls`; its name reads the tool name, the summary and the
status – “search_web Searched the web for ‘CRM pricing 2026’ 2.4s”, or “running” while the call runs (the ticking
timer is hidden). A status region announces the outcome once: “search_web finished” or “fetch_page failed: Request
timed out after 1.5s (ETIMEDOUT)”. Inside a group the cards stay quiet and the group says it for all of them:
“Used 3 tools, 1 failed”. The copy buttons are named “Copy arguments” and “Copy result” and confirm with “Copied”;
“Show all” has `aria-expanded`; a failed retry is an alert: “Retry failed: …”.

## Content

- `name` is the tool's real identifier (`search_web`) – people who debug agents look for it.
- Write `summary` in the past tense, as what happened: “Searched the web for ‘CRM pricing 2026’”, “Read
  q4-targets.md”.
- Pass `error` as the message people can act on, not a stack trace; without one the card says “The tool call
  failed.”
- Use the group's `label` only when “Used 3 tools” doesn't fit – e.g. “Checked the pipeline”.

## Do

- Set `startedAt` on a running call, so the timer counts from when it really started.
- Pass `duration` once a call finishes, for an exact time.
- Pass `onRetry` only when running the call again is safe; return a promise so Retry waits and reports a failure.

## Don't

- Don't open every card by default – the line is the point; keep `open` for the call people need to see.
- Don't put secrets in `args` – they are shown and copied as they are.
- Don't nest groups inside groups.

## Example

```html
<tc-tool-call-card id="search" name="search_web" status="running"></tc-tool-call-card>

<script type="module">
  import "trenchcoat/tool-call-card";
  import "trenchcoat/tokens.css";

  const card = document.querySelector("#search");
  card.summary = "Searched the web for “CRM pricing 2026”";
  card.startedAt = Date.now();
  card.args = { query: "CRM pricing 2026", max_results: 3 };
  card.addEventListener("tc-open-change", (e) => console.log(e.detail.open));

  // Later, when the call returns
  card.result = { results: [{ title: "CRM pricing comparison 2026" }] };
  card.duration = 2400;
  card.status = "success";
</script>
```

```tsx
import { ToolCallCard, ToolCallGroup } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Calls({ retry }: { retry: () => Promise<void> }) {
  return (
    <ToolCallGroup>
      <ToolCallCard
        name="query_db"
        summary="Looked up 3 open deals"
        status="success"
        duration={1200}
        args={{ stage: "open", limit: 3 }}
        result={[{ id: 41, name: "Northwind" }]}
      />
      <ToolCallCard
        name="fetch_page"
        summary="Read the pricing page of attio.com"
        status="error"
        error="Request timed out after 1.5s"
        onRetry={retry}
      />
    </ToolCallGroup>
  );
}
```
