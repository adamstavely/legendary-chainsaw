import type { ContractSpec } from "../../contract.test";

const sources = [
  { part: "A", kind: "gap", amount: 3 },
  { part: "A", kind: "chance", amount: 2 },
  { part: "B", kind: "model", amount: 5 },
];

// The block is <tc-uncertainty-mix> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/uncertainty-mix.test.ts)
export const spec: ContractSpec = {
  root: "tc-uncertainty-mix",
  component: "UncertaintyMix",
  props: { sources },
  ref: "root",
};
