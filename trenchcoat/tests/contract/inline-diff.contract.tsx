import type { ContractSpec } from "../contract.test";

// InlineDiff keeps its documented imperative handle on `ref`; the root is its wrapper div
export const spec: ContractSpec = {
  component: "InlineDiff",
  props: { original: "The quick brown fox", suggested: "The slow brown fox" },
  ref: { handle: (h) => !!h && typeof (h as { acceptAll?: unknown }).acceptAll === "function" && typeof (h as { undo?: unknown }).undo === "function" },
  controlled: [
    {
      prop: "decisions",
      values: [{ 0: "accepted" }, { 0: "rejected" }],
      read: (root) => ({ 0: root.querySelector<HTMLElement>(".ui-df__chg")!.dataset.state }),
    },
  ],
};
