---
pattern: none
status: new
related: blur-crossfade, shared-element, stepper-form, collapse
---

## Overview

Moves between views by sliding them side by side. Change `view` and the old view slides out – a little behind, fading,
for a touch of depth – as the new one slides in from the side you're heading, while the box's height glides to fit.
Going forward brings the new view in from the end, going back from the start; the direction comes from `direction`,
or from where the two views sit in `order`. Give it every view as a child marked `data-view`, or only the current one
and swap it yourself – in React, render the current view inside `PageSlide`. When focus was inside the old view it
moves into the new one, and with `focus-heading` the new view's heading takes focus after every change, so
screen-reader users land on the new step. For people who ask for reduced motion, the views switch at once.

## When to use

- The steps of a short wizard – scope, evidence, sign-off – with Back and Next.
- Drilling from a list into an item's view and back, inside a panel or a card.
- Switching between sibling pages in a side pane.

## When not to use

- A status or a label that changes in place – use `blur-crossfade`.
- A card that grows into its own detail view – use `shared-element`.
- A long form with its steps listed – use `stepper-form`.
- Showing or hiding a section – use `collapse`.

## Keyboard

Nothing to operate – your Back and Next buttons change `view`. When the change removes the element that had focus,
focus moves to the new view's heading (with `focus-heading`) or its first control, so it never drops to the page.

## Screen readers

Only the new view is read: the old one is `aria-hidden` and inert while it slides out, then hidden. With
`focus-heading` the new view's heading is focused, which reads it out; without it, say what changed in a live region
of your own if it matters.

## Do

- Give every view a heading and set `focus-heading` for step-by-step flows.
- Pass `order` (or use `data-view` children in order) so Back slides the right way.
- Keep the views about the same width; the height is what glides.

## Don't

- Don't change `view` on a timer – people lose their place.
- Don't use it for the page's main routing; it's for a view inside a panel or card.

## Example

```html
<tc-page-slide view="scope" focus-heading>
  <section data-view="scope"><h3>Scope</h3><p>Vendor payments, July to September.</p></section>
  <section data-view="evidence"><h3>Evidence</h3><p>38 payments still need an invoice.</p></section>
  <section data-view="sign-off"><h3>Sign-off</h3><p>Reviewer: Audit team B.</p></section>
</tc-page-slide>
<button type="button" id="next">Next</button>

<script type="module">
  import "@adamstavely/trenchcoat/page-slide";
  import "@adamstavely/trenchcoat/tokens.css";

  const steps = ["scope", "evidence", "sign-off"];
  const slide = document.querySelector("tc-page-slide");
  document.querySelector("#next").addEventListener("click", () => {
    slide.view = steps[Math.min(steps.indexOf(slide.view) + 1, steps.length - 1)];
  });
</script>
```

```tsx
import { useState } from "react";
import { PageSlide } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const STEPS = ["Scope", "Evidence", "Sign-off"];

export function ReviewWizard() {
  const [at, setAt] = useState(0);
  return (
    <div>
      <PageSlide view={STEPS[at]} order={STEPS} focusHeading>
        <h3>{STEPS[at]}</h3>
      </PageSlide>
      <button type="button" disabled={at === 0} onClick={() => setAt(at - 1)}>Back</button>
      <button type="button" disabled={at === STEPS.length - 1} onClick={() => setAt(at + 1)}>Next</button>
    </div>
  );
}
```
