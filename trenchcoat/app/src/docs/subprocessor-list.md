---
pattern: table
status: new
related: trust-center, data-handling-policy, data-table, legal-hold-manager
---

## Overview

Every vendor that touches customer data, as a vendor publishes it for its customers. Each row shows:
- the subprocessor's name and what it does for the service;
- the kinds of customer data it handles, as chips;
- where it processes them, and the transfer mechanism that makes that lawful;
- when it was added;
- whether it's Active, New (with the date it takes effect) or Removed, as a tint, a mark and a word.

Search and the data-category and location filters narrow the list; Export CSV saves what's shown; Subscribe to changes
takes an email address, checked in words before it's sent.

## When to use

- A vendor's public subprocessor page, or the same list inside an admin's compliance settings.
- Telling customers about a new subprocessor before it starts processing their data.
- A procurement review that checks where a vendor's data goes.

## When not to use

- The data-handling rules your organisation sets – use `data-handling-policy`.
- A large dataset to sort and edit – use `data-table`.
- Items held for a legal reason – use `legal-hold-manager`.

## Anatomy

1. **Search** `.ui-sbp__query` – matches names, purposes, locations, transfers and categories
2. **Filters** `.ui-sbp__filter` – data category and location
3. **Export CSV** `.ui-sbp__export` – saves the rows shown
4. **Row** `.ui-sbp__row` – one subprocessor
5. **Data categories** `.ui-sbp__chips` – the kinds of data it handles
6. **Status** `.ui-sbp__pill` – Active, New from a date, or Removed on a date
7. **Subscribe** `.ui-sbp__subscribe` – an email field for change notices
8. **Error** `.ui-sbp__error` – what's wrong with the email, in words

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. Under 560px wide, each subprocessor becomes a card, with the column names shown as labels.

## Keyboard

The table isn't interactive; the controls above and below it are ordinary fields and buttons in tab order.

| Key | What it does |
|---|---|
| Tab | Moves through search, the filters, Export CSV and Subscribe |
| Enter | In the email field, subscribes |
| Arrow keys | In a filter, change it |

## Screen readers

The table is named by the heading, with column headers and each subprocessor's name as its row header, so a cell reads
with both. Explicit table roles keep that in the narrow card layout. Statuses read as words ("New from 1 Dec 2026").
Each search or filter change announces how many subprocessors are shown, or that none match. A bad email is
announced, marked `aria-invalid` and described by the error; subscribing is confirmed in a polite status message.

## Content

- Write `purpose` as what the vendor does for the service: "Model inference", not the vendor's tagline.
- Use the same words for `categories` across vendors, so the filter groups them.
- Give `effective` for every new and removed subprocessor.
- Name the transfer mechanism plainly: "Standard Contractual Clauses", "Within the EEA".

## Do

- List a new subprocessor before it starts, with the date it takes effect.
- Keep removed ones for a while, marked Removed, so customers can see the change.
- Send change notices to everyone who subscribed, from `tc-subscribe`.

## Don't

- Don't leave out vendors that only see metadata; account data counts.
- Don't reorder the list to hide a new vendor.
- Don't use the status tints for anything but where a subprocessor stands.

## Example

```html
<tc-subprocessor-list id="subs"></tc-subprocessor-list>

<script type="module">
  import "@adamstavely/trenchcoat/subprocessor-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const subs = document.querySelector("#subs");
  subs.subprocessors = [
    { id: "nh", name: "Northwind Hosting", purpose: "Cloud hosting", categories: ["Account data", "Customer content"], location: "Ireland", transfer: "Within the EEA", status: "active" },
    { id: "ls", name: "Lumen Search", purpose: "Retrieval index", categories: ["Customer content"], location: "Ireland", status: "new", effective: Date.UTC(2026, 11, 1) },
  ];
  subs.addEventListener("tc-subscribe", (e) => console.log("subscribe", e.detail.email));
</script>
```

```tsx
import { SubprocessorList, type Subprocessor } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const subprocessors: Subprocessor[] = [
  { id: "nh", name: "Northwind Hosting", purpose: "Cloud hosting", categories: ["Customer content"], location: "Ireland", status: "active" },
];

export function Subprocessors() {
  return <SubprocessorList title="Subprocessors" subprocessors={subprocessors} onSubscribe={(email) => console.log(email)} onCategoryChange={(c) => console.log(c)} />;
}
```
