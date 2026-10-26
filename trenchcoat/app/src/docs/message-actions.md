---
pattern: button
status: stable
related: ai-answer, conversation-branches, reaction-bar, chat-composer
---

## Overview

The small bar under an AI chat message: Copy, Regenerate, thumbs up and down, and Read aloud. Each action answers in
place – Copy turns into a check, Regenerate spins and unfolds a “‹ 2 / 3 ›” switcher once there's more than one
version, thumbs down opens a short “What went wrong?” row with reasons, Read aloud becomes a small equalizer while it
plays. The bar stays quiet until the message is hovered or focused, so a long conversation doesn't fill with icons.
`tc-message-text` (React: `MessageText`) crossfades the message itself when the version changes.

## When to use

- Under every assistant message in a chat, or under the latest one.
- When people should be able to retry an answer and move between its versions.
- Collecting quick feedback on answers, with a reason when they're bad.

## When not to use

- Editing a past message and switching between the forks that follow – use `conversation-branches`.
- Social reactions with counts – use `reaction-bar`.
- Writing and sending messages – use `chat-composer`.

## Anatomy

1. **Copy** `.ui-ma__btn--copy` – copies `text`; the icon turns into a check
2. **Regenerate** `.ui-ma__regen` – spins once, or until a new version arrives
3. **Version switcher** `.ui-ma__versions` – “‹ 2 / 3 ›”, next to Regenerate from the second version on
4. **Bad response** `.ui-ma__btn--down` – thumbs down, beside thumbs up; opens the “What went wrong?” row below
5. **Read aloud** `.ui-ma__btn--speak` – becomes a small equalizer while it plays

## Looks

Standard uses 30 px icon buttons with full-size line icons, and the feedback row is a small card with gray reason
chips. Clean uses ghost icon buttons with thin or solid 16 px glyphs; a pressed action takes the selected-tab look,
the reasons are tab-style buttons and Send is the dark chip. In both, the icons sit a step lighter until the
message is hovered.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the actions, the version switcher and the feedback row |
| Enter / Space | Presses the focused action, reason or Send |
| Escape | In the feedback row: closes it and returns focus to Bad response; elsewhere in the bar: hides the tooltip |
| Enter (in the “Other” field) | Sends the feedback |

## Screen readers

The bar is a group named “Message actions” (`label`). The buttons are named for what they do: “Copy message” (then
“Copied”), “Regenerate response” (`aria-busy` while a new version is written), “Good response” and “Bad response”
(toggle buttons with `aria-pressed`; Bad response also has `aria-expanded` for the feedback row), and “Read aloud” or
“Stop reading”. The switcher is a group named “Versions” with “Previous version”, “Version 2 of 3” and “Next
version”. The feedback row is a group named “What went wrong?”, with toggle buttons for the reasons and “Close
feedback”. A polite live region says what happened: “Copied”, “Regenerating”, “Version 3 of 3”, “Marked as bad
response. Tell us what went wrong below”, “Thanks for the feedback”, “Reading aloud”, “Finished reading” – and the
failures, such as “Couldn't copy” or “Couldn't regenerate”.

## Content

- Keep `reasons` to three or four short phrases about the answer, not the person: “Not accurate”, “Too long”.
- Keep “Other” last – it opens a field for people's own words.
- Name the bar for its message when there are several on screen: `label="Actions for answer 3"`.

## Do

- Put `data-ui-message` on the message's wrapper so the bar lights up when the message is hovered.
- Return a promise from `onRegenerate` and `onFeedback` so the bar can show progress, success and failure.
- Pair the bar with `tc-message-text` so the message crossfades when people switch versions.

## Don't

- Don't show actions you haven't wired up – leave them out of `actions`.
- Don't rely on the simulated Read aloud in production: listen for `tc-speak` (React: `onSpeak`) or let the browser
  read `text`; set `demo` only in galleries and prototypes.
- Don't ask for a reason after every thumbs up – the bar only asks after thumbs down.

## Example

```html
<div data-ui-message>
  <tc-message-text id="answer"></tc-message-text>
  <tc-message-actions id="actions"></tc-message-actions>
</div>

<script type="module">
  import "trenchcoat/message-actions";
  import "trenchcoat/tokens.css";

  const versions = ["Wrap the filter in useMemo.", "Memoize the list and debounce the input."];
  const answer = document.querySelector("#answer");
  const actions = document.querySelector("#actions");
  answer.content = versions[1];
  actions.text = versions[1];
  actions.versions = versions;
  actions.onFeedback = (kind, reason) => fetch("/api/feedback", { method: "POST", body: JSON.stringify({ kind, reason }) });
  actions.addEventListener("tc-version-change", (e) => {
    answer.version = e.detail.version;
    answer.content = actions.text = versions[e.detail.version];
  });
</script>
```

```tsx
import { useState } from "react";
import { MessageActions, MessageText } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Answer({ versions, onRegenerate }: { versions: string[]; onRegenerate: () => Promise<void> }) {
  const [version, setVersion] = useState(versions.length - 1);
  return (
    <div data-ui-message="">
      <MessageText version={version}>
        <p>{versions[version]}</p>
      </MessageText>
      <MessageActions
        text={versions[version]}
        versions={versions}
        version={version}
        onVersionChange={setVersion}
        onRegenerate={onRegenerate}
      />
    </div>
  );
}
```
