import type { ContractSpec } from "../../contract.test";

// One spec per file: Skeleton is the main export; ShimmerText follows the same contract (tests/regressions/motion-shimmer-loader)
export const spec: ContractSpec = {
  component: "Skeleton",
  props: { width: 120 },
};
