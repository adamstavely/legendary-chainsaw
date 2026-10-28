---
pattern: disclosure
status: new
related: notifications, app-picker, profile-menu, button
---

## Overview

The right end of an app header: the notifications bell, the app picker and the signed-in person's avatar, in that
order, with a hairline before the avatar. The bell and the picker are your own `tc-notifications` and `tc-app-picker`,
put inside the element as children – leave one out and it isn't shown. The avatar is a round button with the person's
photo, or their initials on a tone, and an optional presence dot. It opens their account card, a `tc-profile-menu`, in
a popover under it. Only one of the three popovers is open at a time: opening one closes the others.

## When to use

- The top right of an app or suite header, where people expect their account, alerts and other apps.
- Any header that shows more than one of those three, so they share one shape and one open-at-a-time rule.

## When not to use

- Only the alerts – use `notifications`.
- Only the app launcher – use `app-picker`.
- An account card shown inline on a page, not from a header – use `profile-menu`.
- A single action in a header – use `button`.

## Anatomy

1. **Bell** – your `tc-notifications`, first
2. **App picker** – your `tc-app-picker`, second
3. **Hairline** `.ui-hn__sep` – between them and the avatar; only when one of them is there
4. **Avatar** `.ui-hn__me` – the round button that opens the account card
5. **Face** `.ui-hn__face` – the photo, or the initials on a tone
6. **Presence** `.ui-hn__dot` – online, away, busy or offline, on the avatar's bottom corner
7. **Account card** `.ui-hn__pop` – the popover holding the `tc-profile-menu`

## Looks

Standard and Clean differ only in the pieces: the triggers are 32 px round buttons in Standard and 28 px in Clean, the
account card is Standard's gray tray card or Clean's white menu card, and Clean draws initials in a medium weight. Set
`look` on the element and the bell and picker inside it follow.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the bell, the picker and the avatar, then into the open card |
| Enter / Space | Opens or closes the popover of the focused trigger |
| Escape | Closes the account card and puts focus back on the avatar |
| Enter / Space on an action | Picks it; the card closes and focus goes back to the avatar |

Opening the card moves focus to its first action. Clicking outside, or moving focus anywhere else, closes it where
focus is.

## Screen readers

The avatar is a button named “Account: Ada Lovelace”, with `aria-haspopup="dialog"` and `aria-expanded`; its presence
is its description (“Online”). The card is a non-modal dialog named “Account” that the avatar controls while it's
open. The face and the presence dot are hidden from screen readers – the button's name and description say it all.

## Content

- `user.name` is the full name: the initials, the avatar's name and the card's heading come from it.
- Give `user.avatar` a photo URL, or leave it out for initials. A photo that fails to load falls back to initials.
- `accountItems` replaces Settings, Language, Docs and Sign out; keep the list short and put Sign out last.
- Rename “Account” with `account-label` in other languages.

## Do

- Put the element at the end of the header, after search and other actions.
- Handle `tc-account-select` to route each action; prevent it to keep the card open.
- Control `panel` when something else on the page should close the popovers.

## Don't

- Don't put other children in it – only `tc-notifications` and `tc-app-picker` take part in the one-open rule.
- Don't use a photo of anything but the person.
- Don't show presence unless it's kept up to date.

## Example

```html
<tc-header-nav id="nav">
  <tc-notifications id="bell"></tc-notifications>
  <tc-app-picker id="apps" current="mail"></tc-app-picker>
</tc-header-nav>

<script type="module">
  import "trenchcoat/header-nav";
  import "trenchcoat/notifications";
  import "trenchcoat/app-picker";
  import "trenchcoat/tokens.css";

  const nav = document.querySelector("#nav");
  nav.user = { name: "Ada Lovelace", email: "ada@example.com", presence: "online" };
  document.querySelector("#bell").items = [{ id: "n1", title: "Production deploy finished", time: Date.parse("2026-10-27T09:00") }];
  document.querySelector("#apps").apps = [{ id: "mail", name: "Mail", href: "/mail" }, { id: "docs", name: "Docs", href: "/docs" }];
  nav.addEventListener("tc-account-select", (e) => console.log(e.detail.id));
</script>
```

```tsx
import { useState } from "react";
import { HeaderNav, type HeaderNavPanel } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Header() {
  const [open, setOpen] = useState<HeaderNavPanel | null>(null);
  return (
    <HeaderNav
      user={{ name: "Ada Lovelace", email: "ada@example.com", presence: "online" }}
      notifications={{ items: [{ id: "n1", title: "Production deploy finished", time: Date.parse("2026-10-27T09:00") }] }}
      apps={{ apps: [{ id: "mail", name: "Mail", href: "/mail" }], current: "mail" }}
      open={open}
      onOpenChange={setOpen}
      onAccountSelect={(id) => console.log(id)}
    />
  );
}
```
