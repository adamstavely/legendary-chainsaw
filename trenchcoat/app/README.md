# Trenchcoat

The overview app for the Trenchcoat UI kit: it renders every Component, Block, Screen, Illustration and Motion file with live demo data.

Run it from the repo root with `npm run dev` (http://localhost:5199).

- `#/` is the overview: what each library is, and the difference between the Standard and Clean component styles.
- The header's Light / Dark / System switch sets `data-tc-theme` on every preview stage – the theme mechanism
  `tokens/tokens.css` documents (System follows the OS). The gallery chrome itself stays light.
- `#/library/<components|blocks|screens|illustrations|motion>` is a library's overview: a tile per item with a thumbnail, its name and
  one line, components grouped by category; `#/library/components/<category>` shows one category. Search shows the same tiles.
  `#/<id>` opens a single item full width with its live demo. "Replay" remounts it to restart its animations.
- The thumbnails are WebP files in `src/thumbs/<library>/<slug>.<light|dark>.webp`, captured from each demo by
  `npm run capture:thumbs` (all), `npm run capture:thumbs -- <id>…` or `-- --missing` (a new item). `tests/thumbs.test.tsx`
  fails when an item has none; until then its tile shows its initials. Keep them small – the standalone file inlines them.
- The libraries are read from the repo's `components/`, `blocks/`, `screens/`, `illustrations/` and `motion/` folders; each folder's `README.md` provides names and descriptions.
- Each item has a demo in `src/demos/` (components) or `src/demos/<library>/`. A component demo receives the Standard or Clean module as `ui`, so one demo covers both styles. Files listed in a README without a demo show a placeholder.
