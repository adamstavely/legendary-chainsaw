---
pattern: list
status: new
related: agent-plan, agent-monitor, trace-waterfall, approval-card, decision-card
---

## Overview

The steps an agent works through, as one quiet trail for a chat answer or a side panel. The header has the task and how far it is ("3/5"). Done steps carry a check and how long they took. The step it's on says what it's doing and branches into its sub-steps, the one under way with a live timer. A step that needs a person waits behind a dashed ring with "Needs your OK" and Approve and Decline. What's still to come is quiet.

## When to use

- Showing where an agent is in a task while it runs: what's done, what it's doing now and what comes next.
- A chat answer, a side panel or a task card that should show the agent's steps without a full trace.
- Plans with a step that needs approval, such as merging, sending or paying, so people see the stop coming.

## When not to use

- Reviewing or editing a plan before it runs – use `agent-plan`.
- The timing and cost of every call in a run – use `trace-waterfall`.
- The decision itself, with its context and diff – use `approval-card` or `decision-card`.

## Anatomy

1. **Header** – the task, and `.ui-atr__count` with how many steps are done, beside `.ui-atr__toggle`
2. **Trail** `.ui-atr__trail` – a `.ui-atr__step` per step, each with `.ui-atr__mark` and `.ui-atr__line` on its rail
3. **Light** `.ui-atr__light` – runs down the line of the step it's on
4. **Sub-steps** `.ui-atr__subs` – a `.ui-atr__sub` each, with `.ui-atr__timer` on the one under way
5. **Decision** `.ui-atr__decide` – Approve and Decline on a waiting step

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-atr-mark`, `--tc-atr-sub-mark` and `--tc-atr-light` (how long the light takes down the trail).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Move to Hide steps, then to Approve and Decline on a waiting step |
| Enter / Space | Fold or open the trail, or approve or decline |

## Screen readers

The trail is an ordered list named after the task, and each step's status is in words, also for done and upcoming steps where the word isn't shown. Hide steps reports whether the trail is open (`aria-expanded`). Approve and Decline name the step they act on. When the step it's on changes, a polite status line says so. The timer isn't announced, because a live region reading it every second would drown everything else out. The light and the marks are decorative.

## Content

- Name steps as actions: "Find the cause", "Open the pull request".
- Keep `detail` to one line: what it's doing now, or why it waits.
- Times are epoch ms. Pass `now` for a fixed clock; otherwise the element keeps its own.

## Do

- Listen for `tc-decision` to really approve or decline the step. Prevent it when the decision didn't go through.
- Update `steps` as the agent moves on; the trail follows.

## Don't

- Don't put a long plan with dozens of steps in it – group them into a few steps with sub-steps.
- Don't rely on the step's own change after Approve in React: `steps` comes from your state, so update it there.

## Example

```html
<tc-agent-trail id="trail" heading="Fix the date parser"></tc-agent-trail>

<script type="module">
  import "@adamstavely/trenchcoat/agent-trail";
  import "@adamstavely/trenchcoat/tokens.css";

  const trail = document.querySelector("#trail");
  const started = Date.now() - 90000;
  trail.steps = [
    { id: "repro", title: "Reproduce the bug", status: "done", started, ended: started + 40000 },
    {
      id: "fix",
      title: "Write the fix",
      status: "running",
      started: started + 40000,
      detail: "Handling the hour the clocks skip",
      substeps: [
        { id: "a", title: "Patch parseLocal()", status: "done", started: started + 40000, ended: started + 70000 },
        { id: "b", title: "Add tests", status: "running", started: started + 70000 },
      ],
    },
    { id: "pr", title: "Open the pull request", status: "pending" },
  ];
  trail.addEventListener("tc-decision", (e) => console.log(e.detail.decision, e.detail.step.id));
</script>
```

```tsx
import { AgentTrail, type AgentTrailStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Trail({ steps, onDecide }: { steps: AgentTrailStep[]; onDecide: (id: string, approve: boolean) => void }) {
  return (
    <AgentTrail
      title="Fix the date parser"
      steps={steps}
      onTcDecision={(e) => {
        e.preventDefault();
        onDecide(e.detail.step.id, e.detail.decision === "approve");
      }}
    />
  );
}
```
