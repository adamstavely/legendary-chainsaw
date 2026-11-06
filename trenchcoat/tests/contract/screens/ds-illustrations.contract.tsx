import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "DesignSystemIllustrationsScreen",
  props: {},
  controlled: [
    { prop: "tab", values: ["All", "Laws"], read: (root) => root.querySelector('[role="tab"][aria-selected="true"]')?.textContent },
    { prop: "view", values: ["grid", "list"], read: (root) => root.querySelector(".ui-dsi-grid")?.getAttribute("data-view") },
  ],
};
