---
pattern: listbox
status: new
related: chat-composer, mention-picker, prompt-library, generated-ui
---

## Overview

Where to begin, and what to ask next. In an empty chat it offers starters in groups – “Analyse”, “Write”, “Find” –
each with an icon and a hint saying where it came from; after an answer it offers a few follow-up questions. A
suggestion either sends at once or fills the composer so people can finish it first, and the list says which. The
suggestions are data your app works out from the conversation's context; `loading` shows placeholders meanwhile.

## When to use

- The empty state of a chat or assistant, so people see what it's good at.
- Follow-up questions under an answer (`variant="follow-ups"`).
- Prompts with a blank to complete (“Draft a follow-up to …”) – set `mode: "fill"` on them.

## When not to use

- A library of saved prompts people browse, search and manage – use `prompt-library`.
- Suggestions that appear while typing @ or / in the message – use `mention-picker`.
- Questions the agent needs answered before it starts – use `clarifying-questions`.
- The message box itself – use `chat-composer`, and put the starters above it.

## Anatomy

1. **Header** `.tc-head` – the icon and the heading that names the list: “Start with”, “Ask next”
2. **Group heading** `.ui-pst__group-label` – the kind of task: “Analyse”, “Write”
3. **Suggestion** `.ui-pst__option` – the icon, the label and a lighter hint
4. **Icon tile** `.ui-pst__icon` – the group's icon on its tint (a turn-arrow for follow-ups)
5. **Edit first** `.ui-pst__fill` – the pencil that fills the composer instead of sending
6. **Key hints** `.ui-pst__foot` – ↑ ↓ to move, ↵ and → with what they do

## Looks

Standard sets the list on a white card inside a gray tray, with the heading and the key hints on the tray. Clean is
one white card with hairline shadows, the key hints as its last row, smaller tile radii and thinner icons. Follow-ups
drop the tinted tiles and hints in both, for a compact list under an answer.

## Keyboard

The list is one tab stop, on the suggestion last used.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous suggestion (no wrapping) |
| Home / End | Moves to the first or last suggestion |
| Enter / Space | Uses the suggestion the way it's set to: sends it, or fills the composer |
| → | Fills the composer with the suggestion, to edit before sending |
| A letter | Moves to the next suggestion that starts with the letters typed |

## Screen readers

The list is a `listbox` named by the heading, each group a `group` named by its heading, and each suggestion an
`option` whose name ends with what choosing it does – “Which Q3 deals are most at risk? From the pipeline you opened
today, Ask” or “…, Edit first” (the words come from `sendLabel` and `fillLabel`). The active suggestion is
`aria-selected`. While loading, the list is `aria-busy` and the placeholders are hidden. The key hints and the
pencil are hidden from screen readers; → does the same.

## Content

- Write suggestions as the person would ask them, in their words, not as feature names: “Which deals are most at
  risk?” rather than “Risk analysis”.
- Use `label` for a shorter line when the sent `text` is long, and `hint` to say why it's suggested (“From the
  pipeline you opened today”).
- Name groups by the kind of task, with a verb: “Analyse”, “Write”, “Find”.
- Three to six starters and two or three follow-ups are enough.

## Do

- Personalise from context: the open document, recent work, the answer just given.
- Put the text in the composer and focus it on `tc-fill`, so people can type straight away.
- Set `mode: "fill"` on prompts that end in a blank.

## Don't

- Don't offer follow-ups that repeat the question just answered.
- Don't send a suggestion that needs details only the person has – fill it instead.
- Don't use the list for actions that aren't prompts, such as “Clear chat”.

## Example

```html
<tc-prompt-starters id="starters" heading="Start with"></tc-prompt-starters>
<tc-chat-composer id="composer"></tc-chat-composer>

<script type="module">
  import "trenchcoat/prompt-starters";
  import "trenchcoat/tokens.css";

  const starters = document.querySelector("#starters");
  const composer = document.querySelector("#composer");
  starters.groups = [
    { id: "analyse", label: "Analyse", icon: "chart", tone: "blue", items: [{ id: "risk", text: "Which deals are most at risk?" }] },
    { id: "write", label: "Write", icon: "write", tone: "violet", items: [{ id: "draft", text: "Draft a follow-up to ", mode: "fill" }] },
  ];
  starters.addEventListener("tc-send", (e) => ask(e.detail.text));
  starters.addEventListener("tc-fill", (e) => (composer.value = e.detail.text));
</script>
```

```tsx
import { useState } from "react";
import { ChatComposer, PromptStarters, type PromptStarter } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const followUps: PromptStarter[] = [
  { id: "q4", text: "Show the same view for Q4" },
  { id: "owners", text: "Who owns each of these deals?" },
];

export function NextQuestions({ ask }: { ask: (text: string) => void }) {
  const [message, setMessage] = useState("");
  return (
    <>
      <PromptStarters variant="follow-ups" title="Ask next" items={followUps} onSend={ask} onFill={setMessage} />
      <ChatComposer value={message} onValueChange={setMessage} onSend={ask} />
    </>
  );
}
```
