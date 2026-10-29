---
pattern: none
status: new
related: header-nav, tree-select, document-list, command-menu
---

## Overview

A trail of links from the top of a hierarchy down to the page you're on: Library › Special collections › Maritime
archive › Survey of the north quay. Each step is a link back up; the last is the current page and isn't a link. When
the trail is wider than its space – or longer than `max` – the middle folds into “…”, a button that lists the folded
steps. Every click fires a cancelable `tc-navigate`, so a single-page app can route it itself, and `copy-path` adds a
button that copies the trail as text.

## When to use

- Pages deep in a hierarchy – archives, folders, documentation, product categories – where people move up a level
  or two.
- Search results or detail views that need to say where something lives.

## When not to use

- The app's main sections – use `header-nav`.
- Choosing a place in a hierarchy – use `tree-select`.
- A list of documents in a folder – use `document-list`.
- Jumping anywhere by name – use `command-menu`.

## Anatomy

1. **Nav** `.ui-crumb__nav` – the navigation landmark, named “Breadcrumb”
2. **Item** `.ui-crumb__item` – one step, with its separator
3. **Link** `.ui-crumb__link` – a link, or a button when the step has no `href`
4. **Current page** `.ui-crumb__current` – the last step, `aria-current="page"`
5. **Separator** `.ui-crumb__sep` – a chevron or a slash
6. **More** `.ui-crumb__more` – “…”, opening the folded steps
7. **Menu** `.ui-crumb__menu` – the folded steps as a list of links
8. **Copy path** `.ui-crumb__copy` – copies the trail as text

## Looks

Standard is secondary text with chevrons and a little room between steps. Clean is a size smaller, muted and
tighter, with the current page in medium weight. Neither is a card. `--tc-crumb-label-max` on `tc-breadcrumbs` sets
how long a label grows before it's cut (it shows in full on hover).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the links, “…” and Copy path |
| Enter | Follows a link, or opens the folded steps from “…” |
| ↓ (on “…”) | Opens the folded steps and focuses the first |
| ↓ / ↑ (in the menu) | Next or previous folded step |
| Home / End (in the menu) | First or last folded step |
| Escape (in the menu) | Closes it and returns to “…” |

## Screen readers

A `nav` landmark named by `label` (“Breadcrumb”) holds an ordered list, so the number of steps is read. The current
page is `aria-current="page"`. Separators are hidden. “…” is named “Show 3 more” and says whether its list is open
(`aria-expanded`, `aria-controls`). Copying announces “Path copied”.

## Content

- Use each page's own title as its label, shortened if it must be – the full text shows on hover.
- Start at the top people recognise (“Library”), not a technical root.
- Leave `href` off steps the app routes itself, and handle `tc-navigate`.

## Do

- Keep the first step and the current page visible – folding does this for you.
- Use `max` where space is fixed and the trail varies, so it doesn't jump.

## Don't

- Don't make the current page a link to itself.
- Don't use breadcrumbs for the steps of a process – use a stepper.

## Example

```html
<tc-breadcrumbs copy-path></tc-breadcrumbs>

<script type="module">
  import "trenchcoat/breadcrumbs";
  import "trenchcoat/tokens.css";

  const trail = document.querySelector("tc-breadcrumbs");
  trail.items = [
    { label: "Library", href: "/", icon: "home" },
    { label: "Maritime archive", href: "/maritime" },
    { label: "Survey of the north quay" },
  ];
  trail.addEventListener("tc-navigate", (e) => console.log(e.detail.index));
</script>
```

```tsx
import { Breadcrumbs, type BreadcrumbItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const trail: BreadcrumbItem[] = [
  { label: "Library", href: "/", icon: "home" },
  { label: "Maritime archive", href: "/maritime" },
  { label: "Survey of the north quay" },
];

export function Trail({ go }: { go: (href: string) => void }) {
  return (
    <Breadcrumbs
      items={trail}
      onNavigate={(item, _index, event) => {
        if (!item.href) return;
        event.preventDefault();
        go(item.href);
      }}
    />
  );
}
```
