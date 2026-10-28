import type { ContractSpec } from "../../contract.test";

const client = (id: string, name: string) => ({
  id,
  name,
  meta: `${name} Ltd`,
  mark: { letter: name[0], bg: "#1d4ed8", fg: "#ffffff" },
  kpis: [],
  reports: [],
  context: [],
});
const clients = [client("north", "Northwind"), client("acme", "Acme")];

// The block is <tc-client-context> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/client-context.test.ts)
export const spec: ContractSpec = {
  root: "tc-client-context",
  component: "ClientContext",
  props: { clients },
  ref: "root",
};
