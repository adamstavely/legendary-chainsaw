# Design tokens: what exists today

Snapshot of 2026-10-24 across all 187 library files (components 129, blocks 11, screens 15, illustrations 24, motion 8), extracted by script into `inventory.json`. The proposal that follows from it is [proposal.md](proposal.md).

## 1. Volume

| | Count |
|---|---|
| Custom properties (file × name) | **3,546** |
| Declarations (light + dark + variant re-definitions) | 7,234 |
| Distinct local names after stripping prefixes | **726** |
| Distinct colour values | **1,043** |
| Declared but never used | 114 |
| Colour tokens with no dark override | 59 |
| Median tokens per component file | 20 (max 61, review-center) |

By role: surface 923 · text 846 · status 380 · accent 300 · border 294 · shadow 227 · easing 175 · focus 141 · size 116 · spacing 40 · duration 24 · radius 18 · font 3. Colour roles are 87% of tokens; radius, spacing, fonts and durations are almost always hard-coded instead.

## 2. Near-identical values

- **129 distinct opaque light greys**, in clusters like `#ececec / #ececee / #ececef / #ebebeb / #ebebec / #ebebed` – some tinted, some pure, no rule for which.
- **Alpha ramps:** black at 39 different opacities, white at 43.
- **Muted text:** Standard `#8f8f8f` (33 files, 3.23:1), `#8a8a8a` (22, 3.45:1), `#737373` (4, 4.74:1), `#a3a3a3` (2, 2.52:1); Clean `rgba(0,0,0,.45)` (57, 3.35:1). Only ~4 of 124 definitions pass 4.5:1 (WCAG audit S3).
- **Faint text** (1.74–2.05:1) is used for timestamps, counts and placeholders.
- **Focus:** Standard `rgba(23,23,23,.22)` ×28 (1.61:1), Clean `rgba(0,96,226,.35)` ×58 (1.73:1), plus 7 dark values and 20 more `ring` values.
- **Dark surfaces fork:** Standard dark cards are `#19191b` in 24 files and `#232326` in 24; dark trays use four values.
- **Easing:** 9 curves across 150 tokens, 20 more hard-coded, including three spellings of one spring.
- **Amber:** 11 warning solids, mostly 2.0–2.8:1, so warning icons fail 1.4.11.

## 3. Naming inconsistencies

| Concept | Names in use |
|---|---|
| Primary text | `ink` 265, `text` 160, `strong` 96, `fg` 86, `primary` 34, `body`, `title` |
| Muted text | `muted` 141, `icon` 50, `soft` 40, `subtle`, `dim`, `quiet`, `label`, `secondary` |
| Faint text | `faint` 89, `placeholder`, `ghost`, `disabled` |
| Border | `line` 176, `edge` 111, `border`, `grid`, `rail`, `guide`, `stroke`, `frame`, `hairline`, `rule` |
| Raised surface | `bg` 262, `card` 142, `pop` 48, `tile`, `panel`, `box`, `menu`, `surface`, `raised`, `bubble`, `face`, `sheet` |
| Sunken surface | `tray` 64, `track` 25, `well`, `inset`, `page`, `ground` |
| Translucent fill | `fill` 75, `wash` 72, `chip` 41, `soft` 40, `pill`, `kbd`, `code`, `tint` |
| Dark button fill | `ink`, `solid`, `primary`, `btn`, `key`, `dark` |
| Focus | `focus` 98, `ring` 69 (only some are focus rings), `halo` |
| Success / danger / warning | `ok`, `done`, `green`, `up`, `good`, `success`, `pass` / `danger`, `red`, `error`, `failed`, `down`, `bad`, `alert` / `warn`, `amber`, `late` |

**Same name, different meaning:** `text` is body text (`#404040`) in 32 Standard files, grey (`#6b6b6b`) in 18, and the 0.61 step in Clean. `ink` is both primary text and the dark button fill. `primary`/`solid` are black in components but blue in some single-look files. `ring` is a focus ring in 33 places and an avatar/tile outline elsewhere. `soft` is a tint in some files and muted text in others. `link` means graph connectors.

**Prefixes:** pairs use `--ui-<abbr>-` / `--ui-<abbr>c-` with opaque abbreviations (`agq`, `cbxc`, `rvcc`); only ~59% of local names are shared between a Standard file and its Clean twin. Screens use an unprefixed vocabulary from App Shell (`--ink`, `--accent`, …) that collides with the gallery's own `:root` – outside `.ui-as` a Screen silently picks up the gallery's indigo accent.

## 4. Standard vs Clean for the same role

| Role | Standard (light / dark) | Clean (light / dark) |
|---|---|---|
| Primary text | `#171717` / `#ededed` | `k.88` / `w.9` |
| Secondary | `#404040` / `#c8c8cc` | `k.61` / `w.62` |
| Muted | `#8f8f8f`, `#8a8a8a` | `k.45` / `w.46` |
| Card | `#fff` / `#19191b` or `#232326` | `#fff` / `#1c1c1e` |
| Tray | `#f0f0f0` / `#111113` | none (`wash k.03`) |
| Border | `#ececec`, 1px | `k.06`, 0.5px ring |
| Accent | `#2f6bff` / 8 different dark blues | `rgba(0,96,226,.765)` / `#4d8dff` |
| Focus | grey halo `rgba(23,23,23,.22)` | blue halo `rgba(0,96,226,.35)` |
| Primary button | gradient `#323137 → #201e25` | flat `k.88` |
| Status tints | opaque | alpha |
| Charts | categorical | one blue at stepped opacity |

Both looks encode the same roles: Clean is an alpha-on-white system, Standard opaque greys plus a tray layer. One semantic vocabulary covers both; only values and a little geometry differ.

## 5. Hard-coded values in rules

| Kind | Uses | Distinct |
|---|---|---|
| Colour | 1,651 | 505 |
| Font family | 192 | 10 |
| Border radius | 1,858 | 71 |
| Duration | 3,736 | 121 |
| Easing | 92 | 20 |
| Shadow | 423 | 148+ |
| Font size | 1,859 | 45 (incl. 12.5 / 13.5 / 11.5px half steps) |
| Spacing | 6,478 | 58 |

## 6. Colours in JS

823 literals (180 distinct) in 54 files: brand/logo SVG fills (keep), illustration art (keep), chart palettes in breakdown-chart, analytics and evals (none follow dark mode), dropzone file-type colours, and `stroke="#fff"` glyphs on ~10 badges.

## 7. Outliers

`#ff0000` destructive red in Button (the only pure red); Clean accent used as text at 3.66:1; Clean status text in alpha hex failing 4.5:1; P3 colours only in review-center; `c1…c6` mean different series in every chart; 114 dead tokens.
