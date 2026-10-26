---
pattern: none
status: stable
related: setup-guide, command-menu, usage-meter
---

## Overview

The account card people open from their avatar: who is signed in, the account actions – Settings, Docs, Apps,
Logout, or your own – and, if you want, how far they've got with setting up their profile, with a shortcut to the
next step. It puts the few things people look for in an account menu in one predictable place, and nudges them to
finish setup without a separate checklist. The card is the content; open it from your own avatar button or popover.

## When to use

- The account menu behind the avatar in an app's header or sidebar.
- Account-level actions: settings, language, help and docs, switching apps, signing out.
- Prompting people to finish an onboarding checklist from a place they visit often.

## When not to use

- Searching for and running commands across the app – use `command-menu`.
- A full onboarding checklist with descriptions for each step – use `setup-guide`.
- Showing plan usage and limits – use `usage-meter`.

## Anatomy

1. **User** `.ui-pm__user` – the avatar, name and email of the signed-in person
2. **Actions** `.ui-pm__items` – the account actions, one button each
3. **Badge** `.ui-pm__badge` – a small pill on an action, such as “New”
4. **Setup** `.ui-pm__setup` – profile setup progress, with `setup`
5. **Next step** `.ui-pm__next` – a shortcut to the next open setup step

## Looks

Standard sets the white menu card on a gray tray, like the chat composer, and puts the setup progress in the tray
below the card. Clean has no tray: one white menu card with a hairline shadow, smaller rows and thinner icons, and
the setup progress as its last row under a hairline.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the actions, then to the setup's next step |
| ↓ / ↑ | Moves to the next or previous action, wrapping around |
| Home / End | Moves to the first or last action |
| Enter / Space | Picks the focused action or the next step |

## Screen readers

The actions are plain buttons in a group named “Account” – it's always visible, so it isn't an ARIA menu. The setup
bar is a `progressbar` named “Profile setup” with its value as text (“2 of 5 steps done”), and the next step button
reads “Next: Verify your email”. The default avatar is hidden; give your own avatar a text alternative only if it
adds something the name doesn't.

## Content

- Use the person's full name and the email they sign in with – long ones are cut off with a tooltip.
- Write action labels as one or two words: “Settings”, “Language”, “Log out”.
- Keep setup steps as short tasks starting with a verb: “Verify your email”, “Invite a teammate”.
- Use a badge for something new or needing attention, not as decoration on every row.

## Do

- Put sign-out last, so it's easy to find and hard to hit by accident.
- Pass your own `items` with the icons the module exports (`SettingsIcon`, `LogoutIcon` …) so they match the look.
- Hide `setup` once every step is done – the bar stays at 100 % otherwise.

## Don't

- Don't put more than six or seven actions in it; move the rest into Settings.
- Don't use it for navigation between the app's main sections.
- Don't put destructive account actions (delete account) here without a confirmation step behind them.

## Example

```html
<tc-profile-menu id="account" name="Maya Rodriguez" email="maya@northwind.studio"></tc-profile-menu>

<script type="module">
  import { profileMenuIcon } from "trenchcoat/profile-menu";
  import "trenchcoat/tokens.css";

  const menu = document.querySelector("#account");
  menu.items = [
    { id: "settings", label: "Settings", icon: profileMenuIcon("settings") },
    { id: "logout", label: "Log out", icon: profileMenuIcon("logout") },
  ];
  menu.setup = { done: 2, total: 5, next: "Verify your email" };
  menu.addEventListener("tc-item-select", (e) => console.log(e.detail.id));
</script>
```

```tsx
import { ProfileMenu, SettingsIcon, LogoutIcon, type ProfileMenuItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const items: ProfileMenuItem[] = [
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
  { id: "logout", label: "Log out", icon: <LogoutIcon /> },
];

export function AccountCard({ onPick }: { onPick: (id: string) => void }) {
  return (
    <ProfileMenu
      name="Maya Rodriguez"
      email="maya@northwind.studio"
      items={items.map((item) => ({ ...item, onSelect: () => onPick(item.id) }))}
      setup={{ done: 2, total: 5, next: "Verify your email" }}
    />
  );
}
```
