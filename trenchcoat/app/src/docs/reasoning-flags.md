---
pattern: disclosure
status: new
related: claim-answer, capability-notice, confidence-brief, reliance-gauge
---

## Overview

A model's answer with its weak reasoning pointed out where it happens. The app runs its own check and passes the
spans it found; each gets a subtle dotted underline and a small flag after it. Hover the passage or focus the flag
and a card names the pattern – circular reasoning, a hedge followed by a confident conclusion, a self-contradiction,
more certainty than the evidence supports, or a kind of your own – and explains in plain words why this passage was
flagged. A summary chip says how many there are and leads to the first. Flags are advisory: the card says they were
detected automatically, and can offer "Ask the model to reconsider".

## When to use

- Showing an answer that a reasoning check has looked at, so readers know which sentences to read twice.
- Reviewing model output before it's shared, where a reviewer can send a flagged passage back to the model.
- Any check that finds spans in text and needs to explain each one briefly in place.

## When not to use

- Saying where each claim in an answer came from – use `claim-answer`.
- A warning that a whole request is outside what the system has been proven on – use `capability-notice`.
- Summarising how far to trust an answer overall – use `confidence-brief`.

## Anatomy

1. **Summary** `.ui-rfl__chip` – how many flags there are; leads to the first
2. **Flagged span** `.ui-rfl__span` – the passage, with a dotted underline
3. **Marker** `.ui-rfl__marker` – the small flag after the passage; focus or hover it to explain
4. **Card** `.ui-rfl__pop` – the pattern's name, the explanation, the advisory note and Reconsider

## Looks

Both looks keep the flags quiet: a dotted amber underline that fills in only while its card is open. Standard
gives each marker a small filled badge and the summary chip a tinted fill; Clean draws the marker as a thin
outlined flag, the chip with a hairline, and the answer's text a step quieter. It's inline, so neither look adds a
header or tray.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the summary chip, then to each marker in reading order; focusing a marker opens its card. With "Ask the model to reconsider" on and a card open, Tab moves into the card, and from its button on to the next marker |
| Shift + Tab | From the card's button, back to its marker |
| Enter / Space | On the chip: focuses the first marker and opens its card. On a marker: opens its card (and moves into it when it has a button) |
| Escape | Closes the card; focus goes back to its marker |

## Screen readers

The summary chip is a button named by its text ("4 reasoning flags"). Each marker is a button named "Reasoning
flag: Circular reasoning" (the kind's label), with `aria-expanded`; while its card is open it's described by the
explanation. Without a reconsider button the card is a `tooltip`; with it, a non-modal `dialog` (and the marker has
`aria-haspopup="dialog"`). Either is named by the kind's label. Asking to reconsider is announced politely – "Asked
the model to reconsider: hedged, then certain" – and the button then reads "Asked to reconsider".

## Content

- `explanation` is about this passage: what it says and why that's weak ("It admits the saving is unknown, then
  promises a finish time anyway"). The card adds the general description of the pattern below it.
- Rename the built-in kinds, or add your own, with `kinds` – `{ "unsourced-figure": { label: "Unsourced figure",
  description: "…" } }`. A kind with no label is shown with its key in words.
- Flag the clause that carries the weak step, not the whole paragraph – short spans keep the answer readable.
- Keep `note` honest about how the flags were found; the default is "Detected automatically – it may be wrong."

## Do

- Pass `onReconsider` (or set `reconsider` and listen for `tc-reconsider`) when the app can send the passage back
  to the model, and replace the text and flags when the revision arrives.
- Give flags stable `id`s, so an open card and an "asked" state follow them when the list changes.
- Use the same words for a kind everywhere in the product.

## Don't

- Don't use it as a verdict on the answer – it marks places to check, not errors.
- Don't flag every sentence; when most of an answer is flagged, say so once with `capability-notice` instead.
- Don't use domain jargon in the labels – people reading the answer may not know it.

## Example

```html
<tc-reasoning-flags id="answer" reconsider></tc-reasoning-flags>

<script type="module">
  import "trenchcoat/reasoning-flags";
  import "trenchcoat/tokens.css";

  const answer = document.querySelector("#answer");
  answer.text = "It's hard to say how much time it saves, but it will certainly finish before 6 a.m.";
  answer.flags = [{ id: "f1", start: 41, end: 83, kind: "hedge-then-certain", explanation: "It admits the saving is unknown, then promises a finish time anyway." }];
  answer.addEventListener("tc-reconsider", (e) => console.log("send back", e.detail.flag));
</script>
```

```tsx
import { ReasoningFlags, type ReasoningFlag } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const text = "It's hard to say how much time it saves, but it will certainly finish before 6 a.m.";
const flags: ReasoningFlag[] = [{ id: "f1", start: 41, end: 83, kind: "hedge-then-certain", explanation: "It admits the saving is unknown, then promises a finish time anyway." }];

export function Answer() {
  return <ReasoningFlags text={text} flags={flags} onReconsider={(flag) => console.log("send back", flag.id)} />;
}
```
