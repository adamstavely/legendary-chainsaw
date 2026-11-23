---
pattern: disclosure
status: new
related: agent-findings, run-estimate, fan-out-grid, toaster
---

## Overview

A bulk run that partly finished, because partial results beat a failure. A headline says it in words – "34 of 40 finished · 6 didn't" – over a bar split into finished, failed and skipped. Below it the unfinished items are grouped by reason, biggest group first, each item with its own reason and a Retry. At the foot are Retry failed, Continue with what finished, and Download the list. `variant="notice"` is one line and a Retry, for the top of a results list.

## When to use

- A batch over many items where some finished and some didn't: summaries, imports, extractions, checks.
- Letting someone carry on with what worked while they deal with the rest.

## When not to use

- A run that's still going – use `fan-out-grid` or `agent-findings`.
- What a run will cost before it starts – use `run-estimate`.
- A one-line message that something failed – use `toaster`.

## Anatomy

1. **Headline** `.ui-ptr__headline` – how many finished and how many didn't
2. **Bar** `.ui-ptr__bar` – a `.ui-ptr__seg` per status, with `.ui-ptr__legend` keys
3. **Groups** `.ui-ptr__group-list` – each `.ui-ptr__group-toggle` names a `.ui-ptr__reason` and its count
4. **Items** `.ui-ptr__items` – each `.ui-ptr__item` with `.ui-ptr__label`, `.ui-ptr__status`, `.ui-ptr__detail` and `.ui-ptr__retry`
5. **Actions** `.ui-ptr__actions` – Download the list, Continue, and Retry failed
6. **Notice** `.ui-ptr__notice` – the one-line variant

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. The notice is a tinted line in either look. When narrow, each item's Retry sits under it and the actions share the width. A page can set `--tc-ptr-bar` for the bar's height.

## Keyboard

| Key | What it does |
|---|---|
| ↑ ↓ | Move between reason groups |
| Home / End | Go to the first or last group |
| Enter / Space | Open or close a group |
| Tab | Moves through the groups, each open group's Retry buttons, then the actions |

## Screen readers

The bar is an image named with every count in words ("34 finished, 5 failed, 1 skipped"); its legend repeats it visually and is hidden from screen readers. Each group is a button with `aria-expanded`. Each item's Retry is named with the item ("Retry Case 2041 – bank statements.pdf"). Status is a word and a shape as well as a colour. `role="status"` announces what's being retried.

## Content

Write `reason` as what went wrong, in a few plain words – "Couldn't open the file", "Timed out" – since items are grouped by it, so reuse the same words for the same cause. Put the specifics in `detail`. Give every item, or `done` and `total` as numbers with only the unfinished ones in `items`. Anything `total` counts that isn't listed shows as skipped.

## Do

- Say how many finished first. That's what can be used now.
- Replace an item when its retry ends, finished or failed again, so it stops showing as retrying.

## Don't

- Don't treat a partial run as a failure and throw away what finished.
- Don't retry skipped items with Retry failed. They were left out on purpose.

## Example

```html
<tc-partial-results id="run" total="40" done="34"></tc-partial-results>

<script type="module">
  import "@adamstavely/trenchcoat/partial-results";
  import "@adamstavely/trenchcoat/tokens.css";

  const run = document.querySelector("#run");
  run.items = [{ id: "a", label: "statements.pdf", status: "failed", reason: "Couldn't open the file" }];
  run.addEventListener("tc-retry", (e) => console.log(e.detail.ids));
</script>
```

```tsx
import { PartialResults, type PartialResultItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: PartialResultItem[] = [{ id: "a", label: "statements.pdf", status: "failed", reason: "Couldn't open the file" }];

export function Run() {
  return <PartialResults total={40} done={34} items={items} onTcRetry={(e) => console.log(e.detail.ids)} />;
}
```
