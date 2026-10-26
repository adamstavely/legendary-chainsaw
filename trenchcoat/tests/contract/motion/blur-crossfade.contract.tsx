import type { ContractSpec } from "../../contract.test";

// The root is the swapping box (div by default); `id` is the swap key and never reaches the DOM
export const spec: ContractSpec = {
  component: "BlurCrossfade",
  props: { id: 1, children: "Saved" },
};
