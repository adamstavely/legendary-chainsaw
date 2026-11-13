---
pattern: grid
status: new
related: network-log, run-log, trace-waterfall, json-viewer
---

## Overview

Every request an app made to a model provider, one line each: when, the provider and model, the endpoint, the status
(an error also in words, such as "429 Rate limited"), the latency with a small bar, input and output tokens, the cost
and whether the provider's cache answered. Chips filter by status class – 2xx, 4xx, 5xx and rate limited – and by
model. Choosing a request opens it under the list: its request and response bodies and both header sets, with secrets
masked, and Copy as cURL, whose auth header is redacted too.

## When to use

- The request log of an AI gateway or proxy, where people look for errors, slow calls and rate limits.
- Debugging one agent run's model calls, with their bodies.
- Checking what a cache hit saved, call by call.

## When not to use

- A web page's own network requests – use `network-log`.
- Agent runs rather than single model calls – use `run-log`.
- Where the time went inside one run – use `trace-waterfall`.
- One response to read – use `json-viewer`.

## Anatomy

1. **Filters** `.ui-rqlg__filters` – chip groups `.ui-rqlg__chips` for status class and model, each chip `.ui-rqlg__chip` with its count
2. **Header row** `.ui-rqlg__head` – the column names
3. **Request** `.ui-rqlg__row` – time `.ui-rqlg__time`, model `.ui-rqlg__model`, endpoint `.ui-rqlg__endpoint`, status `.ui-rqlg__status` with its words `.ui-rqlg__said`, latency `.ui-rqlg__latency` with its bar `.ui-rqlg__bar`, tokens `.ui-rqlg__tokens`, cost `.ui-rqlg__cost` and cache `.ui-rqlg__cache`
4. **Footer** `.ui-rqlg__foot` – requests, errors, median latency and cost
5. **Details** `.ui-rqlg__detail` – the Request, Response and Headers tabs `.ui-rqlg__tabs`, Copy as cURL `.ui-rqlg__curl`, Close `.ui-rqlg__close`, header lists `.ui-rqlg__pairs`, and a text body `.ui-rqlg__text` or a JSON Viewer `.ui-rqlg__json`
6. **Empty** `.ui-rqlg__empty` – "No requests yet", or "No requests match" when the filters hide everything

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Successful codes are green; 4xx and rate-limited ones amber, 5xx and no response red – and every error is also
written in words. Latency bars are scaled to the slowest request shown. Masked values read "[redacted]" in italics. A
page can set `--tc-rqlg-cols` and `--tc-rqlg-cols-narrow`, the column widths, `--tc-rqlg-bar-h`, the latency bar's
height, and `--tc-rqlg-icon`. When the card is narrower than 560 px only time, model, status and latency show.

## Keyboard

The chip groups, the list and the details' tabs are a tab stop each.

| Key | What it does |
|---|---|
| ← / → in a chip group | Move between chips |
| Enter / Space on a chip | Shows or hides that class or model |
| ↑ / ↓ | Move between requests |
| Home / End | Go to the newest or oldest request shown |
| Enter / Space | Opens a request's details |
| Esc | Closes the details |
| ← / → in the tabs | Switch between Request, Response and Headers |

## Screen readers

The list is a `grid` named by the heading, with column headers. Each request is a `row` with `aria-selected`; the open
one has `aria-controls` pointing at its details, a region named by its method and endpoint. Latency bars are hidden,
since the time is written. The details' tabs are a `tablist`. The chips are toggle buttons with `aria-pressed` in named
groups. A `role="status"` says when the cURL command is copied.

## Content

- Give `at` in epoch ms and `latency` in ms; the list shows the newest first.
- Use `status: 0` for a request that got no response; it counts with the 5xx.
- Pass parsed objects as bodies for JSON, and strings for anything else.
- Set `baseUrl` once, or `url` per request, so Copy as cURL has a full address.

## Do

- Add your own secret header and body keys to `redact` (they're compared without case, `-` or `_`).
- Keep the provider's own model names, so they match its bills and dashboards.

## Don't

- Don't rely on masking alone for data people mustn't see; strip it before it reaches the page.
- Don't listen for the JSON Viewer's own events by name without checking the target: its `tc-copy` bubbles through
  the log.

## Example

```html
<tc-request-log id="requests" base-url="https://api.provider.example"></tc-request-log>

<script type="module">
  import "@adamstavely/trenchcoat/request-log";
  import "@adamstavely/trenchcoat/tokens.css";

  const log = document.querySelector("#requests");
  const t = Date.UTC(2026, 10, 3, 9, 14);
  log.requests = [
    { id: "q1", at: t, provider: "Provider", model: "large-1", endpoint: "/v1/messages", status: 200, latency: 2840, inputTokens: 8120, outputTokens: 610, cost: 0.0532, cacheHit: true, requestHeaders: { authorization: "Bearer sk-live-7f3a9c" }, requestBody: { model: "large-1" } },
    { id: "q2", at: t + 4000, provider: "Provider", model: "large-1", endpoint: "/v1/messages", status: 429, latency: 180, responseBody: { error: { type: "rate_limit_error" } } },
  ];
  log.addEventListener("tc-request-open", (e) => console.log("open", e.detail.id));
</script>
```

```tsx
import { RequestLog, type ProviderRequest } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ModelCalls({ requests }: { requests: ProviderRequest[] }) {
  return <RequestLog requests={requests} baseUrl="https://api.provider.example" defaultClasses={["4xx", "5xx", "rate-limited"]} onRequestOpen={(id) => console.log("open", id)} />;
}
```
