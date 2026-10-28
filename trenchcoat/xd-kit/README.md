# Trenchcoat UI kit for Adobe XD

An XD plugin that draws the Trenchcoat components into an XD document: every component, in Standard and Clean, light
and dark, as layered, named groups on artboards (one per category per look and theme). It also adds the colour tokens
(both themes) and the type scale to the document's Assets panel.

The drawings are made from the real components. `extract.mjs` renders each gallery demo in Chromium and reads it back
as rectangles, text, vector paths and images; the plugin rebuilds those layers with XD's API. Change a component and
re-extract, and the kit follows.

## Installing and building the kit

1. Install the **Inter** font, the library's typeface ([rsms.me/inter](https://rsms.me/inter/)); XD substitutes
   another font for any it can't find. Code text uses Menlo by default; the dialog lets you choose other fonts.
2. Double-click `dist/trenchcoat-ui-kit.xdx` to install the plugin.
3. In XD, open a document (a new blank one is best) and choose **Plugins › Trenchcoat UI Kit › Build kit…**.
4. Pick the categories, looks and themes, then **Build**. All four variants of every category means more than 1,000
   drawings with tens of thousands of layers: XD stays busy for a while. One or two categories at a time is quicker.

The artboards go to the right of anything already in the document.

## What you get, and what XD can't do

- **Groups, not components.** XD's plugin API can't create components ("It is not currently possible for plugins to
  create a new component definition"). Each drawing is a group named `<Component> / <Look> · <Theme>` with its parts
  named after the component's own parts (`send`, `option`, `scope`…). To make one an XD component, select it and
  choose **Object › Make Component** (⌘K / Ctrl K). Do that for the ones you use, then publish the document as a
  Creative Cloud Library to share them.
- **Resting state.** Each component is drawn as its gallery demo first shows it. Open menus, hover and focus states
  aren't drawn.
- **One shadow per shape.** XD has one drop shadow per shape: where CSS stacks several, the strongest is kept. Inset
  shadows become inner strokes when they're crisp rings and are left out otherwise. Background blur and filters are
  left out.
- **Text.** One line of text is point text on the browser's baseline; wrapped text is area text as wide as the box it
  wraps in. Tabular figures, hyphenation and OpenType features aren't carried over.
- **Gradients.** Linear gradients are kept; radial and conic ones are left out (the shape keeps its base colour).

## Making the kit

From `trenchcoat/`, `npm run xd-kit` does all three steps below; one at a time:

```bash
node xd-kit/extract.mjs          # every component, about 10 minutes; or name some: node xd-kit/extract.mjs button dialog
node --test xd-kit/test/*.test.mjs       # the plugin's builder against a stand-in for XD
node xd-kit/pack.mjs             # → xd-kit/dist/trenchcoat-ui-kit.xdx
```

`extract.mjs` starts its own Vite server and measures text in Inter (from `@fontsource-variable/inter`), the face the
kit names. To check a component without XD, `node xd-kit/preview.mjs <slug>` draws its extracted layers as SVG files in
`xd-kit/.preview/`.

For plugin development, copy `plugin/` (after extracting) into XD's develop folder (**Plugins › Development › Show
Develop Folder**) and use **Plugins › Development › Reload Plugins** after changes.

| File | What it is |
| --- | --- |
| `page/extract.js` | Runs in the page: DOM → layers (colours to sRGB, SVG to absolute paths, `::before` / `::after` made real) |
| `extract.mjs` | Drives Chromium through every component, look and theme; writes `plugin/kit/` |
| `plugin/builder.js` | Layers → XD nodes, artboard layout, assets; XD's modules passed in |
| `plugin/main.js` | The menu command, its dialog and the progress dialog |
| `test/` | The builder against `mock-xd.cjs`, which follows XD's documented rules |
| `preview.mjs` | Extracted layers → SVG, for checking without XD |
| `pack.mjs` | Icons and the `.xdx` |

The generated `plugin/kit/`, `plugin/images/`, `dist/` and `.preview/` aren't committed.
