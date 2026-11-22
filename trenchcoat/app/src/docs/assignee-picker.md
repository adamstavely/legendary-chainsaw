---
pattern: combobox
status: new
related: mention-picker, combobox, delegate-board, saved-views
---

## Overview

Who owns a case or a task: a person, a team, or the next person in a team's round-robin. A chip shows the assignee – their initials and name, a team mark, or Unassigned – and opens a search over everyone who can take it.

Assign to me comes first when the page gives `me`. People follow, each with their team, how much they already have ("7 open") and a small load bar against what they can carry (`capacity`); someone away says Away, and anyone over capacity sorts after the rest and says Over capacity – in words, not only colour. Teams come next, with their members and open items, and a team that takes turns offers Round-robin under it ("next in Fraud review"). Unassign is last when someone has it.

`value` is `{ type: "person" | "team" | "round-robin", id }` or null. It's the element's own unless a `tc-value-change` listener prevents it – the page saves the change.

## When to use

- Setting the owner of a case, ticket or task – in a row, a detail header or a side panel.
- Teams that balance work by load, or hand it out in turn.

## When not to use

- Tagging people in text – use `mention-picker`.
- Choosing from a list that isn't people – use `combobox`.
- Handing tasks to agents – use `delegate-board`.

## Anatomy

1. **Chip** `.ui-asg__trigger` – `.ui-asg__avatar` (initials, a team mark, or an empty ring) and `.ui-asg__current`, with `.ui-asg__chevron`
2. **Popover** `.ui-asg__pop` – `.ui-asg__search` with `.ui-asg__search-input`, and `.ui-asg__list`
3. **Groups** `.ui-asg__group` – Assign to me, People and Teams under `.ui-asg__group-title`, and Unassign
4. **Option** `.ui-asg__option` – `.ui-asg__avatar`, `.ui-asg__name` and `.ui-asg__meta`, then `.ui-asg__load` and `.ui-asg__flag` (Away, Over capacity), and `.ui-asg__check` on the current assignee

## Looks

The chip is a pill: on the gray tray in Standard, white with a hairline in Clean. The list opens on the menu surface in both. `--tc-asg-pop-w` sets the list's width and `--tc-asg-load-w` the load bar's.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space on the chip | Open the search |
| Type | Filter people and teams |
| ↑ / ↓ | Move through the options |
| Page Up / Page Down | First or last option |
| Enter | Assign the highlighted option |
| Escape | Close and return to the chip |

## Screen readers

The chip is a button named by the label and the assignee – "Assignee: Noor Haddad" – that says it opens a dialog. The search is a combobox that controls a listbox; focus stays in it while ↑ and ↓ move the highlighted option (`aria-activedescendant`). The options are grouped under People and Teams; each is read with its team or members, its open items, Away and Over capacity. The current assignee is the selected option. A change is announced: "Assigned to Tomas Lind".

## Content

- Use people's names as they know them; the team is shown under the name.
- Give `open` and `capacity` from the same source the team works from, so the load bar matches the queue.
- Turn on `roundRobin` only for teams that really hand work out in turn.

## Do

- Give `me`, so the reader can take something in one step.
- Save the change when `tc-value-change` fires, and prevent it if the save fails.

## Don't

- Don't hide people who are away or over capacity – show them, said in words, so a lead can still choose them.
- Don't use it to pick several people – one item, one owner.

## Example

```html
<tc-assignee-picker id="owner" me="noor"></tc-assignee-picker>

<script type="module">
  import "@adamstavely/trenchcoat/assignee-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  const owner = document.querySelector("#owner");
  owner.people = [
    { id: "noor", name: "Noor Haddad", team: "Fraud review", open: 7, capacity: 12 },
    { id: "tomas", name: "Tomas Lind", team: "Fraud review", open: 11, capacity: 12 },
  ];
  owner.teams = [{ id: "fraud", name: "Fraud review", members: 2, open: 18, roundRobin: true }];
  owner.addEventListener("tc-value-change", (e) => console.log("Assigned", e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { AssigneePicker, type AssigneeValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function CaseOwner() {
  const [value, setValue] = useState<AssigneeValue | null>({ type: "person", id: "tomas" });
  return (
    <AssigneePicker
      me="noor"
      people={[
        { id: "noor", name: "Noor Haddad", team: "Fraud review", open: 7, capacity: 12 },
        { id: "tomas", name: "Tomas Lind", team: "Fraud review", open: 11, capacity: 12 },
      ]}
      teams={[{ id: "fraud", name: "Fraud review", members: 2, open: 18, roundRobin: true }]}
      value={value}
      onValueChange={setValue}
    />
  );
}
```
