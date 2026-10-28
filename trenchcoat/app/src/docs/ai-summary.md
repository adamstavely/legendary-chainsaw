---
pattern: none
status: new
related: file-summary, ai-answer, cited-answer, synthesis-notes
---

## Overview

The gist of a set of sources – a thread, a meeting, some documents, a ticket's history – written by AI. The header says
what was summarised (“#launch-q3 · 4 messages · 2 documents · 1 meeting”) and marks the summary as AI-generated, with
the model and how long ago it was written. The body leads with a one-line TL;DR, then the summary, key points citing
their sources as numbered chips, and the questions the sources leave open. The footer asks whether it helped and offers
Sources, Copy and Regenerate. Short and Detailed switch the summary's length.

A numbered chip shows its source's name on hover or focus, and opens the source. When the sources move on – `stale`
is set, or a source is dated after `generatedAt` – a quiet banner says “3 new messages since this summary” with Update.

The page drives it with `status`: "idle" offers Summarise, "summarising" shows a shimmer until the first words arrive
and a caret while the text grows, "done" shows everything, and "error" shows what went wrong with Retry. Stream by
setting `tldr`, `summary`, `points` and `questions` as they arrive.

## When to use

- Catching up on a long thread, channel or ticket without reading every message.
- After a meeting, alongside its notes and the documents it discussed.
- Any “what happened while I was away” view where each claim should lead back to where it came from.

## When not to use

- One file – use `file-summary`, which knows pages, timestamps and file types.
- An answer to a question someone asked – use `ai-answer` or `cited-answer`.
- Conclusions a person wrote themselves, kept apart from the model's – use `synthesis-notes`.

## Anatomy

1. **Header** `.tc-head` – the title, what was summarised by kind, and the AI-generated tag `.ui-aism__ai-tag` with the model and how long ago
2. **Length** `.ui-aism__len` – Short or Detailed
3. **Freshness** `.ui-aism__stale` – how many new items there are since the summary, with Update
4. **TL;DR** `.ui-aism__tldr` – the one-line gist
5. **Summary** `.ui-aism__summary` – the paragraphs, with a caret while they stream in; a shimmer `.ui-aism__skeleton` before the first words
6. **Key points** `.ui-aism__points` – each point with numbered source chips `.ui-aism__cite` and their tooltip `.ui-aism__tip`
7. **Footer** `.ui-aism__foot` – Was this helpful?, Sources, Copy and Regenerate
8. **Sources** `.ui-aism__sources` – every source, numbered as the chips cite it, with its kind and when
9. **Error** `.ui-aism__error` – what went wrong, with Retry

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and a stronger selected length. Clean
is one white card with the header as its first row, roomier summary lines and thinner icons. In both, the sparkle
icon and the AI-generated tag are violet, so a summary is never mistaken for something a person wrote.

## Keyboard

Every control is a stop in reading order: Short / Detailed (one stop), Update, Summarise or Retry, each source chip,
then helpful and not helpful, Sources, Copy and Regenerate, and each source's link once the list is open.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the controls; a source chip shows its source's name while focused |
| ← / → / ↑ / ↓ | In Short / Detailed, picks the other length |
| Home / End | In Short / Detailed, picks Short or Detailed |
| Enter / Space | Uses the focused control: opens a source, gives feedback, opens the sources, copies, regenerates |
| Escape | On a source chip, hides its tooltip |

While summarising, feedback, Copy and Regenerate are disabled; if focus was on a control that goes away, it moves to
Short / Detailed. Picking a length while summarising fires tc-length-change, so the page can start again.

## Screen readers

The title is the card's heading. Short / Detailed is a `radiogroup` labelled “Summary length”. While the summary
streams it is `aria-busy`, and the status is announced politely: “Summarising #launch-q3”, “Summary of #launch-q3
ready”, or “Couldn't summarise #launch-q3: …”. An error is also an `alert`. A source chip shows “2” and reads “Source 2:
Marco in #launch-q3”; its visual tooltip repeats the name, so it's hidden from screen readers. Helpful and Not helpful
are toggle buttons (`aria-pressed`) in a group labelled “Was this helpful?”, confirmed with “Marked as helpful”. Sources
is a disclosure (`aria-expanded`) over a list labelled “Sources”. Copy confirms with “Summary copied”.

## Content

- Write the TL;DR as the one thing to know, with the decision or the date in it: “Launch is set for 12 November if the billing bug is fixed by Friday.”
- Keep the short summary to two or three sentences, and the detailed one to two short paragraphs.
- Write key points as findings, and cite every one; a point without a source can't be checked.
- Put what nobody has decided yet in `questions`, as questions.
- Name sources as people would find them: “Marco in #launch-q3”, “BILL-482 – proration rounding bug”.

## Do

- Set `generatedAt` and `model`, so people can judge how fresh and how trustworthy the summary is.
- Pass new sources with their `at`, or set `stale`, so people know when the summary is behind.
- Summarise again on `tc-retry` and `tc-length-change`, setting `status` back to "summarising".

## Don't

- Don't refresh a summary silently as messages arrive – show that it's behind and let people Update.
- Don't cite a source that isn't in `sources`; its chip won't show.
- Don't leave `status` at "summarising" after a failure – set "error" so Retry appears.

## Example

```html
<tc-ai-summary id="sum" heading="Thread summary" subject="#launch-q3" model="Claude Sonnet"></tc-ai-summary>

<script type="module">
  import "trenchcoat/ai-summary";
  import "trenchcoat/tokens.css";

  const sum = document.querySelector("#sum");
  sum.sources = [
    { id: "m1", label: "Priya in #launch-q3", kind: "message" },
    { id: "t1", label: "BILL-482 – proration bug", kind: "ticket", href: "/tickets/482" },
  ];
  sum.addEventListener("tc-summarise", async () => {
    sum.status = "summarising";
    const result = await fetch("/api/summarise?channel=launch-q3").then((r) => r.json());
    sum.tldr = result.tldr;
    sum.summary = result.summary;
    sum.points = [{ id: "bug", text: "A billing bug blocks launch.", sources: ["t1"] }];
    sum.generatedAt = Date.now();
    sum.status = "done";
  });
</script>
```

```tsx
import { useState } from "react";
import { AiSummary, type AiSummarySource, type AiSummaryStatus } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const sources: AiSummarySource[] = [
  { id: "m1", label: "Priya in #launch-q3", kind: "message" },
  { id: "t1", label: "BILL-482 – proration bug", kind: "ticket", href: "/tickets/482" },
];

export function ThreadSummary() {
  const [status, setStatus] = useState<AiSummaryStatus>("idle");
  const [summary, setSummary] = useState("");
  const [at, setAt] = useState<number | undefined>(undefined);
  const summarise = async () => {
    setStatus("summarising");
    const result = await fetch("/api/summarise?channel=launch-q3").then((r) => r.json());
    setSummary(result.summary);
    setAt(Date.now());
    setStatus("done");
  };
  return (
    <AiSummary
      title="Thread summary"
      subject="#launch-q3"
      model="Claude Sonnet"
      sources={sources}
      status={status}
      summary={summary}
      generatedAt={at}
      points={[{ id: "bug", text: "A billing bug blocks launch.", sources: ["t1"] }]}
      onSummarise={summarise}
      onRetry={summarise}
    />
  );
}
```
