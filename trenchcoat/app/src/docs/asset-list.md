---
pattern: list
status: new
related: document-list, contact-channels, data-table, verification-queue
---

## Overview

The assets on record for a person, an account or a company, in the page's own groups – Vehicles, Devices, Property.
Each row shows:
- an icon for its kind – car, motorcycle, phone, laptop, drive or other;
- its name or model;
- an identifier – a plate, an IMEI, a serial – masked to its last four characters until someone shows it;
- a detail line and what it's linked to, such as “Registered to customer”;
- a status pill – Confirmed, Suspected, Seized, In analysis, Retired, or statuses of your own;
- an Open button.

Each group's header counts its assets, and the heading counts them all. Showing an identifier is one row at a time and
fires a cancelable event, so a page can ask for a reason or log it first.

## When to use

- The vehicles and devices behind an account in a fraud or compliance review.
- A company's register of equipment issued to a person, and what's been returned.
- Any short, grouped set of things where each one's identifier and status matter.

## When not to use

- Identity and record documents – use `document-list`.
- Ways to reach a person – use `contact-channels`.
- Hundreds of assets to sort and filter – use `data-table`.
- A queue of items waiting for someone to check them – use `verification-queue`.

## Anatomy

1. **Group** `.ui-asl__group-head` – the group's name and how many assets it has
2. **Row** `.ui-asl__row` – one asset
3. **Kind** `.ui-asl__icon` – an icon for what it is
4. **Identifier** `.ui-asl__id` – the plate, IMEI or serial, masked to its last four characters until shown
5. **Detail** `.ui-asl__detail` – one quiet line: colour and year, condition
6. **Link** `.ui-asl__link` – what it's linked to
7. **Status** `.ui-asl__pill` – the status as a tint, a mark and a word
8. **Show identifier** `.ui-asl__reveal` – shows or masks the identifier again
9. **Open** `.ui-asl__open` – opens the asset

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight names. Clean is one
white card with the header as its first row. The pills, masking and buttons are the same in both.

## Keyboard

The rows' buttons are one tab stop across every group; inside the list the arrows move between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the same button in the previous or next row, across groups |
| ← / → | Moves between a row's Show identifier and Open buttons |
| Home / End | Moves to the first or last row |
| Enter / Space | Shows or masks the identifier; opens the asset |
| Tab | Leaves the list |

## Screen readers

Each group is a section named by its header, which reads its count, “Vehicles, 2 assets”, and holds a list described
by “Up and down arrows move between assets, left and right between an asset's buttons”. A masked identifier reads its
kind and last characters, “Plate ending 1-KX, hidden”; a shown one reads in full. Show identifier is a toggle button
(`aria-pressed`) labelled with the asset, “Show plate, Audi A6”. Open is labelled “Open Audi A6”. Status pills read
their word; the marks and kind icons are hidden. Showing or masking is confirmed in a polite status message, “Audi A6
plate shown”.

## Content

- Name assets the way people recognise them: make and model, “iPhone 15 Pro”, not an inventory code.
- Set `identifierLabel` to what the identifier is – “Plate”, “IMEI”, “Serial” – so a masked value still makes sense.
- Write `link` as the relationship, not the record id: “Registered to customer”, “Reg. Aurelia Estates SL”.
- Rename or add statuses with `statuses`: `{ lost: { label: "Reported lost", tone: "danger" } }`.

## Do

- Keep `masked` on wherever identifiers are personal data, and log reveals from `tc-revealed-change`.
- Group by what people look for first – vehicles, then devices – and keep each group short.
- Use Suspected for anything not yet confirmed against a record.

## Don't

- Don't put a full identifier in `detail` or `link`; that defeats the masking.
- Don't use tones for anything but the asset's status.
- Don't turn `masked` off just to save a click in a shared or screen-shared view.

## Example

```html
<tc-asset-list id="assets" heading="Assets"></tc-asset-list>

<script type="module">
  import "trenchcoat/asset-list";
  import "trenchcoat/tokens.css";

  const assets = document.querySelector("#assets");
  assets.groups = [
    { id: "vehicles", label: "Vehicles", assets: [{ id: "v1", kind: "car", name: "Audi A6 Avant", identifier: "AB-441-KX", identifierLabel: "Plate", status: "confirmed" }] },
    { id: "devices", label: "Devices", assets: [{ id: "d1", kind: "laptop", name: "MacBook Pro 14", identifier: "C02FK3QXMD6T", identifierLabel: "Serial", status: "seized" }] },
  ];
  assets.addEventListener("tc-revealed-change", (e) => console.log("revealed", e.detail.id));
  assets.addEventListener("tc-open", (e) => console.log("open", e.detail.asset.id));
</script>
```

```tsx
import { AssetList, type AssetGroup } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const groups: AssetGroup[] = [
  { id: "vehicles", label: "Vehicles", assets: [{ id: "v1", kind: "car", name: "Audi A6 Avant", identifier: "AB-441-KX", identifierLabel: "Plate", status: "confirmed" }] },
  { id: "devices", label: "Devices", assets: [{ id: "d1", kind: "phone", name: "iPhone 15 Pro", identifier: "356938035643809", identifierLabel: "IMEI", status: "in-analysis" }] },
];

export function Assets() {
  return <AssetList title="Assets" groups={groups} onOpen={(asset, group) => console.log(group, asset.id)} onRevealedChange={(ids) => console.log(ids)} />;
}
```
