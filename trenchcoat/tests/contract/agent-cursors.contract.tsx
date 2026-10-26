import type { ContractSpec } from "../contract.test";

const agents = [
  { id: "ada", name: "Ada" },
  { id: "bo", name: "Bo" },
];

export const spec: ContractSpec = {
  component: "AgentCursors",
  props: {
    agents,
    blocks: [{ id: "p1", text: "Hello" }],
    cursors: { ada: { block: "p1", at: 0 }, bo: { block: "p1", at: 2 } },
    tabs: [
      { id: "doc", label: "Document" },
      { id: "table", label: "Table" },
    ],
  },
  ref: "root",
  controlled: [
    {
      prop: "tab",
      values: ["doc", "table"],
      read: (root) => root.querySelector('[role="tab"][aria-selected="true"]')?.textContent === "Document" ? "doc" : "table",
    },
    {
      prop: "following",
      values: ["ada", "bo"],
      read: (root) => root.getAttribute("data-following"),
    },
  ],
};
