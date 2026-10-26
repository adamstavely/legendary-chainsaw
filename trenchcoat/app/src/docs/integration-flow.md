---
pattern: none
status: stable
related: integration-beam, integration-grid, enrichment-orbit, integration-picker
---

## Overview

An animated scene for marketing pages and empty states: integration pills turn along a dashed arc, and each one in
turn charges up and sends a beam of light into a central “Data Analysis” hub. It shows, without words, that data
from many tools ends up in one place. The scene goes once round the integrations (at least five turns), then rests
on the centre pill; it only runs while it is on screen, and stays still for people who prefer reduced motion.

## When to use

- A landing or onboarding page explaining that the product pulls data from the tools people already use.
- An empty state before any integration is connected, showing what connecting one will do.

## When not to use

- Letting people pick and connect integrations – use `integration-picker`.
- Showing your product between the tools it connects, with hover and pause – use `integration-beam`.
- A wall of every supported logo – use `integration-grid`.
- An AI step enriching data rather than collecting it – use `enrichment-orbit`.

## Anatomy

1. **Hub** `.ui-if-hub` – “Data Analysis”, where every beam lands
2. **Pill** `.ui-if-pill` – one integration: its logo, a title and its name
3. **Beam** `.ui-if-link` – the light that sweeps from the centre pill to the hub

## Screen readers

The scene is one image (`role="img"`) whose name is `label`, or – when it is unset – a sentence naming the first
three integrations: “Integrations like HubSpot, Gmail and Calendar sending data into a central data analysis hub”.
Everything inside is hidden from assistive technology. Write `label` when the page needs the scene to say
something more specific.

## Example

```html
<tc-integration-flow id="flow" label="Your CRM, inbox and calendar feeding one analysis hub"></tc-integration-flow>

<script type="module">
  import "trenchcoat/integration-flow";
  import "trenchcoat/tokens.css";

  const flow = document.querySelector("#flow");
  const logo = (src) => Object.assign(document.createElement("img"), { src, alt: "" });
  flow.items = [
    { name: "HubSpot", title: "CRM", icon: logo("/logos/hubspot.svg") },
    { name: "Gmail", title: "Inbox", icon: logo("/logos/gmail.svg") },
    { name: "Calendar", title: "Schedule", icon: logo("/logos/calendar.svg") },
    { name: "Slack", icon: logo("/logos/slack.svg") },
    { name: "Notion", icon: logo("/logos/notion.svg") },
  ];
</script>
```

```tsx
import { IntegrationFlow } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Hero() {
  return (
    <IntegrationFlow
      label="Your CRM and inbox feeding one analysis hub"
      items={[
        { name: "HubSpot", title: "CRM", icon: <img src="/logos/hubspot.svg" alt="" /> },
        { name: "Gmail", title: "Inbox", icon: <img src="/logos/gmail.svg" alt="" /> },
      ]}
    />
  );
}
```
