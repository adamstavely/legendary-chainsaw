import type { ContractSpec } from "../../contract.test";

const VALUES: Record<string, string> = { Europe: "europe", Oceania: "oceania" };

export const spec: ContractSpec = {
  component: "WorldMap",
  props: { onContinentChange: () => {} },
  controlled: [
    {
      prop: "continent",
      values: ["europe", "oceania"],
      read: (root) => VALUES[root.querySelector(".ui-wm-trigger span")!.textContent!],
    },
  ],
};
