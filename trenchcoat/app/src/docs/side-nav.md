---
pattern: none
status: new
related: header-nav, breadcrumbs, icon-rail, session-list
---

## Overview

An app's main navigation down the side of the page: the product's name and logo at the top, then the places in the
app – each with an icon, and a count or a short word when something waits there – one of them the current page. The
page's own children sit at the bottom: a reminder, an upgrade offer, a setup guide. Items with `href` are real links,
so a middle-click or ⌘/Ctrl-click opens a new tab; every plain click fires a cancelable `tc-navigate`, so a
single-page app's router can take it instead. `collapsible` adds a button that folds the bar into an icon-only rail.

## When to use

- The top-level places of an app with more than a handful of them, or with counts to show.
- Apps people stay in for long stretches, where a permanent bar is worth its width.

## When not to use

- The tools at the right end of an app header – use `header-nav`.
- Where the current page sits in a hierarchy – use `breadcrumbs`.
- A row of views for one panel – use `icon-rail`.
- A list of conversations or sessions – use `session-list`.

## Anatomy

1. **Head** `.ui-snav__head` – the brand and the collapse button
2. **Brand** `.ui-snav__brand` – the logo and the product's name, a link when `brand-href` is set
3. **Collapse** `.ui-snav__toggle` – folds the bar into a rail and back
4. **Nav** `.ui-snav__nav` – the navigation landmark, named by `label`
5. **Section** `.ui-snav__section` – a caption over a group of items
6. **Link** `.ui-snav__link` – one place: a link, or a button when it has no `href`
7. **Icon** `.ui-snav__icon` – the item's icon, or its first letter
8. **Badge** `.ui-snav__badge` – a count or a short word after the label

## Looks

Standard is a gray bar, like the page behind a white panel, with the current item on a white pill. Clean is a white
bar with a hairline edge and the current item tinted in the accent. `--tc-snav-width` and `--tc-snav-rail` on
`tc-side-nav` set the width open and as a rail; `--tc-snav-icon` sets the icons' size.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the brand, the collapse button, each item, then the page's footer content |
| ↓ / ↑ | Next or previous item |
| Home / End | First or last item |
| Enter | Follows the link, or chooses a button item |
| Enter / Space (on Collapse) | Folds or unfolds the bar |

## Screen readers

A `nav` landmark named by `label` (“Main”) holds a list of links; a group with a section caption is named by it. The
current page is `aria-current="page"`. A badge is part of its item's name (“Portfolio 12”). Disabled items are
`aria-disabled` links that can't be focused. In the rail the labels are still read, and show as tooltips. The
collapse button says whether the bar is open (`aria-expanded`), and folding announces “Navigation collapsed”.

## Content

- Name each place with a noun people use for it: “Portfolio”, “Reports”, not “Manage portfolio”.
- Keep badges to counts and one short word; a badge that's always there stops being read.
- Put admin and rarely used places in their own section at the end.

## Do

- Set `current` from your router so the highlight follows the URL, back button included.
- Give every item an icon if any has one, so the rail stays readable.

## Don't

- Don't put actions (“New study”) among the places – put them in the page.
- Don't hide the current page's item in a collapsed section.

## Example

```html
<tc-side-nav brand="Halden Institute" brand-href="/" current="portfolio" collapsible>
  <p>Portfolio review in 6 days</p>
</tc-side-nav>

<script type="module">
  import "@adamstavely/trenchcoat/side-nav";
  import "@adamstavely/trenchcoat/tokens.css";

  const nav = document.querySelector("tc-side-nav");
  nav.items = [
    { id: "home", label: "Overview", href: "/" },
    { id: "portfolio", label: "Portfolio", href: "/portfolio", badge: 12 },
    { id: "team", label: "Team", href: "/team", section: "Institute" },
  ];
  nav.addEventListener("tc-navigate", (e) => console.log(e.detail.id, e.detail.href));
</script>
```

```tsx
import { SideNav, type SideNavItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: SideNavItem[] = [
  { id: "home", label: "Overview", href: "/" },
  { id: "portfolio", label: "Portfolio", href: "/portfolio", badge: 12 },
  { id: "team", label: "Team", href: "/team", section: "Institute" },
];

export function AppNav({ current, go }: { current: string; go: (href: string) => void }) {
  return (
    <SideNav
      brand="Halden Institute"
      brandHref="/"
      items={items}
      current={current}
      collapsible
      onNavigate={(_id, href, event) => {
        if (!href) return;
        event.preventDefault();
        go(href);
      }}
    >
      <p>Portfolio review in 6 days</p>
    </SideNav>
  );
}
```
