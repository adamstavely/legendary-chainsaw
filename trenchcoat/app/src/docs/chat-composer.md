---
pattern: none
status: react-twin
related: model-picker, mention-picker, context-tray, voice-mode
---

## Overview

The message box of an AI chat. People type or dictate a message, pick which model answers, attach files and send –
and, around the box, connect their apps, pick a project and request wider access for the agent. Voice input shows
the words as they're heard, in gray behind what's confirmed, with a live audio trace and Discard / Use recording. A
send that returns a promise keeps the message until it goes through, and brings it back with an error if it doesn't.
On request it also hosts the / and @ picker and a tray of what's in context.

## When to use

- The prompt field at the bottom of an AI chat or assistant.
- When people should choose the model per message, or speak instead of typing.
- When the agent needs app connections, a project or an approval before it can do its best work.

## When not to use

- Choosing a model with speed, quality and cost side by side – use `model-picker`, alone or next to a plain field.
- A full spoken conversation with live captions, rather than dictating one message – use `voice-mode`.
- Asking for permission at the moment an agent acts – use `permission-request`.

## Anatomy

1. **Connect apps** `.ui-chat-composer__connect` – on the tray (Clean: the last row); then “Select a project”
2. **Message** `.ui-chat-composer__message` – the text area; grows with the text
3. **Attach** `.ui-chat-composer__icon-btn` – the plus button; fires `tc-attach` for your own picker
4. **Model** `.ui-chat-composer__model` – the chosen model; opens the list of models
5. **Request approval** `.ui-chat-composer__approval` – turns into “Unrestricted access” once granted
6. **Send** `.ui-chat-composer__send` – sends; next to the mic, which records instead

## Looks

Standard is a white card on a gray tray that holds “Connect apps” / “Select a project” above it; it scales with its
width, and the message shows one line and grows to two. Clean is one white card with hairline shadows and fixed
sizes: the message on top, growing up to four lines, the tools in a row below it, and a quiet last row that connects
apps and then lets you pick a project; its icons are 16 px glyphs with thin lines and solid shapes.

## Keyboard

| Key | What it does |
|---|---|
| Enter | In the message: sends it |
| Shift Enter | In the message: a new line |
| ↓ / ↑ | On the model button: opens the list of models. In the list: the next or previous model |
| Home / End | In the list: the first or last model |
| Enter / Space | On the model button: opens or closes the list, focus in the list. In the list: picks the active model and closes it, focus back on the model button |
| Escape | Closes the list of models; while recording, discards the recording |
| Tab | In the list: closes it and moves on from the model button |

With `mentions` set, typing / or @ in the message opens the picker, which has its own keys (`mention-picker`).

## Screen readers

The composer is a section named “Message composer”; the text area is named “Message”. Icon buttons are named for
what they do: “Add attachment”, “Voice input”, “Send message”, “Discard recording” and “Use recording” – which is
described by what was heard so far (“Heard so far: …”). The model button has `aria-haspopup="listbox"` and
`aria-expanded`; the list is a `listbox` named “Select a model” with `aria-activedescendant` and the chosen option
`aria-selected`. A polite live region follows along: “Recording. Press Escape to discard.”, “Recording added to your
message.”, “Sending…”, “Message sent.”, “Claude selected.”, “Connecting apps…”, “Apps connected. Select a
project.”, “Unrestricted access granted.” Failures are alerts: “Your message wasn't sent. Try again.”, “Your apps
couldn't be connected. Try again.”, “Approval wasn't granted. Try again.”

## Content

- Write the placeholder as an invitation in the product's voice: “Ask anything…”, “Ask anything, or press the mic to
  dictate…”.
- Keep model descriptions to one line about what each is good for: “Thoughtful writing and code”.
- Leave the built-in labels – “Connect apps”, “Request approval” – unless your product calls them something else.

## Do

- Return a promise from `onSend` so a failed send keeps the message and says so.
- Wire `onDictate` to your speech-to-text and push `onTranscript` and `onLevel` as the words come in.
- Pass `onConnectApps` and `onRequestApproval` – without them (and without `demo`) the composer only simulates them
  and warns once in the console.

## Don't

- Don't ship `demo` – it simulates connecting, approval and dictation silently.
- Don't clear the message yourself after `onSend`; the composer clears it when the send goes through.
- Don't put more than a handful of models in the list – use `model-picker` when people need to compare them.

## Example

```html
<tc-chat-composer id="composer" placeholder="Ask anything…"></tc-chat-composer>

<script type="module">
  import "trenchcoat/chat-composer";
  import "trenchcoat/tokens.css";

  const composer = document.querySelector("#composer");
  composer.onSend = (message, { model }) => fetch("/api/chat", { method: "POST", body: JSON.stringify({ message, model }) });
  composer.onConnectApps = () => fetch("/api/connect", { method: "POST" });
  composer.onRequestApproval = () => fetch("/api/approve", { method: "POST" });
  composer.addEventListener("tc-attach", () => document.querySelector("#file").click());
</script>
```

```tsx
import { ChatComposer, defaultModels } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Composer({ send, pickFiles }: { send: (text: string, model: string) => Promise<void>; pickFiles: () => void }) {
  return (
    <ChatComposer
      placeholder="Ask anything…"
      models={defaultModels}
      onSend={(text, { model }) => send(text, model)}
      onAttach={pickFiles}
      onConnectApps={() => fetch("/api/connect", { method: "POST" })}
      onRequestApproval={() => fetch("/api/approve", { method: "POST" })}
    />
  );
}
```
