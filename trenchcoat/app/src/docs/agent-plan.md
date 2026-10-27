---
pattern: none
status: react-twin
related: plan-vs-actual, run-checkpoints, approval-card, trace-waterfall
---

## Overview

An agent proposes a step-by-step plan; a person adjusts it, then watches it run. In review, steps can be renamed,
removed, reordered by dragging or from the keyboard, and new ones added at the end. Once running, the current step
shows a spinner and a live timer, done steps draw a check and show how long they took, a failed step can offer “Retry
from here”, and a thin line on the left fills as the plan moves along. People get a say before the agent acts, and a
clear view of where it is afterwards. The phase is always the app's: the plan never moves itself from review to
running or done.

## When to use

- Before an agent starts a multi-step task, so people can correct the approach while it's still cheap.
- Showing the progress of a run that follows a known list of steps.
- Letting people retry from the step that failed instead of starting over.

## When not to use

- Comparing what was planned with what actually happened, after the run – use `plan-vs-actual`.
- Going back to an earlier point of a run and trying again from there – use `run-checkpoints`.
- Approving a single action, not a whole plan – use `approval-card`.
- Timing every call and sub-step of a run in detail – use `trace-waterfall`.

## Anatomy

1. **Header** – the shared card header: a boxed icon, the goal with the step count under it, and the estimate
2. **Step** `.ui-pl__step` – a number or status mark, the title, a detail line and the tool
3. **Grip** `.ui-pl__grip` – drag to reorder; shows on hover or focus, in review only
4. **Step buttons** `.ui-pl__aside` – move up, move down and remove on hover or focus in review; the timer or duration while running
5. **Add step** `.ui-pl__add` – a field that adds a step at the end
6. **Footer** `.ui-pl__foot` – Cancel and Run plan in review; the run's status and elapsed time afterwards

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and the footer – the hint, Cancel and
Run plan, later the run's status – on the tray below it. Clean keeps everything in one white card, the header as its
first row and the footer as its last with a secondary Cancel; a running status line shimmers, and the done and failed
marks sit in round badges.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to each step in turn, its buttons, the Add step field and the footer |
| ↑ / ↓ | On a step in review, moves to the previous or next step; ↓ from the last goes to Add step |
| Alt ↑ / Alt ↓ | Moves the step up or down |
| Enter / F2 | Renames the step |
| Delete / Backspace | Removes the step |
| Enter | In the rename field, saves; in Add step, adds the step |
| Escape | In the rename field, cancels; in Add step, clears it |
| ↑ | In an empty Add step field, goes back to the last step |

## Screen readers

The steps are an ordered list named “Plan: Find out why customers churned”. In review, each step is focusable and
described by “Press Enter to rename, Alt plus arrow keys to move, Delete to remove.”; the buttons are named with the
step (“Move step 2 up: Pull churned accounts”, “Remove step 3: …”) and the rename field “Rename step 2”. Once running,
each step says its status (“, In progress”, “, Done”), the current one is `aria-current="step"`, and done steps read
“took 2.2s”. A polite live region confirms every edit (“Moved “Pull churned accounts” to position 1 of 5”, “Removed
…”, “Added … as step 6”) and the run: “Running plan”, “Step 2 done: …”, “Step 4 failed: … ”, “Plan done in 14s”.
After Run plan, focus moves to the run's status line.

## Content

- Make the heading the goal, as the person would say it: “Find out why customers churned last quarter”.
- Write step titles as actions: “Pull churned accounts from Stripe”.
- Use `detail` for what the step looks at or produces, and `tool` for the tool's real name (`search_web`).
- Write `error` for a failed step as what went wrong and why: “search_web timed out after 30s”.
- Give an `estimate` people can plan around: “~2 min”.

## Do

- Keep the plan short – five to eight steps – and merge steps people wouldn't tell apart.
- Return a promise from `runner` (or `onRun`) – the button waits, and a failure keeps the plan in review with a
  message.
- Set each step's `status` as the run moves; the timers and durations follow on their own.

## Don't

- Don't expect Run plan to switch the plan to running – set `status` yourself once the run has really started.
- Don't set `retryable` unless retrying from that step really works.
- Don't let the agent rewrite steps people edited without telling them.

## Example

```html
<tc-agent-plan id="plan" heading="Find out why customers churned" estimate="~2 min" status="draft" cancellable></tc-agent-plan>

<script type="module">
  import "trenchcoat/agent-plan";
  import "trenchcoat/tokens.css";

  const plan = document.querySelector("#plan");
  plan.steps = [
    { id: "pull", title: "Pull churned accounts", tool: "stripe.query" },
    { id: "read", title: "Read their last support tickets", tool: "zendesk.search" },
    { id: "sum", title: "Summarise the reasons" },
  ];
  plan.addEventListener("tc-run", (e) => {
    plan.status = "running";
    console.log(e.detail.steps.map((s) => s.id));
  });
</script>
```

```tsx
import { useState } from "react";
import { AgentPlan, type AgentPlanStep } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const draft: AgentPlanStep[] = [
  { id: "pull", title: "Pull churned accounts", tool: "stripe.query" },
  { id: "read", title: "Read their last support tickets", tool: "zendesk.search" },
  { id: "sum", title: "Summarise the reasons" },
];

export function ChurnPlan({ start }: { start: (steps: AgentPlanStep[]) => Promise<void> }) {
  const [steps, setSteps] = useState(draft);
  const [status, setStatus] = useState<"draft" | "running" | "done">("draft");
  return (
    <AgentPlan
      title="Find out why customers churned"
      estimate="~2 min"
      steps={steps}
      status={status}
      onChange={setSteps}
      onRun={async (final) => {
        await start(final);
        setStatus("running");
      }}
    />
  );
}
```
