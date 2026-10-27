---
pattern: checkbox
status: stable
related: setup-guide, stepper-form, usage-meter
---

## Overview

An onboarding checklist with a progress bar above it. People see how far they've got (“2/6”), tick steps off as
they go, and get a little satisfaction from each one: the tick draws itself, the bar grows and a shine runs across
it. With `auto-play` it ticks the open steps one after another on its own – useful on a landing page or an empty
state – and stops as soon as someone interacts. Set `readonly` and it becomes a status list for work the product
does itself: steps can be done, `failed` or `pending`, and say so in words.

## When to use

- A short list of set-up tasks for a new account or workspace, where order doesn't matter much.
- Showing what's left to do on a home or empty screen, with people ticking steps off themselves.
- A product tour or landing page that shows the checklist filling up (`auto-play`).
- The stages of a job the product runs – an import, a publish – shown read only, with a stage that failed or is under
  way (`readonly`, `state`).

## When not to use

- Set-up tasks that each need instructions, a button and their own content – use `setup-guide`.
- Steps that must be done in order, each with a form – use `stepper-form`.
- Usage against a limit or a quota – use `usage-meter`.

## Anatomy

1. **Header** `.tc-head` – a checklist icon and the heading, what the checklist is for; it also names the bar
2. **Count** `.ui-progress__count` – done out of total, the number rolling when it changes
3. **Bar** `.ui-progress__bar` – the progress, with a shine each time it grows
4. **Step** `.ui-progress__step` – a check (a cross when failed, a turning ring when pending), the label, the state
   in words when it failed or is pending, and an optional icon
5. **Pause / Play** `.ui-progress__play` – only with `auto-play`; stops and restarts it

## Looks

Standard puts the header on a gray tray above a white card with a thick dark bar and dark checks, with roomier
padding. Clean is a narrower white card with the header as its first row, hairline shadows and quieter gray type; the
bar is thin and blue and the checks blue. Both lines through done steps unless `done-style="plain"`; both are up to
360 px (Clean 340 px) wide, 560 px with `fit="wide"`, or as wide as their container with `fit="fill"`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Pause / Play (with `auto-play`), then each step |
| Space / Enter | On a step, ticks or clears it (not a `disabled` one); on Pause / Play, stops or restarts auto play |

Failed, pending and read-only steps aren't controls, so Tab passes them; a `disabled` step stays in the tab order.

Any key press or pointer press inside the tracker, other than on Pause / Play, stops auto play.

## Screen readers

The bar is a `progressbar` named by the heading, with `aria-valuetext` like “2 of 6 done”. Each step is a button
with `role="checkbox"` and `aria-checked`, named by its label; a `disabled` step has `aria-disabled="true"`. A failed or pending step, and every step of a
`readonly` tracker, is plain text in the list: its label, then its state – “Scan for secrets, Failed”, “Build the
index, In progress”, “Upload the files, done” (the last two words for screen readers only). Step icons are hidden. With auto play, the button is
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
- Use `readonly` with `state` for progress the product makes: mark the stage under way `pending` and a stage that
  went wrong `failed`, and say what to do about it elsewhere on the screen.
- Use `done-style="plain"` when done steps are still worth reading, and `fit="fill"` in a wide column.

## Don't

- Don't tick steps people haven't done to make progress look better.
- Don't put links or buttons in step labels – the whole row is the checkbox.
- Don't mark a step `disabled` without saying, nearby, why it can't be ticked yet.
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

  // A status list for a job the product runs
  const job = document.createElement("tc-progress-tracker");
  Object.assign(job, { heading: "Import", readonly: true, doneStyle: "plain", fit: "fill" });
  job.steps = [
    { id: "upload", label: "Upload the files", done: true },
    { id: "scan", label: "Scan for secrets", state: "failed" },
    { id: "index", label: "Build the index", state: "pending" },
  ];
  document.body.append(job);
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
