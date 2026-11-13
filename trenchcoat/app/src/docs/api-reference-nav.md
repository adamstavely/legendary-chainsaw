---
pattern: tree
status: new
related: side-nav, tree-select, copy-page-menu, code-block
---

## Overview

The side navigation of an API reference. Endpoints are grouped by resource – Records, Search, Exports – and each one
is a link with its method as a badge, in a colour and a word (GET, POST, PATCH, DELETE), then its short name. The
Paths switch shows each endpoint's path instead (`/v1/records/{id}`). A field filters by name, path or method: groups
with no match drop out and the rest open, and the count above the list says how many match. The current endpoint is
marked `aria-current="page"` and scrolled into view; deprecated endpoints are struck through and say "Deprecated".
Every plain click fires a cancelable `tc-navigate`, so a router can take it; unless it's prevented the endpoint
becomes `current`.

## When to use

- The left column of an API reference or SDK docs site, with more endpoints than fit in a glance.
- Any reference grouped by resource where the method matters as much as the name.

## When not to use

- An app's main navigation – use `side-nav`.
- Choosing an item from a tree in a form – use `tree-select`.
- A single endpoint's request and response – use `code-block` beside the page's own text.

## Anatomy

1. **Paths switch** `.ui-arn__paths` – in the header; shows paths instead of names
2. **Filter** `.ui-arn__filter-input` – filters by name, path or method; every word must match
3. **Count** `.ui-arn__count` – how many endpoints, or how many match the filter
4. **Tree** `.ui-arn__tree` – the groups and their endpoints, scrolling past `--tc-arn-max-h`
5. **Group** `.ui-arn__group` – a resource with a chevron and how many endpoints it holds; opens and closes
6. **Endpoint** `.ui-arn__endpoint` – a link to one endpoint's page
7. **Method** `.ui-arn__method` – the badge: reads in blue, creates in green, changes in amber, deletes in red, others
   neutral
8. **Deprecated** `.ui-arn__deprecated` – the word after a deprecated endpoint's struck-through name

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row, and tints the current endpoint in the accent. `--tc-arn-max-h` on `tc-api-reference-nav` sets how tall the tree
grows before it scrolls (520px by default), and `--tc-arn-method-w` the badges' width.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the Paths switch, the filter, then the tree (one stop) |
| ↓ in the filter | Moves into the tree |
| Escape in the filter | Clears it |
| ↓ / ↑ | Next or previous group or endpoint |
| → | Opens a closed group, or moves to its first endpoint |
| ← | Closes an open group, or moves from an endpoint to its group |
| Home / End | First or last item |
| Enter | Follows an endpoint's link, or opens and closes a group |
| A letter | Moves to the next item that starts with it; keep typing for more letters |

## Screen readers

The card is a `nav` landmark named by the heading, holding a `tree` of rows with their level, position and set size.
Groups are level-1 `treeitem`s with `aria-expanded`, named by their label and count ("Records 5 endpoints");
endpoints are level-2 links with the `treeitem` role, named by their method and name ("PATCH Update a record"), with
the path as their description – or the other way round with Paths on. The current endpoint is
`aria-current="page"`. The filter is labelled "Filter endpoints" and described by the count; a filter's result ("3 of
12 endpoints", or "No endpoints match") is announced politely. The Paths switch is a toggle button (`aria-pressed`).

## Content

- Name endpoints as actions in sentence case: "List records", "Get a record", "Place a legal hold".
- Use the resource's plural noun for groups, in the order people meet them: the main resource first.
- Write paths as the API has them, with `{placeholders}` for parameters.
- Mark an endpoint `deprecated` until it's removed, and say in its page what replaces it.

## Do

- Set `current` from your router, so the highlight follows the URL and the back button.
- Keep a group's endpoints in the order the docs pages run: list, get, create, update, delete.

## Don't

- Don't put guides or tutorials in the tree – link to them above it.
- Don't rely on the badge's colour alone in your own pages; this element always writes the method too.

## Example

```html
<tc-api-reference-nav heading="Records API" description="v1" current="records-get"></tc-api-reference-nav>

<script type="module">
  import "@adamstavely/trenchcoat/api-reference-nav";
  import "@adamstavely/trenchcoat/tokens.css";

  const nav = document.querySelector("tc-api-reference-nav");
  nav.groups = [
    {
      id: "records",
      label: "Records",
      endpoints: [
        { id: "records-list", name: "List records", method: "GET", path: "/v1/records", href: "#records-list" },
        { id: "records-get", name: "Get a record", method: "GET", path: "/v1/records/{id}", href: "#records-get" },
        { id: "records-create", name: "Create a record", method: "POST", path: "/v1/records", href: "#records-create" },
      ],
    },
    {
      id: "exports",
      label: "Exports",
      endpoints: [{ id: "exports-csv", name: "Export as CSV", method: "GET", path: "/v1/records.csv", href: "#exports-csv", deprecated: true }],
    },
  ];
  nav.addEventListener("tc-navigate", (e) => console.log(e.detail.id, e.detail.href));
</script>
```

```tsx
import { ApiReferenceNav, type ApiNavGroup } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const groups: ApiNavGroup[] = [
  {
    id: "records",
    label: "Records",
    endpoints: [
      { id: "records-list", name: "List records", method: "GET", path: "/v1/records", href: "/api/records-list" },
      { id: "records-create", name: "Create a record", method: "POST", path: "/v1/records", href: "/api/records-create" },
    ],
  },
];

export function ReferenceNav({ current, go }: { current: string; go: (href: string) => void }) {
  return (
    <ApiReferenceNav
      title="Records API"
      groups={groups}
      current={current}
      onNavigate={(_id, href, event) => {
        if (!href) return;
        event.preventDefault();
        go(href);
      }}
    />
  );
}
```
