---
pattern: disclosure
status: new
related: icon-rail, meter-row, background-tasks, artifact-panel
---

## Overview

One section of a side panel: a heading, a short value at the right and the page's own content, which folds away. As a
link it has no content, and the whole row opens something else, such as a details view.

## When to use

- Side panels and inspectors made of several small sections.
- A summary row, such as "51 outputs", that opens the full view.

## When not to use

- A full-width page section – use the page's own headings.
- Motion alone, with your own button – use `collapse`.
- A long list of filters – use `filter-menu`.

## Anatomy

1. **Heading** `.ui-pnc__head` – holds the row's button
2. **Button** `.ui-pnc__button` – the whole row
3. **Title** `.ui-pnc__title` – the section's name
4. **Chevron** `.ui-pnc__chevron` – points right when shut, down when open
5. **Value** `.ui-pnc__value` – the short text at the right
6. **Card** `.ui-pnc__card` – the white surface behind the content in Standard

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and shadow. A page can set `--tc-pnc-pad`, the space around the content.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the row, then into the open content and any aside |
| Enter / Space | Opens or shuts the section, or opens the link |

## Screen readers

The row is a button inside a heading. In `fold` mode it says whether it's expanded and controls the card. Shut content
isn't drawn, so it's neither read nor reached.

## Content

Keep the heading to a word or two, and the value to a count or a short state, such as "14 to reconnect". A child with
`slot="aside"` sits beside the value, such as a compact `meter-row`. For the smoothest glide, the card's height is
animated, so content of any size works.

## Do

- Use `link` when pressing the row goes somewhere else.
- Listen for `tc-expanded-change` to remember which sections are open.

## Don't

- Don't put a control inside the heading or value: use the aside, which sits outside the button.
- Don't rely on the value's colour or position alone to report a problem: say it in words.

## Example

```html
<tc-panel-card id="reports" heading="Reports" value="51" expanded>
  <p>Weekly sample counts</p>
</tc-panel-card>

<script type="module">
  import "trenchcoat/panel-card";
  import "trenchcoat/tokens.css";

  document.querySelector("#reports").addEventListener("tc-expanded-change", (e) => {
    console.log(e.detail.expanded);
  });
</script>
```

```tsx
import { PanelCard } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Reports({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <PanelCard title="Freezers" defaultExpanded>
        <p>North wing, rack 4</p>
      </PanelCard>
      <PanelCard title="Reports" value="51" mode="link" onTcOpen={onOpen} />
    </>
  );
}
```
