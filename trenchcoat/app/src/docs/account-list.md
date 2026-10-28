---
pattern: list
status: new
related: money-flow, document-list, secret-field, data-table
---

## Overview

The financial accounts linked to a person or a company. Each row shows:
- the institution, and where the account sits;
- what kind of account it is, such as "Business operating" or "Offshore-linked";
- its identifier, IBAN-style, masked to the last four characters until someone shows it;
- an optional amount, such as a balance or the volume flagged on it;
- a status pill: Monitored, Flagged, Under review, Closed, or statuses of your own;
- a View button.

A strip of your own stats can sit above the list, such as "€428K flagged volume", "4 linked accounts" and "2 shell
entities". Showing an identifier is one row at a time and fires a cancelable event, so a page can ask for a reason or
log it first.

## When to use

- The accounts behind an anti-money-laundering, fraud or audit review.
- A customer's or a supplier's accounts in a due-diligence (KYC) file.
- Any short set of accounts where each one's status matters more than its transactions.

## When not to use

- How money moved between entities – use `money-flow`.
- Identity documents rather than accounts – use `document-list`.
- One secret value to show and copy – use `secret-field`.
- Hundreds of accounts or transactions to sort and filter – use `data-table`.

## Anatomy

1. **Count** `.ui-acl__count` – how many accounts are linked
2. **Stats** `.ui-acl__stats` – your own figures above the list
3. **Row** `.ui-acl__row` – one account
4. **Identifier** `.ui-acl__number` – masked to its last four characters until shown
5. **Amount** `.ui-acl__amount` – a balance or flagged volume, with what it is
6. **Note** `.ui-acl__note` – one line on why it's flagged
7. **Status** `.ui-acl__pill` – the status as a tint, a mark and a word
8. **Show identifier** `.ui-acl__reveal` – shows or masks the identifier again
9. **View** `.ui-acl__view` – opens the account

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight institution names.
Clean is one white card with the header as its first row. The stats, pills, masking and buttons are the same in both.

## Keyboard

The rows' buttons are one tab stop; inside the list the arrows move between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the same button in the previous or next row |
| ← / → | Moves between a row's Show identifier and View buttons |
| Home / End | Moves to the first or last row |
| Enter / Space | Shows or masks the identifier; opens the account |
| Tab | Leaves the list |

## Screen readers

The list is named by the heading and described by “Up and down arrows move between accounts, left and right between
an account's buttons”. A masked identifier reads “Identifier ending 0189, hidden”, and a shown one reads in full. Show
identifier is a toggle button (`aria-pressed`) labelled with the account, “Show identifier, Banque Rhône, Business
operating”. View is labelled “View Banque Rhône, Business operating”. Status pills read their word; the marks are
hidden. Showing or masking an identifier is confirmed in a polite status message, “Banque Rhône identifier shown”.
The stats are a description list: each value with its label.

## Content

- Name institutions the way they trade, and put the branch or city in `branch`.
- Say what the amount is in its `label`: “Flagged · 90 days”, “Balance”, “Cash-in · 90 days”.
- Write a `note` for every flagged account, saying what's wrong: “Three transfers to a newly registered holding
  company”.
- Rename or add statuses with `statuses`: `{ frozen: { label: "Frozen", tone: "danger" } }`.

## Do

- Keep `masked` on wherever identifiers are personal data, and log reveals from `tc-revealed-change`.
- Give each amount its currency when it differs from the element's `currency`.
- Pair View with the account's transactions or the money flow that involves it.

## Don't

- Don't use tones for anything but the account's standing – red means flagged.
- Don't put the full identifier in `note`; that defeats the masking.
- Don't turn `masked` off just to save a click in a shared or screen-shared view.

## Example

```html
<tc-account-list id="accounts" heading="Linked accounts"></tc-account-list>

<script type="module">
  import "trenchcoat/account-list";
  import "trenchcoat/tokens.css";

  const accounts = document.querySelector("#accounts");
  accounts.stats = [{ id: "volume", label: "Flagged volume", value: "€428K", detail: "last 90 days" }];
  accounts.accounts = [
    { id: "a1", institution: "Banque Rhône", branch: "Lyon", country: "France", type: "Business operating", number: "FR7630006000011234567890189", status: "flagged", amount: { value: 298000, label: "Flagged · 90 days" } },
    { id: "a2", institution: "Limassol Trust", country: "Cyprus", type: "Holding company", status: "closed" },
  ];
  accounts.addEventListener("tc-revealed-change", (e) => console.log("revealed", e.detail.id));
  accounts.addEventListener("tc-open", (e) => console.log("open", e.detail.account.id));
</script>
```

```tsx
import { AccountList, type AccountRecord } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const accounts: AccountRecord[] = [
  { id: "a1", institution: "Banque Rhône", country: "France", type: "Business operating", number: "FR7630006000011234567890189", status: "flagged" },
  { id: "a2", institution: "Limassol Trust", country: "Cyprus", type: "Holding company", status: "closed" },
];

export function Accounts() {
  return <AccountList title="Linked accounts" accounts={accounts} onOpen={(a) => console.log(a.id)} onRevealedChange={(ids) => console.log(ids)} />;
}
```
