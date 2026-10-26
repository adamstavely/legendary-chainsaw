import type { ContractSpec } from "../contract.test";

// Plan vs Actual has one look (Clean): no look prop, so only the root, DOM props and ref are checked
export const spec: ContractSpec = {
  component: "PlanVsActual",
  only: "clean",
  props: {
    title: "Release",
    elapsed: 4000,
    steps: [
      { id: "a", title: "Plan", plan: 3000, start: 0, end: 2500 },
      { id: "b", title: "Build", plan: 5000, deps: ["a"], start: 2500 },
    ],
  },
};
