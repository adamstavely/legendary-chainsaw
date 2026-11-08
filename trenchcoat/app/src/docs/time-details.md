---
pattern: none
status: new
related: entity-details, coordinate-details, identifier-details, pr-link
---

## Overview

Text that mentions times in someone else's zone – a maintenance notice, a release note, a meeting invite, a model's
answer – with every time that has a zone found and underlined. Hover one for a moment or focus it, and a small
tooltip shows it in the reader's own zone: "Your local time", then "1:00 AM EST", with the weekday and date when the
day changes ("Saturday, 7 November · The day before").

It reads 24-hour and 12-hour times with a zone ("06:00 UTC", "6 PM ET", "9:30am PST", "18:00 CET", "14:00 GMT+1",
"06:00Z"), ISO stamps ("2026-11-08T06:00:00Z", "2026-11-08T11:30+05:30"), an ISO date before a time ("2026-11-08 06:00
UTC") and ranges ("05:30–09:00 UTC", "9–11 am PT"), where the start takes the end's zone. Times without a zone, dates
alone and version numbers stay plain text.

## Using it in an app

- **Wrap the text you already show.** Pass plain text as `text`; the component finds the times itself.
- **Say what day it is about.** A time written without a date falls on `date` ("2026-11-08") – the day of the
  announcement or the message. Without it, it's today in the zone the time is written in.
- **Leave the reader's zone alone.** It's the browser's by default; set `time-zone` only when the page knows better –
  a profile setting, or a preview of how another office sees it.
- **Use `entity-details` and `coordinate-details` beside it** for contact details and positions in the same text.

## When to use

- Announcements and notes written for people in several zones: maintenance windows, releases, meetings, deadlines.
- Chat messages and model answers that give times in UTC or a zone the reader may not live in.

## When not to use

- A time that's the main content – show it formatted in the reader's zone to begin with.
- Times you control the markup for – format them in the reader's zone when you render them.
- Picking a time – use `date-range-picker`.

## Anatomy

1. **Text** `.ui-tmd__text` – the passage, shown as written
2. **Marks** `.ui-tmd__mark` – a time with a zone found in the text, as a focusable `<time>` with the instant in
   `datetime`
3. **Tooltip** `.ui-tmd__pop` – opened by hover or focus
4. **Label** `.ui-tmd__label` – "Your local time"
5. **Time** `.ui-tmd__time` – the time in the reader's zone, with the zone's short name
6. **Date** `.ui-tmd__date` – the weekday and date, when a date was written or the reader's day differs, and
   `.ui-tmd__rel` "The day before" or "The next day"
7. **Same zone** `.ui-tmd__same` – "Your time zone too", when the reader is in the zone it was written in

## Looks

Standard underlines each time with an accent-coloured dotted line and tints it on hover. Clean uses a muted dotted
line in the text's colour that darkens on hover. The tooltip is the shared floating surface in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Onto a time: opens its tooltip |
| Escape | Closes the tooltip; focus stays on the time |

A click or tap pins the tooltip open; a second one closes it.

## Screen readers

Each time is a `<time>` in the tab order, read as written and described by what the tooltip says – "Your local time:
1:00 AM EST, Saturday, 7 November, the day before" – so the converted time is heard without opening anything. The
tooltip itself repeats those words for sighted readers and is hidden from assistive technology.

## Content

- `text` is plain text, shown as written with its line breaks.
- Write times with a zone, and with a date when the day matters: "2026-11-09 22:00 UTC" can't be misread.
- EST, PDT, CEST and the like are fixed offsets; ET, CT, MT and PT follow daylight saving on the date. IST, AST and
  other names that mean several zones aren't converted – write UTC with an offset instead ("UTC+5:30").
- Reword the tooltip with `labels` (`yours`, `before`, `after`, `same`); `locale` sets the language of times and dates.

## Do

- Set `date` to the day the text is about, so times near midnight land on the right day.
- Keep the zone written in the text – readers in that zone still need it.

## Don't

- Don't convert the times in the text yourself – the original time and zone are what everyone agreed on.
- Don't use it for times without a zone; there's nothing to convert from.

## Example

```html
<tc-time-details id="notice" date="2026-11-08"></tc-time-details>

<script type="module">
  import "@adamstavely/trenchcoat/time-details";
  import "@adamstavely/trenchcoat/tokens.css";

  const notice = document.querySelector("#notice");
  notice.text = "The index rebuild starts at 06:00 UTC; search is read-only from 05:30–09:00 UTC.";
  notice.addEventListener("tc-open-change", (e) => console.log("tooltip for", e.detail.open?.text));
</script>
```

```tsx
import { TimeDetails } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function MaintenanceNotice() {
  return (
    <TimeDetails
      text="The index rebuild starts at 06:00 UTC. Boston checks the results at 9 am ET."
      date="2026-11-08"
      onOpenChange={(open) => console.log(open ? `showing ${open.text}` : "closed")}
    />
  );
}
```
