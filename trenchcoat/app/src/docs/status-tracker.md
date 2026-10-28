---
pattern: list
status: new
related: progress-tracker, stepper-form, run-checkpoints, gate-config, coverage-matrix
---

## Overview

Where a piece of work stands in a fixed sequence of steps – gates to clear, stages to pass, reviews to sign off. The
steps sit on one line, each a ringed marker: a tick when cleared, its number when pending (with a "!" when it needs
attention), a cross when blocked, its number greyed when not reached. Beneath each marker are the step's number,
its name, its status in words and the date it got there. The line between two steps fills once the first is
cleared, and the current step – the first one not cleared – wears a soft halo. The heading counts what's cleared, a
legend names the statuses in use, and opening a step shows its record below: what happened, who owns it and the
evidence.

## When to use

- Approval or authorization pipelines: gates a programme, model or release must pass in order.
- Compliance and certification stages, procurement steps, a case moving through review.
- Any fixed sequence where people need to see what's done, what's stuck and what's next at a glance.

## When not to use

- A checklist people tick off themselves – use `progress-tracker`.
- A form split over several steps – use `stepper-form`.
- An agent run's restore points – use `run-checkpoints`.
- Configuring when a run pauses for a person – use `gate-config`.
- Many items against many checks – use `coverage-matrix`.

## Anatomy

1. **Legend** `.ui-stk__legend` – the statuses in use, beside the heading
2. **Marker** `.ui-stk__marker` – the step's ring and mark: ✓, ×, or its number
3. **Badge** `.ui-stk__bang` – the "!" on a step that needs attention
4. **Line** `.ui-stk__line` – the connector to the next step, filled once this step is cleared
5. **Step** `.ui-stk__step` – the marker, "GATE 5", the name, the status in words and the date
6. **Record** `.ui-stk__detail` – the open step: its status, date and owner, the summary and the evidence

## Looks

Standard is a white card on a gray tray, with the header and legend on the tray above it. Clean is one white card
with the header as its first row. The markers, line and record are the same in both. Each tone's ring, wash and
words come from the status tokens; `--tc-stk-marker` sets the marker's size and `--tc-stk-step` the narrowest a
step may be before the line scrolls sideways.

## Keyboard

The steps are one tab stop.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next step (↑ / ↓ when the steps stack) |
| Home / End | Moves to the first or last step |
| Enter / Space | Opens the step's record, or closes it if it's open |
| Escape | Closes the open record |
| Tab | Leaves the steps; with a record open, the next stops are its links and its Close button |

Close returns focus to the step. A step moved to off the edge of the scrolling area scrolls into view.

## Screen readers

The steps are an ordered list named by the heading. Each step is a button that reads its place, name, status, date
and any reason for attention: “Gate 5 of 9, Adversarial resilience, Pending, needs attention: One high finding
awaiting re-test”. The current step is `aria-current="step"`, and a step says whether its record is expanded.
Opening a record is confirmed in a polite status message, “Gate 5, Adversarial resilience: Pending. Record shown”,
and closing it with “Record closed”. The record is a section headed by the step; its Close button is labelled “Close
record”. The markers, badge and line are hidden – the words say the same.

## Content

- Name steps for what passing them proves: “Red-team clearance”, “Calibration baseline”, not form numbers.
- Set `noun` to what the steps are called – “Gate”, “Stage”, “Review” – or leave it empty for plain numbers.
- Give a pending step `attention` with a reason when someone has to act: “One high finding awaiting re-test”.
- Add your own statuses with `statuses` – `{ waived: { label: "Waived", tone: "info", mark: "check", done: true } }`.

## Do

- Give every cleared step its date and a record with the evidence, so the pipeline can be audited from the page.
- Use `hint` to say the steps open: “click any gate for its evidence record”.
- Keep to the order the work really follows – the line reads left to right.

## Don't

- Don't use it for steps that can happen in any order – it implies a sequence.
- Don't colour-code statuses yourself – the marks and words carry them, and the tones come from the status tokens.
- Don't put long text in a step's name – it wraps under a narrow marker; put detail in its record.

## Example

```html
<tc-status-tracker id="gates" heading="Programme authorization pipeline" noun="Gate"></tc-status-tracker>

<script type="module">
  import "trenchcoat/status-tracker";
  import "trenchcoat/tokens.css";

  const gates = document.querySelector("#gates");
  gates.hint = "click any gate for its evidence record";
  gates.steps = [
    { id: "scope", label: "Pre-registration & scope", status: "cleared", date: Date.parse("2025-10-12T12:00") },
    { id: "red-team", label: "Red-team clearance", status: "pending", attention: "One finding awaiting re-test" },
    { id: "pilot", label: "Operational pilot", status: "not-reached" },
  ];
  gates.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { StatusTracker, type StatusTrackerStep } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const steps: StatusTrackerStep[] = [
  { id: "scope", label: "Pre-registration & scope", status: "cleared", date: Date.parse("2025-10-12T12:00") },
  { id: "red-team", label: "Red-team clearance", status: "pending", attention: "One finding awaiting re-test" },
  { id: "pilot", label: "Operational pilot", status: "not-reached" },
];

export function Gates() {
  const [selected, setSelected] = useState<string | null>(null);
  return <StatusTracker title="Programme authorization pipeline" noun="Gate" steps={steps} selected={selected} onSelectedChange={setSelected} />;
}
```
