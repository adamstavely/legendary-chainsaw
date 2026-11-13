---
pattern: toolbar
status: new
related: verification-queue, message-actions, guardrail-notice, feedback-rubric
---

## Overview

Reported replies, judged one at a time. Each item says why it's here – a person's report, or an automatic flag with the
classifier's score in a word and a number – the policy it may break, and the conversation around it with the reported
reply marked. There's one decision per item: Keep (no violation), Remove reply, Restrict user or Escalate. Removing and
restricting need a note, so the record says why. After a decision the next waiting item opens, progress reads "Item 2 of
6 · 3 decided", the header counts what's waiting, and Undo takes the last decision back. Every decision has a single-key
shortcut, shown on its button.

## When to use

- A trust and safety or admin queue for replies people reported with Report on a message.
- Reviewing replies an automatic classifier flagged, before anyone acts on them.
- Any queue where each item gets exactly one of a few decisions, quickly, from the keyboard.

## When not to use

- Reporting a reply in the first place – use `message-actions` with `reportable`.
- Checking claims against their sources before an export – use `verification-queue`.
- Telling someone a policy blocked or changed content – use `guardrail-notice`.
- Grading answers for quality, not policy – use `feedback-rubric`.

## Anatomy

1. **Waiting** `.ui-mdq__waiting` – how many items have no decision yet
2. **Progress** `.ui-mdq__progress` – where you are and how many are decided
3. **Reason** `.ui-mdq__reason` – who reported it or which classifier flagged it, the reason and when
4. **Policy** `.ui-mdq__policy` – the policy it may break, with a quoted excerpt
5. **Conversation** `.ui-mdq__turns` – the turns around it, the reported reply marked
6. **Verdict** `.ui-mdq__verdict` – the decision already made, if any
7. **Note** `.ui-mdq__note` – needed to remove or restrict
8. **Decisions** `.ui-mdq__decisions` – Keep, Remove reply, Restrict user, Escalate, each with its key
9. **Navigation** `.ui-mdq__nav` – Previous, Next and Undo

## Looks

Standard is a white card on a gray tray with the header on the tray. Clean is one white card with the header as its first
row. The conversation sits on a quiet panel; the reported reply is outlined in the danger colour and labelled in both.

## Keyboard

The keys work anywhere in the queue except in the note. Buttons work with Tab and Enter as usual.

| Key | What it does |
|---|---|
| K | Keep – no violation |
| R | Remove the reply (asks for a note first if there's none) |
| U | Restrict the user (asks for a note first if there's none) |
| E | Escalate |
| N / P | The next or previous item |
| Z | Undo the last decision |

Set `no-shortcuts` to turn the single keys off.

## Screen readers

Each item is an `article` named by its reason. The conversation is a list named "Conversation", and the reported reply is
labelled "Reported reply" in words. The four decisions are buttons in a group named "Decision", each with
`aria-keyshortcuts` and `aria-pressed` on the decision already made. A missing note is said aloud and the note field is
marked invalid and described by the error. Decisions and moves are confirmed in a polite status message: "Reply removed.
Item 3 of 6: Off-topic", "All 6 decided", "Undone: kept. Item 1 is waiting again".

## Content

- Write `reason` as the report's category, short: "Unsafe advice", "Private data", "Harassment".
- Give the classifier a name people recognise: "Personal data detector".
- Include enough turns for the reply to make sense – usually the question before it.
- Quote the policy's own words in `excerpt`, so the decision is made against the rule, not memory.

## Do

- Handle `tc-decide` and act on it on your server; call `preventDefault()` if the action fails, so nothing is recorded.
- Keep `decisions` from your server, so a reviewer who comes back sees what's been done.
- Use Escalate for anything that needs a specialist, rather than guessing.

## Don't

- Don't show the reporter's identity to the person reported elsewhere – this view is for moderators.
- Don't put unrelated reviews in the same queue; decisions should mean the same thing for every item.
- Don't remove the note requirement – it's the record of why.

## Example

```html
<tc-moderation-queue id="queue" description="Policy questions, this week"></tc-moderation-queue>

<script type="module">
  import "@adamstavely/trenchcoat/moderation-queue";
  import "@adamstavely/trenchcoat/tokens.css";

  const queue = document.querySelector("#queue");
  queue.items = [
    {
      id: "r1",
      reason: "Unsafe advice",
      reportedBy: "Tom Becker",
      user: "Jordan Ellis",
      policy: { name: "Financial advice policy" },
      turns: [
        { id: "t1", from: "user", author: "Jordan Ellis", text: "Can I claim my home office on my tax return?" },
        { id: "t2", from: "assistant", text: "Yes – claim the full rent; nobody checks.", reported: true },
      ],
    },
  ];
  queue.addEventListener("tc-decide", (e) => console.log(e.detail.decision, e.detail.note));
</script>
```

```tsx
import { useState } from "react";
import { ModerationQueue, type ModerationItem, type ModerationVerdict } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Reports({ items }: { items: ModerationItem[] }) {
  const [decisions, setDecisions] = useState<Record<string, ModerationVerdict>>({});
  return (
    <ModerationQueue
      title="Reported replies"
      items={items}
      decisions={decisions}
      onDecisionsChange={setDecisions}
      onDecide={(id, decision, note) => void fetch(`/api/reports/${id}`, { method: "POST", body: JSON.stringify({ decision, note }) })}
    />
  );
}
```
