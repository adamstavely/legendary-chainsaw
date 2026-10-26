import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "PricingPlans",
  props: {},
  root: ".ui-pp",
  ref: "root",
  controlled: [
    {
      prop: "billing",
      values: ["monthly", "yearly"],
      read: (root) => root.querySelector(".ui-pp__switch")?.getAttribute("data-billing"),
    },
  ],
};
