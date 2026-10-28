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
// The block is <tc-kpi-board> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an
// element's properties, so controlled `range` and `segment` are checked in a real browser (tests/elements/kpi-board.test.ts)
export const spec: ContractSpec = {
  root: "tc-kpi-board",
  component: "KpiBoard",
  props: { data: { "7d": set(1), "30d": set(2) }, ranges, segments },
  ref: "root",
};
