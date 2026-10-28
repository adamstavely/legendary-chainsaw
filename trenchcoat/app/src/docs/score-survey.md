---
pattern: radio
status: new
related: score-summary, feedback-rubric, reaction-bar, radio-group
---

## Overview

The one question a person answers about your product: how likely they are to recommend it (NPS, 0 to 10) or how
satisfied they are (CSAT, 1 to 5). NPS is a row of eleven numbers with the ends labelled in words and the three bands –
Detractor 0–6, Passive 7–8, Promoter 9–10 – shown quietly underneath; CSAT is five faces, each with its word. After a
pick, an optional follow-up question opens, with a different question per band or score if you like, and Submit sends
the score and the comment as one event. Then a thank-you replaces the question, with “Change answer” to go back.

## When to use

- An in-app or end-of-task survey with one standard question.
- Measuring loyalty over time (NPS) or satisfaction with a single moment, like a booking or a support chat (CSAT).
- Asking a follow-up that depends on the answer – what to improve from a detractor, what they like from a promoter.

## When not to use

- Showing the results of the survey – use `score-summary`.
- Rating an AI answer against several criteria – use `feedback-rubric`.
- A quick reaction under a message – use `reaction-bar`.
- Picking one option that isn't a rating – use `radio-group`.

## Anatomy

1. **Question** `.ui-ssv__question` – the question, as the radio group's name
2. **Scale** `.ui-ssv__scale` – eleven numbers (NPS) or five faces with words (CSAT), one radio each
3. **Ends** `.ui-ssv__ends` – the words under 0 and 10 on the NPS scale
4. **Bands** `.ui-ssv__bands` – Detractor, Passive and Promoter under their numbers, each with its range
5. **Follow-up** `.ui-ssv__more` – the follow-up question and its textarea, Skip and Submit
6. **Thank-you** `.ui-ssv__done` – the thanks, the answer given and “Change answer”

## Looks

Standard puts the heading on a gray tray and the question on a white card inside it. Clean is one white card with the
heading as its first row. Narrow (under 440 px), the NPS row wraps to 0–5 and 6–10 and the bands become a line of
words. The band colours are component tokens: `--tc-ssv-band-detractor`, `--tc-ssv-band-passive` and
`--tc-ssv-band-promoter`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the scale (one stop), then the follow-up, Skip and Submit |
| → / ↓ | Picks the next score, wrapping round; with nothing picked, picks the first |
| ← / ↑ | Picks the previous score, wrapping round; with nothing picked, picks the last |
| Home / End | Picks the first or last score |
| 0–9 | Picks that score directly; on NPS, 1 then 0 in quick succession picks 10 |
| Enter / Space | Picks the focused score, or presses the focused button |

## Screen readers

The card is a `group` named by the heading. The scale is a `radiogroup` named by the question and described by the
keys that work; each option is a `radio` with `aria-checked`. NPS options are named by their number, with the end
words added to 0 and 10 (“0, Not at all likely”); CSAT options are named by their word. The follow-up textarea is
labelled by its question. Submit has `aria-busy` while the app saves, and a status region says the thanks once it's
submitted. The dismiss button is named “Dismiss”.

## Content

- Name your product in the question – “recommend the Riverside Library app” – not “us”.
- Keep follow-ups to one short question; mark them optional in the placeholder.
- Ask the follow-up that fits the answer: what to fix from a detractor, what to keep from a promoter.
- Don't rename the NPS bands for people taking the survey to something judgemental; `hide-bands` hides them.

## Do

- Ask at a natural pause – after a task is done, not in the middle of one.
- Set `submitting` while you save, and prevent `tc-submit` (or return false from `onSubmit`) if the save can fail.
- Offer `dismissible` so people can say no.

## Don't

- Don't change the scale's range or wording if you compare results over time.
- Don't ask NPS and CSAT about the same moment in one go.
- Don't make the follow-up required.

## Example

```html
<tc-score-survey id="survey" kind="nps" question="How likely are you to recommend the Riverside Library app?" dismissible></tc-score-survey>

<script type="module">
  import "trenchcoat/score-survey";
  import "trenchcoat/tokens.css";

  const survey = document.querySelector("#survey");
  survey.followUps = { detractor: "What would make it more useful?", promoter: "What do you like most?" };
  survey.addEventListener("tc-submit", (e) => fetch("/survey", { method: "POST", body: JSON.stringify(e.detail) }));
  survey.addEventListener("tc-dismiss", () => survey.remove());
</script>
```

```tsx
import { ScoreSurvey, type ScoreSurveySubmit } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function VisitSurvey({ onSave }: { onSave: (answer: ScoreSurveySubmit) => void }) {
  return <ScoreSurvey kind="csat" question="How satisfied were you with booking a study room?" followUp="Tell us more" onSubmit={onSave} />;
}
```
