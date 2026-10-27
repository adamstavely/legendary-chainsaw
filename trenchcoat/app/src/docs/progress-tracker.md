---
pattern: checkbox
status: stable
related: setup-guide, stepper-form, usage-meter
---

## Overview

An onboarding checklist with a progress bar above it. People see how far they've got (“2/6”), tick steps off as
they go, and get a little satisfaction from each one: the tick draws itself, the bar grows and a shine runs across
it. With `auto-play` it ticks the open steps one after another on its own – useful on a landing page or an empty
state – and stops as soon as someone interacts.

## When to use

- A short list of set-up tasks for a new account or workspace, where order doesn't matter much.
- Showing what's left to do on a home or empty screen, with people ticking steps off themselves.
- A product tour or landing page that shows the checklist filling up (`auto-play`).

## When not to use

- Set-up tasks that each need instructions, a button and their own content – use `setup-guide`.
- Steps that must be done in order, each with a form – use `stepper-form`.
- Usage against a limit or a quota – use `usage-meter`.

## Anatomy

1. **Header** `.tc-head` – a checklist icon and the heading, what the checklist is for; it also names the bar
2. **Count** `.ui-progress__count` – done out of total, the number rolling when it changes
3. **Bar** `.ui-progress__bar` – the progress, with a shine each time it grows
4. **Step** `.ui-progress__step` – a check, the label and an optional icon
5. **Pause / Play** `.ui-progress__play` – only with `auto-play`; stops and restarts it

## Looks

Standard puts the header on a gray tray above a white card with a thick dark bar and dark checks, with roomier
padding. Clean is a narrower white card with the header as its first row, hairline shadows and quieter gray type; the
bar is thin and blue and the checks blue.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Pause / Play (with `auto-play`), then each step |
| Space / Enter | On a step, ticks or clears it; on Pause / Play, stops or restarts auto play |

Any key press or pointer press inside the tracker, other than on Pause / Play, stops auto play.

## Screen readers

The bar is a `progressbar` named by the heading, with `aria-valuetext` like “2 of 6 done”. Each step is a button
with `role="checkbox"` and `aria-checked`, named by its label; step icons are hidden. With auto play, the button is
named “Pause auto-play” while it runs and “Play auto-play” when stopped. The visible count is hidden, since the bar
says the same.

## Content

- Make the heading the goal: “Getting started”, “Set up your workspace”.
- Write each step as an action with an object: “Connect Slack”, “Invite two teammates”.
- Keep the list short – four to seven steps; a list that never ends doesn't motivate.
- Use the icon for the app a step belongs to, not for decoration.

## Do

- Mark steps the product already knows are done with `done: true`, so people don't start from zero.
- Listen for `tc-done-change` and save the ticks, or control them with `done` and call `preventDefault()`.
- Keep `auto-play` for showcase screens; in a working product let people tick their own steps.

## Don't

- Don't tick steps people haven't done to make progress look better.
- Don't put links or buttons in step labels – the whole row is the checkbox.
- Don't use it for a single task; a list of one is a button.

## Example

```html
<tc-progress-tracker id="setup" heading="Getting started"></tc-progress-tracker>

<script type="module">
  import "trenchcoat/progress-tracker";
  import "trenchcoat/tokens.css";

  const tracker = document.querySelector("#setup");
  tracker.steps = [
    { id: "account", label: "Create your account", done: true },
    { id: "slack", label: "Connect Slack" },
    { id: "invite", label: "Invite two teammates" },
  ];
  tracker.addEventListener("tc-done-change", (e) => console.log(e.detail.done));
</script>
```

```tsx
import { useState } from "react";
import { ProgressTracker, type ProgressStep } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const steps: ProgressStep[] = [
  { id: "account", label: "Create your account" },
  { id: "slack", label: "Connect Slack" },
  { id: "invite", label: "Invite two teammates" },
];

export function Onboarding() {
  const [done, setDone] = useState(["account"]);
  return <ProgressTracker title="Getting started" steps={steps} done={done} onDoneChange={setDone} />;
}
```
