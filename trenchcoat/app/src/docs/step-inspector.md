---
pattern: form
status: new
related: workflow-canvas, step-picker, tool-configuration, json-viewer
---

## Overview

One workflow step's settings. It shows the step's title and each of its inputs with where the value comes from:
either typed in, or mapped from an earlier step's output. A mapping shows as a chip, such as
"Extract fields › amount", with its reference (`extract.amount`) beside it. A required input with nothing behind it
says so in words, and the header counts how many are missing. "Test with sample" asks the page to run the step, and
the last run's input and output show as JSON.

## When to use

- The side panel beside a `workflow-canvas`, for the selected step.
- Any step-by-step automation where inputs are wired from what came before.

## When not to use

- Defining a tool's parameters and schema – use `tool-configuration`.
- Reading a large JSON result on its own – use `json-viewer`.
- Choosing which step to add – use `step-picker`.

## Anatomy

1. **Title** `.ui-sti__section` – the step's title, editable
2. **Input** `.ui-sti__input` – an input's name, Required, its description and where it comes from
3. **Source** `.ui-sti__source` – Value or From a step
4. **Field** `.ui-sti__field` – a typed value: text, a number, several lines or a choice
5. **Mapping** `.ui-sti__chip` – the step and output it comes from, opening the list `.ui-sti__list`
6. **Missing** `.ui-sti__error` – what a required input needs
7. **Test** `.ui-sti__test` – Test with sample
8. **Last run** `.ui-sti__run` – how it went, and its Input and Output in `.ui-sti__json`

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. Inputs sit on a sunken panel each; a missing one has a warning outline as well as its
message. Set the JSON block's height with `--tc-sti-json-h`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the title, each input's source, field or mapping, Test, and the last run |
| ← / → | In a source, switches between Value and From a step; in the last run, between Input and Output |
| Enter / Space | On a mapping, opens the list of outputs |
| ↑ / ↓ | In the list of outputs, moves between them |
| Home / End | In the list of outputs, moves to the first or last |
| Enter / Space | In the list, maps the input to that output |
| Escape | Closes the list and returns to the mapping |

## Screen readers

Each input is a fieldset named by its label, with Required in the name. Its source is a pair of radio buttons in a
named group. A typed value's field is labelled by the input and described by its description and, when it's missing,
by the message; it's marked invalid while missing. A mapping is a button that opens a listbox of earlier steps'
outputs, grouped by step, and reads the step and output it's mapped to. Mapping an input is confirmed in a polite
status message ("Amount comes from Extract fields amount"), and so is a finished test. Test with sample is
aria-disabled while inputs are missing, and described by why. The last run's Input and Output are tabs over a
focusable block.

## Content

- Label inputs as nouns the person knows: "Amount", "Cost centre", not field ids.
- Use `description` for the format or an example: "The team the spend is charged to, e.g. CC-210".
- Name outputs as they'll be referenced, short and lowercase: `amount`, `po_number`.
- Give outputs a `sample` so people can tell similar ones apart.

## Do

- Pass only the steps that run before this one as `upstream`.
- Set `testing` while a test runs, then `lastRun` with its input and output.
- Save on `tc-step-change`, or keep the change until the page's own Save.

## Don't

- Don't make every input required – only the ones the step can't run without.
- Don't put secrets in a typed value; map them from a secrets store instead.

## Example

```html
<tc-step-inspector id="inspector"></tc-step-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/step-inspector";
  import "@adamstavely/trenchcoat/tokens.css";

  const inspector = document.querySelector("#inspector");
  inspector.upstream = [{ id: "extract", title: "Extract fields", kind: "llm", outputs: [{ name: "amount", type: "number", sample: "12,480.00" }] }];
  inspector.step = {
    id: "post",
    kind: "output",
    title: "Post to ledger",
    inputs: [
      { id: "amount", label: "Amount", required: true, source: { kind: "ref", ref: "extract.amount" } },
      { id: "cost-centre", label: "Cost centre", required: true, placeholder: "CC-000" },
    ],
  };
  inspector.addEventListener("tc-step-change", (e) => console.log(e.detail.step));
</script>
```

```tsx
import { useState } from "react";
import { StepInspector, type InspectorStep, type StepRun, type UpstreamStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PostToLedger({ upstream, start, run }: { upstream: UpstreamStep[]; start: InspectorStep; run: (step: InspectorStep) => Promise<StepRun> }) {
  const [step, setStep] = useState(start);
  const [testing, setTesting] = useState(false);
  const [lastRun, setLastRun] = useState<StepRun | null>(null);
  return (
    <StepInspector
      step={step}
      upstream={upstream}
      testing={testing}
      lastRun={lastRun}
      onStepChange={setStep}
      onTest={async (s) => {
        setTesting(true);
        setLastRun(await run(s));
        setTesting(false);
      }}
    />
  );
}
```
