# Spot illustrations

Small illustrations for page headers, cards, empty states and docs – 223 of them, in Trenchcoat's soft style: a tile,
one pastel blue mark with a darker edge and ink, and a soft glow beneath. Each is a single self-contained SVG in
`illustrations/spot/<folder>/<name>.svg`, with nothing to install and no stylesheet to load.

## Using one

- **As an image**: `<img src=".../laws/fitts-law.svg" alt="">` follows the system's light or dark setting.
- **Inline**: paste the markup and it follows the page's theme – a `.dark` or `.light` class, `data-theme` or
  `data-tc-theme` on an ancestor, or the page's `color-scheme`. These below are inlined, so they follow this page.
- **From the package**: `import url from "trenchcoat/illustrations/spot/laws/fitts-law.svg"`.
- **In design tools**: every shape carries its light colours as plain attributes too, so Figma and Illustrator show
  the light version.

Add `aria-hidden="true"` when one is decorative, which is most of the time; keep its `<title>` and add `role="img"`
when it says something the words beside it don't. Keep the words beside the picture, not in it.

## All of them

<!-- spots -->
