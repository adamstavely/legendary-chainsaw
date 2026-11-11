<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Digest

**AI & chat** · New

A one-minute digest of a pile of information, arranged around what the reader needs – what matters, what to do (ticked off as you go), what changed and what's safe to ignore, with a reading-time estimate and points that cite their sources

- **Element:** `<tc-digest>`
- **Size:** 7.4 KB gzip · 22.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/digest";` |
| React / Next.js | `import { Digest } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/digest";` · tags starting with tc- are custom elements |
| Angular | `import { Digest } from "@adamstavely/trenchcoat/angular/digest";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/digest";` |

## Example

The live example is in the gallery at `#/digest`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A one-minute digest: a pile of information – a week of updates, a long thread, a stack of documents – summarised around
what the reader needs, not the order it came in. Four quiet panels say what matters, what you should do, what changed
and what's safe to ignore, and the header says how long it takes to read, worked out from the words shown. The things
to do can be ticked off, and any point can cite where it came from as a small chip.

### When to use

- Catching someone up after time away: a week of project updates, a busy channel, an inbox.
- Turning a long AI-generated summary into something a reader can act on in a minute.
- Before a meeting, so everyone arrives knowing what changed and what's expected of them.

### When not to use

- Summarising one file, with its pages cited – use [File Summary](file-summary.md).
- Metrics that moved since last time – use [Change Summary](change-summary.md).
- One answer and how far to trust it – use [Confidence Brief](confidence-brief.md).
- Work passing from one person to another – use [Handoff Brief](handoff-brief.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Reading time** `.ui-dig__time` – the estimate, “~45 sec”, from the words shown
2. **Section** `.ui-dig__section` – a quiet panel: What matters, What you should do, What changed, Safe to ignore
3. **Item** `.ui-dig__item` – one point, with a bullet, or a checkbox in a checkable section
4. **Source** `.ui-dig__source` – where a point came from, as a chip or a link
5. **Skeleton** `.ui-dig__section--skeleton` – a shimmer in each panel while it summarises

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and the panels as sunken wells. Clean is
one white card with the header as its first row and the panels outlined with a hairline. Safe to ignore is quieter in
both. The panels sit two across, then in one column in a narrow container.

## Usage

### HTML

```html
<tc-digest id="digest" description="A week of launch updates."></tc-digest>

<script type="module">
  import "@adamstavely/trenchcoat/digest";
  import "@adamstavely/trenchcoat/tokens.css";

  const digest = document.querySelector("#digest");
  digest.matters = [{ text: "The deadline moved up one day.", source: { label: "Kickoff notes", href: "/notes/kickoff" } }];
  digest.actions = [{ id: "deck", text: "Send the revised deck by Thursday." }];
  digest.changes = ["1 new deadline"];
  digest.ignore = ["Unchanged staffing notes"];
  digest.addEventListener("tc-done-change", (e) => console.log(e.detail.done));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Digest } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Week() {
  const [done, setDone] = useState<string[]>([]);
  return (
    <Digest
      description="A week of launch updates."
      matters={["The deadline moved up one day."]}
      actions={[{ id: "deck", text: "Send the revised deck by Thursday." }]}
      changes={["1 new deadline"]}
      ignore={["Unchanged staffing notes"]}
      done={done}
      onDoneChange={setDone}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/digest";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDigest } from "@adamstavely/trenchcoat/digest";

defineProps<{ matters: TcDigest["matters"]; actions: TcDigest["actions"] }>();
const onDoneChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-digest :matters="matters" :actions="actions" @tc-done-change="onDoneChange"></tc-digest>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Digest } from "@adamstavely/trenchcoat/angular/digest";
import type { TcDigest } from "@adamstavely/trenchcoat/digest";

@Component({
  selector: "app-digest-example",
  imports: [Digest],
  template: `<tc-digest [matters]="matters()" [actions]="actions()" (tc-done-change)="onDoneChange($event)"></tc-digest>`,
})
export class DigestExample {
  readonly matters = input.required<TcDigest["matters"]>();
  readonly actions = input.required<TcDigest["actions"]>();
  onDoneChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/digest";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDigest } from "@adamstavely/trenchcoat/digest";

  let { matters, actions }: { matters: TcDigest["matters"]; actions: TcDigest["actions"] } = $props();
  let el: TcDigest;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-done-change", on);
    return () => el.removeEventListener("tc-done-change", on);
  });
</script>

<tc-digest bind:this={el} {matters} {actions}></tc-digest>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"One-minute digest"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `matters` | – | `DigestItem[]` | `[]` | What matters most, for the default sections |
| `actions` | – | `DigestItem[]` | `[]` | What the reader should do, for the default sections – checkable |
| `changes` | – | `DigestItem[]` | `[]` | What changed, for the default sections |
| `ignore` | – | `DigestItem[]` | `[]` | What's safe to ignore, for the default sections – quieter |
| `sections` | – | `DigestSection[] \| undefined` | `undefined` | The page's own sections, in place of the defaults |
| `done` | – | `string[]` | `[]` | The ids of ticked items. Changed by the user unless a tc-done-change listener calls preventDefault() |
| `wpm` | `wpm` | `number` | `238` | Reading speed for the estimate, in words a minute |
| `estimate` | `estimate` | `string \| undefined` | `undefined` | The estimate in words, in place of the computed one, e.g. "~2 min" |
| `status` | `status` | `DigestStatus` | `"done"` | "summarising" shows a shimmer in place of the sections |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-done-change` | – | Yes | An action was ticked or unticked ({ done, id, checked }: DigestDoneChange); cancelable – prevented, `done` stays as it was |
| `tc-cite-open` | – | Yes | A source chip was pressed ({ id, section, source }: DigestCiteOpen); cancelable – prevented, a link doesn't open |

#### Design tokens it reads (56)

`--tc-accent`, `--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-xs`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `matters` | `el.matters = …;` | `<… matters={…} />` | `<tc-digest :matters="…">` | `<tc-digest [matters]="…">` | `<tc-digest {matters}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-digest :actions="…">` | `<tc-digest [actions]="…">` | `<tc-digest {actions}>` |
| `changes` | `el.changes = …;` | `<… changes={…} />` | `<tc-digest :changes="…">` | `<tc-digest [changes]="…">` | `<tc-digest {changes}>` |
| `ignore` | `el.ignore = …;` | `<… ignore={…} />` | `<tc-digest :ignore="…">` | `<tc-digest [ignore]="…">` | `<tc-digest {ignore}>` |
| `sections` | `el.sections = …;` | `<… sections={…} />` | `<tc-digest :sections="…">` | `<tc-digest [sections]="…">` | `<tc-digest {sections}>` |
| `done` | `el.done = …;` | `<… done={…} />` | `<tc-digest :done="…">` | `<tc-digest [done]="…">` | `<tc-digest {done}>` |

*Also attributes: `heading`, `description`, `wpm`, `estimate`, `status` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-done-change` | Yes | `el.addEventListener("tc-done-change", (e) => …)` | `ref.current.addEventListener("tc-done-change", …)` | `@tc-done-change="…"` | `(tc-done-change)="…($event)"` | `el.addEventListener("tc-done-change", …)` |
| `tc-cite-open` | Yes | `el.addEventListener("tc-cite-open", (e) => …)` | `onCiteOpen={…}` | `@tc-cite-open="…"` | `(tc-cite-open)="…($event)"` | `el.addEventListener("tc-cite-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `done` itself unless a listener calls `preventDefault()` on `tc-done-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-digest id="digest"></tc-digest>

<script type="module">
  import "@adamstavely/trenchcoat/digest";

  const el = document.querySelector("#digest");
  el.addEventListener("tc-done-change", (e) => {
    e.preventDefault(); // the element keeps its done…
    if (allowed(e.detail.done)) el.done = e.detail.done; // …until the app sets it
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
import "@adamstavely/trenchcoat/digest";
import type { TcDigest } from "@adamstavely/trenchcoat/digest";

const props = defineProps<{ initial: TcDigest["done"] }>();
const done = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDoneChange = (e: CustomEvent<{ done: TcDigest["done"] }>) => {
  e.preventDefault();
  done.value = e.detail.done;
};
</script>

<template>
  <tc-digest :done="done" @tc-done-change="onDoneChange"></tc-digest>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Digest } from "@adamstavely/trenchcoat/angular/digest";
import type { TcDigest } from "@adamstavely/trenchcoat/digest";

@Component({
  selector: "app-controlled-digest",
  imports: [Digest],
  template: `<tc-digest [done]="done()" (tc-done-change)="onDoneChange($event)"></tc-digest>`,
})
export class ControlledDigest {
  readonly initial = input.required<TcDigest["done"]>();
  readonly done = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDoneChange(e: CustomEvent<{ done: TcDigest["done"] }>) {
    e.preventDefault();
    this.done.set(e.detail.done);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/digest";
  import type { TcDigest } from "@adamstavely/trenchcoat/digest";

  let { initial }: { initial: TcDigest["done"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let done = $derived(initial);
  let el: TcDigest;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      done = (e as CustomEvent<{ done: TcDigest["done"] }>).detail.done;
    };
    el.addEventListener("tc-done-change", on);
    return () => el.removeEventListener("tc-done-change", on);
  });
</script>

<tc-digest bind:this={el} {done}></tc-digest>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-digest")` returns a `TcDigest` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDigest } from "@adamstavely/trenchcoat/digest";`
- **React / Next.js:** Props: `import type { DigestProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Digest>`. The element class, for refs: `import type { TcDigest } from "@adamstavely/trenchcoat/digest";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDigest["matters"]` with `import type { TcDigest } from "@adamstavely/trenchcoat/digest";`
- **Angular:** The directive types the template: `[matters]` takes `TcDigest["matters"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDigest } from "@adamstavely/trenchcoat/digest";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDigest } from "@adamstavely/trenchcoat/digest";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `done` | `string[]` | The ids of ticked items – controlled when given |
| `defaultDone` | `string[]` | The ticked ids on mount when `done` isn't controlled |
| `onDoneChange` | `(done: string[]) => void` | An item was ticked or unticked |
| `onCiteOpen` | `(id: string, section: string, source: DigestSource) => boolean \| void` | A source chip was pressed; return false to keep a link from opening |

*Renamed or hidden on the wrapper: `heading`, `done`, `children`*

## Accessibility

### Keyboard

The digest has no keyboard handling of its own – everything in it is a native control.

| Key | What it does |
|---|---|
| Tab | Moves through the checkboxes and source chips in reading order |
| Space | Ticks or unticks the focused item |
| Enter | Opens the focused source |

### Screen readers

Each panel is a section named by its heading, “What matters”, with its points as a list. A checkable item is a real
checkbox labelled by its text; a ticked item is struck through. A source chip reads as a link or a button with its
label. The reading-time pill reads “~45 sec to read”, and the “1m” glyph is hidden. While summarising, the card is
`aria-busy` and the shimmer is hidden; “One-minute digest ready” is announced politely when it's done.

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

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.1 KB | 5.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **22.2 KB** | **7.4 KB** |
| With Lit – the first component on a page | 41.8 KB | 13.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.6 ms** | the gallery demo's data, 49 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of matters replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 9.1 ms | matters: first render, 308 nodes; update 0.6 ms |
| 1,000 items | 28 ms | matters: first render, 2,708 nodes; update 1.9 ms |

1,000 items of matters: 28 ms, 2,708 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Lead What matters with the change that has the biggest consequence for the reader.
- Write each action as something the reader does, with when: “Send the revised deck by Thursday.”
- Keep What changed to counts and kinds – the details belong in What matters.
- Put repeated or unchanged material in Safe to ignore, so the reader knows it was read and set aside.

## Do and don't

### Do

- Keep each panel to two to four points, so the estimate stays near a minute.
- Cite sources for anything a reader might want to check: a number, a date, a decision.
- Give actions stable `id`s, so ticks survive the digest being regenerated.

### Don't

- Don't follow the source documents' order – order by what the reader needs.
- Don't hide a section by leaving it empty to mean “nothing changed” – say so in one point.
- Don't override the estimate to make it look shorter than it reads.

## Related

- [File Summary](file-summary.md) – What's in a file without opening it – an AI summary that streams in, key points citing their pages or times, the people, organisations, dates and amounts it mentions, and Copy, Regenerate and Open file
- [Change Summary](change-summary.md) – What moved since last time – one metric per row with a colored trend
- [Confidence Brief](confidence-brief.md) – An answer explained for someone who wasn't there – what we conclude, the kind of uncertainty, what would change it, assumptions, signs to watch and the track record
- [Handoff Brief](handoff-brief.md) – Work passing from one person to another – summary, open items and commitments, each acknowledged by the receiver, blocked when they lack access

## Changelog

- **`tc-digest`** (AI & chat): a one-minute digest arranged around what the reader needs, with a reading-time estimate. - **Sections:** what matters, what to do (ticked off as you go), what changed, and what's safe to ignore.
