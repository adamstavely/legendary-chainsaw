---
pattern: none
status: stable
related: chat-composer, voice-mode, email-draft, ai-answer
---

## Overview

A compact AI chat card for writing help. It opens on a welcome line with suggestion chips over a soft glow; people pick
a suggestion, type, or dictate – the spoken words appear live in the field, and the finished text waits there to be
sent. Replies stream in word by word. It gives a product a small, friendly place to ask for a draft, a shorter
version or a different tone, without a full chat screen.

## When to use

- A side panel or popover for help with writing – drafting, shortening, changing the tone.
- A focused assistant with a name and a few starting suggestions.
- Where dictation helps – on touch devices, or for people who'd rather speak than type.

## When not to use

- The message box of a full chat screen, with attachments and model choice – use `chat-composer`.
- A spoken conversation with the assistant talking back – use `voice-mode`.
- Reviewing an email an agent already wrote – use `email-draft`.
- One long answer with sources, not a conversation – use `ai-answer`.

## Anatomy

1. **Header** `.tc-head` – the icon, the assistant's name, its tagline and New chat
2. **Welcome** `.ui-wa__welcome` – the greeting and the suggestion chips, before the first message
3. **Suggestion** `.ui-wa__chip` – a starting prompt; picking it sends it
4. **Prompt field** `.ui-wa__field` – grows to four lines, then scrolls
5. **Mic** `.ui-wa__mic` – starts and stops dictation

## Looks

Standard puts the header on a gray tray above a white panel: a large greeting over a strong pink-violet-blue glow, a pill-shaped
field with Send inside it, a round mic beside it, and three dots while a reply is on its way. Clean is a quieter white
card with a hairline under the header; the greeting is smaller, the glow fainter,
the mic and Send sit in the field's row, and a shimmering “Writing…” replaces the dots.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through New chat (once there are messages), the chips, the field, the mic and Send |
| Enter | In the field, sends the message |
| Shift Enter | In the field, starts a new line |
| Enter / Space | On a chip, sends it; on the mic, starts or stops dictation |

## Screen readers

The field is named “Message”; while dictating it is read-only and its placeholder says “Listening…”. The mic is a
toggle button named “Dictate”, or “Stop dictation” with `aria-pressed="true"` while it listens. A status region says
“Writing…” while a reply is on its way, then the whole reply once, prefixed with the assistant's name (“Quill: Hi
team, …”) – never word by word. Errors are alerts: “Couldn't get a reply. Try again.”, “Microphone access was
blocked.”, “Dictation isn't supported in this browser.” New chat moves focus to the field.

## Content

- Give the assistant a short `name` and a `tagline` that says what it's for: “Your writing companion.”
- Make the `greeting` a question that invites a task: “What should we write?”
- Write three or four `suggestions` as things people would actually type, starting with a verb: “Polish my email”.
- Use the `placeholder` for an example of a good request: “Ask Quill to write or edit…”.

## Do

- Pass `respond` and use its `signal` – it aborts when people start a new chat or the card is removed.
- Use `history` in `respond` to keep the context of earlier messages.
- Seed or restore a conversation through `messages`, and save it from `tc-messages-change`.

## Don't

- Don't ship without `respond`: a sample writer stands in and warns in the console.
- Don't send dictated text automatically – the card leaves it in the field so people can check it first.
- Don't use more than four suggestions; they push the field down.

## Example

```html
<tc-writing-assistant id="quill" name="Quill" greeting="What should we write?"></tc-writing-assistant>

<script type="module">
  import "trenchcoat/writing-assistant";
  import "trenchcoat/tokens.css";

  const quill = document.querySelector("#quill");
  quill.suggestions = ["Polish my email", "Make it shorter"];
  quill.respond = (message, { signal, history }) =>
    fetch("/api/write", { method: "POST", body: JSON.stringify({ message, history }), signal }).then((r) => r.text());
  quill.addEventListener("tc-messages-change", (e) => console.log(e.detail.messages.length));
</script>
```

```tsx
import { WritingAssistant } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Quill({ write }: { write: (message: string, signal: AbortSignal) => Promise<string> }) {
  return (
    <WritingAssistant
      name="Quill"
      greeting="What should we write?"
      suggestions={["Polish my email", "Make it shorter"]}
      respond={(message, { signal }) => write(message, signal)}
    />
  );
}
```
