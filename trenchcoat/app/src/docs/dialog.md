---
pattern: dialog
status: beta
related: model-picker
---

## Overview

A native modal that asks for one decision or shows one short task, then hands focus back. It holds the person's
attention on a heading, an optional line saying what the dialog is for, the app's content and a footer of actions.
The content and the actions are the app's: the dialog's own control styles stay inside its own parts, so a hosted
`tc-button`, progress tracker or form renders exactly as it does anywhere else.

## When to use

- Confirming a consequential step – applying settings, publishing, deleting – with the action in the footer
  (`actions`) and Close relabelled "Cancel".
- A short review that needs the person's full attention, such as a checklist before a release.
- Showing a single message that must be acknowledged before going on (no `actions`; Close is the primary button).

## When not to use

- A choice from a list of models or options – use `model-picker`.
- Read-only results people only inspect – show them in the page with the run and output components.

## Anatomy

1. **Heading** `.tc-settings-card > header h3` – the dialog's name, also its accessible name
2. **Description** `.tc-settings-card > header p` – optional: one line on what the dialog is for
3. **Body** `.tc-dialog-body` – the app's content (`content`, `text`, or React children)
4. **Close** `.tc-dialog-footer > button` – the built-in button that closes the dialog
5. **Actions** `.tc-dialog-actions` – the app's buttons, after Close

## Looks

Standard and Clean share the same white card on a dimmed page, with a hairline above the footer. The look reaches
the controls inside: a hosted `tc-button` follows its own look, and the built-in Close button uses the look's
secondary or primary recipe.

## Keyboard

| Key | What it does |
| --- | --- |
| Tab / Shift+Tab | Moves between the controls in the dialog; focus stays inside while it is open |
| Escape | Asks to close (a cancelable `tc-open-change`), also when Close is hidden |
| Enter / Space | Activates the focused button |

Focus moves into the dialog when it opens and returns to the control that opened it when it closes.

## Screen readers

The native `dialog` is modal, named by the heading through `aria-labelledby`, and described by the description line
through `aria-describedby` when there is one. Close is a button named by `close-label` ("Close" unless set).

## Content

- The heading names the decision as a question or a task: "Apply model settings?", "Ready to publish?".
- The description is one sentence of consequence: "The new settings apply to every conversation in this
  workspace."
- Name the action for what it does – "Apply settings", "Publish" – not "OK". Beside an action, relabel Close
  "Cancel".

## Do

- Put the app's decision in `actions` and let Close turn secondary (`close-button="auto"`, the default).
- Hide Close (`close-button="hidden"`) only when an action in `actions` also dismisses the dialog; Escape still
  closes.
- Keep values application-owned and control `open` with `tc-open-change` (React: `open` and `onOpenChange`).

## Don't

- Don't put the submit button in the body to get it near the content – use `actions`.
- Don't restyle hosted controls to undo the dialog's styles; nothing from the dialog reaches them.
- Don't stack a second dialog for a follow-up question – change the content instead.

## Example

```html
<script type="module">
  import "trenchcoat/dialog";
  import "trenchcoat/button";
  const dialog = document.querySelector("tc-dialog");
  const apply = Object.assign(document.createElement("tc-button"), { label: "Apply settings", variant: "primary" });
  apply.addEventListener("click", () => (dialog.open = false));
  dialog.actions = apply;
  dialog.addEventListener("tc-open-change", (e) => console.log("open:", e.detail.open));
  document.querySelector("#review").addEventListener("click", () => (dialog.open = true));
</script>
<tc-button id="review" label="Review settings"></tc-button>
<tc-dialog
  label="Apply model settings?"
  description="The new settings apply to every conversation in this workspace."
  close-label="Cancel"
  text="Temperature drops from 0.7 to 0.3."
></tc-dialog>
```

```tsx
import { useState } from "react";
import { Button, Dialog } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Example() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button label="Review settings" onClick={() => setOpen(true)} />
      <Dialog
        label="Apply model settings?"
        description="The new settings apply to every conversation in this workspace."
        closeLabel="Cancel"
        open={open}
        onOpenChange={setOpen}
        actions={<Button variant="primary" label="Apply settings" onClick={() => setOpen(false)} />}
      >
        <p>Temperature drops from 0.7 to 0.3, and answers cite their sources.</p>
      </Dialog>
    </>
  );
}
```
