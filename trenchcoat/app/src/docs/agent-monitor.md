---
pattern: list
status: new
related: trace-waterfall, live-view, agent-plan, agent-inbox
---

## Overview

One agent at work, as a compact card: its current step with a clock and the cost so far, a strip of its steps sized by how long each took, and the finished steps as a list. Picking a step shows its detail.

## When to use

- Keeping an eye on one running agent beside other work.
- Checking at a glance where the time has gone.

## When not to use

- A full breakdown of calls, tokens and costs – use `trace-waterfall`.
- Watching the agent's screen – use `live-view`.
- Many agents at once – use `agent-inbox`.

## Anatomy

1. **Now** `.ui-amn__now` – `.ui-amn__current-step`, `.ui-amn__clock` and `.ui-amn__cost`
2. **Strip** `.ui-amn__strip` – a `.ui-amn__segment` per step, sized by how long it took
3. **Detail** `.ui-amn__detail` – the picked step
4. **Finished** `.ui-amn__steps` – each `.ui-amn__step-row` with `.ui-amn__tool`
5. **Actions** `.ui-amn__actions` – Pause or Resume, and Stop

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-amn-strip` and `--tc-amn-segment-min`.

## Keyboard

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move through the strip, or through the list |
| Home / End | Go to the first or last step |
| Enter / Space | Pick a step, or un-pick it |
| Escape | Close the detail, and go back to what opened it |

## Screen readers

The strip is a named group with one tab stop, and each segment's name says the step, its status and how long it took. The finished steps are a list with one tab stop. The clock isn't announced, because a live region reading it every second would drown everything else out. Status is in words.

## Content

Tools are words, such as "Archive search". A page may pass `toolIcon`, its own element, but the library draws no third-party logos. `cost` is a number and `currency` an ISO 4217 code.

## Do

- Set `ended-at` when a run pauses or finishes, so the clock shows the real time after a reload.
- Listen for `tc-action` to really pause or stop the agent. Prevent it if that fails.

## Don't

- Don't rely on Stop to change `status`. Only the page knows how the run ended, so set it there.

## Example

```html
<tc-agent-monitor id="run" name="Archive reader"></tc-agent-monitor>

<script type="module">
  import "trenchcoat/agent-monitor";
  import "trenchcoat/tokens.css";

  const run = document.querySelector("#run");
  run.startedAt = Date.now() - 60000;
  run.cost = 0.42;
  run.steps = [{ id: "a", label: "Search the archive", startedAt: run.startedAt, status: "running" }];
  run.addEventListener("tc-action", (e) => console.log(e.detail.action));
</script>
```

```tsx
import { AgentMonitor, type AgentMonitorStep } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Run({ startedAt, steps }: { startedAt: number; steps: AgentMonitorStep[] }) {
  return <AgentMonitor name="Archive reader" startedAt={startedAt} steps={steps} cost={0.42} onTcAction={(e) => console.log(e.detail.action)} />;
}
```
