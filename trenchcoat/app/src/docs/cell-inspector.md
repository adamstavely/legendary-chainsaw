---
pattern: disclosure
status: new
related: retrieval-inspector, cited-answer, data-table, version-history
---

## Overview

Why one AI-filled cell says what it says. When a model fills a column of a table row by row, any one cell can be
questioned: the inspector shows its value with how sure the model was – in a word and a percentage – and which model
filled it when; the column's prompt with this row's values filled in and marked, so you can see exactly what was
asked; the model's reasoning summary, folded away; the sources it used, each with its site and the passage it quoted;
the tokens and cost of this cell; and the cell's earlier values with who or what set each. From there it can be
accepted, edited in place, run again, or marked as wrong with a reason.

It's built to sit in a side panel beside the table: Escape, with nothing open inside it, asks the page to close it.

## When to use

- Beside a table filled by AI columns, when someone opens one cell to check it.
- When reviewers need to see the prompt and the sources behind a value before they accept or correct it.

## When not to use

- Every chunk retrieval returned for one query – use `retrieval-inspector`.
- An answer in a chat with its citations – use `cited-answer`.
- The table itself – use `data-table`.
- The versions of a prompt or an agent – use `version-history`.

## Anatomy

1. **Header** – the shared card header: an inspect icon, the column's name, the row, the status pill `.ui-cin__pill` and Close `.ui-cin__close`
2. **Value** `.ui-cin__value-block` – the value, the confidence `.ui-cin__confidence` and who filled it when `.ui-cin__meta`
3. **Actions** `.ui-cin__actions` – Accept, Edit value, Re-run this cell and Mark as wrong
4. **Form** `.ui-cin__form` – editing the value, or saying what's wrong with it
5. **Prompt** `.ui-cin__prompt` – the column's prompt with the row's values marked `.ui-cin__var`
6. **Reasoning** `.ui-cin__reasoning` – the model's reasoning summary, behind a disclosure
7. **Sources** `.ui-cin__sources` – a card per source with its title, site and quoted passage
8. **Usage** `.ui-cin__usage` – tokens in, tokens out and cost for this cell
9. **History** `.ui-cin__history` – earlier values, newest first, with who or what set them

## Looks

Standard sets the header on the gray tray above a white card. Clean is one white card with a shadow, the header its
first row and a slightly smaller value. The status pill and the confidence mark change shape as well as colour.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the actions, the reasoning toggle, source links and Close |
| Enter / Space | Presses the focused action |
| Enter (editing) | Saves the new value; Shift+Enter starts a new line |
| Escape | Cancels editing or marking as wrong; with nothing open, asks the page to close the panel |

After saving, cancelling or marking, focus goes back to the action that opened the form.

## Screen readers

The inspector is a `region` named by the column's name. Value, prompt, sources and history are sections with their
own headings. The confidence is said in words (“Medium confidence · 72%”), and a prompt variable with no value in this
row says so. The reasoning toggle is a disclosure (`aria-expanded`, `aria-controls`); Edit value and Mark as wrong
report whether their form is open. While the cell runs again its value is `aria-busy` and the actions are
`aria-disabled`. Accepting, saving, re-running and marking are said once in a polite live region.

## Content

- Use the column's name as the heading and the row's name as the line under it, so the panel says which cell it is.
- Pass the prompt exactly as the model got it, with `{{variable}}` where the row's values go.
- Keep the reasoning to a short summary – a few lines on why, not the model's full trace.
- Quote the passage each source gave, not the whole page.

## Do

- Pass the new value and set `status` back to "new" when a re-run comes back.
- Keep earlier values in `history`, with a note on why each changed.
- Use a marked-as-wrong reason to improve the column's prompt.

## Don't

- Don't hide the prompt – it's the first thing a reviewer needs to judge the value.
- Don't show sources the model didn't use.
- Don't use it for a value a person typed – there's nothing to inspect.

## Example

```html
<tc-cell-inspector
  id="cell"
  heading="Risk tier"
  description="Northwind Analytics · row 214"
  value="Medium"
  model="Analyst model"
  confidence="0.72"
  prompt="Rate {{vendor}}'s risk tier. It handles {{data}} and is based in {{country}}."
  closable
></tc-cell-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/cell-inspector";
  import "@adamstavely/trenchcoat/tokens.css";

  const cell = document.querySelector("#cell");
  cell.variables = { vendor: "Northwind Analytics", data: "work emails", country: "Ireland" };
  cell.sources = [{ id: "s1", title: "Security and compliance", url: "https://example.org/security", snippet: "A current SOC 2 Type II report." }];
  cell.addEventListener("tc-flag", (e) => console.log("wrong because:", e.detail.reason));
  cell.addEventListener("tc-close", () => cell.remove());
</script>
```

```tsx
import { useState } from "react";
import { CellInspector, type CellStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RiskTierCell({ rerun, close }: { rerun: () => void; close: () => void }) {
  const [value, setValue] = useState("Medium");
  const [status, setStatus] = useState<CellStatus>("new");
  return (
    <CellInspector
      title="Risk tier"
      description="Northwind Analytics · row 214"
      value={value}
      onValueChange={setValue}
      status={status}
      onStatusChange={setStatus}
      prompt="Rate {{vendor}}'s risk tier."
      variables={{ vendor: "Northwind Analytics" }}
      model="Analyst model"
      confidence={0.72}
      onRerun={() => rerun()}
      onClose={close}
      closable
    />
  );
}
```
