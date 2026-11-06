import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "DesignSystemComponentScreen",
  props: {},
  controlled: [
    {
      prop: "tab",
      values: ["Usage", "Code"],
      read: (root) => root.querySelector('.ui-dsc__bar [role="tab"][aria-selected="true"]')?.getAttribute("data-text") ?? undefined,
    },
  ],
};
