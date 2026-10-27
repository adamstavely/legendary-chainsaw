---
pattern: landmark
status: stable
related: setup-guide, progress-tracker, notification-stack, smart-recommendation
---

## Overview

A panel of short tips for getting more out of a product, each with exactly one action – “Turn on”, “Try it”, “Import”.
Taking the action turns the tip into a quiet done state (“Enabled”), and the count in the header keeps track: “2/6
done”. It suits the first days with a product or a new feature, when people benefit from a few pointers they can
act on right away and then forget about.

## When to use

- Pointing new people at features they'd otherwise miss, each one a click away.
- A handful of independent suggestions that can be taken in any order.
- A dismissible panel on a home or empty screen – with `closable` (or `onClose`) for a Close button.

## When not to use

- Steps that build on each other towards a finished setup – use `setup-guide`.
- Showing progress through a multi-step process – use `progress-tracker`.
- Messages about things that just happened – use `notification-stack`.
- One suggestion based on what the person is doing right now – use `smart-recommendation`.

## Anatomy

1. **Header** `.tc-head` – the icon, the heading and the done count
2. **Count** `.ui-tp__count` – “2/6 done”
3. **Tip** `.ui-tp__tip` – a title, a short description and its action
4. **Primary action** `.ui-tp__btn--primary` – the dark button, for the one tip that matters most
5. **Footer** `.ui-tp__foot` – the Close button, when the panel can be closed

## Looks

Standard is a gray tray with the header and footer on it and the tips in a white card; tips are bordered tiles that
turn gray when done. Clean drops the tray: one white card with a hairline shadow and a divider under the header,
quieter tip tiles and a green check on done tips. Both lay the tips out in three columns, two below 560px and one
below 380px, and scroll the tips inside the card.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the tips' actions and the Close button |
| Enter / Space | Takes the focused tip's action, or closes the panel |

Taking an action keeps focus in place: it moves onto the tip's done mark, which replaces the button.

## Screen readers

The panel is a `region` named by its heading (unless the page names it). Tip titles and descriptions are plain text;
each action is a button with the action's text. A status region announces each action taken with the new count:
“Daily digest: Enabled. 2 of 6 done.”

## Content

- Title each tip with the benefit, not the feature name: “Open anything fast”, “Daily digest”.
- Keep descriptions to one sentence that says what happens; mark keys with `Kbd` – “Press ⌘ K to jump to any
  project”.
- Write actions as short verbs – “Turn on”, “Show QR code” – and `doneLabel` as the resulting state: “Enabled”,
  “Following system”.
- Name the panel for its moment: “Tips for getting started”.

## Do

- Keep it to three to six tips – a full row or two.
- Mark only one tip `primary`.
- Remember which tips are done (`done`, `onDoneChange`) so they stay done next time.

## Don't

- Don't use tips for actions that can't be undone or need confirming – the tip marks itself done at once.
- Don't put more than one action in a tip's description.
- Don't keep showing the panel once every tip is done – let people close it.

## Example

```html
<tc-tips-panel id="tips" heading="Tips for getting started" closable></tc-tips-panel>

<script type="module">
  import "trenchcoat/tips-panel";
  import "trenchcoat/tokens.css";

  const panel = document.querySelector("#tips");
  panel.tips = [
    {
      id: "digest",
      title: "Daily digest",
      description: "Get one calm summary each morning.",
      action: "Turn on",
      doneLabel: "Enabled",
      primary: true,
    },
    {
      id: "import",
      title: "Bring your data",
      description: "Import tasks from Trello, Asana or a CSV file.",
      action: "Import",
      doneLabel: "Imported",
    },
  ];
  panel.addEventListener("tc-tip-action", (e) => console.log(e.detail.id));
  panel.addEventListener("tc-close", () => panel.remove());
</script>
```

```tsx
import { useState } from "react";
import { Kbd, TipsPanel, type Tip } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function GettingStarted({ openPalette }: { openPalette: () => void }) {
  const [done, setDone] = useState<string[]>([]);
  const tips: Tip[] = [
    {
      id: "palette",
      title: "Open anything fast",
      description: (
        <>
          Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to jump anywhere.
        </>
      ),
      action: "Try it",
      doneLabel: "Tried",
      primary: true,
      onAction: openPalette,
    },
    {
      id: "digest",
      title: "Daily digest",
      description: "Get one calm summary each morning.",
      action: "Turn on",
      doneLabel: "Enabled",
    },
  ];
  return <TipsPanel title="Tips for getting started" tips={tips} done={done} onDoneChange={setDone} />;
}
```
