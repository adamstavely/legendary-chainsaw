<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Content Shield

**Trust & calibration** · New

Keeps content unloaded until someone chooses to see it – a picture, the reason and Show, with the content cloned in only on reveal and removed again on Hide

- **Element:** `<tc-content-shield>`
- **Size:** 6.6 KB gzip · 18.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/content-shield";` |
| React / Next.js | `import { ContentShield } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/content-shield";` · tags starting with tc- are custom elements |
| Angular | `import { ContentShield } from "@adamstavely/trenchcoat/angular/content-shield";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/content-shield";` |

## Example

The live example is in the gallery at `#/content-shield`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Keeps content unloaded until someone chooses to see it. While it's shielded, the content isn't in the page at all, so it
can't be read, flash into view or use bandwidth. Hide removes it again. This isn't access control: only send restricted
content to people your server allows.

### When to use

- Images, video or messages flagged as objectionable.
- Evidence reviewers may need to see, but shouldn't see by surprise.

### When not to use

- A file that isn't safe to open – use [Malware Blocked](../illustrations/malware-blocked.md).
- Someone without permission – use [No Access](../illustrations/no-access.md).
- A picture on its own, on an overlay you build – use [Content Hidden](../illustrations/content-hidden.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Shield** `.ui-csh__shield` – shown while the content is hidden
2. **Picture** `.ui-csh__picture` – Content Hidden
3. **Reason** `.ui-csh__reason` – why it's hidden
4. **Show** `.ui-csh__reveal` – or `.ui-csh__unavailable` when it can't be revealed
5. **Content** `.ui-csh__content` – filled on reveal
6. **Hide** `.ui-csh__hide` – removes the content

## Looks

Standard puts a white card on the gray tray; Clean is one white card. A page can set `--tc-csh-picture`, the picture's
width.

## Usage

### HTML

```html
<tc-content-shield reason="Flagged as a graphic injury photo" reveal-label="Show photo">
  <template><img src="/incidents/42.jpg" alt="The injury described in the report" /></template>
</tc-content-shield>

<script type="module">
  import "@adamstavely/trenchcoat/content-shield";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { ContentShield } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Photo() {
  return (
    <ContentShield reason="Flagged as a graphic injury photo" revealLabel="Show photo">
      <img src="/incidents/42.jpg" alt="The injury described in the report" />
    </ContentShield>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/content-shield";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcContentShield } from "@adamstavely/trenchcoat/content-shield";

defineProps<{ labels: TcContentShield["labels"] }>();
const onRevealedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-content-shield :labels="labels" @tc-revealed-change="onRevealedChange"></tc-content-shield>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ContentShield } from "@adamstavely/trenchcoat/angular/content-shield";
import type { TcContentShield } from "@adamstavely/trenchcoat/content-shield";

@Component({
  selector: "app-content-shield-example",
  imports: [ContentShield],
  template: `<tc-content-shield [labels]="labels()" (tc-revealed-change)="onRevealedChange($event)"></tc-content-shield>`,
})
export class ContentShieldExample {
  readonly labels = input.required<TcContentShield["labels"]>();
  onRevealedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/content-shield";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcContentShield } from "@adamstavely/trenchcoat/content-shield";

  let { labels }: { labels: TcContentShield["labels"] } = $props();
  let el: TcContentShield;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-revealed-change", on);
    return () => el.removeEventListener("tc-revealed-change", on);
  });
</script>

<tc-content-shield bind:this={el} {labels}></tc-content-shield>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `reason` | `reason` | `string` | `""` | Why it's hidden, in factual words |
| `revealable` | `revealable` | `boolean` | `true` | Whether it can be revealed; set revealable="false" for people who may not see it |
| `revealed` | `revealed` | `boolean` | `false` | Whether the content shows. Changed by the user unless a tc-revealed-change listener calls preventDefault() |
| `revealLabel` | `reveal-label` | `string` | `""` | The reveal button's words |
| `hideLabel` | `hide-label` | `string` | `""` | The hide button's words |
| `labels` | – | `Partial<ContentShieldLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-revealed-change` | – | Yes | It was revealed or hidden ({ revealed }: ContentShieldRevealedChange); cancelable – prevented, `revealed` stays as it was |
| `tc-reveal` | – | No | The content is being shown ({ container }: ContentShieldReveal); fill `container` when the content isn't in a template |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-csh-picture` | `240px` | both |

#### Design tokens it reads (17)

`--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-content-shield :labels="…">` | `<tc-content-shield [labels]="…">` | `<tc-content-shield {labels}>` |

*Also attributes: `reason`, `revealable`, `revealed`, `reveal-label`, `hide-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-revealed-change` | Yes | `el.addEventListener("tc-revealed-change", (e) => …)` | `ref.current.addEventListener("tc-revealed-change", …)` | `@tc-revealed-change="…"` | `(tc-revealed-change)="…($event)"` | `el.addEventListener("tc-revealed-change", …)` |
| `tc-reveal` | No | `el.addEventListener("tc-reveal", (e) => …)` | `onTcReveal={…}` | `@tc-reveal="…"` | `(tc-reveal)="…($event)"` | `el.addEventListener("tc-reveal", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `revealed` itself unless a listener calls `preventDefault()` on `tc-revealed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-content-shield id="content-shield"></tc-content-shield>

<script type="module">
  import "@adamstavely/trenchcoat/content-shield";

  const el = document.querySelector("#content-shield");
  el.addEventListener("tc-revealed-change", (e) => {
    e.preventDefault(); // the element keeps its revealed…
    if (allowed(e.detail.revealed)) el.revealed = e.detail.revealed; // …until the app sets it
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
import "@adamstavely/trenchcoat/content-shield";
import type { TcContentShield } from "@adamstavely/trenchcoat/content-shield";

const props = defineProps<{ initial: TcContentShield["revealed"] }>();
const revealed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRevealedChange = (e: CustomEvent<{ revealed: TcContentShield["revealed"] }>) => {
  e.preventDefault();
  revealed.value = e.detail.revealed;
};
</script>

<template>
  <tc-content-shield :revealed="revealed" @tc-revealed-change="onRevealedChange"></tc-content-shield>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ContentShield } from "@adamstavely/trenchcoat/angular/content-shield";
import type { TcContentShield } from "@adamstavely/trenchcoat/content-shield";

@Component({
  selector: "app-controlled-content-shield",
  imports: [ContentShield],
  template: `<tc-content-shield [revealed]="revealed()" (tc-revealed-change)="onRevealedChange($event)"></tc-content-shield>`,
})
export class ControlledContentShield {
  readonly initial = input.required<TcContentShield["revealed"]>();
  readonly revealed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRevealedChange(e: CustomEvent<{ revealed: TcContentShield["revealed"] }>) {
    e.preventDefault();
    this.revealed.set(e.detail.revealed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/content-shield";
  import type { TcContentShield } from "@adamstavely/trenchcoat/content-shield";

  let { initial }: { initial: TcContentShield["revealed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let revealed = $derived(initial);
  let el: TcContentShield;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      revealed = (e as CustomEvent<{ revealed: TcContentShield["revealed"] }>).detail.revealed;
    };
    el.addEventListener("tc-revealed-change", on);
    return () => el.removeEventListener("tc-revealed-change", on);
  });
</script>

<tc-content-shield bind:this={el} {revealed}></tc-content-shield>
```

### Slots and children

No slots: everything it shows comes from its properties (and, in React, the wrapper's children).

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-content-shield")` returns a `TcContentShield` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcContentShield } from "@adamstavely/trenchcoat/content-shield";`
- **React / Next.js:** Props: `import type { ContentShieldProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ContentShield>`. The element class, for refs: `import type { TcContentShield } from "@adamstavely/trenchcoat/content-shield";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcContentShield["labels"]` with `import type { TcContentShield } from "@adamstavely/trenchcoat/content-shield";`
- **Angular:** The directive types the template: `[labels]` takes `TcContentShield["labels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcContentShield } from "@adamstavely/trenchcoat/content-shield";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcContentShield } from "@adamstavely/trenchcoat/content-shield";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `revealed` | `boolean` | Whether the content shows – controlled when given |
| `defaultRevealed` | `boolean` | Whether it shows on mount when `revealed` isn't controlled |
| `onRevealedChange` | `(revealed: boolean) => void` | It was revealed or hidden |
| `children` | `React.ReactNode` | The content: rendered only once it's revealed |

*Renamed or hidden on the wrapper: `revealed`, `children`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space on Show | Reveals, and moves focus to the content's first control, or to Hide |
| Enter / Space on Hide | Removes the content, and moves focus back to Show |

### Screen readers

The picture is an image named by its caption, and the reason is plain text. `role="status"` announces when the content
is shown or hidden. Give the content its own names and alt text.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | content-hidden, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | content-hidden | – |
| inset | 87 | 66 | 14.1 | 14.1 | content-hidden | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, content-hidden, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 6.9 KB | 2.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [content-hidden](../illustrations/content-hidden.md) · Element it renders | 4.5 KB | – |
| **Added to a page that already has Lit** | **18.7 KB** | **6.6 KB** |
| With Lit – the first component on a page | 38.2 KB | 12.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.8 ms** | the gallery demo's data, 125 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | re-render with the same data |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Keep `reason` factual: "Flagged as a graphic injury photo". Don't repeat the content. Name the button for the action,
such as "Show photo", with `reveal-label`.

## Do and don't

### Do

- Supply content in a `<template>` child, or fill `container` from `tc-reveal`, so it isn't loaded early. In React, pass it as children: the wrapper only renders them once revealed.
- Set `revealable="false"` for people who may not see it.
- Check permission on the server when the content is requested.

### Don't

- Don't put plain content inside it outside a template: it would already be in the page.
- Don't treat it as access control. Anything sent to the browser can be read there.

## Related

- [Content Hidden](../illustrations/content-hidden.md) – A photo pixelated to a person's outline with a warning sign on it, with the words Sensitive content, to sit on an overlay covering obscene, sexual or graphic content
- [Malware Blocked](../illustrations/malware-blocked.md) – A file behind a warning shield with a bug on it, with the words Potential malware, for a file that can't be shown
- [No Access](../illustrations/no-access.md) – A folder held shut by a padlock, for someone who isn't entitled to see what they opened; the lock settles a few times and rests
- [Dialog](dialog.md) – A native modal with interactive content and restored focus
