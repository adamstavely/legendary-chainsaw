import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "OnboardingScreen",
  props: {},
  controlled: [
    {
      prop: "step",
      values: [2, 4],
      read: (root) => Number(/Step (\d)/.exec(root.querySelector(".ui-ob-kicker")?.textContent ?? "")?.[1]),
    },
  ],
};
