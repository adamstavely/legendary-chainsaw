import type { ContractSpec } from "../../contract.test";

// The block is <tc-pricing-plans> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/pricing-plans.test.ts)
export const spec: ContractSpec = {
  component: "PricingPlans",
  props: {},
  root: "tc-pricing-plans",
  ref: "root",
};
