---
pattern: none
status: new
related: no-access, something-wrong, share-link-manager, team-invite
---

## Overview

Two chain links on a tile, parted, with an amber clock badge and the words This link has expired. It stands in for a
page reached through a share link or an invitation that's past its date, so people see that the link worked once and
what to ask for.

## When to use

- A share link, download link or invitation that's past its expiry date.
- A one-time link that's already been used.

## When not to use

- Someone signed in who isn't allowed to see the page – use `no-access`.
- A link to something that's been deleted – say so in words, as asking for a new link won't help.
- A page that failed to load – use `something-wrong`.

## Anatomy

1. **Links** `.ui-lex-chain` – the parted chain
2. **Clock** `.ui-lex-badge` – the expiry, with its ticking hand `.ui-lex-hand`
3. **Words** `.ui-lex-caption` – what's happened; the default is This link has expired

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the message is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say when it expired and who can make a new one: "This link stopped working on 2 November. Ask the person who shared it
for a new one." Don't show what the link led to.

## Do

- Offer Request a new link when the page can send that request.
- Keep the same wording for an expired and a used one-time link, so neither gives away more than the other.

## Don't

- Don't use it when you can't tell an expired link from a wrong one – say the link isn't valid instead.

## Example

```html
<tc-link-expired></tc-link-expired>

<script type="module">
  import "@adamstavely/trenchcoat/link-expired";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { LinkExpired } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <LinkExpired />;
}
```
