---
pattern: disclosure
status: new
related: identifier-details, coordinate-details, isbn-details, person-links, contact-channels
---

## Overview

Text that mentions people and places to reach – a hand-over note, a ticket, a chat message, a model's answer – with
every email address, phone number, link and @handle found and marked. Hover one for a moment, focus it or right-click
it, and a card shows what it is: an address's mailbox and domain with Write email, a number's country and Call, a
link's site and path with Open (and a warning when it isn't encrypted), a handle's server – each with Copy – and
whatever your app knows about it: a name, a picture, a sentence, more facts and links.

It reads addresses, international numbers ("+44 20 7946 0958", "+14155550142") and national ones with ten or eleven
digits ("(555) 010-4477", "020 7946 0958"), http and https links and bare "www." ones, and handles ("@ops_lead",
"@analyst@social.example.org"). Dates, version numbers, IP addresses, card numbers, long ids and the @ inside an
address stay plain text.

## Using it in an app

- **Wrap the text you already show.** Pass plain text as `text`; the component finds everything itself.
- **Hand it your directory.** `resolve(kind, value, signal)` looks the address, number, link or handle up in whatever
  you have – a staff directory, a CRM, an allow-list of sites – and returns `{ name, summary, avatar, fields, links }`,
  or null. It's only asked when a card opens, and the answer is cached.
- **Pick the kinds.** `kinds` limits what's marked – only email addresses in a support inbox, only links in a chat.
- **Use `identifier-details` beside it** for technical ids in the same text (IP addresses, hashes, CVEs, DOIs), and
  `coordinate-details` for positions.

## When to use

- Notes, tickets and messages where readers want to know who an address or number belongs to without leaving the page.
- Model answers that cite links or contacts, so a reader can see where a link really goes before opening it.
- Anywhere people copy contact details into another tool.

## When not to use

- A person's contact details as the main content – use `contact-channels` or `person-links`.
- DOIs, IP addresses, hashes and CVE ids – use `identifier-details`.
- Coordinates – use `coordinate-details`; book numbers – use `isbn-details`.

## Anatomy

1. **Text** `.ui-ent__text` – the passage, shown as written
2. **Marks** `.ui-ent__mark` – an address, number, link or handle found in the text, focusable; `data-kind` says which
3. **Card** `.ui-ent__pop` – opened by hover, focus or right-click
4. **Kind and value** `.ui-ent__head` – an icon (or the app's picture), what it is, and the value
5. **Facts** `.ui-ent__facts` – what follows from the value itself: domain, country, site and path, security, server
6. **What the app knows** `.ui-ent__more` – a name, a sentence, more fields and links; or loading, an error with
   Retry, or "Nothing more known."
7. **Actions** `.ui-ent__actions` – Copy, and Write email, Call or Open

## Looks

Standard tints each mark with a soft accent fill and a solid underline, and gives the kind a tinted icon. Clean marks
with a dotted underline only and frames the icon with a hairline. The card is the shared floating surface in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Onto a mark: opens its card (unless `trigger` is "contextmenu"). On a mark with its card open: into the card; from the card's last control, on to the next mark |
| Shift + Tab | From the card's first control, back to its mark |
| Enter / Space | On a mark: opens its card and moves focus into it |
| Menu key / Shift + F10 | On a mark: opens its card and moves focus into it, in place of the browser's menu |
| Escape | Closes the card; focus goes back to its mark |

## Screen readers

Each mark is a button named by the text as written and described by its kind – "Email address details. Tab moves into
them" – with `aria-haspopup="dialog"` and `aria-expanded`. The card is a non-modal `dialog` named by its kind and value
("Phone number +44 20 7946 0958"), `aria-busy` while loading. Copy and the action are buttons and links named by their
words; links that open a new tab say so. A polite status region announces the name the app returned, "Nothing more
known.", "Couldn't load the details." and "Copied …".

## Content

- `text` is plain text, shown as written with its line breaks.
- Give answers a `name` when you have one – it's announced. `avatar` is decorative; `fields` are short label and value
  pairs; `links` must be http(s), mailto: or tel: (anything else is dropped).
- Rename kinds with `kindLabels` ("Contact" for "Handle") and the messages with `not-found-text` and `error-text`.
- National numbers without a country code can't be placed in a country; write numbers with "+" when you can.

## Do

- Pass the `signal` on to your lookup, so it stops when the component leaves the page.
- Return null for things you know nothing about; throw only when the lookup itself failed, so people get Retry.
- Use `trigger="contextmenu"` in dense text, such as a log, where hover cards would get in the way.

## Don't

- Don't mark the text yourself – the component checks what it finds, so dates and ids aren't presented as numbers.
- Don't look every address up on load; the component asks only when a card opens, and caches the answer.
- Don't rely on the card to vet links – it shows where a link goes and warns about http, but it doesn't check sites.

## Example

```html
<tc-entity-details id="note"></tc-entity-details>

<script type="module">
  import "trenchcoat/entity-details";
  import "trenchcoat/tokens.css";

  const note = document.querySelector("#note");
  note.text = "Incident lead: priya.natarajan@example.org (+44 20 7946 0958). Ping @ops_lead.";
  note.resolve = async (kind, value, signal) => {
    const res = await fetch(`/api/directory?kind=${kind}&value=${encodeURIComponent(value)}`, { signal });
    return res.status === 404 ? null : res.json();
  };
  note.addEventListener("tc-copy", (e) => console.log("copied", e.detail.kind, e.detail.text));
</script>
```

```tsx
import { EntityDetails, type EntityInfo } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const directory: Record<string, EntityInfo> = {
  "email:priya.natarajan@example.org": { name: "Priya Natarajan", summary: "Security operations lead" },
};

export function HandOver() {
  return (
    <EntityDetails
      text="Incident lead: priya.natarajan@example.org, desk +44 20 7946 0958."
      resolve={(kind, value) => directory[`${kind}:${value}`] ?? null}
      onCopy={(text) => console.log("copied", text)}
    />
  );
}
```
