<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Publication Impact

**Research & portfolio** · New

One paper's impact on one card – venue, topic, grade and authors, downloads, views, citations and attention with a reads sparkline, mentions, who is reading, and peer, reader and sponsor feedback with a sentiment each

- **Element:** `<tc-publication-impact>`
- **Size:** 11.9 KB gzip · 43.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/publication-impact";` |
| React / Next.js | `import { PublicationImpact } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/publication-impact";` · tags starting with tc- are custom elements |
| Angular | `import { PublicationImpact } from "@adamstavely/trenchcoat/angular/publication-impact";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/publication-impact";` |

## Example

The live example is in the gallery at `#/publication-impact`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One paper's impact on one card. The header has the venue and date, the topic it belongs to, the title, an assessment
grade and the authors, with what the paper achieved as a tag (“resolves gap”). Below come the reach figures –
downloads, views, citations and an attention score – beside a sparkline of cumulative reads; then mentions in the
news, in policy, on social media and in patents; then who is reading, with `audience-mix`; then feedback. Feedback is
quotes from peer reviewers, readers and sponsors, each with who, where, when and a sentiment in words, filtered All /
Peer / Reader / Sponsor and summed up as “2 positive · 1 mixed”.

### When to use

- A paper's page in a research portfolio, a lab's site or a funder's report.
- Reviewing outputs, where reach and what people said matter together.

### When not to use

- Just the citation counts – use [Citation Badge](citation-badge.md), or [Citation Sections](citation-sections.md) for where it's cited.
- Just who is reading – use [Audience Mix](audience-mix.md).
- One number and its trend – use [KPI Chart](kpi-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.ui-pubi__head` – venue, date, topic, title, grade, authors and outcome
2. **Grade** `.ui-pubi__grade` – the assessment, its caption and the grade in words
3. **Reach** `.ui-pubi__reach` – downloads, views, citations, attention score and the reads sparkline
4. **Mentions** `.ui-pubi__mentions` – news, policy, social and patent counts
5. **Filter** `.ui-pubi__filter` – All / Peer / Reader / Sponsor
6. **Quote** `.ui-pubi__quote` – kind, who and where, sentiment, the quote and its date

## Looks

Standard is a white card on a gray tray. Clean is one white card. Sections are divided by hairlines in both. The
sparkline uses `--tc-pubi-ink` (by default `--tc-chart-1`).

## Usage

### HTML

```html
<tc-publication-impact id="paper" heading="Self-Calibrating Coastal Sensors" venue="Journal of Applied Sensing"></tc-publication-impact>

<script type="module">
  import "@adamstavely/trenchcoat/publication-impact";
  import "@adamstavely/trenchcoat/tokens.css";

  const paper = document.querySelector("#paper");
  paper.grade = { label: "Outstanding", tone: "success" };
  paper.metrics = { downloads: 18000, views: 46000, citations: 73, attention: 284 };
  paper.reads = [400, 2600, 5800, 9100, 12400, 18000];
  paper.feedback = [{ id: "f1", kind: "reader", who: "Dr. Ines Marlow", quote: "We reproduced it.", sentiment: "positive" }];
  paper.addEventListener("tc-filter-change", (e) => console.log(e.detail.filter));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { PublicationImpact, type PublicationFeedbackFilter } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Paper() {
  const [filter, setFilter] = useState<PublicationFeedbackFilter>("all");
  return (
    <PublicationImpact
      title="Self-Calibrating Coastal Sensors"
      venue="Journal of Applied Sensing"
      grade={{ label: "Outstanding", tone: "success" }}
      metrics={{ downloads: 18000, views: 46000, citations: 73, attention: 284 }}
      reads={[400, 2600, 5800, 9100, 12400, 18000]}
      feedback={[{ id: "f1", kind: "reader", who: "Dr. Ines Marlow", quote: "We reproduced it.", sentiment: "positive" }]}
      filter={filter}
      onFilterChange={setFilter}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/publication-impact";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPublicationImpact } from "@adamstavely/trenchcoat/publication-impact";

defineProps<{ topic: TcPublicationImpact["topic"]; grade: TcPublicationImpact["grade"] }>();
const onFilterChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-publication-impact :topic="topic" :grade="grade" @tc-filter-change="onFilterChange"></tc-publication-impact>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PublicationImpact } from "@adamstavely/trenchcoat/angular/publication-impact";
import type { TcPublicationImpact } from "@adamstavely/trenchcoat/publication-impact";

@Component({
  selector: "app-publication-impact-example",
  imports: [PublicationImpact],
  template: `<tc-publication-impact [topic]="topic()" [grade]="grade()" (tc-filter-change)="onFilterChange($event)"></tc-publication-impact>`,
})
export class PublicationImpactExample {
  readonly topic = input.required<TcPublicationImpact["topic"]>();
  readonly grade = input.required<TcPublicationImpact["grade"]>();
  onFilterChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/publication-impact";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPublicationImpact } from "@adamstavely/trenchcoat/publication-impact";

  let { topic, grade }: { topic: TcPublicationImpact["topic"]; grade: TcPublicationImpact["grade"] } = $props();
  let el: TcPublicationImpact;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-publication-impact bind:this={el} {topic} {grade}></tc-publication-impact>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The paper's title |
| `venue` | `venue` | `string \| undefined` | `undefined` | Where it was published |
| `date` | `date` | `number \| undefined` | `undefined` | When it was published, as epoch ms |
| `topic` | – | `{ label: string; href?: string } \| undefined` | `undefined` | The topic it belongs to; with `href` it's a link |
| `grade` | – | `{ label: string; tone?: PublicationTone } \| undefined` | `undefined` | The assessment grade, e.g. { label: "Outstanding", tone: "success" } |
| `gradeLabel` | `grade-label` | `string` | `"Assessment"` | The grade's caption |
| `authors` | – | `PublicationAuthor[]` | `[]` | The authors, in order |
| `outcome` | `outcome` | `string \| undefined` | `undefined` | What the paper achieved, as a short tag: "resolves gap" |
| `metrics` | – | `PublicationMetrics` | `{}` | Downloads, views, citations and attention score; each shows only when given |
| `reads` | – | `number[]` | `[]` | Cumulative reads over time, oldest first, for the sparkline |
| `mentions` | – | `PublicationMention[]` | `[]` | Mentions by kind: [{ label: "News", value: 11 }, …] |
| `audience` | – | `AudienceMixData \| undefined` | `undefined` | Who is reading – shown with &lt;tc-audience-mix> when given |
| `feedback` | – | `PublicationFeedback[]` | `[]` | Feedback quotes |
| `filter` | `filter` | `PublicationFeedbackFilter` | `"all"` | The feedback kind shown. Changed by the user unless a tc-filter-change listener calls preventDefault() |
| `kindLabels` | – | `Partial<Record<PublicationFeedbackKind, string>>` | `{}` | The feedback kinds' names, merged over the defaults (Peer, Reader, Sponsor) |
| `sentimentLabels` | – | `Partial<Record<PublicationSentiment, string>>` | `{}` | The sentiments' names, merged over the defaults (Positive, Mixed, Negative) |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates and numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-filter-change` | – | Yes | A feedback filter was picked ({ filter }: PublicationFilterChange); cancelable – prevented, `filter` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-pubi-ink` | `var(--tc-chart-1)` | both |

#### Design tokens it reads (87)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-avatar-sm`, `--tc-border-default`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-eyebrow-color`, `--tc-eyebrow-font-size`, `--tc-eyebrow-font-weight`, `--tc-eyebrow-line-height`, `--tc-eyebrow-tracking`, `--tc-eyebrow-transform`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-3xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-display`, `--tc-line-height-display-sm`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-pubi-bg`, `--tc-pubi-fg`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultPublicationFeedbackLabels: Record<PublicationFeedbackKind, string>` | The feedback kinds' and sentiments' names used when the page gives none |

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
| `topic` | `el.topic = …;` | `<… topic={…} />` | `<tc-publication-impact :topic="…">` | `<tc-publication-impact [topic]="…">` | `<tc-publication-impact {topic}>` |
| `grade` | `el.grade = …;` | `<… grade={…} />` | `<tc-publication-impact :grade="…">` | `<tc-publication-impact [grade]="…">` | `<tc-publication-impact {grade}>` |
| `authors` | `el.authors = …;` | `<… authors={…} />` | `<tc-publication-impact :authors="…">` | `<tc-publication-impact [authors]="…">` | `<tc-publication-impact {authors}>` |
| `metrics` | `el.metrics = …;` | `<… metrics={…} />` | `<tc-publication-impact :metrics="…">` | `<tc-publication-impact [metrics]="…">` | `<tc-publication-impact {metrics}>` |
| `reads` | `el.reads = …;` | `<… reads={…} />` | `<tc-publication-impact :reads="…">` | `<tc-publication-impact [reads]="…">` | `<tc-publication-impact {reads}>` |
| `mentions` | `el.mentions = …;` | `<… mentions={…} />` | `<tc-publication-impact :mentions="…">` | `<tc-publication-impact [mentions]="…">` | `<tc-publication-impact {mentions}>` |
| `audience` | `el.audience = …;` | `<… audience={…} />` | `<tc-publication-impact :audience="…">` | `<tc-publication-impact [audience]="…">` | `<tc-publication-impact {audience}>` |
| `feedback` | `el.feedback = …;` | `<… feedback={…} />` | `<tc-publication-impact :feedback="…">` | `<tc-publication-impact [feedback]="…">` | `<tc-publication-impact {feedback}>` |
| `kindLabels` | `el.kindLabels = …;` | `<… kindLabels={…} />` | `<tc-publication-impact :kindLabels="…">` | `<tc-publication-impact [kindLabels]="…">` | `<tc-publication-impact {kindLabels}>` |
| `sentimentLabels` | `el.sentimentLabels = …;` | `<… sentimentLabels={…} />` | `<tc-publication-impact :sentimentLabels="…">` | `<tc-publication-impact [sentimentLabels]="…">` | `<tc-publication-impact {sentimentLabels}>` |

*Also attributes: `heading`, `venue`, `date`, `grade-label`, `outcome`, `filter`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `filter` itself unless a listener calls `preventDefault()` on `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-publication-impact id="publication-impact"></tc-publication-impact>

<script type="module">
  import "@adamstavely/trenchcoat/publication-impact";

  const el = document.querySelector("#publication-impact");
  el.addEventListener("tc-filter-change", (e) => {
    e.preventDefault(); // the element keeps its filter…
    if (allowed(e.detail.filter)) el.filter = e.detail.filter; // …until the app sets it
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
import "@adamstavely/trenchcoat/publication-impact";
import type { TcPublicationImpact } from "@adamstavely/trenchcoat/publication-impact";

const props = defineProps<{ initial: TcPublicationImpact["filter"] }>();
const filter = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFilterChange = (e: CustomEvent<{ filter: TcPublicationImpact["filter"] }>) => {
  e.preventDefault();
  filter.value = e.detail.filter;
};
</script>

<template>
  <tc-publication-impact :filter="filter" @tc-filter-change="onFilterChange"></tc-publication-impact>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PublicationImpact } from "@adamstavely/trenchcoat/angular/publication-impact";
import type { TcPublicationImpact } from "@adamstavely/trenchcoat/publication-impact";

@Component({
  selector: "app-controlled-publication-impact",
  imports: [PublicationImpact],
  template: `<tc-publication-impact [filter]="filter()" (tc-filter-change)="onFilterChange($event)"></tc-publication-impact>`,
})
export class ControlledPublicationImpact {
  readonly initial = input.required<TcPublicationImpact["filter"]>();
  readonly filter = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFilterChange(e: CustomEvent<{ filter: TcPublicationImpact["filter"] }>) {
    e.preventDefault();
    this.filter.set(e.detail.filter);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/publication-impact";
  import type { TcPublicationImpact } from "@adamstavely/trenchcoat/publication-impact";

  let { initial }: { initial: TcPublicationImpact["filter"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let filter = $derived(initial);
  let el: TcPublicationImpact;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      filter = (e as CustomEvent<{ filter: TcPublicationImpact["filter"] }>).detail.filter;
    };
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-publication-impact bind:this={el} {filter}></tc-publication-impact>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-publication-impact")` returns a `TcPublicationImpact` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPublicationImpact } from "@adamstavely/trenchcoat/publication-impact";`
- **React / Next.js:** Props: `import type { PublicationImpactProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PublicationImpact>`. The element class, for refs: `import type { TcPublicationImpact } from "@adamstavely/trenchcoat/publication-impact";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPublicationImpact["topic"]` with `import type { TcPublicationImpact } from "@adamstavely/trenchcoat/publication-impact";`
- **Angular:** The directive types the template: `[topic]` takes `TcPublicationImpact["topic"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPublicationImpact } from "@adamstavely/trenchcoat/publication-impact";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPublicationImpact } from "@adamstavely/trenchcoat/publication-impact";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The paper's title |
| `filter` | `PublicationFeedbackFilter` | The feedback kind shown – controlled when given |
| `defaultFilter` | `PublicationFeedbackFilter` | The feedback kind shown on mount when `filter` isn't controlled |
| `onFilterChange` | `(filter: PublicationFeedbackFilter) => void` | A feedback filter was picked |

*Renamed or hidden on the wrapper: `heading`, `filter`, `children`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the topic link, the filter and the audience rows |
| ← / → (or ↑ / ↓) | In the filter, picks the previous or next kind |
| Home / End | In the filter, picks All or the last kind |

### Screen readers

The card is an article named by the title. The grade reads its caption and value, “Assessment Outstanding”. The reach
figures are a description list – “Downloads 18K” – and the sparkline is an image named “Cumulative reads, rising to
18,000”. The filter is a radio group named “Show feedback from”; picking a kind fires tc-filter-change. Each quote
reads its kind, who and where, its sentiment in words, the quote and its date.

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
| Container size queries | 105 | 110 | 16 | 16 | itself, audience-mix | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, audience-mix, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, audience-mix, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: balance | 114 | 121 | 17.5 | 17.5 | itself | Titles break where the line fills up instead of into even lines. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, audience-mix, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 23.6 KB | 6.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [audience-mix](audience-mix.md) · Element it renders | 11.8 KB | – |
| **Added to a page that already has Lit** | **43.7 KB** | **11.9 KB** |
| With Lit – the first component on a page | 63.1 KB | 18.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.1 ms** | the gallery demo's data, 173 DOM nodes – to layout, median of 7 |
| Typical update | **0.9 ms** | one item of reads replaced |
| First on the page | 4.9 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.5 ms | reads: first render, 173 nodes; update 0.6 ms |
| 1,000 items | 4.0 ms | reads: first render, 173 nodes; update 1.0 ms |

What it renders doesn't grow with reads (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the outcome as what the paper did, in two or three words: “resolves gap”, “informs policy”.
- Quote feedback as said, short: one or two sentences.
- Give dates as epoch ms; the element formats them in the viewer's language.

## Do and don't

### Do

- Show the grade only when it comes from a real assessment.
- Keep mentions to the kinds your sources count reliably.

### Don't

- Don't use the sentiment tints for anything else.
- Don't show feedback without who said it and where.

## Related

- [Audience Mix](audience-mix.md) – Who is reading – a sector mix as bars, an internal-versus-external split and the top places, each with its share, and the row under the pointer or focus named in full
- [Citation Badge](citation-badge.md) – A small badge of how a work is cited – publications, supporting, mentioning and contrasting counts with their marks, labelled or compact, a tooltip saying what each means and an optional link to the details
- [Citation Sections](citation-sections.md) – Where a work is cited – a donut of citing sections (Intro, Methods, Results, Discussion, Other) shaded darkest first, a legend with letter chips and counts, and the section under the pointer or focus with its share
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer

## Changelog

- **`tc-publication-impact`:** one paper's impact. - **About the paper:** venue, topic, grade and authors. - **Reach:** downloads, views, citations and attention, with a reads sparkline, plus mentions. - **Readers and feedback:** who is reading, and peer, reader and sponsor feedback, each with a sentiment.
