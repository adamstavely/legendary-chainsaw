---
pattern: list
status: new
related: team-flag-picker, color-picker, tag-input, todo-list
---

## Overview

Where a team decides what its flags mean: each flag's colour, name and meaning, and the order they're offered in.
People then choose from these flags on a file with `team-flag-picker`.

## When to use

- Team or workspace settings, where someone sets up the markers everyone shares.
- Showing a team what its flags mean, with `readonly`.

## When not to use

- Picking a flag on a file – use `team-flag-picker`.
- Choosing one colour with full control – use `color-picker`.
- Free-text labels nobody needs to define – use `tag-input`.

## Anatomy

1. **List** `.ui-tfe__list` – the team's flags, in order
2. **Row** `.ui-tfe__row` – one flag
3. **Name and meaning** `.ui-tfe__name`, `.ui-tfe__meaning` – what the flag is called, and when to use it
4. **Swatches** `.ui-tfe__swatches` – the colours on offer, with `.ui-tfe__custom` for any other
5. **Actions** `.ui-tfe__actions` – how many files use it, Move up, Move down, Remove
6. **Confirm** `.ui-tfe__confirm` – asked before removing a flag that's on files
7. **Add** `.ui-tfe__add` – starts a new flag

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
A page can set `--tc-tfe-swatch-size`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the fields, swatches and buttons |
| ← → ↑ ↓ | Move through a flag's colours, choosing as they go |
| Home / End | Choose the first or last colour |
| Enter in Name | Commits the name |

## Screen readers

The flags are a list named by the heading. Each flag's colours are a `radiogroup` with one tab stop, and each button's
name includes the flag it acts on. A refused name is tied to its field with `aria-invalid` and `aria-describedby`.
`role="status"` announces adding, removing and moving.

## Content

Write a meaning as when to use the flag: "A second auditor should read this before it's relied on", not "Review". Names
must be unique, because the name is what tells two flags apart for anyone who can't see the colour. Two flags may share
a colour, but the editor points it out.

## Do

- Pass `usage`, so nobody removes a flag without knowing how many files carry it.
- Save on `tc-flags-change`, and call `preventDefault()` if the save is refused.
- Use `readonly` for people who can't edit the flags.

## Don't

- Don't reuse an id for a different flag. Files store the id, so they'd change meaning without anyone noticing.

## Example

```html
<tc-team-flag-editor id="flags"></tc-team-flag-editor>

<script type="module">
  import "trenchcoat/team-flag-editor";
  import "trenchcoat/tokens.css";

  const editor = document.querySelector("#flags");
  editor.flags = [{ id: "review", label: "Needs review", meaning: "A second auditor should read this.", color: "#CA8A04" }];
  editor.usage = { review: 12 };
  editor.addEventListener("tc-flags-change", (e) => console.log(e.detail.change, e.detail.flags));
</script>
```

```tsx
import { useState } from "react";
import { TeamFlagEditor, type TeamFlag } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function FlagSettings() {
  const [flags, setFlags] = useState<TeamFlag[]>([{ id: "review", label: "Needs review", meaning: "A second auditor should read this.", color: "#CA8A04" }]);
  return <TeamFlagEditor flags={flags} usage={{ review: 12 }} onFlagsChange={(next) => setFlags(next)} />;
}
```
