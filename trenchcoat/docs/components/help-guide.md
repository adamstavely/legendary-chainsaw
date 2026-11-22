<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Help Guide

**Feedback & onboarding** · New

Point-in-time help from the help center – a small guide icon to put beside a heading, a field label or a toolbar, linking to one written tutorial, with a tooltip naming the guide and its reading time, a check once read and a dot when it's been updated

- **Element:** `<tc-help-guide>`
- **Size:** 6.1 KB gzip · 17.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/help-guide";` |
| React / Next.js | `import { HelpGuide } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/help-guide";` · tags starting with tc- are custom elements |
| Angular | `import { HelpGuide } from "@adamstavely/trenchcoat/angular/help-guide";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/help-guide";` |

## Example

The live example is in the gallery at `#/help-guide`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Point-in-time help that lives in the help center: a small guide icon that sits beside a heading, a field label or a toolbar, and links to one written tutorial. It's Help Video's sibling – where a feature is explained in a guide rather than a video, put this beside it instead. Each carries its own guide.

The icon is a page with its corner folded and lines of text cut through it, drawn in the text colour and sized to the text around it. Pointing at it shows a tooltip with the guide's title and how long it takes to read. It's a real link (`href`) and opens the guide in a new tab, or in the same one with `same-tab`. Once the guide has been opened, a small check sits on the icon's bottom corner. When the guide changes, set `updated-on` to the date: a small dot sits on the top-right corner for `new-days` days (14 by default), and the tooltip and name say Updated. Opening the guide clears the dot for that person (`tc-update-seen-change`); pass `update-seen` back to keep it cleared.

Opening fires `tc-guide-open` first, with the guide's `href` and title. It's cancelable: an app that shows guides in its own side panel prevents it and opens the guide there, and the link doesn't navigate. A click with a modifier key – to open a new window or tab – is left to the browser.

### When to use

- A feature, field or screen that has a written guide in the help center.
- Help that belongs where the question comes up, rather than behind a help menu.
- Short, task-shaped guides – one icon, one guide.

### When not to use

- The help is a video – use [Help Video](help-video.md).
- A sentence or two of explanation – use [Tooltip](tooltip.md).
- A list of tips or a getting-started checklist – use [Tips Panel](tips-panel.md) or [Setup Guide](setup-guide.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Link** `.ui-hgd__trigger` – the link, holding `.ui-hgd__mark` with the guide page `.ui-hgd__icon`, `.ui-hgd__seen` once read, and `.ui-hgd__new` – the Updated dot – after a recent change
2. **Label** `.ui-hgd__label` – words beside the icon, when `label` is set
3. **Tooltip** `.ui-hgd__tip` – the title, reading time and Updated, on hover and keyboard focus, when there's no label

## Looks

The icon is the same in Standard and Clean: the text colour, a shade quieter (`--tc-hgd-ink`), turning to the full text colour on hover (`--tc-hgd-ink-hover`). With `label` it becomes a small pill. `size` sets it against the text around it – `sm` 1em for labels and toolbars, `md` 1.25em for section headings, `lg` 1.5em for page titles – and `--tc-hgd-size` takes any length. `--tc-hgd-dot` sets the Updated dot's colour (the accent by default).

## Usage

### HTML

```html
<h2>
  Risk rules
  <tc-help-guide
    id="rules-help"
    heading="Write a risk rule"
    href="https://help.example.com/guides/risk-rules"
    minutes="5"
    updated-on="2026-11-17"
  ></tc-help-guide>
</h2>

<script type="module">
  import "@adamstavely/trenchcoat/help-guide";
  import "@adamstavely/trenchcoat/tokens.css";

  const help = document.querySelector("#rules-help");
  help.read = localStorage.getItem("guide:rules") === "read";
  help.addEventListener("tc-read-change", () => localStorage.setItem("guide:rules", "read"));
  // The dot clears once this person opens the update; key it by the date so the next update shows again
  help.updateSeen = localStorage.getItem("guide:rules:update") === help.updatedOn;
  help.addEventListener("tc-update-seen-change", () => localStorage.setItem("guide:rules:update", help.updatedOn));
</script>
```

### React / Next.js

```tsx
import { HelpGuide } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RulesHeading({ read, onRead, openInPanel }: { read: boolean; onRead: () => void; openInPanel: (href: string) => void }) {
  return (
    <h2>
      Risk rules{" "}
      <HelpGuide
        title="Write a risk rule"
        href="https://help.example.com/guides/risk-rules"
        minutes={5}
        read={read}
        onReadChange={onRead}
        onGuideOpen={(detail, event) => {
          event.preventDefault();
          openInPanel(detail.href);
        }}
      />
    </h2>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/help-guide";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcHelpGuide } from "@adamstavely/trenchcoat/help-guide";

defineProps<{ labels: TcHelpGuide["labels"] }>();
const onGuideOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-help-guide :labels="labels" @tc-guide-open="onGuideOpen"></tc-help-guide>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { HelpGuide } from "@adamstavely/trenchcoat/angular/help-guide";
import type { TcHelpGuide } from "@adamstavely/trenchcoat/help-guide";

@Component({
  selector: "app-help-guide-example",
  imports: [HelpGuide],
  template: `<tc-help-guide [labels]="labels()" (tc-guide-open)="onGuideOpen($event)"></tc-help-guide>`,
})
export class HelpGuideExample {
  readonly labels = input.required<TcHelpGuide["labels"]>();
  onGuideOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/help-guide";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcHelpGuide } from "@adamstavely/trenchcoat/help-guide";

  let { labels }: { labels: TcHelpGuide["labels"] } = $props();
  let el: TcHelpGuide;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-guide-open", on);
    return () => el.removeEventListener("tc-guide-open", on);
  });
</script>

<tc-help-guide bind:this={el} {labels}></tc-help-guide>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The guide's title – the tooltip and the link's accessible name |
| `href` | `href` | `string` | `""` | Where the guide is: a page in the help center |
| `minutes` | `minutes` | `number \| undefined` | `undefined` | How long it takes to read, in minutes – "5 min read" in the tooltip |
| `sameTab` | `same-tab` | `boolean` | `false` | Opens the guide in this tab rather than a new one |
| `label` | `label` | `string` | `""` | Words beside the icon, e.g. "Read the guide"; unset, the icon stands alone with a tooltip |
| `size` | `size` | `HelpGuideSize` | `"md"` | The icon's size against the text around it: "sm" (1em), "md" (1.25em, the default) or "lg" (1.5em) |
| `read` | `read` | `boolean` | `false` | Whether it has been read – a check on the icon. Set when it's opened, unless a tc-read-change listener calls preventDefault() |
| `updatedOn` | `updated-on` | `string \| undefined` | `undefined` | When the guide last changed, as a date ("2026-11-17"); for `new-days` days after it, a dot on the icon says so |
| `newDays` | `new-days` | `number` | `14` | How many days after `updated-on` the dot shows (default 14) |
| `updateSeen` | `update-seen` | `boolean` | `false` | Whether this person has seen the update – the dot is cleared. Set when the guide is opened, unless a tc-update-seen-change listener calls preventDefault() |
| `now` | `now` | `number \| undefined` | `undefined` | The time to measure `new-days` from, in milliseconds; unset, the clock's |
| `labels` | – | `Partial<HelpGuideLabels>` | `{}` | Rename any of the words |
| `showsUpdate` | – | `boolean` | – | Whether the Updated dot shows: a change in the last `new-days` days this person hasn't opened yet |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-guide-open` | – | Yes | The guide was opened ({ href, heading }: HelpGuideOpen); cancelable – prevented, the link doesn't navigate, so the page can show the guide its own way |
| `tc-read-change` | – | Yes | The guide was opened for the first time ({ read }: HelpGuideReadChange); cancelable – prevented, `read` stays as it was |
| `tc-update-seen-change` | – | Yes | The guide was opened while the Updated dot showed ({ updateSeen }: HelpGuideUpdateSeenChange); cancelable – prevented, the dot stays |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-hgd-size` | `1.25em` | both |
| `--tc-hgd-ink` | `var(--tc-text-secondary)` | both |
| `--tc-hgd-ink-hover` | `var(--tc-text-primary)` | both |
| `--tc-hgd-dot` | `var(--tc-accent)` | both |

#### Design tokens it reads (33)

`--tc-accent`, `--tc-border-default`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-line-height-none`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-16`, `--tc-space-6`, `--tc-status-success-fg`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-z-popover`

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
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-help-guide :labels="…">` | `<tc-help-guide [labels]="…">` | `<tc-help-guide {labels}>` |

*Also attributes: `heading`, `href`, `minutes`, `same-tab`, `label`, `size`, `read`, `updated-on` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-guide-open` | Yes | `el.addEventListener("tc-guide-open", (e) => …)` | `onGuideOpen={…}` | `@tc-guide-open="…"` | `(tc-guide-open)="…($event)"` | `el.addEventListener("tc-guide-open", …)` |
| `tc-read-change` | Yes | `el.addEventListener("tc-read-change", (e) => …)` | `ref.current.addEventListener("tc-read-change", …)` | `@tc-read-change="…"` | `(tc-read-change)="…($event)"` | `el.addEventListener("tc-read-change", …)` |
| `tc-update-seen-change` | Yes | `el.addEventListener("tc-update-seen-change", (e) => …)` | `ref.current.addEventListener("tc-update-seen-change", …)` | `@tc-update-seen-change="…"` | `(tc-update-seen-change)="…($event)"` | `el.addEventListener("tc-update-seen-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `read` and `updateSeen` itself unless a listener calls `preventDefault()` on `tc-read-change` or `tc-update-seen-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-help-guide id="help-guide"></tc-help-guide>

<script type="module">
  import "@adamstavely/trenchcoat/help-guide";

  const el = document.querySelector("#help-guide");
  el.addEventListener("tc-read-change", (e) => {
    e.preventDefault(); // the element keeps its read…
    if (allowed(e.detail.read)) el.read = e.detail.read; // …until the app sets it
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
import "@adamstavely/trenchcoat/help-guide";
import type { TcHelpGuide } from "@adamstavely/trenchcoat/help-guide";

const props = defineProps<{ initial: TcHelpGuide["read"] }>();
const read = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onReadChange = (e: CustomEvent<{ read: TcHelpGuide["read"] }>) => {
  e.preventDefault();
  read.value = e.detail.read;
};
</script>

<template>
  <tc-help-guide :read="read" @tc-read-change="onReadChange"></tc-help-guide>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { HelpGuide } from "@adamstavely/trenchcoat/angular/help-guide";
import type { TcHelpGuide } from "@adamstavely/trenchcoat/help-guide";

@Component({
  selector: "app-controlled-help-guide",
  imports: [HelpGuide],
  template: `<tc-help-guide [read]="read()" (tc-read-change)="onReadChange($event)"></tc-help-guide>`,
})
export class ControlledHelpGuide {
  readonly initial = input.required<TcHelpGuide["read"]>();
  readonly read = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onReadChange(e: CustomEvent<{ read: TcHelpGuide["read"] }>) {
    e.preventDefault();
    this.read.set(e.detail.read);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/help-guide";
  import type { TcHelpGuide } from "@adamstavely/trenchcoat/help-guide";

  let { initial }: { initial: TcHelpGuide["read"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let read = $derived(initial);
  let el: TcHelpGuide;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      read = (e as CustomEvent<{ read: TcHelpGuide["read"] }>).detail.read;
    };
    el.addEventListener("tc-read-change", on);
    return () => el.removeEventListener("tc-read-change", on);
  });
</script>

<tc-help-guide bind:this={el} {read}></tc-help-guide>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-help-guide")` returns a `TcHelpGuide` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcHelpGuide } from "@adamstavely/trenchcoat/help-guide";`
- **React / Next.js:** Props: `import type { HelpGuideProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof HelpGuide>`. The element class, for refs: `import type { TcHelpGuide } from "@adamstavely/trenchcoat/help-guide";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcHelpGuide["labels"]` with `import type { TcHelpGuide } from "@adamstavely/trenchcoat/help-guide";`
- **Angular:** The directive types the template: `[labels]` takes `TcHelpGuide["labels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcHelpGuide } from "@adamstavely/trenchcoat/help-guide";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcHelpGuide } from "@adamstavely/trenchcoat/help-guide";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The guide's title – the tooltip and the link's accessible name |
| `onGuideOpen` | `(detail: HelpGuideOpen, event: CustomEvent<HelpGuideOpen>) => void` | The guide was opened; call event.preventDefault() to show it your own way instead of following the link |
| `read` | `boolean` | Whether it has been read – controlled when given |
| `defaultRead` | `boolean` | Read on mount when `read` isn't controlled |
| `onReadChange` | `(read: boolean) => void` | The guide was opened for the first time |
| `updateSeen` | `boolean` | Whether this person has seen the update, clearing the Updated dot – controlled when given |
| `defaultUpdateSeen` | `boolean` | Update seen on mount when `updateSeen` isn't controlled |
| `onUpdateSeenChange` | `(updateSeen: boolean) => void` | The guide was opened while the Updated dot showed |

*Renamed or hidden on the wrapper: `heading`, `read`, `updateSeen`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Move to the icon; its tooltip shows |
| Enter | Open the guide |

### Screen readers

The icon is a link named "Read guide:" with the title, its reading time, whether it's been read, Updated while the dot shows, and "opens in a new tab" unless `same-tab`. With a `label`, the name starts with the label's words. The drawing, the dot and the tooltip are hidden from assistive technology, because the link's name already says what they show.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 10.7 KB | 4.2 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **17.5 KB** | **6.1 KB** |
| With Lit – the first component on a page | 37.0 KB | 12.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 14 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 15 ms | default properties; includes adding its CSS to the document |

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

- Title the guide by the task it teaches: "Write a risk rule", not "Help" or "Learn more".
- Give `minutes` as a whole number – "5 min read".
- Link to the guide itself, not the help center's home page.
- Use `label` sparingly – "Read the guide" beside an action people hesitate over.

## Do and don't

### Do

- Put the icon right after the words it explains, on the same line.
- Store `read` per person and pass it back, so the checks survive a reload.
- Set `updated-on` only for a change worth re-reading, and store `update-seen` per person and per update, so the dot comes back for the next one.

### Don't

- Don't put one beside every heading – save them for the places people actually get stuck.
- Don't put it inside a `<label>`: its words would become part of the field's name. Put it beside the label instead.

## Related

- [Help Video](help-video.md) – Point-in-time help – a small film-frame icon to put beside a heading, a field label or a toolbar, with a tooltip naming the video and its length and a check once watched; a click opens one short tutorial in a modal player with captions, chapters and Watch again
- [Tooltip](tooltip.md) – Keyboard, pointer and touch help text
- [Tips Panel](tips-panel.md) – Grid of short tips with one action each – taken tips turn into a done state
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
