---
pattern: none
status: new
related: segmented-control, side-nav, list-motion, blur-crossfade
---

## Overview

A highlight that slides to whichever item is selected – in tabs, a row of options or a nav – instead of jumping. Wrap
your own buttons or links in it: it reads which one is selected from `aria-selected`, `aria-current`, `aria-checked`
or `data-selected`, follows that as it changes, and keeps up when the items resize or wrap. `variant="underline"`
draws a bar under the selected item (beside it when the items run down the page); `variant="pill"` fills the item's
box behind its text. With `hover-preview`, a faint ghost follows the pointer across the items. It adds no roles or
keys of its own – your tablist, radio group or nav keeps them. For people who ask for reduced motion, the highlight
moves without sliding.

## When to use

- Tabs you've built yourself, so the selected tab's underline glides across.
- A row of options or filters where a pill should slide to the chosen one.
- A side or top nav where the current page's marker should follow the route.

## When not to use

- A ready-made row of options with its own keyboard handling – use `segmented-control`.
- A whole navigation sidebar – use `side-nav`.
- Items that are added, removed or reordered – use `list-motion`.
- Content that changes inside one box – use `blur-crossfade`.

## Keyboard

Nothing of its own. Your items keep their keys – for tabs, the arrow keys move between them and the highlight follows
the one that becomes selected.

## Screen readers

Nothing is read: the highlight and the ghost are `aria-hidden`. What's selected comes from your own `aria-selected`,
`aria-current` or `aria-checked`, which is also what the highlight follows – so the two can't disagree.

## Do

- Set the selected state on the item itself (`aria-selected="true"` on the tab, `aria-current="page"` on the link).
- Change the selected item's text colour as well – the highlight alone shouldn't carry the meaning.
- Use `items` with a selector when the row holds other buttons that aren't options.

## Don't

- Don't use `data-selected` where an ARIA state fits – screen readers can't see it.
- Don't put it around items that scroll sideways inside their own container; it measures against its own box.

## Example

```html
<tc-sliding-indicator variant="underline" hover-preview>
  <div role="tablist" aria-label="Finding F-214">
    <button type="button" role="tab" aria-selected="true">Overview</button>
    <button type="button" role="tab" aria-selected="false" tabindex="-1">Evidence</button>
    <button type="button" role="tab" aria-selected="false" tabindex="-1">History</button>
  </div>
</tc-sliding-indicator>

<script type="module">
  import "@adamstavely/trenchcoat/sliding-indicator";
  import "@adamstavely/trenchcoat/tokens.css";

  // Your tabs set aria-selected; the highlight follows
  const tabs = document.querySelectorAll('[role="tab"]');
  for (const tab of tabs)
    tab.addEventListener("click", () => {
      for (const t of tabs) t.setAttribute("aria-selected", String(t === tab));
    });
</script>
```

```tsx
import { useState } from "react";
import { SlidingIndicator } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function FindingTabs() {
  const [tab, setTab] = useState("Overview");
  return (
    <SlidingIndicator variant="pill">
      <div role="tablist" aria-label="Finding F-214">
        {["Overview", "Evidence", "History"].map((t) => (
          <button key={t} type="button" role="tab" aria-selected={t === tab} tabIndex={t === tab ? 0 : -1} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
    </SlidingIndicator>
  );
}
```
