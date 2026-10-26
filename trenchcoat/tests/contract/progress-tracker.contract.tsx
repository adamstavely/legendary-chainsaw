import type { ContractSpec } from "../contract.test";

const steps = [
  { id: "a", label: "First" },
  { id: "b", label: "Second" },
];

// The root is the outer <div>; `done` lists the ticked step ids
export const spec: ContractSpec = {
  component: "ProgressTracker",
  props: { steps },
  controlled: [
    {
      prop: "done",
      values: [["a"], ["a", "b"]],
      read: (root) =>
        [...root.querySelectorAll('[role="checkbox"]')]
          .map((el, i) => (el.getAttribute("aria-checked") === "true" ? steps[i].id : null))
          .filter(Boolean),
    },
  ],
};
