---
pattern: form
status: new
related: memory-panel, data-handling-policy, data-region, terms-dialog
---

## Overview

A person's own data in an AI product, in one card. Three switches say what they do in words and when each was last
changed: whether their chats help improve the model, whether chat history is saved, and whether the assistant keeps
memories, with a link to manage them. Turning history off says plainly that new chats are deleted after 30 days.
Below the switches, Export my data asks for a copy of everything and then says a link will be emailed; Delete all chats
opens a confirmation that names how many chats go and that it can't be undone; and Delete account sits at the end.

## When to use

- The privacy or data section of a person's settings in an AI product.
- Giving people a clear, reversible say over training, history and memory.
- A self-serve export and delete, so people don't need to write to support.

## When not to use

- Workspace-wide rules for retention, logs and training – use `data-handling-policy`.
- Seeing and editing what the assistant remembers – use `memory-panel`, and link to it with `memoryHref`.
- Where a workspace's data is stored – use `data-region`.
- Agreeing to terms – use `terms-dialog`.

## Anatomy

1. **Switch row** `.ui-dcl__row` – one setting: its name, what it means now and when it last changed
2. **Switch** `.ui-dcl__switch` – a button with `role="switch"`
3. **Meaning** `.ui-dcl__means` – what the setting does in its current state
4. **History note** `.ui-dcl__note` – shown while chat history is off
5. **Export** `.ui-dcl__export` – Export my data, with its status (`.ui-dcl__status`) beside it
6. **Delete all chats** `.ui-dcl__delete` – opens the confirmation (`.ui-dcl__dialog`)
7. **Delete account** `.ui-dcl__danger-link` – a link, or a button that fires `tc-delete-account`

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. The confirmation is the same modal dialog in both; its width is the component token `--tc-dcl-dialog-w`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the switches, links and buttons |
| Space / Enter | Flips a switch, or presses a button |
| Escape | Closes the confirmation without deleting anything |

In the confirmation, focus starts on Cancel, and Tab stays inside the dialog until it closes.

## Screen readers

Each switch is named by its setting ("Save chat history") and described by what it means right now, so turning it
on or off reads the new meaning. Changes, the export request and deleting chats are confirmed in a polite status
message. The confirmation is a modal dialog named by its question ("Delete all 342 chats?") and described by
"This can't be undone". When it closes, focus returns to Delete all chats.

## Content

- Say what a setting does, not what it is: "Your chats aren't used to train models", not "Training: off".
- Name consequences before they happen: how many chats a delete removes, and that it can't be undone.
- Keep the 30-day note accurate to your product's retention; rename it with `labels.historyOff`.

## Do

- Record when a setting changes and pass it back in `changed`, so people can see their last decision.
- Send the export link by email and set `exportStatus` to `ready` (with `exportHref`) when it's done.
- Link Manage memory to the place memories are actually edited.

## Don't

- Don't turn a switch back on for people – let them decide.
- Don't skip the confirmation for Delete all chats.
- Don't hide Delete account if people can delete their account; use `hide-delete-account` only when they can't.

## Example

```html
<tc-data-controls id="data" heading="Your data" chat-count="342" memory-href="/settings/memory"></tc-data-controls>

<script type="module">
  import "@adamstavely/trenchcoat/data-controls";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#data");
  card.value = { training: false, history: true, memory: true };
  card.changed = { training: Date.parse("2026-09-03") };
  card.addEventListener("tc-value-change", (e) => console.log(e.detail.field, e.detail.value));
  card.addEventListener("tc-export", () => console.log("export requested"));
  card.addEventListener("tc-delete-chats", (e) => console.log("delete", e.detail.count, "chats"));
</script>
```

```tsx
import { useState } from "react";
import { DataControls, type DataControlsValue, type DataExportStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PrivacySettings({ chats }: { chats: number }) {
  const [value, setValue] = useState<DataControlsValue>({ training: false, history: true, memory: true });
  const [exportStatus, setExportStatus] = useState<DataExportStatus>("idle");
  return (
    <DataControls
      title="Your data"
      value={value}
      onValueChange={(next) => setValue(next)}
      chatCount={chats}
      memoryHref="/settings/memory"
      exportStatus={exportStatus}
      onExport={() => setExportStatus("requested")}
      onDeleteChats={(count) => console.log("delete", count)}
    />
  );
}
```
