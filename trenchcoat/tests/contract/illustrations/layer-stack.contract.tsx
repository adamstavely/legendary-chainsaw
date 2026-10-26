import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "LayerStack",
  props: { onIndexChange: () => {} },
  controlled: [
    {
      prop: "index",
      values: [0, 3],
      read: (root) => [...root.querySelectorAll('[role="tab"]')].findIndex((tab) => tab.getAttribute("aria-selected") === "true"),
    },
  ],
};
