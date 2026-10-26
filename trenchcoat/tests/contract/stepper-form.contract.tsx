import type { ContractSpec } from "../contract.test";

type Values = { name: string };

const steps = [
  { id: "one", title: "One", render: ({ values }: { values: Values }) => <input readOnly aria-label="Name" value={values.name} /> },
  { id: "two", title: "Two", render: () => <p>Second</p> },
];

// The root is the outer <div>; the step index and the values are both controllable. The building blocks
// (StepperInput, StepperTags, StepperChoices) are covered in tests/regressions/stepper-form.test.tsx
export const spec: ContractSpec = {
  component: "StepperForm",
  props: { steps, defaultValues: { name: "" } },
  controlled: [
    {
      prop: "values",
      values: [{ name: "Ada" }, { name: "Grace" }],
      read: (root) => ({ name: root.querySelector<HTMLInputElement>('[data-pane="current"] input')?.value }),
    },
    {
      prop: "step",
      values: [0, 1],
      read: (root) => [...root.querySelectorAll(".ui-sf__step")].findIndex((li) => li.getAttribute("aria-current") === "step"),
    },
  ],
};
