---
pattern: listbox
status: stable
related: chat-composer, mention-picker, model-picker, command-menu
---

## Overview

A shelf of saved prompts that people fill in instead of retyping. Each template is a sentence with `{variables}`;
people type straight into the gaps, watch the finished prompt assemble below, and send it with Use once every
gap is filled. A counter shows how many are filled, the tray estimates the prompt's length in tokens, and Copy
puts the finished prompt on the clipboard. Search narrows the list by title, category or text.

## When to use

- A team's recurring requests – follow-up emails, summaries, release notes – where the wording is settled and only
  the details change.
- Handing people a good prompt without asking them to write one.
- Next to a composer, as the place prompts come from.

## When not to use

- Writing a free-form message – use `chat-composer`.
- Inserting a saved snippet or command while typing – use `mention-picker`.
- Choosing the model a prompt runs on – use `model-picker`.
- Running actions or jumping somewhere from a list – use `command-menu`.

## Anatomy

1. **Search** `.ui-pli__search` – narrows the list by title, category or text
2. **List** `.ui-pli__list` – the templates, each with its category tag
3. **Counter** `.ui-pli__count` – one bar per variable and “2 of 4 filled”
4. **Variable** `.ui-pli__token` – a field inside the sentence, sized to what's typed
5. **Preview** `.ui-pli__preview` – the finished prompt, with gaps still shown as `{name}`
6. **Caption** `.ui-pli__caption` – the token estimate, the variable being edited, or what just happened
7. **Use** `.ui-pli__use` – sends the finished prompt; off until every variable is filled

## Looks

Standard puts the header on the gray tray, the list and the template on a white card below it, and the caption, Copy
and Use on the tray under that. Clean drops the tray: one white card whose first row is the header and whose last row
holds the caption, Copy and Use. Both
highlight the part that just changed, roll the token count and pulse Use once when the last variable is filled.

## Keyboard

| Key | What it does |
|---|---|
| ↓ | In the search field: moves focus to the chosen template (or the first one shown) |
| Escape | In the search field: clears the search |
| ↓ / ↑ | In the list: chooses the next or previous template and focuses it |
| Home / End | In the list: chooses the first or last template |
| Enter / Space | On a template: chooses it |
| Enter | In a variable: moves to the next empty variable; when all are filled, presses Use |
| Tab | Moves between the search field, the list (one stop), the variables, Copy and Use |

## Screen readers

The component is a group named by its heading. The list is a `listbox` named “Templates”, its options
`aria-selected`. Each variable is a text field named after the variable and its description – “date – When the demo
happened, e.g. Tuesday”. The preview is a region named “Preview”. Use stays focusable while it's off: it is
`aria-disabled`, described by “Fill 2 more variables to use”, and pressing it says “Fill 2 more variables to use the
prompt”. A status region announces “All variables filled”, “Prompt copied”, “Couldn't copy the prompt”,
“Sales follow-up used” and “Couldn't use the prompt”; Use is `aria-busy` while an `onUse` promise is pending.

## Content

- Title templates by the job, as a noun phrase: “Sales follow-up”, “Meeting summary”.
- Name variables with one plain word – `name`, `audience`, `version` – they are the placeholder people see.
- Give every variable a `description` with an example: “When the demo happened, e.g. Tuesday”.
- Set a `default` only where one answer is usual; an empty gap gets more attention than a wrong guess.
- Keep categories few and short – “Sales”, “Ops” – each gets its own colour in the order it first appears.

## Do

- Write the body as one or two sentences people can read in full; the variables sit inside them.
- Return a promise from `onUse` when sending takes time, so Use shows that it's busy and reports a failure.
- Use `useLabel` for what Use does in your product: “Send”, “Insert”.

## Don't

- Don't put more than about five variables in one template – split it into two.
- Don't use the same variable for two different things; one name fills every place it appears.
- Don't hide Use until the prompt is ready – the component keeps it in place and says what's missing.

## Example

```html
<tc-prompt-library id="prompts" heading="Prompts" use-label="Use prompt"></tc-prompt-library>

<script type="module">
  import "trenchcoat/prompt-library";
  import "trenchcoat/tokens.css";

  const library = document.querySelector("#prompts");
  library.templates = [
    {
      id: "summary",
      title: "Meeting summary",
      category: "Ops",
      body: "Summarize these notes for {audience} in {length} bullet points.",
      variables: {
        audience: { description: "Who reads it", default: "the leadership team" },
        length: { description: "How many bullets" },
      },
    },
  ];
  library.onUse = (prompt) => console.log(prompt);
  library.addEventListener("tc-copy", (e) => console.log("Copied", e.detail.prompt));
</script>
```

```tsx
import { PromptLibrary, type PromptTemplate } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const templates: PromptTemplate[] = [
  {
    id: "summary",
    title: "Meeting summary",
    category: "Ops",
    body: "Summarize these notes for {audience} in {length} bullet points.",
    variables: {
      audience: { description: "Who reads it", default: "the leadership team" },
      length: { description: "How many bullets" },
    },
  },
];

export function Prompts({ send }: { send: (prompt: string) => Promise<void> }) {
  return <PromptLibrary title="Prompts" templates={templates} onUse={(prompt) => send(prompt)} />;
}
```
