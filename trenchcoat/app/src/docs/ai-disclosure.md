---
pattern: disclosure
status: new
related: guardrail-notice, reasoning-flags, provenance-summary, ai-answer
---

## Overview

Marks content an AI made and says what that means. It comes in two forms.

- **Mark** (`variant="mark"`) is a small inline badge beside a summary, a draft or a generated field. It shows a
  sparkle and "AI-generated", or "AI-assisted" or "Edited by you" with `kind`. Pressing it opens a card that says
  what made it and when, what it's good and weak at, whether a person reviewed it, and offers Report a problem.
- **Notice** (`variant="notice"`) is a quiet paragraph for the top of an assistant panel or a generated page. It says
  what the assistant is, that it can be wrong, where to check, and how to reach a person.

## When to use

- Beside any summary, draft, field or reply that an AI wrote or helped write, where people make decisions from it.
- At the top of an assistant panel, the first time people use it or wherever it acts on their behalf.
- When people need to know whether a person has reviewed what they're reading.

## When not to use

- Content a policy blocked or rewrote – use `guardrail-notice`.
- Weak reasoning inside an answer – use `reasoning-flags`.
- How much of a document came from sources, AI and its author – use `provenance-summary`.
- The answer itself, with its sources – use `ai-answer`.

## Anatomy

1. **Mark** `.ui-aid__mark` – the badge: a sparkle and its words
2. **Card** `.ui-aid__card` – what the mark opens
3. **Meaning** `.ui-aid__means` – what the kind means, in a sentence
4. **Made by** `.ui-aid__made` – the model and when
5. **Review** `.ui-aid__review` – who reviewed it, or that no one has yet
6. **Limits** `.ui-aid__limits` – what it's good and weak at
7. **Report** `.ui-aid__report` – Report a problem, as a link or a button
8. **Notice** `.ui-aid__notice` – the paragraph form, with its title (`.ui-aid__notice-title`) and body (`.ui-aid__notice-body`)
9. **Links** `.ui-aid__links` – Talk to a person, How the assistant works and Report a problem
10. **Close** `.ui-aid__close` – dismisses the notice

## Looks

In Standard the mark is a tinted pill and the notice a tinted band. In Clean the mark is an outlined pill and the
notice a white card with a thin accent rule. The card the mark opens is the shared popover surface in both looks.
Two component tokens can be overridden:
- `--tc-aid-mark-h` sets the mark's height;
- `--tc-aid-card-w` sets the card's width.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Reaches the mark; Tab from it moves into its open card |
| Enter / Space | Opens or closes the card; presses Report a problem or Dismiss |
| Escape | Closes the card and puts focus back on the mark |

## Screen readers

The mark is a button named by its visible words ("AI-generated"). It reports whether its card is expanded. The card
is a non-modal dialog named by the same words, and it reads its lines in order. The notice is a `note` named by its
title. Reporting a problem is confirmed in a polite status message. The sparkle is decorative.

## Content

- Keep the limits to two or three short sentences, each one a thing people would otherwise get wrong.
- Name the model the way people know it ("Review assistant"), not by its version string.
- In the notice, say what the assistant does for people, that it can be wrong, and where to check.
- Use `kind="edited"` once a person has changed an AI draft, so the mark stays honest.

## Do

- Put the mark next to the content it describes, not in a footer.
- Set `reviewedBy` only when a person really checked it.
- Give the notice a way to reach a person.

## Don't

- Don't mark content an AI didn't touch, or the mark stops meaning anything.
- Don't hide the mark once content is edited; switch `kind` instead.
- Don't use the notice as a legal disclaimer wall; keep it to a short paragraph.

## Example

```html
<p>Case summary <tc-ai-disclosure id="mark" model="Review assistant" reportable></tc-ai-disclosure></p>
<tc-ai-disclosure variant="notice" contact-href="/help/contact" dismissible></tc-ai-disclosure>

<script type="module">
  import "@adamstavely/trenchcoat/ai-disclosure";
  import "@adamstavely/trenchcoat/tokens.css";

  const mark = document.querySelector("#mark");
  mark.madeAt = Date.parse("2026-11-12T09:15");
  mark.limits = ["Can miss handwritten notes on scans.", "Doesn't know about calls that weren't logged."];
  mark.addEventListener("tc-report", (e) => console.log("report", e.detail.kind, e.detail.model));
</script>
```

```tsx
import { AiDisclosure } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function CaseSummaryHeading({ madeAt }: { madeAt: number }) {
  return (
    <h3>
      Case summary{" "}
      <AiDisclosure
        model="Review assistant"
        madeAt={madeAt}
        limits={["Can miss handwritten notes on scans."]}
        reportable
        onReport={(detail) => console.log("report", detail.model)}
      />
    </h3>
  );
}
```
