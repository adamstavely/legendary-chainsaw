---
pattern: none
status: new
related: first-use, all-done
---

## Overview

The four kinds of need accessibility serves – visual, hearing, motor and cognitive, each a pastel badge on a soft tile
– above the four principles that serve them: perceivable, operable, understandable and robust. A connector runs from
each principle up to the needs it meets: perceivable to visual and hearing, operable to motor, understandable to
cognitive, and robust to motor and cognitive. It's for an accessibility statement, a design guide or an onboarding step
that explains how the product is built.

## When to use

- The top of an accessibility statement or conformance page.
- A design-system or content guide that introduces the four principles.
- Training or onboarding about accessible work.

## When not to use

- An error or an empty list – use a state illustration such as `something-wrong` or `all-done`.
- As proof of conformance: it says what the product aims for, not what it meets.

## Anatomy

1. **Needs** `.ui-acp-tile` – a soft tile with a pastel badge `.ui-acp-badge` and its icon; the name `.ui-acp-need` under it
2. **Connectors** `.ui-acp-link` – one per principle and need it serves, drawn in one after another, with an arrowhead `.ui-acp-head`
3. **Principles** `.ui-acp-pill` – a pill with the principle's name `.ui-acp-principle`, its first letter picked out `.ui-acp-initial`
4. **Gear** `.ui-acp-gear` – in the cognitive head; it turns a few times and rests
5. **Words** `.ui-acp-caption` – optional words under the drawing, from `caption`

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on. Its frame is 4 : 3, taller
than the 3 : 2 state illustrations, so the words fit.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`. By default it's named by a sentence built from `labels` that says what the connectors show:
"Perceivable serves visual and hearing; Operable serves motor; …". `label` replaces that sentence. Set `decorative` when
the text beside it already says the same, and it's left out of the accessibility tree.

## Content

`labels` holds the eight words drawn in, so a page can translate them; keep each short enough to fit its pill.
`defaultAccessibilityPrinciplesLabels` has the English ones. Give `caption` a line about what people can do, such as
"Built for every ability".

## Do

- Follow it with something people can use: the accessibility settings, or how to report a barrier.
- Keep the claim honest – say what's supported, and what isn't yet.

## Don't

- Don't use it as a badge of compliance.
- Don't shrink it below about 320px wide, where the words get too small to read.

## Example

```html
<tc-accessibility-principles caption="Built for every ability"></tc-accessibility-principles>

<script type="module">
  import "@adamstavely/trenchcoat/accessibility-principles";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { AccessibilityPrinciples } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Statement() {
  return <AccessibilityPrinciples caption="Built for every ability" />;
}
```
