<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

# Browser support

Trenchcoat targets current evergreen browsers. Each component page has a **Browser support** table with the first
Chrome / Edge, Firefox and Safari (macOS and iOS) versions where that component renders and works fully, the platform
features that set those versions, and the features it uses only where they exist.

## The library-wide floor

| Browser | Works fully from | Set by | At that version |
| --- | --- | --- | --- |
| Chrome | **123** | light-dark() | 483 components |
| Edge | **123** | light-dark() | 483 components |
| Firefox | **121** | :has() | 105 components |
| Safari (macOS) | **17.5** | light-dark() | 483 components |
| Safari (iOS, iPadOS) | **17.5** | light-dark() | 483 components |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 (Playwright 1.64.0).*

### Every feature in use

| Feature | Chrome / Edge | Firefox | Safari | iOS | Components | Kind |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | 483 | Needed |
| color-mix() | 111 | 113 | 16.2 | 16.2 | 483 | Needed |
| :is() and :where() | 88 | 78 | 14 | 14 | 483 | Needed |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | 482 | Needed |
| Container size queries | 105 | 110 | 16 | 16 | 351 | Needed |
| inset | 87 | 66 | 14.1 | 14.1 | 225 | Needed |
| ResizeObserver | 64 | 69 | 13.1 | 13.4 | 197 | Needed |
| IntersectionObserver | 51 | 55 | 12.1 | 12.2 | 170 | Needed |
| inert | 102 | 112 | 15.5 | 15.5 | 169 | Needed |
| :has() | 105 | 121 | 15.4 | 15.4 | 105 | Needed |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | 73 | Needed |
| aspect-ratio | 88 | 89 | 15 | 15 | 71 | Needed |
| CSS masks | 1 | 53 | 4 | 3.2 | 61 | Needed |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | 54 | Needed |
| Async Clipboard (writeText) | 66 | 63 | 13.1 | 13.4 | 53 | Needed |
| Form association (ElementInternals) | 77 | 98 | 16.4 | 16.4 | 36 | Needed |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | 22 | Needed |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | 17 | Needed |
| Intl.RelativeTimeFormat | 71 | 65 | 14 | 14 | 16 | Needed |
| <dialog> and showModal() | 37 | 98 | 15.4 | 15.4 | 14 | Needed |
| structuredClone() | 98 | 94 | 15.4 | 15.4 | 11 | Needed |
| conic-gradient() | 69 | 83 | 12.1 | 12.1 | 6 | Needed |
| ARIA reflection (element.ariaBusy…) | 81 | 119 | 12.1 | 12.1 | 2 | Needed |
| forced-colors media query | 89 | 89 | 16 | 16 | 483 | Progressive – In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| adoptedStyleSheets | 73 | 101 | 16.4 | 16.4 | 482 | Progressive – Each element type's CSS goes into one <style> element in <head> instead – it looks and works the same. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | 128 | Progressive – Scrollbars keep the browser's default width. |
| overscroll-behavior: contain | 63 | 59 | 16 | 16 | 86 | Progressive – Scrolling past the end of a list carries on scrolling the page. |
| Popover API | 114 | 125 | 17 | 18.3 | 39 | Progressive – Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| @property | 85 | 128 | 16.4 | 16.4 | 28 | Progressive – The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| field-sizing | 123 | 152 | 26.2 | 26.2 | 24 | Progressive – Text fields grow with their text. Without it they keep their minimum height and scroll. |
| text-wrap: pretty | 117 | No | 26 | 26 | 17 | Progressive – Paragraphs may end on a single short word. |
| scrollbar-color | 121 | 64 | 26.2 | 26.2 | 10 | Progressive – Scrollbars keep the browser's default colours. |
| backdrop-filter | 76 | 103 | 18 | 18 | 10 | Progressive – What's behind a translucent surface isn't blurred; the surface keeps its fill. |
| text-wrap: balance | 114 | 121 | 17.5 | 17.5 | 7 | Progressive – Titles break where the line fills up instead of into even lines. |
| scrollbar-gutter | 94 | 97 | 18.2 | 18.2 | 3 | Progressive – Content can shift sideways when a scrollbar appears. |

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
