# Themes

Every colour token is a `light-dark()` pair, so components follow the CSS `color-scheme` where they sit. Looks and
themes nest independently: a Clean card inside a dark Standard page just works.

## Picking the theme

| Set on an ancestor | Result |
|---|---|
| nothing, or `data-tc-theme="system"` | follows the operating system (`color-scheme: light dark`) |
| `data-tc-theme="light"` or `data-theme="light"` | light |
| `data-tc-theme="dark"`, `data-theme="dark"` or `class="dark"` | dark |

```html
<body data-tc-theme="dark">…</body>
```

Each theme meets the contrast minimums: text at least 4.5:1 on every surface, controls, focus rings and status
colours at least 3:1 – checked in CI (`npm run check:contrast`).

## Forced colours

In Windows High Contrast (`forced-colors: active`) the components hand colour to the system: controls keep a
system-colour border, selection is Highlight, focus shows an outline. Nothing to turn on.

## Overriding tokens

Every token is declared inside `:where()`, with no specificity, so a plain rule overrides it regardless of load order:

```css
:root { --tc-accent: #0a7c66; }
.marketing-section { --tc-card-radius: 20px; }
```
