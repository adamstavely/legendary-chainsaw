<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Notifications

**Feedback & onboarding** · New

The notification center – a bell with an unread badge that opens a panel of notifications grouped by day, with tabs, read state, inline actions, Mark all as read and Load more

- **Element:** `<tc-notifications>`
- **Size:** 18.1 KB gzip · 61.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/notifications";` |
| React / Next.js | `import { Notifications } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/notifications";` · tags starting with tc- are custom elements |
| Angular | `import { Notifications } from "@adamstavely/trenchcoat/angular/notifications";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/notifications";` |

## Example

The live example is in the gallery at `#/notifications`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The notification center at the top right of an app. A bell shows how many notifications are unread; it opens a
panel that lists them newest first, grouped by day – Today, Yesterday, the weekday, then dates – with tabs for All,
Unread and the app's own categories. Each notification says who did what, where and when, and can be opened, marked
read or unread, acted on in place (Approve, View) or dismissed. The app owns the data: every change is a cancelable
event, and the panel shows loading, error, empty and load-more states while the app fetches. `inline` renders the
same panel on its own for a full notifications page or a side drawer.

### When to use

- A persistent record of things that happened while the person was elsewhere: mentions, assignments, requests,
  finished jobs, security alerts.
- Anywhere people need to come back to a notification later, act on it, or see what they've already dealt with.
- A full notifications page or a drawer, with `inline`, sharing its data with the header's bell.

### When not to use

- A brief confirmation that disappears on its own – use [Toaster](toaster.md).
- A few announcements to read one at a time, such as release notes – use [Notification Stack](notification-stack.md).
- Progress of the person's own long-running jobs – use [Background Tasks](background-tasks.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Bell** `.ui-ntc__trigger` – the header button that opens the panel
2. **Badge** `.ui-ntc__badge` – the unread count, capped at “9+”, or a dot
3. **Tabs** `.ui-ntc__tabs` – All, Unread with its count, and the app's categories
4. **Day** `.ui-ntc__day` – the group label: Today, Yesterday, a weekday or a date
5. **Notification** `.ui-ntc__row` – the avatar or icon, who did what, the body and when; the whole row opens it
6. **Actions** `.ui-ntc__acts` – inline buttons such as Approve and Decline
7. **Read toggle** `.ui-ntc__dot` – the unread dot; it marks the notification read or unread

## Looks

Both looks open the panel on the menu surface with a plain title row. Inline, Standard sets the header on the gray
tray above a white card and underlines the selected tab in ink; Clean is one white card with the header as its first
row, an accent underline, small-capital day labels, lighter actor names and thinner icons.

## Usage

### HTML

```html
<tc-notifications id="bell" settings-href="/settings/notifications" has-more></tc-notifications>

<script type="module">
  import "@adamstavely/trenchcoat/notifications";
  import "@adamstavely/trenchcoat/tokens.css";

  const bell = document.querySelector("#bell");
  bell.categories = [{ id: "mentions", label: "Mentions" }];
  bell.items = [
    { id: "n1", actor: "Maya Chen", title: "mentioned you in Q3 roadmap", time: "2026-10-27T09:14:00Z", category: "mentions", href: "/q3" },
    { id: "n2", title: "Production deploy finished", time: "2026-10-27T08:30:00Z", read: true },
  ];
  bell.addEventListener("tc-load-more", async (e) => {
    const older = await fetch(`/api/notifications?after=${e.detail.after}`).then((r) => r.json());
    bell.items = [...bell.items, ...older.items];
    bell.hasMore = older.hasMore;
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Notifications, type NotificationItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function HeaderBell() {
  const [items, setItems] = useState<NotificationItem[]>([
    { id: "n1", actor: "Jordan Park", title: "requested access to Revenue dashboard", time: Date.parse("2026-10-27T07:02:00Z"), actions: [{ id: "approve", label: "Approve", primary: true }] },
  ]);
  return (
    <Notifications
      items={items}
      onItemsChange={(next) => setItems(next)}
      onAction={(item, action) => console.log(action, item.id)}
      settingsHref="/settings/notifications"
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/notifications";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcNotifications } from "@adamstavely/trenchcoat/notifications";

defineProps<{ items: TcNotifications["items"]; categories: TcNotifications["categories"] }>();
const onReadChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-notifications :items="items" :categories="categories" @tc-read-change="onReadChange"></tc-notifications>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Notifications } from "@adamstavely/trenchcoat/angular/notifications";
import type { TcNotifications } from "@adamstavely/trenchcoat/notifications";

@Component({
  selector: "app-notifications-example",
  imports: [Notifications],
  template: `<tc-notifications [items]="items()" [categories]="categories()" (tc-read-change)="onReadChange($event)"></tc-notifications>`,
})
export class NotificationsExample {
  readonly items = input.required<TcNotifications["items"]>();
  readonly categories = input.required<TcNotifications["categories"]>();
  onReadChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/notifications";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcNotifications } from "@adamstavely/trenchcoat/notifications";

  let { items, categories }: { items: TcNotifications["items"]; categories: TcNotifications["categories"] } = $props();
  let el: TcNotifications;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-read-change", on);
    return () => el.removeEventListener("tc-read-change", on);
  });
</script>

<tc-notifications bind:this={el} {items} {categories}></tc-notifications>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | – | `NotificationItem[]` | `[]` | The notifications, in any order – the panel sorts them newest first and groups them by day |
| `categories` | – | `NotificationCategory[]` | `[]` | App-defined tabs after All and Unread; a notification shows under the one its `category` names |
| `filter` | `filter` | `string` | `"all"` | The tab showing: "all", "unread" or a category's id |
| `open` | `open` | `boolean` | `false` | Whether the bell's panel is open |
| `inline` | `inline` | `boolean` | `false` | Renders the panel on its own, as a card, without the bell – for a notifications page or a side drawer |
| `heading` | `heading` | `string` | `"Notifications"` | The panel's title, and the start of the bell's name |
| `unreadCount` | `unread-count` | `number \| undefined` | `undefined` | The badge's count when the app knows more unread than it has loaded; unset counts the unread `items` |
| `max` | `max` | `number` | `9` | The badge shows "&lt;max>+" above this (default 9) |
| `dot` | `dot` | `boolean` | `false` | The badge is a dot, without the count (the bell's name still says how many) |
| `pulse` | `pulse` | `boolean` | `false` | The badge pulses briefly when new notifications arrive (not with reduced motion) |
| `dismissible` | `dismissible` | `boolean` | `false` | Every notification gets a dismiss button, not only those with `dismissible` |
| `loading` | `loading` | `boolean` | `false` | Shows the skeleton in place of the list – the first page is loading |
| `loadingMore` | `loading-more` | `boolean` | `false` | Shows "Loading more…" at the end of the list – a further page is loading |
| `hasMore` | `has-more` | `boolean` | `false` | There are older notifications to load: shows Load more (or, with `infinite`, loads as the end scrolls into view) |
| `infinite` | `infinite` | `boolean` | `false` | Fires tc-load-more when the end of the list scrolls into view, instead of showing Load more |
| `error` | `error` | `string` | `""` | An error to show with Try again – in place of the list when nothing is loaded, else at its end |
| `settingsHref` | `settings-href` | `string` | `""` | A settings link in the header (an icon button named “Notification settings”) |
| `settings` | `settings` | `boolean` | `false` | A settings button in the header that fires tc-settings, when there's no `settingsHref` |
| `now` | – | `number \| Date \| undefined` | `undefined` | "Now" for the day groups and relative times (epoch ms or a Date). Unset: the time the element connected |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates and weekdays; unset uses the browser's |
| `labels` | – | `Partial<NotificationsLabels>` | `{}` | Any of the panel's texts, to change the wording or the language |
| `announce` | – | `((items: NotificationItem[]) => string) \| undefined` | `undefined` | What's announced when notifications arrive; default “New notification: &lt;actor> &lt;title>” or “3 new notifications” |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-read-change` | – | Yes | A notification was opened (marking it read) or its read toggle was used; detail `{ ids, read, items }`. Cancelable: preventDefault() and the app changes it |
| `tc-mark-all-read` | – | Yes | Mark all as read was chosen; detail `{ ids, items }`. Cancelable: preventDefault() and the app marks them |
| `tc-dismiss` | – | Yes | A notification's dismiss button was used; detail `{ id, item, items }` (`items` without it). Cancelable: preventDefault() and the app removes it |
| `tc-action` | – | Yes | An inline action was chosen; detail `{ id, action, item }`. Cancelable: preventDefault() keeps the notification unread |
| `tc-item-open` | – | Yes | A notification was opened (clicked, or Enter on it); detail `{ id, item }`. Cancelable: preventDefault() stops its link being followed (route it yourself) |
| `tc-filter-change` | – | Yes | A tab was picked; detail `{ filter }` – "all", "unread" or a category's id. Cancelable: preventDefault() and the app sets `filter` |
| `tc-open-change` | – | Yes | The panel is opening or closing; detail `{ open }`. Cancelable: preventDefault() keeps it as it is |
| `tc-load-more` | – | Yes | Load more was chosen, or the end of the list scrolled into view with `infinite`; detail `{ after, count }`. Cancelable: preventDefault() and the element doesn't set `loadingMore` itself |
| `tc-retry` | – | Yes | Try again was chosen after an error; detail `{}`. Cancelable: preventDefault() and the element doesn't clear `error` and show loading itself |
| `tc-settings` | – | Yes | The settings link or button was chosen; detail `{}`. Cancelable: preventDefault() stops `settingsHref` being followed |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-hn-trigger-size` | `var(--tc-control-h-md)` | not set – this fallback applies |
| `--tc-hn-icon-size` | `18px` | not set – this fallback applies |
| `--tc-notifications-badge-bg` | `var(--tc-red-600)` | not set – this fallback applies |
| `--tc-hn-ring` | `var(--tc-surface-raised)` | not set – this fallback applies |
| `--tc-notifications-max-height` | `none` | not set – this fallback applies |

#### Design tokens it reads (115)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-red-600`, `--tc-shadow-overlay`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `notificationMs(t: NotificationItem["time"]): void` | A notification's time in epoch ms (NaN when it can't be read) |
| `notificationTime(ms: number, now: number, locale?: string, justNow: unknown): string` | The compact relative time: "now", "5m", "3h", "2d", then the date ("12 Oct") |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-notifications :items="…">` | `<tc-notifications [items]="…">` | `<tc-notifications {items}>` |
| `categories` | `el.categories = …;` | `<… categories={…} />` | `<tc-notifications :categories="…">` | `<tc-notifications [categories]="…">` | `<tc-notifications {categories}>` |
| `now` | `el.now = …;` | `<… now={…} />` | `<tc-notifications :now="…">` | `<tc-notifications [now]="…">` | `<tc-notifications {now}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-notifications :labels="…">` | `<tc-notifications [labels]="…">` | `<tc-notifications {labels}>` |
| `announce` | `el.announce = …;` | `<… announce={…} />` | `<tc-notifications :announce="…">` | `<tc-notifications [announce]="…">` | `<tc-notifications {announce}>` |

*Also attributes: `filter`, `open`, `inline`, `heading`, `unread-count`, `max`, `dot`, `pulse` and 9 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-read-change` | Yes | `el.addEventListener("tc-read-change", (e) => …)` | `onReadChange={…}` | `@tc-read-change="…"` | `(tc-read-change)="…($event)"` | `el.addEventListener("tc-read-change", …)` |
| `tc-mark-all-read` | Yes | `el.addEventListener("tc-mark-all-read", (e) => …)` | `onMarkAllRead={…}` | `@tc-mark-all-read="…"` | `(tc-mark-all-read)="…($event)"` | `el.addEventListener("tc-mark-all-read", …)` |
| `tc-dismiss` | Yes | `el.addEventListener("tc-dismiss", (e) => …)` | `onDismiss={…}` | `@tc-dismiss="…"` | `(tc-dismiss)="…($event)"` | `el.addEventListener("tc-dismiss", …)` |
| `tc-action` | Yes | `el.addEventListener("tc-action", (e) => …)` | `onAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |
| `tc-item-open` | Yes | `el.addEventListener("tc-item-open", (e) => …)` | `onItemOpen={…}` | `@tc-item-open="…"` | `(tc-item-open)="…($event)"` | `el.addEventListener("tc-item-open", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `onFilterChange={…}` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-load-more` | Yes | `el.addEventListener("tc-load-more", (e) => …)` | `onLoadMore={…}` | `@tc-load-more="…"` | `(tc-load-more)="…($event)"` | `el.addEventListener("tc-load-more", …)` |
| `tc-retry` | Yes | `el.addEventListener("tc-retry", (e) => …)` | `onRetry={…}` | `@tc-retry="…"` | `(tc-retry)="…($event)"` | `el.addEventListener("tc-retry", …)` |
| `tc-settings` | Yes | `el.addEventListener("tc-settings", (e) => …)` | `onSettings={…}` | `@tc-settings="…"` | `(tc-settings)="…($event)"` | `el.addEventListener("tc-settings", …)` |

### Controlled

The element changes `filter` and `open` itself unless a listener calls `preventDefault()` on `tc-filter-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-notifications id="notifications"></tc-notifications>

<script type="module">
  import "@adamstavely/trenchcoat/notifications";

  const el = document.querySelector("#notifications");
  el.addEventListener("tc-filter-change", (e) => {
    e.preventDefault(); // the element keeps its filter…
    if (allowed(e.detail.filter)) el.filter = e.detail.filter; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { Notifications } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof Notifications>;
type Props = Omit<Own, "filter" | "onFilterChange"> & { initial: NonNullable<Own["filter"]> };

// Controlled: passing filter makes the wrapper prevent the element's own change; the app sets it
export function ControlledNotifications({ initial, ...props }: Props) {
  const [filter, setFilter] = useState<Own["filter"]>(initial);
  return <Notifications {...props} filter={filter} onFilterChange={(next) => setFilter(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/notifications";
import type { TcNotifications } from "@adamstavely/trenchcoat/notifications";

const props = defineProps<{ initial: TcNotifications["filter"] }>();
const filter = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFilterChange = (e: CustomEvent<{ filter: TcNotifications["filter"] }>) => {
  e.preventDefault();
  filter.value = e.detail.filter;
};
</script>

<template>
  <tc-notifications :filter="filter" @tc-filter-change="onFilterChange"></tc-notifications>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Notifications } from "@adamstavely/trenchcoat/angular/notifications";
import type { TcNotifications } from "@adamstavely/trenchcoat/notifications";

@Component({
  selector: "app-controlled-notifications",
  imports: [Notifications],
  template: `<tc-notifications [filter]="filter()" (tc-filter-change)="onFilterChange($event)"></tc-notifications>`,
})
export class ControlledNotifications {
  readonly initial = input.required<TcNotifications["filter"]>();
  readonly filter = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFilterChange(e: CustomEvent<{ filter: TcNotifications["filter"] }>) {
    e.preventDefault();
    this.filter.set(e.detail.filter);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/notifications";
  import type { TcNotifications } from "@adamstavely/trenchcoat/notifications";

  let { initial }: { initial: TcNotifications["filter"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let filter = $derived(initial);
  let el: TcNotifications;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      filter = (e as CustomEvent<{ filter: TcNotifications["filter"] }>).detail.filter;
    };
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-notifications bind:this={el} {filter}></tc-notifications>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-notifications")` returns a `TcNotifications` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcNotifications } from "@adamstavely/trenchcoat/notifications";`
- **React / Next.js:** Props: `import type { NotificationsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Notifications>`. The element class, for refs: `import type { TcNotifications } from "@adamstavely/trenchcoat/notifications";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcNotifications["items"]` with `import type { TcNotifications } from "@adamstavely/trenchcoat/notifications";`
- **Angular:** The directive types the template: `[items]` takes `TcNotifications["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcNotifications } from "@adamstavely/trenchcoat/notifications";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcNotifications } from "@adamstavely/trenchcoat/notifications";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The panel's title, and the start of the bell's name – "Notifications" by default |
| `items` | `NotificationItem[]` | The notifications. Controlled when defined: reading, Mark all as read and dismiss only report, and you update the list |
| `defaultItems` | `NotificationItem[]` | The notifications when uncontrolled – the component applies read changes and dismissals itself |
| `onItemsChange` | `(items: NotificationItem[], change: NotificationsChange) => void` | Called with the list as it is after a read change, Mark all as read or a dismissal, and what happened |
| `onReadChange` | `(ids: string[], read: boolean) => void` | Notifications were marked read or unread (opening one marks it read) |
| `onMarkAllRead` | `(ids: string[]) => void` | Mark all as read was chosen, with the ids it marks |
| `onDismiss` | `(item: NotificationItem) => void` | A notification was dismissed |
| `onAction` | `(item: NotificationItem, action: string) => boolean \| void` | An inline action was chosen; return false to keep the notification unread |
| `onItemOpen` | `(item: NotificationItem) => boolean \| void` | A notification was opened; return false to stop its link being followed (route it yourself) |
| `onLoadMore` | `(after: string \| null, count: number) => void` | The next page is wanted: the oldest loaded notification's id and how many are loaded. Set `loadingMore` while it loads |
| `onRetry` | `() => void` | Try again was chosen after an error |
| `onSettings` | `() => boolean \| void` | The settings link or button was chosen; return false to stop `settingsHref` being followed |
| `filter` | `string` | The tab showing: "all", "unread" or a category's id. Controlled when defined |
| `defaultFilter` | `string` | The tab showing first when uncontrolled |
| `onFilterChange` | `(filter: string) => void` | A tab was picked |
| `open` | `boolean` | Whether the bell's panel is open. Controlled when defined |
| `defaultOpen` | `boolean` | Whether the panel starts open when uncontrolled |
| `onOpenChange` | `(open: boolean) => void` | The panel opened or closed |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the bell: opens or closes the panel; focus goes to the first notification |
| ← / → | In the tabs: the previous or next tab, selected as it's reached (wraps around) |
| Home / End | In the tabs: the first or last tab. In the list: the first or last notification |
| ↓ / ↑ | In the list: the next or previous notification, across day groups |
| Enter | On a notification: opens it (follows its link) and marks it read |
| Tab | From the tabs into the list (one tab stop), then through the focused notification's actions, read toggle and dismiss, then Load more |
| Escape | Closes the panel and returns focus to the bell |

### Screen readers

The bell is a button with `aria-haspopup="dialog"` and `aria-expanded`, named with the exact count even when the
badge is capped or a dot: “Notifications, 12 unread”. The panel is a non-modal `dialog` named by its title; inline,
the host is a `region` named by it. The tabs are a `tablist` named “Filter notifications”, and the list is the
`tabpanel`, busy while it loads. Each day is a `group` named by its label. A notification is a link (or a button
when it has no link) named by what it shows, with “Unread,” before it while it's unread – “Unread, Maya Chen
mentioned you in Q3 roadmap” – and described by its body, where it happened and the full time (“Tuesday 27 October
2026 at 11:54”); the short time (“6m”) is hidden from screen readers. Its actions keep their visible names and are
described by the notification's title; the read toggle is “Mark as read” or “Mark as unread”, and dismiss is
“Dismiss”. A polite status region says “New notification: Alex Romero commented on Pricing page copy”, or “3 new
notifications” for a batch – once per update, never one message per item – and “All notifications marked as read”
and “Notification dismissed” after those actions.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers, internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself, internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself, internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

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

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 43.5 KB | 12.4 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/trigger-tip` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **61.3 KB** | **18.0 KB** |
| With Lit – the first component on a page | 83.2 KB | 25.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 8 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of items replaced |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.3 ms | items: first render, 8 nodes; update 0.3 ms |
| 1,000 items | 2.6 ms | items: first render, 8 nodes; update 0.8 ms |

What it renders doesn't grow with items (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- 1 infinite CSS animation.
- Stops or pauses off screen and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (internal/popover – PopoverController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Lead with the actor, then what they did and to what: actor “Maya Chen”, title “mentioned you in Q3 roadmap”.
  Without a person, write the whole event as the title: “Production deploy finished”.
- Keep the body to the detail someone needs to decide whether to open it; it's clamped at two lines.
- Use `context` for where it happened (“Billing · BIL-482”), not for when – the time is added for you.
- Name inline actions with a verb (“Approve”, “Decline”, “View”); give at most one `primary`.
- Keep category labels to one word if you can (Mentions, Assigned, System) – the tabs scroll sideways at 320 px but
  read best when they fit.
- Pass `error` as what went wrong in a sentence (“The notifications service didn’t respond.”); the panel adds its
  own heading and Try again.

## Do and don't

### Do

- Keep the notifications in your own state, prevent the events, and pass the new list back – or listen and let the
  component apply the change.
- Set `loading` for the first page and `loadingMore` for later ones, so arrivals aren't announced while a page loads.
- Give `unreadCount` when the server knows more unread notifications than you've loaded.
- Share one list between the header's bell and an `inline` page so both agree on what's read.

### Don't

- Don't use it for messages that need an answer before the person can carry on – use a dialog.
- Don't mark notifications read just because the panel was opened; the person decides by opening or acting on one.
- Don't send a toast as well for every notification that arrives – the badge and the announcement already say so.

## Related

- [Notification Stack](notification-stack.md) – Notice cards stacked behind each other – dismiss the front one to reveal the next
- [Toaster](toaster.md) – Calm toasts from anywhere – a stack that fans out on hover, promise toasts that morph from spinner to check, swipe to dismiss
- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
- [Profile Menu](profile-menu.md) – Account card with the signed-in user, menu actions and profile setup progress

## Changelog

- **Header Nav:** the bell, the app picker and the avatar each show their name in a tooltip under them on hover (after a beat) and keyboard focus – the bell's `heading` (“Notifications”), the picker's `label` (“Apps”) and the avatar's `account-label` with the person's name (“Account: Helena Vance”). Hidden while the trigger's popover is open, and with Escape until the next hover or focus; on an `inverse` bar they take the dark theme's tooltip colours. `tc-notifications` and `tc-app-picker` show theirs standalone too.
- **`tc-notifications`:** the notification center. - **Bell:** an unread badge. - **List:** All / Unread and category tabs, with items grouped by day. - **Per item:** read toggle, actions and dismiss; "Mark all as read". - **More:** load more or infinite scroll, polite announcements of new arrivals, and an inline mode. Every change is a cancelable event.
