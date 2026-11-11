---
pattern: none
status: new
related: notification-stack, toaster, list-motion, alert-feed
---

## Overview

Notices that pile up instead of pushing the page down. The newest sits on top and a few older ones peek out below it, each a little smaller and dimmed. Hovering the stack, or moving focus into it, spreads them into a full list; leaving, or Escape, gathers them again. Dismissing one slides it away and the rest close the gap.

## When to use

- Several system notices that can arrive one after another, such as "Nightly export finished".
- Notices people should be able to look back over without a separate inbox.

## When not to use

- Brief messages that go away on their own – use `toaster`.
- A notification centre with read and unread states – use `notification-stack` or `notifications`.
- A feed people work through – use `alert-feed`.

## Anatomy

1. **Stack** `[data-ui="bst"]` – the region; its height follows the pile, gathered or spread
2. **Banner** `[data-bst-item]` – your own banners, newest first; the ones behind the front have `data-bst-behind`, and the ones past `limit` have `data-bst-over`
3. **Dismiss** `[data-dismiss]` – any button inside a banner that dismisses it
4. **Status** `.ui-bst__status` – the polite message that reads out a banner that arrives

## Looks

No look of its own. The banners keep theirs; give them a background and a radius so the pile reads as cards. A page can override `--tc-bst-peek` and `--tc-bst-gap` (both `--tc-space-2`), `--tc-bst-shrink` (0.05 per step back) and `--tc-bst-dim`, the tray-coloured veil over the ones behind. It follows `--tc-duration-slow` and `--tc-ease-move`. With reduced motion everything changes at once.

## Keyboard

| Key | What it does |
| --- | --- |
| Tab | Moves through the banners' own controls; focus inside spreads the stack |
| Escape | Gathers the stack; it stays gathered until focus or the pointer leaves |
| Enter / Space on Dismiss | Dismisses that banner; focus moves to the next banner's Dismiss |

## Screen readers

The stack is a region named by `label` ("Notices" by default). The banners are read newest first, in the page's order, whether gathered or spread. A banner added after the first render is read out politely; set `quiet` to stop that. Name each Dismiss button with its banner's title, such as "Dismiss Nightly export finished".

## Content

Put the banners in newest first, each with a `data-id`. Keep them short – a title and a line. Listen for `tc-dismiss` and remove the banner from your data; a banner still there afterwards is hidden by the stack itself.

## Do

- Keep `limit` small (2–4). The peek is a hint that there's more.
- Remove a dismissed banner from your data, so it doesn't come back.

## Don't

- Don't put urgent errors in the stack. They need to stay in view, not under the newest notice.
- Don't add a banner every few seconds. The pile stops meaning anything.

## Example

```html
<tc-banner-stack label="System notices" limit="3">
  <div data-id="export">Nightly export finished <button type="button" data-dismiss>Dismiss</button></div>
  <div data-id="sync">Vendor sync resumed <button type="button" data-dismiss>Dismiss</button></div>
</tc-banner-stack>

<script type="module">
  import "@adamstavely/trenchcoat/banner-stack";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-banner-stack").addEventListener("tc-dismiss", (e) => console.log("dismissed", e.detail.id));
</script>
```

```tsx
import { useState } from "react";
import { BannerStack } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

type Notice = { id: string; title: string };

export function Notices({ initial }: { initial: Notice[] }) {
  const [notices, setNotices] = useState(initial);
  return (
    <BannerStack label="System notices" onDismiss={(id) => setNotices((n) => n.filter((x) => x.id !== id))}>
      {notices.map((n) => (
        <div key={n.id} data-id={n.id}>
          {n.title}
          <button type="button" data-dismiss>Dismiss</button>
        </div>
      ))}
    </BannerStack>
  );
}
```
