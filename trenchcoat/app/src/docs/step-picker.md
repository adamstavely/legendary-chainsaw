---
pattern: combobox
status: new
related: workflow-canvas, step-inspector, command-menu, tool-configuration
---

## Overview

What to add next to a workflow. A search field sits over the step kinds and tools, grouped into Triggers, AI, Tools,
Logic, People and Output, each with its icon and one line on what it does. With nothing typed it leads with
Suggested steps, each saying why ("Usually comes after Match purchase order"), and Recent ones. Typing filters every
group, matching the name, the description, the tool and extra keywords.

Inline, it sits in a panel of its own. As a popover, it floats by the button that opened it – the Add step button of
a `workflow-canvas`, say – and closes once a step is picked.

## When to use

- Adding a step to an agent workflow, from the canvas's Add step or a "+" between steps.
- Choosing an action or tool from a catalogue of a few dozen, where a hint about what fits next helps.

## When not to use

- Searching and running commands across an app – use `command-menu`.
- Setting up one tool's parameters – use `tool-configuration`.
- Editing a step that's already there – use `step-inspector`.

## Anatomy

1. **Search** `.ui-stp__search` – the field and its icon
2. **List** `.ui-stp__list` – the steps, in groups
3. **Group** `.ui-stp__group-label` – Suggested, Recent, then each group's name
4. **Step** `.ui-stp__option` – icon, name, what it does (or why it's suggested) and its tool
5. **Tool** `.ui-stp__tool` – the tool or integration it uses
6. **Popover** `.ui-stp__pop` – the floating panel, in popover layout

## Looks

Standard is a white card on a gray tray, with the header on the tray above it; Clean is one white card. As a popover
it keeps its look and floats over the page. Set its width with `--tc-stp-w` and the list's height with `--tc-stp-h`.

## Keyboard

| Key | What it does |
|---|---|
| Typing | Filters the steps |
| ↓ / ↑ | Moves to the next or previous step, wrapping round |
| Home / End | With nothing typed (or with Ctrl), moves to the first or last step |
| Enter | Adds the highlighted step |
| Escape | Clears the search; with nothing typed, closes the popover and returns focus to what opened it |
| Tab | Leaves – a popover closes |

## Screen readers

The field is a combobox controlling a listbox named by the heading; the highlighted step is its active descendant,
so focus stays in the field. Steps are options in named groups, each reading its name and its description or why
it's suggested, then its tool. While typing, a polite status message says how many steps match, and adding a step
confirms it ("Added Condition"). As a popover, the panel is a dialog named by the heading.

## Content

- Name steps for what they do: "Extract fields", "Send email", "Ask a question".
- Keep descriptions to one line in plain words: "Waits for a person to approve or reject".
- Give a suggestion a reason only when you have one; leave it out rather than invent one.
- Add `keywords` for the words people search with that aren't in the name: "if", "branch", "cron".

## Do

- Suggest two or three steps that usually follow the step being added after.
- Keep Recent short – the picker shows the four newest.
- Close the popover and place the step yourself on `tc-pick`.

## Don't

- Don't list every operation of every tool; group them under the tool and let search find them.
- Don't use the picker for settings – it only chooses what to add.

## Example

```html
<tc-step-picker id="picker" description="After “Match purchase order”"></tc-step-picker>

<script type="module">
  import "@adamstavely/trenchcoat/step-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  const picker = document.querySelector("#picker");
  picker.suggestions = [{ id: "condition", reason: "Usually comes after Match purchase order" }];
  picker.recent = ["extract"];
  picker.addEventListener("tc-pick", (e) => console.log("add", e.detail.kind, e.detail.item.label));
</script>
```

```tsx
import { useRef, useState } from "react";
import { StepPicker } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AddStep({ onAdd }: { onAdd: (kind: string, label: string) => void }) {
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button ref={button} type="button" aria-expanded={open} onClick={() => setOpen(true)}>
        Add step
      </button>
      <StepPicker layout="popover" anchor={button.current} open={open} onOpenChange={setOpen} onPick={(kind, item) => onAdd(kind, item.label)} />
    </>
  );
}
```
