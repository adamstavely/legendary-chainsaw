---
pattern: button
status: new
related: progress-tracker, dialog, status-tracker, approval-card
---

## Overview

What must pass before something is released. A summary card names what's being released and its version, shows one
tick per check coloured by its state, says how many checks have passed and what's still in the way – blockers, or
sign-offs to give – and opens a dialog that walks through every check. In the dialog, the library's Progress Tracker
lists the checks: sign-offs the person gives are ticked by hand, automated checks are read-only rows that pass, fail
or run later. Each failing check lists the blockers behind it, every blocker a link the page opens. Checks that run
later, a note on who approves, and the publish action follow; the action stays off while anything blocks.

## When to use

- Releasing a workflow, prompt, model or document version that has to pass checks first.
- Gathering the sign-offs a release needs in one place.
- Showing why something can't be published yet, and where to fix it.

## When not to use

- Where work stands in a fixed sequence of steps – use `status-tracker`.
- A single approve-or-reject decision – use `approval-card`.
- An onboarding checklist with nothing to release – use `progress-tracker`.

## Anatomy

1. **Card** `.ui-prd__card` – the summary, with the shared header and a status pill
2. **Meter** `.ui-prd__meter` – one tick per check: passed, failed, or still to run
3. **Summary** `.ui-prd__summary` – checks passed and what's in the way
4. **Dialog** `.ui-prd__dialog` – the checks, the status line and what follows
5. **Blockers** `.ui-prd__blockers` – each failing check with its blockers
6. **Blocker link** `.ui-prd__link` – opens the place a blocker points at
7. **Later** `.ui-prd__later` – checks that run during approval
8. **Note** `.ui-prd__note` – who approves and what happens next

## Looks

Standard puts the summary's header on a gray tray above a white card. Clean is one white card with the header as its
first row. The dialog, its tracker and its buttons follow the same look.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Review checks (or Publish…), and through the dialog |
| Enter / Space | Opens the dialog; in it, ticks a sign-off, follows a blocker link or publishes |
| Escape | Closes the dialog and returns focus to the button that opened it |

## Screen readers

The summary is a region named by its title. The meter reads “2 of 5 checks passed”; the pill says the state in words –
Ready, Blocked or Needs sign-off. The dialog is a modal named by its heading and described by its purpose. Read-only
checks say their state in words; giving or withdrawing a sign-off is announced politely (“Signed off: Owner signs
off”). Blocker links read the blocker and where it is.

## Content

- Name checks as what must hold: “Spec is valid”, “Data rules met” – not what was run.
- Give each blocker its place in `where`, so the link says where it goes: “Run 7f2c”, “Step 8”.
- Use `detail` on checks that run later to say when: “run during approval”.
- Say in the note who approves and what changes on approval.

## Do

- Open the blocker's place on `tc-open-blocker`, then update `checks` when it's fixed.
- Save sign-offs from `tc-confirmed-change`.
- Keep the action's label honest: “Submit for approval” when a person still approves.

## Don't

- Don't let the page publish around the dialog while something blocks.
- Don't make automated checks tickable – only sign-offs are.
- Don't show more than about ten checks; group the rest.

## Example

```html
<tc-publish-readiness id="release" subject="Weekly digest" version="v1.3" description="Summarises the week's tickets"></tc-publish-readiness>

<script type="module">
  import "trenchcoat/publish-readiness";
  import "trenchcoat/tokens.css";

  const release = document.querySelector("#release");
  release.checks = [
    { id: "spec", label: "Spec is valid", state: "passed" },
    { id: "test", label: "Test run passed", state: "failed", blockers: [{ id: "b1", label: "Step 6 timed out", where: "Run 7f2c" }] },
    { id: "owner", label: "Owner signs off", state: "manual" },
  ];
  release.addEventListener("tc-open-blocker", (e) => console.log(e.detail.blocker.id));
  release.addEventListener("tc-confirmed-change", (e) => console.log(e.detail.confirmed));
  release.addEventListener("tc-publish", () => console.log("publish"));
</script>
```

```tsx
import { useState } from "react";
import { PublishReadiness, type ReadinessCheck } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const checks: ReadinessCheck[] = [
  { id: "spec", label: "Spec is valid", state: "passed" },
  { id: "test", label: "Test run passed", state: "failed", blockers: [{ id: "b1", label: "Step 6 timed out", where: "Run 7f2c" }] },
  { id: "owner", label: "Owner signs off", state: "manual" },
];

export function Release() {
  const [confirmed, setConfirmed] = useState<string[]>([]);
  return (
    <PublishReadiness
      subject="Weekly digest"
      version="v1.3"
      checks={checks}
      confirmed={confirmed}
      onConfirmedChange={setConfirmed}
      onOpenBlocker={(blocker) => console.log(blocker.id)}
      onPublish={() => console.log("publish")}
      note="The workflow's owner approves."
    />
  );
}
```
