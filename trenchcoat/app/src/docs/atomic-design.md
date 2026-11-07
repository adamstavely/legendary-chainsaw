---
pattern: none
status: new
related: accessibility-principles, first-use
---

## Overview

Atomic design, one stage at a time. `stage` picks the drawing:
- `overview` – the five stages in a row, atoms to pages, under a line from abstract to concrete.
- `atoms` – a label, an input and a button, each tagged.
- `molecule` – those three joined into a search form, with tags leading to each part.
- `organism` – a site header holding a logo, links and the search form.
- `template` – the page's layout in placeholders.
- `page` – the same layout with its content: pictures, a headline and a video.

The same parts carry from stage to stage, so a talk, a design-system guide or onboarding can step through them.

## When to use

- A design-system site's introduction to how its components build up.
- A guide or talk that walks from small parts to whole pages.

## When not to use

- Showing a real component: put the component itself on the page.
- An empty or error state – use a state illustration such as `first-use` or `something-wrong`.

## Anatomy

1. **Tiles** `.ui-atd-tile` – the soft tiles and cards each stage is drawn on
2. **Mark** `.ui-atd-mark` – the amber pastel parts: nuclei, the button, the logo
3. **Tags** `.ui-atd-tag` – the names of the parts, with dashed leads `.ui-atd-dash` to them
4. **Placeholders** `.ui-atd-dash` – the template's dashed frames, where content will go
5. **Pictures** `.ui-atd-sky`, `.ui-atd-hill` – the page's soft landscapes
6. **Words** `.ui-atd-caption` – optional words under the drawing, from `caption`

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own. Its frame is 4 : 3, like `accessibility-principles`, so the words
fit; each stage's parts rise in one after another when it appears.

## Keyboard

Nothing to operate. The illustration takes no focus. A page that steps through the stages provides its own control,
such as a segmented control.

## Screen readers

The host is `role="img"`, named by a sentence for the stage – "Atoms: a label, an input and a button." – built from
`labels`. `label` replaces the sentence. Set `decorative` when the text beside it already says the same.

## Content

`labels` holds every word drawn in – the stage names, the tags, and the content in the parts (the search label, the
placeholder, the button, four links and the headline) – so a page can translate them. Keep them short: the links share
the room between the logo and the search form. `defaultAtomicDesignLabels` has the English ones.

## Do

- Step through the stages in order, so each builds on the last.
- Pair each stage with a sentence on what it adds.

## Don't

- Don't use it below about 320px wide, where the small words get hard to read.
- Don't use it as a component inventory: it's a picture of the idea.

## Example

```html
<tc-atomic-design stage="molecule"></tc-atomic-design>

<script type="module">
  import "@adamstavely/trenchcoat/atomic-design";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { AtomicDesign } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Stage() {
  return <AtomicDesign stage="molecule" />;
}
```
