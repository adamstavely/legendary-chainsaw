import type { ContractSpec } from "../../contract.test";

// The block is <tc-access-review> through trenchcoat/react. Its state is checked in a real browser (tests/elements/access-review.test.ts)
export const spec: ContractSpec = { root: "tc-access-review", component: "AccessReview", props: { items: [] }, ref: "root" };
