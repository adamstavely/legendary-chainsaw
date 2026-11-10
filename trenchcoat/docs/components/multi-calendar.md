<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Multi Calendar

**People & profiles** · New

A calendar of calendars: many people's Google, Outlook, Exchange and iCal calendars in one Day, Week, Month, Agenda or People view, with show/hide per calendar, conflicts across a person's calendars, and create, edit, drag-to-move and delete on writable ones

- **Element:** `<tc-multi-calendar>`
- **Size:** 27.0 KB gzip · 101.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/multi-calendar";` |
| React / Next.js | `import { MultiCalendar } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/multi-calendar";` · tags starting with tc- are custom elements |
| Angular | `import { MultiCalendar } from "@adamstavely/trenchcoat/angular/multi-calendar";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/multi-calendar";` |

## Example

The live example is in the gallery at `#/multi-calendar`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

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

### When to use

- A team, family or assistant's view across several people's calendars, to find a time or to keep the day straight.
- One person with many accounts – work Exchange, personal Google, a shared iCal feed – who wants them in one place.
- Booking on someone else's behalf: create the event straight on the right person's calendar.

### When not to use

- An empty state that invites someone to connect their first calendar – use [Empty Calendar](../illustrations/empty-calendar.md).
- How much happened each day over a year – use [Activity Calendar](activity-calendar.md).
- Picking a date range for a filter or a report – use [Date Range Picker](date-range-picker.md).
- One trip's flights, hotels and meetings in order – use [Travel Itinerary](travel-itinerary.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Toolbar** `.ui-mcal__bar` – Today, previous and next, the range shown, the views and New event
2. **Sidebar** `.ui-mcal__side` – the mini month and the calendars, grouped by person or by account
3. **Mini month** `.ui-mcal__mini` – jumps to a day; a dot marks days with events
4. **Calendar** `.ui-mcal__cal` – show or hide it, "Only this", and a lock on a read-only one
5. **Column** `.ui-mcal__colhead` – a day, or a person in People, with its all-day events under the name
6. **Event** `.ui-mcal__ev` – in its calendar's colour, with the person's initials, its time and marks for read-only and
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

## Usage

### HTML

```html
<tc-multi-calendar id="team" heading="Team calendars" view="week" week-start="1"></tc-multi-calendar>

<script type="module">
  import "@adamstavely/trenchcoat/multi-calendar";
  import "@adamstavely/trenchcoat/tokens.css";

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

### React / Next.js

```tsx
import { useState } from "react";
import { MultiCalendar, type CalendarEvent, type CalendarSource } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

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

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/multi-calendar";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMultiCalendar } from "@adamstavely/trenchcoat/multi-calendar";

defineProps<{ calendars: TcMultiCalendar["calendars"]; events: TcMultiCalendar["events"] }>();
const onEventCreate = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-multi-calendar :calendars="calendars" :events="events" @tc-event-create="onEventCreate"></tc-multi-calendar>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MultiCalendar } from "@adamstavely/trenchcoat/angular/multi-calendar";
import type { TcMultiCalendar } from "@adamstavely/trenchcoat/multi-calendar";

@Component({
  selector: "app-multi-calendar-example",
  imports: [MultiCalendar],
  template: `<tc-multi-calendar [calendars]="calendars()" [events]="events()" (tc-event-create)="onEventCreate($event)"></tc-multi-calendar>`,
})
export class MultiCalendarExample {
  readonly calendars = input.required<TcMultiCalendar["calendars"]>();
  readonly events = input.required<TcMultiCalendar["events"]>();
  onEventCreate(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/multi-calendar";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMultiCalendar } from "@adamstavely/trenchcoat/multi-calendar";

  let { calendars, events }: { calendars: TcMultiCalendar["calendars"]; events: TcMultiCalendar["events"] } = $props();
  let el: TcMultiCalendar;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-event-create", on);
    return () => el.removeEventListener("tc-event-create", on);
  });
</script>

<tc-multi-calendar bind:this={el} {calendars} {events}></tc-multi-calendar>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Calendars"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `calendars` | – | `CalendarSource[]` | `[]` | The calendars, from every account and person, in the order the sidebar lists them |
| `events` | – | `CalendarEvent[]` | `[]` | The events of every calendar, in any order. Changed by the user (create, edit, move, delete) unless the event's listener calls preventDefault() |
| `view` | `view` | `MultiCalendarView` | `"week"` | The view: "day", "week", "month", "agenda" or "people". Changed by the user unless a tc-view-change listener calls preventDefault() |
| `date` | `date` | `number \| undefined` | `undefined` | The day in focus, as epoch ms of any moment in it; by default today. Changed by the user unless a tc-date-change listener calls preventDefault() |
| `visible` | – | `string[] \| undefined` | `undefined` | The ids of the calendars shown; by default each calendar's own `visible`. Changed by the user unless a tc-visible-change listener calls preventDefault() |
| `pending` | – | `string[]` | `[]` | Ids of events being saved: drawn as saving, and not editable until they leave the list |
| `groupBy` | `group-by` | `"person" \| "provider"` | `"person"` | How the sidebar groups calendars: "person" or "provider" (the account) |
| `timeZone` | `time-zone` | `string \| undefined` | `undefined` | The IANA time zone the calendar shows, e.g. "America/Los_Angeles"; by default the browser's |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates and times, e.g. "en-GB"; by default the browser's |
| `weekStart` | `week-start` | `number` | `1` | The first day of the week: 0 Sunday, 1 Monday … 6 Saturday |
| `workingHours` | – | `MultiCalendarHours` | `{ start: 9, end: 17, days: [1, 2, 3, 4, 5] }` | Working hours; time outside them is shaded |
| `agendaDays` | `agenda-days` | `number` | `14` | How many days Agenda lists from the day in focus |
| `readonly` | `readonly` | `boolean` | `false` | View only: no creating, editing, moving or deleting anywhere |
| `now` | `now` | `number \| undefined` | `undefined` | The current time, epoch ms – for a fixed clock (tests, screenshots); by default the element keeps its own |
| `labels` | – | `Partial<MultiCalendarLabels>` | `{}` | Any of the words it shows (see defaultMultiCalendarLabels) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-event-create` | – | Yes | An event was created ({ event, calendar }: MultiCalendarEventCreate); cancelable – prevented, it isn't added |
| `tc-event-update` | – | Yes | An event was edited, moved or resized ({ event, previous, calendar }: MultiCalendarEventUpdate); cancelable – prevented, it stays as it was |
| `tc-event-delete` | – | Yes | An event was deleted ({ event, calendar }: MultiCalendarEventDelete); cancelable – prevented, it stays |
| `tc-view-change` | – | Yes | The view was switched ({ view }: MultiCalendarViewChange); cancelable – prevented, `view` stays as it was |
| `tc-date-change` | – | Yes | The day in focus moved ({ date }: MultiCalendarDateChange); cancelable – prevented, `date` stays as it was |
| `tc-visible-change` | – | Yes | Calendars were shown or hidden ({ visible }: MultiCalendarVisibleChange); cancelable – prevented, `visible` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-mcal-hour` | `48px` | both |
| `--tc-mcal-gutter` | `44px` | both |
| `--tc-mcal-side` | `240px` | both |
| `--tc-mcal-height` | `600px` | both |
| `--tc-mcal-col-min` | `112px` | both |
| `--tc-mcal-hairline` | `1px` | both |
| `--tc-mcal-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (86)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-h-sm`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-mcal-colw`, `--tc-mcal-ink`, `--tc-menu-shadow`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultMultiCalendarLabels: object` | Every word the element shows; pass `labels` with any of them to change them |

## Frameworks

*The site shows these one framework at a time, behind tabs; here they're all written out. [Set-up for each framework](../foundations/frameworks.md)*

### Set-up

- **HTML:** Import the module once – it registers the tag – and load `@adamstavely/trenchcoat/tokens.css`. Nothing else to set up.
- **React / Next.js:** The wrappers in `@adamstavely/trenchcoat/react` take React props and callbacks. In Next.js (App Router) they render on the client only: use them from a `"use client"` file.
- **Vue / Nuxt:** Tell the template compiler that `tc-` tags are custom elements: `compilerOptions.isCustomElement` in the Vue plugin, or `vue.compilerOptions` in `nuxt.config.ts`.
- **Angular:** Import the element's directive from its own entry point, `@adamstavely/trenchcoat/angular/<name>` (it loads that element only, so a lazy route keeps it), into the component's `imports` – no `CUSTOM_ELEMENTS_SCHEMA`. The directive registers the tag, and strict templates check every binding and event.
- **Svelte:** Import the module in the component's script. Svelte sets a property when the element has one, so lists and objects pass as they are.

### Data properties

*Lists, objects and functions are properties, not attributes – bind them as properties:*

| Property | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- |
| `calendars` | `el.calendars = …;` | `<… calendars={…} />` | `<tc-multi-calendar :calendars="…">` | `<tc-multi-calendar [calendars]="…">` | `<tc-multi-calendar {calendars}>` |
| `events` | `el.events = …;` | `<… events={…} />` | `<tc-multi-calendar :events="…">` | `<tc-multi-calendar [events]="…">` | `<tc-multi-calendar {events}>` |
| `visible` | `el.visible = …;` | `<… visible={…} />` | `<tc-multi-calendar :visible="…">` | `<tc-multi-calendar [visible]="…">` | `<tc-multi-calendar {visible}>` |
| `pending` | `el.pending = …;` | `<… pending={…} />` | `<tc-multi-calendar :pending="…">` | `<tc-multi-calendar [pending]="…">` | `<tc-multi-calendar {pending}>` |
| `workingHours` | `el.workingHours = …;` | `<… workingHours={…} />` | `<tc-multi-calendar :workingHours="…">` | `<tc-multi-calendar [workingHours]="…">` | `<tc-multi-calendar {workingHours}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-multi-calendar :labels="…">` | `<tc-multi-calendar [labels]="…">` | `<tc-multi-calendar {labels}>` |

*Also attributes: `heading`, `description`, `view`, `date`, `group-by`, `time-zone`, `locale`, `week-start` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-event-create` | Yes | `el.addEventListener("tc-event-create", (e) => …)` | `ref.current.addEventListener("tc-event-create", …)` | `@tc-event-create="…"` | `(tc-event-create)="…($event)"` | `el.addEventListener("tc-event-create", …)` |
| `tc-event-update` | Yes | `el.addEventListener("tc-event-update", (e) => …)` | `ref.current.addEventListener("tc-event-update", …)` | `@tc-event-update="…"` | `(tc-event-update)="…($event)"` | `el.addEventListener("tc-event-update", …)` |
| `tc-event-delete` | Yes | `el.addEventListener("tc-event-delete", (e) => …)` | `ref.current.addEventListener("tc-event-delete", …)` | `@tc-event-delete="…"` | `(tc-event-delete)="…($event)"` | `el.addEventListener("tc-event-delete", …)` |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-date-change` | Yes | `el.addEventListener("tc-date-change", (e) => …)` | `ref.current.addEventListener("tc-date-change", …)` | `@tc-date-change="…"` | `(tc-date-change)="…($event)"` | `el.addEventListener("tc-date-change", …)` |
| `tc-visible-change` | Yes | `el.addEventListener("tc-visible-change", (e) => …)` | `ref.current.addEventListener("tc-visible-change", …)` | `@tc-visible-change="…"` | `(tc-visible-change)="…($event)"` | `el.addEventListener("tc-visible-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `view`, `date` and `visible` itself unless a listener calls `preventDefault()` on `tc-view-change`, `tc-date-change` or `tc-visible-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-multi-calendar id="multi-calendar"></tc-multi-calendar>

<script type="module">
  import "@adamstavely/trenchcoat/multi-calendar";

  const el = document.querySelector("#multi-calendar");
  el.addEventListener("tc-view-change", (e) => {
    e.preventDefault(); // the element keeps its view…
    if (allowed(e.detail.view)) el.view = e.detail.view; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

*The wrapper doesn't take this value with a callback of its own – see the props below, or use the element through a ref.*

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/multi-calendar";
import type { TcMultiCalendar } from "@adamstavely/trenchcoat/multi-calendar";

const props = defineProps<{ initial: TcMultiCalendar["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcMultiCalendar["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-multi-calendar :view="view" @tc-view-change="onViewChange"></tc-multi-calendar>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { MultiCalendar } from "@adamstavely/trenchcoat/angular/multi-calendar";
import type { TcMultiCalendar } from "@adamstavely/trenchcoat/multi-calendar";

@Component({
  selector: "app-controlled-multi-calendar",
  imports: [MultiCalendar],
  template: `<tc-multi-calendar [view]="view()" (tc-view-change)="onViewChange($event)"></tc-multi-calendar>`,
})
export class ControlledMultiCalendar {
  readonly initial = input.required<TcMultiCalendar["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcMultiCalendar["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/multi-calendar";
  import type { TcMultiCalendar } from "@adamstavely/trenchcoat/multi-calendar";

  let { initial }: { initial: TcMultiCalendar["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcMultiCalendar;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcMultiCalendar["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-multi-calendar bind:this={el} {view}></tc-multi-calendar>
```

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-multi-calendar")` returns a `TcMultiCalendar` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMultiCalendar } from "@adamstavely/trenchcoat/multi-calendar";`
- **React / Next.js:** Props: `import type { MultiCalendarProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MultiCalendar>`. The element class, for refs: `import type { TcMultiCalendar } from "@adamstavely/trenchcoat/multi-calendar";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMultiCalendar["calendars"]` with `import type { TcMultiCalendar } from "@adamstavely/trenchcoat/multi-calendar";`
- **Angular:** The directive types the template: `[calendars]` takes `TcMultiCalendar["calendars"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMultiCalendar } from "@adamstavely/trenchcoat/multi-calendar";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMultiCalendar } from "@adamstavely/trenchcoat/multi-calendar";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `view` | `MultiCalendarView` | The view – controlled when given |
| `defaultView` | `MultiCalendarView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: MultiCalendarView) => void` | The view was switched |
| `date` | `number` | The day in focus, epoch ms – controlled when given |
| `defaultDate` | `number` | The day in focus on mount when `date` isn't controlled; by default today |
| `onDateChange` | `(date: number) => void` | The day in focus moved (its midnight, epoch ms) |
| `visible` | `string[]` | The ids of the calendars shown – controlled when given |
| `defaultVisible` | `string[]` | The calendars shown on mount when `visible` isn't controlled; by default each calendar's own `visible` |
| `onVisibleChange` | `(visible: string[]) => void` | Calendars were shown or hidden |
| `onEventCreate` | `(detail: MultiCalendarEventCreate, event: CustomEvent<MultiCalendarEventCreate>) => void \| boolean` | An event was created. Return false (or call preventDefault on the event) to keep it out – then add it yourself when the account confirms. With `events` controlled, update them here |
| `onEventUpdate` | `(detail: MultiCalendarEventUpdate, event: CustomEvent<MultiCalendarEventUpdate>) => void \| boolean` | An event was edited, moved or resized; return false to keep it as it was |
| `onEventDelete` | `(detail: MultiCalendarEventDelete, event: CustomEvent<MultiCalendarEventDelete>) => void \| boolean` | An event was deleted; return false to keep it |

*Renamed or hidden on the wrapper: `heading`, `view`, `date`, `visible`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

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

### Screen readers

**The grids.** Each time grid and the month grid is a `grid` named by the range shown and described by its keys:
- Slots read the column, the time and what's in it, for example "Wednesday, October 28, 2026, 2:00 PM, 1 event: Client
  review".
- Events read their title, time, person, calendar, account and any marks, for example "Client review, 2:00 PM – 3:30
  PM, Priya Raman · Client meetings · Exchange, Conflicts with Dentist (Google)".

**Changes** are announced in a polite status message, for example "Created Design review on Work", "Deleted Gym" or
"Personal hidden". The range label is `aria-live`.

**Popovers** are non-modal dialogs named by the event's title. When Edit and Delete are off, they're described by the
reason, such as "This calendar is read-only: Audit Summit (iCal feed)".

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **120** | light-dark() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself, internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 82.5 KB | 21.0 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/calendar-layout` · Shared Trenchcoat code | 2.6 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **101.0 KB** | **27.1 KB** |
| With Lit – the first component on a page | 122.8 KB | 34.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **8.9 ms** | the gallery demo's data, 1,368 DOM nodes – to layout, median of 7 |
| Typical update | **1.5 ms** | one item of events replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 14 ms | events: first render, 2,008 nodes; update 2.1 ms |
| 1,000 items | 85 ms | events: first render, 9,208 nodes; update 8.9 ms |

1,000 items of events: 85 ms. It renders every item, so a first render passes 50 ms (a long task) at about 590 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setInterval, cleared`, `setTimeout`, `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- **Names.** Give every calendar a short name ("Work", "Personal", "Client meetings") and a `provider`. People tell
  their own calendars apart by account.
- **Repeating events.** Pass each occurrence as its own event. `recurring` is shown in words; it isn't expanded.
- **All-day events.** `end` is the midnight after the last day, as most calendar APIs return it.
- **Read-only calendars.** Mark subscribed and shared calendars `readOnly`. The element then refuses to change them,
  instead of failing at the account.
- **Time zone.** Set `time-zone` when the page shows a zone other than the browser's, for example a team's office.

## Do and don't

### Do

- **Save in the listener.** Save each create, update and delete to the account there, and put the event's id in
  `pending` while it saves.
- **Handle a failed save.** Call `preventDefault()` on the event and tell the person why.
- **Name calendars consistently.** Use the same person and account names here as in the rest of the product.

### Don't

- **Don't spend colours on people.** Colours are per calendar, and the initials say whose it is. A person with three
  calendars needs three colours.
- **Don't hide conflicts.** A double booking across accounts is the one thing this view can show that the accounts can't.
- **Don't edit read-only calendars.** Don't make a calendar writable here if its account won't accept the change.

## Related

- [Empty Calendar](../illustrations/empty-calendar.md) – Stack of calendar cards marked empty, fanning out on hover; the shimmer runs a few cycles and rests
- [Activity Calendar](activity-calendar.md) – A year of activity at a glance – a square per day in a column per week, shaded by how much happened, with month and weekday names, the total, and any day's value on hover or focus
- [Date Range Picker](date-range-picker.md) – Presets and two calendars with a hover preview, comparison with the previous period or year, full keyboard control
- [Travel Itinerary](travel-itinerary.md) – Trips as legs for a travel or expense audit – route codes, mode and carrier, the document used, confidence as a meter and %, source and grade, flags such as No record or Cash ticket in words, and connecting legs grouped into journeys

## Changelog

- **Multi Calendar** (`tc-multi-calendar`): a calendar of calendars – many people's Google, Outlook, Exchange and iCal calendars in Day, Week, Month, Agenda and a People view (one column per person), with show/hide per calendar, conflicts across a person's calendars, and create, edit, drag to move or resize, and delete on writable calendars – every change a cancelable event, so the page owns saving.
