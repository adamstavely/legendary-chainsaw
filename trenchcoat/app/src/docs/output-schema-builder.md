---
pattern: tree
status: new
related: structured-output, tool-configuration, code-block, model-settings
---

## Overview

Builds the shape a model's structured answer must take, beside a picture of the answer itself. Each field is a row in a
tree – a type glyph, the name, whether it's required, its allowed values and what it means – and objects and lists of
objects open into their own fields. The preview renders a sample answer as a card: every key with its value and its
type, objects nested on a rule, so the team sees what the model will return while they edit. Pointing at a field in
either pane lights it in the other, and the selected field stays lit in both. Raw JSON and the generated JSON Schema
are the preview's other tabs. Problems such as two fields with the same name are a marker and a short note on their
row, and counted in the head, before the schema goes anywhere. It is the authoring side of `structured-output`, which
checks a model's answer against the same schema as it streams in.

## When to use

- Defining a structured output or response format for a prompt, an extraction step or an agent's final answer.
- Defining a tool's parameters, where the same object-with-fields shape applies – inside another card with `flat`.
- Reviewing an existing schema: the tree and the rendered answer read faster than raw JSON.

## When not to use

- Showing a model's answer and whether it matches – use `structured-output`.
- Showing or editing schema JSON as text – use `code-block`.
- Choosing model parameters such as temperature – use `model-settings`.

## Anatomy

1. **Status** `.ui-osb__pill` – how many fields, or how many problems, in the head
2. **Toolbar** `.ui-osb__toolbar` – add a field after the selected one or inside it, move it, remove it
3. **Field row** `.ui-osb__row` – the type glyph, name, required mark, allowed values and description
4. **Problem** `.ui-osb__issue` – a marker and a short note at the end of the field's row
5. **Preview** `.ui-osb__preview` – Output, JSON or Schema
6. **Answer** `.ui-osb__out` – the sample answer as a card: each key, its value and its type

## Looks

Standard puts the head on the gray tray above one white card: the tree on white, the preview on a sunken well with the
answer as a raised card, square type glyphs and a gray selected row. Clean is one white card with the head as its
first row: hairlines under the head and between the panes, the answer in a hairline frame, round outlined glyphs, an
accent-tinted selected row, a caption-style “Preview” label and thinner icons. Wide (640 px and up) the tree and the
preview sit side by side; narrower, the preview goes below and the tree's type names, descriptions and key hint give
way – the glyph and the preview still show the type. `flat` drops the tray and the card in either look.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the toolbar, the tree (one stop, on the selected field), the editor when open, the preview's tabs and the JSON's Copy button |
| ↑ / ↓ | In the tree: the previous or next field |
| → | On a folded object: opens it; on an open one: moves to its first field |
| ← | On an open object: folds it; on a nested field: moves to its parent |
| Home / End | In the tree: the first or last field |
| Enter / F2 | Opens the selected field's editor and puts the cursor in its name |
| Alt+↑ / Alt+↓ | Moves the field up or down among its siblings |
| Delete / Backspace | Removes the field; the next field (or its parent) takes focus |
| Enter | In the editor's name: saves it and returns to the tree; in the values box: adds the value |
| Escape | In the editor: closes it and returns to the field's row |
| ← / → / Home / End | In the toolbar: the previous, next, first or last button |

Double-clicking a row opens its editor too. Clicking a key in the answer selects its field in the tree – opening the
objects that hold it – and moves focus there.

## Screen readers

The host is a group named by the heading, and the fields are a `tree` with the same name, described by the key hint.
Each field is a `treeitem` with its level, position and `aria-expanded` for objects; its name reads the field's name,
type, “required” or “optional”, its allowed values and description, and any problem under it. The selected field has
`aria-selected="true"`. A problem adds its full reason to the row's name – “problem: Another field here is already
called “summary”” – while the row shows the short note (“Name used twice”). The toolbar is a `toolbar` named “Fields”; its icon buttons are named “Add a field inside”,
“Move up”, “Move down” and “Remove field”. The editor is a group named “Edit priority”. A status region reads
“Added field_7”, “Moved summary down, 2 of 4” and “Removed seats”. Output, JSON and Schema are a radiogroup named
“Preview”. The answer is a group named “What the model returns, with each value's type”, made of nested lists – each
item reads its key, value and type, with “?” after an optional key.

## Content

- Name fields the way the code that reads them expects them: `snake_case` or `camelCase`, never spaces.
- Write a description for every field the model could misread – it goes into the schema and the model sees it, and
  the answer card shows it in place of a text value: “One sentence a person can read in the queue”.
- Use allowed values for anything a program switches on (a category, a priority) and keep them lower-case; the answer
  shows the first one and how many others there are.
- The heading names what the output is for (“Ticket triage”), not “Schema”.

## Do

- Keep fields required unless the model can genuinely leave them out – optional fields are often skipped.
- Fix every problem before saving; with `name` in a form, the builder is invalid until you do.
- Store `value` (the fields) and generate the schema with `schemaFromFields` where you need it, so the builder can
  open it again.

## Don't

- Don't nest more than two or three levels; deep schemas are harder for a model to fill in.
- Don't rely on the sample as test data – it's the shape with placeholder values (the description, “text”, 1, true).
- Don't use the builder to validate a model's answer – the app sends the schema to the model and checks the answer,
  for example with `structured-output`.

## Example

```html
<tc-output-schema-builder id="schema" name="schema"></tc-output-schema-builder>

<script type="module">
  import "trenchcoat/output-schema-builder";
  import "trenchcoat/tokens.css";

  const builder = document.querySelector("#schema");
  builder.heading = "Ticket triage";
  builder.value = [
    { name: "summary", type: "string", required: true, description: "One sentence for the queue" },
    { name: "priority", type: "string", required: true, enum: ["low", "normal", "high"] },
  ];
  builder.preview = "output"; // or "sample" (raw JSON), "schema"
  builder.addEventListener("tc-value-change", (e) => console.log(builder.schema, e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { OutputSchemaBuilder, schemaFromFields, type OutputSchemaField } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function TriageSchema() {
  const [fields, setFields] = useState<OutputSchemaField[]>([
    { name: "summary", type: "string", required: true },
    { name: "priority", type: "string", required: true, enum: ["low", "normal", "high"] },
  ]);
  return (
    <>
      <OutputSchemaBuilder title="Ticket triage" value={fields} onChange={setFields} defaultPreview="output" />
      <pre>{JSON.stringify(schemaFromFields(fields))}</pre>
    </>
  );
}
```
