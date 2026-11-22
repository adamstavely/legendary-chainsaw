---
pattern: none
status: new
related: doc-status, tray-status, agent-scene, content-hidden
---

## Overview

The full-page and empty states as one illustration: a small scene in the soft style of the state illustrations – a tile, one pastel mark with a darker edge and ink, a soft glow beneath – and its words as real text under it. `status` picks the scene:

| `status` | Scene | Colour | Words | When to use |
|---|---|---|---|---|
| `nothing-found` | A magnifying glass passing over blank results | Slate | – | A search or filter with no matches |
| `first-use` | An empty workspace with one highlighted spot to start from | Blue | Nothing here yet | A new team, project or workspace with nothing in it |
| `offline` | A cloud and a device with the dashed link between them broken | Blue | You're offline | No network, or the server can't be reached for a while |
| `something-wrong` | Two connected tiles with the line between them broken | Amber | – | A page or request that failed |
| `not-found` | A torn page with a question mark | Slate | Page not found | An address that doesn't lead anywhere (404) |
| `link-expired` | Two parted chain links with a clock badge | Amber | This link has expired | A share link or invitation past its date |
| `no-access` | A folder held shut by a padlock | Purple glow | – | Someone signed in who isn't entitled to see it |
| `access-requested` | An envelope with an hourglass | Purple | Access requested | After someone asks for access, until it's decided |
| `session-expired` | A clock with a key | Amber | Session expired | Signed out after a while away; sign in again |
| `limit-reached` | A gauge at the end of its range with a clock | Amber | Usage limit reached | Work stopped until a quota or rate limit resets |
| `maintenance` | A wrench on a tile | Amber | Down for maintenance | Planned downtime, with when it'll be back |
| `coming-soon` | A wrapped box | Blue | Coming soon | A feature that isn't released yet |
| `region-unavailable` | A globe with a slash through it | Slate | Not available in your region | A service that isn't offered where someone is |
| `ai-unavailable` | The assistant's mark – a chat bubble with a sparkle – with a pause badge | Purple | AI is unavailable | The model or an AI feature is down or turned off; say what still works beside it |

Words follow the status unless `caption` sets its own. `nothing-found`, `something-wrong` and `no-access` fill the frame and have no words of their own, so they're decorative unless given `caption` or `label` – put the message beside them. Each scene moves a little a few times and rests.

## When to use

- A whole page or a large panel that can't show what was asked for, and why.
- An empty list or workspace, with the first step beside it.

## When not to use

- Where a single document stands – use `doc-status`.
- A tray, queue or upload area – use `tray-status`.
- Sensitive content covered on purpose – use `content-hidden`.

## Anatomy

1. **Scene** `.ui-pgs-art` – the status's drawing: tiles `.ui-pgs-tile`, marks `.ui-pgs-badge` and their ink `.ui-pgs-ink`
2. **Glow** `.ui-pgs-glow` – the soft light beneath
3. **Words** `.ui-pgs-caption` – what's happened; the status's own unless `caption` is set

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting, and each status has its own colour – slate, blue, amber or purple. It has no background of its own,
so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by its words, so the state is announced. With no words – `caption=""`, or one of the three statuses without words of their own – and no `label`, it's decorative and skipped, for when the words beside it say the same.

## Content

Say what happened and what to do next beside it: "Your changes are saved on this device and will sync when you're back online." Offer one clear action – Retry, Sign in, Request access, Clear filters.

## Do

- Keep what people were doing on screen when you can, and say what still works.
- Use your own words with `caption` when your product says it differently.

## Don't

- Don't use it as the only explanation – say what's wrong and what to do in words beside it.
- Don't make it bigger than the message; it's there to set the tone, not to fill the page.

## Example

```html
<tc-page-state status="offline"></tc-page-state>

<script type="module">
  import "@adamstavely/trenchcoat/page-state";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { PageState } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function NoResults() {
  return <PageState status="nothing-found" />;
}
```
