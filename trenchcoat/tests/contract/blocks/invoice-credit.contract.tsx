import type { ContractSpec } from "../../contract.test";

// The block is <tc-invoice-credit> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an
// element's properties, so controlled `view` is checked in a real browser (tests/elements/invoice-credit.test.ts)
export const spec: ContractSpec = {
  root: "tc-invoice-credit",
  component: "InvoiceCredit",
  props: {},
  ref: "root",
};
