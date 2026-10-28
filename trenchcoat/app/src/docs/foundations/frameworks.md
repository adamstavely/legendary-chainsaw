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

`trenchcoat/angular` has a standalone directive for every element, named after it (`tc-combobox` → `Combobox`). Put
the directives in a component's `imports` – no `CUSTOM_ELEMENTS_SCHEMA` – and strict templates check every binding:

```ts
import { Component, signal } from "@angular/core";
import { Combobox } from "trenchcoat/angular";
import type { ComboboxOption } from "trenchcoat/combobox";

@Component({
  selector: "app-assignees",
  imports: [Combobox],
  template: `<tc-combobox [options]="people" [value]="who()" (tc-value-change)="who.set($event.detail.value)"></tc-combobox>`,
})
export class Assignees {
  people: ComboboxOption[] = [/* … */];
  who = signal<string[]>([]);
}
```

- **Inputs** are the element's properties, typed from it: `[options]` takes `TcCombobox["options"]`, and a misspelt
  input or a wrong type fails the build. Plain attributes work as in HTML – `required`, `value="0.6"` – with one
  difference: on a boolean input the string `"false"` means false (`disabled="false"` leaves the element enabled),
  where in HTML any present attribute means true.
- **Events** are typed: `$event` is the event's `CustomEvent<…>`, so `$event.detail.value` is checked. The element
  dispatches the event itself, and a handler runs once per event.
- **Forms:** an element that holds a `value` takes `[(ngModel)]`, `[formControl]` and `formControlName` through its
  accessor in `trenchcoat/angular/forms` (`ComboboxValueAccessor`, or `TRENCHCOAT_FORMS` for all of them).
  `@angular/forms` is only needed for that entry. A new or reset control (`null`) gives the element its own empty
  value – `[]`, `""`, `false`. A change the page cancels with `preventDefault()` stays out of the form, and
  `control.disable()` disables the element; on the few elements without a disabled state, dev mode warns instead.
- `TRENCHCOAT` is every directive at once, for an `imports` array. `#ref="tcCombobox"` gives the directive, and its
  `element` is the element itself.

The directives are built for Angular 19 and later, in partial compilation mode, and every module loads in Node without
a DOM – so Angular SSR, and webpack- or Karma-based builds, import them as they are (CI checks both). On the server the
element is sent as its tag and attributes; it renders when it upgrades in the browser. If hydration reports a mismatch
inside one, add `ngSkipHydration` to the component that holds it. To leave an element's code out of the server bundle
altogether, put it in a `@defer` block – component `imports` are static, so `isPlatformBrowser` can't keep them off the
server. `examples/angular` renders on the client.

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
| Angular | `ngc` with strict templates against `trenchcoat/angular`: inputs, attributes and `$event` | – |
| Svelte | the Svelte compiler, and `tsc` on each script with Svelte's types | no `svelte-check` in the app, so the markup's bindings aren't type-checked |
| HTML | each module script parsed | plain JS: syntax only |

The one-line binding examples in the tables (`:options="…"`) are fragments and aren't compiled; the quick starts and
controlled examples are.
