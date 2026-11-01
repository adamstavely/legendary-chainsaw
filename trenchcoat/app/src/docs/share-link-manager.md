---
pattern: list
status: new
related: share-panel, access-review, audit-trail, file-details
---

## Overview

The links that already share something: who made each, what it allows, when it expires, how many times it's been opened, and whether it's active, expiring soon, expired or revoked. Copy, Change expiry and Revoke act on one link, and revoking asks first.

## When to use

- Showing and managing links to a file or folder.

## When not to use

- Sharing with named people and groups – use `share-panel`.
- Reviewing everyone's access – use `access-review`.
- Secrets such as API keys – use `secret-field`.

## Anatomy

1. **Row** `.ui-slm__row` – one link, with `.ui-slm__name` and `.ui-slm__url`
2. **Status** `.ui-slm__status` – in words
3. **Facts** `.ui-slm__facts` – access, expiry, `.ui-slm__password`, opens and who made it
4. **Actions** `.ui-slm__actions` – `.ui-slm__copy`, `.ui-slm__change` and `.ui-slm__revoke`
5. **Question** `.ui-slm__confirm` – says how many opens it's had before revoking
6. **Create** `.ui-slm__create` – with `creatable`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each link's address and actions |
| Enter / Space | Presses a button |

The question moves focus to Keep, and focus returns to the button that opened it.

## Screen readers

The links are a list named by the heading. Status is in words. Each button's name includes the link it acts on. `role="status"` announces copying, revoking and changing expiry.

## Content

Give `label`, so people recognise a link without reading its address. `password` is only true or false: never send the password. Expiry needs `now`, because the element doesn't read the clock; without it, only revoked links show as not active.

## Do

- Revoke and enforce expiry on the server when `tc-links-change` arrives.
- Update `now` as time passes.
- Log who copied or revoked what.

## Don't

- Don't rely on the status shown here: the server decides whether a link works.
- Don't put secrets in link addresses that people might paste elsewhere.

## Example

```html
<tc-share-link-manager id="links" creatable></tc-share-link-manager>

<script type="module">
  import "trenchcoat/share-link-manager";
  import "trenchcoat/tokens.css";

  const manager = document.querySelector("#links");
  manager.now = Date.now();
  manager.links = [{ id: "a", url: "https://example.org/l/8f2a", createdBy: "Noor Haddad", createdAt: Date.now(), access: "Can view" }];
  manager.addEventListener("tc-links-change", (e) => console.log(e.detail.change));
</script>
```

```tsx
import { ShareLinkManager, type ShareLink } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const links: ShareLink[] = [{ id: "a", url: "https://example.org/l/8f2a", createdBy: "Noor Haddad", createdAt: 1793000000000, access: "Can view" }];

export function Links({ now }: { now: number }) {
  return <ShareLinkManager defaultLinks={links} now={now} onLinksChange={(next) => console.log(next)} />;
}
```
