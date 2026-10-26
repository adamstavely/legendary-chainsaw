import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "FolderScreen",
  props: {},
  // `folder` has always been a value prop: the screen shows whichever folder it names
  controlled: [{ prop: "folder", values: ["Q3 Campaign", "Hiring"], read: (root) => root.querySelector(".ui-as-page-title")?.textContent }],
};
