---
pattern: grid
status: new
related: profile-menu, command-menu, background-tasks
---

## Overview

The app launcher at the top right of a suite: a grid button that opens the person's apps as tiles, so they can move
between products without going back to a home page. Each tile shows the app's icon and name, says what the app does
when it's pointed at or focused, and is a real link – middle-click and open in a new tab work as people expect. The
app they're in is marked. Pinned apps come first, then the ones used recently, then all apps or the app's own
groups; with many apps a search field filters as you type. The app owns the list and the navigation: a pick is a
cancelable event, so a single-page app can route instead of loading a page.

## When to use

- A suite or platform with several products a person moves between – mail, calendar, docs, an admin console.
- A header that needs a compact way to reach every app the person has access to, with their favourites first.
- A launcher whose list comes from a server, with loading and error states.

## When not to use

- Searching for and running commands, pages and records – use `command-menu`.
- The signed-in person's account, settings and sign-out – use `profile-menu`.
- The person's own running jobs – use `background-tasks`.

## Anatomy

1. **Button** `.ui-apk__trigger` – the grid icon that opens the panel
2. **Search** `.ui-apk__search` – filters the apps as you type, when there are many
3. **Section** `.ui-apk__label` – Pinned, Recent, All apps or one of the app's groups
4. **Tile** `.ui-apk__tile:not([aria-current])` – the app's icon and name, a link to the app
5. **Current app** `.ui-apk__tile[aria-current]` – the app the person is in, tinted with a bar under its name
6. **Description** `.ui-apk__hint` – what the pointed-at or focused app does
7. **Footer** `.ui-apk__foot` – Edit pins and the "All apps" or "Manage apps" link

## Looks

Standard draws each icon on a tinted 40 px tile with the name in medium weight, and sets the inline panel's header on
the gray tray above a white card. Clean uses smaller icons with a hairline ring, regular-weight names in a quieter
colour and section labels in small capitals; the inline panel is one white card with the header as its first row.
Opened from the button, both looks use the menu surface and carry no card header.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space / ↓ | On the button: opens the panel – focus goes to the search field, else the current app, else the first app |
| → / ← | The next or previous tile, on to the next or previous row |
| ↓ / ↑ | The tile below or above, keeping the column – across sections; ↑ from the top row returns to the search field |
| Home / End | The first or last tile |
| Enter | Opens the focused app; in the search field, opens the first match. While editing pins, Enter or Space toggles the pin |
| ↓ (in the search field) | Moves into the grid |
| Escape | Clears the search; then closes the panel and returns focus to the button |
| Tab | Leaves the grid (one tab stop) for Edit pins and the footer link |

## Screen readers

The button is named by `label` (“Apps”), with `aria-haspopup="dialog"` and `aria-expanded`. The panel is a non-modal
`dialog` with the same name. Each section is a `grid` named by its heading (“Pinned”, “Recent”, “All apps”) – or
by the panel's name when there's only one – with `row` and `gridcell` children; the section labels are headings.
A tile is a link named by the app's name, described by its `description`; the current app has
`aria-current="true"` and “(current app)” after its name. While editing pins, each tile is a toggle button named
“Pin Mail” with `aria-pressed`. A polite status region says how many apps match a search (“3 apps”, “No apps match
“zz””), “Mail pinned” or “Mail unpinned”, “Loading apps” and the error message.

## Content

- Use the app's product name as people say it: “Calendar”, “Admin console” – not a slogan. Names wrap to two lines.
- Keep `description` to a short phrase about what the app is for: “Meetings, rooms and time off”.
- Give an app its own icon (`icon`) or logo (`image`) where it has one; initials on a palette colour fill in.
- Add `keywords` for the words people search with that aren't in the name (“email” for Mail).
- Write `error` as what happened and what to do: “Couldn't load your apps. Check your connection and try again.”
- Label the footer link by where it goes: “All apps” for a full catalogue, “Manage apps” for settings.

## Do

- Keep `pinned` and `recent` in your own state and save them; prevent `tc-pin-change` when the server owns the list.
- Prevent `tc-app-select` to route inside a single-page app; leave it alone to follow the link.
- Set `current` to the app the person is in, so they can see where they are.
- Put the button at the end of the app's header, beside notifications and the avatar.

## Don't

- Don't turn the tiles into buttons that navigate in script – give every app an `href`, so new tabs work.
- Don't list apps the person can't open.
- Don't show the launcher with a single app.

## Example

```html
<tc-app-picker id="apps" current="mail" pinnable footer-href="/apps" footer-label="All apps"></tc-app-picker>

<script type="module">
  import "trenchcoat/app-picker";
  import "trenchcoat/tokens.css";

  const apps = document.querySelector("#apps");
  apps.apps = [
    { id: "mail", name: "Mail", href: "/mail", description: "Your inbox and shared mailboxes" },
    { id: "calendar", name: "Calendar", href: "/calendar", description: "Meetings, rooms and time off" },
    { id: "docs", name: "Docs", href: "/docs" },
  ];
  apps.pinned = ["mail"];
  apps.addEventListener("tc-app-select", (e) => {
    e.preventDefault(); // route inside the single-page app instead of loading the page
    console.log("open", e.detail.id);
  });
</script>
```

```tsx
import { useState } from "react";
import { AppPicker, type AppPickerApp } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const APPS: AppPickerApp[] = [
  { id: "mail", name: "Mail", href: "/mail", description: "Your inbox and shared mailboxes" },
  { id: "calendar", name: "Calendar", href: "/calendar" },
];

export function Header({ navigate }: { navigate: (href: string) => void }) {
  const [pinned, setPinned] = useState<string[]>(["mail"]);
  return (
    <AppPicker
      apps={APPS}
      current="mail"
      pinnable
      pinned={pinned}
      onPinnedChange={setPinned}
      onSelect={(app) => {
        navigate(app.href ?? "/");
        return false;
      }}
    />
  );
}
```
