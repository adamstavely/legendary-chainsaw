---
pattern: grid
status: new
related: console-panel, preview-frame, json-viewer, data-table
---

## Overview

The requests a web page made. Each row shows its status, method, name, type, size and time, and a waterfall bar placed by
when it started and how long it took. Type chips narrow the list. Choosing a request opens its details under the list:
Headers, with the URL, method, status and both header sets, and Response, with an object body in a JSON Viewer or a text
body as it came. A footer counts the requests, their size and when the last one finished. Nothing here watches a real
network: the page passes `requests`.

## When to use

- The network tab of a page shown in a `preview-frame`, beside a session or editor.
- Requests captured from a test run or a recorded session, to see what failed and why.
- Any set of HTTP calls where timing and status matter more than their order on a list.

## When not to use

- One API response to read – use `json-viewer`.
- The page's console messages – use `console-panel`.
- A general table of records – use `data-table`.

## Anatomy

1. **Type chips** `.ui-netl__chips` – All, then one chip per type with its count
2. **Header row** `.ui-netl__head` – the column names
3. **Request** `.ui-netl__row` – status `.ui-netl__status`, method `.ui-netl__method`, name `.ui-netl__name`, type `.ui-netl__type`, size `.ui-netl__size` and time `.ui-netl__time`
4. **Waterfall** `.ui-netl__fall` – the request's bar `.ui-netl__bar` across the whole load
5. **Footer** `.ui-netl__foot` – requests, total size and finish time
6. **Details** `.ui-netl__detail` – the Headers and Response tabs `.ui-netl__tabs`, Close `.ui-netl__close`, header lists `.ui-netl__pairs`, and a text body `.ui-netl__text` or a JSON Viewer `.ui-netl__json`
7. **Empty** `.ui-netl__empty` – "No requests", or "No requests match" when the chips hide everything

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Statuses are green for 2xx, gray for 3xx and red for 4xx, 5xx and failed requests, whose name and bar turn red too; the
code or the word "failed" is always written. A page can set `--tc-netl-cols` and `--tc-netl-cols-narrow`, the column
widths, and `--tc-netl-bar-h`, the waterfall's height. When the card is narrower than 480 px, the type, size and
waterfall columns are left out, and in the details each header's name sits above its value.

## Keyboard

The type chips, the list and the details' tabs are a tab stop each.

| Key | What it does |
|---|---|
| ← / → in the chips | Move between type chips |
| Enter / Space on a chip | Shows or hides that type; All shows every type |
| ↑ / ↓ | Move between requests |
| Home / End | Go to the first or last request |
| Enter / Space | Opens a request's details |
| Esc | Closes the details |
| ← / → in the tabs | Switch between Headers and Response |

## Screen readers

The list is a `grid` named by the heading, with column headers. Each request is a `row` with `aria-selected`, and the
open one has `aria-controls` pointing at its details, a region named after the request. The details' tabs are a
`tablist`. The type chips are toggle buttons with `aria-pressed`, in a group named "Request types". The waterfall bars
are hidden from screen readers, since the time column says the same. A `role="status"` says how many requests are shown.

## Content

- Give `start` in ms from the page's start and `duration` in ms; the waterfall spans from 0 to the last request's end.
- Use `status: 0` for a request that failed or never answered.
- Pass a parsed object as `body` for JSON responses, and a string for anything else.
- Give each request a stable `id`; the selection is kept by id.

## Do

- Keep requests in the order they started.
- Leave `size` out when it isn't known; the cell shows a dash.

## Don't

- Don't pass request bodies with secrets or personal data the reader shouldn't see. Everything in `body` and the headers
  is shown.
- Don't listen for the JSON Viewer's own events here by name without checking the target: its `tc-copy`,
  `tc-download` and `tc-filter-change` bubble through the log.

## Example

```html
<tc-network-log id="network"></tc-network-log>

<script type="module">
  import "trenchcoat/network-log";
  import "trenchcoat/tokens.css";

  const log = document.querySelector("#network");
  log.requests = [
    { id: "1", method: "GET", url: "https://staging.halden.example/api/grants", status: 200, type: "fetch", size: 9310, start: 470, duration: 168, body: { total: 24 } },
    { id: "2", method: "GET", url: "https://staging.halden.example/static/img/halden-logo.svg", status: 404, type: "image", size: 412, start: 450, duration: 38 },
  ];
  log.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { NetworkLog, type NetworkRequest } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function PageNetwork({ requests }: { requests: NetworkRequest[] }) {
  return <NetworkLog requests={requests} defaultTypes={["fetch"]} onSelectedChange={(id) => console.log(id)} />;
}
```
