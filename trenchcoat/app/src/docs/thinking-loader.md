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

`mark="pixels"` swaps the rays for a 5 × 5 grid of dots lit in a `pattern` – a diagonal wave, a dot driving a snake
path, a twinkle or an orbit round the edge – and adds the time the work has taken beside the label (0.2s, 12s, 1m 4s;
`hide-time` leaves it off). Give one fixed `label` instead of `phases` when the work is one thing ("Reading the audit
log"): it stays when the work ends, and the status says how it ended – "Done: Reading the audit log".

`state` says how the work stands – "working", "done" or "error", which turns the mark into a cross in the danger
colour. It's the preferred way; the older `done` boolean still works and means `state="done"`. `startedAt` sets where
the count starts (`started` is the same), and `now` lets the page drive the clock. This is what Pixel Loader did:
`<tc-pixel-loader>` is now this element with `mark="pixels"` and its own look.

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
3. **Cross** `.ui-tl__cross` – takes the spinner's place on an error
4. **Grid** `.ui-tl__grid` – with `mark="pixels"`, 25 `.ui-tl__dot`s in place of the spinner, settling into a check or a cross
5. **Label** `.ui-tl__text` – the current phase with a light sweeping over it, then the done label
6. **Time** `.ui-tl__time` – with `mark="pixels"`, the time the work has taken, unless `hide-time`

## Looks

Standard is a rounded capsule with a hairline border and a muted label. Clean is a white chip with a hairline
shadow, a slightly heavier label and a thin accent spinner. In both, `variant="plain"` drops the chip and keeps the
spinner and the label, and `size="sm"` makes everything smaller.

## Keyboard

Nothing to operate – the loader only reports.

## Screen readers

The element is a polite status region (`role="status"`, unless the page sets its own role). It announces the first
phase (“Thinking”) and then the done label (“Thought for 6s”) – not every phase on the way, so screen reader users
aren't interrupted every couple of seconds. With a fixed `label` it announces the label, then how it ended – “Done:
Reading the audit log” or “Failed: …” (`labels` renames the words). The ticking time is never announced. The mark,
the moving labels and the time are hidden from assistive technology.

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
  import "@adamstavely/trenchcoat/thinking-loader";
  import "@adamstavely/trenchcoat/tokens.css";

  const loader = document.querySelector("#loader");
  loader.phases = ["Thinking", "Searching the web", "Writing response"];
  loader.doneLabel = (s) => `Thought for ${s}s`;
  loader.addEventListener("tc-phase-change", (e) => console.log(e.detail.phase));
  // Later, when the answer starts streaming:
  setTimeout(() => (loader.state = "done"), 4200);
</script>

<!-- One fixed label, a grid of dots and the time it's taken -->
<tc-thinking-loader mark="pixels" pattern="orbit" label="Reading the audit log"></tc-thinking-loader>
```

```tsx
import { ThinkingLoader } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Working({ phase, done }: { phase: number; done: boolean }) {
  return <ThinkingLoader phases={["Thinking", "Searching the web", "Writing response"]} phase={phase} done={done} />;
}
```
