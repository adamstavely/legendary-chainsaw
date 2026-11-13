---
pattern: form
status: new
related: enrichment-grid, instruction-editor, model-picker, prompt-library
---

## Overview

One prompt, filled in for every row of a table. Name the column and choose what it holds – text, a number, yes or no,
one of a few choices, a link or JSON. Write the prompt with the table's columns as `{{column}}` variables: the chips
under the field insert them at the caret, and a variable the table doesn't have is called out. Pick the model and
whether it may search the web. "Try on 3 rows" asks the page for a preview and shows the three answers; Create column
hands the column back, beside the page's estimate of what the run will take.

## When to use

- Adding an AI column to a table people are enriching.
- Any "run this prompt on every row" setup where trying it on a few rows first saves a costly run.

## When not to use

- Watching the column fill in – use `enrichment-grid`.
- A system prompt for an agent, with versions – use `instruction-editor`.
- Reusable prompt templates people fill in once – use `prompt-library`.

## Anatomy

1. **Name** `.ui-aic__input[data-field="name"]` – the column's name
2. **Holds** `.ui-aic__input[data-field="type"]` – what the column holds
3. **Choices** `.ui-aic__input[data-field="options"]` – for "One of a few choices", separated by commas
4. **Prompt** `.ui-aic__prompt` – with `{{column}}` variables
5. **Columns** `.ui-aic__chips` – chips that insert a variable; one used is tinted, an unknown one is red
6. **Model** `.ui-aic__input[data-field="model"]` and **Search the web** `.ui-aic__switch`
7. **Preview** `.ui-aic__preview` – the three rows and their answers
8. **Problem** `.ui-aic__problem` – what's missing, in words, under its field
9. **Estimate** `.ui-aic__estimate` – what the run will take, from the page
10. **Try on 3 rows** `.ui-aic__try` and **Create column** `.ui-aic__create`

## Looks

Standard puts the header on the gray tray above a white card holding the form, with the estimate and the buttons on the
tray below. Clean is one white card: the header its first row, the buttons its last. Narrower than 460 px, the paired
fields stack.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Move through the fields, the column chips and the buttons |
| Enter / Space on a chip | Insert `{{column}}` at the caret and go back to the prompt |
| Space on Search the web | Turn web search on or off |

## Screen readers

Every field has a visible label. A field with a problem is `aria-invalid`, with the problem as its description; Try
and Create show every problem, move focus to the first and announce it. The chips are a group named "Insert a column",
each saying its variable and whether the prompt uses it. Search the web is a switch. The preview is a section named
"Preview", `aria-busy` while it runs; its arrival, an insertion and Create are announced through `role="status"`.
While the column can't run, Try and Create are `aria-disabled` with the reasons as their description.

## Content

- Name the column for what it holds: "Headquarters city".
- Ask for a short answer in the prompt – one cell shows one line.
- For a choice column, give the choices the model may pick and an "Other".
- Keep the estimate to rows, time and cost: "2,000 rows · about 3 min · about $1.40".

## Do

- Run the preview on rows that differ – a well-known vendor and an obscure one.
- Update `estimate` when the model or web search changes the cost.

## Don't

- Don't start the run from Try – it's a preview of three rows.
- Don't let the page create a column the element reports problems for; it checks before firing.

## Example

```html
<tc-ai-column-create id="column" estimate="2,000 rows · about 3 min · about $1.40"></tc-ai-column-create>

<script type="module">
  import "@adamstavely/trenchcoat/ai-column-create";
  import "@adamstavely/trenchcoat/tokens.css";

  const form = document.querySelector("#column");
  form.columns = [
    { id: "vendor", label: "Vendor" },
    { id: "website", label: "Website" },
  ];
  form.models = [
    { id: "fast", label: "Fast model" },
    { id: "careful", label: "Careful model" },
  ];
  form.addEventListener("tc-preview", () => {
    setTimeout(() => {
      form.preview = [
        { id: "v1", label: "Northwind Labs", value: "Software" },
        { id: "v2", label: "Cedarfield Supply", value: "Logistics" },
        { id: "v3", label: "Harborstone Print", value: "Printing" },
      ];
    }, 800);
  });
  form.addEventListener("tc-create", (e) => console.log("Create", e.detail.column));
</script>
```

```tsx
import { useState } from "react";
import { AiColumnCreate, defaultAiColumnValue, type AiColumnPreviewRow, type AiColumnValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function NewColumn({ tryRows, create }: { tryRows: (c: AiColumnValue) => Promise<AiColumnPreviewRow[]>; create: (c: AiColumnValue) => void }) {
  const [value, setValue] = useState<AiColumnValue>(defaultAiColumnValue);
  const [preview, setPreview] = useState<AiColumnPreviewRow[] | null>(null);
  return (
    <AiColumnCreate
      columns={[
        { id: "vendor", label: "Vendor" },
        { id: "website", label: "Website" },
      ]}
      models={[{ id: "fast", label: "Fast model" }]}
      value={value}
      onValueChange={setValue}
      preview={preview}
      onPreview={(column) => void tryRows(column).then(setPreview)}
      onCreate={create}
    />
  );
}
```
