---
pattern: combobox
status: new
related: chat-composer, command-menu, combobox, context-tray
---

## Overview

The @ and / picker inside a message box. When someone types a trigger character, a list opens under it with the
people, files, sources or commands that match what they type next, in groups. Arrow keys and Enter – or a click – put
the pick in place of what was typed: as a token such as “@Maya Chen” in a textarea or input, or as a chip in a
contenteditable field. It attaches to a field your app already owns, so the composer keeps its own markup, focus and
Enter-to-send.

## When to use

- Mentioning people, files or sources in a message to a person or an agent.
- Slash commands at the start of a line (`atLineStart`), next to @-mentions in the same box.
- Suggestions that come from a server as people type – pass `search` and it shows a loading state and drops stale
  answers.

## When not to use

- A field whose whole value is the pick, such as assignees or labels – use `combobox`.
- Running commands or jumping somewhere from anywhere in the app – use `command-menu`.
- Showing what's already attached to the conversation, with its token weight – use `context-tray`.
- A complete chat input with attachments and a send button – use `chat-composer`, and attach the picker to it.

## Anatomy

1. **List** `.ui-mnp__pop` – the popover under the trigger character, or above it when there's more room there
2. **Group heading** `.ui-mnp__label` – names a group of results: “Files”, “People”
3. **Row** `.ui-mnp__option` – one result, with its icon or avatar, the label and a lighter hint
4. **Highlight** `.ui-mnp__pill` – the fill that glides to the active row
5. **Key hints** `.ui-mnp__foot` – ↑ ↓ to move, ↵ to insert, Esc to close

## Looks

Standard sets the list on a white card inside a gray tray, with the key hints on the tray below it. Clean is one
white popover with hairline shadows and the key hints as its last row (“esc” in lower case). Both glide the same
highlight between rows and place the list the same way.

## Keyboard

The field keeps focus throughout; the picker takes these keys only while its list is open.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous row, wrapping at the ends |
| Enter | Inserts the active row (the first row unless another is active). With nothing to insert, closes the list and lets the key through – a composer's Enter-to-send still works |
| Tab | Inserts the active row, like Enter; with nothing to insert, closes the list and moves on |
| Escape | Closes the list; it stays closed until another trigger character is typed |

Moving the caret out of the query, or pressing outside the field and the list, also closes it.

## Screen readers

The field is the combobox and keeps focus: an `<input>` or a contenteditable element gets `role="combobox"` and
`aria-expanded`; a `<textarea>` keeps its textbox role, as HTML requires. Both get `aria-autocomplete="list"`,
`aria-controls` pointing at the listbox, and `aria-activedescendant` pointing at the active row, which is
`aria-selected`. The listbox is named by the trigger's `label` (“People, files and sources”), or “Suggestions”, and
each group by its heading. A polite status says how many results there are (“4 suggestions”), the empty text (“No
matches”), “Couldn't load suggestions” when a search fails, and the pick (“Inserted @Maya Chen”). The key hints are
hidden from screen readers. The picker gives back the field's own attributes when it detaches.

## Content

- Name each trigger's list in `label` by what it holds: “People and files”, “Commands”.
- Use the hint for what tells two rows apart – a role, a path, what a command does – not a description of every row.
- Write command labels as the word people type (“summarize”), and set `token` to what lands in the field
  (“/summarize”).
- Write `emptyText` for the list: “No one found” reads better than “No matches” for people – the picker adds
  “for ‘…’” with what was typed.

## Do

- Group results by kind (Files, People, Sources), so people know what they're picking.
- Put synonyms people might type in `keywords`.
- Call `preventDefault()` on `tc-pick` when your editor inserts mentions its own way, and insert the token yourself.

## Don't

- Don't use a trigger character people type at the start of words for other reasons – “#” in a field where people
  write “#2” opens the list every time. (Inside a word, as in `ana@example.com`, a trigger is ignored.)
- Don't add actions (“Invite someone”) as rows next to results.
- Don't move focus into the list – it is designed to leave focus in the field.

## Example

```html
<textarea id="message" aria-label="Message"></textarea>
<tc-mention-picker id="mentions" for="message"></tc-mention-picker>

<script type="module">
  import "trenchcoat/mention-picker";
  import "trenchcoat/tokens.css";

  const picker = document.querySelector("#mentions");
  const people = [{ id: "maya", label: "Maya Chen", hint: "Design", avatar: true }];
  const commands = [{ id: "sum", label: "summarize", hint: "Sum up the thread", token: "/summarize" }];
  picker.triggers = [
    { char: "@", label: "People", groups: [{ id: "people", label: "People", items: people }] },
    { char: "/", atLineStart: true, label: "Commands", groups: [{ id: "cmd", label: "Commands", items: commands }] },
  ];
  picker.addEventListener("tc-pick", (e) => console.log(e.detail.token));
</script>
```

```tsx
import { useRef } from "react";
import { MentionPicker, type MentionTrigger } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const triggers: MentionTrigger[] = [
  {
    char: "@",
    label: "People and files",
    groups: [
      { id: "people", label: "People", items: [{ id: "maya", label: "Maya Chen", hint: "Design", avatar: true }] },
      { id: "files", label: "Files", items: [{ id: "spec", label: "billing-spec.md", hint: "docs/billing" }] },
    ],
  },
];

export function Message() {
  const field = useRef<HTMLTextAreaElement>(null);
  return (
    <>
      <textarea ref={field} aria-label="Message" />
      <MentionPicker target={field} triggers={triggers} onPick={(pick) => console.log(pick.token)} />
    </>
  );
}
```
