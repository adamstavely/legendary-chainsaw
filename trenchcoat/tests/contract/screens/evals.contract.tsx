import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "EvalsScreen",
  props: {},
  controlled: [
    {
      prop: "version",
      values: ["v12", "v9"],
      read: (root) => root.querySelector(".ui-ev__chip--btn")?.firstChild?.textContent,
    },
  ],
};
