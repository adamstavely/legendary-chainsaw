# Frameworks

Every Trenchcoat component is a custom element, so it works the same way in every framework and in none. Each
component page has a **Frameworks** section with the details for that component – its data properties, its events by
their real names, how to control it, its slots, server rendering and types – in a tab for each framework. This page
covers the set-up you do once.

The repository's `examples/` folder has a working app for each framework below. `npm run examples` builds them from
the packed package and checks the same page in each, and `npm run check:snippets` compiles every component page's
generated snippets in them – so the code on the pages compiles.

## What's the same everywhere

- **Import the module, use the tag.** `import "trenchcoat/combobox"` registers `<tc-combobox>`. Load
  `trenchcoat/tokens.css` once.
- **Data are properties.** Strings, numbers and booleans can be attributes; lists, objects and functions are set as
  properties – each framework's property binding below.
- **Events are DOM events** named `tc-…` (`tc-value-change`), with what changed in `event.detail`. They bubble.
- **Controlled values.** A value the person changes (`value`, `open`, `selected`…) changes in the element unless a
  listener calls `preventDefault()` on its change event – then the app decides and sets it. Every page lists its
  controlled pairs.
- **Light DOM.** Elements render into themselves, not a shadow root: page CSS and ARIA ids reach them, and children you
  add stay where you put them.
- **No server rendering** of the elements' own content in this version (decision L10). The server can send the tag;
  it upgrades in the browser.

## React and Next.js

Use the wrappers – React props and callbacks with the element's API:

```tsx
import { Combobox } from "trenchcoat/react";
import "trenchcoat/tokens.css";

<Combobox label="Assignees" options={people} value={value} onChange={setValue} />;
```

- A value with a `default…` twin (`value` / `defaultValue`) is controlled when you pass it and kept by the element
  otherwise.
- Events the wrapper doesn't name get a raw prop (`tc-open-change` → `onTcOpenChange`) or, where neither exists, a
  listener on a ref.
- **Next.js (App Router):** the wrappers run on the client. Put the component in a `"use client"` file and load it with
  `dynamic(() => import("./demo"), { ssr: false, loading: … })`, with a placeholder the size of the component
  (`examples/next`).

## Vue and Nuxt

Tell the template compiler that `tc-` tags are custom elements, not Vue components:

```ts
// vite.config.ts
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("tc-") } } });
```

Bind properties with `:options="…"` and listen with `@tc-value-change="…"`. `v-model` doesn't apply – it listens for
`input` and reads `value` – so bind the value and take it back from the event.

For typed templates, add `import type {} from "trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks each tag's
props and events.

**Nuxt:** set the same option as `vue.compilerOptions.isCustomElement` in `nuxt.config.ts`, register the elements in a
client-only plugin (`plugins/trenchcoat.client.ts` with `import "trenchcoat"`), and wrap the tags in `<ClientOnly>`
(`examples/nuxt`).

## Angular

Add `CUSTOM_ELEMENTS_SCHEMA` to every component that uses a tag, and import the module for its side effect:

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import "trenchcoat/combobox";

@Component({
  selector: "app-assignees",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<tc-combobox [options]="people" [value]="who()" (tc-value-change)="onWho($event)"></tc-combobox>`,
})
export class Assignees { /* … */ }
```

The schema turns template type-checking off for those tags, so type the class side: inputs as
`TcCombobox["options"]` and handlers as `CustomEvent<…>`. `[(value)]` needs a `valueChange` output, which a custom
element doesn't have – bind `[value]` and update it from `(tc-value-change)`. With Angular SSR, import the module in
the browser only (`afterNextRender` or `isPlatformBrowser`); `examples/angular` renders on the client.

## Svelte

Import the module in the script and use the tag. Svelte sets a property when the element has one, so `{options}`
passes the list itself. Event names with dashes are listened to on the element, in an effect:

```svelte
<script lang="ts">
  import "trenchcoat/combobox";
  import type { TcCombobox } from "trenchcoat/combobox";
  let el: TcCombobox;
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-combobox bind:this={el} {options}></tc-combobox>
```

For typed markup, add `import type {} from "trenchcoat/svelte";` to a `.d.ts` file. In SvelteKit, import the modules
in `onMount` or behind `browser`.

## Plain HTML

Import the module and use the tag; set data from script and listen with `addEventListener`. With TypeScript or
`// @ts-check`, `document.querySelector("tc-combobox")` is typed as `TcCombobox`.

## What's checked

| Framework | `npm run check:snippets` | Gap |
|---|---|---|
| React / Next.js | `tsc` with `examples/react`'s React types | Next.js's `dynamic` set-up is shown, not compiled per page |
| Vue / Nuxt | `vue-tsc` with `trenchcoat/vue`: props and events in templates | Nuxt's plugin set-up is shown, not compiled per page |
| Angular | `ngc` with strict templates | CUSTOM_ELEMENTS_SCHEMA leaves the `tc-` bindings unchecked |
| Svelte | the Svelte compiler, and `tsc` on each script with Svelte's types | no `svelte-check` in the app, so the markup's bindings aren't type-checked |
| HTML | each module script parsed | plain JS: syntax only |

The one-line binding examples in the tables (`:options="…"`) are fragments and aren't compiled; the quick starts and
controlled examples are.
