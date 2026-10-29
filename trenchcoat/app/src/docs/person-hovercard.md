---
pattern: disclosure
status: new
related: profile-header, person-links, isbn-details, org-chart
---

## Overview

The profile card behind any name. Wrap a name, an avatar or a link to a person, then point at it, focus it or tap it.
A card opens beside it with:

- their picture or initials, name and pronouns, title and team;
- whether they're available, busy, away or offline, as a dot and the word;
- their local time and how far ahead or behind you they are;
- where they are and who they report to;
- Email, Message and View profile, and their links.

The card stays while the pointer is over it, and Escape closes it and returns focus to the name.

Give it the `person`, or a `person-id` that it looks up with `resolve(id, signal)` or the cancelable
`tc-person-lookup` event. Answers are cached by id, and a failed lookup offers Retry. The element never calls a
network itself.

## When to use

- Names in comments, activity feeds, documents and tables, where people want to know who someone is without leaving
  the page.
- Avatars in a list of assignees or reviewers.

## When not to use

- The top of a person's own page – use [Profile Header](#/profile-header).
- A person's ways to get in touch, listed in full – use [Person Links](#/person-links).
- Text that only needs a short explanation – use [Tooltip](#/tooltip).

## Anatomy

1. **Trigger** `.ui-phc__hit` – the page's own link or button, or a button the element lays over plain text
2. **Card** `.ui-phc__pop` – in the top layer, beside the name, flipped and kept inside the window
3. **Head** `.ui-phc__head` – picture or initials, name, pronouns, title and team
4. **Status** `.ui-phc__status` – a dot and the word, with their own note
5. **Details** `.ui-phc__row` – local time, location and manager
6. **Actions** `.ui-phc__actions` – Email, Message and View profile
7. **Links** `.ui-phc__links` – their other pages

## Looks

Standard is a raised card with an overlay shadow; Clean is flatter, with a hairline. Status dots are green
(available), red (busy), amber (away) and an empty ring (offline), each with its word. While a lookup runs, the card
shows the shapes of what's coming.

## Keyboard

| Key | Does |
| --- | --- |
| Tab to the name | Opens the card |
| Tab from the name | Moves into the open card |
| Shift + Tab from the card's first control | Back to the name |
| Enter or Space on plain text | Opens the card and moves into it |
| Escape | Closes the card; focus goes back to the name |

## Screen readers

- The trigger says it opens a dialog (`aria-haspopup`) and whether it's open (`aria-expanded`). Over plain text, the
  element's own button is named by that text.
- The card is a non-modal dialog named by the person's name; while loading it's busy, and its result is announced
  in a polite status line.
- Status is said in words, never by the dot alone; local time reads "4:12 PM local · 1 h ahead".

## Content

- Give `timezone` as an IANA name ("Europe/Stockholm"), not an offset, so daylight saving is right.
- Keep the status note short ("In a review until 4").
- Use links for pages people will want next: their team page, their publications.

## Do

- Wrap the name where it already is – a link to their profile stays a link.
- Cache people across the page with one `resolve`; the card asks once per id.

## Don't

- Put actions in the card that change things without a second look – it closes when the pointer wanders.
- Open it on page load – it's for when someone asks.

## Example

```html
<p>Ask <tc-person-hovercard person-id="mira"><a href="/people/mira">Mira Lindqvist</a></tc-person-hovercard>.</p>
<script type="module">
  const card = document.querySelector("tc-person-hovercard");
  card.resolve = (id, signal) => fetch(`/api/people/${id}`, { signal }).then((r) => r.json());
  card.addEventListener("tc-open", (e) => (location.href = `/people/${e.detail.person.id}`));
</script>
```

```tsx
import { PersonHovercard, type HovercardPerson } from "trenchcoat/react";

export function Name({ person }: { person: HovercardPerson }) {
  return (
    <PersonHovercard person={person} onViewProfile={(p) => console.log("open", p.id)}>
      <a href={`/people/${person.id}`}>{person.name}</a>
    </PersonHovercard>
  );
}
```
