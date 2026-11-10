<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Integration Picker

**Inputs & controls**

Integrations page of a command menu – search, a list of services and the picked one with its connection on two tiles

- **Element:** `<tc-integration-picker>`
- **Size:** 16.9 KB gzip · 59.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/integration-picker";` |
| React / Next.js | `import { IntegrationPicker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/integration-picker";` · tags starting with tc- are custom elements |
| Angular | `import { IntegrationPicker } from "@adamstavely/trenchcoat/angular/integration-picker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/integration-picker";` |

## Example

The live example is in the gallery at `#/integration-picker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The integrations page of a command menu: a search field on top, the services grouped into Connected and Available
on the left, and the picked one on the right – your app and the service on two linked tiles, what the integration
does, up to three things it adds, and a switch that connects or disconnects it. People find a service by typing,
move through the list with the arrow keys and connect it with ↵, without leaving the keyboard. The real connect can
be asynchronous: return a promise from `onToggle` and the switch shows that it's working, then flips – or says it
couldn't, and stays as it was.

### When to use

- A page inside a command menu or settings dialog where people browse and connect third-party services.
- A catalogue of up to a few dozen integrations, where one line per service and a details pane are enough to
  decide.
- Flows that should work from the keyboard end to end – search, move, connect.

### When not to use

- Running commands or jumping somewhere across the whole product – use [Command Menu](command-menu.md), and open this picker as one
  of its pages.
- Configuring one connected service – its key, address and options – use [Integration Settings](integration-settings.md).
- Picking services as values in a form field – use [Combobox](combobox.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Search** `.ui-ip__search` – filters by name, domain and category; ⌘/ jumps here
2. **List** `.ui-ip__list` – the services under Connected and Available, the picked one highlighted
3. **Service** `.ui-ip__item` – a logo tile, the name and the category
4. **Tiles** `.ui-ip__art` – your app and the picked service, linked
5. **Switch** `.ui-ip__switch` – connects or disconnects the picked service
6. **Capabilities** `.ui-ip__features` – up to three things the integration adds

## Looks

Standard sets a white card in a gray tray, with “Integrations”, a back arrow and the “2 of 9 connected” count on
the tray above it. Clean has no tray: one white card with hairline shadows, the crumb and search in its top row,
and a last row with the connected count and the ↑ ↓ ↵ key hints.

## Usage

### HTML

```html
<tc-integration-picker id="picker" app-name="Acme" back></tc-integration-picker>

<script type="module">
  import "@adamstavely/trenchcoat/integration-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  const picker = document.querySelector("#picker");
  picker.integrations = [
    { id: "linear", name: "Linear", domain: "linear.app", category: "Project management", description: "Turn requests into issues.", connected: true },
    { id: "stripe", name: "Stripe", domain: "stripe.com", category: "Payments", description: "See invoices next to every conversation." },
  ];
  picker.onToggle = (id, connected, { signal }) =>
    fetch(`/api/integrations/${id}`, { method: connected ? "POST" : "DELETE", signal });
  picker.addEventListener("tc-back", () => history.back());
</script>
```

### React / Next.js

```tsx
import { IntegrationPicker, defaultIntegrations } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Integrations({ onBack }: { onBack: () => void }) {
  return (
    <IntegrationPicker
      integrations={defaultIntegrations}
      appName="Acme"
      onToggle={(id, connected, { signal }) => fetch(`/api/integrations/${id}`, { method: connected ? "POST" : "DELETE", signal })}
      onExplore={(id) => console.log("Open settings for", id)}
      onBack={onBack}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/integration-picker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcIntegrationPicker } from "@adamstavely/trenchcoat/integration-picker";

defineProps<{ integrations: TcIntegrationPicker["integrations"]; appIcon: TcIntegrationPicker["appIcon"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-integration-picker :integrations="integrations" :appIcon="appIcon" @tc-selected-change="onSelectedChange"></tc-integration-picker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { IntegrationPicker } from "@adamstavely/trenchcoat/angular/integration-picker";
import type { TcIntegrationPicker } from "@adamstavely/trenchcoat/integration-picker";

@Component({
  selector: "app-integration-picker-example",
  imports: [IntegrationPicker],
  template: `<tc-integration-picker [integrations]="integrations()" [appIcon]="appIcon()" (tc-selected-change)="onSelectedChange($event)"></tc-integration-picker>`,
})
export class IntegrationPickerExample {
  readonly integrations = input.required<TcIntegrationPicker["integrations"]>();
  readonly appIcon = input.required<TcIntegrationPicker["appIcon"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/integration-picker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcIntegrationPicker } from "@adamstavely/trenchcoat/integration-picker";

  let { integrations, appIcon }: { integrations: TcIntegrationPicker["integrations"]; appIcon: TcIntegrationPicker["appIcon"] } = $props();
  let el: TcIntegrationPicker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-integration-picker bind:this={el} {integrations} {appIcon}></tc-integration-picker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `integrations` | – | `IntegrationPickerItem[]` | `[ { id: "linear", name: "Linear", domain: "linear.app", category: "Project management", description: "Turn requests from chat into issues and keep their status in sync both ways.", features: ["Create issues from any message", "Two-way status sync", "Link issues to customers"], path: "M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 0 1 .322-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z", color: "#ffffff", tile: "#5E6AD2", connected: true, }, { id: "figma", tile: "#ffffff", name: "Figma", domain: "figma.com", category: "Design", description: "Preview frames where you talk about them and link designs to their tasks.", features: ["Live frame previews", "Comment threads in one place", "Link frames to tasks"], connected: false, }, { id: "notion", name: "Notion", domain: "notion.so", category: "Docs & wiki", description: "Search your workspace while you write and save answers as pages.", features: ["Search pages and databases", "Save answers as pages", "Keep docs in sync"], path: "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z", color: "currentColor", tile: "#ffffff", connected: true, }, { id: "stripe", name: "Stripe", domain: "stripe.com", category: "Payments", description: "See customers, invoices and subscriptions next to every conversation.", features: ["Customer and invoice lookup", "Subscription changes as events", "Revenue per account"], path: "M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z", color: "#ffffff", tile: "#635BFF", connected: true, }, { id: "hubspot", name: "HubSpot", domain: "hubspot.com", category: "CRM", description: "Keep contacts and deals current – notes and calls are logged for you.", features: ["Sync contacts and companies", "Log activity on deals", "Trigger workflows"], path: "M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z", color: "#ffffff", tile: "#FF7A59", connected: false, }, { id: "shopify", name: "Shopify", domain: "shopify.com", category: "Commerce", description: "Answer customer questions with the real order, product and stock in view.", features: ["Order and refund lookup", "Low-stock alerts", "Product catalog search"], path: "M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z", color: "#ffffff", tile: "#95BF47", connected: false, }, { id: "airtable", name: "Airtable", domain: "airtable.com", category: "Databases", description: "Read and update any base – rows and fields stay linked to your projects.", features: ["Read and write records", "Watch views for changes", "Map fields to properties"], tile: "#ffffff", connected: false, }, { id: "webflow", name: "Webflow", domain: "webflow.com", category: "Website", description: "Publish CMS items and collect form submissions right from your workspace.", features: ["Publish CMS items", "Collect form submissions", "Schedule site updates"], path: "m24 4.515-7.658 14.97H9.149l3.205-6.204h-.144C9.566 16.713 5.621 18.973 0 19.485v-6.118s3.596-.213 5.71-2.435H0V4.515h6.417v5.278l.144-.001 2.622-5.277h4.854v5.244h.144l2.72-5.244H24Z", color: "#ffffff", tile: "#146EF5", connected: false, }, { id: "vercel", name: "Vercel", domain: "vercel.com", category: "Developer tools", description: "Follow deployments, previews and failed builds without switching tabs.", features: ["Deployment status", "Preview links in threads", "Build failure alerts"], path: "m12 1.608 12 20.784H0Z", color: "currentColor", tile: "#000000", connected: false, }, { id: "clickup", tile: "#ffffff", name: "ClickUp", domain: "clickup.com", category: "Project management", description: "Create tasks, assign owners and track due dates across your spaces.", features: ["Create and assign tasks", "Due date reminders", "Sync across spaces"], connected: false, }, ]` | The services to list, grouped into Connected and Available – the sample services by default |
| `appName` | `app-name` | `string` | `"Trenchcoat"` | Your product's name in the details, e.g. "Trenchcoat + Linear" |
| `appIcon` | – | `Element \| undefined` | `undefined` | Your product's mark on the black tile (cloned) – the Trenchcoat mark by default |
| `selected` | `selected` | `string \| undefined` | `undefined` | Id of the picked integration; unset picks the first |
| `connected` | – | `string[] \| undefined` | `undefined` | Ids of the connected integrations; unset follows the integrations' `connected` flags |
| `query` | `query` | `string` | `""` | The search text |
| `onToggle` | – | `IntegrationToggle \| undefined` | `undefined` | Runs when an integration is switched on or off; may return a promise (the real connect). The signal aborts when the picker is removed |
| `hotkey` | – | `string \| false` | `"mod+/"` | Window shortcut that jumps into the search: "mod+/" by default, any other combination, or false for none |
| `back` | `back` | `boolean` | `false` | Shows the back button (and ← in an empty search goes back) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | Another integration was picked; detail `{ selected: string }`. Cancelable. |
| `tc-connected-change` | – | Yes | An integration was switched on or off; detail `{ connected: string[] }`. Cancelable. |
| `tc-query-change` | – | Yes | The search text changed; detail `{ query: string }`. Cancelable. |
| `tc-explore` | – | No | "Explore integration" was pressed; detail `{ id: string }`. |
| `tc-back` | – | No | The back button, or ← in an empty search (only with `back`); detail `{}`. |
| `tc-close` | – | No | Esc in an empty search; detail `{}`. |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-integration-picker-app-bg` | `#000000` | both |
| `--tc-integration-picker-app-fg` | `#ffffff` | both |
| `--tc-integration-picker-ring-border` | `light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.07))` | both |
| `--tc-integration-picker-app-ring` | `light-dark(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.14))` | standard, clean |
| `--tc-integration-picker-tile-shadow` | `0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 8px 16px -8px light-dark(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.6))` | standard, clean |
| `--tc-integration-picker-spread` | `2800ms` | both |
| `--tc-integration-picker-n` | `0` | not set – this fallback applies |

#### Design tokens it reads (114)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-integration-picker-brand`, `--tc-integration-picker-logo-ring`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `integrationPickerDefaults: IntegrationPickerItem[]` | Sample services – company marks from Simple Icons (CC0) |

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
| `integrations` | `el.integrations = …;` | `<… integrations={…} />` | `<tc-integration-picker :integrations="…">` | `<tc-integration-picker [integrations]="…">` | `<tc-integration-picker {integrations}>` |
| `appIcon` | `el.appIcon = …;` | `<… appIcon={…} />` | `<tc-integration-picker :appIcon="…">` | `<tc-integration-picker [appIcon]="…">` | `<tc-integration-picker {appIcon}>` |
| `connected` | `el.connected = …;` | `<… connected={…} />` | `<tc-integration-picker :connected="…">` | `<tc-integration-picker [connected]="…">` | `<tc-integration-picker {connected}>` |
| `onToggle` | `el.onToggle = …;` | `<… onToggle={…} />` | `<tc-integration-picker :onToggle="…">` | `<tc-integration-picker [onToggle]="…">` | `<tc-integration-picker {onToggle}>` |
| `hotkey` | `el.hotkey = …;` | `<… hotkey={…} />` | `<tc-integration-picker :hotkey="…">` | `<tc-integration-picker [hotkey]="…">` | `<tc-integration-picker {hotkey}>` |

*Also attributes: `app-name`, `selected`, `query`, `back` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-connected-change` | Yes | `el.addEventListener("tc-connected-change", (e) => …)` | `onConnectedChange={…}` | `@tc-connected-change="…"` | `(tc-connected-change)="…($event)"` | `el.addEventListener("tc-connected-change", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-explore` | No | `el.addEventListener("tc-explore", (e) => …)` | `onExplore={…}` | `@tc-explore="…"` | `(tc-explore)="…($event)"` | `el.addEventListener("tc-explore", …)` |
| `tc-back` | No | `el.addEventListener("tc-back", (e) => …)` | `onBack={…}` | `@tc-back="…"` | `(tc-back)="…($event)"` | `el.addEventListener("tc-back", …)` |
| `tc-close` | No | `el.addEventListener("tc-close", (e) => …)` | `onClose={…}` | `@tc-close="…"` | `(tc-close)="…($event)"` | `el.addEventListener("tc-close", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected`, `connected` and `query` itself unless a listener calls `preventDefault()` on `tc-selected-change`, `tc-connected-change` or `tc-query-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-integration-picker id="integration-picker"></tc-integration-picker>

<script type="module">
  import "@adamstavely/trenchcoat/integration-picker";

  const el = document.querySelector("#integration-picker");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/integration-picker";
import type { TcIntegrationPicker } from "@adamstavely/trenchcoat/integration-picker";

const props = defineProps<{ initial: TcIntegrationPicker["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcIntegrationPicker["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-integration-picker :selected="selected" @tc-selected-change="onSelectedChange"></tc-integration-picker>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { IntegrationPicker } from "@adamstavely/trenchcoat/angular/integration-picker";
import type { TcIntegrationPicker } from "@adamstavely/trenchcoat/integration-picker";

@Component({
  selector: "app-controlled-integration-picker",
  imports: [IntegrationPicker],
  template: `<tc-integration-picker [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-integration-picker>`,
})
export class ControlledIntegrationPicker {
  readonly initial = input.required<TcIntegrationPicker["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcIntegrationPicker["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/integration-picker";
  import type { TcIntegrationPicker } from "@adamstavely/trenchcoat/integration-picker";

  let { initial }: { initial: TcIntegrationPicker["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcIntegrationPicker;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcIntegrationPicker["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-integration-picker bind:this={el} {selected}></tc-integration-picker>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-integration-picker")` returns a `TcIntegrationPicker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcIntegrationPicker } from "@adamstavely/trenchcoat/integration-picker";`
- **React / Next.js:** Props: `import type { IntegrationPickerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof IntegrationPicker>`. The element class, for refs: `import type { TcIntegrationPicker } from "@adamstavely/trenchcoat/integration-picker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcIntegrationPicker["integrations"]` with `import type { TcIntegrationPicker } from "@adamstavely/trenchcoat/integration-picker";`
- **Angular:** The directive types the template: `[integrations]` takes `TcIntegrationPicker["integrations"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcIntegrationPicker } from "@adamstavely/trenchcoat/integration-picker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcIntegrationPicker } from "@adamstavely/trenchcoat/integration-picker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `integrations` | `Integration[]` | The services to list – the sample services by default |
| `appName` | `string` | Your product's name in the details, e.g. "Trenchcoat + Linear" |
| `appIcon` | `React.ReactNode` | Your product's mark on the black tile – the Trenchcoat mark by default |
| `selected` | `string` | Id of the picked integration. Controlled when defined; otherwise starts at `defaultSelected` |
| `defaultSelected` | `string` | Id of the integration that is picked first |
| `onSelectedChange` | `(id: string) => void` | Called with the id of the integration picked by click or arrow key |
| `connected` | `string[]` | Ids of the connected integrations. Controlled when defined; otherwise starts at `defaultConnected`, or at the integrations marked `connected` (and follows those flags when they change) |
| `defaultConnected` | `string[]` | The connected ids on mount when `connected` isn't controlled |
| `onConnectedChange` | `(ids: string[]) => void` | Called with every connected id after an integration is switched on or off |
| `query` | `string` | The search text. Controlled when defined; otherwise starts at `defaultQuery` |
| `defaultQuery` | `string` | The search text on mount when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | Called with the search text as it's typed or cleared |
| `onToggle` | `(id: string, connected: boolean, options: { signal: AbortSignal }) => void \| Promise<unknown>` | Called with the id and the new state when an integration is switched on or off. May return a promise (the real connect): the switch shows that it's working and flips when it resolves; a rejection leaves it as it was and says so, to try again. The signal aborts when the picker unmounts |
| `hotkey` | `string \| false` | Window shortcut that jumps into the search: "mod+/" (⌘/ on Apple devices, Ctrl / elsewhere) by default, any other combination, or false for none |
| `onExplore` | `(id: string) => void` | Runs with the picked integration's id when "Explore integration" is pressed |
| `onBack` | `() => void` | Shows the back button and runs on ← in an empty search |
| `onClose` | `() => void` | Runs on Esc in an empty search |

*Renamed or hidden on the wrapper: `back`, `Trenchcoat + Linear`, `mod+/`, `Explore integration`*

## Accessibility

Follows the WAI-ARIA [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### Keyboard

Focus stays in the search field; the arrow keys move the highlight through the list.

| Key | What it does |
|---|---|
| ↓ / ↑ | Picks the next or previous service (wraps at the ends) |
| Enter | Connects or disconnects the picked service |
| Escape | Clears the search; with an empty search, fires `tc-close` |
| ← | In an empty search, goes back (fires `tc-back`, only with `back`) |
| ⌘/ or Ctrl+/ | From anywhere on the page, moves focus into the search (change it with `hotkey`, or `false` for none) |
| Tab | Moves on to the switch and “Explore integration” |

### Screen readers

The search field is a `combobox` named “Search integrations” that controls a `listbox` named “Integrations”;
`aria-activedescendant` points at the picked option, so focus never leaves the field. Options sit in groups named
“Connected” and “Available”, and the picked one is `aria-selected`. The details are a section named “Linear
details”, and the switch is a `switch` named “Connect Linear” with `aria-checked`. A polite status confirms each
change – “Linear connected” or “Linear disconnected”, after “Connecting Linear…” while an `onToggle` promise is
pending; a failure is an alert: “Couldn't connect Linear – try again”. With no matches, the list says “No integrations match “…””.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 51.4 KB | 14.6 KB |
| Lit · the library every element is built on, the parts it uses | 22.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **59.3 KB** | **17.0 KB** |
| With Lit – the first component on a page | 82.6 KB | 24.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 141 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of integrations replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.7 ms | integrations: first render, 771 nodes; update 0.6 ms |
| 1,000 items | 36 ms | integrations: first render, 7,071 nodes; update 4.0 ms |

1,000 items of integrations: 36 ms, 7,071 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `window keydown` (internal/controllers – HotkeyController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write each `description` as what the integration does for people, in one sentence: “Turn requests from chat into
  issues and keep their status in sync both ways.”
- Keep `features` to three short capabilities, without full stops.
- Use a familiar `category` – “Project management”, “Payments” – since search matches it too.
- Set `appName` to your product's name; the details read “Your app + Linear”.

## Do and don't

### Do

- Return a promise from `onToggle` that resolves when the service is really connected, so the switch tells the
  truth.
- Pass `back` (or `onBack` in React) when the picker is a page inside a command menu, so ← and the arrow lead out.
- Supply a mark for each service – an SVG `path` with `color` and `tile`, or an `icon`.

### Don't

- Don't use it for long settings forms – link “Explore integration” to `integration-settings` instead.
- Don't reorder the list while people switch services on and off – the groups are taken when the list is shown or
  searched, and that's deliberate.
- Don't leave `hotkey` on ⌘/ if your app already uses that shortcut.

## Related

- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
- [Integration Settings](integration-settings.md) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar
- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
