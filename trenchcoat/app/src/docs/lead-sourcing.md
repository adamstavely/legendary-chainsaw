---
pattern: none
status: stable
related: integration-beam, integration-flow, logo-cluster
---

## Overview

A small card illustration: a ChatGPT tile in the middle, linked to Gmail on the left and Grok on the right, with
four empty tiles fading out around it. A coloured shine runs along the connecting line three times and then rests.
It says “these sources feed this assistant” at a glance – for a feature card, an empty state or an onboarding step
about where leads come from. The shine pauses while the illustration is off screen and is left out for people who
ask for reduced motion; its colours follow the page's light or dark theme.

## When to use

- A feature or marketing card about pulling leads or data from several apps into an AI assistant.
- An empty state or onboarding step that explains a connection before anything is connected.
- Anywhere a quiet, decorative scene helps more than a diagram.

## When not to use

- Your own product between the tools it connects, with pulses people can focus and pause – use `integration-beam`.
- Many integrations feeding one analysis hub – use `integration-flow`.
- Your mark surrounded by the companies that use it – use `logo-cluster`.

## Screen readers

Decorative by default: the host is `aria-hidden`. Give it a `label` and it becomes an image (`role="img"`) named by
that label – do that when the scene says something the text around it doesn't.

## Content

- Write the `label` as what the scene shows in context: “Leads sourced from Gmail and Grok”, not “Illustration”.
- Keep the copy next to it about the outcome; the picture carries the apps.

## Do

- Set `neutral` for client-facing work: it draws plain marks in place of third-party logos.
- Let it fill the width of its container – it keeps a 3 : 2 frame and scales its art.
- Leave it decorative when a heading next to it already says the same thing.

## Don't

- Don't use it to claim an integration the product doesn't have – the logos are fixed.
- Don't place it where the moving shine competes with a task people are doing.

## Example

```html
<tc-lead-sourcing label="Leads sourced from Gmail and Grok"></tc-lead-sourcing>

<script type="module">
  import "trenchcoat/lead-sourcing";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { LeadSourcing } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function SourcesCard() {
  return (
    <figure style={{ width: 320, margin: 0 }}>
      <LeadSourcing label="Leads sourced from Gmail and Grok" />
      <figcaption>Leads from your inbox and from Grok, in one place.</figcaption>
    </figure>
  );
}
```
