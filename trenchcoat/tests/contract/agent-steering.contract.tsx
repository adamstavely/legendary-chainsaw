import type { ContractSpec } from "../contract.test";

export const spec: ContractSpec = {
  component: "AgentSteering",
  props: { title: "Migrate users", steps: [{ id: "s1", title: "Read schema", status: "active" }], queue: [] },
  ref: "root",
  controlled: [{ prop: "draft", values: ["first", "second"], read: (root) => root.querySelector("textarea")?.value }],
};
