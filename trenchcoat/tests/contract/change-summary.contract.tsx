import type { ContractSpec } from "../contract.test";

// Stateless: the contract is className, DOM props, look and the ref on the <section>
export const spec: ContractSpec = {
  component: "ChangeSummary",
  props: { changes: [{ label: "Active users", change: "Up 6.1% to 18.2K", tone: "good" }] },
  ref: "root",
};
