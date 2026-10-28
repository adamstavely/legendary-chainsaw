---
pattern: grid
status: new
related: empty-calendar, activity-calendar, date-range-picker, travel-itinerary
---

## Overview

A calendar of calendars. It brings many people's calendars from many accounts, such as Google, Outlook, Exchange or an
iCal feed, into one place, where they can be seen, created, edited, moved and deleted without opening each one.

The sidebar lists the calendars by person or by account. Each has a box to show or hide it and an "Only this" button,
and a mini month sits above them for jumping between dates. The main area has five views:
- **Day, Week and Month:** the usual calendar views.
- **Agenda:** a list of the coming days.
- **People:** one column per person for a single day, to see at a glance who is free.

Every event shows whose calendar it's on. Events that overlap sit side by side. When one person is double-booked across
two of their own calendars, both events are marked as a conflict, which no single calendar can show.

## When to use

- A team, family or assistant's view across several people's calendars, to find a time or to keep the day straight.
- One person with many accounts – work Exchange, personal Google, a shared iCal feed – who wants them in one place.
- Booking on someone else's behalf: create the event straight on the right person's calendar.

## When not to use

- An empty state that invites someone to connect their first calendar – use `empty-calendar`.
- How much happened each day over a year – use `activity-calendar`.
- Picking a date range for a filter or a report – use `date-range-picker`.
- One trip's flights, hotels and meetings in order – use `travel-itinerary`.

## Anatomy

1. **Toolbar** `.ui-mcal__bar` – Today, previous and next, the range shown, the views and New event
2. **Sidebar** `.ui-mcal__side` – the mini month and the calendars, grouped by person or by account
3. **Mini month** `.ui-mcal__mini` – jumps to a day; a dot marks days with events
4. **Calendar** `.ui-mcal__cal` – show or hide it, "Only this", and a lock on a read-only one
5. **Column** `.ui-mcal__colhead` – a day, or a person in People, with its all-day events under the name
6. **Event** `.ui-mcal__ev` – in its calendar's colour, with the person's initials, its time and marks for read-only and
   conflict; tentative events have a dashed edge and cancelled ones are struck through
7. **Now** `.ui-mcal__now` – the current time on today's column
8. **Chip** `.ui-mcal__chip` – a one-line event: all-day events, Month and Agenda
9. **Popover** `.ui-mcal__pop` – an event's details with Edit and Delete, or the editor

## Looks

**Both looks.** The toolbar, sidebar and views are the same in Standard and Clean:
- **Standard:** a white card on a gray tray, with the header on the tray above it.
- **Clean:** one white card, with the header as its first row.

**Calendar colours.** Calendars take the library's six chart colours in turn. A calendar's `color` (1–6) picks one.

**Hours outside work.** These are shaded, set by `workingHours` (by default 9 to 5, Monday to Friday).

**Component tokens.** Set any of these on the element:

| Token | What it sets | Default |
|---|---|---|
| `--tc-mcal-hour` | An hour's height | 48 px |
| `--tc-mcal-gutter` | The time column | 56 px |
| `--tc-mcal-side` | The sidebar's width | 240 px |
| `--tc-mcal-height` | The scrolling area's height | 600 px |
| `--tc-mcal-col-min` | A column's least width before the grid scrolls sideways | 112 px |

## Keyboard

Day, Week and People are a grid of half-hour slots, with one tab stop. Month is a grid of days that works the same way,
and Agenda is a list.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves half an hour (Month: a week); in a slot's events, to the previous or next event |
| ← / → | Moves a column (Month: a day) |
| Page Up / Page Down | Moves two hours (Month: five weeks) |
| Home / End | Moves to the first or last column; with ⌘/Ctrl, the first or last slot of the day |
| Enter / Space | On an empty slot or day, opens the editor there; on a busy one, moves into its events; on an event, opens its details |
| Delete / Backspace | On an event, deletes it (not on a read-only calendar) |
| Escape | From an event, back to its slot; in a popover, closes it and returns focus |

The views and "Group by" are radio groups, moved with the arrows. In the mini month, the arrows move a day or a week and
Page Up / Page Down move a month. When the sidebar is folded behind Calendars, Escape closes it.

## Screen readers

**The grids.** Each time grid and the month grid is a `grid` named by the range shown and described by its keys:
- Slots read the column, the time and what's in it, for example "Wednesday, October 28, 2026, 2:00 PM, 1 event: Client
  review".
- Events read their title, time, person, calendar, account and any marks, for example "Client review, 2:00 PM – 3:30
  PM, Priya Raman · Client meetings · Exchange, Conflicts with Dentist (Google)".

**Changes** are announced in a polite status message, for example "Created Design review on Work", "Deleted Gym" or
"Personal hidden". The range label is `aria-live`.

**Popovers** are non-modal dialogs named by the event's title. When Edit and Delete are off, they're described by the
reason, such as "This calendar is read-only: Audit Summit (iCal feed)".

## Content

- **Names.** Give every calendar a short name ("Work", "Personal", "Client meetings") and a `provider`. People tell
  their own calendars apart by account.
- **Repeating events.** Pass each occurrence as its own event. `recurring` is shown in words; it isn't expanded.
- **All-day events.** `end` is the midnight after the last day, as most calendar APIs return it.
- **Read-only calendars.** Mark subscribed and shared calendars `readOnly`. The element then refuses to change them,
  instead of failing at the account.
- **Time zone.** Set `time-zone` when the page shows a zone other than the browser's, for example a team's office.

## Do

- **Save in the listener.** Save each create, update and delete to the account there, and put the event's id in
  `pending` while it saves.
- **Handle a failed save.** Call `preventDefault()` on the event and tell the person why.
- **Name calendars consistently.** Use the same person and account names here as in the rest of the product.

## Don't

- **Don't spend colours on people.** Colours are per calendar, and the initials say whose it is. A person with three
  calendars needs three colours.
- **Don't hide conflicts.** A double booking across accounts is the one thing this view can show that the accounts can't.
- **Don't edit read-only calendars.** Don't make a calendar writable here if its account won't accept the change.

## Example

```html
<tc-multi-calendar id="team" heading="Team calendars" view="week" week-start="1"></tc-multi-calendar>

<script type="module">
  import "trenchcoat/multi-calendar";
  import "trenchcoat/tokens.css";

  const cal = document.querySelector("#team");
  const maya = { id: "maya", name: "Maya Chen" };
  const theo = { id: "theo", name: "Theo Okafor" };
  cal.calendars = [
    { id: "maya-work", name: "Work", owner: maya, provider: "Google" },
    { id: "theo-work", name: "Work", owner: theo, provider: "Outlook" },
    { id: "summit", name: "Audit Summit", owner: theo, provider: "iCal feed", readOnly: true },
  ];
  cal.events = [
    { id: "e1", calendarId: "maya-work", title: "Sampling review", start: Date.parse("2026-10-28T11:00"), end: Date.parse("2026-10-28T12:30") },
    { id: "e2", calendarId: "theo-work", title: "Ledger walkthrough", start: Date.parse("2026-10-28T13:00"), end: Date.parse("2026-10-28T15:00") },
  ];
  cal.addEventListener("tc-event-create", (e) => console.log("save", e.detail.event, "to", e.detail.calendar.provider));
  cal.addEventListener("tc-event-delete", (e) => {
    if (!confirm(`Delete ${e.detail.event.title}?`)) e.preventDefault();
  });
</script>
```

```tsx
import { useState } from "react";
import { MultiCalendar, type CalendarEvent, type CalendarSource } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const maya = { id: "maya", name: "Maya Chen" };
const calendars: CalendarSource[] = [
  { id: "maya-work", name: "Work", owner: maya, provider: "Google" },
  { id: "maya-home", name: "Personal", owner: maya, provider: "Google" },
];

export function TeamCalendar({ initial }: { initial: CalendarEvent[] }) {
  const [events, setEvents] = useState(initial);
  const [view, setView] = useState<"day" | "week" | "month" | "agenda" | "people">("week");
  return (
    <MultiCalendar
      title="Team calendars"
      calendars={calendars}
      events={events}
      view={view}
      onViewChange={setView}
      onEventCreate={({ event }) => setEvents((list) => [...list, event])}
      onEventUpdate={({ event }) => setEvents((list) => list.map((e) => (e.id === event.id ? event : e)))}
      onEventDelete={({ event }) => setEvents((list) => list.filter((e) => e.id !== event.id))}
    />
  );
}
```
