import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "DesignSystemReleasesScreen",
  props: {},
  controlled: [
    {
      prop: "stage",
      values: ["In translation", "Released"],
      read: (root) => root.querySelector('.ui-dsr__stages [role="tab"][aria-selected="true"] .ui-dsr__stage-name')?.textContent ?? undefined,
    },
  ],
};
