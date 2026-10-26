# Design review: UI patterns

Do the same UI patterns look and behave the same across components, and between components and blocks, screens and illustrations?

## Verdict

**Clean mostly does. Standard, the blocks and the screens do not.**

- **Clean is close to a system.** Its controls are 28 px high with a 6 px radius. Hand-rolled buttons, icon buttons and segment options are 28/6 in ~90% of instances. Pills are 18–20 px, 11–12/500, 4–5 px radius. Menus are radius 10, padding 4, `--tc-shadow-overlay`, with 32 px rows. Cards are radius 10 with `--tc-shadow-raised` (42 of 52). What drifts in Clean is small: a few components ignore the look entirely (approval-card), switches come in two shapes, kbd chips come in three sizes, and hover fills use three different tokens.
- **Standard has a reference for every pattern but few instances follow it.** The Button component (32/40/48 high, radius 10/12/14, gradient primary) appears 16 times in the whole gallery outside its own demo. Meanwhile 845 hand-rolled buttons sit at 26, 28, 30, 32, 34, 36 and 40 px, with radius 7–14 px. Primary buttons are either a gradient or flat ink, and secondaries use either an outer ring or an inset ring. The pattern catalogue is similar:
  - menus: 7 shadow recipes, 4 radii, 5 row heights, 5 "selected" treatments
  - status pills: two shapes (full pill vs 5–8 px rect), 5 heights, 4 font sizes
  - switches: 6 sizes, two "on" colours
  - segmented tracks: 6 heights, 5 track fills
  - kbd: 5 sizes, 2 surfaces
- **The blocks are a parallel UI kit.** No block imports Button, SegmentedControl or any menu or field component. Only ai-workspace imports a component (ChatComposer). Every block re-implements menus, search fields, segmented switches, switches, pills and buttons with its own values, often with raw hex and `!important`: 10–18 `!important` per block in ai-workspace, app-directory, task-board and pricing-plans.
- **The screens run a third scale.** `screens/app-shell.tsx` exports its own primitives:
  - Tabs, IconButton/`.ui-as-tool`, SearchField, Popover, MenuList, Dropdown, MenuButton, SectionHead and EmptyState, all at 32 px with radius 9 px and 13–13.5 px text
  - restyles of library components from outside: the Button primary, approval-card and inline-diff buttons, the tool-call-card head, kpi-chart and data-table cards, and usage-meter's layout
  - setup-guide and filter-menu shrunk with `zoom` (0.86 and 0.9)

  A Standard component therefore looks different inside a screen from how it looks on its own gallery page.

The fix that pays most is not a new component per pattern. It is about a dozen **pattern tokens** (control heights, menu surface and row, pill, kbd, switch, segmented track), consumed by the existing reference instances. The blocks and screens then use the library components (or at least those tokens) instead of local copies. Details are at the end.

## Method

- **Rendered inventory** (`collect.mjs`, Playwright, my own Vite server on port 5532, now stopped):
  - It loaded every gallery entry (123 entries, 187 stages, both looks, light theme) and recorded computed geometry, type, colour, border and shadow for each instance of each pattern. Instances were found by role and tag (inputs, `[role=menu|listbox|option|tab|switch|radio|progressbar]`, `kbd`, `button`), and by geometry plus class name for chips, cards and section heads. That gave 3,323 instances.
  - It also clicked every `aria-haspopup`, `aria-expanded=false` and `role=combobox` trigger (up to 8 per stage) and measured the menus that opened: 71 popups.
  - Hover, selected and focus states come from the CSS: `parse-css.mjs` extracted all 12,213 rules with file:line, and `analyze.mjs` attaches each instance's state rules.
- **Line numbers.** Component line numbers refer to `src/components/<slug>.tsx` (the published files are generated from it). Block, screen and illustration line numbers refer to the file itself.
- **Crop sheets** (2× crops, side by side, labelled with measured values) are in `…/scratchpad/design/patterns/sheets/` (full path below). Raw popup crops are in `…/patterns/popups/`, and the full grouped tables are in `chips.txt`, `btn-handrolled.txt` and `handrolled-static.txt`.
- **Out of scope.** Contrast, focus visibility and target size are left to `audit/WCAG-2.2-AA-audit.md`. Raw scale values (spacing, radius and duration ladders) are left to `audit/design-review/scales.md`. This report is about whether *patterns* match each other.
- **Gaps.** Illustrations produced almost no measurable instances: their mini-UIs are scaled artwork. They are covered statically and where they render real menus (region-dach, world-map, glow-keyboard). Values were measured in light theme only. Dark-only overrides in blocks are noted from the source.

Scratch folder: `/private/tmp/claude-501/-Users-adamstavely-Lockin-resolve/79595907-1212-49ec-9fe0-d84778023bc8/scratchpad/design/patterns/`

---

## Findings – High

### H1. Button: the component is barely used; 845 hand-rolled buttons disagree with it and with each other (Standard, blocks, screens)

**Reference.** `Button` (`src/components/button.tsx:190`):

| Look | sm | md | lg |
|---|---|---|---|
| Standard | 32 high, r 10, 13/500 | 40 high, r 12, 14/500 | 48 high, r 14 |
| Clean | 24 high, r 6 | 28 high, r 6 | 32 high, r 6 |

In Standard, primary is a gradient with an edge, secondary is surface-overlay with a 1 px border and `--tc-shadow-control`, and ghost is a muted label that gets a `--tc-fill-default` wash on hover.

**Usage.** Rendered `.ui-button` count: 16 outside the Button demo, all in screens. Rendered hand-rolled buttons with a fill, border or shadow: 161 variants. Heights of all hand-rolled buttons per library:

| Library | Heights (count) |
|---|---|
| Standard components | 32 (52) · 28 (35) · 30 (26) · 34 (23) · 26 (18) · 42 · 36 · 40 |
| Clean components | **28 (140)** · 24 (18) · 32 · 34 |
| blocks | 34 · 30 · 32 · 28 |
| screens | **30 (138)** · 34 · 32 |

Standard, selected instances (`sheets/btn.png`; caveat: crop 00 is labelled "Button sm" but shows Button **lg**):

| Instance | h × r | type | Fill / edge | vs Button |
|---|---|---|---|---|
| smart-recommendation `.ui-sr__btn` :548 | 32 × 10 | 13/**400** | white + outer ring | weight |
| integration-settings `.ui-is__btn` :1103 | 32 × 10 | 13/400 | white + outer ring | weight |
| agent-queue `.ui-agq__btn` :1642 | **28 × 9** | 13/500 | white + ring | off scale |
| tool-call-card `.ui-tc__retry` :728 | **26 × 7** | 12.5/500 | white + **inset** ring | off scale |
| billing-schedule `.ui-bs__btn` :976 | **40 × 10** | 16(inherited)/400 | white + inset ring | radius ≠ md 12 |
| permission-request `.ui-pr__btn` :955 | 40 × 12 | 14/500 | white + ring | matches md |
| email-draft `.ui-ed__primary` :1015 | **36 × 10** | 16/400 | gradient | off scale |
| approval-card `.ui-ap__btn` :1152 | **34 × 10** | 13/500 | **flat ink** #171717 | off scale + flat |
| agent-plan `.ui-pl__btn` :1830 | 32 × **9** | 13/500 | flat ink | flat |
| review-center `.ui-rvc__btn` :1945 | 34 × 10 | 13/500 | flat ink + inner highlight | off scale |
| tips-panel `.ui-tp__btn` :327, decision-inbox `.ui-di__btn` :284 | **30 × 9** | 13/400 | gradient | off scale |
| stepper-form `.ui-sf__btn` :1535 | 36 × 10 | 13.5/500 | flat ink | off scale |
| date-range-picker `.ui-drp__btn` :1140 | 32 × 9 | 13/500 | flat ink | flat |
| block client-context `.ui-cx__primary` :1755 | 32 × 9 | 12.5/500 | gradient | — |
| block pricing-plans `.ui-pp__cta` :600 | **28 × 8** | 14/400 | ink | — |
| block kpi-board `.ui-kb__setup` :867 | 30 × 8 | 12.5/400 | white + **1px border** | — |
| block metrics-dashboard `.ui-md__export` :756 | 34 × 10 | 16/400 | white + ring | — |
| block app-directory `.ui-adir__btn` :681 | 30 × 9 **and** 38 × 11 | 13 / 14 | white + ring | two sizes in one block |
| block invoice-credit `.ui-iv__btn` :532 | 34 × 10 | 16/400 | white + inset ring | — |
| screens app-shell `.ui-as-tool` :1573 | 32 × 9 | 13/400 | white + ring | — |

So a Standard primary is a gradient in Button, decision-inbox, tips-panel, email-draft and client-context. It is flat ink in approval-card, agent-plan, review-center, stepper-form and date-range-picker. And it is flat ink with inset highlights in every screen, because of the override described next.

**Screens override the Button component itself.** `screens/app-shell.tsx:1204–1213` (`.ui-as-app .ui-button[data-variant="primary"]`) replaces the gradient with `--tc-surface-inverse` and custom inset shadows. Screens also only ever render `size="sm"` (32 × 10). The same `<Button>` is therefore visibly different in a screen and on the Button page (`sheets/btn.png`, "screen Button primary (overridden)" next to "Button md").

**Clean** is consistent: 28 × 6, 13/500, `--tc-shadow-raised` or `--tc-surface-inverse` (`sheets/btn-clean.png`). One exception: `approval-card` `.ui-ap__btn` (`approval-card.tsx:1152`) is unscoped and renders **34 × 10 in Clean too**. Its card is also `--tc-radius-2xl` (16) in Clean (`:837`), against Clean's 10.

**Fix.**
1. Introduce `--tc-control-h-sm|md|lg` and `--tc-control-radius-sm|md|lg` per look:
   - Standard: 28/32/40, radius 8/10/12. Judgement call: 32 is the most common rendered value and is what Button sm already uses. 28 absorbs the 26–30 cluster.
   - Clean: 24/28/32, radius 6.
2. Make Button consume them.
3. Replace the hand-rolled classes above with `<Button>`, or at minimum with the tokens plus `--tc-button-*` colours.
4. Decide on one Standard primary (gradient or flat ink) and delete the other.
5. Remove the app-shell override at `app-shell.tsx:1204`. If screens really want flat ink, make it a Button variant.
6. Scope `approval-card` button and card geometry per look.

### H2. Menus and popovers: seven Standard surface recipes, four radii, five row heights, five "selected" styles; blocks and screens each roll their own

Measured on opened menus (`sheets/menus-standard-and-blocks.png`, `sheets/menus-clean.png`, raw crops in `popups/`).

**Standard and single-look surfaces:**

| Instance | Radius | Pad | Shadow | Row h / type | Selected |
|---|---|---|---|---|---|
| **breakdown-chart `.ui-bc__menu` :654** (reference) | 12 | 4 | `--tc-shadow-overlay` | 30, 13/500 | accent-text + ✓ |
| billing-schedule `.ui-bs__menu` :763 | 12 | **5** | shadow-overlay | 32, 13.5/400 | ✓ |
| integration-settings `.ui-is__menu` :986 | **14** | **6** | shadow-overlay | 32, 13/400 | accent-text + ✓ |
| comments-panel `.ui-cp__menu` :778 | 12 | 4 | **0 10 28 -8 /.18** | 30, 13/500 | accent-text + ✓ |
| smart-recommendation `.ui-sr__menu` :638 | 12 | 4 | **0 12 30 -8 /.20** | 34, 13/400 | **fill-selected bg** |
| email-draft `.ui-ed__menu` :766 | 12 | 5 | **0 10 30 0 /.10** | 45 (2-line) | ✓ |
| context-map `.ui-cxm__menu` :965 | **16** | 5 | **`--tc-shadow-raised` (no lift)** | 50, r 11, 14/400 | fill-hover bg |
| chat-composer `.ui-chat-composer__menu-panel` :2253 | **≈22–25 (scaled `--u`)** | ≈5 | **1 px border, no shadow** | 46–53 | ✓ |
| combobox `.ui-cbx__card` :1223 | 14 | 0 | ring only | 36, r 9, 13.5 | — |
| command-menu `.ui-cm__card` :785 | 16 | 0 | ring + 0 1 2 | 44, r 10, 13.5 | — |
| block kpi-board `.ui-kb__menu` :841 | **10** | 4 | **1px border + 0 10 28 rgba(16,16,24,.1)** | **30, r 7, 12.5** | well bg (`[data-active]`) |
| block task-board `.ui-tb__menu` :810 | 12 | 6/4 | **ring #e5e5e5** + 0 12 30 -8 /.2 | 30, 13/400 | none (labels) |
| block ai-workspace `.ui-aw__menu` :989 | 12 | 5 | same as task-board | 32, 13/500 | accent-text + ✓ |
| block app-directory `.ui-adir__menu` :699 | 12 | 4 | 0 10 28 -8 /.18 | 32, 13/500 | accent-text + ✓ |
| block client-context `.ui-cx__menu` :1443 | **14** | 5 | shadow-overlay | 36, r 9, 13/400 | fill-hover bg + ✓ |
| screens `.ui-as-menu` (app-shell.tsx:1696) | 12 | 4 | **0 12 32 -8 /.16** | 32, 13/500 | **ink text + ✓ + weight 500** |
| illustrations `.ui-rd-panel` (region-dach.tsx:723), `.ui-wm-panel` (world-map.tsx:659) | **16** | 5 | **1 px border, no shadow** | 32, r 10, 13/500 | ✓ |

- **Hover fills.** Standard uses `--tc-fill-hover` in most places, but hard-coded `#f5f5f5` in task-board (`:838`) and ai-workspace (`:1018`). Those two blocks also carry separate `.dark` overrides with raw `#2a2a2d` (`ai-workspace.tsx:1244`, `task-board.tsx:1038`) instead of `light-dark()` tokens.
- **Clean.** Consistent radius 10, pad 4, `--tc-shadow-overlay`, rows 28–32 with r 6. Two exceptions:
  - context-map again uses `--tc-shadow-raised`, so the menu reads as an inline card rather than floating (`:965`).
  - The hover token varies: `--tc-fill-default` (comments-panel `:922`, breakdown-chart `:739`, integration-settings `:1084` with `!important`), `--tc-fill-hover` (profile-menu `:409`), `--tc-fill-subtle` (smart-recommendation `:709`, prompt-library `:978`, integration-picker `:975`, date-range-picker `:1023`). In Clean, fill-default is 2× fill-hover/subtle (0.06 vs 0.03), so hover strength visibly differs between menus.
- **Section titles inside menus** come in three styles:
  - Standard sentence case: app-shell `.ui-as-menu__title` at 12/500 muted, task-board "Labels" at 12
  - Clean uppercase 10/500/0.5px: combobox group labels, command-menu
  - none at all

**Hand-rolled copies.** Every block menu, the app-shell `Popover`/`MenuList`, and the region-dach/world-map menus are new implementations. None reuses a library primitive, because there is no shared menu primitive in `components/`. Each component also owns its own menu.

**Fix.**
1. Define a menu token set per look:
   - `--tc-menu-radius` (Std 12, Clean 10)
   - `--tc-menu-padding` (4)
   - `--tc-menu-shadow: var(--tc-shadow-overlay)`
   - `--tc-menu-item-h` (Std 32, Clean 28)
   - `--tc-menu-item-radius` (Std 8, Clean 6)
   - `--tc-menu-item-font` (13/400, Std 13/500 for selected)
   - `--tc-menu-item-hover: var(--tc-fill-hover)`
2. Decide one selected treatment: **✓ plus `--tc-text-primary` 500** (app-shell), or **✓ plus `--tc-accent-text`** (breakdown-chart, the majority). Pick one. Keep the fill/outline row treatment only for "recommended" choices, which are a different pattern.
3. Move context-map and chat-composer Standard onto the surface tokens. Chat-composer's `--u` scaling should not apply to the menu, which then also gets its shadow back.
4. Blocks and the app shell consume the tokens. The illustrations may keep their bordered look (they are artwork), but should then not reuse the "menu" affordance.

### H3. Screens restyle library components by reaching into their internal classes

Cross-file selectors (a rule in file A styling a class owned by file B), from the static rule index:

| Where | What it overrides |
|---|---|
| `screens/app-shell.tsx:1164–1179` | agent-plan font size (`.ui-pl`, `.ui-pl__title`); inline-diff `.ui-df__text`, `.ui-df__body` padding, `.ui-df__btn` radius; approval-card `.ui-ap__title` size, `.ui-ap__btn` height 30, padding, radius 10, quiet-button background and shadow, primary background; tool-call-card `.ui-tc` font, `.ui-tc__head` height; usage-meter `.ui-um__action` radius. The comment calls this "the shell's scale: 13–13.5px text, 30px buttons". |
| `screens/app-shell.tsx:1204–1213` | `.ui-button[data-variant=primary]` look (see H1) |
| `screens/app-shell.tsx:1449` | `.ui-sg` (setup-guide) **`zoom: 0.86`**, border, radius and background removed |
| `screens/app-shell.tsx:1694` | `.ui-fm` (filter-menu) **`zoom: 0.9`**, width 340 |
| `screens/assistant-home.tsx:372` | `.ui-think` (thinking-state) **`zoom: 0.92`** |
| `screens/analytics.tsx:353–363`, `screens/evals.tsx:479–496` | kpi-chart `.ui-kpi` shadow, border, radius and internal grid; inline-diff card radius, body padding, text size |
| `screens/crm.tsx:473–568` | data-table `.ui-dt`, `.ui-dt__card` (shadow, border, radius), `.ui-dt__head` padding |
| `screens/settings-billing.tsx:770–786` | usage-meter internal grid (`.ui-um__inner/head/figure/bar/legend/daily/limits`) re-laid out |
| `screens/settings-billing.tsx:868`, `onboarding.tsx:1311` | `.ui-button` width and flex |
| `screens/agent-run.tsx:808,845`, `blocks/ai-workspace.tsx:1040` | agent-plan max-width, approval-card stacking, chat-composer width variable |

**Impact.**
- Approval-card buttons are 34 px in the component but 30 px in agent-run.
- Setup-guide and filter-menu render all their type and controls at 86–90%, which gives 11.2 px and 11.7 px text and 27 px rows, i.e. off every scale.
- Any change to a component's internals silently breaks a screen. The prefix check does not catch this, because the classes are not *defined* twice, only *styled* from outside.

**Fix.** Give the components a `density` or `size` prop, or documented custom properties: `--tc-<comp>-font`, `--tc-<comp>-btn-h` (several already expose `--tc-<comp>-*` colours). Delete the cross-file selectors and all `zoom`. Add a check to `scripts/check-prefixes.mjs` that fails on a selector containing another file's root prefix. The rule index used here (`parse-css.mjs` + owner map) is a ready implementation.

### H4. Status pills and badges: two shapes and five sizes for the same meaning in Standard; blocks and screens add more; three pills ignore the status tokens

`sheets/status-pills-standard-blocks-screens.png`, `sheets/status-pills-clean.png`, full table `chips.txt`.

**Standard.**

| Group | Instances |
|---|---|
| Full pill (r 999), majority | ad `__risk` :504 (20, 11.5/500), pr `__risk` :916 (**22**, **12**), dct `__risk` :1224 (20, 11.5), rvc `__risk` :1979 (20, 11.5), agq `__pill` :1623 (20, 11; "Live" variant **22**, white with ring), agt `__status` :1029 (20, 11), agg `__pill` :1805, tw `__pill` :1037 (22, white with ring), ai `__state` :700 (**24, 12.5**), st `__state` :767 (**26**), pm `__badge` :444, ns `__badge` :370 (22, uppercase, white with ring), sr `__tag` :674 (**16**, 10.5) |
| Rounded rect (r 5–8) | ed `__status`/`__badge` :649/:1165 (19, **r 8**, 12.5), pc `__status` :725 (20, r 5), xc `__tag` :704 (20, r 5), mp `__tag` :1355 (18, r 5), pli `__tag` :983 (18, r 5), seg `__badge` :649 (18, r 6), cw `__model` :914 (20, r 5), dt `__tag` :1560 (**24, r 7, 13/450**) |
| blocks | pricing-plans `__badge` :524 (pill 20), `__tag` :676 (rect 18 r 6) — both in one block; task-board `__prop` :894 (22, r 7, 11.5/**400**, inset ring) |
| screens | settings-billing `.ui-sb-pill` :751 (pill 20, 11.5), onboarding `.ui-ob-tool__state` :1050 (pill **18**), agent-run `.ui-ar__pill` :783 (pill **22, 12**) |

**Colours outside the status and tone tokens.**
- project-card status uses `#f0a020/0.14` on `#96590a`.
- profile-menu "New" uses rose `#e11d48` on `#fff0f3`.
- data-table tags use `#15803d` on `#edfaf3` with ring `#d5f2e2`.
- agent-queue "Running" uses `--tc-blue-50` solid where its sibling agt uses `--tc-accent-subtle`.

**Clean** is near-uniform: 18–20 high, r 4–5, 11–12/500, status tokens. Remaining drift:
- 18 vs 20 heights for equivalent pills: ad/pr risk 18, dct/rvc risk 20.
- r 4 vs 5 vs 6.
- data-table tags keep their own green (`#157a43`) rather than `--tc-status-success-*`.

**Fix.** Define a **Pill/Badge** primitive or token set:
- `--tc-pill-h` (Std 20, Clean 18), `--tc-pill-px` (Std 8, Clean 6), `--tc-pill-radius` (Std `--tc-radius-full`, Clean `--tc-radius-xs`), `--tc-pill-font` (Std 11.5/500, Clean 11/500)
- a `-lg` step (Std 22/12, Clean 20/12) for header and live pills
- tone = `--tc-status-*` or `--tc-tone-*` only

Decide whether Standard *tags* (categorical: pli, xc, dt, pp) are r 6 rectangles while *statuses* are pills. Today the split is per file, not per meaning: email-draft statuses are rectangles, profile-menu's tag is a pill. Add `--tc-tone-amber` and `--tc-tone-rose` if those hues are wanted (project-card, profile-menu).

---

## Findings – Medium

### M1. Text inputs, search fields and selects: one per component, and heights don't line up with the buttons next to them

`sheets/search.png`.

| Instance | h | r | Surface / edge | Type |
|---|---|---|---|---|
| **stepper-form `.ui-sf__input` :1273** (Std reference) | 38 | 10 | white, inset ring + 0 1 2 | 13.5 |
| integration-settings `.ui-is__field` :919 | **42** | **11** | white, ring **#e2e2e2** (hard-coded) | 16(inherited) |
| billing-schedule `.ui-bs__input` / `__select` :689 | **40** | 10 | white, inset ring + 0 1 1 | 14 / 13 |
| combobox `.ui-cbx__field` :1039 | 40 | **12** | white, outer ring + 0 1 2 | 13.5 |
| agent-steering `.ui-st__field` :852 (textarea) | 42 | **14** | white, ring | 14 |
| writing-assistant `.ui-wa__field` :921 | 54 | **27 (pill)** | white, ring + drop shadow | — |
| prompt-library `.ui-pli__search` :944 | **30** | 8 | **sunken fill #f4f4f5, no edge** | 13 |
| integration-settings menu search `.ui-is__menu-search` :998 | 34 | 9 | sunken fill #f0f0f0 | 13 |
| integration-picker `.ui-ip__search` :904 | (inline, no box) | – | – | 12.5 |
| block app-directory `.ui-adir__search` :653 | 38 | 11 | white, ring | 16 |
| block client-context `.ui-cx__search` :1613 | 34 | 10 | fill .03 + inset ring | 13 |
| block task-board `.ui-tb__search` :793 | 30 | 9 | **#f5f5f5 fill, no edge** | 16 |
| block ai-workspace `.ui-aw__search` :902 | 34 | 10 | **#ebebeb fill** | 16 |
| screens `.ui-as-search` (app-shell.tsx:1623) | 32 | 9 | white, outer ring + control shadow | 13 |
| screens `.ui-asw__address` (app-shell-workspace.tsx:106) | 34 | 10 | white, inset ring | 13 |

- **Two search styles coexist with no rule:** a white field with a ring, and a sunken grey field. Even the sunken ones use three different greys: #f4f4f5, #f0f0f0 and #f5f5f5/#ebebeb.
- **Focus treatments also differ:**
  - the app-shell search gets ring `--tc-border-strong` plus a 3 px rgba halo
  - most component fields get hover `--tc-border-strong` only, with no visible focus state other than the global outline (the WCAG audit covers focus visibility)
  - ai-workspace and agent-steering set `outline: none` on focus-visible (`ai-workspace.tsx:916`, `agent-steering.tsx:863`)
- **Clean** fields are uniform: 32 × 8, `--tc-shadow-raised`, hover `--tc-shadow-raised-hover` (bs, cbx, is, sf). Exceptions are prompt-library search (28 × 6, hairline inset) and agent-steering (36 × 8, fill .03 plus inset hairline), which are acceptable as "inline" fields. Note Clean fields are **32 high next to 28 high Clean buttons**. That may be deliberate, but it should be a token decision, not a coincidence.

**Fix.** Use `--tc-field-h` (Std 36 or 40, Clean 32), `--tc-field-radius` (Std 10, Clean 8), `--tc-field-bg: var(--tc-surface-raised)`, `--tc-field-shadow` (Std: inset ring `--tc-border-default` plus `--tc-shadow-control`; Clean: `--tc-shadow-raised`), `--tc-field-shadow-hover`, and `--tc-field-shadow-focus` (ring `--tc-focus-ring` at 1 px plus a 3 px `--tc-accent-subtle` halo). Allow one documented `search--sunken` variant using `--tc-fill-default`. Replace the raw #f4f4f5, #f0f0f0, #f5f5f5, #ebebeb and #e2e2e2.

### M2. Segmented controls and tabs: the SegmentedControl component exists, and seven components plus three blocks re-implement it

`sheets/seg.png`.

**Reference.** SegmentedControl `.ui-seg__track` / `.ui-seg__opt` (`segmented-control.tsx:562/579`). In Standard it has three sizes: 26/30/36 tracks, option radius 7/8/9, 12.5–14 px. In Clean it has 24/28/32 tracks, option r 6, 13/500, and the selected option is a hairline raised chip.

| Copy | Track h × r | Track fill / edge | Option |
|---|---|---|---|
| compact-breakdown `.ui-cb__switch` :465 | 28 × 10 | #f0f0f0 + inset ring | 24 × **8**, 12/500 |
| date-range-picker `.ui-drp__segments` :1122 | 28 × 9 | **white + outer ring** | 24 × 7, 12/**400** |
| model-picker `.ui-mdp__segmented` :876 | 28 × 9 | #f4f4f5 + inset ring | 24 × 7 |
| usage-meter `.ui-um__switch` :904, experiment-card `.ui-xc__switch` :714 | 30 × 10 | #f0f0f0 + inset ring | 26 × 8 |
| autonomy-dial `.ui-ad__segmented` :462 | **36 × 12** | #f0f0f0, no ring | 30 × 9, 13/500 |
| permission-request `.ui-pr__scopes` :949 | 36 × 12 | **#e6e6e6** | 30 × 9 |
| comments-panel `.ui-cp__tabs` :741 | no track | separate **white chips with ring** | 30 × 9 |
| memory-panel `.ui-mp__chips` :1303 | no track | filter chips #f4f4f5 + ring | 26 × 8 |
| block client-context `.ui-cx__seg` :1577 | 34 × 10 | fill .05 | 28 × 7, 12.5/500 |
| block invoice-credit `.ui-iv__seg` :505 | 36 × 10 | fill .05 | 30 |
| block pricing-plans `.ui-pp__switch` :467 | 36 × 10 | fill .05 | 30 × 8, 14/400 |
| screens Tabs `.ui-as-tabs` (app-shell.tsx:1549) | none; sliding grey pill under the tab | – | 32 × 9, 13.5/400 |
| screens ViewToggle `.ui-as-view` (app-shell.tsx:1590) | 32 × 9 | fill .05 | 28 × 7 |

- Track fill takes five values: #f0f0f0, #f4f4f5, #e6e6e6, white, and `--tc-fill-default`.
- The selected segment has three treatments: a white raised chip (most), a grey pill (app-shell Tabs), and white with a ring (comments-panel).
- Screens use SegmentedControl and the app-shell Tabs side by side, and they look different (`settings-billing`: tabs at 32/13.5 above a SegmentedControl sm at 26/12.5).
- **Clean** copies match SegmentedControl in geometry (24/28/32, r 6). Only memory-panel chips differ, being filled instead of transparent, which is a different pattern (filter chips).

**Fix.** Replace the copies with `<SegmentedControl size>`, or expose `--tc-seg-track-bg` (`--tc-fill-default`), `--tc-seg-track-radius` (Std 10 / Clean 8), `--tc-seg-pad` (2–3), and `--tc-seg-thumb` (`--tc-surface-raised` plus `--tc-shadow-control`). Decide whether "tabs" (app-shell, comments-panel) are a separate pattern with their own token set. If they are, give them a component.

### M3. Switches: six Standard sizes, two "on" colours; two Clean shapes

`sheets/switch.png`.

- **Standard sizes:**
  - 28 × 16: memory-panel `.ui-mp__track` :1278, model-picker `.ui-mdp__switch` :862, block metrics-dashboard `.ui-md__switch` :874
  - 30 × 18: delegate-board `.ui-db__switch` :756, screens `.ui-as-switch` (agent-chat.tsx:658)
  - 32 × 20: onboarding `.ui-ob-switch` :1063
  - 36 × 22: client-context `.ui-cx__toggle` :1981
  - 38 × 22: integration-picker `.ui-ip__switch` :1100
  - 40 × 24: integration-settings `.ui-is__switch` :681
- **Standard "on" colour:** ink (memory-panel, model-picker, and screens via `--tc-app-shell-switch-on`), `--tc-accent` (integration-picker, integration-settings, delegate-board, metrics), or `--tc-accent-text` (client-context). The off track is `--tc-fill-strong` in components, `#d9d9d9` (metrics) and `--tc-border-strong` (client-context).
- **Clean:** pill 28 × 16 in delegate-board and integration-settings, but **rounded-rect** in integration-picker (32 × 18 r 6, `:1122`), memory-panel and model-picker (26 × 16 r 5 with a square-ish 3.5 px knob, `:1293/:867`). Judgement call: the rect style is probably intentional for Clean, but then all Clean switches should use it.
- **Fix.** `--tc-switch-w/h/knob` (Std 32/20/16; Clean 28/16/12), `--tc-switch-radius` (Std full; Clean pick one), `--tc-switch-on: var(--tc-accent)`, `--tc-switch-off: var(--tc-fill-strong)`. Move screens off ink, or make ink the Standard decision everywhere.

### M4. Key chips (kbd): 5 Standard sizes on 2 surfaces; 3 Clean sizes on 3 surfaces

`sheets/kbd-standard.png`, `sheets/kbd-clean.png`.

| Look | Group | Size | Instances |
|---|---|---|---|
| Standard | raised + ring | 18 × r5, 10.5 | agent-steering :873, combobox :1292, model-picker :901 |
| Standard | raised + ring | 20, 11 | command-menu :867, tips-panel :311 |
| Standard | raised + ring | **22 × r6** (no font size set) | filter-menu :709 |
| Standard | flat `--tc-fill-default` | 18 | decision-tree :1164, review-center :1856 |
| Standard | flat `--tc-fill-default` | 20 × r6, 11 | approval-card :1221, permission-request :976 |
| Standard | flat `--tc-fill-default` | **17 × r4** | inline-diff :1346 |
| Standard | none (bare text) | – | integration-picker `.ui-ip__search kbd` :904 |
| blocks / screens | fill-subtle + inset ring | 20 × r5 | client-context `.ui-cx__hint kbd` :1741 |
| blocks / screens | flat fill-default | r6 | app-shell-workspace `.ui-asw__kbd` :185 |
| Clean | `--tc-shadow-raised` | 16 × r4, 10 | combobox, filter-menu, agent-steering, delegate-board |
| Clean | `--tc-shadow-raised` | 18 × r5, 11 | tips-panel |
| Clean | flat fill | 16–18 | decision-tree, review-center, inline-diff, permission-request |
| Clean | hairline inset `--tc-border-strong` | **20 × r5, 11** | command-menu :884, integration-picker :943, model-picker :903 |

Within one component the kbd also differs between looks in kind, not just size: model-picker is raised in Standard but hairline in Clean. Kbd chips inside primary buttons use four different literal overlays: rgba(255,255,255,.14/.16/.18) and rgba(0,0,0,.1).

**Fix.** `--tc-kbd-h` (Std 18, Clean 16), `--tc-kbd-px` (4), `--tc-kbd-radius` (`--tc-radius-xs`/5), `--tc-kbd-font` (Std 10.5/500, Clean 10/500), `--tc-kbd-bg: var(--tc-surface-raised)`, `--tc-kbd-shadow` (Std inset ring plus 0 1 0; Clean `--tc-shadow-raised`), plus `--tc-kbd-on-inverse-bg` for kbds inside primary buttons.

### M5. Icon buttons: Standard 28 / 30 / 26 / 24 / 22 / 32, radius 6–10; screens have two different ones

Standard sizes:
- 28 × 8 (12 components): agent-steering chip-x, comment-thread, comments-panel, email-draft, data-table, combobox, date-range-picker, notification-stack
- 30 × 8: inline-diff `.ui-df__icon`, message-actions `.ui-ma__btn`, dropzone
- 30 × **9**: agent-steering `.ui-st__icon-btn`, autonomy-dial pin
- 26 × 7/8: setup-guide, memory-panel, integration-picker back
- 24 × 6/7: tool-call-card copy, agent-queue
- 22 × 6: filter-menu
- 32 × **10**: agent-steering send

So **agent-steering alone has 28, 30 and 32 px icon buttons.**

Blocks (ai-workspace `.ui-aw__icon`, task-board `.ui-tb__icon`) are 28 × 8, but task-board styles hover and pressed with raw `#f3f3f3` / `#eef3ff` and `!important` (`task-board.tsx:775–779`). Screens use `.ui-as-icon-btn` (app-shell.tsx:1308, 28 × 8, ghost) for most toolbars *and* `IconButton` → `.ui-as-tool` (app-shell.tsx:1573, 32 × 9, outlined white). Clean is uniform at 28 × 6 (40 instances).

**Fix.** Use Button `icon`-only (`data-icon-only` already exists) with `--tc-control-h-*`. That gives 28 (Std sm) or 24/28 (Clean). The ghost vs outlined choice should be a Button variant, not a per-file class.

### M6. Cards and panels: the Standard reference is clear, but ~25% deviate; screens use the shell radius

**Standard reference.** Radius 16, `--tc-shadow-raised` (ring plus 0 1 2), on 32 components' cards.

- **Deviations** (measured):
  - 11 cards use a **1 px border + 0 1 2 shadow** instead of the ring: decision-inbox, comment-thread, comments-panel, email-draft, smart-recommendation, billing-schedule, breakdown-chart. They render the same at 1×, but stack and clip differently, and hover cannot use `--tc-shadow-raised-hover`.
  - 4 use r 20 with a heavier `0 8 24` shadow: kpi-chart, notification-stack, progress-tracker, setup-guide.
  - Some use r 12 or r 10: agent-tree, delegate-board tasks, decision-tree, review-center rows.
- **Screens and blocks.** Screens use **r 14** (`.ui-as-*__card`, sb-card, ev__card) and override component cards to match (crm data-table, analytics/evals kpi-chart; H3). Blocks use r 12/14/16/20 (kb__card 12, cx__composer 14, adir/md/twl 16, cx__card and aw 20).
- **Clean.** r 10 plus `--tc-shadow-raised` (42 instances). Exceptions:
  - agent-inbox `.ui-ai__card` uses a 1 px Standard ring in Clean
  - approval-card `.ui-ap__card` is r 16 with an inset ring (H1)
  - command-menu and some roots are r 12, pvac and rvc are r 12
  - `scales.md` covers the radius count
- **Fix.** `--tc-card-radius` (Std 16, Clean 10), `--tc-card-shadow: var(--tc-shadow-raised)`, `--tc-card-shadow-hover`, and one `--tc-panel-radius` for the elevated or tray variant. Screens should either adopt 16 or define the shell radius as a token that components read (`--tc-card-radius` set on `.ui-as`), instead of overriding classes.

---

## Findings – Low

- **L1. Avatars.**
  - Person avatars are circles with three colour schemes:
    - accent-tinted: comments-panel :943, comment-thread :544, task-board :889, app-shell user :1939
    - neutral fill: combobox :1125, agent-lanes :714, agent-gallery :572, testimonial-wall :557
    - per-person hue: project-card :761
  - Initials are 7–10.5 px at 500 or 600.
  - Agent avatars are rounded squares with white + ring (agent-tree, decision-tree, review-center, permission-request, delegate-board).
  - Two components switch **shape** between looks: delegate-board `.ui-db__avatar` and agent-lanes `.ui-al__avatar` are circles in Standard and rounded squares in Clean.
  - Fix: `--tc-avatar-size-sm|md` (20/24) and `--tc-avatar-font` (9/600 Std, 9/500 Clean). The rule: people are circles, agents and tools are squares.
- **L2. Section headers and captions.** Clean has a real caption style: uppercase 10/500/0.5px (26 rules). Off-style ones are agent-inbox :682 (11, 0.08em), memory-panel :1343 (`!important`) and trace-waterfall :1203 (0.3px). Standard has none, so group labels are sentence case at 12–13 px with no shared token. The Standard exceptions command-menu :797 (11.5, 0.04em) and notification-stack :370 (11, 0.06em) are uppercase. Blocks use pricing-plans :653 uppercase 12. Fix: `--tc-caption-*` per look (Clean uppercase 10/500/0.5px, Std 12/500 muted sentence case).
- **L3. Progress bars.** Standard tracks are 4 (dropzone, profile-menu, usage-meter thin), 5 (setup-guide :440), 8 (progress-tracker :280, pill radius) and 10 (usage-meter :991). Track fills are `--tc-fill-default`, `--tc-fill-strong` and raw `#efeff1` (usage-meter). Screens add 4 px `--tc-surface-sunken` (app-shell.tsx:1462) and 2 px `--tc-border-default` (evals.tsx:453). Clean is 4 px, except dropzone (2) and usage-meter (8). Fix: `--tc-meter-h` (4, with 8 for hero meters), `--tc-meter-track: var(--tc-fill-default)`.
- **L4. Empty states.** Only the app-shell has an EmptyState (app-shell.tsx:1765: dashed `--tc-border-strong`, r 14, 48 px padding, icon tile, title 14/500, text 13 muted). app-directory :880 (dashed, r 16) and task-board :916 (dashed raw `#d9d9d9`, r 12) re-implement it with other values. client-context :1893 has none of the frame. Components each have bespoke inline empty text. Fix: one EmptyState primitive in `components/` and the dashed-frame tokens.
- **L5. Tooltips.** Two inverse tooltips: kpi-chart :471 Standard is a raised card with border and overlay shadow, while thinking-state `.ui-think__tip` :846 is an ink chip at 12 px, r 6. In Clean the thinking-state tip becomes a white overlay card, so the same component's tooltip changes polarity between looks. Most other "tooltips" are native `title=`. Fix: decide a tooltip token set (`--tc-tooltip-bg: var(--tc-surface-inverse)`, r 6, 12 px, pad 4/8).
- **L6. Dividers.** These are almost all borders on containers, and few `hr` or `role=separator` render. Menu separators: client-context's menu has one (1 px `--tc-border-default` with 4 px margins), app-shell `MenuList` has none, and the profile-menu separator differs per look. Low impact. Fix: `--tc-divider: var(--tc-border-subtle)` with a 4 px menu inset.
- **L7. Raw values and `!important` in blocks.** `!important` counts: ai-workspace 18, app-directory 13, task-board 10, pricing-plans 10, invoice-credit 8. These are mostly on colour and font-size of controls (e.g. `task-board.tsx:775–1012`), and blocks also keep separate `.dark` rules with raw hex (`#2a2a2d`, `#f3f3f3`, `#eef3ff`) instead of `light-dark()` tokens. This makes the drift above hard to fix by token alone.

---

## What is consistent (keep)

- All Clean control geometry: 28/6 controls, r 10 overlays with `--tc-shadow-overlay`, 18–20 pills, `--tc-shadow-raised` cards.
- Standard `--tc-shadow-raised` cards (32 components) and `--tc-shadow-overlay` for the majority of component menus.
- Status colours via `--tc-status-*` in ~85% of pills.

---

## Proposed tokens and scales

These are pattern-level tokens: they sit above the existing primitives and use only existing semantic values.

| Token | Standard | Clean |
|---|---|---|
| `--tc-control-h-sm / md / lg` | 28 / 32 / 40 | 24 / 28 / 32 |
| `--tc-control-radius-sm / md / lg` | 8 / 10 / 12 | 6 / 6 / 6 |
| `--tc-control-font` | 13/500 | 13/500 |
| `--tc-field-h` · `--tc-field-radius` | 36 · 10 | 32 · 8 |
| `--tc-field-shadow` / `-hover` / `-focus` | inset ring default + `--tc-shadow-control` / ring strong / ring `--tc-focus-ring` + 3 px `--tc-accent-subtle` | `--tc-shadow-raised` / `--tc-shadow-raised-hover` / same focus |
| `--tc-menu-radius` · `--tc-menu-padding` · `--tc-menu-shadow` | 12 · 4 · `--tc-shadow-overlay` | 10 · 4 · `--tc-shadow-overlay` |
| `--tc-menu-item-h` · `-radius` · `-hover` · `-selected-color` | 32 · 8 · `--tc-fill-hover` · `--tc-text-primary` (+✓) | 28 · 6 · `--tc-fill-hover` · same |
| `--tc-pill-h` · `-px` · `-radius` · `-font` (+ `-lg`) | 20 · 8 · full · 11.5/500 (22/12) | 18 · 6 · 4 · 11/500 (20/12) |
| `--tc-kbd-h` · `-radius` · `-font` · `-bg` · `-shadow` | 18 · 5 · 10.5/500 · surface-raised · inset ring + 0 1 0 | 16 · 4 · 10/500 · surface-raised · `--tc-shadow-raised` |
| `--tc-switch-w/h/knob` · `-on` · `-off` | 32/20/16 · `--tc-accent` · `--tc-fill-strong` | 28/16/12 · same |
| `--tc-seg-track-bg` · `-radius` · `-pad` · `-thumb` | `--tc-fill-default` · 10 · 2 · surface-raised + shadow-control | `--tc-fill-default` · 8 · 2 · `--tc-shadow-raised` |
| `--tc-card-radius` · `-shadow` · `-shadow-hover` | 16 · `--tc-shadow-raised` · `-hover` | 10 · same |
| `--tc-avatar-sm/md` · `-font` | 20/24 · 9/600 | 20/24 · 9/500 |
| `--tc-caption-*` | 12/500 muted | uppercase 10/500/0.5px |
| `--tc-meter-h` · `-track` | 4 (8 hero) · `--tc-fill-default` | same |
| add `--tc-tone-amber-*`, `--tc-tone-rose-*` | for project-card and profile-menu | – |

Screens: drop the shell scale, or express it as overrides of these tokens on `.ui-as` (e.g. `--tc-card-radius: 14px; --tc-control-h-md: 30px`) so components follow it without class overrides.

## Prioritised fix list

1. **Stop cross-file restyling (H3).** Add the cross-prefix check to `check-prefixes.mjs`. Remove the three `zoom`s, the Button-primary override (`app-shell.tsx:1204`), and the approval-card, inline-diff and tool-call-card overrides (`app-shell.tsx:1164–1179`). Replace them with component props or exposed `--tc-<comp>-*` variables.
2. **Add the control-height/radius tokens and make Button consume them (H1).** Migrate the Standard hand-rolled buttons listed in H1 to `<Button>`. Pick one Standard primary. Scope approval-card per look.
3. **Add the menu token set (H2).** Migrate component menus first (context-map, chat-composer, comments-panel, smart-recommendation, email-draft, integration-settings), then app-shell `Popover`/`MenuList` and block menus. Decide one selected treatment and one hover token.
4. **Add the pill token set (H4).** Unify the risk and status pills across agent components, and move project-card, profile-menu and data-table colours onto status and tone tokens.
5. **Blocks import the library.** Use Button, SegmentedControl (client-context, invoice-credit, pricing-plans) and the field, menu and switch tokens. Remove `!important` and raw-hex `.dark` rules (L7).
6. **Fields (M1), segmented (M2), switches (M3), kbd (M4), icon buttons (M5).** Token-level, mechanical.
7. **Cards (M6), then L1–L6.**

## Evidence files

All in `/private/tmp/claude-501/-Users-adamstavely-Lockin-resolve/79595907-1212-49ec-9fe0-d84778023bc8/scratchpad/design/patterns/`:

- **Crop sheets** (`sheets/`):
  - `menus-standard-and-blocks.png`, `menus-clean.png`
  - `btn.png`, `btn-clean.png`
  - `status-pills-standard-blocks-screens.png`, `status-pills-clean.png`
  - `kbd-standard.png`, `kbd-clean.png`
  - `switch.png`, `seg.png`, `search.png`
  - Each also has an `.html` source; per-crop PNGs are in `crops/<sheet>/`, opened-menu crops in `popups/`.
- **Data:**
  - `inventory.json`: 3,323 rendered instances with computed values
  - `rules.json`: 12,213 CSS rules with file:line
  - `popups.json`
  - `chips.txt`, `btn-handrolled.txt`, `handrolled-static.txt`: grouped tables
- **Scripts:** `collect.mjs`, `parse-css.mjs`, `analyze.mjs`, `btn.mjs`, `chip.mjs`, `crop.mjs`, `compose.mjs`. They need a Vite server on 5532.
