---
pattern: form
status: new
related: file-import, import-review, smart-recommendation, data-table
---

## Overview

The step of an import where a model matches the file's columns to your fields and a person checks it. Each column of
the file is a row: its name and a few sample values on the left, and a select of your fields – or Don't import – on the
right, prefilled with the model's suggestion. A suggestion in use is marked "Suggested" with how sure the model was in
a word: High, Medium or Low. Changed away from, the suggestion stays visible with Use suggestion. Under the rows, what
still stands in the way is said in words – required fields nothing goes to, two columns going to the same field – and
Continue waits until the mapping is complete. Accept all suggestions puts every suggestion back at once.

## When to use

- Importing a spreadsheet whose headers don't match your field names ("Ctry", "E-mail address").
- When a model suggests the matches but a person should confirm them before rows are written.
- After `file-import`, before `import-review`.

## When not to use

- Reading or previewing the file – use `file-import`.
- Fixing values in the rows – use `import-review`.
- A single suggestion to accept or switch – use `smart-recommendation`.

## Anatomy

1. **Column** `.ui-cmap__source` – the column's name in the file and up to three sample values
2. **Field** `.ui-cmap__field` – a select of your fields, required ones marked, and Don't import
3. **Suggestion** `.ui-cmap__note` – “Suggested · High confidence”, or the suggestion with Use suggestion once changed
4. **Duplicate** `.ui-cmap__dup` – shown under a field another column also goes to
5. **Problems** `.ui-cmap__problems` – required fields not matched, and fields matched twice, in words
6. **Accept all suggestions** `.ui-cmap__accept` – in the header; held when every suggestion is in use
7. **Continue** `.ui-cmap__continue` – with “5 of 7 columns matched · 2 not imported”

## Looks

Standard puts the header on the gray tray above a white card and the summary below it; Clean is one white card with the
summary as its last row. `--tc-column-mapper-source` and `--tc-column-mapper-target` set the two columns' widths.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves from field to field, through Use suggestion where shown, and on to Continue |
| Arrow keys, Enter (on a field) | The browser's own select: choose the field |
| Enter or Space (on a button) | Presses it |

## Screen readers

Each select is labelled by its column's name and described by its suggestion (“Suggested · Medium confidence”) or, when
two columns go to one field, by “Another column also goes to Contact email”, with `aria-invalid` set. Sample values
are read as “Sample values: …”. Use suggestion names its column (“Use suggestion for Ctry”). A status region says
each change (“Ctry goes to Country”, “3 suggestions accepted”). Continue and Accept all suggestions are
`aria-disabled` with the reason as their description.

## Content

- Give fields the names people use in your app – the selects show them, not ids.
- Mark a field `required` only when a row truly can't be imported without it.
- Pass a few real sample values per column; they're what people recognise a column by.
- Send confidence as the model's own 0–1 score; the element puts it in words.

## Do

- Suggest Don't import (`field: null`) for columns you won't keep, such as free-text notes.
- Keep `mapping` with the import job, so going back a step keeps people's choices.
- Use `resolveMapping` to get every column's field, suggestions filled in.

## Don't

- Don't hide low-confidence suggestions; show them as Low so they get checked.
- Don't allow two columns into one field silently – the element flags it and holds Continue.
- Don't use it to rename fields; it only matches columns to the fields you have.

## Example

```html
<tc-column-mapper id="mapper" description="vendors.csv → Purchasing ledger"></tc-column-mapper>

<script type="module">
  import "@adamstavely/trenchcoat/column-mapper";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#mapper");
  el.columns = [
    { id: "supplier", name: "Supplier", samples: ["Kestrel Lab Supplies", "Harbour Analytics"] },
    { id: "mail", name: "E-mail address", samples: ["orders@kestrel-lab.example"] },
    { id: "ctry", name: "Ctry", samples: ["UK", "NL"] },
  ];
  el.fields = [
    { id: "name", label: "Vendor name", required: true },
    { id: "email", label: "Contact email", required: true },
    { id: "country", label: "Country" },
  ];
  el.suggestions = [
    { column: "supplier", field: "name", confidence: 0.96 },
    { column: "mail", field: "email", confidence: 0.99 },
    { column: "ctry", field: "country", confidence: 0.64 },
  ];
  el.addEventListener("tc-continue", (e) => console.log(e.detail.mapping));
</script>
```

```tsx
import { useState } from "react";
import { ColumnMapper, type ColumnMapperColumn, type ColumnMapperField, type ColumnMapperSuggestion, type ColumnMapping } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function MapVendors({ columns, fields, suggestions, next }: { columns: ColumnMapperColumn[]; fields: ColumnMapperField[]; suggestions: ColumnMapperSuggestion[]; next: (mapping: ColumnMapping) => void }) {
  const [mapping, setMapping] = useState<ColumnMapping>({});
  return <ColumnMapper columns={columns} fields={fields} suggestions={suggestions} mapping={mapping} onMappingChange={setMapping} onContinue={next} />;
}
```
