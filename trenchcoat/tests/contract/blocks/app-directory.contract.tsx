import type { ContractSpec } from "../../contract.test";

const app = (id: string, name: string) => ({ id, name, vendor: "Acme", description: "", categories: ["all"], logo: null, essential: true });
const apps = [app("slack", "Slack"), app("notion", "Notion")];

export const spec: ContractSpec = {
  component: "AppDirectory",
  props: { apps },
  root: ".ui-adir",
  ref: "root",
  controlled: [
    {
      prop: "connected",
      values: [["slack"], ["slack", "notion"]],
      read: (root) =>
        [...root.querySelectorAll(".ui-adir__app[data-connected]")].map((li) => apps.find((a) => a.name === li.querySelector(".ui-adir__name")?.textContent)?.id),
    },
  ],
};
