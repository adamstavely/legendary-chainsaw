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

export const spec: ContractSpec = {
  component: "ClientContext",
  props: { clients },
  ref: "root",
  controlled: [
    {
      prop: "client",
      values: ["north", "acme"],
      read: (root) => clients.find((c) => c.name === root.querySelector(".ui-cx__name")?.textContent)?.id,
    },
  ],
};
