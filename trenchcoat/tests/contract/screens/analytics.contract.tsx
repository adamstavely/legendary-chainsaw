import type { ContractSpec } from "../../contract.test";

const periods: Record<string, string> = { "Last 7 days": "7d", "Last 30 days": "30d", "Last 90 days": "90d" };

// The screen sits in the App Shell: className, DOM props and ref reach the shell's root
export const spec: ContractSpec = {
  component: "AnalyticsScreen",
  props: { onPeriodChange: () => {} },
  ref: "root",
  controlled: [{ prop: "period", values: ["7d", "30d"], read: (root) => periods[root.querySelector(".ui-as-rev__period")?.textContent ?? ""] }],
};
