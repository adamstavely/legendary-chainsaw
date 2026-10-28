# Examples

Small apps that install the packed Trenchcoat package (`npm pack`) and use the elements – one per framework the
package supports (decision J). Each renders the same page (`shared contract` below) and `node scripts/examples.mjs`
builds, serves and checks every one in Chromium.

| App | Framework | How it uses the elements |
|---|---|---|
| `react/` | React 19 + Vite | `trenchcoat/react` wrappers, controlled `value` |
| `next/` | Next.js (App Router) | the React wrappers in a client component, loaded client-only (decision L10) |
| `vue/` | Vue 3 + Vite | the elements directly; `:value` + `@tc-value-change` |
| `nuxt/` | Nuxt | the elements directly inside `<ClientOnly>` |
| `angular/` | Angular 21 (22 needs Node 24.15+) | `trenchcoat/angular` directives, no schema; `[value]` + `(tc-value-change)`, and `[(ngModel)]` through `trenchcoat/angular/forms` |
| `svelte/` | Svelte 5 + Vite | the elements directly |
| `html/` | no framework (Vite) | the elements and plain DOM events |

Shared contract – what `scripts/examples.mjs` checks on each page:
- `#save` (tc-button "Save") counts clicks in `#clicks`;
- `#who` (tc-combobox, `name="who"`, required, named by `<label for="who">`) is controlled: the app holds the value,
  shown in `#value` as JSON;
- the form `#f` submits through a `type="submit"` tc-button; the app shows `FormData.getAll("who")` in `#submitted`;
- `#table` (tc-data-table "Accounts") draws its ARR column with `renderCell` ("€1200");
- `#clean` sits in `<tc-look-provider look="clean">`.
