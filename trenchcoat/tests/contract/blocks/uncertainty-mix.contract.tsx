import type { ContractSpec } from "../../contract.test";

const sources = [
  { part: "A", kind: "gap", amount: 3 },
  { part: "A", kind: "chance", amount: 2 },
  { part: "B", kind: "model", amount: 5 },
];

export const spec: ContractSpec = {
  component: "UncertaintyMix",
  props: { sources },
  ref: "root",
  controlled: [
    {
      prop: "hidden",
      values: [["model"], ["gap", "chance"]],
      read: (root) => {
        const shown = root.querySelector(".ui-umix__bar")?.getAttribute("aria-label") ?? "";
        return [
          ["gap", "Missing information"],
          ["chance", "Inherent uncertainty"],
          ["model", "Model limits"],
        ]
          .filter(([, label]) => !shown.includes(label))
          .map(([key]) => key);
      },
    },
  ],
};
