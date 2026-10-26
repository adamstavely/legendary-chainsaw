---
pattern: none
status: stable
related: side-folder, dropzone, empty-calendar
---

## Overview

A glassy blue folder with three documents standing behind a frosted front pocket. Hover it and the pocket tips
forward while each document shifts on its own – a small reward that says “your files live here”. It fills empty
states for file and document views and gives upload areas something friendlier than an icon. `open` holds the
hover look on demand, for example while a file is dragged over a drop target.

## When to use

- An empty folder, project or document list, above the text that says what to add.
- Beside an upload area – set `open` while a file is dragged over it, so the folder answers the drag.
- Onboarding or landing sections about files, storage or documents.

## When not to use

- As the upload control itself – use `dropzone`, and put the folder next to it.
- In a dense list or toolbar where a small icon is enough – the artwork is meant to be seen at card size.
- Showing the files in a folder as a side panel or tab – use `side-folder`.
- An empty schedule or calendar – use `empty-calendar`.

## Anatomy

1. **Folder back** `.ui-fd-back` – the blue back panel with its tab and soft shadow
2. **Document** `.ui-fd-doc--middle` – one of the three sheets that shift when the folder opens
3. **Pocket** `.ui-fd-front` – the frosted front that tips forward on hover or with `open`

## Looks

One look. Colours follow the page theme through `light-dark()`: in dark the paper turns charcoal with light lines,
the folder a deeper blue, and the pocket lets less light through. It works with a `.dark` class, `data-theme`,
`data-tc-theme` or the system setting.

## Keyboard

Nothing to operate – the folder takes no focus. Hover is decoration only; set `open` from your own drag or focus
handling if the open look should follow something else.

## Screen readers

Decorative by default: the host is `aria-hidden="true"` and is skipped. With `label`, the host becomes
`role="img"` named by the label (“Project files”); `label=""` makes it decorative again. Leave it unlabelled when
the text beside it already says what it means.

## Content

- Pair it with a short heading and one line of text that says what belongs here and how to add it.
- Give it a `label` only when the folder carries meaning the text doesn't – a name that repeats the heading is
  noise.

## Do

- Let it scale: it fills its container's width at a 3 : 2 frame, so size the container, not the folder.
- Set `open` while a drag is over the nearby drop target, and clear it when the drag leaves.

## Don't

- Don't make it the only hint that something is droppable – keep a visible text instruction.
- Don't recolour it per page – override the `--tc-glass-folder-*` tokens once, in your theme.

## Example

```html
<div id="upload" style="width: 320px">
  <tc-glass-folder id="folder"></tc-glass-folder>
  <p>No files yet – drop some here.</p>
</div>

<script type="module">
  import "trenchcoat/glass-folder";
  import "trenchcoat/tokens.css";

  const folder = document.querySelector("#folder");
  const target = document.querySelector("#upload");
  target.addEventListener("dragenter", () => (folder.open = true));
  target.addEventListener("dragleave", () => (folder.open = false));
</script>
```

```tsx
import { useState } from "react";
import { GlassFolder } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function EmptyFiles() {
  const [dragging, setDragging] = useState(false);
  return (
    <div onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} style={{ width: 320 }}>
      <GlassFolder open={dragging} />
      <p>No files yet – drop some here.</p>
    </div>
  );
}
```
