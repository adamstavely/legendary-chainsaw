---
pattern: menu
status: stable
related: approval-card, model-picker, tips-panel
---

## Overview

A card that suggests one course of action and says why, with a signal for how sure the suggestion is. People can
accept it in one click, open the alternatives and switch to one of them instead, or fold the reason away. An
accepted suggestion can be undone, and acceptance can wait on the app – the button stays busy until the change is
made, and says so if it fails.

## When to use

- A product can suggest a setting or a plan with a reason – “sync only the changes”, “use the smaller model”.
- There are a few sensible alternatives, and people should see the recommended one first.
- Accepting changes something real and should be easy to take back.

## When not to use

- An agent asking permission for an action it's about to take – use `approval-card`.
- Choosing a model from a full list, with no single recommendation – use `model-picker`.
- Passive advice and how-tos with nothing to accept – use `tips-panel`.

## Anatomy

1. **Head** `.ui-sr__head` – the mark and heading; folds the reason away
2. **Reason** `.ui-sr__reason` – one sentence on why
3. **Signal** `.ui-sr__signal` – how sure the suggestion is, from “No signal” to “Strong signal”
4. **Alternatives** `.ui-sr__alt` – a menu of every option, the recommendation first
5. **Accept** `.ui-sr__btn--primary` – accepts the option on show; Undo takes its place

## Looks

Standard sets the head and reason in a white card on a gray tray, with the signal and the buttons on the tray below.
Clean is one white card with hairline shadows: a solid blue sparkle as the mark, the signal and the buttons as the
card's last row under a hairline, and thin icons on Alternatives and Undo.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the head: folds or unfolds the reason. On Alternatives: opens or closes the menu |
| ↓ / ↑ on Alternatives | Opens the menu on the option that's on show |
| ↓ / ↑ in the menu | Moves to the next or previous option, wrapping at the ends |
| Home / End | Moves to the first or last option |
| Enter / Space in the menu | Shows that option, closes the menu and unfolds the reason |
| Escape | Closes the menu and returns focus to Alternatives |
| Tab | Closes the menu and moves on |

## Screen readers

The card is a region named by its heading unless the page names it. The head is a button with `aria-expanded`;
a folded reason is inert. The signal is text (“Strong signal”). Alternatives is a menu button
(`aria-haspopup="menu"`, `aria-expanded`); the menu, “Alternatives”, holds `menuitemradio` options read with their
signal (“Nightly full sync, Good signal”), the recommendation tagged “Recommended” and the one on show checked. The
Accept and Undo buttons are `aria-busy` and `aria-disabled` while the app works. After accepting, a status reads
“Incremental sync accepted”; a failure is an alert – “Couldn't accept it. Try again.” or “Couldn't undo. Try again.”

## Content

- Keep `label` short – it goes into the button as “Accept incremental sync”, lower-cased.
- Make the reason one sentence with the number that matters: “Only 3% of your 1.2M rows changed last week”.
- In each alternative's reason, say its trade-off honestly – what it costs compared with the recommendation.
- Set `signal` from real evidence; use 0 (“No signal”) rather than guess.

## Do

- Put the recommendation first in `options`; the rest are offered as alternatives in that order.
- Return a promise from `onAccept` (`acceptOption`) when applying takes a request, so the button waits.
- Pass `onUndo` (`undoOption`) whenever an acceptance can be reversed.

## Don't

- Don't offer more than a handful of alternatives – a long menu means there's no clear recommendation.
- Don't accept on the person's behalf – the card is for a suggestion they act on.
- Don't use the heading for the suggestion itself; the label and reason carry it.

## Example

```html
<tc-smart-recommendation id="sync" heading="Recommended"></tc-smart-recommendation>

<script type="module">
  import "trenchcoat/smart-recommendation";
  import "trenchcoat/tokens.css";

  const card = document.querySelector("#sync");
  card.options = [
    { id: "incremental", label: "Incremental sync", reason: "Only 3% of your rows changed last week.", signal: 3 },
    { id: "nightly", label: "Nightly full sync", reason: "Simpler, but each run reloads every row.", signal: 2 },
  ];
  card.acceptOption = (option) => fetch(`/api/sync/${option.id}`, { method: "POST" });
  card.addEventListener("tc-accepted-change", (e) => console.log(e.detail.accepted));
</script>
```

```tsx
import { SmartRecommendation, type Recommendation } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const options: Recommendation[] = [
  { id: "incremental", label: "Incremental sync", reason: "Only 3% of your rows changed last week.", signal: 3 },
  { id: "nightly", label: "Nightly full sync", reason: "Simpler, but each run reloads every row.", signal: 2 },
];

export function SyncAdvice({ apply, revert }: { apply: (id: string) => Promise<void>; revert: (id: string) => Promise<void> }) {
  return <SmartRecommendation title="Recommended" options={options} onAccept={(o) => apply(o.id)} onUndo={(o) => revert(o.id)} />;
}
```
