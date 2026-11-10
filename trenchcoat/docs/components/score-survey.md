<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Score Survey

**Feedback & onboarding** · New

The NPS or CSAT question a person answers – eleven numbers with the bands shown quietly, or five faces with words; number keys pick, a follow-up per band, Submit and a thank-you with Change answer

- **Element:** `<tc-score-survey>`
- **Size:** 9.0 KB gzip · 28.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/score-survey";` |
| React / Next.js | `import { ScoreSurvey } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/score-survey";` · tags starting with tc- are custom elements |
| Angular | `import { ScoreSurvey } from "@adamstavely/trenchcoat/angular/score-survey";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/score-survey";` |

## Example

The live example is in the gallery at `#/score-survey`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The one question a person answers about your product: how likely they are to recommend it (NPS, 0 to 10) or how
satisfied they are (CSAT, 1 to 5). NPS is a row of eleven numbers with the ends labelled in words and the three bands –
Detractor 0–6, Passive 7–8, Promoter 9–10 – shown quietly underneath; CSAT is five faces, each with its word. After a
pick, an optional follow-up question opens, with a different question per band or score if you like, and Submit sends
the score and the comment as one event. Then a thank-you replaces the question, with “Change answer” to go back.

### When to use

- An in-app or end-of-task survey with one standard question.
- Measuring loyalty over time (NPS) or satisfaction with a single moment, like a booking or a support chat (CSAT).
- Asking a follow-up that depends on the answer – what to improve from a detractor, what they like from a promoter.

### When not to use

- Showing the results of the survey – use [Score Summary](score-summary.md).
- Rating an AI answer against several criteria – use [Feedback Rubric](feedback-rubric.md).
- A quick reaction under a message – use [Reaction Bar](reaction-bar.md).
- Picking one option that isn't a rating – use [Radio Group](radio-group.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Question** `.ui-ssv__question` – the question, as the radio group's name
2. **Scale** `.ui-ssv__scale` – eleven numbers (NPS) or five faces with words (CSAT), one radio each
3. **Ends** `.ui-ssv__ends` – the words under 0 and 10 on the NPS scale
4. **Bands** `.ui-ssv__bands` – Detractor, Passive and Promoter under their numbers, each with its range
5. **Follow-up** `.ui-ssv__more` – the follow-up question and its textarea, Skip and Submit
6. **Thank-you** `.ui-ssv__done` – the thanks, the answer given and “Change answer”

## Looks

Standard puts the heading on a gray tray and the question on a white card inside it. Clean is one white card with the
heading as its first row. Narrow (under 440 px), the NPS row wraps to 0–5 and 6–10 and the bands become a line of
words. The band colours are component tokens: `--tc-ssv-band-detractor`, `--tc-ssv-band-passive` and
`--tc-ssv-band-promoter`.

## Usage

### HTML

```html
<tc-score-survey id="survey" kind="nps" question="How likely are you to recommend the Riverside Library app?" dismissible></tc-score-survey>

<script type="module">
  import "@adamstavely/trenchcoat/score-survey";
  import "@adamstavely/trenchcoat/tokens.css";

  const survey = document.querySelector("#survey");
  survey.followUps = { detractor: "What would make it more useful?", promoter: "What do you like most?" };
  survey.addEventListener("tc-submit", (e) => fetch("/survey", { method: "POST", body: JSON.stringify(e.detail) }));
  survey.addEventListener("tc-dismiss", () => survey.remove());
</script>
```

### React / Next.js

```tsx
import { ScoreSurvey, type ScoreSurveySubmit } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function VisitSurvey({ onSave }: { onSave: (answer: ScoreSurveySubmit) => void }) {
  return <ScoreSurvey kind="csat" question="How satisfied were you with booking a study room?" followUp="Tell us more" onSubmit={onSave} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/score-survey";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcScoreSurvey } from "@adamstavely/trenchcoat/score-survey";

defineProps<{ followUps: TcScoreSurvey["followUps"]; labels: TcScoreSurvey["labels"] }>();
const onScoreChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-score-survey :followUps="followUps" :labels="labels" @tc-score-change="onScoreChange"></tc-score-survey>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ScoreSurvey } from "@adamstavely/trenchcoat/angular/score-survey";
import type { TcScoreSurvey } from "@adamstavely/trenchcoat/score-survey";

@Component({
  selector: "app-score-survey-example",
  imports: [ScoreSurvey],
  template: `<tc-score-survey [followUps]="followUps()" [labels]="labels()" (tc-score-change)="onScoreChange($event)"></tc-score-survey>`,
})
export class ScoreSurveyExample {
  readonly followUps = input.required<TcScoreSurvey["followUps"]>();
  readonly labels = input.required<TcScoreSurvey["labels"]>();
  onScoreChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/score-survey";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcScoreSurvey } from "@adamstavely/trenchcoat/score-survey";

  let { followUps, labels }: { followUps: TcScoreSurvey["followUps"]; labels: TcScoreSurvey["labels"] } = $props();
  let el: TcScoreSurvey;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-score-change", on);
    return () => el.removeEventListener("tc-score-change", on);
  });
</script>

<tc-score-survey bind:this={el} {followUps} {labels}></tc-score-survey>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Your feedback"` | The heading |
| `kind` | `kind` | `ScoreSurveyKind` | `"nps"` | "nps" for 0–10 likelihood to recommend, "csat" for 1–5 satisfaction |
| `question` | `question` | `string` | `""` | The question; defaults to the standard wording for the kind |
| `score` | `score` | `number \| null` | `null` | The answer. Changed by the user unless a tc-score-change listener calls preventDefault() |
| `followUp` | `follow-up` | `string` | `""` | The follow-up question asked after a pick; "" asks none |
| `followUps` | – | `ScoreSurveyFollowUps` | `{}` | Follow-up questions by NPS band or CSAT score, ahead of `followUp` |
| `labels` | – | `Partial<ScoreSurveyLabels>` | `{}` | Words the page can rename, merged over `defaultScoreSurveyLabels` |
| `hideBands` | `hide-bands` | `boolean` | `false` | Hides the NPS band names under the scale |
| `dismissible` | `dismissible` | `boolean` | `false` | Shows a dismiss button in the header, which fires tc-dismiss |
| `submitted` | `submitted` | `boolean` | `false` | The answer was submitted: the thank-you shows. Set by Submit and Skip; the app may set it too |
| `submitting` | `submitting` | `boolean` | `false` | Shows Submit as busy while the app saves the answer |
| `values` | – | `number[]` | – | The scores on the scale, lowest first |
| `followUpQuestion` | – | `string` | – | The follow-up question for the current score, or "" |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-score-change` | – | Yes | A score was picked ({ score }: ScoreSurveyScoreChange); cancelable – prevented, `score` stays as it was |
| `tc-submit` | – | Yes | Submit or Skip was pressed (ScoreSurveySubmit); cancelable – prevent it to stay on the question |
| `tc-edit` | – | No | "Change answer" reopened a submitted answer; detail: null |
| `tc-dismiss` | – | No | The dismiss button was pressed; remove the survey; detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-ssv-opt-h` | `var(--tc-control-h-lg)` | both |
| `--tc-ssv-band-detractor` | `var(--tc-status-danger-solid)` | both |
| `--tc-ssv-band-passive` | `var(--tc-chart-neutral)` | both |
| `--tc-ssv-band-promoter` | `var(--tc-status-success-solid)` | both |

#### Design tokens it reads (72)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-neutral`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-ssv-band`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `npsBand(score: number): NpsBand` | The NPS band a score from 0 to 10 falls in |

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
| `followUps` | `el.followUps = …;` | `<… followUps={…} />` | `<tc-score-survey :followUps="…">` | `<tc-score-survey [followUps]="…">` | `<tc-score-survey {followUps}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-score-survey :labels="…">` | `<tc-score-survey [labels]="…">` | `<tc-score-survey {labels}>` |

*Also attributes: `heading`, `kind`, `question`, `score`, `follow-up`, `hide-bands`, `dismissible`, `submitted` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-score-change` | Yes | `el.addEventListener("tc-score-change", (e) => …)` | `ref.current.addEventListener("tc-score-change", …)` | `@tc-score-change="…"` | `(tc-score-change)="…($event)"` | `el.addEventListener("tc-score-change", …)` |
| `tc-submit` | Yes | `el.addEventListener("tc-submit", (e) => …)` | `onSubmit={…}` | `@tc-submit="…"` | `(tc-submit)="…($event)"` | `el.addEventListener("tc-submit", …)` |
| `tc-edit` | No | `el.addEventListener("tc-edit", (e) => …)` | `onEdit={…}` | `@tc-edit="…"` | `(tc-edit)="…($event)"` | `el.addEventListener("tc-edit", …)` |
| `tc-dismiss` | No | `el.addEventListener("tc-dismiss", (e) => …)` | `onDismiss={…}` | `@tc-dismiss="…"` | `(tc-dismiss)="…($event)"` | `el.addEventListener("tc-dismiss", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `score` itself unless a listener calls `preventDefault()` on `tc-score-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-score-survey id="score-survey"></tc-score-survey>

<script type="module">
  import "@adamstavely/trenchcoat/score-survey";

  const el = document.querySelector("#score-survey");
  el.addEventListener("tc-score-change", (e) => {
    e.preventDefault(); // the element keeps its score…
    if (allowed(e.detail.score)) el.score = e.detail.score; // …until the app sets it
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
import "@adamstavely/trenchcoat/score-survey";
import type { TcScoreSurvey } from "@adamstavely/trenchcoat/score-survey";

const props = defineProps<{ initial: TcScoreSurvey["score"] }>();
const score = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onScoreChange = (e: CustomEvent<{ score: TcScoreSurvey["score"] }>) => {
  e.preventDefault();
  score.value = e.detail.score;
};
</script>

<template>
  <tc-score-survey :score="score" @tc-score-change="onScoreChange"></tc-score-survey>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ScoreSurvey } from "@adamstavely/trenchcoat/angular/score-survey";
import type { TcScoreSurvey } from "@adamstavely/trenchcoat/score-survey";

@Component({
  selector: "app-controlled-score-survey",
  imports: [ScoreSurvey],
  template: `<tc-score-survey [score]="score()" (tc-score-change)="onScoreChange($event)"></tc-score-survey>`,
})
export class ControlledScoreSurvey {
  readonly initial = input.required<TcScoreSurvey["score"]>();
  readonly score = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onScoreChange(e: CustomEvent<{ score: TcScoreSurvey["score"] }>) {
    e.preventDefault();
    this.score.set(e.detail.score);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/score-survey";
  import type { TcScoreSurvey } from "@adamstavely/trenchcoat/score-survey";

  let { initial }: { initial: TcScoreSurvey["score"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let score = $derived(initial);
  let el: TcScoreSurvey;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      score = (e as CustomEvent<{ score: TcScoreSurvey["score"] }>).detail.score;
    };
    el.addEventListener("tc-score-change", on);
    return () => el.removeEventListener("tc-score-change", on);
  });
</script>

<tc-score-survey bind:this={el} {score}></tc-score-survey>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-score-survey")` returns a `TcScoreSurvey` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcScoreSurvey } from "@adamstavely/trenchcoat/score-survey";`
- **React / Next.js:** Props: `import type { ScoreSurveyProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ScoreSurvey>`. The element class, for refs: `import type { TcScoreSurvey } from "@adamstavely/trenchcoat/score-survey";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcScoreSurvey["followUps"]` with `import type { TcScoreSurvey } from "@adamstavely/trenchcoat/score-survey";`
- **Angular:** The directive types the template: `[followUps]` takes `TcScoreSurvey["followUps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcScoreSurvey } from "@adamstavely/trenchcoat/score-survey";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcScoreSurvey } from "@adamstavely/trenchcoat/score-survey";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – defaults to "Your feedback" |
| `score` | `number \| null` | The answer. Controlled when defined (null for none); otherwise the component keeps it, starting from `defaultScore` |
| `defaultScore` | `number \| null` | The answer at first when `score` isn't controlled |
| `onScoreChange` | `(score: number \| null) => void` | Called with the new score after every pick, controlled or not |
| `onSubmit` | `(answer: ScoreSurveySubmit) => void \| boolean` | Called when Submit or Skip is pressed – the score, the comment and the kind. Return false to stay on the question |
| `onEdit` | `() => void` | Called when "Change answer" reopens a submitted answer – set `submitted` back to false if you control it |
| `onDismiss` | `() => void` | Called when the dismiss button is pressed – remove the survey |

*Renamed or hidden on the wrapper: `heading`, `score`, `onSubmit`, `children`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the scale (one stop), then the follow-up, Skip and Submit |
| → / ↓ | Picks the next score, wrapping round; with nothing picked, picks the first |
| ← / ↑ | Picks the previous score, wrapping round; with nothing picked, picks the last |
| Home / End | Picks the first or last score |
| 0–9 | Picks that score directly; on NPS, 1 then 0 in quick succession picks 10 |
| Enter / Space | Picks the focused score, or presses the focused button |

### Screen readers

The card is a `group` named by the heading. The scale is a `radiogroup` named by the question and described by the
keys that work; each option is a `radio` with `aria-checked`. NPS options are named by their number, with the end
words added to 0 and 10 (“0, Not at all likely”); CSAT options are named by their word. The follow-up textarea is
labelled by its question. Submit has `aria-busy` while the app saves, and a status region says the thanks once it's
submitted. The dismiss button is named “Dismiss”.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.4 KB | 6.6 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **28.7 KB** | **9.1 KB** |
| With Lit – the first component on a page | 49.4 KB | 15.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 59 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name your product in the question – “recommend the Riverside Library app” – not “us”.
- Keep follow-ups to one short question; mark them optional in the placeholder.
- Ask the follow-up that fits the answer: what to fix from a detractor, what to keep from a promoter.
- Don't rename the NPS bands for people taking the survey to something judgemental; `hide-bands` hides them.

## Do and don't

### Do

- Ask at a natural pause – after a task is done, not in the middle of one.
- Set `submitting` while you save, and prevent `tc-submit` (or return false from `onSubmit`) if the save can fail.
- Offer `dismissible` so people can say no.

### Don't

- Don't change the scale's range or wording if you compare results over time.
- Don't ask NPS and CSAT about the same moment in one go.
- Don't make the follow-up required.

## Related

- [Score Summary](score-summary.md) – NPS or CSAT results – the score in big type, the change since last time with a sparkline, the target, the bands with shares and counts, and a bar per score you can pick to filter comments
- [Feedback Rubric](feedback-rubric.md) – Rate an answer the useful way – rubric criteria, what kind of failure it was, and the answer it should have been, ready for training and evals
- [Reaction Bar](reaction-bar.md) – Like, comment, repost and share in one pill – icons pop and fill, counts roll in digit by digit
- [Radio Group](radio-group.md) – A native keyboard-operated single choice

## Changelog

- `tc-score-survey` – the NPS (0–10) or CSAT (1–5) question with a follow-up per band, Submit and a thank-you.
