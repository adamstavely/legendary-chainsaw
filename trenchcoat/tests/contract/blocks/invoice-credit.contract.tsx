import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "InvoiceCredit",
  props: {},
  ref: "root",
  controlled: [{ prop: "view", values: ["invoice", "credit"], read: (root) => root.getAttribute("data-view") }],
};
