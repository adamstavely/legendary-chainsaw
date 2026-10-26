# Accessibility

Accessibility is part of every component's definition of done, not a later pass.

## What every component guarantees

- **Keyboard:** everything a pointer can do, a keyboard can do, following the matching WAI-ARIA pattern. Each
  component's page lists its keys.
- **Focus:** a visible focus ring; focus never falls to the page when the focused item is removed – it moves to the
  nearest sensible place.
- **Names and roles:** every control has an accessible name; state is exposed (`aria-expanded`, `aria-selected`,
  `aria-pressed`…).
- **Announcements:** changes a sighted person would notice are announced politely, once – not on every frame.
- **Contrast:** text at least 4.5:1, controls and focus at least 3:1, in both looks and both themes.
- **Not colour alone:** good, bad and status carry an icon, a shape or words as well as a colour.
- **Forced colours and reduced motion** are supported.
- **Target size:** small targets keep 24 px of spacing between them.

## How it's checked

| Check | Where |
|---|---|
| axe (WCAG 2.2 A and AA) on every gallery entry, both looks, light and dark | Chromium, Firefox and WebKit – `scripts/a11y.mjs` |
| axe and the keyboard pattern in each component's browser tests | `tests/elements/` in three engines, in CI |
| Forced colours on every control: borders, Highlight, focus outlines | `scripts/forced-colors.mjs` |
| Token contrast pairs | `npm run check:contrast` in CI |

## Not yet covered

- **Screen readers.** No component has been tested by a person with VoiceOver, NVDA or JAWS. The automated checks
  cover roles, names, `aria-activedescendant` targets and live regions – not what a screen reader actually says.
- Angular and Svelte templates aren't type-checked against the elements.
