---
pattern: form
status: new
related: search-history, ai-search, filter-menu, data-table
---

## Overview

A search query built from conditions instead of typed syntax. Each condition picks a field from the page's list, an
operator that fits the field's type – text, number, date or a list of options – and a value. Conditions sit in a group
joined by AND or OR, and the top group can hold nested groups for the “this AND (that OR the other)” cases. Below the
conditions the query is read back twice: in words, so anyone can check it says what they meant, and as a query string
in mono, with Copy and Run. A condition without a value is left out of both until it has one.

## When to use

- Advanced search over files, records or entities where people need AND, OR and brackets.
- Saved views and alerts that are defined by conditions.
- Teaching the query syntax: the read-back shows the string each change produces.

## When not to use

- A few quick filters on a list – use `filter-menu`.
- Free-text or natural-language search – use `ai-search`.
- Re-running earlier searches – use `search-history`.
- Filtering inside a table – use `data-table`.

## Anatomy

1. **Group** `.ui-qb__group` – conditions joined by its AND / OR switch; nested groups are indented
2. **Join** `.ui-qb__join` – the AND / OR switch, with “all of these” or “any of these” beside it
3. **Condition** `.ui-qb__cond` – the joining word, then field, operator, value and remove
   - **Joining word** `.ui-qb__conj` – “Where” on the first row, then the group's “and” or “or”, so the rows read as a sentence
   - **Select** `.ui-qb__select` – a native select drawn as a field, with a chevron
4. **Value** `.ui-qb__value` – text, a number, a date, two of them for between, or option chips for “is any of”
5. **Add** `.ui-qb__adds` – Condition, and Group in the top group
6. **Read-back** `.ui-qb__read` – the query in words, then the query string with Copy and Run

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The fields, switches and read-back are the same in both. Each condition sits on one line; below about
600 px the joining words go (the group's switch still says AND or OR), and below about 460 px the value takes its own
line. The width of the joining words is `--tc-qb-conj`.

## Keyboard

Every control is a native select, input, radio or button, so the browser's own keys work: Tab moves between controls,
the arrows change a select or the AND / OR switch, and Space or Enter presses a button. Enter in a value applies it.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the controls, condition by condition |
| ← / → | Switches AND / OR on a focused join |
| Enter | Applies a typed value; presses a focused button |
| Space | Toggles a focused option chip |

Adding a condition focuses its field. Removing one moves focus to its group's Add button.

## Screen readers

The builder is a group named by the heading. Each group is a group named “Conditions, joined by AND”, or “Group 1,
joined by OR”. Every control is named by its place – “Field, condition 2”, “Operator, condition 2”, “Value, condition
2”, “From” and “To” for between – and option chips are toggle buttons in a group. The join is a fieldset of two radios.
Remove buttons say what they remove: “Remove condition 2”, “Remove group 1”. Adding and removing are confirmed in a
polite status message, as is Copy. The query string is labelled “Query string”.

## Content

- Name fields as people know them – “Owner”, “Updated” – and set `key` to the name the query syntax uses.
- Give enum fields every option; they're how “is any of” offers chips.
- Keep the Run label a verb: “Run query”, “Search”.

## Do

- Start from a useful query with `value` – an empty builder is hard to read.
- Show results next to the builder, so each change can be checked.

## Don't

- Don't nest deeper than one level – the builder allows one, and more is hard to read back.
- Don't hide the read-back – it's how people confirm the query means what they think.

## Example

```html
<tc-query-builder id="qb" heading="Find files"></tc-query-builder>

<script type="module">
  import "trenchcoat/query-builder";
  import "trenchcoat/tokens.css";

  const qb = document.querySelector("#qb");
  qb.fields = [
    { id: "type", label: "Type", type: "enum", options: [{ value: "document", label: "Document" }, { value: "image", label: "Image" }] },
    { id: "owner", label: "Owner", type: "text" },
    { id: "updated", label: "Updated", type: "date" },
  ];
  qb.addEventListener("tc-submit", (e) => console.log(e.detail.query));
</script>
```

```tsx
import { QueryBuilder, type QueryField } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const fields: QueryField[] = [
  { id: "type", label: "Type", type: "enum", options: [{ value: "document", label: "Document" }, { value: "image", label: "Image" }] },
  { id: "owner", label: "Owner", type: "text" },
  { id: "updated", label: "Updated", type: "date" },
];

export function FindFiles() {
  return <QueryBuilder title="Find files" fields={fields} onRun={(_value, query) => console.log(query)} />;
}
```
