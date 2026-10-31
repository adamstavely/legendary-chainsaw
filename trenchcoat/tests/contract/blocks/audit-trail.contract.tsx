import type { ContractSpec } from "../../contract.test";

// The block is <tc-audit-trail> through trenchcoat/react. Its state is checked in a real browser (tests/elements/audit-trail.test.ts)
export const spec: ContractSpec = { root: "tc-audit-trail", component: "AuditTrail", props: { events: [] }, ref: "root" };
