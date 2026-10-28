---
pattern: list
status: new
related: verification-queue, attestation-check, secret-field, data-table
---

## Overview

The identity and record documents on file for a person or an account. Each row shows:
- the document's type and issuing country;
- its number, masked to the last four characters until someone shows it;
- your reference for it, and when it expires;
- a status pill – Active, Verified, Expired, Flagged, Fraudulent, or statuses of your own;
- a View button.

The header counts the documents in each status, so a flagged or fraudulent one stands out at once. Showing a number is
one row at a time and fires a cancelable event, so a page can ask for a reason or log it first.

## When to use

- The documents behind a customer due-diligence (KYC) or onboarding review.
- An employee's right-to-work, licence or certification records.
- Any short set of documents where each one's status matters more than its contents.

## When not to use

- A queue of items waiting for someone to check them – use `verification-queue`.
- Checking a signed evidence package – use `attestation-check`.
- One secret value to show and copy – use `secret-field`.
- Hundreds of documents to sort and filter – use `data-table`.

## Anatomy

1. **Counts** `.ui-dlst__counts` – how many documents are in each status
2. **Row** `.ui-dlst__row` – one document
3. **Number** `.ui-dlst__number` – masked to its last four characters until shown
4. **Reference** `.ui-dlst__ref` – your own id for the record
5. **Expiry** `.ui-dlst__expiry` – when it expires, or expired
6. **Note** `.ui-dlst__note` – one line on why it's flagged or fraudulent
7. **Status** `.ui-dlst__pill` – the status as a tint, a mark and a word
8. **Show number** `.ui-dlst__reveal` – shows or masks the number again
9. **View** `.ui-dlst__view` – opens the document

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight document types. Clean
is one white card with the header as its first row. The pills, masking and buttons are the same in both.

## Keyboard

The rows' buttons are one tab stop; inside the list the arrows move between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the same button in the previous or next row |
| ← / → | Moves between a row's Show number and View buttons |
| Home / End | Moves to the first or last row |
| Enter / Space | Shows or masks the number; opens the document |
| Tab | Leaves the list |

## Screen readers

The list is named by the heading and described by “Up and down arrows move between documents, left and right between
a document's buttons”. A masked number reads “Number ending 471K, hidden”, and a shown one reads in full. Show number
is a toggle button (`aria-pressed`) labelled with the document, “Show number, Passport, Spain”. View is labelled
“View Passport, Spain”. Status pills read their word; the marks are hidden. Showing or masking a number is confirmed in
a polite status message, “Passport number shown”. The counts are a list labelled “Documents by status”.

## Content

- Name types the way the issuer does: “Passport”, “National ID”, “Residence permit”.
- Give `reference` your system's id, so people can find the record elsewhere.
- Write a `note` for every flagged or fraudulent document, saying what's wrong: “Expiry date doesn't match the
  issuer's record”.
- Rename or add statuses with `statuses`: `{ pending: { label: "Pending check", tone: "warning" } }`.

## Do

- Keep `masked` on wherever numbers are personal data, and log reveals from `tc-revealed-change`.
- Order documents the way reviewers check them: primary ID first.
- Pair View with a viewer that shows the scan and its checks.

## Don't

- Don't use tones for anything but how the document stands – green means verified, red means fraudulent.
- Don't put the full number in `reference` or `note`; that defeats the masking.
- Don't turn `masked` off just to save a click in a shared or screen-shared view.

## Example

```html
<tc-document-list id="docs" heading="Identity documents"></tc-document-list>

<script type="module">
  import "trenchcoat/document-list";
  import "trenchcoat/tokens.css";

  const docs = document.querySelector("#docs");
  docs.documents = [
    { id: "d1", type: "Passport", country: "Spain", number: "PAE481207", reference: "DOC-2270", expires: Date.UTC(2031, 2, 14), status: "verified" },
    { id: "d2", type: "Driving licence", country: "Spain", number: "V-4471208-R", status: "flagged", note: "Expiry doesn't match the issuer's record" },
  ];
  docs.addEventListener("tc-revealed-change", (e) => console.log("revealed", e.detail.id));
  docs.addEventListener("tc-open", (e) => console.log("open", e.detail.document.id));
</script>
```

```tsx
import { DocumentList, type DocumentRecord } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const documents: DocumentRecord[] = [
  { id: "d1", type: "Passport", country: "Spain", number: "PAE481207", reference: "DOC-2270", status: "verified" },
  { id: "d2", type: "Utility bill", country: "Spain", status: "fraudulent", note: "Template matches a known forgery kit" },
];

export function Documents() {
  return <DocumentList title="Identity documents" documents={documents} onOpen={(d) => console.log(d.id)} onRevealedChange={(ids) => console.log(ids)} />;
}
```
