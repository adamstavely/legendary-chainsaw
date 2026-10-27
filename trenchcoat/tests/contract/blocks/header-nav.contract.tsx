import type { ContractSpec } from "../../contract.test";

const user = { name: "Ada Lovelace", email: "ada@example.com" };

export const spec: ContractSpec = {
  component: "HeaderNav",
  props: { user, notifications: { items: [] }, apps: { apps: [{ id: "mail", name: "Mail", href: "#mail" }] } },
  ref: "root",
  controlled: [
    {
      prop: "open",
      values: ["account", null],
      read: (root) => (root.querySelector(".ui-hn__me")?.getAttribute("aria-expanded") === "true" ? "account" : null),
    },
  ],
};
