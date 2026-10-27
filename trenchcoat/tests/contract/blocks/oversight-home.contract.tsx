import type { ContractSpec } from "../../contract.test";

const role = (id: string, headline: string) => ({ id, label: id, headline, kpis: [], services: [] });
const roles = [role("reviewer", "Five to review."), role("lead", "Two paused.")];

export const spec: ContractSpec = {
  component: "OversightHome",
  props: { roles },
  ref: "root",
  controlled: [
    {
      prop: "role",
      values: ["reviewer", "lead"],
      read: (root) => roles.find((r) => r.headline === root.querySelector(".ui-ovh__headline")?.textContent)?.id,
    },
  ],
};
