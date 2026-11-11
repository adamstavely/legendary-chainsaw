---
pattern: disclosure
status: new
related: parallel-attempts, answer-arena, run-compare, eval-scorecard
---

## Overview

How an LLM judge picks the best of several attempts at one task, drawn as a single-elimination tournament. The
attempts are seeded in the order you give them – when there aren't a power of two, the first ones get a bye – and
rounds run left to right, each match a pair of small cards joined to the match it feeds. As you stream the judge's
verdicts in, the bracket fills: the winner moves on along its connector, the loser steps back, and the match being
judged pulses gently. Open any match for both answers side by side, the judge's reason and how confident it was. The
champion gets a card of its own with its answer and "Use this answer".

It's the judging, made visible. Parallel Attempts races several attempts and scores each on its own; Answer Arena asks
a person to rate two answers. The bracket shows a judge comparing two at a time, so people can see why the winner
won – and check the close calls.

## When to use

- A best-of-n run where a model judges pairs of answers and the winner of each pair goes through.
- Showing reviewers which comparisons decided the result, with the judge's reasoning for each.
- Tournaments of prompts, retrieval settings or agent plans scored head to head.

## When not to use

- Attempts scored on their own, against a rubric – use `parallel-attempts`.
- Two answers for a person to compare and rate – use `answer-arena`.
- Two runs or prompt versions compared line by line – use `run-compare`.
- Scores across a whole evaluation set – use `eval-scorecard`.

## Anatomy

1. **Round** `.ui-jbk__round` – a column of matches, named Round 1, Quarter-final, Semi-final or Final
2. **Match** `.ui-jbk__match` – a button holding the two attempts it compares
3. **Attempt** `.ui-jbk__entry` – the attempt's name, model and score; the winner ticked, the loser struck through
4. **Connector** `.ui-jbk__wire` – from a match to the one it feeds, drawn in the accent once its winner moves on
5. **Champion** `.ui-jbk__champ` – the winner's answer and "Use this answer"
6. **Comparison** `.ui-jbk__panel` – both answers, the judge's reason and its confidence
7. **Path** `.ui-jbk__path` – "Round 1 → Semi-final → Final", shown when the bracket is narrow

## Looks

Standard sets the header on the gray tray and the bracket on a white card; Clean is one white card with the header as
its first row and quieter, hairline cards. A page can set `--tc-jbk-wire` and `--tc-jbk-wire-won` for the connectors'
colours. Wide, the bracket scrolls sideways when it doesn't fit; under 560 px the rounds stack as lists under the path
and the connectors go.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the bracket (one tab stop), then to the champion's button and the comparison |
| ↓ / ↑ | The next or previous match in the round |
| → | The match this one feeds, in the next round |
| ← | The first match that fed this one |
| Home / End | The round's first or last match |
| Enter / Space | Opens or closes the match's comparison |
| Escape | Closes the comparison; Close returns focus to the match |

## Screen readers

The bracket is a `group` named by the heading. Each round is a `group` named by its name, and each match a button that
reads its round, its number, both attempts and its state: "Semi-final, match 1: Attempt A Claude Sonnet 88 against
Attempt C Claude Opus 93 (won)". Empty places read "Waiting for the winner of round 1 match 3". A match's button has
`aria-expanded` and controls the comparison, a region named "Semi-final · match 1". A polite status line says each
verdict as it arrives – "Attempt C beats Attempt A in the semi-final", "Attempt C wins the bracket" – and "Using
Attempt C" once it's chosen. The connectors are decorative.

## Content

- Name attempts briefly and the same way – "Attempt A", "Prompt v3" – and put the model in `model`.
- Write `summary` as the answer itself, in a sentence or two; it shows in the comparison and on the champion's card.
- Give the judge's `reason` in plain words, naming what tipped it: "C leads with the highest-risk finding".
- Send `confidence` when the judge gives one; close calls (under about 60%) are worth a second look.
- Stream a match in without a `winner` while it's being judged, then again with it.

## Do

- Keep `attempts` in the same order for the whole run – it's the seeding.
- Prevent `tc-accept` when choosing the answer happens on your server, and set `accepted` when it has.
- Let people open the close calls: link to the comparison from wherever the result is reported.

## Don't

- Don't use it for more than 16 attempts – score them first and judge the best few.
- Don't rename attempts between verdicts; a match is found by its round and its two attempts' ids.
- Don't hide the reason – a winner without one asks people to trust the judge blindly.

## Example

```html
<tc-judge-bracket id="bracket" task="Summarise the audit's key findings"></tc-judge-bracket>

<script type="module">
  import "@adamstavely/trenchcoat/judge-bracket";
  import "@adamstavely/trenchcoat/tokens.css";

  const bracket = document.querySelector("#bracket");
  bracket.attempts = [
    { id: "a", label: "Attempt A", model: "Claude Sonnet", summary: "Three findings, with their numbers." },
    { id: "b", label: "Attempt B", model: "Claude Haiku", summary: "Missing tax IDs and some renewals." },
  ];
  bracket.verdicts = [{ round: 1, a: "a", b: "b", winner: "a", reason: "A gives the numbers.", confidence: 0.86 }];
  bracket.addEventListener("tc-accept", (e) => console.log("use", e.detail.id));
</script>
```

```tsx
import { useState } from "react";
import { JudgeBracket, type JudgeAttempt, type JudgeMatch } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Bracket({ attempts, verdicts }: { attempts: JudgeAttempt[]; verdicts: JudgeMatch[] }) {
  const [match, setMatch] = useState<string | null>(null);
  return (
    <JudgeBracket
      task="Summarise the audit's key findings"
      attempts={attempts}
      verdicts={verdicts}
      match={match}
      onMatchChange={(next) => setMatch(next)}
      onAccept={(id) => console.log("use", id)}
    />
  );
}
```
