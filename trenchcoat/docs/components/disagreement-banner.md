<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Disagreement Banner

**Trust & calibration** · New

When today's answer contradicts an earlier one on the same question – both side by side, the difference marked

- **Element:** `<tc-disagreement-banner>`
- **Size:** 17.2 KB gzip · 69.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/disagreement-banner";` |
| React / Next.js | `import { DisagreementBanner } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/disagreement-banner";` · tags starting with tc- are custom elements |
| Angular | `import { DisagreementBanner } from "@adamstavely/trenchcoat/angular/disagreement-banner";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/disagreement-banner";` |

## Example

The live example is in the gallery at `#/disagreement-banner`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A banner for the moment today's answer contradicts an earlier answer to the same question. The two answers sit
side by side – the earlier on the left – with the difference marked word by word: words only the earlier answer had
are struck through, words only today's has are underlined, and pointing at one lights up its counterpart. Long
answers show only the changes with a few words of context, so the contradiction is the first thing people see; one
press shows both in full. People can dismiss it, or open the earlier session to see why it said what it said.

### When to use

- A person asks something they – or their team – asked before, and the answer has changed in substance.
- Answers people rely on over time (policies, figures, terms), where a silent change would go unnoticed.
- After a model, prompt or source update, to show users where answers moved.

### When not to use

- Comparing two runs or prompt versions while building – use [Run Compare](run-compare.md).
- Suggesting an edit to a text, to accept or reject – use [Inline Diff](inline-diff.md).
- Marking up one answer claim by claim with its sources – use [Claim Answer](claim-answer.md).
- Showing whether trust in the AI matches how it performs over time – use [Reliance Gauge](reliance-gauge.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.ui-dsb__bar` – the heading, the question and the number of differences
2. **Count** `.ui-dsb__count` – how many places the answers differ
3. **Answers** `.ui-dsb__pair` – the earlier answer and today's, side by side
4. **Changed words** `.ui-dsb__ins` – what only today's answer says, underlined; the earlier side's are struck through
5. **Foot** `.ui-dsb__foot` – your summary, “Show full answers” and “Open earlier session”

## Looks

Standard puts the heading on a gray tray and the two answers on a white card inside it. Clean is one white card with
hairline dividers; its struck words are gray and its added words keep the text colour, over the same tints. Both
stack the answers – earlier above today's – when the banner is narrow.

## Usage

### HTML

```html
<tc-disagreement-banner id="banner" question="Can we end the contract early?" dismissible can-open></tc-disagreement-banner>

<script type="module">
  import "@adamstavely/trenchcoat/disagreement-banner";
  import "@adamstavely/trenchcoat/tokens.css";

  const banner = document.querySelector("#banner");
  banner.earlier = { text: "Either side can end it with 30 days' notice.", when: "Oct 14", sessionId: "s-2291" };
  banner.current = { text: "Either side can end it with 60 days' notice.", when: "Today" };
  banner.addEventListener("tc-open-session", (e) => openSession(e.detail.sessionId));
</script>
```

### React / Next.js

```tsx
import { DisagreementBanner, type DisagreementAnswer } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AnswerChanged({ earlier, current, onOpen }: { earlier: DisagreementAnswer; current: DisagreementAnswer; onOpen: (id?: string) => void }) {
  return <DisagreementBanner question="Can we end the contract early?" earlier={earlier} current={current} onOpenEarlier={(id) => onOpen(id)} onDismiss={() => undefined} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/disagreement-banner";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDisagreementBanner } from "@adamstavely/trenchcoat/disagreement-banner";

defineProps<{ earlier: TcDisagreementBanner["earlier"]; current: TcDisagreementBanner["current"] }>();
const onExpandedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-disagreement-banner :earlier="earlier" :current="current" @tc-expanded-change="onExpandedChange"></tc-disagreement-banner>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DisagreementBanner } from "@adamstavely/trenchcoat/angular/disagreement-banner";
import type { TcDisagreementBanner } from "@adamstavely/trenchcoat/disagreement-banner";

@Component({
  selector: "app-disagreement-banner-example",
  imports: [DisagreementBanner],
  template: `<tc-disagreement-banner [earlier]="earlier()" [current]="current()" (tc-expanded-change)="onExpandedChange($event)"></tc-disagreement-banner>`,
})
export class DisagreementBannerExample {
  readonly earlier = input.required<TcDisagreementBanner["earlier"]>();
  readonly current = input.required<TcDisagreementBanner["current"]>();
  onExpandedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/disagreement-banner";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDisagreementBanner } from "@adamstavely/trenchcoat/disagreement-banner";

  let { earlier, current }: { earlier: TcDisagreementBanner["earlier"]; current: TcDisagreementBanner["current"] } = $props();
  let el: TcDisagreementBanner;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-disagreement-banner bind:this={el} {earlier} {current}></tc-disagreement-banner>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `earlier` | – | `DisagreementAnswer \| undefined` | `undefined` | The earlier answer – on the left |
| `current` | – | `DisagreementAnswer \| undefined` | `undefined` | Today's answer – on the right |
| `question` | `question` | `string` | `""` | The question both answers were given to, shown under the heading |
| `heading` | `heading` | `string` | `"This answer differs from an earlier one"` | The heading |
| `summary` | `summary` | `string` | `""` | A line from your product on what changed, e.g. "The notice period went from 30 to 60 days" |
| `expanded` | `expanded` | `boolean` | `false` | Shows both answers in full; unset, long answers show only the changes and the words around them |
| `context` | `context` | `number` | `8` | How many shared words to keep either side of a change while not expanded |
| `dismissible` | `dismissible` | `boolean` | `false` | Shows Dismiss (fires tc-dismiss) |
| `canOpen` | `can-open` | `boolean` | `false` | Shows "Open earlier session" (fires tc-open-session) |
| `dismissed` | `dismissed` | `boolean` | `false` | Dismissed: the banner shows nothing |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-expanded-change` | – | Yes | "Show full answers" or "Show changes only" was pressed; detail `{ expanded }`: DisagreementExpandedChange. Cancelable. |
| `tc-dismiss` | – | Yes | Dismiss was pressed (with `dismissible`); detail `null`. Cancelable: preventDefault() keeps the banner. |
| `tc-open-session` | – | No | "Open earlier session" was pressed (with `can-open`); detail `{ sessionId, answer }`: DisagreementOpenSession. |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-disagreement-banner-strike` | `light-dark(rgba(229, 72, 77, 0.6), rgba(255, 120, 120, 0.7))` | both, clean |
| `--tc-disagreement-banner-del-hot` | `light-dark(rgba(220, 60, 60, 0.2), rgba(240, 90, 90, 0.28))` | both |
| `--tc-disagreement-banner-ins-hot` | `light-dark(rgba(34, 160, 90, 0.22), rgba(60, 200, 120, 0.28))` | both |

#### Design tokens it reads (76)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `earlier` | `el.earlier = …;` | `<… earlier={…} />` | `<tc-disagreement-banner :earlier="…">` | `<tc-disagreement-banner [earlier]="…">` | `<tc-disagreement-banner {earlier}>` |
| `current` | `el.current = …;` | `<… current={…} />` | `<tc-disagreement-banner :current="…">` | `<tc-disagreement-banner [current]="…">` | `<tc-disagreement-banner {current}>` |

*Also attributes: `question`, `heading`, `summary`, `expanded`, `context`, `dismissible`, `can-open`, `dismissed` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `onExpandedChange={…}` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-dismiss` | Yes | `el.addEventListener("tc-dismiss", (e) => …)` | `onDismiss={…}` | `@tc-dismiss="…"` | `(tc-dismiss)="…($event)"` | `el.addEventListener("tc-dismiss", …)` |
| `tc-open-session` | No | `el.addEventListener("tc-open-session", (e) => …)` | `onOpenEarlier={…}` | `@tc-open-session="…"` | `(tc-open-session)="…($event)"` | `el.addEventListener("tc-open-session", …)` |

### Controlled

The element changes `expanded` itself unless a listener calls `preventDefault()` on `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-disagreement-banner id="disagreement-banner"></tc-disagreement-banner>

<script type="module">
  import "@adamstavely/trenchcoat/disagreement-banner";

  const el = document.querySelector("#disagreement-banner");
  el.addEventListener("tc-expanded-change", (e) => {
    e.preventDefault(); // the element keeps its expanded…
    if (allowed(e.detail.expanded)) el.expanded = e.detail.expanded; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { DisagreementBanner } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof DisagreementBanner>;
type Props = Omit<Own, "expanded" | "onExpandedChange"> & { initial: NonNullable<Own["expanded"]> };

// Controlled: passing expanded makes the wrapper prevent the element's own change; the app sets it
export function ControlledDisagreementBanner({ initial, ...props }: Props) {
  const [expanded, setExpanded] = useState<Own["expanded"]>(initial);
  return <DisagreementBanner {...props} expanded={expanded} onExpandedChange={(next) => setExpanded(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/disagreement-banner";
import type { TcDisagreementBanner } from "@adamstavely/trenchcoat/disagreement-banner";

const props = defineProps<{ initial: TcDisagreementBanner["expanded"] }>();
const expanded = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onExpandedChange = (e: CustomEvent<{ expanded: TcDisagreementBanner["expanded"] }>) => {
  e.preventDefault();
  expanded.value = e.detail.expanded;
};
</script>

<template>
  <tc-disagreement-banner :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-disagreement-banner>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DisagreementBanner } from "@adamstavely/trenchcoat/angular/disagreement-banner";
import type { TcDisagreementBanner } from "@adamstavely/trenchcoat/disagreement-banner";

@Component({
  selector: "app-controlled-disagreement-banner",
  imports: [DisagreementBanner],
  template: `<tc-disagreement-banner [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-disagreement-banner>`,
})
export class ControlledDisagreementBanner {
  readonly initial = input.required<TcDisagreementBanner["expanded"]>();
  readonly expanded = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onExpandedChange(e: CustomEvent<{ expanded: TcDisagreementBanner["expanded"] }>) {
    e.preventDefault();
    this.expanded.set(e.detail.expanded);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/disagreement-banner";
  import type { TcDisagreementBanner } from "@adamstavely/trenchcoat/disagreement-banner";

  let { initial }: { initial: TcDisagreementBanner["expanded"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let expanded = $derived(initial);
  let el: TcDisagreementBanner;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      expanded = (e as CustomEvent<{ expanded: TcDisagreementBanner["expanded"] }>).detail.expanded;
    };
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-disagreement-banner bind:this={el} {expanded}></tc-disagreement-banner>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-disagreement-banner")` returns a `TcDisagreementBanner` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDisagreementBanner } from "@adamstavely/trenchcoat/disagreement-banner";`
- **React / Next.js:** Props: `import type { DisagreementBannerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DisagreementBanner>`. The element class, for refs: `import type { TcDisagreementBanner } from "@adamstavely/trenchcoat/disagreement-banner";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDisagreementBanner["earlier"]` with `import type { TcDisagreementBanner } from "@adamstavely/trenchcoat/disagreement-banner";`
- **Angular:** The directive types the template: `[earlier]` takes `TcDisagreementBanner["earlier"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDisagreementBanner } from "@adamstavely/trenchcoat/disagreement-banner";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDisagreementBanner } from "@adamstavely/trenchcoat/disagreement-banner";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `expanded` | `boolean` | Shows both answers in full (controlled). Leave it undefined to let the banner keep it, starting at `defaultExpanded` |
| `defaultExpanded` | `boolean` | Whether both answers show in full at first when uncontrolled |
| `onExpandedChange` | `(expanded: boolean) => void` | Called when "Show full answers" or "Show changes only" is pressed, controlled or not |
| `onDismiss` | `() => boolean \| void` | Shows Dismiss and is called when it's pressed; return false to keep the banner |
| `onOpenEarlier` | `(sessionId: string \| undefined, answer: DisagreementAnswer) => void` | Shows "Open earlier session" and is called with the earlier answer's session id when it's pressed |

*Renamed or hidden on the wrapper: `heading`, `expanded`, `dismissible`, `canOpen`, `dismissed`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves to Dismiss, “Show full answers” and “Open earlier session” |
| Enter / Space | Presses the focused button |

### Screen readers

The banner is a `group` named by its heading; the question follows it, read as “Question: …”. Words only one answer
has are `<del>` (earlier) and `<ins>` (today's) elements, and left-out shared text reads “(shared words left out)”.
“Show full answers” is a disclosure: `aria-expanded`, and `aria-controls` points at the answers. Dismiss is a button
named “Dismiss”; once pressed, a `status` region says “Dismissed” and focus stays on the banner rather than dropping
to the page.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, inline-diff, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | inline-diff | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, inline-diff | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | inline-diff | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.2 KB | 6.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| **Added to a page that already has Lit** | **69.5 KB** | **17.2 KB** |
| With Lit – the first component on a page | 88.9 KB | 23.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.0 ms** | the gallery demo's data, 59 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout` (inline-diff).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (inline-diff).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep the default heading, or say what changed in plain words: “This answer differs from an earlier one”.
- Show the question as the person asked it, so they recognise it.
- Give both sides a `when` people can place – “Oct 14”, “Today, 10:42” – and a `label` when “Earlier” isn't enough
  (“Before the policy update”).
- Use `summary` for one line on what changed, in your product's words; leave it out rather than repeat the diff.

## Do and don't

### Do

- Show it only when the answers differ in substance – a reworded answer isn't a disagreement.
- Pass `sessionId` and turn on `can-open` (or pass `onOpenEarlier`) so people can see the earlier context.
- Put it above today's answer, where it's read before the answer is relied on.

### Don't

- Don't decide for the person which answer is right – show both and let them check.
- Don't keep showing a banner someone dismissed for the same pair of answers.
- Don't rely on colour alone in your own summary; the banner already marks changes with strikes and underlines.

## Related

- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it
- [Reliance Gauge](reliance-gauge.md) – Whether trust in the AI matches how it performs – a reliance index with its trend, signals against review thresholds, and overtrust and undertrust caught

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
