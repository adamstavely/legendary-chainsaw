---
pattern: grid
status: new
related: eval-scorecard, feedback-rubric, data-table, run-compare
---

## Overview

Edits the set of test cases an eval runs. Each case is an input, what a good answer looks like – an expected output,
checks such as “contains”, “equals”, “matches schema” or a rubric line, or both – its tags and the split it belongs
to. A bar shows how the cases divide between train, validation and test; the table holds thousands of cases and
filters by split, by text and to what changed since an earlier version. An open case reads as a test case – the
prompt quoted beside the rules it has to pass, such as `output contains "refund"` – and Edit turns it into a form;
what's wrong with a case shows where it's wrong. It pairs with `eval-scorecard`: this is where the set is written, the scorecard is where the
results of running it are read. The component never runs anything – import, export and running the eval belong to
the app.

## When to use

- Curating an evaluation set: adding cases, writing checks, tagging and splitting them.
- Reviewing what changed in a set before a new version is used for a release decision.
- Receiving cases from elsewhere – reviewed conversations, a support export – and putting them in the right split.

## When not to use

- Reading the results of running the set against prompt or model versions – use `eval-scorecard`.
- Rating one answer so it can become a case – use `feedback-rubric`.
- Comparing two runs of one task step by step – use `run-compare`.
- Tabular data that isn't a test set – use `data-table`.

## Anatomy

1. **Header** `.tc-head` – the set's name, the case count, problems, Compare, Import, Export and Add case
2. **Split bar** `.ui-eds__splits` – the share of cases in each split, with the change since the compared version
3. **Filters** `.ui-eds__filters` – the split as a radio group with counts, search, Changed and the removed cases
4. **Table** `.ui-eds__grid` – one row per case: its input, what checks it, its tags as chips and its split
5. **Open case** `.ui-eds__read` – the quoted prompt beside the rules it has to pass, with its split and tags; Edit
   swaps it for the form

## Looks

Standard puts the header on a gray tray above a white card, with a square mark tile, a semibold title and the open
row filled gray; the prompt has a gray rule down its side. Clean is one white card with hairline dividers: a rounded
mark, caption-style column heads and labels, round split dots and tag chips, an accent rule beside the prompt, and the
open row and picked split tinted with the accent. Wide, the open case sits beside the table, the table runs as tall
as it and the tags move under each input; the prompt and the rules sit side by side once the case has 480 px, stacked
below that. Under 600 px the table keeps the case (tags under it) and its split, the case sits below and the header's
buttons wrap under the title (icons only under 400 px).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the header's controls, the split filter, search, the toggles, the table (one stop) and the open case |
| ← / → / ↑ / ↓ | In the split filter: picks the previous or next split. In the table: moves the active cell. In the case's split: picks the previous or next split |
| Home / End | In the table: first or last cell of the row |
| Ctrl+Home / Ctrl+End | In the table: first or last case |
| Page Up / Page Down | In the table: up or down ten cases |
| Enter / Space | In the table: opens the active row's case to read |
| F2 | In the table: opens the active row's case in its form. In the open case: edits it |
| Enter | On the open case's read view: edits it |
| Escape | In the form: saves the field being typed in and goes back to the read view. In the read view or the table: closes the case and returns to the table |
| Enter or , | In the tags field: adds the tag typed |
| Backspace | In an empty tags field: removes the last tag |

Edit and Done switch between the read view and the form; the form's cursor starts in the input, and Done or Escape
returns focus to Edit. The form's fields are native textareas, inputs and selects with their usual keys; an edit is
saved when the field loses focus, or on Done or Escape.

## Screen readers

The host is a group named by the heading. The table is a `grid` named by the heading, with `aria-rowcount` for every
case on show (rows outside the window aren't in the page) and `aria-activedescendant` on the active cell. A row
with a problem starts “Has a problem” or “Has a warning”; a changed row starts with its “New” or “Edited” pill. The
split filter is a `radiogroup` named “Split”, each option read with its count (“Train, 1,681 cases”). The legend
is a list named “Cases by split” – “Train 1,681, 70%, +7 since v3”. The open case is a region named “Case case-r1”; its read
view is a focusable group with the same name, described by “Enter or F2 to edit”, and a broken rule starts with
“Problem:”. In the form, a check with a problem is `aria-invalid` and described by it (“Check 1 isn't valid JSON”). A status region says the
number of cases after a filter, “Case added”, “Case deleted”, “Case restored” and “Compared with v3: 12 new, 4 edited,
3 removed”. In a form, a set with an error is invalid (“Fix 1 problem in the cases first.”).

## Content

- Name the set for what it tests – “Support replies”, “Refund policy answers” – and use `description` for its scope.
- Write inputs as the person would type them, typos included; the input is the row's label, so lead with the point.
- Checks read back as rules – “output contains “5–10 business days””, a rubric as its criterion – so write the value
  as the rule's end, not as a sentence about it.
- Prefer one check per behaviour: “contains · 5–10 business days” rather than a rubric that says the same thing.
- Version labels are short (“v3”) with the when or why in `detail` (“Oct 19 · before the refund policy”).
- Splits and check types are data: pass your own (`dev` and `test`, a “regex” check) with plain labels.

## Do

- Keep the earlier versions the team decides against in `versions`, so a reviewer can see what changed and restore a
  removed case.
- Read the file in `tc-import` with your own picker; `evaluationDatasetFromJsonl` reads JSON Lines and reports bad
  lines by number.
- Run the checks on the server, and show the results in `eval-scorecard`.
- Store `value` as it is – the app owns the ids.

## Don't

- Don't run evals from the client because the set is here – the component has no run action on purpose.
- Don't move a case between test and train to make a number better; the deltas show it.
- Don't put secrets or personal data into inputs; redact before cases reach the set (`conversation-annotation`
  can redact spans first).

## Example

```html
<tc-evaluation-dataset-editor id="set" name="set"></tc-evaluation-dataset-editor>

<script type="module">
  import "trenchcoat/evaluation-dataset-editor";
  import "trenchcoat/tokens.css";

  const set = document.querySelector("#set");
  set.heading = "Support replies";
  set.value = {
    cases: [
      { id: "case-1", input: "Where is my order 10400?", expected: "Gives the tracking link", assertions: [{ id: "c1", type: "contains", value: "tracking" }], tags: ["shipping"], split: "train" },
      { id: "case-2", input: "Refund for a broken mug", assertions: [{ id: "c1", type: "rubric", value: "Offers a refund or a replacement" }], tags: ["refunds"], split: "test" },
    ],
  };
  set.addEventListener("tc-export", (e) => console.log(e.detail.jsonl));
</script>
```

```tsx
import { useState } from "react";
import { EvaluationDatasetEditor, type EvaluationDatasetValue, type EvaluationDatasetVersion } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function SupportSet({ start, versions }: { start: EvaluationDatasetValue; versions: EvaluationDatasetVersion[] }) {
  const [value, setValue] = useState(start);
  return (
    <EvaluationDatasetEditor
      title="Support replies"
      value={value}
      onChange={setValue}
      versions={versions}
      defaultCompare={versions[versions.length - 1]?.id ?? ""}
      onImport={() => console.log("open a file picker")}
      onExport={(_, jsonl) => console.log(jsonl.length)}
    />
  );
}
```
