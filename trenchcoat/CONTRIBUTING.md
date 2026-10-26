# Contributing

Each component has one source, `src/components/<slug>.tsx`. `node scripts/build-lib.mjs <slug>` generates the two
published files, `components/<slug>.tsx` (Standard) and `components/<slug>-clean.tsx` (Clean). Never edit the
generated files; `npm run ci` fails if they're out of date. Shared helpers live in `src/internal/` and are inlined
by the build, so every published file stays self-contained (React only).

## The component contract

Every component follows these rules. `tests/contract.test.tsx` checks the first four for every component, using the
spec in `tests/contract/<slug>.contract.tsx` (one per source file, required).

1. **Look.** `export type Look`, `const DEFAULT_LOOK`, `const ROOT_CLASS`; the root renders
   `data-look={look ?? DEFAULT_LOOK}`. Portalled elements get `data-look` and `${ROOT_CLASS}__portal`.
2. **DOM integration.** Props are typed `Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps` (or the
   right element). `className` is merged onto the root, other DOM props are spread onto it (before the component's
   own class and `data-look`, so they can't replace them), and the React 19 `ref` prop is attached to the root –
   unless the component exposes a documented imperative handle.
3. **Controlled or uncontrolled – one rule.** State a parent may own uses `useControllable(value, defaultValue,
   onChange, "name")`: controlled when the value prop is defined, otherwise kept from `defaultX`; changes are always
   reported. Whether a callback is passed never decides control. Names follow `x` / `defaultX` / `onXChange`.
4. **Values in, not copied.** A prop is never copied into state once and then ignored.
5. **Async callbacks** for work (send, run, approve, upload …) may return a promise. Show pending; on rejection,
   clear pending and show an error the user can recover from; pass an `AbortSignal` to long operations; never set
   state after unmount.
6. **Pure render.** No clock, `navigator` or layout reads and no ref writes during render (the "latest callback in a
   ref" pattern is fine). Start from a stable value and fill in after mount, so server and client render the same.
   `node scripts/check-ratchet.mjs` counts these and must not get worse.
7. **Inputs** take `name` (with a hidden input holding the serialised value), `disabled` and `required` where
   meaningful. Enter handlers ignore `event.nativeEvent.isComposing`.
8. **Global shortcuts** are opt-out with `hotkey` (`false` turns it off, a string changes it), never
   `preventDefault` when off, and register one listener per shortcut however many instances there are.
9. **Ids** come from `useId`, never from user data.
10. **Time** props (`now`, `start`, `end` …) are epoch ms, with an internal clock when `now` isn't passed.
11. **Tokens.** Styles use `var(--tc-…)` from `tokens/tokens.css` only; the build adds the per-look fallbacks.
    `node scripts/check-tokens.mjs` enforces it. Pick the most specific token: a **pattern token** when the element
    is one of the patterns below, else a semantic token, never a colour primitive. No literal durations, easings,
    z-index ≥ 7, font weights, line heights, radii or blurred shadows, and no colour rules scoped to `.dark` /
    `[data-theme="dark"]` – write `light-dark()` in the light rule instead (see Guard rails).

Renaming a prop: keep the old name as a `@deprecated` alias for one release and add it to `CHANGELOG.md`.

## Tokens: which one to use

Values per look and the reasons behind them: `audit/design-tokens/proposal.md` §6–7. Contrast of every pair:
`audit/design-tokens/contrast.md`.

**Colour and contrast rules**

- Text: `--tc-text-primary` body, `-secondary` supporting, `-muted` metadata (timestamps, counts, hints – ≥ 4.5:1 on
  every surface, tray and well), `-strong` emphasis, `-placeholder` placeholders only. `--tc-text-disabled` is for
  disabled controls and decoration – never meaningful text. Icons that carry meaning: `--tc-icon-muted` (≥ 3:1).
- Surfaces: `--tc-surface-raised` cards, `-overlay` menus/popovers, `-sunken` wells, `-tray` / `-on-tray` the tray and
  the card on it, `-control` inputs and secondary buttons, `-inverse` (+`-hover`/`-active`) ink: primary buttons,
  inverted pills, tooltips. `--tc-zinc-800` (#2a2a2e) is a border colour, never a surface.
- Edges: `--tc-border-subtle/default/strong` and Clean hairlines are decorative. A control whose edge is its only cue
  (field, checkbox, radio, switch off-track) uses `--tc-border-control` (≥ 3:1). Selected = `--tc-fill-selected`
  plus `--tc-border-selected` or a mark (✓, accent text) – never a fill alone.
- State vs action: `--tc-accent` marks state (on, selected, progress, checks); the primary action is ink
  (`--tc-action-primary-*`). Status pills: `--tc-status-*-{fg,bg}`; categories: `--tc-tone-{violet,pink,amber,rose}-*`.
- Focus: `outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset)` (2 px Standard, 1 px Clean).
  Never `outline: none` without a replacement; fields use `--tc-field-shadow-focus` on the wrapper.

**Scales**

| Need | Token |
|---|---|
| Duration | `--tc-duration-{instant 90, quick 120, fast 150, base 200, moderate 260, slow 320, slower 420, slowest 560, reveal 700, reveal-slow 900}` – snap to the nearest step; loops ≥ 1 s: `--tc-duration-shimmer` or a component token |
| Easing | colour/opacity fades `--tc-ease-standard`; movement `--tc-ease-move` (Standard out, Clean emphasized); the keyword `ease-out` → `--tc-ease-decelerate`; `linear` is fine for loops |
| Layers | `--tc-z-{sticky, dropdown, drawer-scrim, drawer, modal-scrim, modal, toast, drag}`; 0–6 inside an `isolation: isolate` root |
| Type | `--tc-font-size-*` (15 px = `lg-plus`, 28 px = `4xl`) with its line height: 10–12 → `--tc-line-height-tight`, 12.5 → `snug`, 13–14 → `normal`, 15 → `relaxed` (Std) / `loose` (Clean), 16 → `loose`, 20 → `display-sm`, 24–28 → `display` |
| Weight | `--tc-font-weight-{regular, medium, semibold}`; emphasis that differs per look: `--tc-font-weight-strong` (600 / 500) |
| Radius | `--tc-radius-*` (`2xs` = 2 px for bars, ticks, cells); nested radii `calc(outer - inset)`; badges `--tc-radius-badge` |
| Lines | `--tc-hairline` (1 / 0.5 px) for dividers and rings; `--tc-focus-ring-width` for outlines |
| Elevation | `--tc-shadow-control / -raised / -raised-hover / -overlay / -sunken` – no hand-built copies |

**Pattern tokens** – the recipe for each pattern; use the whole set, not a mix:

| Building… | Use |
|---|---|
| Primary button | `height: var(--tc-control-h-md)`, `border-radius: var(--tc-control-radius-md)`, `padding: 0 var(--tc-control-px-md)`, `font: var(--tc-control-font-weight) var(--tc-control-font-size)/…`, `background: var(--tc-action-primary-bg)` (`-hover`, `-active`), `color: var(--tc-action-primary-fg)`, `box-shadow: var(--tc-action-primary-shadow)` – flat ink in both looks, no gradient |
| Secondary / ghost button | same geometry; `--tc-action-secondary-{bg,fg,shadow,shadow-hover}` / `--tc-action-ghost-{fg,bg-hover}`. Icon-only buttons are square at `--tc-control-h-*` |
| Text field, select, search | `--tc-field-{h,radius,px,font-size,bg}`, `box-shadow: var(--tc-field-shadow)` (`-hover`, `-focus` on `:focus-within`, `-invalid`). Search inside a menu or toolbar may use `--tc-field-bg-sunken` with the same shadow |
| Menu, listbox, popover | surface `--tc-menu-{bg,radius,padding,shadow}`, rows `--tc-menu-item-{h,radius,px,font-size}`, hover `--tc-menu-item-hover`, selected `--tc-menu-item-selected-fg` + ✓; z-index `--tc-z-dropdown` |
| Status pill, badge, count, tag | `--tc-pill-{h,px,radius,font-size,font-weight}` (`-lg` for header/live pills); colours `--tc-status-*` or `--tc-tone-*` only; inverted pill: `--tc-surface-inverse` + `--tc-text-on-inverse` |
| Key chip | `--tc-kbd-{h,px,radius,font-size,font-weight,fg,bg,shadow}`; inside a primary button `--tc-kbd-on-inverse-bg` |
| Switch | `--tc-switch-{w,h,knob,radius}`, track `--tc-switch-on` / `--tc-switch-off`, knob `--tc-switch-knob-bg` |
| Segmented control, tabs | track `--tc-seg-{track-bg,track-radius,pad}`, thumb `--tc-seg-{thumb-bg,thumb-shadow}`; the selected label is `--tc-text-primary` (+ `--tc-font-weight-strong` in Standard) |
| Card | `--tc-card-{radius,shadow,shadow-hover}` on `--tc-surface-raised` |
| Tray | `padding: var(--tc-tray-inset)`, `border-radius: var(--tc-tray-radius)`, `background: var(--tc-surface-tray)`; the card inside uses `--tc-card-radius` on `--tc-surface-on-tray` |
| Well | `--tc-surface-sunken` + `box-shadow: var(--tc-shadow-sunken)` |
| Section caption / eyebrow | `--tc-caption-*` for group labels, `--tc-eyebrow-*` for the kicker above a title (`font-size`, `font-weight`, `line-height`, `letter-spacing: …-tracking`, `text-transform: …-transform`, `color`) |
| Avatar | `--tc-avatar-{sm,md}` and `--tc-avatar-font-{size,weight}`; people are circles, agents/tools `--tc-avatar-radius-agent` |
| Progress / meter | `--tc-meter-{h,h-hero,radius,track,fill}` |
| Tooltip | `--tc-tooltip-{bg,fg,radius,font-size,px,py}`, `--tc-shadow-overlay`, z-index above its trigger's layer |
| Divider | `border-top: var(--tc-hairline) solid var(--tc-divider)` |
| Shimmer | animate `transform: translateX()` on a pseudo-element with `--tc-shimmer` and `--tc-duration-shimmer`, never `background-position`; pause it off-screen |

**Theme.** Never scope colours to `.dark`: every colour is `light-dark(LIGHT, DARK)` – in a token, or in a component
token defined once (`--tc-<comp>-x: light-dark(…)`). Dark is then the same whether it comes from `.dark`,
`[data-tc-theme="dark"]`, `[data-tc-theme="system"]` or the OS. The gallery's Light / Dark / System switch sets
`data-tc-theme` on each stage – check dark there, not only in the screenshots (which also add `.dark`).

## Guard rails

`npm run ci` runs, besides lint, types and tests:

- `node scripts/tokens.mjs --check` – `tokens/fallbacks.json` and the generated fallback section of `tokens.css` are
  current. After editing `tokens/tokens.css`, run `node scripts/tokens.mjs`, then `node scripts/check-tokens.mjs --fix`
  (rewrites the literal fallbacks in blocks/screens/illustrations/motion) and `node scripts/build-lib.mjs`.
- `node scripts/contrast.mjs` – every required token pair meets its minimum in both looks and themes;
  `--write` regenerates `audit/design-tokens/contrast.md`.
- `node scripts/check-ratchet.mjs` – per-file counts that may only go down: literal durations, literal easings,
  z-index ≥ 7, literal font-weight / line-height / border-radius, hand-written blurred box-shadows, and colour rules
  scoped to `.dark` / `[data-theme="dark"]` (definitions in `scripts/css-literals.mjs`), next to the older
  code-quality counts. Existing drift is in `scripts/ratchet-baseline.json`. A new literal fails CI; when you remove
  some, CI also fails until you lock the improvement in with `node scripts/check-ratchet.mjs --update` – commit the
  updated baseline with the fix.

## Before you push

```bash
npm run ci
```

For visual changes, capture and compare screenshots against the last baseline:

```bash
node scripts/visual.mjs capture my-change <filter>
```

```bash
node scripts/visual.mjs compare <baseline> my-change
```
