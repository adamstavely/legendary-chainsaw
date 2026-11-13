# Standalone gallery

`trenchcoat-gallery.html` is the whole gallery – every component, block, demo and docs page – in one HTML file. Open
it straight from disk (double-click it); it needs no server and loads nothing from the network. Pages are addressed by
hash, e.g. `trenchcoat-gallery.html#/stories`.

It's about 28 MB (7.9 MB gzipped; the overview thumbnails are about 3.7 MB of it) and loads every component up front, so the first open takes a moment. It covers the
main gallery only, not `compare.html`, `measure.html` or `perf.html`.

## Rebuilding it

From `trenchcoat/`:

```bash
npm run build:standalone
```

`scripts/build-standalone.mjs` builds the gallery with Vite as one script and one stylesheet, every lazy chunk and asset
folded in, then inlines both into the page. The new-component integration pass runs it, so each release that adds
components includes a fresh copy, and a merge to `main` mirrors it to
[trenchcoat-docs](https://github.com/adamstavely/trenchcoat-docs).
