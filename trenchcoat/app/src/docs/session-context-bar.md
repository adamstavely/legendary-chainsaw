---
pattern: toolbar
status: new
related: context-tray, usage-meter, budget-guard, kill-switch
---

## Overview

A compact strip under the app's header that keeps a session's declared terms in view while the work scrolls
beneath it: what the session is for, where answers may come from, its scope, what needs review, its posture, how far
anything may be released, its deadline and how much of its budget is used. People who set the terms at the start
stop losing sight of them an hour in. Each term is a labelled chip; the ones that don't fit go behind “+N more”.
When a term changes, its chip flashes once and the change is announced, so a tighter posture or a moved deadline
doesn't pass unnoticed.

## When to use

- AI sessions that start with declared terms – an intent, a knowledge mode, a review rule – that should stay visible
  for the whole session.
- Work under a deadline or a budget, where people need the limit in sight.
- Terms that can change during a session and must be noticed when they do.

## When not to use

- Showing what's in the model's context window – use `context-tray`.
- A budget or quota on its own, in detail – use `usage-meter` or `budget-guard`.
- Stopping or pausing what's running – use `kill-switch`.

## Anatomy

1. **Bar** `.ui-scxb__bar` – the strip; a toolbar when anything in it can be operated
2. **Term** `.ui-scxb__chip` – a label and its value; a button when it's editable
3. **Value** `.ui-scxb__value` – shown as given, with a tone dot where it has one
4. **Meter** `.ui-scxb__meter` – how much is used, for a term like a budget
5. **More** `.ui-scxb__more` – “+N more”: the terms that don't fit

## Looks

Standard is a gray tray strip with each term on its own white pill, the label in the caption style. Clean is a white
strip with the terms as plain text between hairlines, regular-weight values and quieter labels, as in a document
header. In both, “+N more” is a quiet button, and its list is a menu card that floats above the page.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Reaches the bar once, on the last control used |
| ← / → | Moves between the editable terms and “+N more” |
| Home / End | Moves to the first or last of them |
| Enter / Space | Edits the term (the app opens its editor), or opens and closes “+N more” |
| ↓ (on “+N more”) | Opens the list and moves into it |
| ↑ / ↓ (in the list) | Moves between the editable terms in it; Home and End jump |
| Escape (in the list) | Closes the list and returns to “+N more” |

## Screen readers

The host is a region named by `label` (“Session terms”). Inside it the bar is a toolbar with the same name when a
term is editable or some are hidden, otherwise a group. Each term reads as its label and value (“Intent: Choose a
supplier”); an editable one is a button that adds “, change”. A budget's meter is a `meter` named by its label, with
its value as `aria-valuetext` (“62% of $500”); inside an editable chip the meter is hidden and the value says it.
Hidden terms are out of the accessibility tree; “+N more” is named “4 more terms”, with `aria-expanded` and
`aria-controls` pointing at the list, a group named “More session terms”. A lock, when `locked`, reads “Fixed for
this session”. Changes are announced politely: “Posture: Elevated.”, several at once joined, and “Deadline removed.”

## Content

- Keep values short – two or three words fit the strip; put the longer version in `description`, which the list and
  the tooltip show.
- Write values as the person declared them (“Before sharing”, “Fri 17:00”); the component doesn't format dates or
  numbers.
- Use tones sparingly: `success` for the normal state, `warning` and `danger` when a term has tightened.
- Rename the usual labels with `termLabels`, or give your own ids their own labels.

## Do

- Put it directly under the app's header and set `sticky-top` to the header's height.
- Make a term editable only when the person may change it mid-session, and open your editor at the event's anchor.
- Send changed terms as a new `terms` list, so the change flashes and is announced.

## Don't

- Don't put actions in the bar that aren't terms – it says what the session is, not what to do.
- Don't change terms every few seconds; each change is announced, and a stream of them is noise.
- Don't use colour alone for a term's state – the value's words carry it.

## Example

```html
<tc-session-context-bar id="terms" sticky-top="56"></tc-session-context-bar>

<script type="module">
  import "trenchcoat/session-context-bar";
  import "trenchcoat/tokens.css";

  const bar = document.querySelector("#terms");
  bar.terms = [
    { id: "intent", value: "Choose a supplier" },
    { id: "knowledge", value: "Sources + model", editable: true },
    { id: "posture", value: "Normal", tone: "success" },
    { id: "deadline", value: "Fri 17:00" },
    { id: "budget", value: "62% of $500", meter: 0.62 },
  ];
  bar.addEventListener("tc-term-edit", (e) => openEditor(e.detail.term, e.detail.anchor));
</script>
```

```tsx
import { useState } from "react";
import { SessionContextBar, type SessionTerm } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function SessionHeader({ initial }: { initial: SessionTerm[] }) {
  const [terms, setTerms] = useState(initial);
  return (
    <SessionContextBar
      terms={terms}
      stickyTop={56}
      onEdit={(term) =>
        setTerms((list) => list.map((t) => (t.id === term.id && t.id === "posture" ? { ...t, value: "Elevated", tone: "warning" } : t)))
      }
    />
  );
}
```
