import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "FilesScreen",
  props: {},
  controlled: [{ prop: "view", values: ["grid", "list"], read: (root) => root.querySelector(".ui-as-folders")?.getAttribute("data-view") }],
};
