---
pattern: none
status: new
related: chat-composer, chat-history, ai-answer, message-actions, prompt-starters
---

## Overview

A complete assistant app in one element. A sidebar with search, New chat, Projects, pinned items, recent chats and the
signed-in person; a main panel that shows one of three views:
- **Welcome** – a greeting, the Chat Composer, three starter prompts and a short disclaimer.
- **Chat** – the conversation, the answer typing itself in word by word, Copy and Ask again under each answer, an
  error with Try again when the model call fails, and the composer docked at the bottom.
- **Projects** – search, sort and a card per project, with Rename and Pin in each card's menu and a Create project
  dialog.

Set `respond` to your model call; without it the workspace answers with demo text. The sidebar collapses, and on a
narrow container it becomes an overlay that starts closed.

## When to use

- A prototype or internal tool that needs a whole assistant UI quickly.
- A product's “Ask AI” area, where chats are grouped into projects.
- Demos and onboarding for a model or an agent.

## When not to use

- Only the message box – use `chat-composer`.
- A list of past conversations inside your own layout – use `chat-history`.
- One answer with sources – use `ai-answer`.
- Suggested first prompts on their own – use `prompt-starters`.

## Anatomy

1. **Sidebar** `.ui-aw__side` – search, navigation, pinned items, recents and the person
2. **Chat search** `.ui-aw__search` – filters recents and pinned items
3. **Recent chat** `.ui-aw__item` – opens a conversation
4. **Breadcrumb** `.ui-aw__crumb-btn` – the project and chat; switches project
5. **Welcome** `.ui-aw__welcome` – the greeting, composer and starters
6. **Starter** `.ui-aw__starter` – a prompt that starts a chat
7. **Messages** `.ui-aw__messages` – the conversation
8. **Answer** `.ui-aw__msg--ai` – an answer with its orb, Copy and Ask again
9. **Projects** `.ui-aw__projects` – the projects overview
10. **Project card** `.ui-aw__project` – a project with its options menu
11. **Dialog** `.ui-aw__dialog` – Create project

## Looks

Standard sets the sidebar on a sunken frame and the main panel as a white card with a hairline border. Clean uses the
tray colour for the frame, the card shadow on the panel and the Clean composer and buttons. Everything else – the
orb, menus, project cards and dialog – is the same in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the sidebar, the bar, the view and the composer |
| Enter / Space | Opens a chat, a menu or the dialog; picks a menu item |
| ↑ / ↓ | In a menu, moves between items |
| Home / End | In a menu, moves to the first or last item |
| Esc | Closes a menu or the dialog; focus returns to the button that opened it |
| Tab (in a menu) | Closes it |
| Enter (renaming) | Keeps the new name; Esc drops it. Focus returns to the card's options |
| Tab (in the dialog) | Stays inside it |

When a control goes away – the sidebar toggles, the welcome screen after a starter, a closing menu – focus moves to its
counterpart, never to the page.

## Screen readers

The sidebar is a landmark named “Workspace” and is `inert` while collapsed. Menus use `role="menu"` with
`menuitem` / `menuitemradio`, and their buttons report `aria-haspopup` and `aria-expanded`. The current chat or view is
marked with `aria-current`. One narrow status region announces “Thinking…” and then the whole answer once, so the
typing isn't read word by word; a failed answer is an alert. The dialog is modal and labelled by its title.

## Content

- Greet the person by first name in `user-name`.
- Keep pinned items and project names short – the sidebar is 240 px wide.
- Write project descriptions as what's inside: “Interview notes and survey results”.
- Return plain text from `respond`; line breaks are kept.

## Do

- Persist `tc-conversations-change` and `tc-projects-change` and pass the lists back.
- Reject `respond`'s promise with a readable message – it's shown after “No answer –”.
- Give the element a height that suits the page (`--tc-aw-h`, 640 px by default).

## Don't

- Don't stream partial answers into `conversations` – resolve `respond` with the full text and let it type in.
- Don't hide the disclaimer for model output people act on.
- Don't use it inside another app shell with its own sidebar – use `chat-composer` and `chat-history` there.

## Example

```html
<tc-ai-workspace id="ws" user-name="Lena"></tc-ai-workspace>

<script type="module">
  import "trenchcoat/ai-workspace";
  import "trenchcoat/tokens.css";

  const ws = document.querySelector("#ws");
  ws.respond = async (message, history) => {
    const res = await fetch("/api/answer", { method: "POST", body: JSON.stringify({ message, history }) });
    if (!res.ok) throw new Error("The model is busy – try again in a minute.");
    return (await res.json()).text;
  };
  ws.addEventListener("tc-conversations-change", (e) => console.log(e.detail.conversations.length));
</script>
```

```tsx
import { AiWorkspace, type AiWorkspaceConversation } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Assistant({ saved, save }: { saved: AiWorkspaceConversation[]; save: (next: AiWorkspaceConversation[]) => void }) {
  return (
    <AiWorkspace
      userName="Lena"
      conversations={saved}
      onConversationsChange={save}
      respond={async (message) => `You asked: ${message}`}
    />
  );
}
```
