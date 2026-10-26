---
pattern: button
status: react-twin
related: segmented-control, message-actions, profile-menu
---

## Overview

The control people press to do something: save, create, copy, delete. It comes in four variants that rank actions
by weight – primary, secondary, ghost and destructive – in three sizes, with an icon before or after the label or
an icon on its own. While the work runs, `loading` dims the label under a moving shine, blocks further clicks and
tells screen readers it's busy, and when the label changes the button glides to its new width instead of jumping.
Inside it is a native `<button>`, so keyboard activation, `disabled` and form submission behave as the browser's
own.

## When to use

- The main action of a page, dialog or card (“Save”, “Create project”) – one `primary` per area.
- Supporting actions next to it – `secondary`, or `ghost` for the quietest ones in toolbars and card headers.
- Removing or revoking something – `destructive`, ideally behind a confirmation.
- Work that takes a moment after the press – set `loading` until it finishes, and change the label if it helps
  (“Save” → “Saving…”).

## When not to use

- Switching between two to five views or modes that stay visible – use `segmented-control`.
- A row of small actions on a chat message (copy, retry, rate) – use `message-actions`.
- Opening an account or settings menu from an avatar – use `profile-menu`.

## Anatomy

1. **Button** `tc-button` – the chip; a native `<button>` inside takes focus, clicks and form submission across it
2. **Icon** `[slot="icon"]` – optional, before the label; `icon-right` puts one after it
3. **Label** `.ui-button__label` – the text, and the button's accessible name

## Looks

Standard is the heavier of the two: a 28 · 32 · 40 px scale, a secondary button that's white with the card ring,
and a large size with bigger text and icons. Clean is smaller (24 · 28 · 32 px) with hairline shadows on secondary,
muted icons on secondary and ghost that darken on hover, and a quieter red fill for destructive. Primary is the
same flat ink chip in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves focus to the button (a disabled button is skipped) |
| Enter / Space | Presses it – nothing happens while it's `loading` |

## Screen readers

The inner native `<button>` is what's announced, named by `label` – with `hide-label` the label stays in the
accessibility tree, visually hidden, so an icon-only button still has a name. While `loading`, the button is
`aria-busy` and `aria-disabled`, and its name gains “, loading” (“Save, loading”). ARIA attributes set on
`<tc-button>` itself – `aria-label`, `aria-expanded`, `aria-controls` and the like – move to the inner button.
Icons in the React wrapper are `aria-hidden`.

## Content

- Start with a verb that says what happens: “Save changes”, “Invite people”, “Delete project” – not “OK” or
  “Submit”.
- Keep it to one to three words; the context around the button carries the rest.
- Use sentence case, and no full stop.
- A loading label should say the same thing in progress: “Saving…”, “Deleting…”.
- An icon-only button still needs a `label` – it's the name screen readers and tooltips use.

## Do

- Use one primary button per area and let secondary and ghost carry the rest.
- Set `type="submit"` on the button that submits a form, with `name` and `value` if the server needs to know which
  one was pressed.
- Keep a loading label close to the resting one – “Save” → “Saving…” glides a few pixels; a long sentence makes the
  button lurch.

## Don't

- Don't use `destructive` for anything that can't remove or revoke something.
- Don't use a button to navigate to another page – use a link.
- Don't disable a submit button to signal invalid fields; let people press it and show what's wrong.
- Don't put the label in children of `<tc-button>` – set `label`; the React wrapper turns string children into it.

## Example

```html
<tc-button id="save" label="Save" type="submit"></tc-button>
<tc-button variant="ghost" label="Close" hide-label>
  <svg slot="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" /></svg>
</tc-button>

<script type="module">
  import "trenchcoat/button";
  import "trenchcoat/tokens.css";

  const save = document.querySelector("#save");
  save.variant = "primary";
  save.addEventListener("click", async () => {
    save.loading = true;
    save.label = "Saving…";
    await fetch("/api/save", { method: "POST" });
    save.loading = false;
    save.label = "Save";
  });
</script>
```

```tsx
import { useState } from "react";
import { Button } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function SaveButton() {
  const [saving, setSaving] = useState(false);
  return (
    <Button
      variant="primary"
      loading={saving}
      onClick={() => {
        setSaving(true);
        setTimeout(() => setSaving(false), 1500);
      }}
    >
      {saving ? "Saving…" : "Save"}
    </Button>
  );
}
```
