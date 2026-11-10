<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

**Foundations**

# Tokens

Every value the components read. Colours are `light-dark()` pairs, so the browser resolves them where they're used – the site shows each one live in both looks and both themes. Override any of them with a plain rule: `:root { --tc-accent: … }`.

For design tools, the same tokens ship in the Design Tokens Community Group format (DTCG 2025.10), in `@adamstavely/trenchcoat/tokens/dtcg/`:

- `primitives.json` holds the primitives.
- One file per look and theme holds the semantic and pattern tokens, as aliases where the CSS points at another token – a shadow's or border's colour and width included: `standard-light.json`, `standard-dark.json`, `clean-light.json` and `clean-dark.json`. Values built with `color-mix()` or `calc()` have no DTCG form, so they're exported resolved. Style Dictionary reads these files as they are.
- `tokens-studio/` holds the same sets for Tokens Studio, whose DTCG mode doesn't read 2025.10 colour and dimension objects yet: values are strings (`"#2f68ff"`, `"4px"`), types are its own (`boxShadow`, `fontWeights`), a group's own token is `DEFAULT`, and `$themes.json` pairs each mode with the primitives.
- A few tokens have no DTCG type (em letter-spacing, `uppercase`, a padding shorthand, a shadow of `none`). They're listed with their CSS under `$extensions` in each file.
- CI checks every exported token against what a browser computes from `tokens.css`, in each look and theme.

## Primitives

*Raw values – look- and theme-independent. Components don't use the colour primitives directly.*

### General

| Token | Value |
| --- | --- |
| `--tc-gray-0` | `#ffffff` |
| `--tc-gray-25` | `#fafafa` |
| `--tc-gray-50` | `#f5f5f5` |
| `--tc-gray-100` | `#f0f0f0` |
| `--tc-gray-150` | `#ececec` |
| `--tc-gray-200` | `#e5e5e5` |
| `--tc-gray-250` | `#dedede` |
| `--tc-gray-300` | `#d4d4d4` |
| `--tc-gray-400` | `#a3a3a3` |
| `--tc-gray-450` | `#858585` |
| `--tc-gray-500` | `#646464` |
| `--tc-gray-600` | `#525252` |
| `--tc-gray-700` | `#404040` |
| `--tc-gray-800` | `#262626` |
| `--tc-gray-900` | `#171717` |
| `--tc-gray-950` | `#0a0a0a` |
| `--tc-zinc-50` | `#f5f5f5` |
| `--tc-zinc-100` | `#ededed` |
| `--tc-zinc-300` | `#c8c8cc` |
| `--tc-zinc-450` | `#9a9aa1` |
| `--tc-zinc-475` | `#8e8e95` |
| `--tc-zinc-500` | `#7c7c82` |
| `--tc-zinc-600` | `#5c5c63` |
| `--tc-zinc-700` | `#3a3a40` |
| `--tc-zinc-750` | `#34343a` |
| `--tc-zinc-800` | `#2a2a2e` |
| `--tc-zinc-850` | `#232326` |
| `--tc-zinc-875` | `#1c1c1e` |
| `--tc-zinc-900` | `#19191b` |
| `--tc-zinc-925` | `#161618` |
| `--tc-zinc-950` | `#111113` |
| `--tc-blue-50` | `#eaf1ff` |
| `--tc-blue-300` | `#8ab4ff` |
| `--tc-blue-400` | `#6b95ff` |
| `--tc-blue-500` | `#2f68ff` |
| `--tc-blue-600` | `#2456d6` |
| `--tc-blue-950` | `#16243f` |
| `--tc-cobalt-300` | `#70b8ff` |
| `--tc-cobalt-400` | `#5b9aff` |
| `--tc-cobalt-450` | `#1a6cf0` |
| `--tc-cobalt-500` | `#0060e2` |
| `--tc-cobalt-600` | `#0058cf` |
| `--tc-green-50` | `#e6f6ec` |
| `--tc-green-300` | `#3dd68c` |
| `--tc-green-400` | `#3ec27a` |
| `--tc-green-500` | `#1f8a4c` |
| `--tc-green-600` | `#18794e` |
| `--tc-green-950` | `#12301f` |
| `--tc-teal-50` | `#e3f6f4` |
| `--tc-teal-300` | `#4fd1c5` |
| `--tc-teal-400` | `#2bb3a6` |
| `--tc-teal-500` | `#0e8a80` |
| `--tc-teal-600` | `#0b6f67` |
| `--tc-teal-950` | `#0f2e2b` |
| `--tc-amber-50` | `#fff3e0` |
| `--tc-amber-300` | `#ffa057` |
| `--tc-amber-400` | `#f5a524` |
| `--tc-amber-500` | `#c2710c` |
| `--tc-amber-600` | `#a35200` |
| `--tc-amber-950` | `#3a2410` |
| `--tc-red-50` | `#fdecea` |
| `--tc-red-300` | `#ff977d` |
| `--tc-red-400` | `#ff6369` |
| `--tc-red-500` | `#e5484d` |
| `--tc-red-600` | `#c2331f` |
| `--tc-red-950` | `#3b1714` |
| `--tc-rose-50` | `#fff0f3` |
| `--tc-rose-300` | `#fda4af` |
| `--tc-rose-400` | `#fb7185` |
| `--tc-rose-500` | `#e11d48` |
| `--tc-rose-600` | `#be123c` |
| `--tc-rose-950` | `#3f1320` |
| `--tc-violet-50` | `#f0ecf9` |
| `--tc-violet-300` | `#b9a2f5` |
| `--tc-violet-400` | `#a78bfa` |
| `--tc-violet-500` | `#8b5cf6` |
| `--tc-violet-600` | `#6941c6` |
| `--tc-violet-950` | `#261d3f` |
| `--tc-pink-50` | `#fdedf5` |
| `--tc-pink-300` | `#f9a8d4` |
| `--tc-pink-400` | `#f472b6` |
| `--tc-pink-500` | `#ec4899` |
| `--tc-pink-600` | `#be185d` |
| `--tc-pink-950` | `#3a1428` |

### Radius: 2xs for bars, ticks and cells; nested radii are calc

| Token | Value |
| --- | --- |
| `--tc-radius-2xs` | `2px` |
| `--tc-radius-xs` | `4px` |
| `--tc-radius-sm` | `6px` |
| `--tc-radius-md` | `8px` |
| `--tc-radius-lg` | `10px` |
| `--tc-radius-xl` | `12px` |
| `--tc-radius-2xl` | `16px` |
| `--tc-radius-3xl` | `20px` |
| `--tc-radius-full` | `999px` |
| `--tc-space-0-5` | `2px` |
| `--tc-space-1` | `4px` |
| `--tc-space-1-5` | `6px` |
| `--tc-space-2` | `8px` |
| `--tc-space-2-5` | `10px` |
| `--tc-space-3` | `12px` |
| `--tc-space-3-5` | `14px` |
| `--tc-space-4` | `16px` |
| `--tc-space-4-5` | `18px` |
| `--tc-space-5` | `20px` |
| `--tc-space-6` | `24px` |
| `--tc-space-7` | `28px` |
| `--tc-space-8` | `32px` |
| `--tc-space-10` | `40px` |
| `--tc-space-12` | `48px` |
| `--tc-space-14` | `56px` |
| `--tc-space-16` | `64px` |

### Motion: a 10-step ladder

| Token | Value |
| --- | --- |
| `--tc-duration-instant` | `90ms` |
| `--tc-duration-quick` | `120ms` |
| `--tc-duration-fast` | `150ms` |
| `--tc-duration-base` | `200ms` |
| `--tc-duration-moderate` | `260ms` |
| `--tc-duration-slow` | `320ms` |
| `--tc-duration-slower` | `420ms` |
| `--tc-duration-slowest` | `560ms` |
| `--tc-duration-reveal` | `700ms` |
| `--tc-duration-reveal-slow` | `900ms` |
| `--tc-duration-shimmer` | `1600ms` |
| `--tc-ease-standard` | `ease` |
| `--tc-ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--tc-ease-decelerate` | `cubic-bezier(0, 0, 0.58, 1)` |
| `--tc-ease-emphasized` | `cubic-bezier(0.32, 0.72, 0.24, 1)` |
| `--tc-ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--tc-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` |
| `--tc-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--tc-font-sans` | `"Inter Variable", "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| `--tc-font-mono` | `ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace` |
| `--tc-font-size-2xs` | `10px` |
| `--tc-font-size-xs` | `11px` |
| `--tc-font-size-xs-plus` | `11.5px` |
| `--tc-font-size-sm` | `12px` |
| `--tc-font-size-sm-plus` | `12.5px` |
| `--tc-font-size-md` | `13px` |
| `--tc-font-size-md-plus` | `13.5px` |
| `--tc-font-size-lg` | `14px` |
| `--tc-font-size-lg-plus` | `15px` |
| `--tc-font-size-xl` | `16px` |
| `--tc-font-size-2xl` | `20px` |
| `--tc-font-size-3xl` | `24px` |
| `--tc-font-size-4xl` | `28px` |
| `--tc-font-weight-regular` | `400` |
| `--tc-font-weight-medium` | `500` |
| `--tc-font-weight-semibold` | `600` |
| `--tc-line-height-none` | `1` |
| `--tc-line-height-tight` | `16px` |
| `--tc-line-height-snug` | `18px` |
| `--tc-line-height-normal` | `20px` |
| `--tc-line-height-relaxed` | `22px` |
| `--tc-line-height-loose` | `24px` |
| `--tc-line-height-display-sm` | `28px` |
| `--tc-line-height-display` | `32px` |
| `--tc-tracking-tight` | `-0.02em` |
| `--tc-tracking-snug` | `-0.01em` |
| `--tc-tracking-normal` | `0` |
| `--tc-tracking-caps` | `0.05em` |

### Stacking layers. 0

| Token | Value |
| --- | --- |
| `--tc-z-sticky` | `10` |
| `--tc-z-dropdown` | `30` |

### A popover above a dropdown

| Token | Value |
| --- | --- |
| `--tc-z-popover` | `35` |
| `--tc-z-drawer-scrim` | `40` |
| `--tc-z-drawer` | `50` |
| `--tc-z-modal-scrim` | `60` |
| `--tc-z-modal` | `70` |
| `--tc-z-toast` | `80` |
| `--tc-z-drag` | `90` |
| `--tc-focus-halo-width` | `3px` |

## Semantic and pattern tokens

*What components use: text, surfaces, borders, status, and one recipe per UI pattern (controls, menus, cards, trays…). Valued per look; every colour is a light / dark pair.*

### Text

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-text-strong` | `light-dark(var(--tc-gray-900), var(--tc-zinc-50))` | `light-dark(#000000, #ffffff)` |
| `--tc-text-primary` | `light-dark(var(--tc-gray-900), var(--tc-zinc-100))` | `light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9))` |
| `--tc-text-secondary` | `light-dark(var(--tc-gray-700), var(--tc-zinc-300))` | `light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66))` |
| `--tc-text-muted` | `light-dark(var(--tc-gray-500), var(--tc-zinc-450))` | `light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52))` |
| `--tc-text-disabled` | `light-dark(var(--tc-gray-400), var(--tc-zinc-600))` | `light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3))` |
| `--tc-text-placeholder` | `light-dark(var(--tc-gray-500), var(--tc-zinc-475))` | `light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.5))` |
| `--tc-text-on-accent` | `#ffffff` | `#ffffff` |
| `--tc-text-on-inverse` | `light-dark(#ffffff, var(--tc-zinc-950))` | `light-dark(#fcfcfc, #161618)` |

### Icons

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-icon-muted` | `light-dark(var(--tc-gray-450), var(--tc-zinc-500))` | `light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46))` |

### Surfaces

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-surface-base` | `light-dark(var(--tc-gray-0), var(--tc-zinc-950))` | `light-dark(#ffffff, #141416)` |
| `--tc-surface-raised` | `light-dark(var(--tc-gray-0), var(--tc-zinc-900))` | `light-dark(#ffffff, var(--tc-zinc-875))` |
| `--tc-surface-overlay` | `light-dark(var(--tc-gray-0), var(--tc-zinc-850))` | `light-dark(#ffffff, #252527)` |
| `--tc-surface-sunken` | `light-dark(var(--tc-gray-100), var(--tc-zinc-950))` | `light-dark(#f7f7f7, var(--tc-zinc-925))` |

### A tray that cards sit on

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-surface-tray` | `light-dark(var(--tc-gray-100), var(--tc-zinc-900))` | `light-dark(#f7f7f7, var(--tc-zinc-925))` |
| `--tc-surface-on-tray` | `light-dark(#ffffff, var(--tc-zinc-850))` | `light-dark(#ffffff, var(--tc-zinc-875))` |

### Inputs and secondary buttons

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-surface-control` | `light-dark(#ffffff, var(--tc-zinc-850))` | `light-dark(#ffffff, #252527)` |

### The inverted

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-surface-inverse` | `light-dark(var(--tc-gray-900), var(--tc-zinc-100))` | `light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92))` |
| `--tc-surface-inverse-hover` | `light-dark(var(--tc-gray-800), #ffffff)` | `light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82))` |
| `--tc-surface-inverse-active` | `light-dark(var(--tc-gray-950), var(--tc-zinc-300))` | `light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74))` |

### Fills

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-fill-subtle` | `light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04))` | `light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04))` |
| `--tc-fill-default` | `light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))` | `light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08))` |
| `--tc-fill-strong` | `light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12))` | `light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14))` |
| `--tc-fill-hover` | `light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))` | `light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04))` |
| `--tc-fill-selected` | `light-dark(rgba(47, 107, 255, 0.08), rgba(91, 154, 255, 0.14))` | `light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14))` |
| `--tc-border-subtle` | `light-dark(var(--tc-gray-100), rgba(255, 255, 255, 0.06))` | `light-dark(rgba(0, 0, 0, 0.045), rgba(255, 255, 255, 0.05))` |
| `--tc-border-default` | `light-dark(var(--tc-gray-150), var(--tc-zinc-800))` | `light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08))` |
| `--tc-border-strong` | `light-dark(var(--tc-gray-250), var(--tc-zinc-700))` | `light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14))` |
| `--tc-border-control` | `light-dark(var(--tc-gray-450), var(--tc-zinc-500))` | `light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4))` |
| `--tc-border-control-hover` | `light-dark(var(--tc-gray-500), var(--tc-zinc-450))` | `light-dark(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.52))` |
| `--tc-border-selected` | `light-dark(var(--tc-blue-500), var(--tc-blue-400))` | `light-dark(var(--tc-cobalt-500), var(--tc-cobalt-400))` |

### Focus: outline: var

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-focus-ring` | `light-dark(var(--tc-blue-500), var(--tc-blue-400))` | `light-dark(var(--tc-cobalt-500), var(--tc-cobalt-400))` |
| `--tc-focus-ring-width` | `2px` | `2px` |
| `--tc-focus-ring-offset` | `2px` | `1px` |
| `--tc-focus-outline` | `var(--tc-focus-ring-width) solid var(--tc-focus-ring)` | `var(--tc-focus-ring-width) solid var(--tc-focus-ring)` |
| `--tc-focus-halo` | `color-mix(in srgb, var(--tc-focus-ring) 24%, transparent)` | `color-mix(in srgb, var(--tc-focus-ring) 24%, transparent)` |

### Accent

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-accent` | `var(--tc-blue-500)` | `light-dark(var(--tc-cobalt-500), var(--tc-cobalt-450))` |
| `--tc-accent-hover` | `var(--tc-blue-600)` | `var(--tc-cobalt-600)` |
| `--tc-accent-text` | `light-dark(var(--tc-blue-600), var(--tc-blue-300))` | `light-dark(var(--tc-cobalt-600), var(--tc-cobalt-300))` |
| `--tc-accent-subtle` | `light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16))` | `light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14))` |
| `--tc-accent-highlight` | `light-dark(rgba(47, 107, 255, 0.16), rgba(109, 139, 255, 0.26))` | `light-dark(rgba(0, 96, 226, 0.12), rgba(77, 141, 255, 0.24))` |

### Status

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-status-success-fg` | `light-dark(var(--tc-green-600), var(--tc-green-300))` | `light-dark(var(--tc-green-600), var(--tc-green-300))` |
| `--tc-status-success-bg` | `light-dark(var(--tc-green-50), var(--tc-green-950))` | `light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12))` |
| `--tc-status-success-solid` | `light-dark(var(--tc-green-500), var(--tc-green-400))` | `light-dark(var(--tc-green-500), var(--tc-green-400))` |
| `--tc-status-success-border` | `color-mix(in srgb, var(--tc-status-success-solid) 40%, transparent)` | `color-mix(in srgb, var(--tc-status-success-solid) 40%, transparent)` |
| `--tc-status-warning-fg` | `light-dark(var(--tc-amber-600), var(--tc-amber-300))` | `light-dark(var(--tc-amber-600), var(--tc-amber-300))` |
| `--tc-status-warning-bg` | `light-dark(var(--tc-amber-50), var(--tc-amber-950))` | `light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15))` |
| `--tc-status-warning-solid` | `light-dark(var(--tc-amber-500), var(--tc-amber-400))` | `light-dark(var(--tc-amber-500), var(--tc-amber-400))` |
| `--tc-status-warning-border` | `color-mix(in srgb, var(--tc-status-warning-solid) 40%, transparent)` | `color-mix(in srgb, var(--tc-status-warning-solid) 40%, transparent)` |
| `--tc-status-danger-fg` | `light-dark(var(--tc-red-600), var(--tc-red-300))` | `light-dark(var(--tc-red-600), var(--tc-red-300))` |
| `--tc-status-danger-bg` | `light-dark(var(--tc-red-50), var(--tc-red-950))` | `light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17))` |
| `--tc-status-danger-solid` | `light-dark(var(--tc-red-500), var(--tc-red-400))` | `light-dark(var(--tc-red-500), var(--tc-red-400))` |
| `--tc-status-danger-border` | `color-mix(in srgb, var(--tc-status-danger-solid) 40%, transparent)` | `color-mix(in srgb, var(--tc-status-danger-solid) 40%, transparent)` |
| `--tc-status-info-fg` | `light-dark(var(--tc-blue-600), var(--tc-blue-300))` | `light-dark(var(--tc-cobalt-600), var(--tc-cobalt-300))` |
| `--tc-status-info-bg` | `light-dark(var(--tc-blue-50), var(--tc-blue-950))` | `light-dark(rgba(0, 143, 245, 0.1), rgba(0, 119, 255, 0.23))` |
| `--tc-status-info-solid` | `light-dark(var(--tc-blue-500), var(--tc-blue-400))` | `light-dark(var(--tc-cobalt-500), var(--tc-cobalt-400))` |
| `--tc-status-info-border` | `color-mix(in srgb, var(--tc-status-info-solid) 40%, transparent)` | `color-mix(in srgb, var(--tc-status-info-solid) 40%, transparent)` |

### Categorical tones

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-tone-violet-fg` | `light-dark(var(--tc-violet-600), var(--tc-violet-300))` | `light-dark(#5b45b8, #b7a6f5)` |
| `--tc-tone-violet-bg` | `light-dark(rgba(105, 65, 198, 0.1), rgba(150, 110, 240, 0.16))` | `light-dark(rgba(91, 91, 214, 0.08), rgba(130, 120, 240, 0.15))` |
| `--tc-tone-violet-solid` | `light-dark(var(--tc-violet-500), var(--tc-violet-400))` | `light-dark(var(--tc-violet-500), var(--tc-violet-400))` |
| `--tc-tone-violet-border` | `color-mix(in srgb, var(--tc-tone-violet-solid) 40%, transparent)` | `color-mix(in srgb, var(--tc-tone-violet-solid) 40%, transparent)` |
| `--tc-tone-pink-fg` | `light-dark(var(--tc-pink-600), var(--tc-pink-300))` | `light-dark(var(--tc-pink-600), var(--tc-pink-300))` |
| `--tc-tone-pink-bg` | `light-dark(rgba(236, 72, 153, 0.1), rgba(244, 114, 182, 0.16))` | `light-dark(rgba(236, 72, 153, 0.08), rgba(244, 114, 182, 0.14))` |
| `--tc-tone-pink-solid` | `light-dark(var(--tc-pink-500), var(--tc-pink-400))` | `light-dark(var(--tc-pink-500), var(--tc-pink-400))` |
| `--tc-tone-pink-border` | `color-mix(in srgb, var(--tc-tone-pink-solid) 40%, transparent)` | `color-mix(in srgb, var(--tc-tone-pink-solid) 40%, transparent)` |
| `--tc-tone-amber-fg` | `light-dark(var(--tc-amber-600), var(--tc-amber-300))` | `light-dark(var(--tc-amber-600), var(--tc-amber-300))` |
| `--tc-tone-amber-bg` | `light-dark(rgba(245, 165, 36, 0.12), rgba(245, 165, 36, 0.14))` | `light-dark(rgba(245, 165, 36, 0.12), rgba(245, 165, 36, 0.13))` |
| `--tc-tone-amber-solid` | `light-dark(var(--tc-amber-500), var(--tc-amber-400))` | `light-dark(var(--tc-amber-500), var(--tc-amber-400))` |
| `--tc-tone-amber-border` | `color-mix(in srgb, var(--tc-tone-amber-solid) 40%, transparent)` | `color-mix(in srgb, var(--tc-tone-amber-solid) 40%, transparent)` |
| `--tc-tone-rose-fg` | `light-dark(var(--tc-rose-600), var(--tc-rose-300))` | `light-dark(var(--tc-rose-600), var(--tc-rose-300))` |
| `--tc-tone-rose-bg` | `light-dark(var(--tc-rose-50), rgba(251, 113, 133, 0.16))` | `light-dark(rgba(225, 29, 72, 0.07), rgba(251, 113, 133, 0.14))` |
| `--tc-tone-rose-solid` | `light-dark(var(--tc-rose-500), var(--tc-rose-400))` | `light-dark(var(--tc-rose-500), var(--tc-rose-400))` |
| `--tc-tone-rose-border` | `color-mix(in srgb, var(--tc-tone-rose-solid) 40%, transparent)` | `color-mix(in srgb, var(--tc-tone-rose-solid) 40%, transparent)` |
| `--tc-tone-teal-fg` | `light-dark(var(--tc-teal-600), var(--tc-teal-300))` | `light-dark(var(--tc-teal-600), var(--tc-teal-300))` |
| `--tc-tone-teal-bg` | `light-dark(var(--tc-teal-50), rgba(79, 209, 197, 0.14))` | `light-dark(var(--tc-teal-50), rgba(79, 209, 197, 0.14))` |
| `--tc-tone-teal-solid` | `light-dark(var(--tc-teal-500), var(--tc-teal-400))` | `light-dark(var(--tc-teal-500), var(--tc-teal-400))` |
| `--tc-tone-teal-border` | `color-mix(in srgb, var(--tc-tone-teal-solid) 40%, transparent)` | `color-mix(in srgb, var(--tc-tone-teal-solid) 40%, transparent)` |

### Destructive actions filled with red: white text keeps 4.5:1 in both themes

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-action-danger-bg` | `var(--tc-red-600)` | `var(--tc-red-600)` |
| `--tc-action-danger-bg-hover` | `color-mix(in srgb, var(--tc-red-600) 88%, var(--tc-gray-950))` | `color-mix(in srgb, var(--tc-red-600) 88%, var(--tc-gray-950))` |
| `--tc-action-danger-fg` | `#ffffff` | `#ffffff` |

### An accent you can fill a mark with

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-accent-solid` | `var(--tc-accent)` | `light-dark(rgba(0, 96, 226, 0.765), #4d8dff)` |

### A recessed well inside a card: token chips, an image's backdrop

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-surface-well` | `light-dark(#f4f4f5, #222225)` | `light-dark(#f4f4f5, #222225)` |

### Where a claim came from

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-source-grounded-fg` | `var(--tc-status-success-fg)` | `var(--tc-status-success-fg)` |
| `--tc-source-grounded-bg` | `var(--tc-status-success-bg)` | `var(--tc-status-success-bg)` |
| `--tc-source-model-fg` | `var(--tc-tone-violet-fg)` | `var(--tc-tone-violet-fg)` |
| `--tc-source-model-bg` | `var(--tc-tone-violet-bg)` | `var(--tc-tone-violet-bg)` |
| `--tc-source-inferred-fg` | `var(--tc-tone-amber-fg)` | `var(--tc-tone-amber-fg)` |
| `--tc-source-inferred-bg` | `var(--tc-tone-amber-bg)` | `var(--tc-tone-amber-bg)` |
| `--tc-source-media-fg` | `var(--tc-tone-teal-fg)` | `var(--tc-tone-teal-fg)` |
| `--tc-source-media-bg` | `var(--tc-tone-teal-bg)` | `var(--tc-tone-teal-bg)` |
| `--tc-source-memory-fg` | `var(--tc-status-info-fg)` | `var(--tc-status-info-fg)` |
| `--tc-source-memory-bg` | `var(--tc-status-info-bg)` | `var(--tc-status-info-bg)` |

### Evidence freshness bands: high, good, aging, stale

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-validity-high-fg` | `var(--tc-status-success-fg)` | `var(--tc-status-success-fg)` |
| `--tc-validity-high-bg` | `var(--tc-status-success-bg)` | `var(--tc-status-success-bg)` |
| `--tc-validity-good-fg` | `var(--tc-status-info-fg)` | `var(--tc-status-info-fg)` |
| `--tc-validity-good-bg` | `var(--tc-status-info-bg)` | `var(--tc-status-info-bg)` |
| `--tc-validity-aging-fg` | `var(--tc-status-warning-fg)` | `var(--tc-status-warning-fg)` |
| `--tc-validity-aging-bg` | `var(--tc-status-warning-bg)` | `var(--tc-status-warning-bg)` |
| `--tc-validity-stale-fg` | `var(--tc-status-danger-fg)` | `var(--tc-status-danger-fg)` |
| `--tc-validity-stale-bg` | `var(--tc-status-danger-bg)` | `var(--tc-status-danger-bg)` |
| `--tc-highlight-yellow-bg` | `light-dark(rgba(255, 204, 0, 0.34), rgba(250, 204, 21, 0.24))` | `light-dark(rgba(255, 204, 0, 0.3), rgba(250, 204, 21, 0.24))` |
| `--tc-highlight-yellow-fg` | `light-dark(#4d3800, #fde68a)` | `light-dark(#4d3800, #fde68a)` |
| `--tc-highlight-green-bg` | `light-dark(rgba(52, 199, 89, 0.24), rgba(74, 222, 128, 0.2))` | `light-dark(rgba(52, 199, 89, 0.2), rgba(74, 222, 128, 0.2))` |
| `--tc-highlight-green-fg` | `light-dark(#0f4527, #bbf7d0)` | `light-dark(#0f4527, #bbf7d0)` |
| `--tc-highlight-blue-bg` | `light-dark(rgba(47, 104, 255, 0.17), rgba(107, 149, 255, 0.26))` | `light-dark(rgba(47, 104, 255, 0.14), rgba(107, 149, 255, 0.26))` |
| `--tc-highlight-blue-fg` | `light-dark(#14306e, #dbe6ff)` | `light-dark(#14306e, #dbe6ff)` |
| `--tc-highlight-pink-bg` | `light-dark(rgba(236, 72, 153, 0.18), rgba(244, 114, 182, 0.24))` | `light-dark(rgba(236, 72, 153, 0.15), rgba(244, 114, 182, 0.24))` |
| `--tc-highlight-pink-fg` | `light-dark(#6e1240, #fbd3e8)` | `light-dark(#6e1240, #fbd3e8)` |
| `--tc-highlight-purple-bg` | `light-dark(rgba(139, 92, 246, 0.19), rgba(167, 139, 250, 0.26))` | `light-dark(rgba(139, 92, 246, 0.16), rgba(167, 139, 250, 0.26))` |
| `--tc-highlight-purple-fg` | `light-dark(#40197e, #e2dafe)` | `light-dark(#40197e, #e2dafe)` |

### Syntax colours for code

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-syntax-keyword` | `var(--tc-tone-violet-fg)` | `var(--tc-tone-violet-fg)` |
| `--tc-syntax-string` | `var(--tc-status-success-fg)` | `var(--tc-status-success-fg)` |
| `--tc-syntax-number` | `var(--tc-tone-amber-fg)` | `var(--tc-tone-amber-fg)` |
| `--tc-syntax-comment` | `var(--tc-text-muted)` | `var(--tc-text-muted)` |
| `--tc-syntax-function` | `var(--tc-status-info-fg)` | `var(--tc-status-info-fg)` |
| `--tc-syntax-type` | `var(--tc-tone-pink-fg)` | `var(--tc-tone-pink-fg)` |
| `--tc-syntax-property` | `var(--tc-tone-rose-fg)` | `var(--tc-tone-rose-fg)` |
| `--tc-syntax-tag` | `var(--tc-tone-pink-fg)` | `var(--tc-tone-pink-fg)` |
| `--tc-syntax-punctuation` | `var(--tc-text-muted)` | `var(--tc-text-muted)` |
| `--tc-syntax-text` | `var(--tc-text-primary)` | `var(--tc-text-primary)` |

### Data vis

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-chart-1` | `light-dark(var(--tc-blue-500), var(--tc-blue-400))` | `light-dark(rgba(0, 96, 226, 0.77), var(--tc-cobalt-400))` |
| `--tc-chart-2` | `light-dark(var(--tc-violet-500), var(--tc-violet-400))` | `light-dark(#5b5bd6, #8585f0)` |
| `--tc-chart-3` | `light-dark(var(--tc-pink-500), var(--tc-pink-400))` | `light-dark(rgba(0, 96, 226, 0.5), rgba(77, 141, 255, 0.62))` |
| `--tc-chart-4` | `light-dark(#7aa2ff, #4d82ff)` | `light-dark(rgba(0, 96, 226, 0.3), rgba(77, 141, 255, 0.4))` |
| `--tc-chart-5` | `light-dark(#c4b5fd, #7c6bd6)` | `light-dark(var(--tc-green-500), var(--tc-green-400))` |
| `--tc-chart-6` | `light-dark(#f9a8d4, #c25a93)` | `light-dark(#e8a20c, #f0b43a)` |
| `--tc-chart-neutral` | `light-dark(var(--tc-gray-400), var(--tc-zinc-600))` | `light-dark(rgba(0, 0, 0, 0.14), rgba(255, 255, 255, 0.16))` |

### Elevation colours

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-shadow-color` | `light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))` | `light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))` |
| `--tc-shadow-color-strong` | `light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))` | `light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6))` |

### Effects

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-shimmer` | `light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.28))` | `light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.3))` |
| `--tc-scrim` | `light-dark(rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.6))` | `light-dark(rgba(0, 0, 0, 0.24), rgba(0, 0, 0, 0.6))` |

### Elevation

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-shadow-control` | `0 1px 2px var(--tc-shadow-color)` | `0 0 0 0.5px var(--tc-border-default), 0 1px 1px -1px var(--tc-shadow-color), 0 1px 2px 0 var(--tc-shadow-color)` |
| `--tc-shadow-raised` | `0 0 0 1px var(--tc-border-default), 0 1px 2px var(--tc-shadow-color)` | `0 0 0 0.5px var(--tc-border-default), 0 1px 1px -1px var(--tc-shadow-color), 0 1px 2px 0 var(--tc-shadow-color)` |
| `--tc-shadow-raised-hover` | `0 0 0 1px var(--tc-border-strong), 0 6px 16px -8px var(--tc-shadow-color-strong)` | `0 0 0 0.5px var(--tc-border-strong), 0 1px 1px -1px var(--tc-shadow-color), 0 1px 3px 0 var(--tc-shadow-color)` |
| `--tc-shadow-overlay` | `0 0 0 1px var(--tc-border-default), 0 16px 36px -12px var(--tc-shadow-color-strong)` | `0 0 0 0.5px var(--tc-border-strong), 0 12px 28px -10px var(--tc-shadow-color-strong), 0 1px 2px 0 var(--tc-shadow-color)` |
| `--tc-shadow-sunken` | `inset 0 0 0 1px var(--tc-border-subtle)` | `inset 0 0 0 0.5px var(--tc-border-default)` |

### Look-level scale choices

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-hairline` | `1px` | `0.5px` |
| `--tc-font-weight-strong` | `var(--tc-font-weight-semibold)` | `var(--tc-font-weight-medium)` |
| `--tc-ease-move` | `var(--tc-ease-out)` | `var(--tc-ease-emphasized)` |
| `--tc-radius-badge` | `var(--tc-radius-full)` | `5px` |

### Patterns

| Token | Standard | Clean |
| --- | --- | --- |
| `--tc-control-h-sm` | `28px` | `24px` |
| `--tc-control-h-md` | `32px` | `28px` |
| `--tc-control-h-lg` | `40px` | `32px` |
| `--tc-control-radius-sm` | `var(--tc-radius-md)` | `var(--tc-radius-sm)` |
| `--tc-control-radius-md` | `var(--tc-radius-lg)` | `var(--tc-radius-sm)` |
| `--tc-control-radius-lg` | `var(--tc-radius-xl)` | `var(--tc-radius-sm)` |
| `--tc-control-px-sm` | `10px` | `8px` |
| `--tc-control-px-md` | `12px` | `10px` |
| `--tc-control-px-lg` | `16px` | `12px` |
| `--tc-control-font-size` | `var(--tc-font-size-md)` | `var(--tc-font-size-md)` |
| `--tc-control-font-weight` | `var(--tc-font-weight-medium)` | `var(--tc-font-weight-medium)` |
| `--tc-action-primary-bg` | `var(--tc-surface-inverse)` | `var(--tc-surface-inverse)` |
| `--tc-action-primary-bg-hover` | `var(--tc-surface-inverse-hover)` | `var(--tc-surface-inverse-hover)` |
| `--tc-action-primary-bg-active` | `var(--tc-surface-inverse-active)` | `var(--tc-surface-inverse-active)` |
| `--tc-action-primary-fg` | `var(--tc-text-on-inverse)` | `var(--tc-text-on-inverse)` |
| `--tc-action-primary-shadow` | `var(--tc-shadow-control)` | `none` |
| `--tc-action-secondary-bg` | `var(--tc-surface-control)` | `var(--tc-surface-control)` |
| `--tc-action-secondary-fg` | `var(--tc-text-primary)` | `var(--tc-text-primary)` |
| `--tc-action-secondary-shadow` | `var(--tc-shadow-raised)` | `var(--tc-shadow-raised)` |
| `--tc-action-secondary-shadow-hover` | `var(--tc-shadow-raised-hover)` | `var(--tc-shadow-raised-hover)` |
| `--tc-action-ghost-fg` | `var(--tc-text-secondary)` | `var(--tc-text-secondary)` |
| `--tc-action-ghost-bg-hover` | `var(--tc-fill-default)` | `var(--tc-fill-subtle)` |
| `--tc-field-h` | `36px` | `32px` |
| `--tc-field-h-sm` | `var(--tc-control-h-sm)` | `var(--tc-control-h-sm)` |
| `--tc-field-radius` | `var(--tc-radius-lg)` | `var(--tc-radius-md)` |
| `--tc-field-px` | `12px` | `10px` |
| `--tc-field-font-size` | `var(--tc-font-size-md)` | `var(--tc-font-size-md)` |
| `--tc-field-bg` | `var(--tc-surface-control)` | `var(--tc-surface-control)` |
| `--tc-field-bg-sunken` | `var(--tc-fill-default)` | `var(--tc-fill-default)` |
| `--tc-field-shadow` | `inset 0 0 0 1px var(--tc-border-control), var(--tc-shadow-control)` | `inset 0 0 0 1px var(--tc-border-control)` |
| `--tc-field-shadow-hover` | `inset 0 0 0 1px var(--tc-border-control-hover), var(--tc-shadow-control)` | `inset 0 0 0 1px var(--tc-border-control-hover)` |
| `--tc-field-shadow-focus` | `inset 0 0 0 1px var(--tc-focus-ring), 0 0 0 var(--tc-focus-halo-width) var(--tc-focus-halo)` | `inset 0 0 0 1px var(--tc-focus-ring), 0 0 0 var(--tc-focus-halo-width) var(--tc-focus-halo)` |
| `--tc-field-shadow-invalid` | `inset 0 0 0 1px var(--tc-status-danger-solid)` | `inset 0 0 0 1px var(--tc-status-danger-solid)` |
| `--tc-menu-bg` | `var(--tc-surface-overlay)` | `var(--tc-surface-overlay)` |
| `--tc-menu-radius` | `var(--tc-radius-xl)` | `var(--tc-radius-lg)` |
| `--tc-menu-padding` | `var(--tc-space-1)` | `var(--tc-space-1)` |
| `--tc-menu-shadow` | `var(--tc-shadow-overlay)` | `var(--tc-shadow-overlay)` |
| `--tc-menu-item-h` | `32px` | `32px` |
| `--tc-menu-item-radius` | `var(--tc-radius-md)` | `var(--tc-radius-sm)` |
| `--tc-menu-item-px` | `10px` | `8px` |
| `--tc-menu-item-font-size` | `var(--tc-font-size-md)` | `var(--tc-font-size-md)` |
| `--tc-menu-item-hover` | `var(--tc-fill-hover)` | `var(--tc-fill-hover)` |
| `--tc-menu-item-selected-fg` | `var(--tc-accent-text)` | `var(--tc-accent-text)` |
| `--tc-pill-h` | `20px` | `18px` |
| `--tc-pill-px` | `8px` | `6px` |
| `--tc-pill-radius` | `var(--tc-radius-badge)` | `var(--tc-radius-badge)` |
| `--tc-pill-font-size` | `var(--tc-font-size-xs)` | `var(--tc-font-size-xs)` |
| `--tc-pill-font-weight` | `var(--tc-font-weight-medium)` | `var(--tc-font-weight-medium)` |
| `--tc-pill-h-lg` | `22px` | `20px` |
| `--tc-pill-px-lg` | `10px` | `8px` |
| `--tc-pill-font-size-lg` | `var(--tc-font-size-sm)` | `var(--tc-font-size-sm)` |
| `--tc-kbd-h` | `18px` | `16px` |
| `--tc-kbd-px` | `4px` | `4px` |
| `--tc-kbd-radius` | `5px` | `var(--tc-radius-xs)` |
| `--tc-kbd-font-size` | `10.5px` | `var(--tc-font-size-2xs)` |
| `--tc-kbd-font-weight` | `var(--tc-font-weight-medium)` | `var(--tc-font-weight-medium)` |
| `--tc-kbd-fg` | `var(--tc-text-secondary)` | `var(--tc-text-secondary)` |
| `--tc-kbd-bg` | `var(--tc-surface-raised)` | `var(--tc-surface-raised)` |
| `--tc-kbd-shadow` | `inset 0 0 0 1px var(--tc-border-strong), 0 1px 0 var(--tc-border-default)` | `var(--tc-shadow-raised)` |
| `--tc-kbd-on-inverse-bg` | `light-dark(rgba(255, 255, 255, 0.16), rgba(0, 0, 0, 0.1))` | `light-dark(rgba(255, 255, 255, 0.16), rgba(0, 0, 0, 0.1))` |
| `--tc-switch-w` | `32px` | `28px` |
| `--tc-switch-h` | `20px` | `16px` |
| `--tc-switch-knob` | `16px` | `12px` |
| `--tc-switch-radius` | `var(--tc-radius-full)` | `var(--tc-radius-badge)` |
| `--tc-switch-on` | `var(--tc-accent)` | `var(--tc-accent)` |
| `--tc-switch-off` | `var(--tc-border-control)` | `var(--tc-border-control)` |
| `--tc-switch-knob-bg` | `#ffffff` | `#ffffff` |
| `--tc-seg-track-bg` | `var(--tc-fill-default)` | `var(--tc-fill-default)` |
| `--tc-seg-track-radius` | `var(--tc-radius-lg)` | `var(--tc-radius-md)` |
| `--tc-seg-pad` | `2px` | `2px` |
| `--tc-seg-thumb-bg` | `light-dark(#ffffff, var(--tc-zinc-750))` | `light-dark(#ffffff, var(--tc-zinc-750))` |
| `--tc-seg-thumb-shadow` | `var(--tc-shadow-control)` | `var(--tc-shadow-raised)` |
| `--tc-card-radius` | `var(--tc-radius-2xl)` | `var(--tc-radius-lg)` |
| `--tc-card-shadow` | `var(--tc-shadow-raised)` | `var(--tc-shadow-raised)` |
| `--tc-card-shadow-hover` | `var(--tc-shadow-raised-hover)` | `var(--tc-shadow-raised-hover)` |
| `--tc-tray-inset` | `4px` | `4px` |
| `--tc-tray-radius` | `calc(var(--tc-card-radius) + var(--tc-tray-inset))` | `calc(var(--tc-card-radius) + var(--tc-tray-inset))` |
| `--tc-avatar-sm` | `20px` | `20px` |
| `--tc-avatar-md` | `24px` | `24px` |
| `--tc-avatar-font-size` | `9px` | `9px` |
| `--tc-avatar-font-weight` | `var(--tc-font-weight-semibold)` | `var(--tc-font-weight-medium)` |
| `--tc-avatar-radius-agent` | `var(--tc-radius-sm)` | `var(--tc-radius-sm)` |
| `--tc-head-gap` | `var(--tc-space-2-5)` | `var(--tc-space-2-5)` |
| `--tc-head-pad` | `var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2-5)` | `var(--tc-space-4) var(--tc-space-4) var(--tc-space-3)` |
| `--tc-head-icon-size` | `28px` | `28px` |
| `--tc-head-icon-radius` | `var(--tc-radius-md)` | `var(--tc-radius-md)` |
| `--tc-head-icon-bg` | `var(--tc-surface-on-tray)` | `var(--tc-surface-control)` |
| `--tc-head-icon-shadow` | `var(--tc-shadow-control)` | `var(--tc-shadow-control)` |
| `--tc-head-icon-fg` | `var(--tc-text-secondary)` | `var(--tc-text-secondary)` |
| `--tc-head-glyph` | `16px` | `15px` |
| `--tc-head-glyph-stroke` | `1.75` | `1.5` |
| `--tc-title-font-size` | `var(--tc-font-size-lg)` | `var(--tc-font-size-lg-plus)` |
| `--tc-title-font-weight` | `var(--tc-font-weight-strong)` | `var(--tc-font-weight-strong)` |
| `--tc-title-line-height` | `var(--tc-line-height-normal)` | `var(--tc-line-height-loose)` |
| `--tc-title-tracking` | `-0.006em` | `var(--tc-tracking-snug)` |
| `--tc-title-color` | `var(--tc-text-primary)` | `var(--tc-text-primary)` |
| `--tc-subtitle-font-size` | `var(--tc-font-size-sm)` | `var(--tc-font-size-sm)` |
| `--tc-subtitle-line-height` | `var(--tc-line-height-tight)` | `var(--tc-line-height-tight)` |
| `--tc-subtitle-color` | `var(--tc-text-secondary)` | `var(--tc-text-secondary)` |
| `--tc-caption-font-size` | `var(--tc-font-size-sm)` | `var(--tc-font-size-2xs)` |
| `--tc-caption-font-weight` | `var(--tc-font-weight-medium)` | `var(--tc-font-weight-medium)` |
| `--tc-caption-line-height` | `var(--tc-line-height-tight)` | `var(--tc-line-height-tight)` |
| `--tc-caption-tracking` | `var(--tc-tracking-normal)` | `var(--tc-tracking-caps)` |
| `--tc-caption-transform` | `none` | `uppercase` |
| `--tc-caption-color` | `var(--tc-text-muted)` | `var(--tc-text-muted)` |
| `--tc-eyebrow-font-size` | `var(--tc-font-size-xs)` | `var(--tc-font-size-2xs)` |
| `--tc-eyebrow-font-weight` | `var(--tc-font-weight-medium)` | `var(--tc-font-weight-medium)` |
| `--tc-eyebrow-line-height` | `var(--tc-line-height-tight)` | `var(--tc-line-height-tight)` |
| `--tc-eyebrow-tracking` | `0.04em` | `var(--tc-tracking-caps)` |
| `--tc-eyebrow-transform` | `uppercase` | `uppercase` |
| `--tc-eyebrow-color` | `var(--tc-text-muted)` | `var(--tc-text-muted)` |
| `--tc-meter-h` | `4px` | `4px` |
| `--tc-meter-h-hero` | `8px` | `8px` |
| `--tc-meter-radius` | `var(--tc-radius-full)` | `var(--tc-radius-full)` |
| `--tc-meter-track` | `var(--tc-fill-default)` | `var(--tc-fill-default)` |
| `--tc-meter-fill` | `var(--tc-accent)` | `var(--tc-accent)` |
| `--tc-tooltip-bg` | `var(--tc-surface-inverse)` | `var(--tc-surface-inverse)` |
| `--tc-tooltip-fg` | `var(--tc-text-on-inverse)` | `var(--tc-text-on-inverse)` |
| `--tc-tooltip-radius` | `var(--tc-radius-sm)` | `var(--tc-radius-sm)` |
| `--tc-tooltip-font-size` | `var(--tc-font-size-sm)` | `var(--tc-font-size-sm)` |
| `--tc-tooltip-px` | `8px` | `8px` |
| `--tc-tooltip-py` | `4px` | `4px` |
| `--tc-divider` | `var(--tc-border-default)` | `var(--tc-border-default)` |
