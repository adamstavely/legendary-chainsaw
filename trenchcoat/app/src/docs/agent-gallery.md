---
pattern: carousel
status: new
related: agent-lanes, approval-card, project-card, image-grid
---

## Overview

A showcase of agents as slim vertical panels side by side, each with the same soft gradient artwork in its own
colours. The panel in the middle is open and shows a product screen – the agent's workspace with its numbers and
context feed. Pick a side panel, an arrow button or an arrow key and that agent glides open in the middle while the
current one folds into a slim panel at the side; the caption below names the open agent. The list repeats either
side, so the gallery goes round without an end.

## When to use

- A landing or onboarding page that introduces a set of agents, templates or playbooks.
- A product tour where each item has its own screen to show.

## When not to use

- Managing running agents – use `agent-lanes`.
- Asking a person to approve an agent's action – use `approval-card`.
- A list of projects or items to open – use `project-card`.
- A set of images to browse and compare – use `image-grid`.

## Anatomy

1. **Head** `.ui-ag__head` – the heading and the line under it
2. **Track** `.ui-ag__track` – the panels, three copies in a row, sliding so the open one is in the middle
3. **Panel** `.ui-ag__panel` – the gradient artwork (`.ui-ag__art`); a side panel's button (`.ui-ag__pick`) shows its name
4. **Screen** `.ui-ag__screen` – the open agent's workspace
5. **Caption** `.ui-ag__caption` – the open agent's name and description
6. **Arrows** `.ui-ag__arrows` – Previous and Next

## Looks

One look in both Standard and Clean, as the block it came from. Each agent's `colors` – strong, then soft – paint its
artwork and screen marks. `--tc-agent-gallery-height`, `--tc-agent-gallery-side`, `--tc-agent-gallery-gap` and
`--tc-agent-gallery-open` size the track and panels; `--tc-agent-gallery-move` is the glide's length.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the side panels' buttons, then the arrow buttons |
| Enter / Space | On a side panel: opens that agent |
| ← / → | With focus on the panels: opens the previous or next agent |

When a picked panel's button goes away as it opens, focus moves into the open screen; after the quiet jump back into
the middle copy, focus moves to the same agent's button in view – never to the page.

## Screen readers

The element is a region with the role description "carousel", named by the heading. Each side panel's button is
named "Show <agent>". The open screen is a group named "<agent> workspace"; screens of folded panels and far copies
are hidden and inert. The caption is a polite live region that stays in place, so each newly opened agent is read.
The arrows are named "Previous agent" and "Next agent".

## Content

- Name agents for what they do: "Support triage", "Meeting recap".
- Keep the description to one sentence – it's the caption under the gallery.
- Pick two colours of one hue for each agent – the strong one first.

## Do

- Show five to nine agents, so a few side panels are always in view.
- Control `index` when the page has its own navigation to the same agents.

## Don't

- Don't use it for agents people operate – it's a showcase, the screens are pictures.
- Don't give two neighbouring agents the same colours.

## Example

```html
<tc-agent-gallery id="agents" heading="Agents that run your playbook"></tc-agent-gallery>

<script type="module">
  import "trenchcoat/agent-gallery";
  import "trenchcoat/tokens.css";

  const gallery = document.querySelector("#agents");
  gallery.addEventListener("tc-index-change", (e) => console.log(e.detail.item.name));
</script>
```

```tsx
import { useState } from "react";
import { AgentGallery } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Showcase() {
  const [index, setIndex] = useState(3);
  return <AgentGallery title="Agents that run your playbook" index={index} onIndexChange={setIndex} />;
}
```
