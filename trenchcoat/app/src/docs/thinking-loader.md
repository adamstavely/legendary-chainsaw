---
pattern: none
status: react-twin
related: thinking-state, ai-answer, chat-composer
---

## Overview

A small pill that says the model is working on a reply. An eight-ray spinner turns while the label, with a light
sweeping over it, walks through phases – Thinking, Searching the web, Reading sources – and the pill glides to each
new width. When the work is done, the spinner turns into a check and the label settles on how long it took
(“Thought for 6s”). It tells people something is happening, and roughly what, without taking room from the
conversation.

## When to use

- The gap between sending a message and the first words of the answer.
- Inside a chat bubble or a card, where a full panel would be too much – use `variant="plain"` there.
- Driving the phases from your stream's events, so the label says what the model is really doing.

## When not to use

- Showing the sources searched and the reasoning steps as they happen – use `thinking-state`.
- The answer itself, with its sources and actions – use `ai-answer`.

## Anatomy

1. **Spinner** `.ui-tl__spinner` – eight rays turning while the model works
2. **Check** `.ui-tl__check` – takes the spinner's place once done
3. **Label** `.ui-tl__text` – the current phase with a light sweeping over it, then the done label

## Looks

Standard is a rounded capsule with a hairline border and a muted label. Clean is a white chip with a hairline
shadow, a slightly heavier label and a thin accent spinner. In both, `variant="plain"` drops the chip and keeps the
spinner and the label, and `size="sm"` makes everything smaller.

## Keyboard

Nothing to operate – the loader only reports.

## Screen readers

The element is a polite status region (`role="status"`, unless the page sets its own role). It announces the first
phase (“Thinking”) and then the done label (“Thought for 6s”) – not every phase on the way, so screen reader users
aren't interrupted every couple of seconds. The spinner and the moving labels are hidden from assistive technology.

## Content

- Write phases as short present-tense activities, sentence case, no full stop: “Searching the web”, “Reading 12
  sources”.
- Keep each phase under about four words – the pill grows to fit.
- Use the done label for what happened and how long it took: “Thought for 6s”, “Searched 12 sources”.
- Name only phases the model really goes through; set `phase` from the stream instead of a timer when you can.

## Do

- Set `done` as soon as the first part of the answer arrives.
- Pass `startedAt` when the work started before the loader appeared, so the done label counts the real time.
- Keep `loop` off unless the work can run long; even then it starts over at most twice and holds the last phase.

## Don't

- Don't show it next to a streaming answer that is already visible – the text is the progress.
- Don't put more than one loader on screen for the same piece of work.
- Don't use it for long jobs with steps people need to follow; show the steps.

## Example

```html
<tc-thinking-loader id="loader" interval="1400"></tc-thinking-loader>

<script type="module">
  import "trenchcoat/thinking-loader";
  import "trenchcoat/tokens.css";

  const loader = document.querySelector("#loader");
  loader.phases = ["Thinking", "Searching the web", "Writing response"];
  loader.doneLabel = (s) => `Thought for ${s}s`;
  loader.addEventListener("tc-phase-change", (e) => console.log(e.detail.phase));
  // Later, when the answer starts streaming:
  setTimeout(() => (loader.done = true), 4200);
</script>
```

```tsx
import { ThinkingLoader } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Working({ phase, done }: { phase: number; done: boolean }) {
  return <ThinkingLoader phases={["Thinking", "Searching the web", "Writing response"]} phase={phase} done={done} />;
}
```
