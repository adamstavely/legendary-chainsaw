---
pattern: disclosure
status: new
related: memory-panel, tool-permissions, kill-switch
---

## Overview

What happens to an organization's data, as a lifecycle: how long conversations are kept, what goes into logs and what
is redacted from them, whether memory lasts beyond a conversation, whether data is used for training, and when it is
deleted. Each stage leads with the policy the app reports as in effect, says when a choice hasn't been applied yet, and
shows a lock where the setting comes from higher up. Pressing a stage opens its controls in place. Deletion requests
sit underneath with their status.

These settings don't enforce anything. The element records what someone chose and shows what the app says is in
effect; retention, redaction, training use and deletion happen in your application and your providers, or not at all.

## When to use

- A workspace or organization settings page for conversation data, logs, memory and training use.
- Anywhere people need to see the policy actually in effect next to what they chose – after a change, while it rolls
  out, or when a parent organization overrides it.
- Letting admins ask for data to be deleted and follow the request to completion.

## When not to use

- Viewing or editing individual memories – use `memory-panel`.
- Deciding what an agent's tools may reach – use `tool-permissions`.
- Halting agents in an incident – use `kill-switch`.

## Anatomy

1. **Lifecycle** `.ui-dhp__flow` – the stages in order, from conversation to deletion
2. **In effect** `.ui-dhp__stage-what` – what happens to the data at a stage, as the app reports it
3. **Lock** `.ui-dhp__stage-lock` – the stage is set higher up and can't be changed here
4. **Deletion requests** `.ui-dhp__deletions` – each request and its status
5. **Request deletion** `.ui-dhp__request` – asks for a deletion, after confirming

## Looks

Standard is a white card on a gray tray, the stages filled tiles joined by chevrons, and the open stage outlined with
its controls in an outlined panel below. Clean is one white card, the stages columns between hairlines, the open one
tinted with an accent rule and its controls in the card itself, with quieter type and thinner icons. Narrow, the
lifecycle runs down the card in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the stages, then the open stage's Done and controls, then Request deletion |
| Enter / Space | On a stage, opens its controls under the lifecycle and moves focus to them (or closes them if open); on a checkbox or switch, turns it on or off |
| Arrow keys, Home, End | In a segmented choice, move to and pick an option |
| Escape | In an open stage's controls, closes them and returns focus to the stage |

In the deletion dialog, focus starts on Cancel:

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between what to delete, Cancel and Delete, wrapping inside the dialog |
| Escape | Closes without asking for anything |

Done and Cancel return focus to the button that opened them.

## Screen readers

The element is a group named by its heading. The lifecycle is a list named “Data lifecycle”; each stage you can edit
is a button with `aria-expanded` and `aria-controls` pointing at the controls. It reads its name and what's in
effect – “Logs”, “Full content”, “4 kinds redacted” – then “Changing to 30 days” or “Not reported” when they apply,
and “Set by Northwind IT” when it's locked. The open controls are a region named by the stage. Each segmented choice is a radio
group named by its label; redaction categories are checkboxes and training a switch, described by their lock. Every
setting says “In effect: 90 days – not yet your choice” or similar. The deletion dialog is a modal `alertdialog`
named “Request deletion?”. A polite status message confirms “Deletion of conversations requested.”

## Content

- Name options as people say them: “30 days”, “Across conversations”, “Full content”. Retention options that start
  with a number read “Kept 30 days” on the stage.
- Give `unavailable` options the reason, in a sentence: “Your organization keeps conversations for at most 90 days.”
- Say who set a lock in `by` (“Northwind IT”) and why in `note`; without `by` it reads “Set by your organization”.
- Report `effective` from what your platform applied, not from what was saved. A field you can't report stays out,
  and the stage says “Not reported”.
- Give deletion requests a `detail` with who asked and when.

## Do

- Apply the policy on your server and providers, then update `effective` – that's what the stages lead with.
- Enforce locks on your server too; a lock here only stops the controls.
- Answer `tc-deletion-request` by listing the request in `deletions`; the pending row stays until the list changes.

## Don't

- Don't tell people data is deleted, unlogged or excluded from training because a setting here says so.
- Don't hide a locked setting – show it, with who set it.
- Don't report a deletion as completed before it is.

## Example

```html
<tc-data-handling-policy id="policy" name="policy"></tc-data-handling-policy>

<script type="module">
  import "trenchcoat/data-handling-policy";
  import "trenchcoat/tokens.css";

  const policy = document.querySelector("#policy");
  policy.value = { retention: "30d", memory: "conversation", logging: "metadata", redact: ["personal"], training: false };
  policy.effective = { retention: "90d", memory: "conversation", logging: "metadata", redact: ["personal"], training: false };
  policy.locks = [{ field: "training", by: "Northwind IT" }];
  policy.addEventListener("tc-value-change", (e) => {
    fetch("/api/data-policy", { method: "PUT", body: JSON.stringify(e.detail.value) });
  });
  policy.addEventListener("tc-deletion-request", (e) => {
    fetch("/api/deletions", { method: "POST", body: JSON.stringify({ scope: e.detail.scope.id }) });
  });
</script>
```

```tsx
import { useState } from "react";
import { DataHandlingPolicy, type DataHandlingPolicyValue, type DataPolicyDeletion } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function DataSettings({ applied, deletions, save }: { applied: DataHandlingPolicyValue; deletions: DataPolicyDeletion[]; save: (value: DataHandlingPolicyValue) => void }) {
  const [value, setValue] = useState(applied);
  return (
    <DataHandlingPolicy
      value={value}
      effective={applied}
      locks={[{ field: "training", by: "Northwind IT" }]}
      deletions={deletions}
      onChange={(next) => {
        setValue(next);
        save(next);
      }}
    />
  );
}
```
