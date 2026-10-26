import type { ContractSpec } from "../contract.test";

// CommandMenu's root is a <div>; the search text is controllable (query / defaultQuery / onQueryChange)
export const spec: ContractSpec = {
  component: "CommandMenu",
  props: {},
  ref: "root",
  controlled: [{ prop: "query", values: ["mail", "home"], read: (root) => root.querySelector<HTMLInputElement>('[role="combobox"]')!.value }],
};
