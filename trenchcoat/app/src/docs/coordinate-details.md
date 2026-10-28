---
pattern: disclosure
status: new
related: geo-location, isbn-details, text-annotator, tooltip
---

## Overview

Text that mentions places by their coordinates – field notes, an incident log, a chat answer, a shipping report –
with every pair of coordinates found and marked. Hover a position for a moment, focus it or right-click it, and a card
shows what's there: the place's name, kind and address when your app knows them, the coordinates in decimal and in
degrees, minutes and seconds with Copy, "Open in" links to Google Maps, Apple Maps, OpenStreetMap and Bing Maps (or
your own mapping tools), and a map that loads only when someone presses Show map.

It reads decimal pairs ("38.8977, -77.0365"), decimals with hemispheres ("38.8977° N, 77.0365° W",
"N 38.8977 W 77.0365") and degrees-minutes-seconds ("38°53′51.6″N 77°02′11.6″W", with typographic or plain quote
marks). Pairs out of range, prices, scores, version numbers and numbers inside words stay plain text.

## Using it in an app

- **Wrap the text you already show.** Pass any plain text – a note, a message, a report paragraph – as `text`. There's
  nothing to mark up; the component finds the coordinates itself.
- **Hand it your geocoder.** `resolve(latitude, longitude, signal)` calls whatever reverse-geocoding you use (your
  own places table, a GIS service, a commercial API) and returns `{ name, kind, address, … }`, or null. The component
  only asks when a card opens, and caches the answer.
- **Point the links at your own tools.** Give `providers` your GIS viewer or asset map as URL templates
  (`https://gis.example.org/view?lat={lat}&lng={lng}`) alongside or instead of the public maps.
- **Use `geo-location` instead** when the location is the subject of the screen – a record's location field, a site's
  detail card, a list of places to switch between. Coordinate Details is for positions that turn up inside text.

## When to use

- Logs, notes and reports where positions are written as numbers and readers want to know what's there without
  copying them into a map.
- Model answers that cite places, so a reader can check a position points where the answer says it does.
- Anywhere people copy coordinates into another system – the card gives both notations to copy.

## When not to use

- A location that's the main content of a card or form – use `geo-location`.
- Short help text attached to one control – use `tooltip`.
- Highlighting and commenting on passages of a document – use `text-annotator`.

## Anatomy

1. **Text** `.ui-crd__text` – the passage, shown as written
2. **Coordinates** `.ui-crd__mark` – a pair found in the text, marked and focusable; lookalikes stay plain
3. **Card** `.ui-crd__pop` – what's at that position, opened by hover, focus or right-click
4. **Place** `.ui-crd__place` – a picture or pin, the name, kind, address, description, elevation and time zone
5. **Notations** `.ui-crd__forms` – decimal and DMS, each with Copy
6. **Open in** `.ui-crd__links` – mapping tools, each opening in a new tab
7. **Map** `.ui-crd__map` – Show map and where it loads from, then the embedded map

## Looks

Standard tints each position with a soft accent fill and a solid underline, and gives the place a tinted pin (or a
raised picture). Clean marks the position with a dotted underline only and frames the pin with a hairline. The card
is the shared floating surface in both looks. Override `--tc-crd-map-h` on the element to change the map's height.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Onto a position: opens its card (unless `trigger` is "contextmenu"). On a position with its card open: into the card (Copy, the links, Show map), as if the card followed the text; from the card's last control, on to the next position |
| Shift + Tab | From the card's first control, back to its position |
| Enter / Space | On a position: opens its card and moves focus into it |
| Menu key / Shift + F10 | On a position: opens its card and moves focus into it, in place of the browser's menu |
| Escape | Closes the card; focus goes back to its position |

## Screen readers

Each position is a button whose name is the coordinates as written, described as "Place details. Tab moves into
them" (or "Enter or the Menu key opens them" when only right-click opens cards). It has `aria-haspopup="dialog"` and
`aria-expanded`. The card is a non-modal `dialog`, named by the place's name (or "Place details for 57.04120,
-3.61270" while loading, on an error or when there are no details), and `aria-busy` while loading. The Copy buttons
are "Copy decimal" and "Copy DMS"; each link says it opens in a new tab. A polite status region says:

- the name and kind when the details arrive – "North breakwater, Survey transect A";
- "No details for this place" or "Couldn't load the details.";
- "Copied decimal coordinates".

## Content

- `text` is plain text, shown as written with its line breaks.
- Give the resolver's places a `name` at least – a place without one counts as no details. `elevation` is in metres;
  `timezone` is shown as given, so pass an IANA name or your own wording.
- Pictures can be any image URL, including a `data:` URL. They're decorative; the name says which place it is.
- Rename the empty and error messages with `not-found-text` and `error-text` – keep them short and factual.
- Plain decimal pairs need three decimal places and a comma, so write positions to at least 3 places (about 100 m).

## Do

- Pass the `signal` on to your geocoder, so a lookup stops when the component leaves the page.
- Return null for positions you know nothing about; throw only when the lookup itself failed, so people get Retry.
- Keep the map behind Show map – it loads from another site, and a hover shouldn't send a reader's position anywhere.
- Use `trigger="contextmenu"` in dense text, such as a log full of positions, where hover cards would get in the way.

## Don't

- Don't mark coordinates yourself in the text – the component checks them, so an out-of-range or mistyped pair isn't
  presented as a place.
- Don't call a slow geocoder for every pair on load; the component asks only when a card opens, and caches the answer.
- Don't use it for a single location field – that's `geo-location`.

## Example

```html
<tc-coordinate-details id="notes"></tc-coordinate-details>

<script type="module">
  import "trenchcoat/coordinate-details";
  import "trenchcoat/tokens.css";

  const notes = document.querySelector("#notes");
  notes.text = "Transect A starts at 50°49′12″N 1°05′24″W; samples were taken at 50.7980, -1.0912.";
  notes.resolve = async (latitude, longitude, signal) => {
    const res = await fetch(`/api/places/reverse?lat=${latitude}&lng=${longitude}`, { signal });
    return res.status === 404 ? null : res.json();
  };
  notes.addEventListener("tc-copy", (e) => console.log("copied", e.detail.notation, e.detail.text));
</script>
```

```tsx
import { CoordinateDetails, type CoordinatePlace } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const places: Record<string, CoordinatePlace> = {
  "50.7980,-1.0912": { name: "Sampling point W3", kind: "Water sampling site" },
};

export function FieldNotes() {
  return (
    <CoordinateDetails
      text="Water samples were taken at 50.7980, -1.0912 on the falling tide."
      resolve={(lat, lng) => places[`${lat.toFixed(4)},${lng.toFixed(4)}`] ?? null}
      onCopy={(text) => console.log("copied", text)}
    />
  );
}
```
