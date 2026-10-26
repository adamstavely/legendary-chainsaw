# Icon Composer

A Vue 3 editor packaged as a native `<icon-composer>` web component. Runs in an open Shadow DOM: internal styles stay inside the element; your design tokens inherit into it. The host app can be Vue or any other framework.

Includes Lucide search, layers, transforms, transparent clear-space/cutout masks, previews, undo/redo, JSON import/export, SVG, PNG and Vue SFC exports.

## Develop and build

```sh
npm install
npm run dev
npm test
npm run build
```

The build produces the standalone demo in `dist/` and a self-contained ES module in `dist/elements/icon-composer.js`. Vue is bundled in the module. The optional theme and TypeScript declarations are copied alongside it. Nothing is registered automatically on import.

## Embed

Copy `dist/elements/` into your app's assets, then register once:

```html
<!-- Optional reference theme. Omit if your design system supplies all tokens. -->
<link rel="stylesheet" href="/assets/icon-composer/theme.css">
<script type="module">
  import { registerIconComposer } from '/assets/icon-composer/icon-composer.js';
  registerIconComposer();
</script>
<icon-composer></icon-composer>
```

No document resets, external fonts, framework dependencies, storage access or automatic file downloads are imposed by the component. The standalone demo opts into storage, downloads, and promotional chrome. Keyboard shortcuts apply only inside the focused editor; host input fields and other instances are unaffected. Container queries adapt to the element's width rather than the page viewport.

### Vue integration

Tell your Vue compiler to treat the tag as a custom element:

```ts
// vite.config.ts
vue({ template: { compilerOptions: {
  isCustomElement: tag => tag === 'icon-composer'
} } })
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { registerIconComposer, type Composition, type IconExport } from '/assets/icon-composer/icon-composer.js';
registerIconComposer();
const composition = ref<Composition>();
function changed(event: CustomEvent<[Composition]>) {
  composition.value = event.detail[0];
}
function exported(event: CustomEvent<[IconExport]>) {
  const { blob, filename, format, content } = event.detail[0];
  // Save to your design system's asset library.
}
</script>

<template>
  <icon-composer
    :composition.prop="composition"
    @composition-change="changed"
    @icon-export="exported"
  />
</template>
```

`composition` is a property, not JSON in an HTML attribute. Input is validated and cloned; host objects are never mutated. External replacements reset undo history. Feeding a `composition-change` value back into the property is safe. Invalid input emits `composer-error` and preserves current state.

### Properties and attributes

- `composition`: editable document `{ version: 1, name, stroke, layers }`; assign as a JS property.
- `storage-key`: optional unique localStorage key. No persistence by default. Use distinct keys for independent editors. The demo retains its original key to preserve existing work.
- `downloads`: boolean, default false. Exports always emit an event; enable this attribute for automatic file downloads too. In JS assign `element.downloads = false` to disable.
- `chrome`: boolean, default false. Shows the standalone introduction and footer.

Vue custom elements wrap event arguments in arrays: `event.detail[0]` is the payload. Listen directly on the element:

- `composition-change`: validated document snapshot.
- `icon-export`: `{ format, filename, blob, content? }`; PNG uses a Blob only. PNG uses the host's `--ic-icon-color` (or inherited text color).
- `composer-error`: `{ message }` for invalid composition and PNG failures.

### Theme contract

`src/style.css` contains structural layout rules and token references, with no literal palette, font, spacing, radius or shadow values. `src/theme.css` is the complete, optional reference token map. It targets only `icon-composer` and `.icon-composer-theme`; it does not style the document. Use the theme as a starting point, then map tokens to your existing system:

```css
icon-composer {
  --ic-font-family: var(--ds-font-body);
  --ic-heading-font-family: var(--ds-font-heading);
  --ic-text: var(--ds-text-primary);
  --ic-muted: var(--ds-text-secondary);
  --ic-background: var(--ds-background);
  --ic-surface: var(--ds-surface);
  --ic-surface-subtle: var(--ds-surface-subtle);
  --ic-border: var(--ds-border);
  --ic-accent: var(--ds-action-primary);
  --ic-accent-hover: var(--ds-action-primary-hover);
  --ic-accent-subtle: var(--ds-selection-background);
  --ic-on-accent: var(--ds-text-on-action);
  --ic-icon-color: var(--ds-text-primary);
  --ic-canvas-background: var(--ds-surface);
  --ic-artboard-background: transparent;
  --ic-grid-color: var(--ds-border);
  --ic-radius-md: var(--ds-radius-control);
  --ic-space-2: var(--ds-space-2);
  --ic-control-height: var(--ds-control-height);
}
```

All visual values are replaceable, including typography, spacing, dimensions, borders, focus, opacity, layering and shadows. Start from the reference theme or supply every token it lists. Structural rules (flex/grid, percentages, zero resets, SVG geometry, thumbnail sizes and container-query thresholds) remain implementation details. CSS variables cannot be used as container-query thresholds; the layout switches at 64rem and 36rem.

For custom tag names, add the `icon-composer-theme` class when using the reference theme. For overrides beyond tokens, exposed CSS parts are `root`, `header`, `button`, `open-button`, `export-button`, `export-menu`, `intro`, `workspace`, `library`, `stage`, `canvas`, `artboard`, `composition`, `previews`, `name-field`, `inspector`, `layer`, `footer`, and `toast`:

```css
icon-composer::part(workspace) { border: 0; }
icon-composer::part(header) { padding-inline: var(--ds-space-4); }
```

Native slots let the host supply its own `brand` and additional `toolbar` controls, including your existing web components. Slotted content keeps the host's own styles.

```html
<icon-composer>
  <span slot="brand">Our icon library</span>
  <ds-button slot="toolbar">Save to library</ds-button>
</icon-composer>
```

## Integration verification

After `npm run build`, open `/tests/embedding.html` on the dev server. This fixture loads the built ES module and mounts two independently themed editors alongside deliberately conflicting host CSS. Its controls exercise composition properties, controlled feedback and invalid inputs; output fields show change, export and error payloads.

## Author icons

The Toolbox opens on **Create from scratch**, with path drawing, shapes, and text. Clicking **Create from scratch** starts a blank composition; Undo restores your previous work. **Browse icons** switches to the catalog and its Icons/Modifiers filters without clearing your work. **New icon** starts a blank composition.

The canvas supports 25–400% view zoom using +/−, Alt + wheel, and Fit to reset zoom and pan. Alt-drag or middle-drag pans the view. Zoom/pan are view-only and do not affect exports. The canvas toolbar’s Background control sets a separate preview color for light and dark modes. It changes both the artboard and surrounding canvas, supports exact hex entry and Reset to theme, and never adds an export background. If storage-key is supplied, these view preferences persist separately from the composition. Small-size previews sit at the bottom of the center pane.

The inspector has **Edit**, **Style**, and **Transform** tabs. Modifiers, Create, layers, and inspector tabs grow to fit their content without internal scrolling. Both catalogs use pagination with 24, 48, or 96 icons per page, selected with Icons per page. Their grids keep a fixed height and scroll internally without visible scrollbar tracks; increasing density does not extend the page. Modifiers include 104 curated symbols across seven categories.

- Text supports up to 12 Latin letters (including bundled Latin-1 accented glyphs), digits, and punctuation. Choose Roboto or Roboto Mono, regular or bold, size, alignment, and letter spacing. Text remains editable in JSON and becomes vector paths in SVG/PNG/Vue exports; no external fonts are required.
- Shapes include rectangles (with corner radius), ellipses, triangles, diamonds, and lines. Width and height support decimal values from 0.1 to 48 canvas units, plus layer scale; the canvas/export viewBox remains 24 × 24.
- Paths are drawn by clicking points on the canvas. Finish open or closed, then edit anchors numerically or by dragging. Each segment can be straight or quadratic curved with an editable control point. The canvas toolbar’s **Snap to grid** switch aligns dragged layers and path points to half-unit steps; turn it off for free positioning. Library icons can be converted with **Edit → Geometry → Edit icon paths**. Choose a subpath and anchor, drag anchors or curve handles, edit their exact coordinates, add points without changing the curve, remove points/subpaths, or straighten segments. Undo restores the original geometry. Path boolean operations and arbitrary external SVG uploads are not included.
- Fill and outline each have a **Shared / This layer** switch. Shared edits update linked layers, including opacity; This layer freezes the current color and opacity as an independent override. The optional document `palette` stores shared fill/outline colors and opacities. Existing explicit layer colors remain independent.

Artwork fill/outline colors support six-digit hex values or theme inheritance (`currentColor`), each with its own 0–100% opacity slider and exact percentage. Opacity is preserved in SVG, Vue, PNG, and JSON; compositing masks remain solid to keep cutouts predictable. The Stroke width section has a Shared / This layer switch and one slider with an exact numeric input. Shared edits linked layers; This layer sets an independent override. Match all layers removes every custom override. These are document values, separate from the UI theme tokens.

Existing icon-only version-1 JSON documents still load. New layers use optional `kind: 'text' | 'shape' | 'path'`; `src/types.ts` documents their properties. Import validation rejects unsupported glyphs and invalid geometry. Bundled font outlines are generated by `node scripts/generate-fonts.mjs`; font licenses are included in THIRD_PARTY_NOTICES.md.

## Erase and restore parts of a layer

Select a layer and open **Edit → Erase / restore**. Choose Erase or Restore and Brush or Rectangle. Drag on the canvas, or enter a rectangle’s exact X/Y/width/height in layer coordinates and apply it. Brush size is in canvas units; masks attach to the layer through scaling, rotation, and flips. Restore reveals original artwork only; it does not draw new content. **Reset erasing** clears that layer’s eraser edits. Each gesture is one undo step. Hold Alt or use middle-drag to pan while working; Escape returns to Move.

Eraser edits are stored as ordered per-layer `erasures`; converted icons store editable `paths` on `kind: 'vector'` layers. SVG masks preserve erasing in SVG/Vue/PNG exports. Compositing masks use the erased shape too, so removed geometry does not cut out unrelated lower layers. Existing documents remain compatible.

## Export details

Exports use a 24 × 24 viewBox. Artwork outside it is clipped in exported files. SVGs preserve vector groups and masks rather than boolean-flattening paths. PNG exports are 512 × 512 with transparency. Black/white in SVG masks are compositing instructions, not UI theme colors.

Generated Vue components require Vue 3.5+ (`useId`) and accept `size`, `color`, `strokeWidth`, and `title`. Each instance has unique mask IDs. Provide `title` for a meaningful icon; otherwise the icon is hidden from assistive technology.

Lucide icons use the ISC license; see THIRD_PARTY_NOTICES.md. No backend, login, or deployment is required.

## Accessibility

The editor targets WCAG 2.2 AA with keyboard alternatives for canvas editing, visible focus, named controls, reference-theme contrast checks, and responsive reflow. See [ACCESSIBILITY.md](ACCESSIBILITY.md) for tested coverage, repeatable axe checks, and remaining assistive-technology and host-theme validation. A passing automated scan alone is not a full conformance claim.
