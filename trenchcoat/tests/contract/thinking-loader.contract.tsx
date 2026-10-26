import type { ContractSpec } from "../contract.test";

const phases = ["Thinking", "Searching the web", "Reading sources"];

export const spec: ContractSpec = {
  component: "ThinkingLoader",
  props: { phases },
  ref: "root",
  controlled: [
    {
      prop: "phase",
      values: [0, 2],
      read: (root) => phases.indexOf(root.querySelector(".ui-tl__label:not(.ui-tl__label--out)")!.textContent!),
    },
  ],
};
