---
pattern: disclosure
status: new
related: text-annotator, tooltip, mention-picker
---

## Overview

Text that mentions books – a reading list, a syllabus, a chat answer – with every ISBN found and marked. Hover a
number for a moment, or focus it, and a card shows the book: its cover, title, authors, publisher, year and pages,
and the ISBN in both its 10- and 13-digit forms with Copy. Only numbers whose check digit is right are marked, so
phone numbers, order references and other lookalikes stay plain text. The app supplies the book details; the
component asks for them, caches them by ISBN and shows loading, an error with Retry, or "No details for this ISBN".

## When to use

- Reading lists, course outlines or citations where people want to know which book a number is without leaving
  the page.
- Model answers that recommend books, so a reader can check each ISBN points at the book the answer names.
- Any text with ISBNs that people copy into another system – the card gives both forms to copy.

## When not to use

- A short help text attached to one control – use `tooltip`.
- Highlighting and commenting on passages of a document – use `text-annotator`.
- Picking a book as a value in a form – use `mention-picker` with your catalogue as its suggestions.

## Anatomy

1. **Text** `.ui-isbn__text` – the passage, shown as written
2. **ISBN** `.ui-isbn__mark` – a valid ISBN, marked and focusable; lookalikes stay plain
3. **Card** `.ui-isbn__pop` – the book's details, opened by hover or focus
4. **Cover** `.ui-isbn__cover` – the cover image, or a book icon when there's none
5. **Both forms** `.ui-isbn__ids` – the ISBN-13 and ISBN-10, each with Copy

## Looks

Standard tints each ISBN with a soft accent fill and a solid underline, and gives the cover a raised shadow. Clean
marks the number with a dotted underline only and frames the cover with a hairline. The card is the shared floating
surface in both looks, with the menu radius and shadow of each.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Onto an ISBN: opens its card. On an ISBN with its card open: into the card (its Copy or Retry buttons), as if the card followed the number; from the card's last button, on to the next ISBN (or out of the text after the last one) |
| Shift + Tab | From the card's first button, back to its ISBN |
| Enter / Space | On an ISBN: opens its card and moves focus into it |
| Escape | Closes the card; focus goes back to its ISBN |

## Screen readers

Each ISBN is a button whose name is the number as written, described as "Book details. Tab moves into them". It
has `aria-haspopup="dialog"` and `aria-expanded`. The card is a non-modal `dialog`, named by the book's title (or
"Book details for ISBN 978…" while loading, on an error or when there are no details), and `aria-busy` while
loading. The Copy buttons are "Copy ISBN-13" and "Copy ISBN-10". A polite status region says:

- the title and authors when the details arrive – "Quiet Interfaces, by Ines Okafor, Tomás Reyes";
- "No details for this ISBN" or "Couldn't load the details.";
- "Copied ISBN-13".

## Content

- `text` is plain text, shown as written with its line breaks. ISBNs are found in it; there's nothing to mark up.
- Give the resolver's books a `title` at least – a book without one counts as no details. `authors` is a list of
  display names; `year` and `pages` are shown as given.
- Covers can be any image URL, including a `data:` URL. They're decorative (the title says which book it is).
- Rename the empty and error messages with `not-found-text` and `error-text` – keep them short and factual.

## Do

- Answer from your own catalogue or an API in `resolve`, and pass the `signal` on so a lookup stops when the
  component leaves the page.
- Return null for numbers your catalogue doesn't know; throw only when the lookup itself failed, so people get Retry.
- Use the `tc-isbn-lookup` event where an app-wide handler already owns the book data.

## Don't

- Don't mark numbers yourself in the text – the component validates them, so a mistyped ISBN isn't presented as a
  book.
- Don't call a slow service for every number on load; the component asks only when a card opens, and caches the
  answer.
- Don't put the ISBN's meaning in the cover alone – always return a title.

## Example

```html
<tc-isbn-details id="reading"></tc-isbn-details>

<script type="module">
  import "trenchcoat/isbn-details";
  import "trenchcoat/tokens.css";

  const reading = document.querySelector("#reading");
  reading.text = "Start with ISBN 978-0-306-40615-7, then the field guide 0-8044-2957-X.";
  reading.resolve = async (isbn13, signal) => {
    const res = await fetch(`/api/books/${isbn13}`, { signal });
    return res.status === 404 ? null : res.json();
  };
  reading.addEventListener("tc-copy", (e) => console.log("copied", e.detail.form, e.detail.text));
</script>
```

```tsx
import { IsbnDetails, type IsbnBook } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const books: Record<string, IsbnBook> = {
  "9780306406157": { title: "Quiet Interfaces", authors: ["Ines Okafor"], publisher: "Harbour Lane Books", year: 2021, pages: 312 },
};

export function ReadingList() {
  return <IsbnDetails text="Start with ISBN 978-0-306-40615-7 before the first session." resolve={(isbn13) => books[isbn13] ?? null} onCopy={(text) => console.log("copied", text)} />;
}
```
