<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

# Getting started

Trenchcoat is a library of web components for AI-native products – agent views, chat and answer UIs, charts,
inputs and feedback – built with Lit 3. Every component is a custom element (`<tc-…>`) that works in any framework
or none, ships in two looks, follows the page's light or dark theme, and has a React wrapper with the same API as a
React component.

## Install

The package is private and published to GitHub Packages as `@adamstavely/trenchcoat`. Point the `@adamstavely` scope at
GitHub's registry in your app's `.npmrc`, with a token that has `read:packages`, then install an exact version:

```sh
# .npmrc
@adamstavely:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

```sh
npm install --save-exact @adamstavely/trenchcoat@0.4.0
```

To try a local change instead, build and pack it from the repository and install the tarball:

```sh
cd trenchcoat
npm run build:package
npm pack
# in your app
npm install ../trenchcoat/adamstavely-trenchcoat-0.4.0.tgz
```

## Load the tokens once

Every component reads its colours, spacing, type and motion from the token dictionary. Load it once, at the root of
the app:

```js
import "@adamstavely/trenchcoat/tokens.css";
```

The components are set in Inter, which you bring yourself; without it they fall back to the system font.
`--tc-font-sans` matches the names the usual ways of loading it give the face: “Inter Variable” from
`@fontsource-variable/inter`, “Inter” from `@fontsource/inter`, Google Fonts or Inter's own `inter.css`, and
“InterVariable” from `rsms.me/inter`. Loaded under any other name, set `--tc-font-sans` to it.

## Use a component

Import the element's module – it registers the tag – and use the tag. Import only the ones you use: each entry
(`@adamstavely/trenchcoat/combobox`) pulls in that element and the small shared base, nothing else.

```html
<label for="who">Assignees</label>
<tc-combobox id="who" name="who"></tc-combobox>

<script type="module">
  import "@adamstavely/trenchcoat/combobox";
  import "@adamstavely/trenchcoat/tokens.css";

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
| React 19, Next.js | `import { Combobox } from "@adamstavely/trenchcoat/react"` – wrappers with React props and callbacks. In Next.js, load them in a client component with `dynamic(() => import(…), { ssr: false })` (no server rendering in this version). |
| Vue 3, Nuxt | Use the tags; tell the compiler that tags starting with `tc-` are custom elements (`compilerOptions.isCustomElement`). Bind with `:options="…"` and listen with `@tc-value-change`. In Nuxt, wrap them in `<ClientOnly>`. Types: `@adamstavely/trenchcoat/vue`. |
| Angular | Import the directives from `@adamstavely/trenchcoat/angular` into `imports`; bind with `[options]="…"` and `(tc-value-change)="…"`, or `[(ngModel)]` with `@adamstavely/trenchcoat/angular/forms`. |
| Svelte 5 | Use the tags; pass properties as attributes (`{options}`) and listen with `addEventListener` in an effect. Types: `@adamstavely/trenchcoat/svelte`. |
| Plain HTML | Import the module and use the tag. |

The repository's `examples/` folder has a working app for each, built and tested in CI.

## Next

- [Looks](looks.md) – Standard and Clean, and how to pick one.
- [Themes](themes.md) – light, dark and following the system.
- [Patterns](patterns.md) – values, events, forms and React.
- [Tokens](tokens.md) – every token, in both looks and both themes.
