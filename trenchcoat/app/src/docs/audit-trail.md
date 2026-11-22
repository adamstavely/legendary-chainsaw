---
pattern: list
status: new
related: access-review, share-panel, entity-timeline, alert-feed
---

## Overview

Who did what and when, for the record. Events are grouped by day, newest first, each with an outcome in words. A row
with details or changes opens to show them: `changes` lists what an edit changed as a small Field / Before / After
table, with a value that was added or removed said in words, and fields that didn't change left out.

Search covers who, what, on what and the changed fields and values. Filters narrow it by outcome, Person (`actor`), Type
(`action`) and Date (`range`: today, the last 7 or 30 days, or any time – measured from `now`, or the clock when it isn't
given). Each filter is the page's to own through its own cancelable change event, Clear filters undoes them all, and the
count in the header says how many of how many events show. Export gives the events showing as CSV, with a changes column
when any of them have changes.

## When to use

- Showing the history of sensitive data or actions to reviewers and auditors.
- Answering "who shared this, and when?" – and "what did they change?".

## When not to use

- The story of one person or case – use `entity-timeline`.
- What needs attention now – use `alert-feed`.
- Deciding who keeps access – use `access-review`.

## Anatomy

1. **Bar** `.ui-aud__bar` – search, then `.ui-aud__filters`: the outcome, `.ui-aud__actor`, `.ui-aud__action` and `.ui-aud__range` filters, `.ui-aud__clear`, and Export
2. **Day** `.ui-aud__day` – one day's events, under `.ui-aud__date`
3. **Event** `.ui-aud__event` – `.ui-aud__time`, who did what in `.ui-aud__line`, and `.ui-aud__outcome`
4. **Details** `.ui-aud__more` – opens `.ui-aud__detail` and `.ui-aud__changes`, the Field / Before / After table, where `.ui-aud__kind` says added or removed

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
At narrow widths the search takes the whole first row and the filters wrap onto the next.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through search, the four filters, Clear filters, Export and each Details button |
| Enter / Space | Opens or closes a row's details |

## Screen readers

Each day is a named section with a heading and a list of events. Outcomes are words, and times are `time` elements.
Details buttons use `aria-expanded` and `aria-controls`, and name the event. Changes are a table with a caption, column
headers and the field as each row's header; an empty value is read as "none", and added or removed are words beside the
field. Each filter is a select named Outcome, Person, Type or Date. `role="status"` announces how many events match while
searching or filtering.

## Content

Write `action` as a past-tense verb that reads on from the name: "Noor Haddad shared" – the Type filter lists them, so
keep the same verb for the same kind of action. Name `changes` fields as people see them on screen ("Risk score", not
`risk_score`), and give values as they'd be shown. Failed attempts belong in the
record too, especially denied ones. Set `time-zone` when reviewers need one shared clock, because the default is each
browser's own. Cells a spreadsheet would run as a formula are exported with a leading apostrophe.

## Do

- Page or limit `events` on the server for long histories. This filters only what it's given.
- Listen for `tc-export` to log who exported, or call `preventDefault()` to export on the server instead.
- Own the filters (`actor`, `action`, `range`) when the server pages the record, and fetch what they select.

## Don't

- Don't treat this as the record. It displays events, and can't make them tamper-proof.

## Example

```html
<tc-audit-trail id="trail"></tc-audit-trail>

<script type="module">
  import "@adamstavely/trenchcoat/audit-trail";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#trail").events = [{ id: "1", at: Date.UTC(2026, 9, 31), actor: "Noor Haddad", action: "shared", target: "Trial 12" }];
</script>
```

```tsx
import { useState } from "react";
import { AuditTrail, type AuditEvent } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const events: AuditEvent[] = [
  { id: "1", at: Date.UTC(2026, 9, 31), actor: "Noor Haddad", action: "shared", target: "Trial 12" },
  { id: "2", at: Date.UTC(2026, 9, 31, 9), actor: "Priya Raman", action: "updated", target: "Trial 12 policy", changes: [{ field: "Expires", after: "31 January 2027" }] },
];

export function Record() {
  const [actor, setActor] = useState("");
  return <AuditTrail events={events} timeZone="UTC" actor={actor} onActorChange={setActor} />;
}
```
