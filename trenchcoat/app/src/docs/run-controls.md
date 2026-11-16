---
pattern: form
status: new
related: chat-composer, agent-steering, message-actions, context-window
---

## Overview

Every control a running agent needs, in one composer. While it answers there's **Stop**, and the field either
**steers** the answer in progress or **queues** what to ask next – queued asks wait above the field as numbered chips
and go out in order. After a stop, or when the connection drops, it says so with how much had arrived, and offers
**Resume** (carry on from where the answer stopped), **Retry** and **Dismiss**. Under the field sit **Chat** or
**Act**, what the agent may do without asking, and how full the context is ("62% of context").

Every button is an event: the app streams, stops and resumes, and owns the state.

## Using it in an app

- **Drive `state`** from your stream: `streaming` while tokens arrive, `stopped` after Stop, `disconnected` when the
  connection drops, `done` at the end. The buttons propose a state with `tc-state-change`; prevent it (or control it
  from React) to keep the stream the source of truth.
- **Keep `partial`** at the number of characters received. Stop reports it, and Resume asks you to carry on from it –
  send the partial answer back with the request so the model continues instead of starting over.
- **Steer and queue.** `tc-steer` carries a note for the answer in progress; queued asks live in `queue`, and it's the
  app that sends the next one when an answer ends.
- **Show the context** as `context` (0–1); it turns amber from 75% and red from 90%.

## When to use

- Chat and agent products where answers take a while and people want to stop, redirect or line up the next ask.
- Any streamed answer that should survive a stop or a dropped connection and carry on from where it was.

## When not to use

- A plain prompt box with a model picker, attachments and voice – use `chat-composer`.
- Steering a multi-step plan, with the note landing in a step – use `agent-steering`.
- Actions on an answer that's finished (copy, regenerate, rate) – use `message-actions`.

## Anatomy

1. **Status** `.ui-runc__status` – "Answering…" with how many are queued, or "Stopped at 1,240 characters" with Resume, Retry and Dismiss
2. **Queue** `.ui-runc__queue` – one `.ui-runc__chip` per queued ask, numbered, each with a remove button `.ui-runc__chip-x`
3. **Field** `.ui-runc__field` – the text to send, steer with or queue
4. **Mode** `.ui-runc__modes` – Chat or Act, a radio group
5. **Permissions** `.ui-runc__select` – Ask before acting, Auto-edit, Full access
6. **More** `.ui-runc__more` – narrow only: mode and permissions in a menu
7. **Context** `.ui-runc__context` – a ring and "62% of context"
8. **Main button** `.ui-runc__round` – Send, or Stop while it answers

## Looks

Standard puts the composer card on the gray tray; Clean is one white card. `heading` adds a card header. Under 440 px
the mode and permissions fold into **More** and the context shows its percentage only.

## Keyboard

| Key | What it does |
|---|---|
| Enter | Sends; while it answers, steers |
| Shift+Enter | A new line |
| Escape | In the field while it answers: stops it |
| ← / → | Chat or Act, in the mode group |
| Escape | In the More menu: closes it, back to More |

## Screen readers

The field is labelled "Message"; the main button is named Send or Stop. Chat and Act are a radio group named "Mode";
permissions are a select named "Permissions". The context is a meter named "62% of context". Queued asks are an
ordered list named "1 queued", each remove button "Remove Then shorten the budget notes". A polite status region
announces "Answering…", "Stopped at 1,240 characters", "Connection lost at 1,240 characters" and "Done".

## Content

- Keep the placeholders short; the defaults are "Ask anything" and, while it answers, "Steer it, or queue what's next".
- Queued asks show as the person wrote them; they're trimmed, not rewritten.
- Rename the permission levels with `labels` to match your product ("Ask before acting", "Auto-edit", "Full access").

## Do

- Keep `partial` current, so Resume can carry on from the right place.
- Send queued asks in order, one per finished answer, and remove each from `queue` as it goes out.

## Don't

- Don't clear the answer on Stop – Resume needs it.
- Don't hide Retry after a dropped connection; a resume isn't always possible.

## Example

```html
<tc-run-controls id="run" state="streaming" context="0.62" partial="1240"></tc-run-controls>

<script type="module">
  import "@adamstavely/trenchcoat/run-controls";
  import "@adamstavely/trenchcoat/tokens.css";

  const run = document.querySelector("#run");
  run.queue = ["Then shorten the budget notes"];
  run.addEventListener("tc-stop", (e) => console.log("stopped at", e.detail.partial));
  run.addEventListener("tc-resume", (e) => console.log("resume from", e.detail.from));
  run.addEventListener("tc-steer", (e) => console.log("steer", e.detail.note));
</script>
```

```tsx
import { useState } from "react";
import { RunControls, type RunControlsState } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Composer({ partial, stream }: { partial: number; stream: { stop: () => void; resume: (from: number) => void; send: (text: string) => void } }) {
  const [state, setState] = useState<RunControlsState>("idle");
  return (
    <RunControls
      state={state}
      onStateChange={setState}
      partial={partial}
      context={0.62}
      onSend={(text) => stream.send(text)}
      onStop={() => stream.stop()}
      onResume={(from) => stream.resume(from)}
    />
  );
}
```
