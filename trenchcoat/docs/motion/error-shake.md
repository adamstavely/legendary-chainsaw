<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Error Shake

**Motion** · New

Wraps a field and shakes it once when it turns invalid, with an error outline that pulses and stays and a message that slides in and is announced, never on first load

- **Element:** `<tc-error-shake>`
- **Size:** 4.8 KB gzip · 13.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/error-shake";` |
| React / Next.js | `import "@adamstavely/trenchcoat/error-shake";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/error-shake";` · tags starting with tc- are custom elements |
| Angular | `import { ErrorShake } from "@adamstavely/trenchcoat/angular/error-shake";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/error-shake";` |

## Example

The live example is in the gallery at `#/motion/error-shake`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Wraps a field or a short form and shakes it once when it turns invalid. The content does a short, damped shake from side to side, the field's outline pulses in the error colour and stays, and the message slides in below and is announced. Change `shake-key` to shake again on a second wrong submit. It never shakes on first render, so a field that loads invalid just shows the outline and the message. With reduced motion nothing moves: the outline and the message appear in place.

### When to use

- A submit that failed on one field: a case number in the wrong format, a code that didn't match.
- A wrong answer the person should notice straight away, such as a one-time code.

### When not to use

- Errors found while typing – show the message without shaking, or it shakes on every key.
- Several fields wrong at once – list them in a summary above the form instead.
- A problem that isn't the person's input, such as a failed save – use a notice like [Guardrail Notice](../components/guardrail-notice.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Host** `[data-ui="esk"]` – wraps the content; its direct children shake
2. **Message** `.ui-esk__message` – the error, with an icon, announced as an alert
3. **Icon** `.ui-esk__icon` – a circle with an exclamation mark

## Looks

No look of its own. A page can set `--tc-error-shake-color` (the outline), `--tc-error-shake-text` (the message), `--tc-error-shake-distance` (how far it moves) and `--tc-error-shake-ring` (the pulse's reach).

## Usage

### HTML

```html
<tc-error-shake invalid message="Enter a case number like FR-2041">
  <label>Case number <input name="case" value="FR 2041" /></label>
</tc-error-shake>

<script type="module">
  import "@adamstavely/trenchcoat/error-shake";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ErrorShake } from "@adamstavely/trenchcoat/react";

export function CaseNumber() {
  const [value, setValue] = useState("");
  const [tries, setTries] = useState(0);
  const invalid = tries > 0 && !/^FR-\d{4}$/.test(value);
  return (
    <form onSubmit={(e) => { e.preventDefault(); setTries(tries + 1); }}>
      <ErrorShake invalid={invalid} shakeKey={tries} message="Enter a case number like FR-2041">
        <label>Case number <input value={value} onChange={(e) => setValue(e.target.value)} /></label>
      </ErrorShake>
      <button type="submit">Open case</button>
    </form>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/error-shake";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-error-shake></tc-error-shake>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { ErrorShake } from "@adamstavely/trenchcoat/angular/error-shake";

@Component({
  selector: "app-error-shake-example",
  imports: [ErrorShake],
  template: `<tc-error-shake></tc-error-shake>`,
})
export class ErrorShakeExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/error-shake";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcErrorShake } from "@adamstavely/trenchcoat/error-shake";

  let el: TcErrorShake;
</script>

<tc-error-shake bind:this={el}></tc-error-shake>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `invalid` | `invalid` | `boolean` | `false` | Shows the error: the outline and the message; turning it on shakes the content once |
| `message` | `message` | `string` | `""` | The error message under the content, announced when it appears |
| `shakeKey` | `shake-key` | `string \| number \| undefined` | `undefined` | Change this while invalid to shake again |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `shake()` | `void` | Shakes the content once (and pulses the outline when invalid) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-error-shake-color` | `var(--tc-status-danger-solid)` | both |
| `--tc-error-shake-text` | `var(--tc-status-danger-fg)` | both |
| `--tc-error-shake-distance` | `6px` | both |
| `--tc-error-shake-ring` | `3px` | both |

#### Design tokens it reads (11)

`--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-duration-slowest`, `--tc-ease-out`, `--tc-font-size-sm`, `--tc-line-height-normal`, `--tc-space-1`, `--tc-space-1-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`

## Frameworks

*The site shows these one framework at a time, behind tabs; here they're all written out. [Set-up for each framework](../foundations/frameworks.md)*

### Set-up

- **HTML:** Import the module once – it registers the tag – and load `@adamstavely/trenchcoat/tokens.css`. Nothing else to set up.
- **React / Next.js:** The wrappers in `@adamstavely/trenchcoat/react` take React props and callbacks. In Next.js (App Router) they render on the client only: use them from a `"use client"` file.
- **Vue / Nuxt:** Tell the template compiler that `tc-` tags are custom elements: `compilerOptions.isCustomElement` in the Vue plugin, or `vue.compilerOptions` in `nuxt.config.ts`.
- **Angular:** Import the element's directive from its own entry point, `@adamstavely/trenchcoat/angular/<name>` (it loads that element only, so a lazy route keeps it), into the component's `imports` – no `CUSTOM_ELEMENTS_SCHEMA`. The directive registers the tag, and strict templates check every binding and event.
- **Svelte:** Import the module in the component's script. Svelte sets a property when the element has one, so lists and objects pass as they are.

### Data properties

*Everything it takes is a string, number or boolean, so attributes work too.*

*Also attributes: `invalid`, `message`, `shake-key` – see the API table.*

### Events

*No `tc-` events of its own: listen for the native ones (`click`, `focus`…) as usual.*

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-error-shake")` returns a `TcErrorShake` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcErrorShake } from "@adamstavely/trenchcoat/error-shake";`
- **React / Next.js:** The element class: `import type { TcErrorShake } from "@adamstavely/trenchcoat/error-shake";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcErrorShake["invalid"]` with `import type { TcErrorShake } from "@adamstavely/trenchcoat/error-shake";`
- **Angular:** The directive types the template: `[invalid]` takes `TcErrorShake["invalid"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcErrorShake } from "@adamstavely/trenchcoat/error-shake";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcErrorShake } from "@adamstavely/trenchcoat/error-shake";`

## Accessibility

### Keyboard

Nothing to operate: the fields inside keep their own keys.

### Screen readers

The message is the only alert, so it's read once when it appears. While invalid, native inputs, textareas and selects inside get `aria-invalid="true"` and point at the message with `aria-describedby`; both are taken back when the field is valid again. The shake itself says nothing.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This piece alone** | 6.3 KB | 2.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **13.1 KB** | **4.8 KB** |
| With Lit – the first component on a page | 32.7 KB | 11.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 2.0 ms | default properties; includes adding its CSS to the document |

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

- Say what's wanted, not just that it's wrong: "Enter a case number like FR-2041".
- Keep it to one line.

## Do and don't

### Do

- Put focus back in the field after a failed submit, so the person can fix it.

### Don't

- Don't shake on a timer or while typing.
- Don't rely on the shake alone – the message carries the meaning.

## Related

- [Attention Pulse](attention-pulse.md) – Draws the eye once – a soft ring passes around something new a single time, and never on page load
- [Status Morph](status-morph.md) – One state's mark changing into the next with its word – pending, checking, done, failed or warning – with polite announcing on request
- [Number Field](../components/number-field.md) – A bounded numeric input with native validation
- [Stepper Form](../components/stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
