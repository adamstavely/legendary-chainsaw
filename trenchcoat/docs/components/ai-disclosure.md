<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# AI Disclosure

**Trust & calibration** · New

Marks AI-made content – an inline "AI-generated" / "AI-assisted" / "Edited by you" badge that opens what made it, its limits and whether a person reviewed it, with Report a problem – or a quiet notice at the top of an assistant panel saying it can be wrong and how to reach a person

- **Element:** `<tc-ai-disclosure>`
- **Size:** 11.2 KB gzip · 35.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/ai-disclosure";` |
| React / Next.js | `import { AiDisclosure } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/ai-disclosure";` · tags starting with tc- are custom elements |
| Angular | `import { AiDisclosure } from "@adamstavely/trenchcoat/angular/ai-disclosure";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/ai-disclosure";` |

## Example

The live example is in the gallery at `#/ai-disclosure`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Marks content an AI made and says what that means. It comes in two forms.

- **Mark** (`variant="mark"`) is a small inline badge beside a summary, a draft or a generated field. It shows a
  sparkle and "AI-generated", or "AI-assisted" or "Edited by you" with `kind`. Pressing it opens a card that says
  what made it and when, what it's good and weak at, whether a person reviewed it, and offers Report a problem.
- **Notice** (`variant="notice"`) is a quiet paragraph for the top of an assistant panel or a generated page. It says
  what the assistant is, that it can be wrong, where to check, and how to reach a person.

### When to use

- Beside any summary, draft, field or reply that an AI wrote or helped write, where people make decisions from it.
- At the top of an assistant panel, the first time people use it or wherever it acts on their behalf.
- When people need to know whether a person has reviewed what they're reading.

### When not to use

- Content a policy blocked or rewrote – use [Guardrail Notice](guardrail-notice.md).
- Weak reasoning inside an answer – use [Reasoning Flags](reasoning-flags.md).
- How much of a document came from sources, AI and its author – use [Provenance Summary](provenance-summary.md).
- The answer itself, with its sources – use [AI Answer](ai-answer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Mark** `.ui-aid__mark` – the badge: a sparkle and its words
2. **Card** `.ui-aid__card` – what the mark opens
3. **Meaning** `.ui-aid__means` – what the kind means, in a sentence
4. **Made by** `.ui-aid__made` – the model and when
5. **Review** `.ui-aid__review` – who reviewed it, or that no one has yet
6. **Limits** `.ui-aid__limits` – what it's good and weak at
7. **Report** `.ui-aid__report` – Report a problem, as a link or a button
8. **Notice** `.ui-aid__notice` – the paragraph form, with its title (`.ui-aid__notice-title`) and body (`.ui-aid__notice-body`)
9. **Links** `.ui-aid__links` – Talk to a person, How the assistant works and Report a problem
10. **Close** `.ui-aid__close` – dismisses the notice

## Looks

In Standard the mark is a tinted pill and the notice a tinted band. In Clean the mark is an outlined pill and the
notice a white card with a thin accent rule. The card the mark opens is the shared popover surface in both looks.
Two component tokens can be overridden:
- `--tc-aid-mark-h` sets the mark's height;
- `--tc-aid-card-w` sets the card's width.

## Usage

### HTML

```html
<p>Case summary <tc-ai-disclosure id="mark" model="Review assistant" reportable></tc-ai-disclosure></p>
<tc-ai-disclosure variant="notice" contact-href="/help/contact" dismissible></tc-ai-disclosure>

<script type="module">
  import "@adamstavely/trenchcoat/ai-disclosure";
  import "@adamstavely/trenchcoat/tokens.css";

  const mark = document.querySelector("#mark");
  mark.madeAt = Date.parse("2026-11-12T09:15");
  mark.limits = ["Can miss handwritten notes on scans.", "Doesn't know about calls that weren't logged."];
  mark.addEventListener("tc-report", (e) => console.log("report", e.detail.kind, e.detail.model));
</script>
```

### React / Next.js

```tsx
import { AiDisclosure } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function CaseSummaryHeading({ madeAt }: { madeAt: number }) {
  return (
    <h3>
      Case summary{" "}
      <AiDisclosure
        model="Review assistant"
        madeAt={madeAt}
        limits={["Can miss handwritten notes on scans."]}
        reportable
        onReport={(detail) => console.log("report", detail.model)}
      />
    </h3>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/ai-disclosure";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAiDisclosure } from "@adamstavely/trenchcoat/ai-disclosure";

defineProps<{ limits: TcAiDisclosure["limits"]; labels: TcAiDisclosure["labels"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-ai-disclosure :limits="limits" :labels="labels" @tc-open-change="onOpenChange"></tc-ai-disclosure>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AiDisclosure } from "@adamstavely/trenchcoat/angular/ai-disclosure";
import type { TcAiDisclosure } from "@adamstavely/trenchcoat/ai-disclosure";

@Component({
  selector: "app-ai-disclosure-example",
  imports: [AiDisclosure],
  template: `<tc-ai-disclosure [limits]="limits()" [labels]="labels()" (tc-open-change)="onOpenChange($event)"></tc-ai-disclosure>`,
})
export class AiDisclosureExample {
  readonly limits = input.required<TcAiDisclosure["limits"]>();
  readonly labels = input.required<TcAiDisclosure["labels"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-disclosure";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAiDisclosure } from "@adamstavely/trenchcoat/ai-disclosure";

  let { limits, labels }: { limits: TcAiDisclosure["limits"]; labels: TcAiDisclosure["labels"] } = $props();
  let el: TcAiDisclosure;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-ai-disclosure bind:this={el} {limits} {labels}></tc-ai-disclosure>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `variant` | `variant` | `AiDisclosureVariant` | `"mark"` | "mark" – an inline badge with a card, or "notice" – a paragraph for the top of an assistant panel |
| `kind` | `kind` | `AiDisclosureKind` | `"generated"` | How much the AI did: generated it, assisted a person, or drafted what a person then edited |
| `label` | `label` | `string \| undefined` | `undefined` | The badge's words; by default "AI-generated", "AI-assisted" or "Edited by you" |
| `model` | `model` | `string` | `""` | What made it, by the name people know it by – "Review assistant" |
| `madeAt` | `made-at` | `number \| undefined` | `undefined` | When it was made, epoch ms |
| `limits` | – | `string[]` | `[]` | What it's good and weak at, a short sentence each |
| `reviewedBy` | `reviewed-by` | `string` | `""` | Who reviewed it, if a person did |
| `reportable` | `reportable` | `boolean` | `false` | Offers Report a problem (a button that fires tc-report); on by default when `reportHref` is set |
| `reportHref` | `report-href` | `string` | `""` | Where Report a problem goes; makes it a link |
| `reported` | `reported` | `boolean` | `false` | A problem has been reported: the button says so and is off |
| `heading` | `heading` | `string \| undefined` | `undefined` | The notice's heading |
| `body` | `body` | `string \| undefined` | `undefined` | The notice's paragraph – what the assistant is, that it can be wrong, where to check |
| `contactHref` | `contact-href` | `string` | `""` | Where to reach a person – a link under the notice |
| `contactLabel` | `contact-label` | `string \| undefined` | `undefined` | The contact link's words |
| `learnHref` | `learn-href` | `string` | `""` | Where to read how the assistant works – a link under the notice |
| `dismissible` | `dismissible` | `boolean` | `false` | Shows a close button on the notice |
| `dismissed` | `dismissed` | `boolean` | `false` | The notice was dismissed and is hidden |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `labels` | – | `Partial<AiDisclosureLabels>` | `{}` | The words it uses, merged over defaultAiDisclosureLabels |
| `open` | – | `` | – | Whether the mark's card is open |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | No | The mark's card opened or closed ({ open }: AiDisclosureOpenChange) |
| `tc-report` | – | Yes | Report a problem was pressed, when there's no `reportHref` ({ kind, model }: AiDisclosureReport); cancelable – unless prevented, it then says "Reported" |
| `tc-dismiss` | – | Yes | The notice's close button was pressed (detail: null); cancelable – unless prevented, the notice hides itself (`dismissed`) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `show()` | `void` | Opens the mark's card |
| `hide()` | `void` | Closes the mark's card |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-aid-mark-h` | `20px` | both |
| `--tc-aid-card-w` | `280px` | both |

#### Design tokens it reads (46)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-xl`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-info-bg`, `--tc-status-info-border`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`

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
| `limits` | `el.limits = …;` | `<… limits={…} />` | `<tc-ai-disclosure :limits="…">` | `<tc-ai-disclosure [limits]="…">` | `<tc-ai-disclosure {limits}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-ai-disclosure :labels="…">` | `<tc-ai-disclosure [labels]="…">` | `<tc-ai-disclosure {labels}>` |

*Also attributes: `variant`, `kind`, `label`, `model`, `made-at`, `reviewed-by`, `reportable`, `report-href` and 9 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | No | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-report` | Yes | `el.addEventListener("tc-report", (e) => …)` | `onReport={…}` | `@tc-report="…"` | `(tc-report)="…($event)"` | `el.addEventListener("tc-report", …)` |
| `tc-dismiss` | Yes | `el.addEventListener("tc-dismiss", (e) => …)` | `onDismiss={…}` | `@tc-dismiss="…"` | `(tc-dismiss)="…($event)"` | `el.addEventListener("tc-dismiss", …)` |

### Controlled

`tc-report`, `tc-dismiss` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-ai-disclosure")` returns a `TcAiDisclosure` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAiDisclosure } from "@adamstavely/trenchcoat/ai-disclosure";`
- **React / Next.js:** Props: `import type { AiDisclosureProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AiDisclosure>`. The element class, for refs: `import type { TcAiDisclosure } from "@adamstavely/trenchcoat/ai-disclosure";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAiDisclosure["limits"]` with `import type { TcAiDisclosure } from "@adamstavely/trenchcoat/ai-disclosure";`
- **Angular:** The directive types the template: `[limits]` takes `TcAiDisclosure["limits"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAiDisclosure } from "@adamstavely/trenchcoat/ai-disclosure";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAiDisclosure } from "@adamstavely/trenchcoat/ai-disclosure";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The notice's heading |
| `dismissible` | `boolean` | Shows the notice's close button; on when `onDismiss` is given |
| `onOpenChange` | `(open: boolean) => void` | The mark's card opened or closed |
| `onReport` | `(detail: AiDisclosureReport) => boolean \| void` | Report a problem was pressed (no `reportHref`); return false to keep the button as it is |
| `onDismiss` | `() => boolean \| void` | The notice's close button was pressed; return false to keep it showing |

*Renamed or hidden on the wrapper: `heading`, `dismissible`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Reaches the mark; Tab from it moves into its open card |
| Enter / Space | Opens or closes the card; presses Report a problem or Dismiss |
| Escape | Closes the card and puts focus back on the mark |

### Screen readers

The mark is a button named by its visible words ("AI-generated"). It reports whether its card is expanded. The card
is a non-modal dialog named by the same words, and it reads its lines in order. The notice is a `note` named by its
title. Reporting a problem is confirmed in a polite status message. The sparkle is decorative.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-23 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 18.8 KB | 6.1 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/popover` · Shared Trenchcoat code | 9.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **35.0 KB** | **11.3 KB** |
| With Lit – the first component on a page | 54.6 KB | 17.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 15 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 15 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep the limits to two or three short sentences, each one a thing people would otherwise get wrong.
- Name the model the way people know it ("Review assistant"), not by its version string.
- In the notice, say what the assistant does for people, that it can be wrong, and where to check.
- Use `kind="edited"` once a person has changed an AI draft, so the mark stays honest.

## Do and don't

### Do

- Put the mark next to the content it describes, not in a footer.
- Set `reviewedBy` only when a person really checked it.
- Give the notice a way to reach a person.

### Don't

- Don't mark content an AI didn't touch, or the mark stops meaning anything.
- Don't hide the mark once content is edited; switch `kind` instead.
- Don't use the notice as a legal disclaimer wall; keep it to a short paragraph.

## Related

- [Guardrail Notice](guardrail-notice.md) – When a policy blocks, redacts or rewrites content – which policy, why, what changed with personal data masked, and a way to ask for review
- [Reasoning Flags](reasoning-flags.md) – Inline markers for weak reasoning in an answer – circular, hedged then certain, self-contradicting or overconfident – each with an explanation
- [Provenance Summary](provenance-summary.md) – What a document is made of – how much came from sources, from AI and from its authors, section by section
- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups
