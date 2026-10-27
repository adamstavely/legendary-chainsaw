---
pattern: disclosure
status: new
related: guardrail-notice, claim-answer, reliance-gauge, validity-badge
---

## Overview

An advisory placed above an answer when the request falls where the AI is only partly proven (amber) or not proven at
all (red). Models answer fluently whether or not they can do a task reliably, so the notice gives the signal the
answer can't: it names the task area, says what to do about the answer, and can say that the confidence shown is
capped (“Confidence capped at Medium”) and that someone was notified. A folded detail shows how far the request is
from the ones the AI usually handles, as a small scale with the usual range shaded. The app decides the level, the cap
and who was told; the notice says so.

## When to use

- Above an answer to a request your evaluation data marks as partly validated or out of scope.
- When the app has capped the confidence an answer may show, so people know why it's lower.
- When a request was escalated to a reviewer, so the person asking knows someone else has seen it.

## When not to use

- A policy blocked, redacted or rewrote content – use `guardrail-notice`.
- Confidence and sources for each claim in an answer – use `claim-answer`.
- How well trust matches performance across many answers – use `reliance-gauge`.
- A source that has gone out of date – use `validity-badge`.

## Anatomy

1. **Icon** `.ui-cpn__icon` – a warning triangle (partly proven) or an octagon (not proven), in the level's tone
2. **Heading** `.ui-cpn__titles` – the level, then what to do about the answer
3. **Task area** `.ui-cpn__area` – the kind of request, by the name people know it by
4. **Facts** `.ui-cpn__facts` – the confidence cap and who was notified
5. **Distance from usual** `.ui-cpn__fold` – the score, and on opening the scale with the usual range and threshold

## Looks

Standard is a band in the level's tone – amber or red tint with a hairline border – with the icon and the chips on
white. Clean is a white card with the tone as a thin rule down its left edge, a tinted icon, lighter type and thinner
icons. It's a notice, not a card, so neither look has a card header.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Reaches the Distance from usual toggle, the only control |
| Enter / Space | Opens or closes the distance detail |

## Screen readers

The notice has the `note` role, named by its heading (“Check this answer independently”). The level reads before the
heading (“Partly proven”), then “Task area Tax rules outside the UK”, the message, and the chips (“Confidence capped at
Medium”, “Supervisor notified”). The toggle is a disclosure button named “Distance from usual 0.72”, with
`aria-expanded` and `aria-controls`. The scale is a `meter` named “Distance from usual”, its value text “0.72 – above
the usual range, up to 0.45”.

## Content

- Name the task area the way people describe their work (“Tax calculations outside the UK”), not a taxonomy code.
- Keep the heading an instruction and the message the reason; override both together.
- Use your product's own confidence words in `cap` – the notice adds “Confidence capped at”.
- Name a role in `notified` (“Supervisor”, “Team lead”) unless people expect a name.

## Do

- Show it above the answer, so it's read first.
- Set `usual` whenever you show the score – a number without its usual range means little.
- Show red only for areas your evaluations say the AI can't handle, and say who was told.

## Don't

- Don't show it on every answer; a notice that's always there stops being read.
- Don't present the distance score as a probability of being wrong – it says how unfamiliar the request is.
- Don't use it for policy decisions; that's `guardrail-notice`.

## Example

```html
<tc-capability-notice id="notice" level="partial" area="Tax calculations outside the UK" cap="Medium"></tc-capability-notice>

<script type="module">
  import "trenchcoat/capability-notice";
  import "trenchcoat/tokens.css";

  const notice = document.querySelector("#notice");
  notice.distance = 0.72;
  notice.usual = 0.45;
  notice.addEventListener("tc-open-change", (e) => console.log("detail open:", e.detail.open));
</script>
```

```tsx
import { CapabilityNotice } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function ValuationNotice({ distance }: { distance: number }) {
  return (
    <CapabilityNotice
      level="unproven"
      area="Valuing private companies"
      cap="Low"
      notified="Team lead"
      distance={distance}
      usual={0.45}
      onOpenChange={(open) => console.log("detail open:", open)}
    />
  );
}
```
