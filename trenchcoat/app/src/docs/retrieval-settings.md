---
pattern: tabs
status: new
related: retrieval-inspector, knowledge-source-manager, model-settings, context-tray
---

## Overview

Sets how a retrieval pipeline finds what the model answers with, on a picture of the pipeline itself. Five stages run
left to right – Query, Retrieve k, Filter, Rerank, n into context – and each shows a live summary of its settings and
the latency the app reports for it. Picking a stage opens its settings underneath: top-k, the keyword ↔ vector balance
and chunking for Retrieve; the score threshold and metadata rules for Filter; the reranking model; how many chunks go
into the prompt. The app's per-query cost and latency sit at the foot. The element only edits a value – the app runs
the retrieval, works out the estimates and re-indexes when chunking changes. With `name` it is a form control.

## When to use

- The settings page of a knowledge base, an assistant or a search feature built on retrieval.
- Tuning retrieval next to its results: pair it with `retrieval-inspector`, which shows what one query brought back
  with these settings – the chunks, their scores against the threshold, and what the answer used.
- Comparing presets (fast, precise, long documents) where the cost of each choice matters.

## When not to use

- Looking at what a single query retrieved – use `retrieval-inspector`.
- Managing the sources themselves – files, sites, connectors and their sync – use `knowledge-source-manager`.
- Model parameters such as temperature or output length – use `model-settings`.

## Anatomy

1. **Pipeline** `.ui-rset__flow` – the stages in order, each a tab with its summary
2. **Stage** `.ui-rset__stage[aria-selected="true"]` – the open stage; its summary updates as you edit
3. **Settings** `.ui-rset__panel` – the open stage's controls
4. **Chunks** `.ui-rset__chunks` – three staggered chunks drawn at the size and overlap set
5. **Estimate** `.ui-rset__estimate` – the app's latency, cost and context size per query

## Looks

Standard is a white card on a gray tray: the pipeline sits in a gray well with raised white stages, and the open stage
is ringed in ink. Clean is one white card with an accent-tinted pipeline, hairline stages ringed in the accent when
open, accent range fills and chunks, quieter labels, and the estimate as the card's last row. Below 480 px the
pipeline runs top to bottom and the settings stack in one column.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Reaches the open stage, then moves on through its settings |
| ← / → / ↑ / ↓ | On a stage: moves to the previous or next stage, wrapping (without opening it) |
| Home / End | On a stage: moves to the first or last stage |
| Enter / Space | On a stage: opens its settings |
| ← / → / Home / End / Page Up / Page Down | On the balance or the threshold: changes it |
| Space / Enter | On the rerank switch: turns reranking on or off |

Numbers, selects and the filter values are native controls with their usual keys; a number is applied when it changes
(on Enter or leaving the field). Removing a filter moves focus to the next filter's field, else the one before, else
Add filter; Add filter focuses the new filter's field.

## Screen readers

The host is a group named by the heading. The stages are a `tablist` named “Pipeline”; each `tab` reads its summary –
“Retrieve 40, 70% vector, 84ms” – and the open stage's settings are its `tabpanel`. Query is plain text, not a tab. A
stage with a problem adds “, needs a fix”. The balance is a range named “Keyword ↔ vector” whose value reads “70%
vector”, “Keyword only” or “Even keyword and vector”; the threshold reads “Score at least 0.35”. Each number is named
(“Chunk size”, “Chunks into context”) and, when wrong, invalid and described by the error – “Overlap has to be smaller
than the chunk.”, “Context can't take more chunks than retrieval returns.” Filters are numbered: “Filter 2: field”,
“Remove filter 2”. In a form, the first of these problems makes it invalid.

## Content

- Name filter fields as your metadata reads to people: “Collection”, “Updated”, not `source_collection`. Give choice
  fields their options, so the value is a select.
- Name rerank models by what they are to the person tuning – “Cross-encoder · small” – not by an endpoint.
- Keep `estimate.note` to one sentence that says what to change: “Reranking 80 chunks is most of the wait – a k of 40
  halves it.”
- Pass `indexed` so changing chunking warns that sources will be re-indexed before anyone saves.

## Do

- Recompute `estimate` from the value on every change, so the pipeline and the foot follow the settings.
- Put a `retrieval-inspector` beside it, run against a test question, so people see what their change does.
- Validate on the server too: `retrievalSettingsProblem` is exported for the same checks.

## Don't

- Don't show estimates you haven't measured – leave `estimate` unset rather than guess.
- Don't put embedding models or index-time settings other than chunking here; they belong where sources are managed.
- Don't default to a huge top-k with reranking on – the estimate will say it's slow, but the default should be sane.

## Example

```html
<tc-retrieval-settings id="rag" name="retrieval"></tc-retrieval-settings>

<script type="module">
  import "trenchcoat/retrieval-settings";
  import "trenchcoat/tokens.css";

  const rag = document.querySelector("#rag");
  rag.filterFields = [
    { id: "language", label: "Language", type: "choice", options: ["English", "German"] },
    { id: "updated", label: "Updated", type: "date" },
  ];
  rag.rerankModels = [{ id: "small", label: "Cross-encoder · small" }];
  rag.indexed = { chunkSize: 512, chunkOverlap: 64 };
  rag.addEventListener("tc-value-change", (e) => {
    rag.estimate = { latencyMs: 120 + e.detail.value.topK * 2 };
  });
</script>
```

```tsx
import { useState } from "react";
import { RetrievalSettings, RETRIEVAL_SETTINGS_DEFAULT, type RetrievalSettingsValue } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function HelpCentreRetrieval() {
  const [value, setValue] = useState<RetrievalSettingsValue>(RETRIEVAL_SETTINGS_DEFAULT);
  return (
    <RetrievalSettings
      title="Retrieval"
      description="Help centre index"
      value={value}
      onChange={setValue}
      rerankModels={[{ id: "small", label: "Cross-encoder · small" }]}
      estimate={{ latencyMs: 120 + value.topK * 2, contextTokens: value.topN * value.chunkSize }}
    />
  );
}
```
