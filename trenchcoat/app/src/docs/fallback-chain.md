---
pattern: listbox
status: new
related: model-routing, trace-waterfall, parallel-attempts, model-picker
---

## Overview

One request finding a model that answers, as a small flow: the request, then each model in fallback order, waiting, trying, failed, answered or skipped. A line says how it went, and picking a model shows its reason and how long it took.

## When to use

- Showing why a particular model answered.
- Debugging a request that was slow or failed.

## When not to use

- Configuring routes and fallbacks – use `model-routing`.
- Every step of an agent run – use `trace-waterfall`.
- Trying several models on purpose and comparing them – use `parallel-attempts`.

## Anatomy

1. **Request** `.ui-fbc__request` – what was asked
2. **Link** `.ui-fbc__link` – the connector, with a light on the way to the model being tried
3. **Model** `.ui-fbc__model` – its name, `.ui-fbc__provider` and `.ui-fbc__state`
4. **Summary** `.ui-fbc__summary` – how it went
5. **Detail** `.ui-fbc__detail` – `.ui-fbc__reason` and `.ui-fbc__took`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. The flow runs across on a wide page and down on a narrow one.

## Keyboard

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move between models |
| Home / End | Go to the first or last model |
| Enter / Space | Opens or closes a model |
| Escape | Closes it |

## Screen readers

The models are a `listbox` named as being in fallback order, with one tab stop. Each state is a word, with a mark. The summary is `role="status"`, so progress is announced as the states change.

## Content

Write `reason` as what happened: "Timed out after 8 seconds", not an error code. Give `latencyMs` for anything that was tried. Tries count models that failed, answered or are being tried, not skipped ones.

## Do

- Update `attempts` as the request progresses, and the flow and summary follow.
- Set a reason on skipped models, so nobody wonders why they weren't tried.

## Don't

- Don't expose private routing details here if the people using it shouldn't see them.

## Example

```html
<tc-fallback-chain id="chain" request="Summarise the report"></tc-fallback-chain>

<script type="module">
  import "trenchcoat/fallback-chain";
  import "trenchcoat/tokens.css";

  document.querySelector("#chain").attempts = [
    { id: "a", model: "Model A", state: "failed", reason: "Timed out" },
    { id: "b", model: "Model B", state: "answered", latencyMs: 1200 },
  ];
</script>
```

```tsx
import { FallbackChain, type FallbackAttempt } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const attempts: FallbackAttempt[] = [
  { id: "a", model: "Model A", state: "failed", reason: "Timed out" },
  { id: "b", model: "Model B", state: "answered", latencyMs: 1200 },
];

export function Chain() {
  return <FallbackChain request="Summarise the report" attempts={attempts} />;
}
```
