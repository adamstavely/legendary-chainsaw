---
pattern: dialog
status: new
related: embed-configurator, chat-composer, prompt-starters, handoff
---

## Overview

The chat a visitor opens on a website. A launcher sits in a corner of the page – with a count when there are
messages they haven't seen – and opens a panel: the agent's name, picture and how fast it replies, a greeting, a few
starter questions, the conversation and a field to write in, with a line on privacy under it. When a person from the
team takes over, a notice says who joined and their messages carry their name.

The page owns the conversation. Sending a message or picking a starter fires `tc-send` with the text; the page
appends the visitor's message, then the reply, to `messages` (set `typing` while it waits). `theme` styles the widget
for the site – the accent, the corner radius, the side, the greeting and the title – and the text on the accent is
dark or light, whichever reads better.

## When to use

- A help or sales assistant embedded on a public website.
- The live preview of such a widget in its settings – see `embed-configurator`.
- A support chat that can hand a visitor over to a person.

## When not to use

- The chat inside your own product, where people are signed in – use `chat-composer` with a message list, or the
  `ai-side-pane` block.
- A shared thread with several people and the model – use `multiplayer-thread`.
- Setting up the widget – use `embed-configurator`, which shows this as its preview.

## Anatomy

1. **Launcher** `.ui-emw__launcher` – the button in the corner, with its words and an icon
2. **Unread count** `.ui-emw__badge` – messages not yet seen, while the panel is closed
3. **Panel** `.ui-emw__panel` – the non-modal dialog above the launcher
4. **Header** `.ui-emw__head` – the picture `.ui-emw__avatar`, name `.ui-emw__name`, reply time `.ui-emw__sub` and Close `.ui-emw__close`
5. **Conversation** `.ui-emw__log` – the greeting and the messages `.ui-emw__msg`, each a bubble `.ui-emw__bubble`
6. **Handoff notice** `.ui-emw__notice` – "Priya from the data desk joined"
7. **Starters** `.ui-emw__starters` – questions to begin with, until the visitor has written
8. **Message field** `.ui-emw__compose` – the text field `.ui-emw__field` and Send `.ui-emw__send`
9. **Privacy line** `.ui-emw__privacy` – a short note and a link

## Looks

Standard puts the header on a gray tray and the conversation on a white card inside it; Clean is one white card with
a hairline under the header. Both take the site's accent for the launcher, the visitor's bubbles, the picture and
Send. The panel's size can be set with `--tc-emw-w` (360px) and `--tc-emw-h` (520px), and the theme sets
`--tc-emw-accent`, `--tc-emw-on-accent` and `--tc-emw-radius`. `floating` pins it to the window's corner, as on a real
site; without it the widget sits in the page's flow, which suits previews and docs.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space on the launcher | Opens the panel and moves focus to the message field, or closes it |
| Enter in the field | Sends the message |
| Shift + Enter | Starts a new line |
| Escape | Closes the panel and puts focus back on the launcher |
| Tab | Moves through the header, conversation, starters and field – and on to the page, as the panel isn't modal |

## Screen readers

The launcher is a button with `aria-expanded` and `aria-controls`; its name is its words plus the unread count ("Chat
with us, 2 new messages"). The panel is a `dialog` (`aria-modal="false"`) named by the agent's name. The conversation
is a `log` named "Conversation", so new messages are read as they arrive; each starts with who wrote it ("You:",
"Ask the Institute:", "Priya · Data desk:"). The typing dots are hidden and read as "Ask the Institute is typing". The
starters are a group of buttons, and Send is `aria-disabled` while the field is empty.

## Content

- Name the agent for what it helps with – "Ask the Institute", "Help desk" – rather than "Bot".
- Keep the greeting to one or two sentences saying what it can do.
- Write starters as the visitor would ask them; three is enough.
- Say in the privacy line what not to share, and link to the policy.

## Do

- Pick an accent that reads with text on it – `embed-configurator` checks it for you.
- Set `typing` while the reply is on its way, and clear it when the reply is appended.
- Show the handoff notice when a person joins, and give their messages a name.

## Don't

- Don't open the panel on its own when the page loads – let the visitor choose.
- Don't use `floating` inside a docs page or a card; it pins the widget to the window.
- Don't put links or buttons into message text – keep replies to plain text.

## Example

```html
<tc-embed-widget id="help" heading="Ask the Institute" greeting="Hi! I can help with visits, data requests and publications." open></tc-embed-widget>

<script type="module">
  import "@adamstavely/trenchcoat/embed-widget";
  import "@adamstavely/trenchcoat/tokens.css";

  const help = document.querySelector("#help");
  help.theme = { accent: "#0f766e", radius: 16 };
  help.starters = [
    { id: "hours", text: "When is the reading room open?" },
    { id: "data", text: "How do I request a dataset?" },
  ];
  help.addEventListener("tc-send", (e) => {
    help.messages = [...help.messages, { id: String(Date.now()), from: "visitor", text: e.detail.text }];
    help.typing = true;
    setTimeout(() => {
      help.typing = false;
      help.messages = [...help.messages, { id: `${Date.now()}r`, from: "assistant", text: "Thanks – the help desk will reply here." }];
    }, 800);
  });
</script>
```

```tsx
import { useState } from "react";
import { EmbedWidget, type EmbedMessage } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function HelpWidget({ ask }: { ask: (text: string) => Promise<string> }) {
  const [messages, setMessages] = useState<EmbedMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const send = async (text: string) => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: "visitor", text }]);
    setTyping(true);
    const reply = await ask(text);
    setTyping(false);
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: "assistant", text: reply }]);
  };
  return (
    <EmbedWidget
      title="Ask the Institute"
      greeting="Hi! I can help with visits, data requests and publications."
      floating
      theme={{ accent: "#0f766e", radius: 16, position: "right" }}
      messages={messages}
      typing={typing}
      onSend={(text) => void send(text)}
    />
  );
}
```
