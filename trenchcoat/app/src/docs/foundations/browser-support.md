# Browser support

Trenchcoat targets current evergreen browsers. Each component page has a **Browser support** table with the first
Chrome / Edge, Firefox and Safari (macOS and iOS) versions where that component renders and works fully, the platform
features that set those versions, and the features it uses only where they exist.

## The library-wide floor

<!-- floor -->

The table above is generated: it's the highest floor of any component, with the features that set it. Every
component reads the token dictionary, whose colours are `light-dark()` pairs, so `light-dark()` sets the floor for all
of them in Chrome, Edge and Safari. In Firefox, `:has()` (Firefox 121) sets it for the components that use it; the rest
work from Firefox 120.

These versions date from late 2023 to mid 2024 (Firefox 121 December 2023, Chrome and Edge 123 March 2024, Safari 17.5
May 2024). Older browsers get colourless components: there's no fallback for `light-dark()`, by choice – a second set
of colour tokens for old browsers would double the theme work and the contrast checks.

## How it's worked out

`scripts/browser-support.mjs` reads the code that reaches each element – its own module, the elements it renders, and
the parts of the shared `internal/*` modules it uses – plus `tokens.css`, and looks for the platform features listed
in `scripts/browser-features.json`: `light-dark()`, container queries and their units, `:has()`, `color-mix()`, form
association through `ElementInternals`, `adoptedStyleSheets`, `field-sizing`, `inert`, `<dialog>`, the Popover API,
`@property`, masks and the rest. Each feature has its first supporting versions from MDN's
[browser-compat-data](https://github.com/mdn/browser-compat-data), with the key it came from; `node
scripts/browser-support.mjs --bcd` compares the table with the current data.

- A component's floor in each browser is the newest version among the features it **needs**.
- **Progressive** features have a fallback and don't raise the floor. The page says what changes without them – for
  example, without `field-sizing` a text field keeps its minimum height and scrolls instead of growing; without
  `adoptedStyleSheets` the CSS goes into a `<style>` element and nothing visible changes.
- Where a component also has the prefixed form (`-webkit-mask`, `-webkit-backdrop-filter`), the prefixed versions
  count.
- Features the table watches but no component uses yet – container style queries, `@starting-style`, CSS nesting and
  `content-visibility` – appear on a page as soon as one does.

`gen-docs` writes the result into each page's data, and `check:docs` fails when it's out of date. A test
(`tests/browser-features.test.ts`) checks that every feature in the table is found in at least one component, or is
marked as watched and found in none.

## What's tested

The element tests and the axe checks run in **Chromium, Firefox and WebKit** through Playwright – the engines of Chrome
and Edge, Firefox, and Safari. Those are current releases; the floor versions themselves aren't run. Safari on iOS
shares WebKit with Safari on macOS but isn't tested on a device.
