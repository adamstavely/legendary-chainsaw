import type { ContractSpec } from "../contract.test";

const one = [{ id: "sys", label: "System prompt", tokens: 2000, locked: true }];
const two = [...one, { id: "chat", label: "Conversation", tokens: 40000 }];

// The root is the role="group" <div>. `parts` stays the source of truth: new parts show as soon as they're passed
export const spec: ContractSpec = {
  component: "ContextWindow",
  props: { parts: one, limit: 128000 },
  controlled: [
    {
      prop: "parts",
      values: [one, two],
      read: (root) => (root.querySelectorAll(".ui-cw__part").length === 1 ? one : two),
    },
  ],
};
