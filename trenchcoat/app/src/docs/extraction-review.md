---
pattern: grid
status: new
related: data-table, image-grid, dropzone, review-center
---

## Overview

Fields a model pulled out of a document – an invoice, a form, a contract – checked by a person before anything uses
them. The page sits next to the fields with a box around each field's place on it, so people check a value against
its source rather than trusting it. Every field shows how confident the extraction was, and the ones below the
threshold are marked Low so they get looked at first. People accept, correct or reject each field, moving field by
field from the keyboard while the page view follows; a correction keeps the extracted value beside the new one.

## When to use

- Checking values extracted from scanned or uploaded documents before they're saved or sent on.
- When an extraction is right most of the time but a wrong value is costly – amounts, dates, account details.
- When people need to see where on the page a value came from to judge it.

## When not to use

- Editing a table of records that don't come from a page – use `data-table`.
- Uploading the document in the first place – use `dropzone`.
- Approving or rejecting whole items in a queue, not fields within one – use `review-center`.

## Anatomy

1. **Page view** `.ui-xrev__viewport` – the page image in a scrolling well, with a box over every field found on it
2. **Active box** `.ui-xrev__box[data-active]` – the active field's place on the page, with the field's name above it
3. **Field** `.ui-xrev__cell` – the field's name, its value, the confidence and what's been decided
4. **Actions** `.ui-xrev__act` – Accept, Correct and Reject; the pressed one takes its status colour
5. **Progress** `.ui-xrev__foot` – “3 of 10 reviewed · 2 low confidence” and Confirm

## Looks

Standard puts the page and the fields on a white card in the gray tray, with the progress and Confirm on the tray
below. Clean is one white card with hairline dividers, a lighter value weight and thinner icons; the progress is its
last row, and the active field is tinted with the accent rather than gray.

## Keyboard

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next field; the page view follows |
| ← / → | Moves between the field and its Accept, Correct and Reject buttons |
| Home / End | First or last cell in the row; Home from the first cell goes to the first field, End from the last cell to the last field |
| Ctrl Home / Ctrl End | First or last field |
| Page Up / Page Down | Five fields up or down |
| A | Accepts the field and moves to the next field still to review |
| R | Rejects the field and moves to the next field still to review |
| Enter (on the field) or F2 | Corrects the value; Enter saves and moves on, Escape cancels |
| Enter or Space (on a button) | Presses it; a pressed Accept or Reject sets the field back to review |

The page view is its own tab stop, so its scroll can be moved with the arrow keys; Previous page and Next page turn
pages.

## Screen readers

The fields are a `grid` named by the heading, with one `row` per field and a single tab stop. The field cell reads
its name, value, confidence (“62% confidence”) and status (“To review”, “Accepted”, “Corrected”, “Rejected”), and is
described by “A accept, R reject, Enter correct, arrows move between fields”. The buttons name their field (“Accept
Due date”, “Undo accept, Due date”), carry `aria-pressed` and `aria-keyshortcuts`. The correction field is labelled
“Correct Total” and described by “Enter saves, Escape cancels”. A status region says what happened: “Due date
accepted”, “Total corrected to 1,240.00”, “Total back to review”, “All 10 fields reviewed”. The page view is a region
named by “Page 1 of 2”, which is announced when it changes; each page image has alt text. The boxes are hidden from
assistive technology – the grid carries the same information.

## Content

- Name fields the way the document's reader would: “Invoice number”, “Due date” – not schema keys like `inv_no`.
- Show values as they'll be stored, formatted the same way, so a correction is compared like for like.
- Set `source` to the file name, so people know which document they're looking at.
- Mask personal data before it reaches the element – it shows the values it's given.
- Write `confirm-label` as what happens next: “Send to accounts”, “Save to record”.

## Do

- Pass a box for every field the model can place – a field without one has nothing to check against.
- Set `threshold` from how your model performs; the default, 0.8, marks anything under 80% as Low.
- Keep the extracted value: the element sets `original` on correction, so your audit trail has both.

## Don't

- Don't auto-accept fields above the threshold for people; let them confirm with A – it takes a key press each.
- Don't use page images too small to read – the boxes are only as useful as the text under them.
- Don't hide rejected fields from the list; people may change their mind before confirming.

## Example

```html
<tc-extraction-review id="invoice" heading="Invoice INV-2041" source="inv-2041.pdf" confirm-label="Send to accounts"></tc-extraction-review>

<script type="module">
  import "trenchcoat/extraction-review";
  import "trenchcoat/tokens.css";

  const review = document.querySelector("#invoice");
  review.pages = [{ src: "/scans/inv-2041-1.png", width: 1700, height: 2200 }];
  review.fields = [
    { id: "total", label: "Total", value: "1,339.20", confidence: 0.96, box: { page: 1, x: 1380, y: 1440, width: 190, height: 40 } },
    { id: "due", label: "Due date", value: "11 Nov 2026", confidence: 0.62, box: { page: 1, x: 1380, y: 560, width: 190, height: 36 } },
  ];
  review.addEventListener("tc-confirm", (e) => save(e.detail.fields));
</script>
```

```tsx
import { useState } from "react";
import { ExtractionReview, type ExtractionField, type ExtractionPage } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function InvoiceCheck({ pages, extracted, save }: { pages: ExtractionPage[]; extracted: ExtractionField[]; save: (fields: ExtractionField[]) => void }) {
  const [fields, setFields] = useState(extracted);
  return (
    <ExtractionReview
      title="Invoice INV-2041"
      source="inv-2041.pdf"
      pages={pages}
      fields={fields}
      onFieldsChange={setFields}
      onConfirm={save}
      confirmLabel="Send to accounts"
    />
  );
}
```
