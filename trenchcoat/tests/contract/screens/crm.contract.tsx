import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "CrmScreen",
  props: {},
  controlled: [
    {
      prop: "tab",
      values: ["Company CRM", "Sales docs"],
      read: (root) => root.querySelector('.ui-as-crm__tab[aria-current="page"]')?.textContent,
    },
  ],
};
