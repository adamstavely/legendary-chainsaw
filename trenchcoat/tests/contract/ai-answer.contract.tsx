import type { ContractSpec } from "../contract.test";

const DOWN = { value: "down" };

export const spec: ContractSpec = {
  component: "AIAnswer",
  props: { sources: [], answer: "Done.", animate: false },
  ref: "root",
  controlled: [
    {
      // A thumbs down without a reason yet opens the reasons row – rendered at every phase
      prop: "feedback",
      values: [null, DOWN],
      read: (root) => (root.querySelector(".ui-ans__reasons")?.getAttribute("data-open") === "true" ? DOWN : null),
    },
  ],
};
