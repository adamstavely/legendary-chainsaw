---
pattern: none
status: new
related: tool-call-card, chat-composer, eval-scorecard, review-queue
---

## Overview

A small panel for trying an agent while you edit it. A badge says which version answers – "Testing draft v14", or
the live one – and the conversation runs in a log: your messages, the agent's replies, and the tools it called
folded into one row each. Test inputs such as the person's region or plan sit in a Variables strip and go with every
message. When a reply is worth keeping, "Save as test case" hands it to the page with the message that asked for it,
so a good or bad answer becomes an eval case in one click. Reset starts the conversation over.

The page does the answering: Send fires `tc-send` with the text and the variables, and the page appends the turns –
yours, then the agent's, streamed – to `turns`.

## When to use

- Beside an agent's instructions, tools or model settings, to try a change before publishing it.
- Comparing the draft with the live version by switching `target`.
- Turning real exchanges into test cases while you're exploring.

## When not to use

- The conversation people have with a published agent – use `chat-composer` and a full chat thread.
- Reading the results of many test cases – use `eval-scorecard`.
- Grading outputs that already happened – use `review-queue`.
- One tool call on its own – use `tool-call-card`.

## Anatomy

1. **Badge** `.ui-trp__badge` – which version answers, in the header
2. **Variables** `.ui-trp__vars` – a disclosure with a name and value field per test input; folded, the inputs show as chips
3. **Log** `.ui-trp__log` – the conversation, newest at the bottom
4. **Turn** `.ui-trp__turn` – who said it, the agent's tool calls (`tc-tool-call-card`), the text, and an error when it failed
5. **Save** `.ui-trp__save` – "Save as test case" under a finished reply; "Saved as a test case" afterwards
6. **Composer** `.ui-trp__compose` – the message field, Reset conversation and Send

## Looks

Standard puts the heading, the agent's name and the badge on a gray tray with the panel on a white card inside it.
Clean is one white card with hairline dividers. The draft badge is amber and the live one green, and both say which in
words. The log's height is `--tc-trp-log-h` (320 px), which a page can override on `[data-ui="trp"]`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Variables, the log (it scrolls with the arrow keys), each tool call and Save, the field, Reset and Send |
| Enter | In the field, sends the message |
| Shift + Enter | In the field, starts a new line |
| Enter / Space | Presses the focused button, or opens a tool call |

## Screen readers

The panel is a `group` named by the heading. The conversation is a `log` named "Test conversation", with
`aria-busy` while a reply streams; each turn starts with who said it ("You", "Agent"). When a reply finishes, a status
region says "Agent replied" once – not every streamed word – or that it failed. Send stays focusable while a reply is
on its way, with `aria-disabled` and the description "Waiting for the reply". The Variables button is a disclosure with
`aria-expanded`; each name and value field is labelled ("Name 2", "Value of region"), and each Remove button says
what it removes. Saving and removing are announced.

## Content

- Name the version the way your editor does – "v14", "Draft 3" – so the badge matches what people see elsewhere.
- Keep variable names short and code-like (`region`, `plan`); the values are what a real request would carry.
- Give each tool call a `summary` – "Travel policy · 3 passages" – so the folded row says what it found.

## Do

- Append the person's turn as soon as `tc-send` fires, then stream the reply into a second turn with `streaming: true`.
- Set `error` on a reply that failed, so it can't be saved as a test case by mistake.
- Keep `saved` when the page re-renders, so saved replies stay marked.

## Don't

- Don't send test conversations to the live agent's analytics or memory – this panel is for trying things.
- Don't hide which version answers; a test against the wrong version wastes the reviewer's time.
- Don't save a reply without the message that asked for it – the case needs both.

## Example

```html
<tc-test-run-panel id="tester" agent="Policy Q&A" version="v14"></tc-test-run-panel>

<script type="module">
  import "@adamstavely/trenchcoat/test-run-panel";
  import "@adamstavely/trenchcoat/tokens.css";

  const tester = document.querySelector("#tester");
  tester.variables = [{ key: "region", value: "EU" }];
  tester.turns = [
    { id: "u1", role: "user", text: "Can I claim a taxi from the airport?" },
    { id: "a1", role: "agent", text: "Yes, after 21:00 – section 4.2.", tools: [{ id: "t1", name: "search_policy", status: "success", duration: 640 }] },
  ];
  tester.addEventListener("tc-send", (e) => {
    const n = tester.turns.length;
    tester.turns = [...tester.turns, { id: `u${n}`, role: "user", text: e.detail.text }, { id: `a${n}`, role: "agent", text: "Let me check the policy…" }];
  });
  tester.addEventListener("tc-save-case", (e) => console.log("Save", e.detail.input, e.detail.turn.text));
</script>
```

```tsx
import { useState } from "react";
import { TestRunPanel, type TestRunTurn } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function TryDraft({ ask, saveCase }: { ask: (text: string) => Promise<string>; saveCase: (input: string, output: string) => void }) {
  const [turns, setTurns] = useState<TestRunTurn[]>([]);
  return (
    <TestRunPanel
      agent="Policy Q&A"
      version="v14"
      turns={turns}
      onTurnsChange={setTurns}
      onSend={(text) => {
        const id = String(turns.length);
        setTurns((t) => [...t, { id: `u${id}`, role: "user", text }, { id: `a${id}`, role: "agent", text: "", streaming: true }]);
        void ask(text).then((reply) => setTurns((t) => t.map((x) => (x.id === `a${id}` ? { ...x, text: reply, streaming: false } : x))));
      }}
      onSaveCase={({ input, turn }) => saveCase(input, turn.text)}
    />
  );
}
```
