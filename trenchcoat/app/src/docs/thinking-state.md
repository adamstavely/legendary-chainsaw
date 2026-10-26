---
pattern: disclosure
status: react-twin
related: thinking-loader, ai-answer, cited-answer, agent-plan
---

## Overview

The panel an AI chat shows while it works on an answer. A header says “Thinking” with a live timer, and below it
the steps appear one after another – what it's doing, and the searches it ran with their sources as small chips
people can open. When it's done, a check ends the list and the header turns into “Worked for 9s”; the header also
folds the steps away. It shows people that something is happening and what it's based on, so a long wait reads
as work rather than a stall.

## When to use

- Answers that take more than a few seconds and go through visible stages – reading, searching, comparing.
- Research or retrieval answers, where the sources searched are part of why people trust the result.
- Streaming the agent's real progress: set `progress` and `done` from your stream events.

## When not to use

- A short wait with nothing to report – use `thinking-loader`.
- The answer itself, with its sources and follow-ups – use `ai-answer`, or `cited-answer` when each sentence links
  to its source.
- A plan people should review or edit before the agent runs it – use `agent-plan`.

## Anatomy

1. **Header** `.ui-think__head` – “Thinking” and the timer, then “Worked for …”; folds the steps
2. **Step** `.ui-think__item` – one thing it did, the current one shimmering
3. **Sources** `.ui-think__sources` – the pages a search found, as chips that open them
4. **More** `.ui-think__more` – “+N more”, showing the rest of a search's sources

## Looks

Standard has no card: a chevron before the title, and the steps below it as an open list. Clean sits in one white
card with hairline shadows, with a 3×3 pixel mark that twinkles while it thinks in place of the chevron (which
moves to the end of the header), and shows the first step from the start instead of after a pause. In both, a thin
line joins the steps.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the header, then each source link and “+N more” |
| Enter / Space | On the header, folds or unfolds the steps; on “+N more”, shows or hides the extra sources |
| Enter | On a source, opens it in a new tab |
| Escape | Hides the tooltip of the source under the pointer or focus |

## Screen readers

The header is a button with `aria-expanded` that controls the steps; its name is “Thinking” while it works (the
timer is hidden) and “Worked for 9s” after. The steps are an ordered list – folded, they're `inert` and skipped.
New steps aren't announced one by one; when it finishes, a status message says the done label and the time:
“Ready to answer. Worked for 9s”. Source chips with an `href` are links; their tooltips are hidden from screen
readers. “+N more” is a button with `aria-expanded`.

## Content

- Write steps as what's happening, in the present participle or as a short noun phrase: “Comparing yearly costs”,
  “Checking available tax credits”.
- Give searches both forms: `activeLabel` “Searching ‘…’” while it runs, `label` “Searched ‘…’” after.
- Label sources with the site's domain (“energy.gov”); put the full address in `tooltip` if it matters.
- Set `doneLabel` to what comes next – “Ready to answer” – rather than the default “Finished thinking” when the
  answer follows.

## Do

- Drive it from real events: set `progress` as steps arrive and `done` when the answer starts.
- Show three to six steps; fold long lists of sources into `moreSources`.
- Pass `startedAt` when the work began before the panel was shown, so the timer is honest.

## Don't

- Don't invent steps the model isn't taking – the panel should reflect real work.
- Don't leave `loop` on outside demos; it replays the same run.
- Don't keep the panel open next to the finished answer if it pushes the answer down – let people fold it.

## Example

```html
<tc-thinking-state id="thinking" done-label="Ready to answer"></tc-thinking-state>

<script type="module">
  import "trenchcoat/thinking-state";
  import "trenchcoat/tokens.css";

  const panel = document.querySelector("#thinking");
  panel.steps = [
    { kind: "step", label: "Understanding the question" },
    {
      kind: "search",
      label: "Searched “heat pump running cost”",
      activeLabel: "Searching “heat pump running cost”",
      sources: [{ label: "energy.gov", href: "https://www.energy.gov" }],
    },
    { kind: "step", label: "Comparing yearly costs" },
  ];
  panel.progress = 1; // from your stream: one step so far
  panel.addEventListener("tc-done", (e) => console.log(`Worked for ${e.detail.seconds}s`));
</script>
```

```tsx
import { ThinkingState, type ThinkingStep } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const steps: ThinkingStep[] = [
  { kind: "step", label: "Understanding the question" },
  {
    kind: "search",
    label: "Searched “heat pump running cost”",
    activeLabel: "Searching “heat pump running cost”",
    sources: [{ label: "energy.gov", href: "https://www.energy.gov" }],
  },
  { kind: "step", label: "Comparing yearly costs" },
];

export function Working({ progress, done }: { progress: number; done: boolean }) {
  return <ThinkingState steps={steps} progress={progress} done={done} doneLabel="Ready to answer" />;
}
```
