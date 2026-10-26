import type { ContractSpec } from "../contract.test";

// IntegrationPicker's root is a <div>; the connected ids (connected / defaultConnected / onConnectedChange), the
// picked integration (selected / defaultSelected / onSelectedChange) and the search (query / defaultQuery /
// onQueryChange) are controllable. `connected` is read from the switch of the picked integration.
export const spec: ContractSpec = {
  component: "IntegrationPicker",
  props: { selected: "linear" },
  ref: "root",
  controlled: [
    { prop: "connected", values: [[], ["linear"]], read: (root) => (root.querySelector('[role="switch"]')!.getAttribute("aria-checked") === "true" ? ["linear"] : []) },
    { prop: "selected", values: ["linear", "figma"], read: (root) => root.querySelector('[role="option"][aria-selected="true"]')?.getAttribute("data-id") },
    { prop: "query", values: ["lin", "fig"], read: (root) => root.querySelector<HTMLInputElement>('[role="combobox"]')!.value },
  ],
};
