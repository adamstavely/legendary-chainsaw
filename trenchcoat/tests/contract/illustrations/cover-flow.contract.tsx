import type { ContractSpec } from "../../contract.test";

// The root is the outer <div> (the carousel region sits inside it). `index` is controlled, but the row springs
// to a new index over animation frames, so tests/regressions/illustrations-cover-flow.test.tsx checks it with fake timers
export const spec: ContractSpec = {
  component: "CoverFlow",
  props: { items: [{ id: 1, title: "One" }, { id: 2, title: "Two" }, { id: 3, title: "Three" }] },
};
