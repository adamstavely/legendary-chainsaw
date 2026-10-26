import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "AppShellWorkspaceFlat",
  props: { children: "Page", onPanelOpenChange: () => {} },
  ref: "root",
  controlled: [{ prop: "panelOpen", values: [true, false], read: (root) => root.getAttribute("data-panel") === "open" }],
};
