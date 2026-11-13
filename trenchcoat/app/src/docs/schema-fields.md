---
pattern: list
status: new
related: response-examples, tool-configuration, output-schema-builder, json-viewer
---

## Overview

The fields of an API's request or response, for a reference page. Each field shows its name, its type in words
("string · email", "array of Tag"), whether it's required, optional or deprecated, its default, its limits ("1–200
characters", "Pattern: ^REC-\d+$") and what it means. Give it a JSON Schema (`schema`) or the fields themselves
(`fields`). Nested objects, and arrays of objects, fold under their field; every field has an anchor and Copy link; a
filter box appears once there are enough fields to need one.

## When to use

- The parameters, request body or response fields on an API reference page.
- Explaining the shape of a webhook payload, a config file or an export.

## When not to use

- Building or editing a schema – use `output-schema-builder`.
- Showing a real value rather than its shape – use `json-viewer`.
- One tool's signature with its parameters edited in place – use `tool-configuration`.

## Anatomy

1. **Filter** `.ui-scf__search` – narrows the fields by name or description
2. **Expand all** `.ui-scf__all` – opens or closes every nested field
3. **Field** `.ui-scf__row` – one field, with an `id` you can link to
4. **Toggle** `.ui-scf__toggle` – the name of a field with children, opening them
5. **Name** `.ui-scf__name` – the field's name, in monospace
6. **Type** `.ui-scf__type` – the type in words, with its format or item type
7. **Required** `.ui-scf__req` – Required, Optional or Deprecated
8. **Copy link** `.ui-scf__copy` – copies the page's address with the field's anchor
9. **Description** `.ui-scf__desc` – what it means, with `code`, **bold** and links
10. **Values** `.ui-scf__enum` – the only values allowed, as chips
11. **Limits** `.ui-scf__meta` – the default and the limits in words
12. **Children** `.ui-scf__group` – a nested field's fields, indented under it

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`--tc-scf-indent` sets how far each level is indented.

## Keyboard

The fields' buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Move between fields |
| → | Open a field's children; on an open field, move to its Copy link |
| ← | Back from Copy link; close an open field; or go to the field above it |
| Home / End | Go to the first or last field showing |
| Enter / Space | Open or close the field, or copy its link |

## Screen readers

The fields are a list named by the heading, and each field's children are a list inside it. A toggle says the field's
name, how many fields it holds, and whether it's expanded. Copy link says which field it links to. Filtering announces
how many fields match, and Copy link announces "Link copied" through `role="status"`.

## Content

- Write descriptions as what the field means to the caller, not how it's stored.
- Put limits in the schema (`minLength`, `pattern`, `maximum`), so they're drawn in words.
- Mark fields that are going away `deprecated`, and say in the description what to use instead.

## Do

- Use `id-prefix` when a page has several field lists, so their anchors don't clash.
- Give `$defs` entries a `title`, so arrays of them read "array of Person".

## Don't

- Don't put long prose in descriptions; link to a guide instead.
- Don't rely on Copy link for sharing outside the page – the anchor is only as stable as the field's name.

## Example

```html
<tc-schema-fields id="fields" heading="Record"></tc-schema-fields>

<script type="module">
  import "@adamstavely/trenchcoat/schema-fields";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#fields").schema = {
    type: "object",
    required: ["id", "title"],
    properties: {
      id: { type: "string", pattern: "^REC-\\d{6}$", description: "The record's id." },
      title: { type: "string", maxLength: 200, description: "What the record is." },
      classification: { type: "string", enum: ["public", "internal", "restricted"], default: "internal" },
      owner: {
        type: "object",
        description: "Who is accountable for it.",
        properties: { email: { type: "string", format: "email" } },
      },
    },
  };
</script>
```

```tsx
import { SchemaFields, type JsonSchema } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const record: JsonSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", description: "The record's id." },
    tags: { type: "array", items: { type: "string" }, maxItems: 20 },
  },
};

export function RecordFields() {
  return <SchemaFields title="Record" schema={record} idPrefix="record" />;
}
```
