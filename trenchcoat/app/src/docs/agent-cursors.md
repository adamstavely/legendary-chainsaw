---
pattern: none
status: stable
related: live-view, comment-thread, inline-diff, agent-lanes
---

## Overview

A document that agents edit alongside each other, shown like a multiplayer editor. Each agent has a named pointer,
so people can see where every agent is and what it is doing – selecting a passage, typing a suggestion, resizing an
image, writing a comment. Changes arrive as suggestions in the agent's colour, for a person to accept or reject,
and the faces in the header show who is in the document and let people follow one agent. The element draws what
you give it: you move the agents by updating `cursors`, `blocks`, `suggestions` and `comments`.

## When to use

- Showing several agents drafting or reviewing one document, where people need to see who changed what.
- Reviewing agent edits as suggestions in context, rather than as a separate list of changes.
- Product tours and empty states that show agents at work in a document.

## When not to use

- Watching one agent drive a browser or a desktop – use `live-view`.
- Comparing two versions of a text – use `inline-diff`.
- A discussion about a piece of work, without the document itself – use `comment-thread`.
- Following what several agents are doing over time, without the shared document – use `agent-lanes`.

## Anatomy

1. **Header** `.ui-agc__bar` – the shared card header: a boxed icon and the document's title, with the agents' faces, a count, the total cost and Accept all on its right
2. **Face** `.ui-agc__face` – one agent; press it to follow that agent
3. **Page** `.ui-agc__sheet` – the document, block by block
4. **Pointer** `.ui-agc__flag` – an agent's name flag, with what it is doing; its arrow and caret sit beside it
5. **Suggestion** `.ui-agc__ins` – new text underlined in the agent's colour; removed text is struck through
6. **Comment pin** `.ui-agc__pin-box` – a comment pinned to a block; it opens to read, reply and resolve

## Looks

Standard sets the page on a paper sheet inside the gray tray, with the header above it. Clean has no tray: one
white page with the header inside it, under a hairline, and slightly smaller faces. Pointers, suggestions and
comments behave the same in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the faces, Accept all, the suggestions and the comment pins |
| Enter / Space | On a suggestion: opens its window and moves focus into it. On a face: follows that agent, or stops |
| Escape | Closes the open suggestion window or comment and returns focus to it; elsewhere, hides the faces' tips |
| Tab (in a suggestion's window) | Past the last button, focus goes on from the suggestion in the text; Shift+Tab before the first goes back to it |
| Enter (in a reply field) | Sends the reply |
| ← / → | Moves between the tabs above the page; Home and End go to the first and last |

## Screen readers

The faces are toggle buttons in a group labelled “Agents in this document”, named with what each agent is doing
(“Follow Ada – Checking the numbers”), with `aria-pressed` for the one being followed. Each suggestion is a button
named for its change (“Ada suggests adding: every team”, “Ada suggests removing: …”) that opens a dialog labelled
“Suggestion from Ada”. Comment pins are buttons named with the comment (“Comment from Ada: …”) and say whether they
are open with `aria-expanded`; a closed comment is inert. The pointers and selections are hidden from assistive
technology – a polite live region says instead when a suggestion arrives (“Ada suggests a change: …”) or an agent
starts a comment (“Ada is writing a comment”). Tabs, when set, follow the tabs pattern in a tablist labelled
“Views”.

## Content

- Name agents the way the product does elsewhere, and keep the names short – they sit on a small flag.
- Write `doing` as a present-tense phrase of two to four words: “Checking the numbers”, “Fixing the code”.
- Give each suggestion a `note` that says why, in one sentence – it is what people read before accepting.
- Give images `alt` text; while `loading`, the image is announced as “Image loading”.

## Do

- Give each agent its own `color`, so pointers, selections and suggestions can be told apart.
- Turn on Accept and Reject (`can-accept`, `can-reject`) whenever suggestions need a decision.
- Set `height` for long documents – the page fades out towards the bottom instead of growing.

## Don't

- Don't move pointers faster than people can follow – update `cursors` at reading pace.
- Don't write agent changes straight into `blocks` when a person should approve them – send them as `suggestions`.
- Don't use more than about five agents in one document; the faces and flags crowd the page.

## Example

```html
<tc-agent-cursors id="brief" heading="Launch brief" can-accept can-reject></tc-agent-cursors>

<script type="module">
  import "trenchcoat/agent-cursors";
  import "trenchcoat/tokens.css";

  const doc = document.querySelector("#brief");
  doc.agents = [{ id: "ada", name: "Ada", color: "#7c3aed" }];
  doc.blocks = [
    { id: "t", kind: "title", text: "Orbit 2.0 launch brief" },
    { id: "p1", text: "Orbit 2.0 ships on March 12 with offline sync." },
  ];
  doc.suggestions = [{ id: "s1", agent: "ada", block: "p1", at: 19, remove: 8, insert: "in March", note: "The date isn't confirmed" }];
  doc.cursors = { ada: { block: "p1", at: 19, doing: "Checking the dates" } };
  doc.addEventListener("tc-accept", (e) => console.log("accepted", e.detail.id));
</script>
```

```tsx
import { useState } from "react";
import { AgentCursors, acceptSuggestion, type DocBlock, type DocSuggestion } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const agents = [{ id: "ada", name: "Ada", color: "#7c3aed" }];

export function Brief() {
  const [doc, setDoc] = useState<{ blocks: DocBlock[]; suggestions: DocSuggestion[] }>({
    blocks: [{ id: "p1", text: "Orbit 2.0 ships on March 12 with offline sync." }],
    suggestions: [{ id: "s1", agent: "ada", block: "p1", at: 19, remove: 8, insert: "in March" }],
  });
  return (
    <AgentCursors
      title="Launch brief"
      agents={agents}
      blocks={doc.blocks}
      suggestions={doc.suggestions}
      cursors={{ ada: { block: "p1", at: 19, doing: "Checking the dates" } }}
      onAccept={(s) => setDoc((d) => acceptSuggestion(d.blocks, d.suggestions, s.id))}
      onReject={(s) => setDoc((d) => ({ ...d, suggestions: d.suggestions.filter((x) => x.id !== s.id) }))}
    />
  );
}
```
