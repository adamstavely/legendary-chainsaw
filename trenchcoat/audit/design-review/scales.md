# Design review: scales

Do spacing, type, line height, weight, radius, shadow, border, z-index and motion values follow a consistent scale, or do files use one-off values that only *pass* the token check?

## Verdict

**Mostly the second.** Font sizes (88% tokenised) and radii (59% tokenised) look clean because the codemod swapped every literal that already *equalled* a dictionary value. Everything else was left as it was:

- **Motion has no scale.** 3,149 of 3,168 durations are literals, spread over 77 values on a 20 ms ladder (140, 160, 180, 200, 220, 240, 260, …). The dictionary's durations (90/150/220/320/420) appear 8 times in total, and `fast 150` matches only 2 literal uses. Over half of all easings are the bare `ease` keyword.
- **Spacing sits on a 2 px grid with an odd-number tail.** It uses no tokens at all (0 of 6,212 sites, as decision 11 intended). 873 sites (14%) are off the `--tc-space-*` scale, mainly 5/7/9/3/1/11 px. These are not compensation for borders.
- **Off-scale radii sit right next to the radius tokens.** 543 literal sites (5, 7, 9, 14, 3, 2, 1.5 px…), and several files use every integer from 1 to 10 px.
- **Standard has no line-height scale.** The same 13 px text gets 18, 18.85, 19 or 20 px of leading. Clean's type ramp, by contrast, is coherent (10/16, 11/16, 12/16, 13/20, 15/24).
- **The one finding users can see:** the Standard card "tray" comes in four radius/inset combinations (20/4, 22/6, 20/6, 24/6), and the Clean card radius is 10 px in 45 components but 12, 16 or 8 px in 9 others.
- **No token misuse:** no spacing token in a font size, and no scale token outside its own property family.

The good news is that most of this can be fixed mechanically with little visual change. A 10-step duration ladder would absorb 98.9% of UI durations within ±12%. The heavy lifting is defining the missing scales (line height, weight, duration, z-index, ring/halo) and adding lint rules. That takes less work than editing the values themselves.

## Method and evidence

- **Static extraction.** `extract.py` parses every `/* css */` template string in all published files, plus inline `style={{…}}` objects: 47,107 declarations in 123 files.
  - Each `<slug>.tsx` / `<slug>-clean.tsx` pair is identical apart from `DEFAULT_LOOK`, so each pair is counted once. Rules are split into Standard-only, Clean-only and shared by their `[data-look]` scope. `plan-vs-actual-clean.tsx` is included.
  - `analyze.py` handles the rest. It resolves `var(--tc-…)` to the dictionary value for the rule's look and constant `${…}` interpolations. It attributes component custom properties (`--tc-button-fs: 14px`) to the property that consumes them. It then splits shorthands (padding, `font`, `transition`/`animation`, `box-shadow` layers) into 21,431 scale "sites".
  - `hist.py`, `looks.py`, `offscale.py` and `neardup.py` produce the tables below.
- **Rendered check.** `measure.cjs` used Playwright against my own server on port 5531 (now stopped). It read computed styles for every element in all 187 gallery stages (64 Standard, 65 Clean, 58 single-look). The rendered data confirms the static picture and catches variants the static root analysis misses.
- **Scratch files.** Everything is in `/private/tmp/claude-501/-Users-adamstavely-Lockin-resolve/79595907-1212-49ec-9fe0-d84778023bc8/scratchpad/design/scales/`:
  - `histograms.txt`: full per-property histograms by group.
  - `looks.txt`: the de-facto scale per look.
  - `offscale.txt`: off-scale counts.
  - `neardup.txt`: near-duplicates within a file.
  - `rendered.json` and `roots.json`: computed-style data.
  - `corner-*.png`: 3× crops of card corners.
- Line numbers refer to `components/<slug>.tsx`. The `-clean` twin has the same line numbers.
- Groups used in the tables: **Std** = Standard-only + shared rules, **Cln** = Clean-only + shared rules, **Single** = blocks/screens/illustrations/motion.

### De-facto scales per look

The 90% column lists the smallest set of values that covers 90% of sites.

| Property | Standard | Clean | Single-look libraries |
|---|---|---|---|
| Spacing | 53 distinct; 90% = 1 2 3 4 5 6 7 8 9 10 11 12 14 16 18 | 50 distinct; 90% = 1 2 3 4 5 6 7 8 10 12 14 16 (+ −4) | 63 distinct; 90% needs 21 values up to 52 px |
| Font size | 27 distinct; 90% = 11 11.5 12 12.5 13 13.5 14 15 | 24 distinct; 90% = 10 11 12 12.5 13 15 | 32 distinct; 90% needs 13 values (10.5…22) |
| Line height | 30 distinct, unitless (1, 1.4, 1.45) mixed with px (14–26); rendered: 54 distinct computed values | 18 distinct; 90% = 1, 16, 18, 20, 24 px; rendered: 28 | 35 distinct; 52% of rendered text uses `normal` |
| Weight | 500 / 600 (+400 inherited) | 400 / 500 (600 never used) | 400 / 500 / 600 (+700, 800) |
| Radius | 29 distinct; 90% = 3 4 5 6 7 8 9 10 12 14 16 20 999 50% | 23 distinct; 90% = 1.5 2 3 4 5 6 8 10 50% | 31 distinct; 90% needs 16 values |
| Border width | 1 / 2 px | 0.5 (104 sites) / 1 / 2 px | 1 / 2 px |
| Outline offset | 2 px | 1 px | 2 px |
| Duration | 54 distinct; 90% needs 20 values (140…1100 ms) | 56 distinct; 90% needs 21 (adds 90, 120) | 58 distinct; 90% needs 29 |
| Easing | `ease`, `--tc-ease-out`, `--tc-ease-emphasized`, `linear` | Same, plus the `ease-out` keyword | 29 distinct, 21 of them one-off `cubic-bezier`s |
| z-index | 0–6, −1, 30 | Identical | 23 distinct (0–55) |

What the comparison shows:

- **The looks really do differ on purpose in some properties:**
  - Density: Clean has smaller radii and paired px line heights.
  - Weight ceiling: 600 in Standard, 500 in Clean.
  - Hairline: 1 px in Standard, 0.5 px in Clean.
  - Focus offset: 2 px in Standard, 1 px in Clean.
- **Motion and z-index are byte-for-byte the same in both looks.** That is a sign they were never designed per look, and also that a single shared scale would suit both.
- **Clean is more disciplined.** 9% of its spacing is off-scale against 17% for Standard. It uses 5 font sizes against 8, and 5 line heights against 12.

### Token usage

| Token family | Uses | Notes |
|---|---|---|
| `--tc-space-*` (15 tokens) | **0** | Exposed but never used (decision 11) |
| `--tc-duration-instant / fast / base / slow` | **0** | |
| `--tc-duration-slower` | 8 | |
| `--tc-ease-out / emphasized / spring / in-out / in` | 788 / 233 / 29 / 23 / 2 | |
| `--tc-font-size-*` | 1,604 | All 11 sizes used |
| `--tc-radius-*` | 1,102 | All 8 radii used |
| `--tc-shadow-control / raised / raised-hover / overlay` | 62 / 209 / 22 / 52 | |
| `--tc-focus-ring-width / -offset` | 10 / 9 | Outlines mostly write `2px` literally (151 sites) |

**Misuse: none.** Every scale token is consumed by a property of its own family (`font-size` tokens only in `font-size`, `radius` tokens only in `border-*-radius`, and so on).

The real "passes the check" problem is different: values that are not dictionary references at all. The check cannot see:

- literal durations and easings (3,149 + 1,971 sites);
- literal shadows that only *contain* a token, such as `0 0 0 1px var(--tc-border-default), 0 1px 2px rgba(0,0,0,.04)`;
- component custom properties carrying on-scale literals (`--tc-button-radius: 12px`, `--tc-button-fs: 14px`: 14 radius and 15 font-size sites).

---

## Findings

### High

#### H1. Card and tray geometry drift between sibling components (both looks)

**What is wrong.** Standard draws most panels as a grey tray with the white card inset inside it. Measured root rules give four tray recipes:

| Tray radius / inset | Components | Card inside | Concentric? |
|---|---|---|---|
| 20 px (`radius-3xl`) / 4 px | 30 | 16 | Yes |
| 22 px / 6 px | 10 | 16 | Yes (thicker tray) |
| 20 px / 6 px | 2 | 16 | No: inner and outer curves do not run parallel |
| 24 px / 6 px | 1 | 20 | Yes |

- The **22/6** group is breakdown-chart:681, change-summary:178, comment-thread:503, comments-panel:826, data-table:1281, decision-inbox:410, integration-settings:738, profile-menu:349, smart-recommendation:501 and tips-panel:291.
- The **20/6** components are billing-schedule:739–740 and email-draft:719–720.
- The **24/6** component is filter-menu:603–604.
- writing-assistant:774 uses yet another recipe, a 32 px card with an 8 px inset.

Side by side, as blocks and screens compose them, the trays visibly differ in thickness (4 vs 6 px) and corner size. Crops:

- `…/scales/corner-agent-inbox.png` (20/4)
- `…/scales/corner-breakdown-chart.png` (22/6)
- `…/scales/corner-billing-schedule.png` (20/6)
- `…/scales/corner-filter-menu.png` (24/6)

**Clean.** 45 component roots render at 10 px (`radius-lg`). The exceptions are:

- 12 px: agent-queue, command-menu, review-center, trace-waterfall, plan-vs-actual-clean.
- 16 px: approval-card in its `data-actions="card"` demo (approval-card:1212, measured as rendered 16 px).
- 8 px: decision-tree, segmented-control, thinking-loader.

See `corner-decision-inbox-clean.png` (10 px), `corner-agent-queue-clean.png` (12 px) and `corner-approval-card-clean.png` (16 px).

**Fix.**

- One tray recipe per look: `--tc-tray-inset: 4px` (Standard) and card radius `--tc-radius-2xl`. Derive the tray radius as `calc(var(--tc-radius-2xl) + var(--tc-tray-inset))`. The reference pattern is segmented-control:630, `calc(var(--tc-segmented-control-radius) - var(--tc-segmented-control-pad))`.
- Move the 22/6 group and billing-schedule, email-draft and filter-menu onto it. That is 13 declarations of radius plus 13 of padding.
- Clean: card root = `--tc-radius-lg` everywhere. That changes 9 declarations. Whether decision-tree and segmented-control at 8 px are deliberate is a judgement call: they are controls, not cards.

### Medium

#### M1. Motion durations: the dictionary scale is not the de-facto scale

- **Evidence:** the duration histogram in `histograms.txt`.
  - Top values: 160 ms ×583, 200 ×273, 140 ×269, 220 ×194, 300 ×191, 260 ×177, 320 ×163, 360 ×115, 240 ×103.
  - There are 77 distinct durations. 3,149 of 3,168 sites are literals.
  - The dictionary's `fast 150` has 2 literal uses, while 140 and 160 together have 852.
- **The same control drifts between looks.** button.tsx:300 (Standard) uses 160 ms; button.tsx:360 (Clean) uses 140 ms for the same colour transitions.
- **Single components use ladders, not scales.** For example:
  - memory-panel (Standard): 160 / 180 / 200 / 220 / 240 / 260 / 280 / 300 / 320.
  - stepper-form (Standard): 11 durations between 180 and 380 ms.
  - 128 file×look combinations contain durations within 20 ms of each other. ai-workspace renders 14 distinct durations.
- **Fix: replace the 5-step duration scale with a 10-step ladder.** Snapping each value to the nearest step in log space changes 1,943 sites (1,340 declarations). Only 33 sites move by more than 12% (480 → 420/560, 800 → 700/900, plus four at 80 ms). The current dictionary scale would leave 617 sites shifted by more than 12%.
- **Exclusions:** decorative loops ≥ 1 s (illustrations' 16 s orbit ×26 and so on) and reduced-motion `0ms`/`1ms` stay as component tokens or literals.

#### M2. Easing: the `ease` keyword dominates, and "ease-out" means two curves

- **Usage:** `ease` appears at 1,608 sites, plus 50 transitions with no timing function at all, together 54% of all easing sites. That is fine as a choice for colour fades, but there is no token for it.
- **Name clash:** the keyword `ease-out` = `cubic-bezier(0,0,.58,1)` appears 114 times (71 in components, for example prompt-library:1113 and inline-diff:1375). `--tc-ease-out` = `cubic-bezier(.22,1,.36,1)` appears 788 times. They share a name but are two different curves.
- **One-offs:** there are 21 distinct one-off `cubic-bezier`s (63 sites: 39 in illustrations, 21 in components, such as `(0.34,1.3,0.64,1)` next to `--tc-ease-spring (0.34,1.56,0.64,1)`, and `(0.25,1,0.5,1)` / `(0.32,0.72,0,1)` near `ease-out` / `emphasized`).
- **Fix:**
  - Add `--tc-ease-standard: ease` and convert the 1,658 sites mechanically, with no visual change.
  - Rename or retire the `ease-out` keyword uses. Either map them to `--tc-ease-out` (a visibly snappier deceleration; judgement call) or add `--tc-ease-decelerate: cubic-bezier(0,0,.58,1)`.
  - Snap the 21 component one-offs to the five tokens. Illustrations may keep art-specific curves as component tokens.

#### M3. Spacing: a 2 px grid with an odd-number tail, and no tokens

- **Off-scale share:** 873 of 6,212 sites (780 declarations in 96 files) are off `--tc-space-*`. By group:

  | Group | Off-scale sites |
  |---|---|
  | Standard-only | 353 / 2,059 (17%) |
  | Clean-only | 210 / 2,323 (9%) |
  | Blocks | 98 / 587 |
  | Screens | 117 / 784 |

- **Which values:** 5 px ×152, 7 ×147, 1 ×114, 9 ×108, 3 ×104, 11 ×52, then 22/26/52/36/30/44.
- **Not border compensation:** only 17 of the 693 odd values sit in a rule with a 1 px border; most components draw edges with box-shadow rings, which take no space. In gaps alone there are 28×1, 30×3, 60×5, 51×7 and 10×9 px.
- **Worst files:** agent-plan (14 distinct values between 1 and 14 px in Standard), app-shell, experiment-card, agent-cursors (Clean), decision-tree, email-draft and review-center. See `neardup.txt`.
- **Fractional px:** review-center:2175–2180 converts `ch` to px (7.8 / 15.6 / 23.4 / 31.2 px, `calc(2ch + 31.2px)`).
- **Fix.** Keep decision 11 (no bulk codemod), but:
  - Lint new and touched CSS against `--tc-space-*`.
  - Snap odd values when a file is edited: 5 → 4 or 6, 7 → 6 or 8, 9 → 8 or 10, 3 → 2 or 4, 11 → 10 or 12.
  - Accept 1 px only as `calc(var(--tc-space-n) ± 1px)` optical nudges.
  - In review-center, use `ch` units.
  - If done in bulk, it is 873 sites. The visual change is ±1 px per site, which is noticeable only in dense rows.

#### M4. Type scale: too many steps in 10–14 px, a missing 15 px step, and off-ramp display sizes

- **Too many small steps:** the dictionary has 8 steps between 10 and 14 px.
  - Standard-only rules use all of them: 11.5 ×37, 12.5 ×141, 13.5 ×34.
  - Clean-only rules almost never use the half steps (13 / 10 / 2 uses).
  - The rendered Standard text is 17% 12.5 px and 6% 13.5 px. Clean is 42% 13 px and 33% 12 px.
- **Missing 15 px step:** 15 px is the de-facto title size in both looks (71 literal sites). It is used for `.ui-pl__title`, `.ui-bs__title`, `.ui-bc__title`, agent-queue's `__stat dd`, ai-answer's question, `button[data-size=lg]` at button.tsx:320 and email-draft at 780/790/793/810. There is no token for it because the dictionary jumps from 14 to 16.
- **Between-step sizes:** 10.5 px ×24 (kbd and badges: combobox, command-menu, data-table filter, model-picker glyph) and 14.5 px ×9.
- **Tiny sizes:** 6.5–9.5 px ×23, mostly avatar initials.
- **Display sizes:** 17, 18, 19, 22, 23, 26, 28 and 30 px in blocks and screens. settings-billing renders 13 distinct font sizes (9.5 to 28 px) and 16 distinct radii.
- **Fix:**
  - Add `--tc-font-size-lg-plus: 15px`. "-plus" then consistently means "halfway to the next step" (11 → 11.5, 12 → 12.5, 13 → 13.5, 14 → 15 → 16). Converting the 71 literals causes no visual change.
  - Add `--tc-font-size-4xl: 28px` for screen titles.
  - Snap 10.5 → 10 or 11, 14.5 → 14 or 15, 17–19 → 16 or 20, 22/23 → 20 or 24 (judgement per heading), 26 → 24 or 28.
  - Give avatar initials a component token derived from the avatar size, as kpi and client-context inline styles already do (`size * 0.45`).
  - Total: 95 off-scale sites (86 excluding scaled illustration art) plus 71 tokenisations.
  - For the merge: Clean should keep away from the -plus steps (the 25 Clean-only -plus uses could go to whole steps).

#### M5. Line height: no scale in Standard, and `normal` in single-look libraries

- **Standard pairs nothing.** Measured font-size/line-height pairs within one rule:
  - 13 px is set with 20 px ×21, 18 ×19, 19 ×12, 1.4 ×4, 1.45 ×4 and 17 ×2.
  - 12.5 px is set with 18, 17, 20, 24, 16, 1.4, 1.5, 28 and 34 px.
  - Unitless values produce fractional line boxes: rendered 17.5 px (5%) and 18.85 px (3%).
- **Clean pairs consistently.** 12/16 ×177, 13/20 ×168, 10/16 ×37, 11/16 ×25, 15/24 ×28.
- **Blocks and screens leave it to the font.** 52% of their rendered text uses `normal` (Inter ≈ 1.21), so they set different leading from the components embedded in them.
- **Fix:**
  - Add `--tc-line-height-{none: 1, tight: 16px, snug: 18px, normal: 20px, relaxed: 22px, loose: 24px}` plus 28/32 px for display.
  - Document the pairs: 10–12 → tight, 12.5 → snug, 13–14 → normal, 15 → loose (Clean) or relaxed (Standard).
  - 194 declarations are off this set: 122 components, 30 screens, 23 blocks, 17 illustrations, 2 motion. Set explicit line heights on block and screen text.

#### M6. Radius: tokens adopted, but off-scale literals sit next to them

- **Off-scale share:** 543 of 1,659 radius sites (504 declarations in 90 files) are off the 8-step scale.
  - 5 px ×122 (Clean 72), 9 ×72, 7 ×58, 14 ×55, 3 ×44, 2 ×39, 1 ×25, 18 ×18, 1.5 ×17, 11 ×16, 2.5 ×14, 22 ×11.
- **Near-duplicates in a single file** (`neardup.txt`, 103 file×look combinations):
  - agent-cursors (Clean) uses 1, 2, 3, 4, 5, 6, 7, 8, 9 and 10 px.
  - app-shell uses 5 to 12 px.
  - context-map (Clean) uses 2.5 to 8 px.
  - integration-settings (Standard) uses 8, 9, 10 and 11 px.
- **Some are justified** as concentric radii (outer minus padding) but are written as literals. For example agent-graph:2010 (Standard) uses `calc(var(--tc-agent-graph-r) + 6px)` where :2011 (Clean) uses `+ var(--tc-radius-sm)`. Which are deliberate is a judgement call.
- **Rendered dominant values:** Standard's top radius is 26% (context-window grid cells) and 3.5 px (fan-out-grid, 140 elements). Clean's second most common is 2 px (context-window cells, usage-meter bars).
- **Fix:**
  - Add `--tc-radius-2xs: 2px` for bars, ticks and cells. This absorbs 1–3 px: about 140 sites.
  - Express nested radii as `calc(<outer> - <inset>)`.
  - Snap the rest: 5 → 4 or 6, 7 → 6 or 8, 9 → 8 or 10, 11 → 10 or 12, 14 → 12 or 16, 18 → 16 or 20.

#### M7. Shadows: hand-assembled copies of tokens, and bespoke elevation

- **Copies of `--tc-shadow-raised`.** 63 Standard declarations rebuild it by hand as `0 0 0 1px var(--tc-border-default), 0 1px 2px rgba(0,0,0,α)`, with α of 0.03, 0.04 (×47), 0.045, 0.05 or 0.06, or `rgba(16,16,24,.04)`. The literal colour does not adapt to dark mode, where the token uses α 0.4. Worst files: agent-cursors (7), permission-request, cited-answer and agent-tree (4 each). Example: agent-inbox:814.
- **Rebuilt in screens and blocks.** Screens build the same thing from parts: `0 0 0 1px var(--tc-border-default), var(--tc-shadow-control)` (×20 in screens, ×5 in blocks).
- **Literal drop shadows.** There are 124 distinct literal drop geometries in 390 layers:

  | Group | Distinct geometries |
  |---|---|
  | Standard | 33 |
  | Clean | 17 |
  | Blocks | 19 |
  | Screens | 15 |
  | Illustrations | 48 |

  Popover and overlay elevation is bespoke almost everywhere: `0 8px 24px`, `0 12px 30px -8px`, `0 16px 32px -12px`, `0 24px 48px -12px`, `0 4px 12px -4px`…
- **Rings are literals.** 778 ring layers (borders and halos drawn as box-shadow) are literal widths:
  - edges: 1 px ×491, 0.5 px ×129, 1.5 px ×33;
  - halos: 3 px ×35, 2 px ×24, 4 px ×24, 5–8 px ×13.
- **Fix:**
  - Replace the 63 copies with `--tc-shadow-raised` (Standard light changes from α .04 to .05: invisible).
  - Add `--tc-ring-width` (Standard 1 px, Clean 0.5 px) and `--tc-focus-halo-width: 3px`.
  - Snap component popover shadows to `--tc-shadow-overlay`. In components that is about 60 declarations. Illustrations keep their art.

#### M8. z-index: no layer scale (risk of overlap when composed; judgement call, not reproduced)

- **Popovers use whatever number was handy:**
  - combobox:1330, model-picker:891 and date-range-picker:1072: 30.
  - data-table picker:1561: 50.
  - integration-settings menu:1115: 10.
  - The blocks' menus: kpi-board:841 10, ai-workspace:993 20.
- **Overlays range from 10 to 9,999:** toaster:846 is 9,999 (`[data-inline]` 20), delegate-board's drag ghost:917 is 1,000, and app-shell's toast:1732 is 40.
- **App-shell stacking:** drawer 50 (:2088/:2114), scrim 45 (:2145) and popover 30 (:1683).
- **What can go wrong:** none of the popovers use portals or the top layer. A data-table picker inside a mobile app-shell drawer ties with the drawer at 50, and an integration-settings menu (10) sits below ai-workspace's side panel (25).
- **Fix:**
  - Add `--tc-z-{sticky: 10, dropdown: 30, drawer-scrim: 40, drawer: 50, modal-scrim: 60, modal: 70, toast: 80, drag: 90}`.
  - Keep 0–6 literals for local stacking inside an `isolation: isolate` root.
  - 38 declarations are ≥ 10.

#### M9. Font weight: no tokens, and the looks split on emphasis

- **Usage:** 400 ×126, 500 ×824, 600 ×167 (Standard and single-look only; Clean never uses 600).
- **Strays:** 15 stray weights in 13 files: 450 ×9, 650 ×2, 550, 700, 800, 380. Examples: breakdown-chart:1114/1180, data-table:1419/1706, approval-card:1018, kpi-chart:412.
- **Fix:**
  - Add `--tc-font-weight-{regular: 400, medium: 500, semibold: 600}`.
  - Add a look-dependent semantic `--tc-font-weight-strong` (Standard 600, Clean 500), so a merged source does not need forked rules for emphasis.
  - Snap the 15 strays: 450 → 500, 550/650 → 600, 700/800 → 600 outside illustrations.

### Low

- **L1. Border widths.**
  - 21 stray widths: 1.5 px ×15 (comment-thread:780, context-window:1060, stepper-form:1708, email-draft:1173…), 1.25 px ×3, 1.8 px ×2, 1.2 px.
  - Focus outlines write `2px` literally 151 times; `--tc-focus-ring-width` is used 10 times.
  - Fix: use 1 px or `--tc-focus-ring-width`. Icon strokes are out of scope.
- **L2. Outline offset.** 17 strays (3 px ×6, 4 px ×6, −1 px ×3) against the per-look 2 px (Standard) and 1 px (Clean). Fix: `--tc-focus-ring-offset`.
- **L3. Letter spacing.**
  - 26 distinct values. Standard uses em units (−0.006em ×24, which is imperceptible: 0.08 px at 13 px). Clean uses px (0.5 px ×29 for caps labels in agent-queue, trace-waterfall, …).
  - Fix: `--tc-tracking-{tight: -0.02em, snug: -0.01em, normal: 0, caps: 0.04em}` in em, so tracking scales with size. That changes 157 sites, with tiny visual change.
- **L4. calc() tricks.**
  - Fine: button.tsx:387/390 `calc(var(--tc-button-px) - 2px)` is an optical icon inset; keep it, but name the 2 px.
  - trace-waterfall:1232/1234 `+ 6px` and agent-cursors:1650 `+ 10px` should use space tokens.
  - Exempt: chat-composer:1837–2523 scales Figma geometry by `--u` (art inside a component).
- **L5. On-scale literals inside component custom properties.**
  - Values such as `--tc-button-radius: 12px` (button.tsx:277) and `--tc-button-fs: 14px` (button.tsx:275) bypass the token codemod: 14 radius and 15 font-size sites.
  - Fix: `--tc-button-radius: var(--tc-radius-xl)`.
- **L6. Font family.** 89 declarations spell out the `"Inter", ui-sans-serif, …` stack, against 68 that use `--tc-font-sans`. For example, button.tsx:289 (Standard) is literal while button.tsx:349 (Clean) uses the token. This is outside the scale question but the same class of problem.
- **L7. Unused dictionary entries.**
  - All 15 `--tc-space-*` tokens.
  - `--tc-duration-instant`, `-fast`, `-base` and `-slow`.
  - `--tc-ease-in` (2 uses).
  - Either adopt them through the lint (preferred) or drop them from the docs until they are used.

---

## Proposed token and scale changes

Names follow `audit/design-tokens/proposal.md`. Counts are sites or declarations that would change, de-duplicated across the Standard/Clean twin files.

| Property | Proposed scale | New or changed tokens | Would change |
|---|---|---|---|
| Spacing | Keep `--tc-space-*` (2 px half-steps to 18, then 20/24/28/32/40/48) and add 56/64 | `--tc-space-14: 56px`, `--tc-space-16: 64px` | 873 sites / 780 declarations if done in bulk; per decision 11, lint new code and snap on touch |
| Font size | 10 · 11 · 11.5 · 12 · 12.5 · 13 · 13.5 · 14 · **15** · 16 · 20 · 24 · **28** | `--tc-font-size-lg-plus: 15px`, `--tc-font-size-4xl: 28px` | 71 tokenisations (no visual change) + 95 snaps (86 outside illustrations) |
| Line height | 1 · 16 · 18 · 20 · 22 · 24 (· 28 · 32) px, paired with font size | `--tc-line-height-{none, tight, snug, normal, relaxed, loose, display-sm, display}` | 194 declarations, plus explicit values where blocks/screens rely on `normal` |
| Font weight | 400 · 500 · 600 | `--tc-font-weight-{regular, medium, semibold}`, look-semantic `--tc-font-weight-strong` | 15 snaps; 1,117 tokenisations (no visual change) |
| Letter spacing | −0.02 · −0.01 · 0 · 0.04 em | `--tc-tracking-{tight, snug, normal, caps}` | 157 |
| Radius | **2** · 4 · 6 · 8 · 10 · 12 · 16 · 20 · full; nested radii as `calc(outer − inset)` | `--tc-radius-2xs: 2px`, `--tc-tray-inset` (4 px Standard) | 543 sites / 504 declarations (≈140 absorbed by 2xs) + 22 card/tray declarations (H1) |
| Border / ring | 0.5 · 1 · 2 px | `--tc-ring-width` (1 px Standard / 0.5 px Clean), `--tc-focus-halo-width: 3px` | 21 stray borders + 151 literal `2px` outlines → `--tc-focus-ring-width` + ~650 ring layers (no visual change) |
| Shadow | control · raised · raised-hover · overlay only | none | 63 hand-built `raised` copies + ~60 component popover shadows |
| z-index | sticky 10 · dropdown 30 · drawer-scrim 40 · drawer 50 · modal-scrim 60 · modal 70 · toast 80 · drag 90 | `--tc-z-*` | 38 declarations |
| Duration | 90 · 120 · 150 · 200 · 260 · 320 · 420 · 560 · 700 · 900 ms | `--tc-duration-{instant 90, quick 120, fast 150, base 200, moderate 260, slow 320, slower 420, slowest 560, reveal 700, reveal-slow 900}` (`base` changes 220 → 200; it is currently unused) | 1,943 sites / 1,340 declarations; 33 move more than 12% |
| Easing | standard (`ease`) · out · emphasized · in-out · in · spring | `--tc-ease-standard: ease`, optional `--tc-ease-decelerate` | 1,658 `ease`/implicit (no visual change) + 114 keyword `ease-out` + 21 component one-offs |

Lint (extending `scripts/check-tokens.mjs` or ESLint) to stop the drift returning:

- Ban literal `ms`/`s`, `cubic-bezier`/keyword easings and `z-index ≥ 7` in component CSS.
- Ban literal `font-weight`, `line-height` and `border-radius` values that are not 0 or 50%.
- Ban `box-shadow` layers with a blur radius > 0 outside `--tc-shadow-*` and component tokens.
- Warn on spacing values off the `--tc-space-*` grid.
- Exempt illustrations' `--u`-scaled geometry.

## Prioritised fix list

1. **H1 tray/card geometry.** 22 declarations, user-visible. Unify on 20/4/16 (Standard, via `--tc-tray-inset` and `calc`) and 10 px Clean roots.
2. **Duration and easing tokens plus mechanical codemod.** Extend `apply-tokens.mjs` with nearest-step snapping (98.9% within ±12%) and `--tc-ease-standard`. It is mostly invisible, removes about 5,000 literals, and the lint can then ban new ones. Resolve the `ease-out` naming clash at the same time.
3. **The 63 hand-built `shadow-raised` copies → token.** This also fixes their dark-mode shadow.
4. **z-index layer tokens** for popovers, drawers and toasts (38 declarations). Check the app-shell and data-table combination while doing it.
5. **Type:** add `lg-plus 15px` (71 sites), introduce line-height tokens and pairs, give blocks and screens explicit line heights, and snap the 95 off-scale sizes.
6. **Font-weight tokens** with the look-semantic `strong`, plus the 15 strays.
7. **Radius:** add `2xs`, write nested radii as calc, and snap 5/7/9/11/14/18 on touch. Clean up the near-duplicate files first: agent-cursors, app-shell, context-map, integration-settings.
8. **Spacing:** lint plus snap-on-touch for odd values, starting with agent-plan, app-shell, decision-tree, experiment-card, email-draft and review-center (whose `ch`-derived px should use `ch`).
9. **Low items:** border/outline strays, tracking tokens, literal font stacks, and the unused dictionary entries.
