<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Webhooks

**Inputs & controls** · New

Webhook endpoints: address, events, an on/off switch and delivery health in words ("3 of 48 failed in the last 24 hours"), recent deliveries with status, timing, attempt and Retry, Add and Edit in place (https only, events with All events), Send test event, Delete asked in place, and a masked signing secret

- **Element:** `<tc-webhooks>`
- **Size:** 10.5 KB gzip · 36.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/webhooks";` |
| React / Next.js | `import { Webhooks } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/webhooks";` · tags starting with tc- are custom elements |
| Angular | `import { Webhooks } from "@adamstavely/trenchcoat/angular/webhooks";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/webhooks";` |

## Example

The live example is in the gallery at `#/webhooks`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The webhook endpoints a workspace sends events to. Each endpoint shows its address, what it's for, which events it gets as chips, a switch to turn it on and off, and how its deliveries have gone in the last 24 hours, in words: "3 of 48 failed in the last 24 hours", "All 12 delivered in the last 24 hours" or "No deliveries yet".

The health line opens the endpoint's recent deliveries: the time, the event, whether it was delivered, failed or is "Retrying at 14:05", the HTTP status (or "No response"), how long it took and which attempt it was. A failed delivery has Retry (`tc-delivery-retry`). Each endpoint also has Send test event (`tc-endpoint-test`), Edit – a form in place (`tc-endpoint-update`) – and Delete, which asks first (`tc-endpoint-delete`). The switch fires `tc-endpoint-toggle`.

Add endpoint opens the same form at the top: an https address (anything else is refused with "Use an https:// address."), a description and the events, with All events. It fires `tc-endpoint-create`, and the page adds the endpoint. With `secret`, an endpoint's signing secret shows masked, with Show and Copy.

The element only shows and asks: the server sends, signs and retries.

### When to use

- A developer settings page where people point your app's events at their own systems.
- Checking why an integration stopped: which deliveries failed, and retrying them.

### When not to use

- Keys for calling your API – use [API Keys](api-keys.md).
- Connecting a named third-party app with its own settings – use [Integration Settings](integration-settings.md).
- A record of who changed what – use [Audit Trail](../blocks/audit-trail.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the title, and Add endpoint `.ui-whe__add`
2. **Endpoint** `.ui-whe__endpoint` – `.ui-whe__url`, `.ui-whe__desc`, the switch `.ui-whe__switch` and the event chips `.ui-whe__events`
3. **Signing secret** `.ui-whe__secret` – masked, with `.ui-whe__show` and `.ui-whe__copy`
4. **Health** `.ui-whe__toggle` – the health line `.ui-whe__health`, which opens the deliveries
5. **Actions** `.ui-whe__actions` – `.ui-whe__test`, `.ui-whe__edit` and `.ui-whe__remove`, with the question `.ui-whe__confirm`
6. **Deliveries** `.ui-whe__deliveries` – each `.ui-whe__delivery` with `.ui-whe__d-result` and `.ui-whe__retry`
7. **Form** `.ui-whe__form` – `.ui-whe__url-input`, the description, `.ui-whe__all-events` and the event checkboxes

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row. The switch uses the switch tokens; delivery results and health use the status colours with a dot and a word. Narrow, an endpoint's switch drops under its address and each delivery stacks into two lines.

## Usage

### HTML

```html
<tc-webhooks id="hooks" description="Ledgerline · Fraud review workspace"></tc-webhooks>

<script type="module">
  import "@adamstavely/trenchcoat/webhooks";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#hooks");
  el.eventTypes = [
    { id: "case.created", label: "case.created", description: "A case is opened" },
    { id: "case.closed", label: "case.closed", description: "A case is closed with an outcome" },
  ];
  el.endpoints = [{ id: "e1", url: "https://hooks.example.com/case-sync", events: ["case.created"], enabled: true, deliveries: [] }];
  el.addEventListener("tc-endpoint-create", async (e) => {
    const endpoint = await fetch("/api/webhooks", { method: "POST", body: JSON.stringify(e.detail) }).then((r) => r.json());
    el.endpoints = [...el.endpoints, endpoint];
  });
  el.addEventListener("tc-delivery-retry", (e) => fetch(`/api/webhooks/${e.detail.endpointId}/deliveries/${e.detail.deliveryId}/retry`, { method: "POST" }));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Webhooks, type WebhookEndpoint } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function WebhookSettings({ initial, save }: { initial: WebhookEndpoint[]; save: (endpoints: WebhookEndpoint[]) => void }) {
  const [endpoints, setEndpoints] = useState(initial);
  return (
    <Webhooks
      endpoints={endpoints}
      onEndpointsChange={(next) => {
        setEndpoints(next);
        save(next);
      }}
      eventTypes={[{ id: "case.created", label: "case.created" }]}
      onEndpointCreate={({ url, description, events }) => setEndpoints((all) => [...all, { id: crypto.randomUUID(), url, description, events, enabled: true }])}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/webhooks";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcWebhooks } from "@adamstavely/trenchcoat/webhooks";

defineProps<{ endpoints: TcWebhooks["endpoints"]; eventTypes: TcWebhooks["eventTypes"] }>();
const onEndpointToggle = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-webhooks :endpoints="endpoints" :eventTypes="eventTypes" @tc-endpoint-toggle="onEndpointToggle"></tc-webhooks>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Webhooks } from "@adamstavely/trenchcoat/angular/webhooks";
import type { TcWebhooks } from "@adamstavely/trenchcoat/webhooks";

@Component({
  selector: "app-webhooks-example",
  imports: [Webhooks],
  template: `<tc-webhooks [endpoints]="endpoints()" [eventTypes]="eventTypes()" (tc-endpoint-toggle)="onEndpointToggle($event)"></tc-webhooks>`,
})
export class WebhooksExample {
  readonly endpoints = input.required<TcWebhooks["endpoints"]>();
  readonly eventTypes = input.required<TcWebhooks["eventTypes"]>();
  onEndpointToggle(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/webhooks";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcWebhooks } from "@adamstavely/trenchcoat/webhooks";

  let { endpoints, eventTypes }: { endpoints: TcWebhooks["endpoints"]; eventTypes: TcWebhooks["eventTypes"] } = $props();
  let el: TcWebhooks;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-endpoint-toggle", on);
    return () => el.removeEventListener("tc-endpoint-toggle", on);
  });
</script>

<tc-webhooks bind:this={el} {endpoints} {eventTypes}></tc-webhooks>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; by default "Webhooks" |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `endpoints` | – | `WebhookEndpoint[]` | `[]` | The endpoints. Toggling, editing and deleting change it unless the event's listener calls preventDefault() |
| `eventTypes` | – | `WebhookEventType[]` | `[]` | The events an endpoint can get, offered as checkboxes and named on its chips |
| `maxDeliveries` | `max-deliveries` | `number` | `10` | How many recent deliveries an open endpoint lists |
| `readOnly` | `read-only` | `boolean` | `false` | Hides Add, Edit, Delete and the switches, for people who may only look |
| `now` | `now` | `number \| undefined` | `undefined` | "Now" in epoch ms; unset, the clock's |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for times |
| `labels` | – | `Partial<WebhooksLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-endpoint-toggle` | – | Yes | An endpoint's switch was flipped ({ id, enabled, endpoints }: WebhookEndpointToggle); cancelable – prevented, `endpoints` stays as it was |
| `tc-endpoint-create` | – | Yes | Add endpoint was submitted ({ url, description, events }: WebhookEndpointCreate); cancelable – prevented, the form stays open. The page adds the endpoint |
| `tc-endpoint-update` | – | Yes | An edit was saved ({ id, url, description, events, endpoints }: WebhookEndpointUpdate); cancelable – prevented, the form stays open and `endpoints` stays as it was |
| `tc-endpoint-delete` | – | Yes | Delete was confirmed ({ id, endpoints }: WebhookEndpointDelete); cancelable – prevented, `endpoints` stays as it was |
| `tc-endpoint-test` | – | No | Send test event was pressed ({ id }: WebhookEndpointTest) |
| `tc-delivery-retry` | – | No | Retry was pressed on a failed delivery ({ endpointId, deliveryId }: WebhookDeliveryRetry) |

#### Design tokens it reads (60)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-h-sm`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-radius-full`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `webhookUrlOk(url: string): void` | Whether an address is one a webhook may be sent to: https, with a host |
| `webhookHealth(endpoint: Pick<WebhookEndpoint, "deliveries">, now: number): void` | How an endpoint's last 24 hours went: deliveries, and how many of them failed (a waiting retry counts as failed) |

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
| `endpoints` | `el.endpoints = …;` | `<… endpoints={…} />` | `<tc-webhooks :endpoints="…">` | `<tc-webhooks [endpoints]="…">` | `<tc-webhooks {endpoints}>` |
| `eventTypes` | `el.eventTypes = …;` | `<… eventTypes={…} />` | `<tc-webhooks :eventTypes="…">` | `<tc-webhooks [eventTypes]="…">` | `<tc-webhooks {eventTypes}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-webhooks :labels="…">` | `<tc-webhooks [labels]="…">` | `<tc-webhooks {labels}>` |

*Also attributes: `heading`, `description`, `max-deliveries`, `read-only`, `now`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-endpoint-toggle` | Yes | `el.addEventListener("tc-endpoint-toggle", (e) => …)` | `onEndpointsChange={…}` | `@tc-endpoint-toggle="…"` | `(tc-endpoint-toggle)="…($event)"` | `el.addEventListener("tc-endpoint-toggle", …)` |
| `tc-endpoint-create` | Yes | `el.addEventListener("tc-endpoint-create", (e) => …)` | `onEndpointCreate={…}` | `@tc-endpoint-create="…"` | `(tc-endpoint-create)="…($event)"` | `el.addEventListener("tc-endpoint-create", …)` |
| `tc-endpoint-update` | Yes | `el.addEventListener("tc-endpoint-update", (e) => …)` | `onEndpointsChange={…}` | `@tc-endpoint-update="…"` | `(tc-endpoint-update)="…($event)"` | `el.addEventListener("tc-endpoint-update", …)` |
| `tc-endpoint-delete` | Yes | `el.addEventListener("tc-endpoint-delete", (e) => …)` | `onEndpointsChange={…}` | `@tc-endpoint-delete="…"` | `(tc-endpoint-delete)="…($event)"` | `el.addEventListener("tc-endpoint-delete", …)` |
| `tc-endpoint-test` | No | `el.addEventListener("tc-endpoint-test", (e) => …)` | `onEndpointTest={…}` | `@tc-endpoint-test="…"` | `(tc-endpoint-test)="…($event)"` | `el.addEventListener("tc-endpoint-test", …)` |
| `tc-delivery-retry` | No | `el.addEventListener("tc-delivery-retry", (e) => …)` | `onDeliveryRetry={…}` | `@tc-delivery-retry="…"` | `(tc-delivery-retry)="…($event)"` | `el.addEventListener("tc-delivery-retry", …)` |

### Controlled

`tc-endpoint-toggle`, `tc-endpoint-create`, `tc-endpoint-update`, `tc-endpoint-delete` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-webhooks")` returns a `TcWebhooks` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcWebhooks } from "@adamstavely/trenchcoat/webhooks";`
- **React / Next.js:** Props: `import type { WebhooksProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Webhooks>`. The element class, for refs: `import type { TcWebhooks } from "@adamstavely/trenchcoat/webhooks";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcWebhooks["endpoints"]` with `import type { TcWebhooks } from "@adamstavely/trenchcoat/webhooks";`
- **Angular:** The directive types the template: `[endpoints]` takes `TcWebhooks["endpoints"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcWebhooks } from "@adamstavely/trenchcoat/webhooks";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcWebhooks } from "@adamstavely/trenchcoat/webhooks";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Webhooks" |
| `endpoints` | `WebhookEndpoint[]` | The endpoints – controlled when given |
| `defaultEndpoints` | `WebhookEndpoint[]` | The endpoints on mount when `endpoints` isn't controlled |
| `onEndpointsChange` | `(endpoints: WebhookEndpoint[], change: WebhookEndpointsChange) => void` | An endpoint was switched, edited or deleted: the endpoints as they are now, and what changed |
| `onEndpointCreate` | `(detail: WebhookEndpointCreate, event: CustomEvent<WebhookEndpointCreate>) => void` | Add endpoint was submitted; add it to `endpoints`. Call event.preventDefault() to keep the form open |
| `onEndpointTest` | `(id: string) => void` | Send test event was pressed |
| `onDeliveryRetry` | `(detail: WebhookDeliveryRetry) => void` | Retry was pressed on a failed delivery |

*Renamed or hidden on the wrapper: `heading`, `endpoints`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Move through Add endpoint and each endpoint's switch, health line, Send test event, Edit and Delete |
| Enter / Space | Press the button with focus; Space flips a switch |
| Escape | Close an open form |

### Screen readers

Endpoints are a list labelled by the heading. Each switch is a `switch` named with its state and address ("Sending, https://hooks.example.com/…"). The health line is a button that says whether the deliveries are open and how many there are. Deliveries are an ordered list; each says delivered, failed or when it retries in words. Buttons are named with their endpoint or delivery. The form's address says why it was refused, and toggling, saving and deleting are announced in a polite status line.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-22 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.5 KB | 8.2 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **36.4 KB** | **10.5 KB** |
| With Lit – the first component on a page | 58.8 KB | 17.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.8 ms** | the gallery demo's data, 238 DOM nodes – to layout, median of 7 |
| Typical update | **1.9 ms** | one item of eventTypes replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.6 ms | eventTypes: first render, 238 nodes; update 0.9 ms |
| 1,000 items | 2.3 ms | eventTypes: first render, 238 nodes; update 0.8 ms |

What it renders doesn't grow with eventTypes (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Describe what each endpoint feeds: "Keeps the reporting warehouse in step".
- Give event types dotted ids and a sentence each: "case.closed – A case is closed with an outcome".
- Send the newest deliveries first; `max-deliveries` (10 by default) caps how many show.

## Do and don't

### Do

- Keep deliveries for at least 24 hours, so the health line has something to count.
- Set `nextRetryAt` while a retry waits, so the row says when.
- Ask for https only – the form refuses anything else.

### Don't

- Don't show the signing secret unmasked by default – leave it to Show.
- Don't hide failed deliveries: Retry is how people recover them.

## Related

- [API Keys](api-keys.md) – A workspace's API keys: each key's name, masked value, permissions, who made it, last use and status in words (Active, Expires in 5 days, Expired, Revoked), Create key with name, permissions and expiry and the new secret shown once with Copy, Revoke asked in place, and inactive keys folded away
- [Integration Settings](integration-settings.md) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar
- [Share Link Manager](share-link-manager.md) – The links that already share something – status in words, expiry, opens and who made them, with Copy, Change expiry and Revoke, which says how many opens it's had
- [Audit Trail](../blocks/audit-trail.md) – Who did what and when, for the record – grouped by day, with search, a filter by outcome, details on demand and a safe CSV export
