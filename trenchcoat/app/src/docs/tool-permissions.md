---
pattern: grid
status: new
related: permission-request, autonomy-dial, approval-card, data-table
---

## Overview

The setup screen for what each agent may do with each tool, decided ahead of time instead of one prompt at a time.
Tools and their scopes are the rows (“GitHub · Push to main”), agents are the columns, and every cell is Allow, Ask
or Deny. Presets such as “Read only” and “Ask first” set the whole matrix in one click, risky and destructive
scopes are marked, and a destructive scope never offers Allow. A summary lists every cell that differs from what
was last saved – “Coder · Slack post in channels, Ask → Allow” – with Reset and Save.

## When to use

- An admin or settings page where people decide which agents may read, write or act in connected tools.
- Several agents that share the same tools but need different limits.
- Reviewing and saving a batch of permission changes together, with a clear list of what will change.

## When not to use

- An agent asking for a right in the middle of a run – use `permission-request`.
- One overall setting for how much an agent does on its own – use `autonomy-dial`.
- Approving a single action an agent is about to take – use `approval-card`.
- A general table of values people edit and sort – use `data-table`.

## Anatomy

1. **Presets** `.ui-tperm__presets` – one-click setups; the one that matches the matrix is checked
2. **Agent** `.ui-tperm__agent` – a column: avatar or initials, name and model
3. **Tool** `.ui-tperm__group` – a row heading with the tool's mark and name
4. **Scope** `.ui-tperm__scope` – a row: what the agent may do, its risk and a quiet description
5. **Cell** `.ui-tperm__cell` – Allow, Ask and Deny as a small segmented control
6. **Changes** `.ui-tperm__summary` – every cell that differs from what was saved
7. **Save** `.ui-tperm__answer` – Reset and Save, with the number of changes

## Looks

Standard is a white card on a gray tray, with Reset and Save sitting on the tray below it. Clean is one white card
with Reset and Save in its last row. The cells, presets and summary work the same in both.

## Keyboard

The matrix is one tab stop; inside it the arrows move between cells.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Moves to the next cell in that direction |
| Home / End | Moves to the first or last cell in the row |
| ⌘/Ctrl+Home / ⌘/Ctrl+End | Moves to the first or last cell of the matrix |
| Page Up / Page Down | Moves five rows up or down |
| Space / Enter | Steps the cell to its next choice; with Shift, to the previous one |
| 1 / 2 / 3 | Sets the cell to Allow, Ask or Deny (if the scope offers it) |
| Delete / Backspace | Puts back the cell's saved choice |
| Tab | Leaves the matrix |

In the presets, ← / → / ↑ / ↓ move to the next or previous preset and apply it straight away.

## Screen readers

The matrix is a `grid` named by the heading, with agents as column headers and each scope as a row header that
includes its tool (“GitHub · Push to main”). A cell reads its choice and, if it differs from what was saved,
“changed from” the old one – “Allow, changed from Ask” – and is described by “Space changes it, 1 Allow, 2 Ask, 3
Deny”. Every change is confirmed in a polite status message: “Coder, Slack Post in channels: Allow”, “Ask first
applied”, “Changes undone”, “Saved 2 changes”. Presets are a `radiogroup` labelled “Presets”. The summary is a
section headed “Changes” or “No changes”; Reset and Save are `aria-disabled` while nothing has changed.

## Content

- Name scopes as actions an agent takes: “Read code”, “Open pull requests”, “Issue refunds”.
- Use `description` for the limit or consequence that matters: “Up to $500 per refund”, “Skips review”.
- Mark `risk` honestly – “risky” for anything others see, “destructive” for anything hard to undo.
- Give presets short names and a one-line `description`; it's the preset's tooltip.
- Use `description` on the element to say when changes take effect (“Runs pick this up at their next step”).

## Do

- Keep `saved` in step with what your server stored, so the summary shows only real changes.
- Handle `tc-save` and store the value; call `preventDefault()` if the save fails, so the changes stay listed.
- Set `levels` on a scope when only some choices make sense, rather than explaining it in the label.

## Don't

- Don't put more than about five agents side by side – the scope column stays put, but the matrix scrolls sideways
  and the cells further right are easy to miss.
- Don't use it to grant one-off permissions mid-run; people expect those inline, at the moment of asking.
- Don't hide the summary – it's how people check what a preset changed before saving.

## Example

```html
<tc-tool-permissions id="perms" heading="Tool permissions"></tc-tool-permissions>

<script type="module">
  import "trenchcoat/tool-permissions";
  import "trenchcoat/tokens.css";

  const perms = document.querySelector("#perms");
  perms.agents = [{ id: "coder", name: "Coder", model: "Sonnet" }, { id: "ops", name: "Ops", model: "Opus" }];
  perms.tools = [
    {
      id: "github",
      name: "GitHub",
      scopes: [
        { id: "read", label: "Read code" },
        { id: "push", label: "Push to main", risk: "destructive" },
      ],
    },
  ];
  perms.value = { coder: { "github/read": "allow", "github/push": "ask" } };
  perms.addEventListener("tc-save", (e) => fetch("/api/permissions", { method: "PUT", body: JSON.stringify(e.detail.value) }));
</script>
```

```tsx
import { useState } from "react";
import { ToolPermissions, type ToolPermissionMatrix, type ToolPermissionTool } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const tools: ToolPermissionTool[] = [
  { id: "github", name: "GitHub", scopes: [{ id: "read", label: "Read code" }, { id: "push", label: "Push to main", risk: "destructive" }] },
];

export function Permissions() {
  const [value, setValue] = useState<ToolPermissionMatrix>({ coder: { "github/read": "allow" } });
  const [saved, setSaved] = useState(value);
  return (
    <ToolPermissions
      title="Tool permissions"
      agents={[{ id: "coder", name: "Coder", model: "Sonnet" }]}
      tools={tools}
      value={value}
      onChange={setValue}
      saved={saved}
      onSave={setSaved}
    />
  );
}
```
