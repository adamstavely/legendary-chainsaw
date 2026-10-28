---
pattern: listbox
status: new
related: profile-header, lineage-graph, team-invite, data-table
---

## Overview

The people linked to a person or an account, one row each. A row shows a picture or initials, the name, the person's
role in the link (“Co-signer”, “Manager”, “Beneficial owner”), an ID or a second line, and how strong the link is –
strong, medium, weak or unknown – written out and drawn as up to three bars, so colour is never the only cue. A row
can carry one extra pill for what matters most, such as “Key link”. The header counts the people and can offer a
“View network” action. Past `max` rows, a “Show all” button reveals the rest. Selecting a row reports it to the page,
which opens that person.

## When to use

- The related parties on a customer, account or case page: directors, owners, guarantors, family, advisers.
- A contact's colleagues and connections in a CRM.
- Anywhere people need to see who is linked to whom, and how strongly, before they open one.

## When not to use

- The whole web of links, several steps out – use a graph such as `lineage-graph`.
- Inviting people to a team – use `team-invite`.
- Many people with many columns to sort and filter – use `data-table`.
- The header of the person's own page – use `profile-header`.

## Anatomy

1. **Count** `.ui-plk__count` – how many people are linked, beside the heading
2. **Network** `.ui-plk__network` – the optional header action, e.g. “View network”
3. **Row** `.ui-plk__row` – one linked person; selected rows are highlighted
4. **Avatar** `.ui-plk__avatar` – the picture, or the name's initials
5. **Role** `.ui-plk__role` – how the person is linked, then the second line
6. **Tag** `.ui-plk__tag` – the optional pill for what matters most about the link
7. **Strength** `.ui-plk__strength` – the strength in words, with bars
8. **Show all** `.ui-plk__more` – reveals the people past `max`, or hides them again

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The rows, tags and strength are the same in both; a strong link's bars use the accent.

## Keyboard

The list is one tab stop, on the selected person or else the first; inside it the arrows move between people.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next person |
| Home / End | Moves to the first or last person shown |
| Enter / Space | Selects the person, or clears the selection if they're selected |
| Escape | Clears the selection |
| Tab | Leaves the list; the next stops are “Show all” and the header action |

## Screen readers

The list is a `listbox` named by the heading, and each person an `option`: it reads the name, the role and second
line, the tag and the strength – “Priya Natarajan, Co-signer · CUS-40377, Medium link”. The selected person is
`aria-selected`. Selecting is confirmed in a polite status message, “Selected Priya Natarajan”, and clearing with
“Selection cleared”. The “Show all” button is `aria-expanded` and controls the list.

## Content

- Write the role from the link's point of view: “Co-signer”, “Beneficial owner”, “Former director”.
- Put an ID, a company or a date in `detail`: “CUS-40377”, “via Larkspur Holdings · 62%”, “Resigned 2023”.
- Use `unknown` when nobody has judged the link yet, rather than guessing `weak`.
- Rename the strengths with `strengthLabels` if your team uses other words, such as “Confirmed” and “Suspected”.

## Do

- Order people by how much they matter to the review, strongest links first.
- Use a tag for the one thing that needs attention, such as a link that's unverified.
- Set `max` to about five on a page with other sections, so the list doesn't push them out of view.

## Don't

- Don't use the tag for the strength – the strength has its own place.
- Don't show people the viewer isn't allowed to open; leave them out of `people`.
- Don't rely on the colours of the avatars – they only tell names apart.

## Example

```html
<tc-person-links id="links" network-label="View network" max="4"></tc-person-links>

<script type="module">
  import "trenchcoat/person-links";
  import "trenchcoat/tokens.css";

  const links = document.querySelector("#links");
  links.people = [
    { id: "p1", name: "Dana Whitfield", role: "Director", detail: "CUS-40218", strength: "strong" },
    { id: "p2", name: "Priya Natarajan", role: "Co-signer", detail: "CUS-40377", strength: "medium" },
  ];
  links.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
  links.addEventListener("tc-action", () => console.log("network"));
</script>
```

```tsx
import { useState } from "react";
import { PersonLinks, type LinkedPerson } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const people: LinkedPerson[] = [
  { id: "p1", name: "Dana Whitfield", role: "Director", detail: "CUS-40218", strength: "strong" },
  { id: "p2", name: "Priya Natarajan", role: "Co-signer", detail: "CUS-40377", strength: "medium" },
];

export function Links() {
  const [selected, setSelected] = useState<string | null>(null);
  return <PersonLinks people={people} max={4} networkLabel="View network" selected={selected} onSelectedChange={setSelected} onNetwork={() => console.log("network")} />;
}
```
