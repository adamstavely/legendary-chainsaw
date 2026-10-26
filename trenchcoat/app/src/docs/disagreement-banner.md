---
pattern: disclosure
status: new
related: run-compare, inline-diff, claim-answer, reliance-gauge
---

## Overview

A banner for the moment today's answer contradicts an earlier answer to the same question. The two answers sit
side by side – the earlier on the left – with the difference marked word by word: words only the earlier answer had
are struck through, words only today's has are underlined, and pointing at one lights up its counterpart. Long
answers show only the changes with a few words of context, so the contradiction is the first thing people see; one
press shows both in full. People can dismiss it, or open the earlier session to see why it said what it said.

## When to use

- A person asks something they – or their team – asked before, and the answer has changed in substance.
- Answers people rely on over time (policies, figures, terms), where a silent change would go unnoticed.
- After a model, prompt or source update, to show users where answers moved.

## When not to use

- Comparing two runs or prompt versions while building – use `run-compare`.
- Suggesting an edit to a text, to accept or reject – use `inline-diff`.
- Marking up one answer claim by claim with its sources – use `claim-answer`.
- Showing whether trust in the AI matches how it performs over time – use `reliance-gauge`.

## Anatomy

1. **Header** `.ui-dsb__bar` – the heading, the question and the number of differences
2. **Count** `.ui-dsb__count` – how many places the answers differ
3. **Answers** `.ui-dsb__pair` – the earlier answer and today's, side by side
4. **Changed words** `.ui-dsb__ins` – what only today's answer says, underlined; the earlier side's are struck through
5. **Foot** `.ui-dsb__foot` – your summary, “Show full answers” and “Open earlier session”

## Looks

Standard puts the heading on a gray tray and the two answers on a white card inside it. Clean is one white card with
hairline dividers; its struck words are gray and its added words keep the text colour, over the same tints. Both
stack the answers – earlier above today's – when the banner is narrow.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves to Dismiss, “Show full answers” and “Open earlier session” |
| Enter / Space | Presses the focused button |

## Screen readers

The banner is a `group` named by its heading; the question follows it, read as “Question: …”. Words only one answer
has are `<del>` (earlier) and `<ins>` (today's) elements, and left-out shared text reads “(shared words left out)”.
“Show full answers” is a disclosure: `aria-expanded`, and `aria-controls` points at the answers. Dismiss is a button
named “Dismiss”; once pressed, a `status` region says “Dismissed” and focus stays on the banner rather than dropping
to the page.

## Content

- Keep the default heading, or say what changed in plain words: “This answer differs from an earlier one”.
- Show the question as the person asked it, so they recognise it.
- Give both sides a `when` people can place – “Oct 14”, “Today, 10:42” – and a `label` when “Earlier” isn't enough
  (“Before the policy update”).
- Use `summary` for one line on what changed, in your product's words; leave it out rather than repeat the diff.

## Do

- Show it only when the answers differ in substance – a reworded answer isn't a disagreement.
- Pass `sessionId` and turn on `can-open` (or pass `onOpenEarlier`) so people can see the earlier context.
- Put it above today's answer, where it's read before the answer is relied on.

## Don't

- Don't decide for the person which answer is right – show both and let them check.
- Don't keep showing a banner someone dismissed for the same pair of answers.
- Don't rely on colour alone in your own summary; the banner already marks changes with strikes and underlines.

## Example

```html
<tc-disagreement-banner id="banner" question="Can we end the contract early?" dismissible can-open></tc-disagreement-banner>

<script type="module">
  import "trenchcoat/disagreement-banner";
  import "trenchcoat/tokens.css";

  const banner = document.querySelector("#banner");
  banner.earlier = { text: "Either side can end it with 30 days' notice.", when: "Oct 14", sessionId: "s-2291" };
  banner.current = { text: "Either side can end it with 60 days' notice.", when: "Today" };
  banner.addEventListener("tc-open-session", (e) => openSession(e.detail.sessionId));
</script>
```

```tsx
import { DisagreementBanner, type DisagreementAnswer } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function AnswerChanged({ earlier, current, onOpen }: { earlier: DisagreementAnswer; current: DisagreementAnswer; onOpen: (id?: string) => void }) {
  return <DisagreementBanner question="Can we end the contract early?" earlier={earlier} current={current} onOpenEarlier={(id) => onOpen(id)} onDismiss={() => undefined} />;
}
```
