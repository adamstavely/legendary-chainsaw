---
pattern: list
status: new
related: access-review, share-panel, entity-timeline, alert-feed
---

## Overview

Who did what and when, for the record. Events are grouped by day, newest first, each with an outcome in words. Search and
a filter by outcome narrow it, a row with details opens to show them, and the events showing can be exported as CSV.

## When to use

- Showing the history of sensitive data or actions to reviewers and auditors.
- Answering "who shared this, and when?".

## When not to use

- The story of one person or case – use `entity-timeline`.
- What needs attention now – use `alert-feed`.
- Deciding who keeps access – use `access-review`.

## Anatomy

1. **Bar** `.ui-aud__bar` – search, the outcome filter and Export
2. **Day** `.ui-aud__day` – one day's events, under `.ui-aud__date`
3. **Event** `.ui-aud__event` – `.ui-aud__time`, who did what in `.ui-aud__line`, and `.ui-aud__outcome`
4. **Details** `.ui-aud__more` – opens `.ui-aud__detail`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through search, the filter, Export and each Details button |
| Enter / Space | Opens or closes a row's details |

## Screen readers

Each day is a named section with a heading and a list of events. Outcomes are words, and times are `time` elements.
Details buttons use `aria-expanded` and `aria-controls`, and name the event. `role="status"` announces how many events
match while searching or filtering.

## Content

Write `action` as a past-tense verb that reads on from the name: "Noor Haddad shared". Failed attempts belong in the
record too, especially denied ones. Set `time-zone` when reviewers need one shared clock, because the default is each
browser's own. Cells a spreadsheet would run as a formula are exported with a leading apostrophe.

## Do

- Page or limit `events` on the server for long histories. This filters only what it's given.
- Listen for `tc-export` to log who exported, or call `preventDefault()` to export on the server instead.

## Don't

- Don't treat this as the record. It displays events, and can't make them tamper-proof.

## Example

```html
<tc-audit-trail id="trail"></tc-audit-trail>

<script type="module">
  import "trenchcoat/audit-trail";
  import "trenchcoat/tokens.css";

  document.querySelector("#trail").events = [{ id: "1", at: Date.UTC(2026, 9, 31), actor: "Noor Haddad", action: "shared", target: "Trial 12" }];
</script>
```

```tsx
import { AuditTrail, type AuditEvent } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const events: AuditEvent[] = [{ id: "1", at: Date.UTC(2026, 9, 31), actor: "Noor Haddad", action: "shared", target: "Trial 12" }];

export function Record() {
  return <AuditTrail events={events} timeZone="UTC" />;
}
```
