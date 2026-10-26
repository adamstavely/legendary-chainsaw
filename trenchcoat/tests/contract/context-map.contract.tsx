import type { ContractSpec } from "../contract.test";

const blocks = [
  { id: "sys", label: "System prompt", kind: "system", tokens: 4000 },
  { id: "chat", label: "Chat", kind: "chat", tokens: 12000 },
];
const agents = [
  { id: "a", name: "Checkout fixer", limit: 200000 },
  { id: "b", name: "Docs writer", limit: 500000 },
];
const compaction = { before: blocks, summarized: ["chat"] };

// The root is the outer <div>; the agent shows as the menu button's name, the view as the pressed Before/After button
export const spec: ContractSpec = {
  component: "ContextMap",
  props: { blocks, limit: 200000, agents, compaction },
  controlled: [
    { prop: "agent", values: ["a", "b"], read: (root) => (root.querySelector(".ui-cxm__agent .ui-cxm__model")!.textContent === "Checkout fixer" ? "a" : "b") },
    { prop: "view", values: ["before", "after"], read: (root) => root.querySelector('.ui-cxm__compare [aria-pressed="true"]')!.textContent!.toLowerCase() },
  ],
};
