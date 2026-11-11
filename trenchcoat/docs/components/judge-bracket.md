<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Judge Bracket

**Agents** · New

How an LLM judge picks the best of several attempts, as a tournament – matches that fill as verdicts stream in, the winner moving on along its connector and the loser stepping back, any match's two answers with the judge's reason and confidence, and the champion to use

- **Element:** `<tc-judge-bracket>`
- **Size:** 10.9 KB gzip · 35.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/judge-bracket";` |
| React / Next.js | `import { JudgeBracket } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/judge-bracket";` · tags starting with tc- are custom elements |
| Angular | `import { JudgeBracket } from "@adamstavely/trenchcoat/angular/judge-bracket";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/judge-bracket";` |

## Example

The live example is in the gallery at `#/judge-bracket`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How an LLM judge picks the best of several attempts at one task, drawn as a single-elimination tournament. The
attempts are seeded in the order you give them – when there aren't a power of two, the first ones get a bye – and
rounds run left to right, each match a pair of small cards joined to the match it feeds. As you stream the judge's
verdicts in, the bracket fills: the winner moves on along its connector, the loser steps back, and the match being
judged pulses gently. Open any match for both answers side by side, the judge's reason and how confident it was. The
champion gets a card of its own with its answer and "Use this answer".

It's the judging, made visible. Parallel Attempts races several attempts and scores each on its own; Answer Arena asks
a person to rate two answers. The bracket shows a judge comparing two at a time, so people can see why the winner
won – and check the close calls.

### When to use

- A best-of-n run where a model judges pairs of answers and the winner of each pair goes through.
- Showing reviewers which comparisons decided the result, with the judge's reasoning for each.
- Tournaments of prompts, retrieval settings or agent plans scored head to head.

### When not to use

- Attempts scored on their own, against a rubric – use [Parallel Attempts](parallel-attempts.md).
- Two answers for a person to compare and rate – use [Answer Arena](answer-arena.md).
- Two runs or prompt versions compared line by line – use [Run Compare](run-compare.md).
- Scores across a whole evaluation set – use [Eval Scorecard](eval-scorecard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Round** `.ui-jbk__round` – a column of matches, named Round 1, Quarter-final, Semi-final or Final
2. **Match** `.ui-jbk__match` – a button holding the two attempts it compares
3. **Attempt** `.ui-jbk__entry` – the attempt's name, model and score; the winner ticked, the loser struck through
4. **Connector** `.ui-jbk__wire` – from a match to the one it feeds, drawn in the accent once its winner moves on
5. **Champion** `.ui-jbk__champ` – the winner's answer and "Use this answer"
6. **Comparison** `.ui-jbk__panel` – both answers, the judge's reason and its confidence
7. **Path** `.ui-jbk__path` – "Round 1 → Semi-final → Final", shown when the bracket is narrow

## Looks

Standard sets the header on the gray tray and the bracket on a white card; Clean is one white card with the header as
its first row and quieter, hairline cards. A page can set `--tc-jbk-wire` and `--tc-jbk-wire-won` for the connectors'
colours. Wide, the bracket scrolls sideways when it doesn't fit; under 560 px the rounds stack as lists under the path
and the connectors go.

## Usage

### HTML

```html
<tc-judge-bracket id="bracket" task="Summarise the audit's key findings"></tc-judge-bracket>

<script type="module">
  import "@adamstavely/trenchcoat/judge-bracket";
  import "@adamstavely/trenchcoat/tokens.css";

  const bracket = document.querySelector("#bracket");
  bracket.attempts = [
    { id: "a", label: "Attempt A", model: "Claude Sonnet", summary: "Three findings, with their numbers." },
    { id: "b", label: "Attempt B", model: "Claude Haiku", summary: "Missing tax IDs and some renewals." },
  ];
  bracket.verdicts = [{ round: 1, a: "a", b: "b", winner: "a", reason: "A gives the numbers.", confidence: 0.86 }];
  bracket.addEventListener("tc-accept", (e) => console.log("use", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { JudgeBracket, type JudgeAttempt, type JudgeMatch } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Bracket({ attempts, verdicts }: { attempts: JudgeAttempt[]; verdicts: JudgeMatch[] }) {
  const [match, setMatch] = useState<string | null>(null);
  return (
    <JudgeBracket
      task="Summarise the audit's key findings"
      attempts={attempts}
      verdicts={verdicts}
      match={match}
      onMatchChange={(next) => setMatch(next)}
      onAccept={(id) => console.log("use", id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/judge-bracket";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcJudgeBracket } from "@adamstavely/trenchcoat/judge-bracket";

defineProps<{ attempts: TcJudgeBracket["attempts"]; verdicts: TcJudgeBracket["verdicts"] }>();
const onMatchChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-judge-bracket :attempts="attempts" :verdicts="verdicts" @tc-match-change="onMatchChange"></tc-judge-bracket>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { JudgeBracket } from "@adamstavely/trenchcoat/angular/judge-bracket";
import type { TcJudgeBracket } from "@adamstavely/trenchcoat/judge-bracket";

@Component({
  selector: "app-judge-bracket-example",
  imports: [JudgeBracket],
  template: `<tc-judge-bracket [attempts]="attempts()" [verdicts]="verdicts()" (tc-match-change)="onMatchChange($event)"></tc-judge-bracket>`,
})
export class JudgeBracketExample {
  readonly attempts = input.required<TcJudgeBracket["attempts"]>();
  readonly verdicts = input.required<TcJudgeBracket["verdicts"]>();
  onMatchChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/judge-bracket";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcJudgeBracket } from "@adamstavely/trenchcoat/judge-bracket";

  let { attempts, verdicts }: { attempts: TcJudgeBracket["attempts"]; verdicts: TcJudgeBracket["verdicts"] } = $props();
  let el: TcJudgeBracket;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-match-change", on);
    return () => el.removeEventListener("tc-match-change", on);
  });
</script>

<tc-judge-bracket bind:this={el} {attempts} {verdicts}></tc-judge-bracket>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Judge's bracket"` | The heading |
| `task` | `task` | `string` | `""` | What every attempt tried to do – the quiet line under the heading |
| `attempts` | – | `JudgeAttempt[]` | `[]` | The attempts, 2 to 16, in seeding order – the first ones get the byes |
| `verdicts` | – | `JudgeMatch[]` | `[]` | The judge's matches so far – one verdict per match – streamed in as they're judged (`matches` is the DOM's) |
| `match` | `match` | `string \| null` | `null` | The match whose comparison is open – its key, "&lt;round>-&lt;match>" (both from 1) – or null |
| `accepted` | `accepted` | `string \| null` | `null` | The id of the attempt in use, once "Use this answer" was chosen |
| `labels` | – | `Partial<JudgeBracketLabels>` | `{}` | Words the page can rename, merged over defaultJudgeBracketLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-match-change` | – | Yes | A match was opened or closed ({ match, item }: JudgeMatchChange); cancelable – prevented, `match` stays as it was |
| `tc-accept` | – | Yes | "Use this answer" was chosen on the champion ({ id, attempt }: JudgeAccept); cancelable – prevented, `accepted` isn't set |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-jbk-wire` | `var(--tc-border-strong)` | both |
| `--tc-jbk-wire-won` | `var(--tc-accent-solid)` | both |

#### Design tokens it reads (80)

`--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-subtle`, `--tc-focus-halo`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-success-bg`, `--tc-status-success-border`, `--tc-status-success-fg`, `--tc-surface-base`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `buildBracket(attempts: readonly JudgeAttempt[], matches: readonly JudgeMatch[]): JudgeSlot[][]` | The bracket as rounds of slots: seeding, byes, who meets whom and who won, from the attempts and the matches |

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
| `attempts` | `el.attempts = …;` | `<… attempts={…} />` | `<tc-judge-bracket :attempts="…">` | `<tc-judge-bracket [attempts]="…">` | `<tc-judge-bracket {attempts}>` |
| `verdicts` | `el.verdicts = …;` | `<… verdicts={…} />` | `<tc-judge-bracket :verdicts="…">` | `<tc-judge-bracket [verdicts]="…">` | `<tc-judge-bracket {verdicts}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-judge-bracket :labels="…">` | `<tc-judge-bracket [labels]="…">` | `<tc-judge-bracket {labels}>` |

*Also attributes: `heading`, `task`, `match`, `accepted` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-match-change` | Yes | `el.addEventListener("tc-match-change", (e) => …)` | `ref.current.addEventListener("tc-match-change", …)` | `@tc-match-change="…"` | `(tc-match-change)="…($event)"` | `el.addEventListener("tc-match-change", …)` |
| `tc-accept` | Yes | `el.addEventListener("tc-accept", (e) => …)` | `onAccept={…}` | `@tc-accept="…"` | `(tc-accept)="…($event)"` | `el.addEventListener("tc-accept", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `match` itself unless a listener calls `preventDefault()` on `tc-match-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-judge-bracket id="judge-bracket"></tc-judge-bracket>

<script type="module">
  import "@adamstavely/trenchcoat/judge-bracket";

  const el = document.querySelector("#judge-bracket");
  el.addEventListener("tc-match-change", (e) => {
    e.preventDefault(); // the element keeps its match…
    if (allowed(e.detail.match)) el.match = e.detail.match; // …until the app sets it
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
import "@adamstavely/trenchcoat/judge-bracket";
import type { TcJudgeBracket } from "@adamstavely/trenchcoat/judge-bracket";

const props = defineProps<{ initial: TcJudgeBracket["match"] }>();
const match = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMatchChange = (e: CustomEvent<{ match: TcJudgeBracket["match"] }>) => {
  e.preventDefault();
  match.value = e.detail.match;
};
</script>

<template>
  <tc-judge-bracket :match="match" @tc-match-change="onMatchChange"></tc-judge-bracket>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { JudgeBracket } from "@adamstavely/trenchcoat/angular/judge-bracket";
import type { TcJudgeBracket } from "@adamstavely/trenchcoat/judge-bracket";

@Component({
  selector: "app-controlled-judge-bracket",
  imports: [JudgeBracket],
  template: `<tc-judge-bracket [match]="match()" (tc-match-change)="onMatchChange($event)"></tc-judge-bracket>`,
})
export class ControlledJudgeBracket {
  readonly initial = input.required<TcJudgeBracket["match"]>();
  readonly match = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMatchChange(e: CustomEvent<{ match: TcJudgeBracket["match"] }>) {
    e.preventDefault();
    this.match.set(e.detail.match);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/judge-bracket";
  import type { TcJudgeBracket } from "@adamstavely/trenchcoat/judge-bracket";

  let { initial }: { initial: TcJudgeBracket["match"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let match = $derived(initial);
  let el: TcJudgeBracket;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      match = (e as CustomEvent<{ match: TcJudgeBracket["match"] }>).detail.match;
    };
    el.addEventListener("tc-match-change", on);
    return () => el.removeEventListener("tc-match-change", on);
  });
</script>

<tc-judge-bracket bind:this={el} {match}></tc-judge-bracket>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-judge-bracket")` returns a `TcJudgeBracket` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcJudgeBracket } from "@adamstavely/trenchcoat/judge-bracket";`
- **React / Next.js:** Props: `import type { JudgeBracketProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof JudgeBracket>`. The element class, for refs: `import type { TcJudgeBracket } from "@adamstavely/trenchcoat/judge-bracket";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcJudgeBracket["attempts"]` with `import type { TcJudgeBracket } from "@adamstavely/trenchcoat/judge-bracket";`
- **Angular:** The directive types the template: `[attempts]` takes `TcJudgeBracket["attempts"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcJudgeBracket } from "@adamstavely/trenchcoat/judge-bracket";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcJudgeBracket } from "@adamstavely/trenchcoat/judge-bracket";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – "Judge's bracket" by default |
| `match` | `string \| null` | The open match's key, "&lt;round>-&lt;match>" (both from 1), or null. Controlled when defined |
| `defaultMatch` | `string \| null` | The open match when uncontrolled |
| `onMatchChange` | `(match: string \| null, item?: JudgeMatch) => void` | A match was opened or closed, with its verdict if it has one |
| `accepted` | `string \| null` | The attempt in use. Controlled when defined |
| `defaultAccepted` | `string \| null` | The attempt in use when uncontrolled |
| `onAccept` | `(id: string, attempt: JudgeAttempt) => void` | "Use this answer" was chosen on the champion |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the bracket (one tab stop), then to the champion's button and the comparison |
| ↓ / ↑ | The next or previous match in the round |
| → | The match this one feeds, in the next round |
| ← | The first match that fed this one |
| Home / End | The round's first or last match |
| Enter / Space | Opens or closes the match's comparison |
| Escape | Closes the comparison; Close returns focus to the match |

### Screen readers

The bracket is a `group` named by the heading. Each round is a `group` named by its name, and each match a button that
reads its round, its number, both attempts and its state: "Semi-final, match 1: Attempt A Claude Sonnet 88 against
Attempt C Claude Opus 93 (won)". Empty places read "Waiting for the winner of round 1 match 3". A match's button has
`aria-expanded` and controls the comparison, a region named "Semi-final · match 1". A polite status line says each
verdict as it arrives – "Attempt C beats Attempt A in the semi-final", "Attempt C wins the bracket" – and "Using
Attempt C" once it's chosen. The connectors are decorative.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 27.5 KB | 8.6 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **35.3 KB** | **10.9 KB** |
| With Lit – the first component on a page | 56.0 KB | 17.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **5.2 ms** | the gallery demo's data, 180 DOM nodes – to layout, median of 7 |
| Typical update | **1.0 ms** | one item of attempts replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.8 ms | attempts: first render, 288 nodes; update 0.7 ms |
| 1,000 items | 4.3 ms | attempts: first render, 288 nodes; update 0.6 ms |

1,000 items of attempts: 4.3 ms, 288 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name attempts briefly and the same way – "Attempt A", "Prompt v3" – and put the model in `model`.
- Write `summary` as the answer itself, in a sentence or two; it shows in the comparison and on the champion's card.
- Give the judge's `reason` in plain words, naming what tipped it: "C leads with the highest-risk finding".
- Send `confidence` when the judge gives one; close calls (under about 60%) are worth a second look.
- Stream a match in without a `winner` while it's being judged, then again with it.

## Do and don't

### Do

- Keep `attempts` in the same order for the whole run – it's the seeding.
- Prevent `tc-accept` when choosing the answer happens on your server, and set `accepted` when it has.
- Let people open the close calls: link to the comparison from wherever the result is reported.

### Don't

- Don't use it for more than 16 attempts – score them first and judge the best few.
- Don't rename attempts between verdicts; a match is found by its round and its two attempts' ids.
- Don't hide the reason – a winner without one asks people to trust the judge blindly.

## Related

- [Parallel Attempts](parallel-attempts.md) – An agent tries the same task several ways at once and the best one wins – every attempt races as a row with its model, approach and live bar, then gets a score; the best is marked and picked, and you can switch to another
- [Answer Arena](answer-arena.md) – Two models answer the same prompt side by side, streaming together – then A is better, B is better or a tie, with a reason
- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
