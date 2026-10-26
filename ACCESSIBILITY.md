# Accessibility review

Icon Composer targets WCAG 2.2 Level AA. This is an implementation review and test record, not a certification of full conformance. Reference: https://www.w3.org/TR/WCAG22/.

## Review scope and results

Reviewed the Vue custom element with its bundled reference theme in the Codex in-app browser, on October 25, 2026. Automated scans use axe-core and WCAG 2 A/AA, 2.1 A/AA, and 2.2 AA tags, traversing Shadow DOM. Fourteen states cover default styling, export options, the modifier catalog, icon editing, vector points, brush erasing, rectangle erasing, transforms, drawing coordinates, custom paths, filled shapes, text editing, text colors, and dark background controls.

- Automated scans: zero reported violations in these states at desktop and 320 CSS pixel widths.
- Node regression tests: 28 pass, including reference-theme text contrast of at least 4.5:1 and control boundaries of at least 3:1 on standard editor surfaces.
- Production application and custom-element builds pass.
- At 320 CSS pixels, the editor fits its container without horizontal overflow. The page scrolls vertically. Catalog grids keep a fixed height and support wheel, touch, and keyboard scrolling, including automatically revealing focused icon buttons.
- Keyboard walkthrough verified file-opener reachability, export opening and Escape focus return, inspector arrow-key navigation, path drawing with arrows/Space/Enter, undo/redo, brush stamping, and background Escape dismissal.

Axe marks artboard labels for manual contrast inspection because the grid uses a pseudo-element. These labels now have an opaque reference-theme surface behind them; their accent and muted text colors are covered by theme contrast tests. Symbol-only quick-position controls require manual interpretation: their accessible names describe the direction, and their glyph colors use tested theme tokens. These manual-review entries are not treated as automatic passes for arbitrary host themes.

## Implemented accessibility support

- Native inputs and buttons, named landmarks, editor skip controls, labeled sliders, visible focus, selected/pressed states, and proper tab/panel relationships.
- Separate layer selection and action buttons, without nested interactive controls.
- Keyboard-accessible file input; export disclosure state, initial focus, Escape dismissal, focus return, and inactive editor while export options are open.
- Scoped keyboard shortcuts: typing fields retain native keyboard behavior; movement and deletion apply when the canvas has focus.
- Alternatives to dragging: transform coordinates, path anchor and curve fields, rectangle coordinates, brush spot coordinates, and custom-path point entry. Arrow keys and Space also place drawing points.
- Native browser zoom and pinch zoom remain available. Alt-wheel controls editor zoom; Alt-arrows pan; Fit resets the view.
- Pointer-release point placement, gesture cancellation, undo, and restore controls.
- At least 24 CSS pixel control targets in the reference theme. Small vector handles have equivalent numeric controls.
- Persistent polite status messages with dismissal, input format instructions, reduced-motion support, and forced-colors selected-state outlines.
- Opaque backgrounds behind canvas instructions preserve their readability over user-selected preview colors.
- Paginated, keyboard-accessible catalogs with 24, 48, or 96 icons per page and 104 curated modifiers across seven categories.

## Remaining validation before a conformance claim

1. Test complete workflows with VoiceOver/Safari and NVDA/Firefox or Chrome. DOM/accessibility-tree and keyboard checks do not replace user testing with screen readers, speech control, or switch access.
2. Verify actual 200% and 400% browser zoom, enlarged text, user text-spacing overrides, high-contrast settings, and mobile touch on supported platforms. The 320 CSS pixel reflow check is only one part of these requirements.
3. Repeat contrast, focus, target-size, and reflow checks after mapping `--ic-*` tokens to the host design system. The component intentionally accepts host styles; overriding tokens can invalidate the tested reference theme.
4. Check generated artwork separately for its intended use. Users may intentionally create low-contrast or transparent artwork. Host applications must give exported decorative icons `aria-hidden`, or provide an appropriate accessible name for meaningful icons.
5. The visual canvas currently has instructions and equivalent numeric editing controls, but no complete narrated spatial description of arbitrary artwork. Validate its usability with blind icon authors before making a full-workflow accessibility claim.

## Repeat the checks

Run `npm test` and `npm run build`. Start `npm run dev`, open `/tests/accessibility.html`, and activate **Run accessibility checks**. Results list violations and manual-review entries for every state. Repeat at desktop and 320 CSS pixel widths. This isolated fixture does not load or overwrite the standalone editor's saved composition.
