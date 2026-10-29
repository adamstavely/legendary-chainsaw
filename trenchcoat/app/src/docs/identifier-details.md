---
pattern: disclosure
status: new
related: entity-details, coordinate-details, isbn-details, code-block, red-team-finding
---

## Overview

Text full of technical identifiers – an incident write-up, a scan report, an analyst's notes, a model's answer – with
every DOI, IP address, file hash, CVE id and parcel tracking number found and marked. Hover one for a moment, focus it
or right-click it, and a card says what it is, gives the value normalised with Copy, and lists what follows from the
value itself: a DOI's prefix and its doi.org link, an address's version and range (private, loopback, reserved for
documentation…) and how many addresses a prefix covers, a hash's likely algorithm, a CVE's year with links to NVD and
CVE.org, a parcel's carrier. Below that is whatever your app knows: a title, a CVE's severity as a chip with its word
and score, an address's owner and network, a parcel's status, more fields and links.

It reads DOIs ("10.5555/example.2026.0142", also after "doi:" or inside a doi.org link), IPv4 and IPv6 addresses with
an optional /prefix (IPv6 shown in its shortest form), MD5, SHA-1, SHA-256 and SHA-512 hashes, CVE ids in either case,
UPS "1Z…" numbers, and other tracking numbers when a carrier is named just before them ("FedEx tracking #
449044304137821"). Version numbers, times, code like `std::vector`, octets past 255, hex of other lengths or in mixed
case, and digit runs with no carrier stay plain.

## Using it in an app

- **Wrap the text you already show.** Pass plain text as `text`; the component finds and checks identifiers itself.
- **Hand it your sources.** `resolve(kind, value, signal)` calls whatever you use – a vulnerability database, a threat
  intel service, a reference manager, your shipping provider – and returns `{ title, severity, score, status, owner,
  asn, summary, fields, links }`, or null. It's only asked when a card opens, and the answer is cached. Tracking
  lookups also get the `carrier` in the tc-identifier-lookup event.
- **Pick the kinds.** `kinds` limits what's marked – only CVEs in a patch note, only addresses in a firewall log.
- **Use `entity-details` beside it** for email addresses, phone numbers, links and handles.

## When to use

- Incident reports, scan output and notes where readers want to know what an id is before they go and look it up.
- Model answers that cite CVEs, papers or addresses, so a reader can check them in place.
- Anywhere people copy identifiers into another tool – the card gives the normalised value.

## When not to use

- A single identifier that's the subject of the screen – a finding's detail card – use `red-team-finding` or your own
  layout.
- Contact details – use `entity-details`; positions – `coordinate-details`; book numbers – `isbn-details`.
- Code listings – use `code-block`; the component marks identifiers in prose, not in code.

## Anatomy

1. **Text** `.ui-idd__text` – the passage, shown as written
2. **Marks** `.ui-idd__mark` – an identifier found in the text, focusable, set in the monospace face; `data-kind` says which
3. **Card** `.ui-idd__pop` – opened by hover, focus or right-click
4. **Kind and value** `.ui-idd__head` – an icon, what it is, the normalised value and Copy
5. **Facts** `.ui-idd__facts` – what follows from the value itself
6. **What the app knows** `.ui-idd__more` – chips (severity, status), a title, a sentence and fields; or loading, an
   error with Retry, or "Nothing more known."
7. **Links** `.ui-idd__links` – doi.org, NVD and CVE.org, then the app's links, each opening in a new tab

## Looks

Standard tints each mark with a soft accent fill and a solid underline, and gives the kind a tinted icon. Clean marks
with a dotted underline only and frames the icon with a hairline. Severity chips use the status tones – danger for
critical and high, warning for medium, info for low – and always carry the word. The card is the shared floating
surface in both looks.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Onto a mark: opens its card (unless `trigger` is "contextmenu"). On a mark with its card open: into the card; from the card's last control, on to the next mark |
| Shift + Tab | From the card's first control, back to its mark |
| Enter / Space | On a mark: opens its card and moves focus into it |
| Menu key / Shift + F10 | On a mark: opens its card and moves focus into it, in place of the browser's menu |
| Escape | Closes the card; focus goes back to its mark |

## Screen readers

Each mark is a button named by the identifier as written and described by its kind – "CVE details. Tab moves into
them" – with `aria-haspopup="dialog"` and `aria-expanded`. The card is a non-modal `dialog` named by its kind and value
("IP address 2001:db8::7"), `aria-busy` while loading. Copy is a button named "Copy"; the severity chip reads
"Critical 9.8 severity"; links that open a new tab say so. A polite status region announces the title, severity and
status the app returned, "Nothing more known.", "Couldn't load the details." and "Copied …".

## Content

- `text` is plain text, shown as written with its line breaks.
- `severity` is one of critical, high, medium, low and none; `score` is the CVSS base score. `status` is a few words.
- `links` must be http(s), mailto: or tel: – anything else is dropped.
- Rename kinds with `kindLabels` and the messages with `not-found-text` and `error-text`.
- A hash's algorithm is a guess from its length; say so in your own fields if you know better.

## Do

- Pass the `signal` on to your lookup, so it stops when the component leaves the page.
- Return null for identifiers you know nothing about; throw only when the lookup failed, so people get Retry.
- Name the carrier before tracking numbers in text you write, so they're recognised.

## Don't

- Don't mark the text yourself – the component checks ranges and shapes, so a version number isn't presented as an
  address.
- Don't look every identifier up on load; the component asks only when a card opens, and caches the answer.
- Don't put live indicators of compromise in links people might click without thinking – the card opens what you give it.

## Example

```html
<tc-identifier-details id="report"></tc-identifier-details>

<script type="module">
  import "trenchcoat/identifier-details";
  import "trenchcoat/tokens.css";

  const report = document.querySelector("#report");
  report.text = "Exploited CVE-2026-0001 from 192.0.2.44; write-up at doi:10.5555/example.2026.0142.";
  report.resolve = async (kind, value, signal) => {
    const res = await fetch(`/api/intel/${kind}/${encodeURIComponent(value)}`, { signal });
    return res.status === 404 ? null : res.json();
  };
</script>
```

```tsx
import { IdentifierDetails, type IdentifierInfo } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const intel: Record<string, IdentifierInfo> = {
  "cve:CVE-2026-0001": { title: "Heap overflow in badge reader firmware", severity: "critical", score: 9.8 },
};

export function IncidentNotes() {
  return (
    <IdentifierDetails
      text="The attacker exploited CVE-2026-0001 from 192.0.2.44."
      resolve={(kind, value) => intel[`${kind}:${value}`] ?? null}
      onCopy={(text) => console.log("copied", text)}
    />
  );
}
```
