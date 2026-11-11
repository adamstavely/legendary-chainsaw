---
pattern: none
status: new
related: team-roster, person-hovercard, tag-input, list-motion
---

## Overview

An overlapping row that fans apart: the reviewers on a case as initials, a pile of file chips, a few tags. The items overlap, the first on top. Hovering, or moving focus in, spreads them so each one can be seen, and each lifts a little as the pointer passes. Past `max` the rest become a "+N" count.

## When to use

- Showing who's involved in something in little space, such as the reviewers on a case.
- A few attachments or tags in a dense row.

## When not to use

- A list people need to read in full – use `team-roster`.
- Tags people add and remove – use `tag-input`.
- Details about one person – use `person-hovercard`.

## Anatomy

1. **Row** `[data-ui="sspr"]` – the labelled group
2. **Item** `[data-sspr-item]` – your own items; the ones past `max` have `data-sspr-over` and are hidden
3. **Count** `.ui-sspr__more` – "+N" for the items past `max`

## Looks

No look of its own. The items keep theirs; a ring in the surface colour (`box-shadow: 0 0 0 2px var(--tc-surface-raised)`) separates overlapping avatars. A page can override `--tc-sspr-overlap` (`--tc-space-2-5`), `--tc-sspr-gap` (`--tc-space-1`) and `--tc-sspr-lift` (`--tc-space-0-5`). It follows `--tc-duration-moderate` and `--tc-ease-move`. Spreading moves the items towards the end of the line without moving anything around it, so leave room after it. With reduced motion nothing fans: the items sit apart with a small gap. Right to left, it fans to the left.

## Keyboard

| Key | What it does |
| --- | --- |
| Tab | Into the items' own controls, or onto the row when no item takes focus; either fans it |
| Escape | Gathers it; it stays gathered until focus or the pointer leaves |

## Screen readers

The row is a group named by `label` ("Items" by default; name it, such as "Reviewers"). The items keep their own names – give initials an accessible name, such as `role="img"` with the person's name, or screen-reader text inside a button. The count reads as "+2 more". Gathered, the overlapping items aren't pointer targets of their own; the pointer reaches the row, which fans them first.

## Content

Use items of the same size. Keep `max` to what fits gathered, usually 3–5.

## Do

- Give every item an accessible name.
- Put the most relevant item first; it sits on top.

## Don't

- Don't use it for long lists. Past a handful, a list reads better.
- Don't hide something people must see in the overflow count.

## Example

```html
<tc-stack-spread label="Reviewers" max="4">
  <span role="img" aria-label="Ama Owusu">AO</span>
  <span role="img" aria-label="Tomás Reyes">TR</span>
  <span role="img" aria-label="Mei Lin">ML</span>
</tc-stack-spread>

<script type="module">
  import "@adamstavely/trenchcoat/stack-spread";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { StackSpread } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Reviewers({ people }: { people: { id: string; name: string; initials: string }[] }) {
  return (
    <StackSpread label="Reviewers" max={4}>
      {people.map((p) => (
        <span key={p.id} role="img" aria-label={p.name}>{p.initials}</span>
      ))}
    </StackSpread>
  );
}
```
