---
pattern: tabs
status: new
related: schema-fields, code-block, json-viewer, network-log
---

## Overview

An endpoint's example responses for a reference page, one tab per status: "200 OK", "404 Not found", "429 Too many
requests". Each tab's status class shows as a mark, a colour and a word, so colour is never the only cue. A tab holds
what the response means, its headers (folded) and its body, pretty-printed with syntax colours and Copy. When a status
has bodies in several media types, a select picks one.

## When to use

- The responses section of an API reference page.
- Showing what a webhook, callback or export looks like, status by status.

## When not to use

- The fields of a response, with types and meaning – use `schema-fields` beside it.
- A response someone actually received, to review – use `json-viewer`.
- The requests a page made – use `network-log`.

## Anatomy

1. **Tabs** `.ui-rex__tabs` – one per status
2. **Tab** `.ui-rex__tab` – the status's mark, `.ui-rex__code` and `.ui-rex__reason`
3. **Panel** `.ui-rex__panel` – the chosen status's response
4. **Description** `.ui-rex__desc` – what the response means
5. **Headers** `.ui-rex__headers-toggle` and `.ui-rex__headers` – the response headers, folded
6. **Media type** `.ui-rex__select` – which body to show, when there are several
7. **Body** `.ui-rex__body` – a `tc-code-block` with syntax colours and Copy
8. **No body** `.ui-rex__nobody` – said when the status has none, such as 304

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`--tc-rex-indicator` sets the thickness of the chosen tab's underline. The body is a bare `tc-code-block`, so its
`--tc-code-block-*` properties set the syntax colours.

## Keyboard

The tabs are one tab stop; choosing a tab shows its panel straight away.

| Key | What it does |
|---|---|
| ← / → | Move to the previous or next tab and show it |
| Home / End | Go to the first or last tab |
| Tab | Move into the panel: Headers, the media type, then the body's Copy |

## Screen readers

The tabs follow the WAI-ARIA tabs pattern: a tablist named by the heading, each tab controlling its panel. A tab reads
its code, its reason and its class – "404 Not found, Client error". Headers is a disclosure button with
`aria-expanded`, and the media type select has a visible label.

## Content

- Use the standard reason phrase; set `label` only when your API uses another ("Rate limited").
- Describe each response in terms of what the caller should do next.
- Keep bodies realistic and short: one record, not a page of them.

## Do

- Put the success response first; that's the tab that shows.
- Include the headers a client must read, such as `Retry-After` and `ETag`.

## Don't

- Don't put secrets or real personal data in examples.
- Don't list every status the server could return – show the ones a client should handle.

## Example

```html
<tc-response-examples id="responses" heading="GET /records/{id}"></tc-response-examples>

<script type="module">
  import "@adamstavely/trenchcoat/response-examples";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#responses").examples = [
    { status: 200, headers: { ETag: '"r4812-v9"' }, body: { id: "REC-004812", title: "Annual audit 2026" } },
    { status: 404, description: "No record has that id.", body: { error: "not_found" } },
    { status: 429, label: "Rate limited", headers: { "Retry-After": "30" }, body: { error: "rate_limited" } },
  ];
</script>
```

```tsx
import { ResponseExamples, type ResponseExample } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const examples: ResponseExample[] = [
  { status: 200, body: { id: "REC-004812", title: "Annual audit 2026" } },
  { status: 404, description: "No record has that id.", body: { error: "not_found" } },
];

export function RecordResponses({ status, onStatusChange }: { status: string; onStatusChange: (status: string) => void }) {
  return <ResponseExamples title="GET /records/{id}" examples={examples} status={status} onStatusChange={onStatusChange} />;
}
```
