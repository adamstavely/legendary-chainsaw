---
pattern: list
status: new
related: file-summary, change-summary, confidence-brief, handoff-brief
---

## Overview

A one-minute digest: a pile of information – a week of updates, a long thread, a stack of documents – summarised around
what the reader needs, not the order it came in. Four quiet panels say what matters, what you should do, what changed
and what's safe to ignore, and the header says how long it takes to read, worked out from the words shown. The things
to do can be ticked off, and any point can cite where it came from as a small chip.

## When to use

- Catching someone up after time away: a week of project updates, a busy channel, an inbox.
- Turning a long AI-generated summary into something a reader can act on in a minute.
- Before a meeting, so everyone arrives knowing what changed and what's expected of them.

## When not to use

- Summarising one file, with its pages cited – use `file-summary`.
- Metrics that moved since last time – use `change-summary`.
- One answer and how far to trust it – use `confidence-brief`.
- Work passing from one person to another – use `handoff-brief`.

## Anatomy

1. **Reading time** `.ui-dig__time` – the estimate, “~45 sec”, from the words shown
2. **Section** `.ui-dig__section` – a quiet panel: What matters, What you should do, What changed, Safe to ignore
3. **Item** `.ui-dig__item` – one point, with a bullet, or a checkbox in a checkable section
4. **Source** `.ui-dig__source` – where a point came from, as a chip or a link
5. **Skeleton** `.ui-dig__section--skeleton` – a shimmer in each panel while it summarises

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and the panels as sunken wells. Clean is
one white card with the header as its first row and the panels outlined with a hairline. Safe to ignore is quieter in
both. The panels sit two across, then in one column in a narrow container.

## Keyboard

The digest has no keyboard handling of its own – everything in it is a native control.

| Key | What it does |
|---|---|
| Tab | Moves through the checkboxes and source chips in reading order |
| Space | Ticks or unticks the focused item |
| Enter | Opens the focused source |

## Screen readers

Each panel is a section named by its heading, “What matters”, with its points as a list. A checkable item is a real
checkbox labelled by its text; a ticked item is struck through. A source chip reads as a link or a button with its
label. The reading-time pill reads “~45 sec to read”, and the “1m” glyph is hidden. While summarising, the card is
`aria-busy` and the shimmer is hidden; “One-minute digest ready” is announced politely when it's done.

## Content

- Lead What matters with the change that has the biggest consequence for the reader.
- Write each action as something the reader does, with when: “Send the revised deck by Thursday.”
- Keep What changed to counts and kinds – the details belong in What matters.
- Put repeated or unchanged material in Safe to ignore, so the reader knows it was read and set aside.

## Do

- Keep each panel to two to four points, so the estimate stays near a minute.
- Cite sources for anything a reader might want to check: a number, a date, a decision.
- Give actions stable `id`s, so ticks survive the digest being regenerated.

## Don't

- Don't follow the source documents' order – order by what the reader needs.
- Don't hide a section by leaving it empty to mean “nothing changed” – say so in one point.
- Don't override the estimate to make it look shorter than it reads.

## Example

```html
<tc-digest id="digest" description="A week of launch updates."></tc-digest>

<script type="module">
  import "trenchcoat/digest";
  import "trenchcoat/tokens.css";

  const digest = document.querySelector("#digest");
  digest.matters = [{ text: "The deadline moved up one day.", source: { label: "Kickoff notes", href: "/notes/kickoff" } }];
  digest.actions = [{ id: "deck", text: "Send the revised deck by Thursday." }];
  digest.changes = ["1 new deadline"];
  digest.ignore = ["Unchanged staffing notes"];
  digest.addEventListener("tc-done-change", (e) => console.log(e.detail.done));
</script>
```

```tsx
import { useState } from "react";
import { Digest } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Week() {
  const [done, setDone] = useState<string[]>([]);
  return (
    <Digest
      description="A week of launch updates."
      matters={["The deadline moved up one day."]}
      actions={[{ id: "deck", text: "Send the revised deck by Thursday." }]}
      changes={["1 new deadline"]}
      ignore={["Unchanged staffing notes"]}
      done={done}
      onDoneChange={setDone}
    />
  );
}
```
