---
pattern: tree
status: new
related: code-block, generated-ui, tool-call-card, trace-waterfall
---

## Overview

JSON a model writes, shown as a tree people can read while it streams in. The text can grow every frame and stop
anywhere – an open string, a half-written number, a field name still waiting for its value – and the tree shows what
has arrived so far, with a caret on the value being written. Give it a JSON Schema and it checks the value as it
arrives: a field that breaks the schema is tinted and says why on its row, and a required field that never came
shows as a ghost row once its object closes. The head sums it up – “Writing”, “Matches schema”, “3 issues”, “Not
valid JSON” – and copies the value as JSON or as a TypeScript literal.

## When to use

- Structured answers from a model – extraction, classification, tool arguments – that people should check before
  the app uses them.
- Showing why an answer failed validation, field by field, instead of a single “invalid response” error.
- Debugging and reviewing structured output in developer tools and evaluation screens.

## When not to use

- JSON as code people will read line by line or apply to a file – use `code-block` with `language="json"`.
- A model's answer that should become real UI – tables, charts, forms – use `generated-ui`.
- A tool call with its arguments, status and result in an agent's run – use `tool-call-card`.
- Rows of records to sort and filter – use `data-table`.

## Anatomy

1. **Head** `.ui-so__head` – the heading, the status and the copy actions
2. **Status** `.ui-so__status` – Writing, Matches schema, Valid JSON, N issues, Incomplete or Not valid JSON
3. **Copy** `.ui-so__tools` – copy as JSON, copy as a TypeScript literal
4. **Field** `.ui-so__row` – one key and its value, coloured by type and indented by depth
5. **Issue** `.ui-so__issue` – why a field breaks the schema, under its row

## Looks

Standard sets the head on the gray tray and the tree on a white card below it. Clean is one white card with a
hairline under the head, thinner icons and thinner tree guides. Both use the same syntax colours (`--tc-syntax-*`),
so they match `code-block` in both themes. In both, objects and lists show their size in place of brackets
(“{ 3 fields }”, “[ 2 items ]”), a folded one that hides problems says “2 issues inside”, and where there is room
each row ends with its type – string, integer, object.

## Keyboard

The tree is one tab stop, on the row last used; the copy actions are another.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous row |
| → | Opens a folded object or list; on an open one, moves to its first field |
| ← | Folds an open object or list; otherwise moves to the parent |
| Home / End | Moves to the first or last row |
| Enter / Space | Folds or opens the object or list on the row |
| * | Opens every folded sibling of the row |
| ← / → in the copy actions | Moves between Copy as JSON and Copy as TypeScript |

Clicking a row with fields folds or opens it. If the focused row goes away – the text was replaced – focus moves to
the nearest row that's still there.

## Screen readers

The tree is a `tree` named by the heading; each row is a `treeitem` with `aria-level`, `aria-posinset` and
`aria-setsize`, and objects and lists have `aria-expanded`. A row's name is what it shows: the key, the value, the
type, and its issue – “priority: “urgent” string Expected one of "low", "normal", "high"”. A missing field reads
“email: Missing – required”. While streaming the tree is `aria-busy`. A polite status says “Done – matches the
schema”, “Done – 3 issues” or “Not valid JSON: …” when streaming ends, and “Copied as JSON” or “Copied as
TypeScript” after a copy. The copy buttons are named “Copy as JSON” and “Copy as TypeScript”.

## Content

- Name the heading after what the value is – “Ticket triage”, “Invoice fields” – not “JSON” or “Response”.
- Put a `description` (or `title`) on schema fields people may not recognise: it becomes the key's tooltip.
- The element writes the issue messages from the schema (“Must be 1 or less”, “Expected one of …”); keep `enum`
  values and `pattern`s readable, since they appear in them.
- Set `variableName` to what the value is in your code, so the copied TypeScript drops in as it is.

## Do

- Pass `streaming` while the text is arriving and turn it off when the model is done – missing fields and the
  final result are only reported then.
- Use `tc-validate` (`onValidate`) to gate what happens next: file the ticket only when `valid` is true.
- Fold branches people rarely need (`collapsed`), such as raw metadata, and leave the fields they check open.

## Don't

- Don't repair or reformat the model's text before passing it in – the tree and the syntax error point at what
  it actually wrote.
- Don't rely on schema features beyond the common keywords (no `$ref`, `oneOf`, `allOf`) – they're ignored.
- Don't use it for very large documents (thousands of rows) – it renders every open row.

## Example

```html
<tc-structured-output id="triage" heading="Ticket triage" variable-name="triage"></tc-structured-output>

<script type="module">
  import "trenchcoat/structured-output";
  import "trenchcoat/tokens.css";

  const out = document.querySelector("#triage");
  out.schema = {
    type: "object",
    required: ["priority", "summary"],
    properties: {
      priority: { type: "string", enum: ["low", "normal", "high"] },
      summary: { type: "string", maxLength: 140 },
    },
  };
  out.streaming = true;
  for await (const chunk of stream) out.text += chunk;
  out.streaming = false;
  out.addEventListener("tc-validate", (e) => {
    if (e.detail.valid) fileTicket(e.detail.value);
  });
</script>
```

```tsx
import { useState } from "react";
import { StructuredOutput, type StructuredOutputSchema } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const schema: StructuredOutputSchema = {
  type: "object",
  required: ["priority", "summary"],
  properties: {
    priority: { type: "string", enum: ["low", "normal", "high"] },
    summary: { type: "string", maxLength: 140 },
  },
};

export function Triage({ text, streaming }: { text: string; streaming: boolean }) {
  const [ready, setReady] = useState(false);
  return (
    <>
      <StructuredOutput title="Ticket triage" text={text} schema={schema} streaming={streaming} onValidate={(r) => setReady(r.valid)} />
      <button type="button" disabled={!ready}>File ticket</button>
    </>
  );
}
```
