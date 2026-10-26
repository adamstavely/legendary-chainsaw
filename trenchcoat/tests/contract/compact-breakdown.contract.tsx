import type { ContractSpec } from "../contract.test";

const periods = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
];
const ids: Record<string, string> = { "7 days": "7d", "30 days": "30d" };

export const spec: ContractSpec = {
  component: "CompactBreakdown",
  props: { items: [{ label: "Search", value: 40 }, { label: "Direct", value: 20 }], periods },
  ref: "root",
  controlled: [{ prop: "period", values: ["7d", "30d"], read: (root) => ids[root.querySelector('[role="radio"][aria-checked="true"]')?.textContent ?? ""] }],
};
