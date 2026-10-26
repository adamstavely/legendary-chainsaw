import type { ContractSpec } from "../../contract.test";

// App Shell Flat renders App Shell with its own class added: the same root, ref and controlled work area
export const spec: ContractSpec = {
  component: "AppShellFlat",
  props: { children: "Page", panel: "Tools", onPanelOpenChange: () => {} },
  ref: "root",
  controlled: [{ prop: "panelOpen", values: [true, false], read: (root) => root.getAttribute("data-panel") === "open" }],
};
