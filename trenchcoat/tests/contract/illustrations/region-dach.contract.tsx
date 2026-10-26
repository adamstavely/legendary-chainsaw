import type { ContractSpec } from "../../contract.test";

const VALUES: Record<string, string> = { DACH: "dach", Japan: "jp" };

export const spec: ContractSpec = {
  component: "RegionDach",
  props: { onRegionChange: () => {} },
  controlled: [
    {
      prop: "region",
      values: ["dach", "jp"],
      read: (root) => VALUES[root.querySelector(".ui-rd-trigger span")!.textContent!],
    },
  ],
};
