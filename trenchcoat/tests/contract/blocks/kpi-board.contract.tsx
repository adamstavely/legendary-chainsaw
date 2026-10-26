import type { ContractSpec } from "../../contract.test";

const set = (scale: number) => {
  const labels = ["1 Oct", "2 Oct", "3 Oct"];
  const values = [3, 5, 4].map((v) => v * scale);
  return {
    stats: [{ id: "revenue", label: "Revenue", labels, values, previous: 10 }],
    overview: { title: "Gross volume", labels, current: values, previous: [2, 4, 3], segments: { pro: { current: values, previous: values } } },
    focus: { title: "Pro plan", metric: "Sales", labels, values, previous: 9 },
  };
};
const ranges = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];
const segments = [
  { id: "all", label: "All plans" },
  { id: "pro", label: "Pro" },
];
const picked = (root: HTMLElement, label: string) =>
  root.querySelector(`[role="combobox"][aria-label="${label}"]`)?.textContent;

export const spec: ContractSpec = {
  component: "KpiBoard",
  props: { data: { "7d": set(1), "30d": set(2) }, ranges, segments },
  ref: "root",
  controlled: [
    { prop: "range", values: ["7d", "30d"], read: (root) => ranges.find((r) => r.label === picked(root, "Date range"))?.id },
    { prop: "segment", values: ["all", "pro"], read: (root) => segments.find((s) => s.label === picked(root, "Segment"))?.id },
  ],
};
