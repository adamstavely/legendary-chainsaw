---
pattern: list
status: new
related: session-context-bar, change-list, switch, integration-settings
---

## Overview

Where a session runs, as rows: the machine, its folders, the repository and the branch, each with its icon. A row can have
a small action, such as Save, or a switch. Long paths end in an ellipsis, with the whole text in the row's tooltip.

## When to use

- A side panel saying what a tool or an agent is working on, and where.
- A few settings that belong with that, such as remote access.

## When not to use

- A session's declared terms, such as scope and limits – use `session-context-bar`.
- A connected service's full settings – use `integration-settings`.
- Changes in progress – use `change-list`.

## Anatomy

1. **Row** `.ui-enl__row` – one thing, with its `data-kind`
2. **Icon** `.ui-enl__icon` – the kind's, or the row's own for `custom`
3. **Label** `.ui-enl__label` – its name
4. **Detail** `.ui-enl__detail` – quieter text, cut off at the end
5. **Action** `.ui-enl__action` – a small button
6. **Switch** `.ui-enl__switch` – a `tc-switch`, named by the label

## Looks

Standard puts the header, if any, on the gray tray above a white card; Clean is one white card. `bare` drops the tray and
card, for a place that already has one.

## Keyboard

Most rows are only information, so they aren't tab stops. Actions and switches follow normal tab order.

| Key | What it does |
|---|---|
| Tab | Moves through the actions and switches |
| Enter / Space | Presses an action |
| Space | Flips a switch |

## Screen readers

The rows are a list named by the heading, or "Environment". Icons are hidden, because the label says what the row is. An
action is named with its row, such as "Save Lab workstation", and a switch is named by the row's label.

## Content

- Lead with the name people know: the folder's name as `label`, and its path as `detail`.
- Keep actions to one word.

## Do

- Use `custom` with `icon` for anything that isn't a machine, folder, repository or branch.
- Prevent `tc-toggles-change` when the page needs to confirm before a switch changes.

## Don't

- Don't show secrets or tokens as `detail`: the text is in the page and its tooltip.
- Don't add many switches here; a settings page holds those better.

## Example

```html
<tc-environment-list id="env" heading="Environment"></tc-environment-list>

<script type="module">
  import "trenchcoat/environment-list";
  import "trenchcoat/tokens.css";

  const el = document.querySelector("#env");
  el.items = [
    { id: "repo", kind: "repo", label: "institute/sample-tracker" },
    { id: "remote", kind: "custom", label: "Remote access", toggle: true },
  ];
  el.addEventListener("tc-toggles-change", (e) => console.log(e.detail.toggles));
</script>
```

```tsx
import { EnvironmentList, type EnvironmentItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const items: EnvironmentItem[] = [
  { id: "repo", kind: "repo", label: "institute/sample-tracker" },
  { id: "remote", kind: "custom", label: "Remote access", toggle: true },
];

export function Environment() {
  return <EnvironmentList title="Environment" items={items} defaultToggles={{ remote: true }} />;
}
```
