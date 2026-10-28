---
pattern: none
status: new
related: structured-output, data-table, kpi-chart, stepper-form
---

## Overview

A model's answer drawn as real components instead of a wall of text. The model writes a small JSON spec – text,
metric tiles, tables, charts, forms and callouts, grouped and nested – and the element draws each block with the
library's own parts: `tc-data-table`, `tc-kpi-chart`, metric tiles with change-summary's trend marks, stepper-form's
fields. Every block is checked first; anything unknown or malformed falls back to its text, so one bad block never
breaks the answer. The spec can stream in as text: each block appears once it's complete. Nothing in the spec is
ever rendered as HTML, and every button and form comes back to the app as one event, `tc-action`.

## When to use

- An assistant that answers with numbers, comparisons or follow-up questions people should act on, not only read.
- Small forms the model needs filled in to continue – an address, a choice between options, a date.
- Answers where the app wants to keep the model to a known set of components rather than free-form markup.

## When not to use

- Showing the raw structured output and whether it matches its schema – use `structured-output`.
- A screen your team designs and builds – compose `data-table`, `kpi-chart` and the rest directly.
- Several questions the agent asks before it starts, answered as one reply – use `clarifying-questions`.
- A multi-step form – use `stepper-form`.

## Anatomy

1. **Metric** `.ui-gui__metric` – a label, the value and a change with its trend mark
2. **Chart** `.ui-gui__chart` – a `tc-kpi-chart`, lines coloured with the chart tokens
3. **Table** `.ui-gui__table` – a read-only `tc-data-table`
4. **Text fallback** `.ui-gui__fallback` – a block that couldn't be drawn, shown as its text
5. **Callout** `.ui-gui__callout` – a tinted note with its tone's icon, nested blocks and action buttons
6. **Form** `.ui-gui__form` – stepper-form's fields with a submit button

## Looks

Standard sets metric tiles on the gray tray colour and the form on a gray tray around a white card, as stepper-form
does. Clean draws tiles and the form as white cards with hairline shadows, uses medium rather than semibold
headings and quieter body text. Tables and charts follow the look through their own elements.

## Keyboard

The element adds no keys of its own: Tab moves through its buttons, form fields and the table and chart, which keep
their own keyboard (the table's grid, the chart's ← → and the choice cards' arrow keys).

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves through the actions, fields, table and chart |
| Enter in a text field | Submits the form |
| Enter / Space on a button | Presses the action, or submits the form |

When a submit finds problems, focus moves to the first field with one.

## Screen readers

Text headings, group and form titles are `role="heading"` with `aria-level` from `headingLevel` (3 by default); the
form is named by its title, and a group with a title is a named `section`. Every field is labelled by its
stepper-form label; a field with a problem is `aria-invalid` and described by its message (“Fill this in”, “That
doesn't look like an email address”). A polite status says “2 fields need attention” after a failed submit. Metric
changes are said in words as well as colour (“Good change: Up 38%”), and a callout starts with its tone (“Warning:
…”). While the spec streams, the blocks are `aria-busy` and the placeholder is hidden from screen readers.

## Content

The format to prompt the model with:

| Block | Fields |
|---|---|
| `text` | `text`, `style`: "body", "heading" or "muted" – blank lines split paragraphs |
| `metric` | `label`, `value`, `change`, `tone`: "good", "bad" or "neutral", `direction`: "up" or "down" |
| `table` | `title`, `columns`: `{ key, label, type }` with type "text", "number", "tag" or "link", `rows`: objects by key |
| `chart` | `title`, `value`, `delta`, `labels`, `series`: `{ label, values }` with one number per label, `footer` |
| `form` | `id`, `title`, `submitLabel`, `fields`: `{ name, label, kind, required, placeholder, hint, value, options, min, max }` |
| `callout` | `tone`: "info", "success", "warning" or "danger", `title`, `text`, `children`, `actions` |
| `group` | `title`, `layout`: "column", "row" or "grid", `children`, `actions` |
| `component` | `tag`: any tag in `trenchcoat/generative`'s catalogue, `props`: the component's properties as JSON |

A spec is `{ blocks: [...] }`, a list of blocks, or one block. Field kinds are "text", "email", "number", "url",
"date", "textarea", "select" (a native select) and "choice" (stepper-form's cards). Actions are `{ id, label,
primary }`. Blocks nest inside callouts and groups up to six levels.

- Ask the model for the fewest blocks that answer the question.
- Keep `text` short and specific; let metrics and tables carry the numbers.
- Write action labels as what happens (“Cap daily spend”), and give each a stable `id` your app handles.
- Title forms by what they do (“Send this as a weekly report”) and their submit button with the verb.
- For a `component` block, put `catalogPrompt()` from `trenchcoat/generative` in the system prompt – a line per
  component, or only the few your assistant needs. The props are checked against the component's schema before
  anything is set: what doesn't fit is left out and listed in `tc-spec-check`, and links must be http(s), mailto, tel
  or relative. Set `allowedOrigins` to hold the components' images to your own origins. See Foundations → Generative
  UI.

## Do

- Handle `tc-action` in one place: switch on `kind` and `action`, and read `values` for forms.
- Listen to `tc-spec-check` (`onSpecCheck`) in development and evaluations to see what the model got wrong; turn
  on `showIssues` to see it in place.
- Handle a placed component's events from `tc-component-event` (`onComponentEvent`): it says which block, which tag
  and which event, and preventing it prevents the component's own (for the cancelable ones).
- Pass the model's text straight to `spec` with `streaming` while it arrives.

## Don't

- Don't put HTML or Markdown in the spec expecting it to render – every string is shown as text.
- Don't rely on a block type the format doesn't list; it shows as plain text.
- Don't use a generated form for anything sensitive, such as passwords or payment details.

## Example

```html
<tc-generated-ui id="answer"></tc-generated-ui>

<script type="module">
  import "trenchcoat/generated-ui";
  import "trenchcoat/tokens.css";

  const answer = document.querySelector("#answer");
  answer.spec = {
    blocks: [
      { type: "metric", label: "Sign-ups", value: "4,812", change: "Up 38%", tone: "good" },
      { type: "callout", tone: "warning", title: "Paid search is over budget", actions: [{ id: "cap", label: "Cap spend" }] },
    ],
  };
  answer.addEventListener("tc-action", (e) => console.log(e.detail.kind, e.detail.action, e.detail.values));
</script>
```

```tsx
import { GeneratedUi, type GeneratedUiActionDetail } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Answer({ text, streaming }: { text: string; streaming: boolean }) {
  const onAction = (a: GeneratedUiActionDetail) => {
    if (a.kind === "submit" && a.action === "schedule-report") console.log(a.values);
  };
  return <GeneratedUi spec={text} streaming={streaming} onAction={onAction} />;
}
```
