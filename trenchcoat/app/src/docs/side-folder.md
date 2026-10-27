---
pattern: none
status: stable
related: glass-folder, layer-stack, cover-flow
---

## Overview

A glassy blue folder turned on its side, with three documents peeking out to the right from behind a frosted front
pocket. Point at it and the pocket swings forward while each document slides further out on its own. It gives a
files, documents or shared-space feature a friendly, tactile picture – on a feature card, an empty state or an
onboarding step.

## When to use

- An empty state for documents or shared files (“Nothing shared yet”).
- A feature card about storing, sharing or organising documents.
- A spot where a small moment of delight on hover suits the product's tone.

## When not to use

- A folder that can be held open on demand, e.g. while it's a drop target – use `glass-folder`, which has `open`.
- Showing layers or versions stacked on top of each other – use `layer-stack`.
- Browsing real files or covers people can pick from – use `cover-flow`.

## Anatomy

1. **Back** `.ui-sfo-back` – the folder's back panel
2. **Document** `.ui-sfo-doc` – one of the three documents that slide out
3. **Pocket** `.ui-sfo-front` – the frosted front pocket that swings forward

## Keyboard

Nothing to operate: the folder isn't focusable, and the documents slide out on pointer hover only.

## Screen readers

Decorative by default: the host is `aria-hidden`. Give it a `label` and it becomes an image (`role="img"`) named by
that label.

## Content

- Write the `label` as what the folder stands for in context – “Shared documents” – not “Folder illustration”.
- Let the heading and text beside it say what's in the space; the documents are blank on purpose.

## Do

- Let it fill the width of its container – it keeps a 3 : 2 frame and scales every detail with it.
- Put it on a light surface or a tinted panel; on a dark page the paper dims a little to match.

## Don't

- Don't rely on the hover to tell people anything – touch and keyboard users never see it.
- Don't recolour the folder per file type; it's one illustration, not an icon set.

## Example

```html
<tc-side-folder label="Shared documents"></tc-side-folder>

<script type="module">
  import "trenchcoat/side-folder";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { SideFolder } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function NoSharedFiles() {
  return (
    <div style={{ width: 280, textAlign: "center" }}>
      <SideFolder />
      <p>Nothing shared yet – files your team shares land here.</p>
    </div>
  );
}
```
