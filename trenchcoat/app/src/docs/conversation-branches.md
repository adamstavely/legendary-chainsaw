---
pattern: none
status: new
related: message-actions, answer-arena, chat-history
---

## Overview

A chat thread where editing a past message forks the conversation instead of overwriting it. People edit one of
their own messages in place and send it; the new version becomes a branch next to the old one, and the replies
below follow the branch they're looking at. Every message with siblings carries a “‹ 2 / 3 ›” switcher, so going
back to an earlier answer is one click. The app answers each new branch with its replies, and “Writing a reply…”
shows until they arrive.

## When to use

- AI chats where people refine a request and want to compare the answers each version got.
- Any thread where an earlier answer shouldn't be lost when someone tries a different question.
- Showing regenerated replies as versions of one message, together with the user's edits.

## When not to use

- Only the controls under one reply – copy, feedback, regenerate – use `message-actions`.
- Two models answering the same prompt side by side – use `answer-arena`.
- The list of a person's conversations – use `chat-history`.

## Anatomy

1. **Your message** `.ui-cvb__bubble` – one of your messages; Edit opens it in place
2. **Edit** `.ui-cvb__edit` – shows on hover or focus; turns the message into a field with Cancel and Send
3. **Switcher** `.ui-cvb__versions` – “‹ 2 / 3 ›” on every message with siblings
4. **Reply** `.ui-cvb__text` – the assistant's answer on the branch shown
5. **Reply actions** `.ui-cvb__actions` – the message-actions bar under each reply
6. **Caption** `.ui-cvb__caption` – how many messages and branches, and where you are

## Looks

Standard sets the thread on a white card in the gray tray, with the caption on the tray below it. Clean is one white
card with the caption as its last row, and draws the edit and arrow icons as 16 px glyphs. Both switch branches
and edit the same way.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between Edit, the switcher's arrows and each reply's actions |
| ← / → | On a switcher: the previous or next branch |
| Enter / Space | Presses the focused button – Edit opens the field with focus in it |
| Enter | In the field: sends the edit as a new branch |
| Shift Enter | In the field: a new line |
| Escape | In the field: cancels and returns focus to Edit |

When an arrow turns disabled at the first or last branch, focus moves to the other arrow.

## Screen readers

The host is a `region` named by `label` (“Conversation”). Each message is an `article` named “You” or “Assistant”
(`userName`, `assistantName`). A switcher is a group named “Edits of this message” or “Versions of this reply”; its
count reads “Branch 2 of 3” and its arrows are “Previous branch” and “Next branch”. The edit field is named “Edit your
message” and described by the note under it (“Sending starts branch 3 – the reply below stays in branch 2”). A polite
live region says what changed: “Branch 2 of 3 – 3 messages below”, “Branch 3 of 3 – your edit was sent”, “Reply
ready” and “Couldn't write a reply”.

## Content

- Leave `caption` unset unless you need your own words – the default sums up the thread (“4 messages · branch 2 of
  3”) and suggests editing when there are no forks yet.
- Keep `label` to what the conversation is: “Conversation”, or its title.
- When a reply fails, the thread says “Couldn't write a reply. Edit the message to try again.” – there is nothing
  else to write.

## Do

- Answer `tc-edit` with `respondWith(promise)` (or return the promise from `onEdit`) so “Writing a reply…” shows
  while the reply is on its way.
- Keep every branch in `messages`; the element picks the path to show from `selected`.
- Pass `renderContent` when replies hold Markdown or code, so they render as they do elsewhere in your chat.

## Don't

- Don't delete the old branch when a new one is made – being able to go back is the point.
- Don't set `editable="false"` where people expect to refine their prompts – without Edit, branches only come
  from your data.
- Don't change `selected` behind people's backs – they lose their place in the thread.

## Example

```html
<tc-conversation-branches id="thread" label="Release note"></tc-conversation-branches>

<script type="module">
  import "trenchcoat/conversation-branches";
  import "trenchcoat/tokens.css";

  const thread = document.querySelector("#thread");
  thread.messages = [
    { id: "u1", role: "user", text: "Write the release note for v2.4." },
    { id: "a1", role: "assistant", parentId: "u1", text: "v2.4 makes search up to 3× faster…" },
  ];
  thread.addEventListener("tc-edit", (e) => {
    const reply = fetch("/api/reply", { method: "POST", body: e.detail.text }).then((r) => r.json());
    e.detail.respondWith(reply.then((r) => [{ id: r.id, role: "assistant", text: r.text }]));
  });
</script>
```

```tsx
import { ConversationBranches, type BranchMessage } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const start: BranchMessage[] = [
  { id: "u1", role: "user", text: "Write the release note for v2.4." },
  { id: "a1", role: "assistant", parentId: "u1", text: "v2.4 makes search up to 3× faster…" },
];

export function Thread({ ask }: { ask: (text: string) => Promise<string> }) {
  return (
    <ConversationBranches
      defaultMessages={start}
      onEdit={({ message, text }) => ask(text).then((reply) => [{ id: `${message.id}-reply`, role: "assistant" as const, text: reply }])}
    />
  );
}
```
