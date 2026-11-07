---
pattern: none
status: new
related: header-nav, side-nav, breadcrumbs, app-picker
---

## Overview

The product's logo and name at the start of a full-width app header. With `href` it's a link home that an app's
router can take over; without it, plain text. The name is never cut short, and its line height follows its own size,
so a large name sits whole in the bar.

## When to use

- At the start of a top bar that runs across the whole page, opposite `header-nav`.
- When the logo and name move out of the side navigation and into the header.

## When not to use

- A brand at the top of a side bar – use `side-nav`'s `brand`.
- A trail of places that leads to the current page – use `breadcrumbs`.
- Switching between products – use `app-picker`.

## Anatomy

1. **Brand** `.ui-hb__brand` – the link (or text) holding both parts, with a focus ring on the link
2. **Logo** `.ui-hb__logo` – the `icon`, cloned, in a square box `--tc-hb-logo-size` wide
3. **Name** `.ui-hb__name` – the product's name, at `--tc-hb-name-size`

## Looks

Standard and Clean differ only in their tokens' values: the name's colour, weight and tracking. Size the brand from
the page with `--tc-hb-name-size` (default `--tc-font-size-lg`), `--tc-hb-logo-size` (24px), `--tc-hb-weight`
(semibold) and `--tc-hb-gap` (`--tc-space-2`); `--tc-hb-line-height` (1.1) is relative to the name's size. On a dark
bar, `inverse` draws the brand in the dark theme's colours whatever the page's theme.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the brand when it's a link |
| Enter | Follows the link, or hands it to the app through `tc-navigate` |

## Screen readers

A linked brand is a link named by the product's name; the logo is hidden from screen readers, as the name says the
same. Without `href` the name is plain text.

## Content

- Use the product's name as people say it: “Intellect”, not a tagline.
- Give the logo as an SVG or img element; it's cloned, so the same element can be passed to several brands.

## Do

- Link the brand home and route the click with `tc-navigate` in a single-page app.
- Set `inverse` when the header bar is dark in both themes.

## Don't

- Don't put navigation or actions in the brand – they belong in the header's other parts.
- Don't leave out `name` with only a logo; the link would have no name.

## Example

```html
<tc-header-brand id="brand" name="Intellect" href="/"></tc-header-brand>

<script type="module">
  import "@adamstavely/trenchcoat/header-brand";
  import "@adamstavely/trenchcoat/tokens.css";

  const brand = document.querySelector("#brand");
  brand.icon = document.querySelector("#logo-template").content.firstElementChild;
  brand.addEventListener("tc-navigate", (e) => {
    e.preventDefault();
    history.pushState(null, "", e.detail.href);
  });
</script>
```

```tsx
import { HeaderBrand } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AppBrand({ go }: { go: (href: string) => void }) {
  return (
    <HeaderBrand
      name="Intellect"
      href="/"
      onNavigate={(href, e) => {
        e.preventDefault();
        go(href);
      }}
    />
  );
}
```
