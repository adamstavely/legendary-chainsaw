---
pattern: list
status: new
related: preview-frame, web-vitals, file-tree, process-list
---

## Overview

An app's pages as an indented list that follows the paths: each route with its path in mono (with `:params` picked
out), a status mark and word, how long it took to load and when it was last visited. Pressing a route chooses it and
fires `tc-open`, so the page can show it in a `preview-frame`. Status chips with counts filter the list; the routes
above a match stay, quieter, so the shape holds.

## When to use

- Beside a preview while building a site, to jump between pages and see which are broken or slow.
- A smoke-test summary after a deploy: every route, with what happened when it was visited.

## When not to use

- A project's source files – use `file-tree`.
- One page's loading measures in detail – use `web-vitals`.
- The servers behind the routes – use `process-list`.

## Anatomy

1. **Chips** `.ui-rmap__chips` – a toggle per status, with its count
2. **Row** `.ui-rmap__row` – a route, indented by level, with its `data-status`
3. **Path** `.ui-rmap__path` – the parent's part quieter (`.ui-rmap__lead`), each **param** `.ui-rmap__param` picked out
4. **Name** `.ui-rmap__name` – the route's name for people
5. **Status** `.ui-rmap__status` – a mark and a word
6. **Load time** `.ui-rmap__load` – "610 ms", "2.4 s"
7. **Last visited** `.ui-rmap__visited` – "3 min. ago", or a dash for never

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
A page can set `--tc-rmap-indent`, the step per level. Below about 30rem the names and the last-visited column hide.

## Keyboard

The rows are one tab stop; the chips are buttons in the tab order before them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the route above or below |
| Home / End | Moves to the first or last route |
| Enter / Space | Chooses and opens the route |

## Screen readers

The routes are a list named by the heading and described by a hidden note of the keys; each is a button that reads the
full path, the name, the status word, the load time and the last visit ("Never" when it hasn't been). The chosen route
has `aria-current="true"`. The chips are toggle buttons (`aria-pressed`) in a group named "Filter by status". Opening a
route is announced through a polite status.

## Content

- Write paths as the router does, with `:params`; a child's path includes its parent's.
- Pass `loadMs` and `lastVisited` from the last real visit; leave them out for routes never visited.
- Pass `now` to keep the times still, as in a screenshot.
- A `status` it doesn't know counts as not visited.

## Do

- Open the route in a `preview-frame` on `tc-open`.
- Mark a route "slow" from your own threshold, and say what it is in `description`.

## Don't

- Don't list every generated page (each grant, each reviewer); list the route pattern once.
- Don't rely on colour alone – keep the status words.

## Example

```html
<tc-route-map id="routes" description="staging.halden.example"></tc-route-map>

<script type="module">
  import "trenchcoat/route-map";
  import "trenchcoat/tokens.css";

  const el = document.querySelector("#routes");
  el.routes = [
    { id: "home", path: "/", status: "ok", loadMs: 420 },
    { id: "grants", path: "/grants", status: "ok", children: [{ id: "grant", path: "/grants/:id", status: "slow", loadMs: 2380 }] },
  ];
  el.addEventListener("tc-open", (e) => console.log("preview", e.detail.route.path));
</script>
```

```tsx
import { RouteMap, type RouteItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const routes: RouteItem[] = [
  { id: "home", path: "/", status: "ok", loadMs: 420 },
  { id: "apply", path: "/grants/:id/apply", status: "error" },
];

export function Routes({ onOpen }: { onOpen: (path: string) => void }) {
  return <RouteMap routes={routes} defaultSelected="home" onTcOpen={(e) => onOpen(e.detail.route.path)} />;
}
```
