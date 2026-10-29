---
pattern: tabs
status: new
related: structured-output, code-block, data-table, dialog
---

## Overview

A JSON document laid out for someone to review: an API response, the fields an agent extracted from a PDF, a config,
a record export. The same document has three views. **Document** reads like a form: fields are labelled rows with keys
in plain words, so `invoice_date` reads "Invoice date". Nested objects become sections, lists of like objects become
tables and lists of values become chips. Links, emails, dates, yes/no and null are drawn as what they are. **Tree**
shows every key and value, folding, with types and counts. **Raw** is the JSON itself, pretty-printed with line
numbers and syntax colours.

A search box marks matching keys and values in every view and counts them; the tree opens to show them, and Enter
moves to the next. Reviewers can flag a field with a note: in Document beside the row, in Tree from the bar under it.
Flags are listed at the foot and reported in `tc-flags-change`, so the page can keep them. Copy and Download hand
over the JSON. Give it `value` (parsed) or `source` (text). Text that isn't valid JSON shows the error at its line
and column, with the lines around it. With `modal`, the viewer is a dialog that `open` shows.

## When to use

- Someone has to check structured data before it's used: an extraction before it's paid, a response before it's
  trusted, a config before it ships.
- A "View JSON" action beside a record, a run or a tool call, opened as a dialog.
- Showing a payload whose shape you don't know in advance.

## When not to use

- JSON that's still streaming in from a model, checked against a schema as it arrives – use
  [Structured Output](#/structured-output).
- Code in general, with Apply and a diff – use [Code Block](#/code-block).
- Rows people sort, edit and select – use [Data Table](#/data-table).

## Anatomy

1. **Views** `.ui-jsv__tabs` – Document, Tree and Raw, in the header
2. **Toolbar** `.ui-jsv__toolbar` – the search with its count, Expand all / Collapse all in Tree, Copy JSON and Download
3. **Fields** `.ui-jsv__row` – a key in plain words and its value, with the flag button at the end
4. **Section** `.ui-jsv__section` – a nested object or list, with its name and size
5. **Table** `.ui-jsv__table` – a list of like objects, one row each
6. **Tree** `.ui-jsv__tree` – every key and value, folding
7. **Path bar** `.ui-jsv__pathbar` – in Tree, the focused field's path with Copy path, Copy value and Flag
8. **Raw** `.ui-jsv__raw` – the JSON with line numbers and syntax colours
9. **Flags** `.ui-jsv__flags` – how many fields are flagged, each a button that goes to it

## Looks

Standard sets the header and view tabs on a gray tray above a white card; Clean is one white card with the header as
its first row. As a dialog the tray (Standard) or the card (Clean) is the dialog. Flagged fields have an amber wash
and their note under the value. Syntax colours come from the theme's `--tc-syntax-*` tokens.

A page can set `--tc-jsv-body-h` (how tall the body grows before it scrolls inline, 520px), `--tc-jsv-key-w` (the
key column in Document, 34%) and `--tc-jsv-indent` (the tree's step).

## Keyboard

| Key | Does |
| --- | --- |
| ← / → on the views | Switch between Document, Tree and Raw |
| Enter / Shift + Enter in the search | Next / previous match |
| Escape in the search | Clears it |
| ↑ / ↓ in the tree | Previous / next row |
| → in the tree | Opens a closed branch, or moves to its first child |
| ← in the tree | Closes an open branch, or moves to its parent |
| Home / End in the tree | First / last row |
| Enter or Space in the tree | Opens or closes the branch |
| ⌘ / Ctrl + Enter in a note | Saves the flag |
| Escape in a note | Cancels it |
| Escape (dialog) | Asks to close |

## Screen readers

- The views are a `tablist`; the body is their `tabpanel`.
- The tree is a `tree` of `treeitem`s with their level, position and open state; one is in the tab order.
- Document fields are a description list (`dl`), sections have headings below the card's own, and tables have
  column headers.
- Yes/no values say "true" or "false" as well as the word and mark shown.
- The search's count is the field's description. Matches, copies and flags are announced in a polite status line.
- The flag buttons name their field ("Flag Unit price"); the note box is labelled the same way.
- As a dialog, it's a native modal named by its heading, and focus returns to the opener on close.

## Content

- Name the document after what it is ("Invoice INV-2207"), and say where it came from in `description`.
- Use keys that read well in words: `invoice_date`, `vatId` and `unit-price` all do. With keys that don't, set
  `key-style="raw"`.
- Flags are for people: write the note as what to check ("Last order was €19.90 – check the price list").
- Large documents work. Document shows 50 entries of a list before Show all, and Raw shows 4,000 lines before Show
  the whole document.

## Do

- Open it as a dialog from a "View JSON" button where the JSON is a detail.
- Keep the flags with the record (`onFlagsChange`), so the next reviewer sees them.
- Pass `source` when you have text, so a broken payload says where it breaks.

## Don't

- Use it to edit JSON – it's for reading and flagging.
- Hide Raw: reviewers check the exact JSON when Document's reading of it surprises them.
- Turn keys into words when they're identifiers people search for (`SKU-1190`), or they'll be harder to match.

## Example

```html
<button id="view">View JSON</button>
<tc-json-viewer modal heading="Invoice INV-2207" filename="inv-2207.json"></tc-json-viewer>
<script type="module">
  const viewer = document.querySelector("tc-json-viewer");
  viewer.value = { invoice_number: "INV-2207", total: 713.9, paid: false };
  document.querySelector("#view").addEventListener("click", () => (viewer.open = true));
  viewer.addEventListener("tc-open-change", (e) => (viewer.open = e.detail.open));
  viewer.addEventListener("tc-flags-change", (e) => console.log("save flags", e.detail.flags));
</script>
```

```tsx
import { useState } from "react";
import { JsonViewer, type JsonFlag } from "trenchcoat/react";

export function InvoiceReview({ extraction }: { extraction: Record<string, unknown> }) {
  const [flags, setFlags] = useState<JsonFlag[]>([]);
  return <JsonViewer title="Invoice INV-2207" description="Extracted from the supplier's PDF" value={extraction as never} flags={flags} onFlagsChange={setFlags} />;
}
```
