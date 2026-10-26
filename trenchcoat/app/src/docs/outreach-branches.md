---
pattern: none
status: stable
related: integration-beam, lead-sourcing, integration-flow, agent-team
---

## Overview

A small scene for multi-channel outreach: three lines branch out from one point and lead down to Gmail, Slack and
Notion tiles. Soft coloured pulses run down each line, one after another, then split at the tile and trace both of
its sides. The pulses run three rounds and rest, so the scene doesn't keep moving beside text people are reading. It
is drawn at 3 : 2 and scales to the width it's given.

## When to use

- A feature card or landing section about sending one message to several channels at once.
- An empty state for an outreach or campaigns feature, before anything has been sent.

## When not to use

- Your product in the middle of the tools it connects – use `integration-beam` or `integration-flow`.
- One source feeding two others – use `lead-sourcing`.
- A prompt handing work to several agents – use `agent-team`.

## Screen readers

Decorative by default: the element is hidden from assistive tech. Give it a `label` and it becomes an image with that
name. Reduced motion leaves the pulses out and shows the still scene.

## Content

- Write `label` as what the scene shows, in a sentence: “Outreach across Gmail, Slack and Notion”.
- Leave it unlabelled when the heading next to it already says the same.

## Example

```html
<tc-outreach-branches id="art" style="width: 320px"></tc-outreach-branches>

<script type="module">
  import "trenchcoat/outreach-branches";
  import "trenchcoat/tokens.css";

  document.querySelector("#art").label = "Outreach across Gmail, Slack and Notion";
</script>
```

```tsx
import { OutreachBranches } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function OutreachCard() {
  return <OutreachBranches label="Outreach across Gmail, Slack and Notion" style={{ width: 320 }} />;
}
```
