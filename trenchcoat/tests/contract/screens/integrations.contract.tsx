import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "IntegrationsScreen",
  props: {},
  controlled: [
    {
      prop: "connected",
      values: [["slack"], ["notion", "github"]],
      read: (root) =>
        [...root.querySelectorAll('.ui-as-int-add[data-state="on"]')].map((b) =>
          b.closest(".ui-as-int-row")?.querySelector(".ui-as-int-row__name")?.textContent?.toLowerCase(),
        ),
    },
  ],
};
