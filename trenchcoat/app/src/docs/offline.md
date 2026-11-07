---
pattern: none
status: new
related: something-wrong, no-access, limit-reached, nothing-found
---

## Overview

A cloud and a device with the dashed link between them broken, and the words You're offline. It's for a page that can't reach the server right now – the connection should come back, so it's calmer than a failure. It's drawn like the other state illustrations: a soft tile, one pastel mark, a soft glow beneath.

## When to use

- The browser has no network, or the server can't be reached for a while.
- A sync or live view that's waiting for the connection to come back.

## When not to use

- A request that failed for another reason – use `something-wrong`.
- Someone without permission – use `no-access`.
- A quota or rate limit – use `limit-reached`.

## Anatomy

1. **Cloud** `.ui-ofl-cloud` – the server, in the soft blue mark
2. **Link** `.ui-ofl-link` – the dashed connection, broken in the middle
3. **Device** `.ui-ofl-tile` – this computer or phone
4. **Words** `.ui-ofl-caption` – what's happened; the default is You're offline

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the message is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say what still works and what will happen: "Your changes are saved on this device and will sync when you're back online." Offer Retry, and retry by itself when the connection returns.

## Do

- Keep what people were doing on screen, and save it locally if you can.
- Retry on its own when the browser reports it's online again, and say when it worked.

## Don't

- Don't blame the person or their network: say what's happened and what to do.
- Don't show it for a single failed request that a retry would fix: retry first.

## Example

```html
<tc-offline></tc-offline>

<script type="module">
  import "@adamstavely/trenchcoat/offline";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { Offline } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <Offline />;
}
```
