import type { ContractSpec } from "../contract.test";

const options = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
];

// The root is the outer <div> (the radiogroup sits inside it); `value` is controlled
export const spec: ContractSpec = {
  component: "SegmentedControl",
  props: { options, "aria-label": "Pick" },
  controlled: [
    {
      prop: "value",
      values: ["a", "b"],
      read: (root) => root.querySelector('[role="radio"][aria-checked="true"]')?.textContent?.charAt(0).toLowerCase(),
    },
  ],
};
