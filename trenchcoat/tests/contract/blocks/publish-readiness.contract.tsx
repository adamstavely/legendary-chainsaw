import type { ContractSpec } from "../../contract.test";

const checks = [
  { id: "spec", label: "Spec is valid", state: "passed" },
  { id: "owner", label: "Owner signs off", state: "manual" },
  { id: "lead", label: "Lead signs off", state: "manual" },
];

export const spec: ContractSpec = {
  component: "PublishReadiness",
  props: { subject: "Digest", checks },
  ref: "root",
  controlled: [
    {
      prop: "confirmed",
      values: [["owner"], ["owner", "lead"]],
      read: (root) => {
        const passed = Number(root.querySelector(".ui-prd__count b")?.textContent);
        return passed === 2 ? ["owner"] : passed === 3 ? ["owner", "lead"] : [];
      },
    },
  ],
};
