---
pattern: table
status: new
related: tool-permissions, gate-config, output-schema-builder, mcp-connection-manager
---

## Overview

Define a tool an agent can call, laid out as its API reference entry. The tool's name is the title and the approval a
call needs – nothing, a person's approval each time, or whatever tool permissions say – is a compact picker beside
it. The lead block is the signature – `search_orders(query: string, status?: string)` – and the description the model
reads to decide when to call it. The parameters are a doc table – name, type, required, what goes in it and the values
allowed – and each row opens in place to edit. An Example call shows the arguments the model would send, as JSON; 640
px and wider it sits beside the reference. The JSON Schema the parameters produce opens on request, and a strip at the
foot lists what's wrong (which makes the definition invalid) and what would make it better.

The approval here is the tool's own default. Who may call it is set in `tool-permissions`, and review rules for a run
in `gate-config`; the app enforces all three. The example is generated from the parameters unless the app supplies one
through `example`; the element never calls the tool.

## When to use

- Letting people add their own tools to an agent – an internal API, a lookup, an action.
- Reviewing a tool before it ships, where the description and parameters decide how well the model uses it.
- Any place the model's view of a tool should be readable by the person who owns it.

## When not to use

- Deciding which agents may use which tools – use `tool-permissions`.
- Setting when a run pauses for a person – use `gate-config`.
- Defining the shape of a model's answer rather than a tool's input – use `output-schema-builder`.
- Tools that come from an MCP server – use `mcp-connection-manager`; the server defines them.

## Anatomy

1. **Approval** `.ui-tdef__approval` – what a call needs before it runs, in the head beside the tool's name
2. **Signature** `.ui-tdef__code` – the tool as the model sees it; click a part to edit it
3. **Edit** `.ui-tdef__edit-head` – opens the name and description in place
4. **Parameter row** `.ui-tdef__param` – one parameter in the doc table; its Edit button opens the row's cells as fields
5. **Example call** `.ui-tdef__example` – the arguments the model would send; pointing at a row lights its line
6. **JSON Schema** `.ui-tdef__schema-toggle` – opens the schema the parameters produce
7. **Checks** `.ui-tdef__summary` – problems to fix and suggestions, each a link to its field

## Looks

Standard puts the head on the gray tray above a white card: the table's column headers sit on a tinted band, a row
being edited is tinted with an accent edge, and the example is a sunken well. Clean is one white card with the head as
its first row: hairlines under the head, between rows and beside the example, caption-style column headers, an
outlined approval picker and thinner icons. Below 500 px of reference width the table stacks each row – name, type
and Edit on one line, the description under them – and below 640 px the example moves under the table.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the approval picker, Edit, Add parameter, each row's Edit button (or its fields, when open), JSON Schema and the strip's links |
| ↑ / ↓ | In the approval picker, picks the previous or next approval |
| Enter / Space | On an Edit button, opens that part in place and focuses its first field; on Done, closes it; on a strip link, opens and focuses the field it's about |
| Escape | In an open row or the open name and description, closes it and returns focus to its Edit button |
| Alt+↑ / Alt+↓ | Anywhere in a parameter row, moves it up or down; focus stays with it |
| Enter or , | In Allowed, adds what's typed as a value |
| Backspace | In an empty Allowed field, removes the last value |

Adding a parameter opens its row and focuses its name. Removing one moves focus to the next row's Edit button, or to
Add parameter.

## Screen readers

The host is a group named by its title – the tool's name. The approval picker is a select named “Before it runs”,
described by the chosen approval's line. The signature is read whole: “Signature: search_orders(query: string,
status?: "open" | "shipped")”. The parameters are a `table` named “Parameters” with Name, Type, Description and Edit
column headers; each row is named “Parameter 2 of 3: status”, its name cell reads “required” or “optional”, and its
Edit button is “Edit status”. In an open row, the fields are named Name, Required, Type, “What status is for” and
Allowed. Example call is a section with that heading; its JSON is read as one line. The strip is a section headed, for
example, “2 problems to fix · 1 suggestion”; each link starts “Problem:” or “Suggestion:”. A polite status message says
“Parameter 4 added.”, “page moved to position 3 of 4.”, “limit removed.” and “Allowed: refunded.”

## Content

- Name tools and parameters the way an API would – `search_orders`, `placed_after` – letters, digits, `_` and `-`.
  The name is the card's title, so `heading` only shows while a new tool has none (“New tool”).
- Write the description for the model: what the tool does and when to use it, in a sentence or two.
- Describe every parameter, with an example where the format matters: “An email or order number (#10423)”.
- Use allowed values whenever the set is closed – the model can't guess “shipped” from “sent”.
- Pass `example` when you have a real call to show (from a log or a test); the generated one uses the first allowed
  value and placeholders such as `"<query>"`.
- Rename the approval choices through `approvals` to match your product's policy words, and keep the labels short –
  the picker sits beside the title.

## Do

- Treat the summary's problems as blocking: the form is invalid until they're fixed.
- Store the definition and generate the provider's own tool format from it on your server – `toolInputSchema()` gives
  the input schema.
- Default tools that change something to “Ask every time”.

## Don't

- Don't use the approval here instead of `tool-permissions` – it's the tool's default, not who may call it.
- Don't put secrets or endpoints in the description; the model reads it.
- Don't make every parameter required – optional ones let the model leave out what it doesn't know.

## Example

```html
<tc-tool-configuration id="tool" name="tool"></tc-tool-configuration>

<script type="module">
  import "trenchcoat/tool-configuration";
  import "trenchcoat/tokens.css";

  const tool = document.querySelector("#tool");
  tool.value = {
    name: "search_orders",
    description: "Find a customer's orders by email or order number.",
    parameters: [{ name: "query", type: "string", required: true, description: "An email or order number" }],
    approval: "auto",
  };
  tool.example = { query: "dana@example.com" };
  tool.addEventListener("tc-value-change", (e) => console.log(e.detail.value, tool.signature));
</script>
```

```tsx
import { useState } from "react";
import { ToolConfiguration, toolExampleCall, toolInputSchema, type ToolConfigurationValue } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function ToolEditor({ start, lastCall, save }: { start: ToolConfigurationValue; lastCall?: Record<string, unknown>; save: (v: ToolConfigurationValue, schema: Record<string, unknown>) => void }) {
  const [value, setValue] = useState(start);
  return (
    <ToolConfiguration
      description="Support agent · Orders"
      value={value}
      example={lastCall ?? toolExampleCall(value)}
      onChange={(v) => {
        setValue(v);
        save(v, toolInputSchema(v));
      }}
    />
  );
}
```
