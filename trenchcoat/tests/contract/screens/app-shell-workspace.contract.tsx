import type { ContractSpec } from "../../contract.test";

// The workspace pane is App Shell's `panel`: same root, ref and controlled work area
export const spec: ContractSpec = {
  component: "AppShellWorkspace",
  props: { children: "Page", onPanelOpenChange: () => {} },
  ref: "root",
  controlled: [{ prop: "panelOpen", values: [true, false], read: (root) => root.getAttribute("data-panel") === "open" }],
};
