---
pattern: button
status: stable
related: integration-grid, integration-picker, integration-settings
---

## Overview

Your product in the middle, the tools it connects on either side, joined by curved beams. In sync cycles, soft
light pulses travel from the tools on the left into your product and on to the tools on the right, and each arrival
makes its target glow – data moving through your product, shown rather than told. Pointing at a tool brings its beam
forward; clicking it pauses that tool and the chip under your product counts what's still connected. On narrow
widths the tools stack above and below, and the beams bend into their new places.

## When to use

- A landing or feature section that explains how your product sits between two sets of tools.
- The header of an integrations or sync page, above the real settings.
- Onboarding, to show what will happen once the tools are connected.

## When not to use

- Connecting, disconnecting or configuring real integrations – the toggles only change the picture; use
  `integration-picker` or `integration-settings`.
- Showing many integrations at once – it is built for about three on each side; use `integration-grid`.

## Anatomy

1. **Tool** `.ui-ib__tool` – a tool's tile, a toggle button that pauses or reconnects it; its name shows on hover
2. **Beam** `.ui-ib__line` – the curve from a tool to your product, with pulses travelling along it
3. **Product** `.ui-ib__center` – the dark tile with your mark in the middle
4. **Status** `.ui-ib__chip` – “Syncing…”, “6 connected” or “All paused”, under your product

## Looks

One look. Colours follow the page theme through `light-dark()`, so it works with a `.dark` class, `data-theme`,
`data-tc-theme` or the system setting. A paused tool turns grey and its beam turns to a faint dashed line; the beam you
point at or focus brightens while the others dim.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the tools, left to right; a focused tool brings its beam forward and shows its name |
| Enter / Space | Pauses the focused tool, or connects it again |

## Screen readers

The host is a `group` named by `label`, or by your product and the tools (“Acme connected to Slack, Notion, …”).
Each tool is a toggle button named with its state (“Slack, connected”) and `aria-pressed`. A polite live region
says what a click did: “Slack paused. 5 of 6 connected.” The beams, pulses and logos are hidden.

## Content

- Name every tool and your product the way people know them – the names are the only text screen readers get.
- Put the tools that send data on the left (`left`) and those that receive it on the right (`right`).
- Set `label` when a sentence says it better than the list of names (“Acme syncs your CRM to your inbox”).

## Do

- Keep three tools on each side – that's what the curves are drawn for.
- Pass logos as `<svg>` elements; they fill a 28 × 28 box, your mark a 36 × 36 box.
- Let the pulses rest: they run a few cycles each time the scene comes into view, and stay off with reduced motion.

## Don't

- Don't wire the toggles to real connections – pausing here changes nothing outside the picture.
- Don't put it where people have to read something else at the same time – the motion pulls the eye.

## Example

```html
<tc-integration-beam id="beam"></tc-integration-beam>

<script type="module">
  import "trenchcoat/integration-beam";
  import "trenchcoat/tokens.css";

  const logo = (src) => Object.assign(new Image(28, 28), { src, alt: "" });
  const beam = document.querySelector("#beam");
  beam.left = [{ name: "Slack", logo: logo("/logos/slack.svg") }, { name: "Gmail", logo: logo("/logos/gmail.svg") }];
  beam.right = [{ name: "Notion", logo: logo("/logos/notion.svg") }, { name: "Linear", logo: logo("/logos/linear.svg") }];
  beam.center = { name: "Acme" };
  beam.addEventListener("click", (e) => {
    const tool = e.target.closest("button");
    if (tool) console.log(tool.getAttribute("aria-label"));
  });
</script>
```

```tsx
import { IntegrationBeam, type BeamTool } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const logo = (src: string) => <img src={src} alt="" width={28} height={28} />;

const left: BeamTool[] = [
  { name: "Slack", logo: logo("/logos/slack.svg") },
  { name: "Gmail", logo: logo("/logos/gmail.svg") },
];
const right: BeamTool[] = [
  { name: "Notion", logo: logo("/logos/notion.svg") },
  { name: "Linear", logo: logo("/logos/linear.svg") },
];

export function SyncHero() {
  return <IntegrationBeam left={left} right={right} center={{ name: "Acme" }} label="Acme syncs your chat and mail to your docs" />;
}
```
