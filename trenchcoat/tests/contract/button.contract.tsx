import type { ContractSpec } from "../contract.test";

// Button is a <button>: the root is the element itself and the ref is the DOM button
export const spec: ContractSpec = {
  component: "Button",
  props: { children: "Save" },
  ref: "root",
};
