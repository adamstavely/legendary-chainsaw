---
pattern: none
status: stable
related: progress-tracker, setup-guide, segmented-control, otp-input
---

## Overview

A multi-step flow – onboarding, setup or checkout – in one card. Numbered steps run along the top and swap their
number for a check once done; each step slides in from the side people are heading and the card glides to its
height. Continue checks the step: fields with a problem shake once and say what's wrong, and focus goes to the first
one. Back keeps everything entered, finished steps can be jumped back to, and the last step runs `onComplete` –
showing “Creating…”, an error that can be retried, then a short success state. On narrow screens the steps collapse
to “Step 2 of 4 · Team”.

## When to use

- Setting something up that needs a handful of decisions in order: a workspace, a project, an integration.
- Forms long enough to be tiring on one screen, that split into steps people understand.
- Flows that end in a review of what was entered and one final action.

## When not to use

- A checklist of tasks people do in any order, across the product – use `progress-tracker` or `setup-guide`.
- Switching between views, not moving through steps – use `segmented-control`.
- A single verification code – use `otp-input`.

## Anatomy

1. **Steps** `.ui-sf__head` – the numbered steps, or “Step 2 of 4 · Team” when narrow
2. **Heading** `.ui-sf__heading` – the open step's heading and its line of description
3. **Field** `.ui-sf__field` – a label, the control and the hint or message under it
4. **Footer** `.ui-sf__foot` – Back and Continue (Finish on the last step)

## Looks

Standard puts the steps on a gray tray above a white card, numbered “1.”, “2.” and so on, with Back and Continue at
the bottom of the card. Clean is one white card with hairline shadows: a thin progress bar per step along its top
with a small capitalised label under it, and Back and Continue in a last row under a hairline. Both slide, shake and
check off steps the same way, and the footer stays in view while a long step scrolls.

## Keyboard

| Key | What it does |
|---|---|
| Enter | In a field: Continue (or Finish on the last step) |
| Enter / , / ; | In an email list: adds what was typed as a chip; with nothing typed, Enter continues |
| Backspace | In an empty email list: removes the last chip |
| ← → ↑ ↓ | In a set of choice cards: chooses the previous or next card, wrapping |
| Enter | On a choice card: Continue |
| Tab | Moves through the steps people can jump back to, the step's fields, Back and Continue |

## Screen readers

The steps are an ordered list named “Progress”; the open one is `aria-current="step"` and the others say “(done)”
where they're finished. The form is named by the open step's heading, and focus moves to the new step's first field
(or its heading). Each field's label is tied to its control; a problem sets `aria-invalid` and describes the control
with the message, otherwise the hint describes it. Continue is `aria-disabled` while the step has problems but stays
pressable, so pressing it shows them. One polite status region says each move – “Step 2 of 4: Team” – the first
problem after a failed Continue, “All done” at the end, and an `onComplete` error, which also shows as an alert next
to the button. Email chips are a list named “Added” with “Remove ana@acme.com” buttons; choice cards are a radio
group named by `label`.

## Content

- Keep step titles to one word or two – “Workspace”, “Team”, “Plan”, “Review” – and use `heading` for the full
  question: “Name your workspace”.
- Write messages as what to do, not what's wrong: “Give it a name of at least 2 characters”.
- Use the hint for what helps before typing (“You can change this later in settings.”); the message replaces it while
  there's a problem.
- Name the last button after what it does (`submitLabel`: “Create workspace”) and `submittingLabel` after the work:
  “Creating…”.
- Mark fields people can skip `optional` rather than marking the required ones.

## Do

- Keep the flow to three to six steps, and end with a review (`tc-stepper-review`) when the result is hard to undo.
- Throw from `onComplete` with a message people can act on – it's shown as is, with Finish to try again.
- Use the building blocks (`tc-stepper-field`, `tc-stepper-input`, `tc-stepper-tags`, `tc-stepper-choices`) so labels,
  messages and focus are wired for you.

## Don't

- Don't check fields as people type – the step is checked on Continue, so nobody is told off mid-word.
- Don't put unrelated questions in one step to save a step.
- Don't lose what was entered when people go back – keep it all in `values`.

## Example

```html
<tc-stepper-form id="setup" submit-label="Create workspace"></tc-stepper-form>

<script type="module">
  import { html } from "lit";
  import "trenchcoat/stepper-form";
  import "trenchcoat/tokens.css";

  const form = document.querySelector("#setup");
  form.values = { workspace: "" };
  form.steps = [
    {
      id: "workspace",
      title: "Workspace",
      heading: "Name your workspace",
      validate: (v) => ({ workspace: v.workspace.trim() ? undefined : "Give your workspace a name" }),
      render: ({ values, setValues }) => html`
        <tc-stepper-field name="workspace" label="Workspace name">
          <tc-stepper-input><input .value=${values.workspace} @input=${(e) => setValues({ workspace: e.target.value })} /></tc-stepper-input>
        </tc-stepper-field>`,
    },
    { id: "review", title: "Review", render: ({ values }) => html`<tc-stepper-review .rows=${[{ label: "Workspace", value: values.workspace }]}></tc-stepper-review>` },
  ];
  form.onComplete = async (values) => console.log("create", values);
  form.addEventListener("tc-step-change", (e) => console.log("step", e.detail.step));
</script>
```

```tsx
import { StepperForm, StepperField, StepperInput, StepperReview, type Step } from "trenchcoat/react";
import "trenchcoat/tokens.css";

type Values = { workspace: string };

const steps: Step<Values>[] = [
  {
    id: "workspace",
    title: "Workspace",
    heading: "Name your workspace",
    validate: (v) => ({ workspace: v.workspace.trim() ? undefined : "Give your workspace a name" }),
    render: ({ values, setValues }) => (
      <StepperField name="workspace" label="Workspace name">
        <StepperInput value={values.workspace} onChange={(e) => setValues({ workspace: e.target.value })} />
      </StepperField>
    ),
  },
  { id: "review", title: "Review", render: ({ values }) => <StepperReview rows={[{ label: "Workspace", value: values.workspace }]} /> },
];

export function CreateWorkspace() {
  return (
    <StepperForm<Values>
      steps={steps}
      defaultValues={{ workspace: "" }}
      submitLabel="Create workspace"
      onComplete={async (values) => console.log("create", values)}
    />
  );
}
```
