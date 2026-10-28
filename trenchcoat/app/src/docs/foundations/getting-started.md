# Getting started

Trenchcoat is a library of web components for AI-native products – agent views, chat and answer UIs, charts,
inputs and feedback – built with Lit 3. Every component is a custom element (`<tc-…>`) that works in any framework
or none, ships in two looks, follows the page's light or dark theme, and has a React wrapper with the same API as a
React component.

## Install

The package is private (`trenchcoat`, 0.1.0) and isn't on npm yet. Build and pack it from the repository, then install
the tarball:

```sh
cd trenchcoat
npm run build:package
npm pack
# in your app
npm install ../trenchcoat/trenchcoat-0.1.0.tgz
```

## Load the tokens once

Every component reads its colours, spacing, type and motion from the token dictionary. Load it once, at the root of
the app:

```js
import "trenchcoat/tokens.css";
```

## Use a component

Import the element's module – it registers the tag – and use the tag. Import only the ones you use: each entry
(`trenchcoat/combobox`) pulls in that element and the small shared base, nothing else.

```html
<label for="who">Assignees</label>
<tc-combobox id="who" name="who"></tc-combobox>

<script type="module">
  import "trenchcoat/combobox";
  import "trenchcoat/tokens.css";

  document.querySelector("#who").options = [
    { value: "ana", label: "Ana Lima" },
    { value: "ben", label: "Ben Ito" },
  ];
</script>
```

Strings, numbers and booleans can be attributes; lists, objects and functions are properties, set from script or
with your framework's property binding.

## In your framework

| Framework | How |
|---|---|
| React 19, Next.js | `import { Combobox } from "trenchcoat/react"` – wrappers with React props and callbacks. In Next.js, load them in a client component with `dynamic(() => import(…), { ssr: false })` (no server rendering in this version). |
| Vue 3, Nuxt | Use the tags; tell the compiler that tags starting with `tc-` are custom elements (`compilerOptions.isCustomElement`). Bind with `:options="…"` and listen with `@tc-value-change`. In Nuxt, wrap them in `<ClientOnly>`. Types: `trenchcoat/vue`. |
| Angular | Import the directives from `trenchcoat/angular` into `imports`; bind with `[options]="…"` and `(tc-value-change)="…"`, or `[(ngModel)]` with `trenchcoat/angular/forms`. |
| Svelte 5 | Use the tags; pass properties as attributes (`{options}`) and listen with `addEventListener` in an effect. Types: `trenchcoat/svelte`. |
| Plain HTML | Import the module and use the tag. |

The repository's `examples/` folder has a working app for each, built and tested in CI.

## Next

- [Looks](#/foundations/looks) – Standard and Clean, and how to pick one.
- [Themes](#/foundations/themes) – light, dark and following the system.
- [Patterns](#/foundations/patterns) – values, events, forms and React.
- [Tokens](#/foundations/tokens) – every token, in both looks and both themes.
